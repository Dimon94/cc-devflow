const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('cc-simplify confirmed smell gate', () => {
  test('simplification edits only confirmed smells and reports speculative cleanup', () => {
    const capabilityMap = read('docs/agent-rules-books-skill-capability-map.md');
    const skill = read('.claude/skills/cc-simplify/SKILL.md');

    expect(capabilityMap).toContain('| `cc-simplify` |');
    expect(capabilityMap).toContain('confirmed smell');
    expect(capabilityMap).toContain('speculative cleanup candidate is reported but not edited');
    expect(capabilityMap).toContain('confirmed duplicated branch is simplified and rechecked');

    expect(skill).toContain('## Confirmed Smell Gate');
    expect(skill).toContain('Speculative cleanup candidates are reported, not edited');
    expect(skill).toContain('A confirmed smell needs code fact, usage fact, requirement fact, and verification fact');
    expect(skill).toContain('confirmed duplicated branch');
    expect(skill).toContain('rechecked with fresh verification');
  });
});
