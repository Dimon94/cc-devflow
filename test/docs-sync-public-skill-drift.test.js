const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('docs-sync public skill drift gate', () => {
  test('public skill diffs require version changelog and docs drift scan', () => {
    const capabilityMap = read('docs/agent-rules-books-skill-capability-map.md');
    const syncContract = read('.claude/skills/docs-sync/references/sync-contract.md');

    expect(capabilityMap).toContain('| `docs-sync` |');
    expect(capabilityMap).toContain('version drift');
    expect(capabilityMap).toContain('public contract');
    expect(capabilityMap).toContain('Diff fixture touching a public skill requires version/changelog/docs drift scan');

    expect(syncContract).toContain('## Public Skill Drift Gate');
    expect(syncContract).toContain('A public skill diff must scan version, changelog, public docs, and migration-note drift');
    expect(syncContract).toContain('old skill versions');
    expect(syncContract).toContain('stale public workflow text');
    expect(syncContract).toContain('missing migration note');
  });
});
