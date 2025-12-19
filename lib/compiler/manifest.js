/**
 * T039: Manifest Module
 *
 * 管理编译清单:
 * - hashContent(): 计算 SHA-256 哈希
 * - loadManifest() / saveManifest(): 持久化
 * - needsRecompile(): 增量编译判断
 * - addEntry(): 添加/更新条目
 * - checkDrift(): 漂移检测
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MANIFEST_PATH = 'devflow/.generated/manifest.json';

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
  return {
    source,
    target,
    hash: sourceHash,
    timestamp: new Date().toISOString(),
    platform
  };
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

  const entry = manifest.entries.find(e => e.source === sourcePath && e.platform === platform);
  if (!entry) {
    return true;
  }

  return entry.hash !== sourceHash;
}

// ============================================================
// addEntry - 添加或更新条目
// ============================================================
function addEntry(manifest, entry) {
  const existingIndex = manifest.entries.findIndex(e => e.source === entry.source && e.platform === entry.platform);

  if (existingIndex >= 0) {
    manifest.entries[existingIndex] = entry;
  } else {
    manifest.entries.push(entry);
  }
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
// createManifest - 创建新的空 manifest
// ============================================================
function createManifest() {
  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    entries: []
  };
}

module.exports = {
  MANIFEST_PATH,
  hashContent,
  createEntry,
  loadManifest,
  saveManifest,
  needsRecompile,
  addEntry,
  checkDrift,
  createManifest
};
