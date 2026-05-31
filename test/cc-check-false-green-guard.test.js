const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('cc-check false-green guard', () => {
  test('verification contract rejects green evidence that does not prove behavior', () => {
    const capabilityMap = read('docs/agent-rules-books-skill-capability-map.md');
    const gateContract = read('.claude/skills/cc-check/references/gate-contract.md');

    expect(capabilityMap).toContain('| `cc-check` |');
    expect(capabilityMap).toContain('false green');
    expect(capabilityMap).toContain('.claude/skills/cc-check/references/gate-contract.md');

    expect(gateContract).toContain('## False Green Guard');
    expect(gateContract).toContain('green command output is not enough for pass');
    expect(gateContract).toContain('route to `cc-do` for a better test');
    expect(gateContract).toContain('route to `cc-plan` when the planned seam is wrong');
  });
});
