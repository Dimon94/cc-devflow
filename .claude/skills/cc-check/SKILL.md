---
name: cc-check
version: 1.17.0
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
  - ../cc-dev/scripts/resolve-cc-devflow.sh
  - references/checklist-contract.md
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
4. Classify reality as `pass`, `fail`, or `blocked`.
5. Map every passing claim to command, exit status, key observation, and claim proven.

## Iron Law

```text
NO PASS WITHOUT FRESH EVIDENCE
```

## Reference Loading

| Load | When |
| --- | --- |
| `references/gate-contract.md` | verdict rules, phases, false-green guard, failure ledger review, claim evidence |
| `references/review-contract.md` | diff/scope review, test quality, stale review, reroute rules |
| `PLAYBOOK.md` | visible state machine, reset signals, default output, verification loop |
| `../cc-dev/scripts/resolve-cc-devflow.sh` | repository policy or change metadata must be resolved |

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
- No process file was created.
