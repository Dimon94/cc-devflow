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

  test('act must run simplify before delivery and reroute after simplify edits', () => {
    const skill = read('.claude/skills/cc-act/SKILL.md');
    const playbook = read('.claude/skills/cc-act/PLAYBOOK.md');
    const checklist = read('.claude/skills/cc-act/references/checklist-contract.md');
    const closureContract = read('.claude/skills/cc-act/references/closure-contract.md');

    expect(skill).toContain('run the `cc-simplify` gate in a real Codex child thread by default');
    expect(skill).toContain('If `cc-simplify` changed code, tests, or verification posture, route to `cc-check`');
    expect(skill).toContain('load `references/codex-thread-orchestration.md`');
    expect(skill).toContain('model `gpt-5.5`');
    expect(skill).toContain('the created thread cannot be verified on those resources');
    expect(skill).toContain('Simplify: child thread ID/report, child-to-parent handoff summary, heartbeat id/status');
    expect(skill).not.toMatch(/cc-dev(?!flow)/);

    expect(playbook).toContain('cc-act -> cc-simplify gate -> cc-check when edited');
    expect(playbook).toContain('Discover `create_thread`, `list_threads`, `read_thread`');
    expect(playbook).toContain('must request model `gpt-5.5`');
    expect(playbook).toContain('verify the actual child thread reports those resources');
    expect(playbook).toContain('assets/SIMPLIFY_CHILD_DISPATCH_PACKET.md');
    expect(playbook).toContain('create or update a 10 minute');
    expect(playbook).toContain('Agents used: no (child thread orchestration unavailable)');
    expect(playbook).toContain('do not ship with pre-simplification evidence');
    expect(playbook).not.toMatch(/cc-dev(?!flow)/);

    expect(checklist).toContain('skipped simplification');
    expect(checklist).toContain('local Codex orchestration was loaded before child dispatch');
    expect(checklist).toContain('`create_thread`, `list_threads`, `read_thread`, `send_message_to_thread`, and `automation_update`');
    expect(checklist).toContain('child thread resources were set on `create_thread` and verified after launch');
    expect(checklist).toContain('pre-act `cc-simplify` gate completed in a child thread');
    expect(checklist).toContain('child-to-parent handoff proof and heartbeat id/status');
    expect(checklist).toContain('any `cc-simplify` code, test, or verification-posture edit routed back to `cc-check`');
    expect(checklist).not.toMatch(/cc-dev(?!flow)/);

    expect(closureContract).toContain('`cc-act` loads local Codex orchestration');
    expect(closureContract).toContain('## Simplify Child Thread Guard');
    expect(closureContract).toContain('The simplify child is a Codex child thread, not a generic subagent');
    expect(closureContract).toContain('set model `gpt-5.5` and the selected reasoning effort on the');
    expect(closureContract).toContain('resource proof');
    expect(closureContract).toContain('10 minute heartbeat with `automation_update`');
    expect(closureContract).toContain('`cc-simplify` changes code, tests, or verification posture, return to `cc-check`');
    expect(closureContract).not.toMatch(/cc-dev(?!flow)/);
  });
});
