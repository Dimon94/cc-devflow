# CC-Investigate Playbook

## State Machine

`cc-investigate -> cc-do -> cc-check`

- Enter when root cause is unknown.
- Stay until `task.md#Root Cause Contract` is evidence-backed.
- Exit after the Investigate commit exists.

## Rules

1. Reproduce before guessing.
2. Prove first bad state before naming root cause.
3. Write only `task.md`; Git records the stage.
4. No JSON state, debug diary, status file, resume file, review ledger, or principles file.
5. Reroute instead of mixing feature planning into bug investigation.

## Investigation Modes

- `reproduce-first`
- `diff-trace`
- `boundary-probe`
- `backward-trace`
- `condition-wait`
- `reference-compare`
- `workflow-forensics`
- `diagnose-only`

## Exit

`task.md` must tell `cc-do` what to fix, what not to touch, and what command proves the repair. Commit the Investigate stage before handing off.
