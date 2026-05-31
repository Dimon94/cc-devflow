const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('cc-pr-review hardening contract', () => {
  test('remote PR review carries hardening and productization facets', () => {
    const skill = read('.claude/skills/cc-pr-review/SKILL.md');

    expect(skill).toContain('version: 1.7.1');
    expect(skill).toContain('../cc-review/references/hardening-specialists.md');
    expect(skill).toContain('../cc-review/references/productization-surfaces.md');
    expect(skill).toContain('security-hardening');
    expect(skill).toContain('observability-hardening');
    expect(skill).toContain('release-readiness-hardening');
    expect(skill).toContain('test-strategy-hardening');
    expect(skill).toContain('Productization surface');
    expect(skill).toContain('checked');
    expect(skill).toContain('skipped:<reason>');
    expect(skill).toContain('blocked:<missing evidence>');
    expect(skill).toContain('reviewed surface');
    expect(skill).toContain('risk gate');
    expect(skill).toContain('proof path');
    expect(skill).toContain('residual risk');
  });

  test('PR checklist and playbook gate production-risk facets before landing', () => {
    const checklist = read('.claude/skills/cc-pr-review/references/checklist-contract.md');
    const playbook = read('.claude/skills/cc-pr-review/PLAYBOOK.md');

    expect(checklist).toContain('hardening/productization facets are selected');
    expect(checklist).toContain('production risk or product control surfaces');
    expect(playbook).toContain('Hardening/productization facet coverage');
    expect(playbook).toContain('auth、secret、输入、telemetry、release、测试信任或产品控制面');
  });
});
