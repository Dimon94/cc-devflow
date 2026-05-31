const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('cc-act delivery release gate', () => {
  test('closeout contract refuses ambiguous delivery and reasonless release gates', () => {
    const capabilityMap = read('docs/agent-rules-books-skill-capability-map.md');
    const closureContract = read('.claude/skills/cc-act/references/closure-contract.md');

    expect(capabilityMap).toContain('| `cc-act` |');
    expect(capabilityMap).toContain('release readiness');
    expect(capabilityMap).toContain('explicit delivery mode');
    expect(capabilityMap).toContain('.claude/skills/cc-act/references/closure-contract.md');

    expect(closureContract).toContain('## Delivery Mode And Release Gate Guard');
    expect(closureContract).toContain('Do not infer or default a delivery mode');
    expect(closureContract).toContain('Every release gate needs both a status and evidence or reason');
    expect(closureContract).toContain('skipped, blocked, and not-applicable gates need reasons');
  });
});
