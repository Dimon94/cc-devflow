const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('review escape Failure Ledger contract', () => {
  test('cc-review only writes escaped review findings to the Failure Ledger', () => {
    const skill = read('.claude/skills/cc-review/SKILL.md');

    expect(skill).toContain('Review Escape Ledger');
    expect(skill).toContain('process-escape');
    expect(skill).toContain('test-escape');
    expect(skill).toContain('design-escape');
    expect(skill).toContain('model-pattern-escape');
    expect(skill).toContain('repeatable and preventable');
    expect(skill).toContain('ordinary findings');
    expect(skill).toContain('do not enter `task.md#Failure Ledger`');
  });

  test('Failure Ledger templates carry review escape metadata fields', () => {
    const templateFiles = [
      '.claude/skills/cc-plan/assets/TASKS_TEMPLATE.md',
      'docs/examples/pdca-loop/changes/REQ-001-copy-invite-link/task.md',
      'docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/task.md',
      'docs/examples/local-handoff/changes/REQ-003-audit-log-export/task.md'
    ];

    for (const relativePath of templateFiles) {
      const body = read(relativePath);

      expect(body).toContain('| ID | Source | Trigger | Escape class | Symptom | Evidence | Attempted fix | Result | Lesson candidate | Status | Keep for postmortem |');
      expect(body).toContain('process-escape / test-escape / design-escape / model-pattern-escape');
    }
  });

  test('cc-check and cc-act keep classification and compression separate', () => {
    const checkSkill = read('.claude/skills/cc-check/SKILL.md');
    const actSkill = read('.claude/skills/cc-act/SKILL.md');

    expect(checkSkill).toContain('review escape candidates');
    expect(checkSkill).toContain('process-escape');
    expect(checkSkill).toContain('model-pattern-escape');
    expect(checkSkill).toContain('Assemble the transient Quality Gate Packet');
    expect(checkSkill).toContain('`cc-check` owns the verdict');
    expect(checkSkill).toContain('not raw output');
    expect(checkSkill).toContain('without becoming Durable Truth');
    expect(actSkill).toContain('raw `cc-review` findings');
    expect(actSkill).toContain('review escape candidates');
  });
});
