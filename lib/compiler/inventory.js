/**
 * [INPUT]: 接收 repo root 与 distributable skill 配置。
 * [OUTPUT]: 校验 managed skill inventory 与 Codex mirror inventory 是否一致。
 * [POS]: compiler/publish gate 的清单奇偶校验层，防止新增 skill 逃出配置与 mirror 管理。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const SKILL_CLASSES = new Set(['user-entry', 'chain', 'capability', 'maintenance']);
const ROUTE_FAMILIES = new Set(['main', 'bug', 'pr', 'quality', 'research', 'maintenance', 'contract', 'none']);

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

function isLocalReadTarget(readPath) {
  return (
    !readPath.includes('<') &&
    !readPath.startsWith('devflow/') &&
    (
      readPath.startsWith('./') ||
      readPath.startsWith('../') ||
      readPath.startsWith('/') ||
      readPath.includes('/') ||
      /\.[a-z0-9]+$/i.test(readPath)
    )
  );
}

function readTargetExists(root, skillDir, readPath) {
  return [
    path.join(skillDir, readPath),
    path.join(root, readPath)
  ].some((target) => fs.existsSync(target));
}

function validateSkillSuiteGraph({
  root,
  publicSkills = []
}) {
  const errors = [];
  const sourceSkills = listSkillDirs(root, '.claude/skills');
  const knownTargets = new Set([...sourceSkills, 'stop']);
  const publicSet = new Set(publicSkills);

  for (const skillName of sourceSkills) {
    const skillDir = path.join(root, '.claude/skills', skillName);
    const relSkillPath = `.claude/skills/${skillName}/SKILL.md`;
    const skillPath = path.join(root, relSkillPath);
    const parsed = matter(fs.readFileSync(skillPath, 'utf8'));
    const skillClass = parsed.data.skill_class;
    const routeFamily = parsed.data.route_family;

    if (!skillClass) {
      errors.push(`${relSkillPath} missing skill_class`);
    } else if (!SKILL_CLASSES.has(skillClass)) {
      errors.push(`${relSkillPath} invalid skill_class: ${skillClass}`);
    }

    if (!routeFamily) {
      errors.push(`${relSkillPath} missing route_family`);
    } else if (!ROUTE_FAMILIES.has(routeFamily)) {
      errors.push(`${relSkillPath} invalid route_family: ${routeFamily}`);
    }

    if (skillClass === 'chain' && Array.isArray(parsed.data.triggers) && parsed.data.triggers.length > 0) {
      errors.push(`${relSkillPath} chain skill must not define triggers`);
    }

    if (skillClass === 'maintenance' && publicSet.has(skillName)) {
      errors.push(`${relSkillPath} maintenance skill must not be public`);
    }

    for (const readPath of Array.isArray(parsed.data.reads) ? parsed.data.reads : []) {
      const normalized = String(readPath || '').trim();
      if (!normalized || !isLocalReadTarget(normalized)) {
        continue;
      }

      if (!readTargetExists(root, skillDir, normalized)) {
        errors.push(`${relSkillPath} missing read target: ${normalized}`);
      }
    }

    for (const reroute of Array.isArray(parsed.data.reroutes) ? parsed.data.reroutes : []) {
      const target = String(reroute?.target || '').trim();
      if (target && !knownTargets.has(target)) {
        errors.push(`${relSkillPath} unknown reroute target: ${target}`);
      }
    }
  }

  return errors;
}

module.exports = {
  listSkillDirs,
  validateSkillInventory,
  validateSkillSuiteGraph
};
