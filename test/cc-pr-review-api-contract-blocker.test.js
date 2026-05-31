const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('cc-pr-review API contract blocker', () => {
  test('remote PR review blocks changed API contracts without proof tests', () => {
    const capabilityMap = read('docs/agent-rules-books-skill-capability-map.md');
    const playbook = read('.claude/skills/cc-pr-review/PLAYBOOK.md');

    expect(capabilityMap).toContain('| `cc-pr-review` |');
    expect(capabilityMap).toContain('changed API but no tests');
    expect(capabilityMap).toContain('landing blocker');
    expect(capabilityMap).toContain('exact evidence');

    expect(playbook).toContain('## API Contract Landing Blocker');
    expect(playbook).toContain('Changed public API contracts without proof tests are landing blockers');
    expect(playbook).toContain('cite the PR diff hunk');
    expect(playbook).toContain('missing contract, regression, or caller proof');
    expect(playbook).toContain('route to `cc-dev` or `cc-do`');
  });
});
