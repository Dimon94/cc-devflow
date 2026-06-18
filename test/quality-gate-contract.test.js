const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');
const SKILL_PATH = '.claude/skills/quality-gate-contract/SKILL.md';
const QUALITY_READERS = ['cc-review', 'cc-check', 'cc-simplify', 'cc-act'];

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function readSkill(relativePath) {
  return matter(readText(relativePath));
}

describe('quality-gate-contract Chain Skill contract', () => {
  test('source skill defines shared quality semantics only', () => {
    const skill = readSkill(SKILL_PATH);
    const body = skill.content;

    expect(skill.data.name).toBe('quality-gate-contract');
    expect(skill.data.description).toMatch(/Chain Skill/i);
    expect(skill.data).not.toHaveProperty('triggers');

    for (const required of [
      /review severity/i,
      /advisory/i,
      /pass, fail, and blocked/i,
      /confirmed smell/i,
      /review escape/i,
      /Failure Ledger/i,
      /postmortem input/i,
      /cc-act closeout input/i,
      /cc-simplify/i
    ]) {
      expect(body).toMatch(required);
    }

    for (const nonOverlap of [
      /task-contract/i,
      /workflow-chain-contract/i,
      /execution-environment-contract/i,
      /skill-authoring-gate/i,
      /full reviewer swarm/i,
      /productization surface/i,
      /detailed test-layer taxonomy/i
    ]) {
      expect(body).toMatch(nonOverlap);
    }
  });

  test('quality gate readers consume the shared chain contract', () => {
    for (const skillName of QUALITY_READERS) {
      const skill = readSkill(`.claude/skills/${skillName}/SKILL.md`);

      expect(skill.data.reads).toContain('../quality-gate-contract/SKILL.md');
    }
  });
});
