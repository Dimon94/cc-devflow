/**
 * T041: Skill Discovery Utility
 *
 * [INPUT]: .claude/skills/ 目录
 * [OUTPUT]: SkillEntry[] (name, skillDir, skillMdPath)
 * [POS]: Skills 扫描工具，统一发现分组与非分组 Skill
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * 规则:
 * - 递归扫描所有子目录
 * - 目录内存在 SKILL.md 即判定为 Skill
 * - 跳过以下划线开头的目录（例如 _reference-implementations）
 * - 扫描结果按 skillMdPath 排序，保证输出稳定
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// discoverSkillEntries - 递归扫描 Skill 目录
// ============================================================
function discoverSkillEntries(skillsDir) {
  const absoluteDir = path.resolve(skillsDir);

  if (!fs.existsSync(absoluteDir)) {
    return [];
  }

  const entries = [];
  walkSkillDirs(absoluteDir, entries);

  // 保证输出稳定，避免不同文件系统顺序差异
  entries.sort((a, b) => a.skillMdPath.localeCompare(b.skillMdPath));
  return entries;
}

// ============================================================
// walkSkillDirs - 深度优先扫描
// ============================================================
function walkSkillDirs(dirPath, entries) {
  const dirName = path.basename(dirPath);
  if (dirName.startsWith('_')) {
    return;
  }

  const skillMdPath = path.join(dirPath, 'SKILL.md');
  if (fs.existsSync(skillMdPath)) {
    entries.push({
      name: dirName,
      skillDir: dirPath,
      skillMdPath
    });
    return;
  }

  const children = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const child of children) {
    if (!child.isDirectory()) {
      continue;
    }

    walkSkillDirs(path.join(dirPath, child.name), entries);
  }
}

module.exports = {
  discoverSkillEntries
};
