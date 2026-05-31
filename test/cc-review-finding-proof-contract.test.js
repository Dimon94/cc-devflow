const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('cc-review finding proof contract', () => {
  test('review findings bind evidence, violated control, repair path, and no process file', () => {
    const capabilityMap = read('docs/agent-rules-books-skill-capability-map.md');
    const reviewMethods = read('.claude/skills/cc-review/references/review-methods.md');

    expect(capabilityMap).toContain('| `cc-review` |');
    expect(capabilityMap).toContain('violated control');
    expect(capabilityMap).toContain('repair option');
    expect(capabilityMap).toContain('no local report file');

    expect(reviewMethods).toContain('## Finding Proof Contract');
    expect(reviewMethods).toContain('A finding is not valid until it names source evidence');
    expect(reviewMethods).toContain('violated control');
    expect(reviewMethods).toContain('repair option or route');
    expect(reviewMethods).toContain('Do not create local review report files');
  });
});
