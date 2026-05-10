# Implementation Review Branch

Use this reference when the review target is code, tests, docs, UI behavior, or a current branch diff.

## Intake

Read, in order:

1. current branch and base branch
2. `git diff <base>...HEAD --stat`
3. full diff for changed files
4. `planning/design.md` or `planning/analysis.md`
5. `planning/tasks.md` and `planning/task-manifest.json`
6. changed code plus direct importers/callers for enum, state, API, and behavior changes

If no plan exists, infer intent from user request, commits, TODOs, and PR body if present. Mark intent confidence.

## Scope Check

Produce:

```text
Scope Check: CLEAN | DRIFT DETECTED | REQUIREMENTS MISSING
Intent: ...
Delivered: ...
Diff surface: ...
```

Out-of-scope files are findings only when they change behavior or expand blast radius.

## Diff Review Passes

Turn these passes into review nodes before reporting findings. Every changed file, public behavior, test surface, documentation surface, and UI/runtime flow must belong to a node or have a skip reason.

### 1. Contract Fidelity

Check whether implementation matches the frozen plan or investigation:

- required tasks done
- rejected scope not implemented
- root cause still true
- expected spec delta honored
- behavior visible at public seam

### 2. Code Smell Scan

Use `review-methods.md` smell taxonomy.

If this pass finds duplication, over-complexity, awkward abstraction, branch forests, unclear ownership, or broad architecture cleanup risk, load `cc-simplify` and record it as a selected tool in `cc-review-plan.md`.

Look for:

- copy-paste helper logic
- broad catch-all errors
- parameter clumps
- shallow pass-through modules
- internal mocks driving production design
- new branch forests where a data shape would collapse cases
- hidden state or multiple truth sources
- cycles between modules

### 3. Structural Risk

Check:

- security and trust boundaries
- enum/value completeness outside the diff
- migrations and rollback
- concurrency and double-submit
- external service failures
- logs/metrics for new paths

### 4. Test Quality

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

### 5. Documentation and DX

If changed behavior affects README, guides, CLI help, package install, public API, agent skill usage, or examples, check whether docs changed too.

## Delta Node Selection

Use git and prior review records:

1. Find changed files with `git diff <base>...HEAD --name-only`.
2. If prior `cc-review-ledger.jsonl` records a reviewed SHA, narrow to `git diff <reviewedSha>...HEAD`.
3. Group changed files by behavior surface, not just extension.
4. Add dependent nodes for direct importers/callers when a shared helper, enum, state shape, API contract, or skill contract changes.
5. Preserve prior clean nodes only when the target file and dependent contract did not change.

Example:

```text
R101 implementation.contract.skill-frontmatter
R102 implementation.smell.review-state
R103 implementation.tests.distribution
R104 implementation.docs.workflow-map
```

## Fix Policy

`cc-review` does not silently edit code. It writes findings and routes:

- mechanical local issue -> `cc-do` with direct fix recommendation
- architecture/contract issue -> `cc-plan`
- clean implementation -> `cc-check`

If the user explicitly asks to fix findings in the same turn, switch to `cc-do` behavior after writing the review report.

## Output Requirements

Add to `cc-review-report.md`:

- base branch and diff summary
- scope check
- implementation review nodes checked, skipped, or blocked
- code smell findings
- structural findings
- test and E2E coverage map
- docs/DX notes
- final route

Write `cc-review-findings.json` when there are actionable findings.
