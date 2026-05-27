const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('cc-pr-land review gate carry-forward contract', () => {
  test('landing preserves PR review production gates instead of generic approval', () => {
    const skill = read('.claude/skills/cc-pr-land/SKILL.md');

    expect(skill).toContain('version: 1.4.0');
    expect(skill).toContain('production-gate-aware');
    expect(skill).toContain('Review Gate Carry-Forward');
    expect(skill).toContain('Complexity: checked, skipped with reason, blocked, failed, or not applicable');
    expect(skill).toContain('Hardening/productization: selected facets checked');
    expect(skill).toContain('must-fix-before-release');
    expect(skill).toContain('missing facet coverage');
    expect(skill).toContain('stale coverage after a');
    expect(skill).toContain('Route missing or stale review coverage to');
    expect(skill).toContain('Gate carry-forward');
  });

  test('landing checklist blocks missing or stale production facet coverage', () => {
    const checklist = read('.claude/skills/cc-pr-land/references/checklist-contract.md');
    const playbook = read('.claude/skills/cc-pr-land/PLAYBOOK.md');

    expect(checklist).toContain('lost review-gate coverage');
    expect(checklist).toContain('review-gate coverage from `cc-pr-review` is carried forward');
    expect(checklist).toContain('blocked, failed, changes-requested, must-fix-before-release, missing, or stale facet coverage blocks landing');
    expect(playbook).toContain('review 不是一个布尔值');
    expect(playbook).toContain('production gate coverage is missing, blocked, failed, or stale');
  });
});
