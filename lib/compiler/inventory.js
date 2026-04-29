/**
 * [INPUT]: 接收 repo root 与 distributable skill 配置。
 * [OUTPUT]: 校验 managed skill inventory 与 Codex mirror inventory 是否一致。
 * [POS]: compiler/publish gate 的清单奇偶校验层，防止新增 skill 逃出配置与 mirror 管理。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const path = require('path');

function listSkillDirs(root, relativeRoot) {
  const skillsRoot = path.join(root, relativeRoot);

  if (!fs.existsSync(skillsRoot)) {
    return [];
  }

  return fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(skillsRoot, entry.name, 'SKILL.md')))
    .map((entry) => entry.name)
    .sort();
}

function missingFrom(expected, actual) {
  return expected.filter((item) => !actual.includes(item));
}

function extraFrom(actual, expected) {
  return actual.filter((item) => !expected.includes(item));
}

function validateSkillInventory({
  root,
  publicSkills = [],
  distributedSkills = [],
  internalSkills = [],
  codexSkills: expectedCodexSkills = publicSkills
}) {
  const errors = [];
  const configured = [...new Set([...distributedSkills, ...internalSkills])].sort();
  const sourceSkills = listSkillDirs(root, '.claude/skills');

  for (const skillName of missingFrom(distributedSkills, sourceSkills)) {
    errors.push(`Missing distributed skill directory: ${skillName}`);
  }

  for (const skillName of extraFrom(sourceSkills, configured)) {
    errors.push(`Unconfigured skill directory: ${skillName}`);
  }

  for (const skillName of publicSkills) {
    const playbookPath = path.join(root, '.claude/skills', skillName, 'PLAYBOOK.md');
    if (!fs.existsSync(playbookPath)) {
      errors.push(`Public skill missing PLAYBOOK.md: ${skillName}`);
    }
  }

  const codexRoot = path.join(root, '.codex/skills');
  if (fs.existsSync(codexRoot)) {
    const actualCodexSkills = listSkillDirs(root, '.codex/skills');

    for (const skillName of missingFrom(expectedCodexSkills, actualCodexSkills)) {
      errors.push(`Codex mirror missing public skill: ${skillName}`);
    }

    for (const skillName of extraFrom(actualCodexSkills, expectedCodexSkills)) {
      errors.push(`Codex mirror has unconfigured public skill: ${skillName}`);
    }
  }

  return errors;
}

module.exports = {
  listSkillDirs,
  validateSkillInventory
};
