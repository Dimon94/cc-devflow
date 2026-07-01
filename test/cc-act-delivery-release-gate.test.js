const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function compactWhitespace(text) {
  return text.replace(/\s+/g, ' ');
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
    expect(skill).toContain('host-default `create_thread` resources');
    expect(skill).toContain('created thread cannot be verified against an explicit resource request');
    expect(skill).toContain('Simplify: child thread ID/report, child-to-parent handoff summary, heartbeat id/status');
    expect(skill).not.toMatch(/cc-dev(?!flow)/);

    expect(playbook).toContain('cc-act -> cc-simplify gate -> cc-check when edited');
    expect(playbook).toContain('Discover `create_thread`, `list_threads`, `read_thread`');
    expect(playbook).toContain('uses host-default resources unless the user');
    expect(playbook).toContain('verify any explicit');
    expect(playbook).toContain('resource request against the actual child thread');
    expect(playbook).toContain('assets/SIMPLIFY_CHILD_DISPATCH_PACKET.md');
    expect(playbook).toContain('create or update a 10 minute');
    expect(playbook).toContain('Agents used: no (child thread orchestration unavailable)');
    expect(playbook).toContain('do not ship with pre-simplification evidence');
    expect(playbook).not.toMatch(/cc-dev(?!flow)/);

    expect(checklist).toContain('skipped simplification');
    expect(checklist).toContain('local Codex orchestration was loaded before child dispatch');
    expect(checklist).toContain('`create_thread`, `list_threads`, `read_thread`, `send_message_to_thread`, and `automation_update`');
    expect(checklist).toContain('child thread resources use host defaults unless the user explicitly requested a supported resource');
    expect(checklist).toContain('pre-act `cc-simplify` gate completed in a child thread');
    expect(checklist).toContain('child-to-parent handoff proof and heartbeat id/status');
    expect(checklist).toContain('any `cc-simplify` code, test, or verification-posture edit routed back to `cc-check`');
    expect(checklist).not.toMatch(/cc-dev(?!flow)/);

    expect(closureContract).toContain('`cc-act` loads local Codex orchestration');
    expect(closureContract).toContain('## Simplify Child Thread Guard');
    expect(closureContract).toContain('The simplify child is a Codex child thread, not a generic subagent');
    expect(closureContract).toContain('omit `model` and `thinking` on the `create_thread` call unless');
    expect(closureContract).toContain('explicit resource proof when applicable');
    expect(closureContract).toContain('10 minute heartbeat with `automation_update`');
    expect(closureContract).toContain('`cc-simplify` changes code, tests, or verification posture, return to `cc-check`');
    expect(closureContract).not.toMatch(/cc-dev(?!flow)/);
  });

  test('act requires a full verification gate before PR or local main delivery', () => {
    const skill = read('.claude/skills/cc-act/SKILL.md');
    const playbook = read('.claude/skills/cc-act/PLAYBOOK.md');
    const checklist = read('.claude/skills/cc-act/references/checklist-contract.md');
    const closureContract = read('.claude/skills/cc-act/references/closure-contract.md');

    expect(skill).toContain('repository full verification gate');
    expect(skill).toContain('Push, PR create/update, and local-main-merge are blocked');
    expect(skill).toContain('fix failures and rerun the full suite');

    const compactPlaybook = compactWhitespace(playbook);
    const compactClosureContract = compactWhitespace(closureContract);

    expect(compactPlaybook).toContain('run the repository-defined full test/verification suite');
    expect(compactPlaybook).toContain('before any push, PR create/update, or local-main merge');
    expect(compactPlaybook).toContain('Full-suite failures route to repair');

    expect(checklist).toContain('repository full-suite command was identified from project scripts, docs, or CI');
    expect(checklist).toContain('full-suite verification passed after the final owned commit');

    expect(closureContract).toContain('## Full Verification Gate');
    expect(compactClosureContract).toContain('Focused tests or stale `cc-check` evidence alone do not satisfy this gate');
    expect(closureContract).toContain('PR creation/update, branch push, or local-main merge');
  });
});
