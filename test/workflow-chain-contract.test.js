const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');
const SKILL_PATH = '.claude/skills/workflow-chain-contract/SKILL.md';
const WORKFLOW_READERS = ['cc-dev', 'cc-plan', 'cc-do', 'cc-check', 'cc-act'];

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function readSkill(relativePath) {
  return matter(readText(relativePath));
}

describe('workflow-chain-contract Chain Skill contract', () => {
  test('source skill defines only the shared workflow state machine', () => {
    const skill = readSkill(SKILL_PATH);
    const body = skill.content;

    expect(skill.data.name).toBe('workflow-chain-contract');
    expect(skill.data.description).toMatch(/Chain Skill/i);
    expect(skill.data).not.toHaveProperty('triggers');

    for (const required of [
      /main route/i,
      /bug route/i,
      /PR route/i,
      /reroute/i,
      /terminal states/i,
      /entry evidence/i,
      /exit evidence/i,
      /task-contract/i,
      /quality-gate-contract/i,
      /execution-environment-contract/i,
      /skill-authoring-gate/i
    ]) {
      expect(body).toMatch(required);
    }

    for (const nonGoal of [
      /task\.md\s+structure/i,
      /quality\s+gate\s+semantics/i,
      /child\s+dispatch\s+mechanics/i,
      /skill-writing\s+rules/i
    ]) {
      expect(body).toMatch(nonGoal);
    }
  });

  test('workflow stage skills read the shared chain contract', () => {
    for (const skillName of WORKFLOW_READERS) {
      const skill = readSkill(`.claude/skills/${skillName}/SKILL.md`);

      expect(skill.data.reads).toContain('../workflow-chain-contract/SKILL.md');
    }
  });
});
