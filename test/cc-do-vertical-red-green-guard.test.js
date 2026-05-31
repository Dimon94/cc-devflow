const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('cc-do vertical red-green guard', () => {
  test('execution contract blocks horizontal batches between behaviors', () => {
    const capabilityMap = read('docs/agent-rules-books-skill-capability-map.md');
    const playbook = read('.claude/skills/cc-do/PLAYBOOK.md');

    expect(capabilityMap).toContain('| `cc-do` |');
    expect(capabilityMap).toContain('Local TDD skill, Refactoring, Clean Code');
    expect(capabilityMap).toContain('.claude/skills/cc-do/references/execution-recovery.md');

    expect(playbook).toContain('## Vertical Red/Green Guard');
    expect(playbook).toContain('finish the current Red -> Green -> Refactor cycle before starting the next behavior');
    expect(playbook).toContain('Reject horizontal batches');
    expect(playbook).toContain('one observable behavior');
  });
});
