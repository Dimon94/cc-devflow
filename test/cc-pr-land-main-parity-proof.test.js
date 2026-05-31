const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('cc-pr-land main parity proof', () => {
  test('landing refuses merge without reviewed verdict and main parity command proof', () => {
    const capabilityMap = read('docs/agent-rules-books-skill-capability-map.md');
    const playbook = read('.claude/skills/cc-pr-land/PLAYBOOK.md');

    expect(capabilityMap).toContain('| `cc-pr-land` |');
    expect(capabilityMap).toContain('reviewed verdict');
    expect(capabilityMap).toContain('main parity command proof');
    expect(capabilityMap).toContain('refuses merge');

    expect(playbook).toContain('## Reviewed Verdict And Main Parity Guard');
    expect(playbook).toContain('Do not merge on implied approval');
    expect(playbook).toContain('reviewed verdict');
    expect(playbook).toContain('main parity command proof');
    expect(playbook).toContain('route to `cc-pr-review`');
  });
});
