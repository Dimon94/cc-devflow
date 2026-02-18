/**
 * T039: Manifest Module (v2.0)
 *
 * 管理编译清单:
 * - hashContent(): 计算 SHA-256 哈希
 * - loadManifest() / saveManifest(): 持久化
 * - needsRecompile(): 增量编译判断
 * - addEntry(): 添加/更新条目
 * - checkDrift(): 漂移检测
 *
 * v2.0 新增 (REQ-006):
 * - skills: 技能编译记录
 * - rulesEntry: 规则入口文件记录
 * - migrateToV2(): v1.0 → v2.0 迁移
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MANIFEST_PATH = 'devflow/.generated/manifest.json';
const MANIFEST_VERSION = '2.0';

// ============================================================
// hashContent - 计算 SHA-256 哈希
// ============================================================
function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// ============================================================
// createEntry - 创建 manifest 条目
// ============================================================
function createEntry({ source, target, sourceHash, targetHash, platform }) {
  const entry = {
    source,
    target,
    hash: targetHash || sourceHash,
    timestamp: new Date().toISOString(),
    platform
  };

  if (sourceHash) {
    entry.sourceHash = sourceHash;
  }

  return entry;
}

// ============================================================
// loadManifest - 加载现有 manifest
// ============================================================
async function loadManifest(manifestPath = MANIFEST_PATH) {
  try {
    const content = await fs.promises.readFile(manifestPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

// ============================================================
// saveManifest - 保存 manifest
// ============================================================
async function saveManifest(manifest, manifestPath = MANIFEST_PATH) {
  const dir = path.dirname(manifestPath);
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

// ============================================================
// needsRecompile - 检查是否需要重新编译
// ============================================================
function needsRecompile(sourcePath, sourceHash, manifest, platform) {
  if (!manifest || !manifest.entries) {
    return true;
  }

  const scopedEntries = manifest.entries.filter(
    entry => entry.source === sourcePath && entry.platform === platform
  );
  if (scopedEntries.length === 0) {
    return true;
  }

  // Legacy entries (v1/v2 early) stored source hash in `hash`.
  // Force one-time recompile to migrate to explicit `sourceHash`.
  if (scopedEntries.some(entry => !entry.sourceHash)) {
    return true;
  }

  return scopedEntries.some(entry => entry.sourceHash !== sourceHash);
}

// ============================================================
// addEntry - 添加或更新条目
// ============================================================
function addEntry(manifest, entry) {
  const existingIndex = manifest.entries.findIndex(
    e => e.source === entry.source && e.platform === entry.platform && e.target === entry.target
  );

  if (existingIndex >= 0) {
    manifest.entries[existingIndex] = entry;
  } else {
    manifest.entries.push(entry);
  }
}

// ============================================================
// pruneCommandEntries - 清理已删除命令文件对应的旧条目
// ============================================================
function pruneCommandEntries(manifest, options = {}) {
  if (!manifest || !Array.isArray(manifest.entries) || manifest.entries.length === 0) {
    return 0;
  }

  const {
    sourcePrefix = '.claude/commands',
    activeSources = new Set(),
    platforms = null
  } = options;

  const normalizePath = (value) => String(value || '').replace(/\\/g, '/');
  const normalizedPrefix = normalizePath(sourcePrefix).replace(/\/+$/, '');
  const normalizedActiveSources = new Set(
    Array.from(activeSources).map(source => normalizePath(source))
  );
  const platformSet = Array.isArray(platforms) ? new Set(platforms) : null;

  let removed = 0;
  manifest.entries = manifest.entries.filter(entry => {
    if (platformSet && !platformSet.has(entry.platform)) {
      return true;
    }

    const source = normalizePath(entry.source);
    const inScope = source === normalizedPrefix || source.startsWith(`${normalizedPrefix}/`);

    if (!inScope) {
      return true;
    }

    if (normalizedActiveSources.has(source)) {
      return true;
    }

    removed += 1;
    return false;
  });

  return removed;
}

// ============================================================
// checkDrift - 检查漂移（目标文件被手动修改）
// ============================================================
async function checkDrift(manifest) {
  const driftReport = [];

  if (!manifest || !manifest.entries) {
    return driftReport;
  }

  for (const entry of manifest.entries) {
    try {
      // 读取目标文件当前内容
      const targetContent = await fs.promises.readFile(entry.target, 'utf8');
      const targetCurrentHash = hashContent(targetContent);

      // 漂移检测：比较目标文件当前哈希与 manifest 记录的哈希
      // 如果不一致，说明目标文件被手动修改了
      if (targetCurrentHash !== entry.hash) {
        driftReport.push({
          source: entry.source,
          target: entry.target,
          issue: 'target file modified since last compile'
        });
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        driftReport.push({
          source: entry.source,
          target: entry.target,
          issue: 'target file missing'
        });
      }
    }
  }

  return driftReport;
}

// ============================================================
// createManifest - 创建新的空 manifest (v2.0)
// ============================================================
function createManifest() {
  return {
    version: MANIFEST_VERSION,
    generatedAt: new Date().toISOString(),
    entries: [],
    skills: [],
    rulesEntry: {}
  };
}

// ============================================================
// migrateToV2 - 从 v1.0 迁移到 v2.0
// ============================================================
function migrateToV2(manifest) {
  if (!manifest) {
    return createManifest();
  }

  // 已是 v2.0
  if (manifest.version === '2.0' || manifest.version === MANIFEST_VERSION) {
    return manifest;
  }

  // v1.0 → v2.0 迁移
  return {
    version: MANIFEST_VERSION,
    generatedAt: manifest.generatedAt || new Date().toISOString(),
    entries: manifest.entries || [],
    skills: [],
    rulesEntry: {}
  };
}

// ============================================================
// addSkillEntry - 添加或更新技能记录
// ============================================================
function addSkillEntry(manifest, skillEntry) {
  if (!manifest.skills) {
    manifest.skills = [];
  }

  const existingIndex = manifest.skills.findIndex(s => s.name === skillEntry.name);

  if (existingIndex >= 0) {
    manifest.skills[existingIndex] = skillEntry;
  } else {
    manifest.skills.push(skillEntry);
  }
}

// ============================================================
// addRulesEntry - 添加或更新规则入口文件记录
// ============================================================
function addRulesEntry(manifest, platform, rulesEntry) {
  if (!manifest.rulesEntry) {
    manifest.rulesEntry = {};
  }

  manifest.rulesEntry[platform] = rulesEntry;
}

// ============================================================
// needsSkillRecompile - 检查技能是否需要重新编译
// ============================================================
function needsSkillRecompile(skillName, sourceHash, manifest) {
  if (!manifest || !manifest.skills) {
    return true;
  }

  const entry = manifest.skills.find(s => s.name === skillName);
  if (!entry) {
    return true;
  }

  return entry.sourceHash !== sourceHash;
}

// ============================================================
// needsRulesRecompile - 检查规则入口是否需要重新编译
// ============================================================
function needsRulesRecompile(platform, sourceHash, manifest) {
  if (!manifest || !manifest.rulesEntry || !manifest.rulesEntry[platform]) {
    return true;
  }

  return manifest.rulesEntry[platform].hash !== sourceHash;
}

module.exports = {
  MANIFEST_PATH,
  MANIFEST_VERSION,
  hashContent,
  createEntry,
  loadManifest,
  saveManifest,
  needsRecompile,
  addEntry,
  checkDrift,
  createManifest,
  migrateToV2,
  addSkillEntry,
  addRulesEntry,
  pruneCommandEntries,
  needsSkillRecompile,
  needsRulesRecompile
};
