const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');
const SKILL_PATH = '.claude/skills/execution-environment-contract/SKILL.md';
const PARALLEL_REF = '.claude/skills/cc-dev/references/parallel-orchestration.md';
const PARALLEL_READERS = ['cc-dev', 'cc-plan'];

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function readSkill(relativePath) {
  return matter(readText(relativePath));
}

describe('execution-environment-contract Chain Skill contract', () => {
  test('source skill defines parallel graph and integration semantics only', () => {
    const skill = readSkill(SKILL_PATH);
    const body = skill.content;

    expect(skill.data.name).toBe('execution-environment-contract');
    expect(skill.data.description).toMatch(/Chain Skill/i);
    expect(skill.data).not.toHaveProperty('triggers');

    for (const required of [
      /implementation environment/i,
      /review-only environment/i,
      /verification-only environment/i,
      /closeout or handoff environment/i,
      /diagnosis environment/i,
      /DependsOn/i,
      /Parallel/i,
      /Assigned task IDs/i,
      /Touches/i,
      /Mutable resources/i,
      /Verification/i,
      /CHILD DISPATCH START/i,
      /Child Final Report/i,
      /Integration Gate/i,
      /clean worktree/i,
      /touched-path audit/i,
      /focused verification/i,
      /cherry-pick/i,
      /Worktree Closeout/i,
      /task-contract/i,
      /workflow-chain-contract/i,
      /quality-gate-contract/i,
      /skill-authoring-gate/i
    ]) {
      expect(body).toMatch(required);
    }

    for (const nonGoal of [
      /does not own Codex thread tool wrappers/i,
      /heartbeat implementation/i,
      /model\s+selection/i,
      /platform UI behavior/i
    ]) {
      expect(body).toMatch(nonGoal);
    }
  });

  test('parallel orchestration readers consume the shared execution contract', () => {
    for (const skillName of PARALLEL_READERS) {
      const skill = readSkill(`.claude/skills/${skillName}/SKILL.md`);

      expect(skill.data.reads).toContain('../execution-environment-contract/SKILL.md');
    }

    expect(readText(PARALLEL_REF)).toMatch(/execution-environment-contract\/SKILL\.md/);
  });
});
