const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');
const SKILL_PATH = '.claude/skills/skill-authoring-gate/SKILL.md';

function readSkill(relativePath) {
  return matter(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

describe('skill-authoring-gate Chain Skill contract', () => {
  test('source Chain Skill exposes the authoring gate without user-entry triggers', () => {
    const skill = readSkill(SKILL_PATH);
    const body = skill.content;

    expect(skill.data.name).toBe('skill-authoring-gate');
    expect(skill.data.description).toMatch(/Chain Skill/i);
    expect(skill.data).not.toHaveProperty('triggers');

    for (const required of [
      /User Entry Skill/,
      /Chain Skill/,
      /Agent-facing internal contract language/,
      /invocation/i,
      /information hierarchy/i,
      /completion criter/i,
      /progressive disclosure/i,
      /leading words/i,
      /prun/i
    ]) {
      expect(body).toMatch(required);
    }
  });
});
