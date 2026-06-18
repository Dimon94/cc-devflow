---
name: cc-check
version: 1.18.1
description: Use when a planned change or frozen task needs fresh verification evidence and an honest pass/fail/blocked verdict before cc-act.
triggers:
  - 验收这个需求
  - 帮我确认是否完成
  - 跑一下质量门
  - check this requirement
  - verify with evidence
  - can this ship
  - 是不是可以进 cc-act
reads:
  - PLAYBOOK.md
  - references/gate-contract.md
  - references/review-contract.md
  - references/git-commit-guidelines.md
  - ../cc-review/SKILL.md
  - ../cc-dev/references/codex-thread-orchestration.md
  - ../cc-dev/scripts/resolve-cc-devflow.sh
  - references/checklist-contract.md
  - ../task-contract/SKILL.md
writes:
  - path: current response
    durability: ephemeral
    required: true
  - path: devflow/changes/<change-key>/task.md
    durability: durable
    required: false
    when: classifying `Failure Ledger` entries touched by this verification
  - path: Git commit
    durability: durable
    required: true
    when: verification completes a PDCA or resumed task environment stage
---

# CC-Check

## Quick Start

All paths below are relative to this `SKILL.md` directory, not the shell cwd.

1. Read `references/checklist-contract.md` and `PLAYBOOK.md`.
2. Read `task.md`, current diff, relevant code/tests, PR text when present, and fresh command output.
3. Re-run commands; do not inherit green claims from chat or `cc-do`.
4. Run `cc-review` in review subAgents against `task.md` and current diff until
   no P0/P1/P2 finding remains, or route the unresolved finding.
5. Classify reality as `pass`, `fail`, or `blocked`.
6. Map every passing claim to command, exit status, key observation, and claim proven.

## Iron Law

```text
NO PASS WITHOUT FRESH EVIDENCE
```

## Reference Loading

| Load | When |
| --- | --- |
| `references/gate-contract.md` | verdict rules, phases, false-green guard, failure ledger review, claim evidence |
| `references/review-contract.md` | diff/scope review, test quality, stale review, reroute rules |
| `references/git-commit-guidelines.md` | Check-stage commit contract |
| `../cc-review/SKILL.md` | review subAgent contract and finding severity rules before pass |
| `../cc-dev/references/codex-thread-orchestration.md` | Codex App thread tooling, model, and reasoning contract for review subAgents |
| `PLAYBOOK.md` | visible state machine, reset signals, default output, verification loop |
| `../cc-dev/scripts/resolve-cc-devflow.sh` | repository policy or change metadata must be resolved |

## Review Convergence Gate

`cc-check` owns final review convergence. A check cannot pass until review
subAgents have reviewed the frozen `task.md`, current implementation diff, and
verification surface enough to say no P0/P1/P2 finding remains.

Loop:

1. Start one or more review subAgents with a complete packet: `task.md`, current
   branch/diff, changed files, relevant commands already run, and the exact
   request to run `cc-review`. In Codex App, load
   `../cc-dev/references/codex-thread-orchestration.md` first and create each
   `cc-review` child thread with its required resources; missing or unsupported
   thread resources block the check instead of silently downgrading.
2. Aggregate all findings in the check thread. Do not downgrade a finding unless
   current source, diff, command output, or task contract evidence proves the
   downgrade.
3. Any P0/P1/P2 finding blocks `pass`. Route the owner:
   `cc-plan` for wrong scope, contract, architecture, task split, or verification
   seam; `cc-do` for implementation, test, docs, UI, logs, or PR text repairs;
   `cc-diagnose` for uncertain root cause, reproduction, or failure ownership.
4. After repair, re-read `task.md`, Git status/diff, and fresh command output,
   then run `cc-review` subAgents again.
5. Continue until no P0/P1/P2 finding remains. If the platform cannot launch
   subAgents or required evidence is unavailable, verdict is `blocked`.

P0/P1/P2 includes `critical`, `important`, explicit must-fix, blocking missing
evidence, a required reroute, or any finding that would make `cc-act` dishonest.

## Failure Ledger

When touched, classify `task.md#Failure Ledger` entries, including eligible
`cc-review` review escape candidates. Only `process-escape`, `test-escape`,
`design-escape`, and `model-pattern-escape` candidates can become
`confirmed-lesson`, `noise`, or `unresolved-risk`; ordinary findings stay out.

## Default Output

1. Verdict: exactly `pass`, `fail`, or `blocked`.
2. Evidence: command, exit status, key observation, and claim proven.
3. Review: clean, findings remain, not reviewed, or skipped with reason.
4. QA: feedback loop, test quality, and behavior evidence when applicable.
5. Diff: scope match, missing scope, or scope drift.
6. Route: `cc-act`, `cc-do`, `cc-diagnose`, `cc-plan`, or `stop`.

## Exit Criteria

- Verdict is exactly `pass`, `fail`, or `blocked`.
- Every passing statement cites fresh proof.
- Missing evidence is separated from real failure.
- Failures are owned as branch, baseline, environment, external, or unknown.
- Behavior changes and bugfixes include feedback-loop and test-quality review.
- Review subAgent convergence proves no P0/P1/P2 finding remains.
- No process file was created.
