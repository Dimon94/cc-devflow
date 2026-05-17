# Implementation Review Branch

Use this reference when the review target is code, tests, docs, UI behavior, or a current branch diff.

## Intake

Read, in order:

1. current branch and base branch
2. `git diff <base>...HEAD --stat`
3. full diff for changed files
4. `task.md`
5. changed code plus direct importers/callers for enum, state, API, and behavior changes
6. fresh command output when available

If no plan exists, infer intent from user request, commits, TODOs, and PR body if present. Mark intent confidence.

## Scope Check

Produce this in scratch reasoning before findings:

```text
Scope Check: CLEAN | DRIFT DETECTED | REQUIREMENTS MISSING
Intent: ...
Delivered: ...
Diff surface: ...
```

Out-of-scope files are findings only when they change behavior or expand blast radius.

## Diff Review Passes

Turn these passes into review nodes before reporting findings. Every changed file, public behavior, test surface, documentation surface, and UI/runtime flow belongs to a node or has a skip reason.

For broad or PR-landing diffs, use the risk-lane profile from `review-methods.md` before final findings:

1. Intent and regression
2. Security and privacy
3. Performance and reliability
4. Contracts and coverage

### Contract Fidelity

Check whether implementation matches `task.md` or investigation:

- required tasks done
- rejected scope not implemented
- root cause still true
- expected spec delta honored
- behavior visible at public seam

### Code Smell Scan

Use `review-methods.md` smell taxonomy.

Look for:

- copy-paste helper logic
- broad catch-all errors
- parameter clumps
- shallow pass-through modules
- internal mocks driving production design
- new branch forests where a data shape would collapse cases
- hidden state or multiple truth sources
- cycles between modules

### Structural Risk

Check:

- security and trust boundaries
- enum/value completeness outside the diff
- migrations and rollback
- concurrency and double-submit
- external service failures
- logs/metrics for new paths

### Test Quality

Build a coverage map:

```text
CODE PATHS                         USER/RUNTIME FLOWS
file.ts                            feature flow
├── [tested] happy                 ├── [tested] main path
├── [gap] empty                    ├── [gap] double action
└── [gap] upstream error           └── [gap] navigate away / timeout
```

Flag:

- no regression test for changed behavior
- tests only assert implementation shape
- tests mock internal modules instead of public seam
- fixture lies with missing fields or type casts
- no UI/E2E proof for user-visible change

### Documentation and DX

If changed behavior affects README, guides, CLI help, package install, public API, agent skill usage, or examples, check whether docs changed too.

## Fix Policy

Findings stay in the response. Ask which repair option to apply before editing code. Do not write process files.

Return:

- findings ordered by severity
- ASCII Branch Chain per non-trivial finding or code smell propagation
- smallest safe repair option
- broader cleanup option when the smell is real
- defer option with explicit risk
- recommendation and route
