# Minimized Workflow Artifacts

This guide describes the default artifact contract for new cc-devflow changes.
The goal is simple: keep durable workflow truth readable, small, and measurable.

## Default Shape

Each new change keeps durable truth under `devflow/changes/<change-key>/`.

Default human-authored Markdown:

- `planning/tasks.md`

Default machine-owned records:

- `change-meta.json`
- `planning/task-manifest.json`
- `review/review-ledger.jsonl`
- `review/review-findings.json` when findings exist
- `execution/tasks/<task-id>/checkpoint.json`
- `review/report-card.json`
- one final handoff file under `handoff/`

Runtime scratch, worker prompts, journals, assignments, and session logs belong
under `devflow/workspaces/<change-key>/`, not beside durable change truth.

## Feature Plans

Feature and scope changes use:

- `planning/tasks.md#Contract Summary`
- `planning/task-manifest.json`
- `change-meta.json`

`Contract Summary` owns the frozen human-readable plan: user story, non-negotiable
constraints, decisions that must not be reopened, task slices, and verification
expectations. The task manifest is generated or validated by CLI tooling and owns
machine-readable task status.

## Bug Investigations

Bug, regression, and unexpected-behavior work uses:

- `planning/tasks.md#Root Cause Contract`
- `planning/task-manifest.json`
- `change-meta.json`

`Root Cause Contract` owns the symptom, reproduction evidence, confirmed cause,
rejected near-causes, repair boundary, and task handoff. `cc-do` should implement
from that frozen contract instead of reopening investigation during execution.

## Review Records

`cc-review` writes structured lifecycle events first:

- `review/review-ledger.jsonl`
- optional `review/review-findings.json`
- optional rendered Markdown from `cc-devflow review render`

Markdown review reports are for human reading when needed. They are not the
default durable review source.

Useful commands:

```bash
npx cc-devflow review start --change REQ-001 --change-key REQ-001-copy-invite-link --base-sha abc123 --head-sha def456
npx cc-devflow review record-node --change REQ-001 --change-key REQ-001-copy-invite-link --review-id <review-id> --node-id R001 --target planning/tasks.md --status checked --coverage contract --evidence-ref "cmd:npm run verify"
npx cc-devflow review add-finding --change REQ-001 --change-key REQ-001-copy-invite-link --review-id <review-id> --finding-id F001 --severity important --confidence 8 --display-tier blocking --fingerprint sha256:<hash> --scope "current change" --path planning/tasks.md --evidence "finding evidence" --recommendation "repair action" --route cc-do
npx cc-devflow review close --change REQ-001 --change-key REQ-001-copy-invite-link --review-id <review-id> --status clean --blocking-count 0 --warning-count 0 --next cc-check
npx cc-devflow review render --change REQ-001 --change-key REQ-001-copy-invite-link --review-id <review-id> --output review/review-report.md
```

## Legacy Fallback

Older changes may still contain:

- `planning/design.md`
- `planning/analysis.md`
- `review/cc-review-plan.md`
- `review/cc-review-report.md`
- `review/cc-review-agent-results.jsonl`

Those files remain readable compatibility inputs. New changes should not write
them by default. When migrating old work, fold feature-plan truth into
`planning/tasks.md#Contract Summary` and bug-investigation truth into
`planning/tasks.md#Root Cause Contract`.

## Validation Gates

Validate one change:

```bash
npx cc-devflow task-contract validate --change REQ-001 --change-key REQ-001-copy-invite-link
```

Validate the repository artifact contract:

```bash
npm run verify:artifacts
```

Measure the contract:

```bash
npm run benchmark:artifacts
```

The package-level verification command also includes artifact validation:

```bash
npm run verify
```

## Authoring Rule

Before adding a durable file under `devflow/changes/<change-key>/`, answer:

1. Which downstream skill reads it by default?
2. Which state does it own that no existing artifact owns?
3. Which command fails if it drifts?

If those answers are unclear, keep the information in `planning/tasks.md`, a
machine record, or ephemeral workspace scratch instead.
