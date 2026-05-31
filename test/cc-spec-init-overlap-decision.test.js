const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('cc-spec-init overlapping capability decision', () => {
  test('spec evolution resolves split merge deprecate and canonical vocabulary before writing', () => {
    const capabilityMap = read('docs/agent-rules-books-skill-capability-map.md');
    const specContract = read('.claude/skills/cc-spec-init/references/spec-contract.md');

    expect(capabilityMap).toContain('| `cc-spec-init` |');
    expect(capabilityMap).toContain('overlapping capability names');
    expect(capabilityMap).toContain('split/merge/deprecate decision');
    expect(capabilityMap).toContain('canonical vocabulary');

    expect(specContract).toContain('## Overlap Decision Gate');
    expect(specContract).toContain('Overlapping capability names must be resolved before writing durable spec truth');
    expect(specContract).toContain('split, merge, deprecate, or keep separate');
    expect(specContract).toContain('canonical vocabulary');
    expect(specContract).toContain('aliases to avoid');
  });
});
