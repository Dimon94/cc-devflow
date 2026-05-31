const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('cc-plan design pressure contract', () => {
  test('agent-rules capability map routes cc-plan design pressure into the plan contract', () => {
    const capabilityMap = read('docs/agent-rules-books-skill-capability-map.md');
    const planningContract = read('.claude/skills/cc-plan/references/planning-contract.md');

    expect(capabilityMap).toContain('| `cc-plan` |');
    expect(capabilityMap).toContain('APoSD, Clean Architecture, DDD Distilled');
    expect(capabilityMap).toContain('.claude/skills/cc-plan/references/planning-contract.md');

    expect(planningContract).toContain('## Design Pressure');
    expect(planningContract).toContain('deep module');
    expect(planningContract).toContain('information hiding');
    expect(planningContract).toContain('caller knowledge');
    expect(planningContract).toContain('public seam');
    expect(planningContract).toContain('vertical slice');
  });
});
