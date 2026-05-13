# PR Brief

## Document Meta

- Output language:

## Decision

- Recommended mode:
- Why now:
- Why not others:

## Requirement

- 

## Ship Mode

- `create-pr` / `update-pr` / `local-handoff` / `post-merge-closeout`

## Branch Context

- Current branch:
- Base branch:
- PR / MR:

## Ship Preflight

- Branch:
- Base:
- Remote:
- Local / remote HEAD:
- Auth:
- Clean tree:
- Review freshness:
- Ship mode:
- `ShipPreflightError`:
- Rescue action:

## PR Branch Hygiene

- Existing PR / MR:
- Duplicate PR risk:
- Commit split:
- Push idempotency:
- Body source:

## Review Range

- Reviewed base SHA:
- Reviewed head SHA:
- Review packet:
- Finding triage:
- QA / claim evidence:

## Readiness Dashboard

- Review freshness:
- Review quality:
- Specialist review facets:
- QA coverage:
- Browser QA:
- Feedback loop:
- Behavior evidence:
- Failure ownership:
- Documentation release:
- PR body accuracy:

## Pull Request Body Contract

- Language source: `Output language: <value from report-card>`
- PR body language: `中文` / `English`
- Title rule: same language as the PR body after the Conventional Commits `type(scope)` prefix; keep identifiers, paths, commands, and issue keys unchanged.
- Body source: current `pr-brief.md`, current diff, current `review/report-card.json`, doc sync status, and roadmap/backlog writeback.
- Required sections: summary, problem, changes, validation, review/gate evidence, risk/rollback, docs/writeback, follow-ups.
- Completeness gate: no empty headings, no stale inherited PR body, no generic "tests passed" without command or evidence, and no `<placeholder>` text before `gh pr create` or `gh pr edit`.

## Pull Request Body Draft

```markdown
## Summary / 摘要

- TBD

## Problem / 问题

- Requirement / 需求:
- User-visible gap / 用户可见缺口:

## Changes / 变更

- TBD

## Validation / 验证

- `report-card.json` verdict / 结论:
- Commands / 命令:
- Key observations / 关键观察:

## Review / Gate Evidence

- Reviewed base SHA:
- Reviewed head SHA:
- Review packet:
- Finding triage:
- QA / claim evidence:
- Readiness:

## Risk And Rollback / 风险与回滚

- Main risk / 主要风险:
- Rollback boundary / 回滚边界:

## Docs And Writeback / 文档与回写

- `CLAUDE.md`:
- `README.md`:
- Roadmap progress:

## Follow-ups / 后续事项

- TBD
```

## Summary

- TBD

## What Changed

- TBD

## Verification Evidence

- `review/report-card.json` verdict:
- Fresh evidence:
- Merged-result verification:

## Rollback Guard

- Safe state:
- Rollback command / manual steps:
- Side effects:
- Owner:

## QA Behavior Evidence

- Feedback loop:
- Expected behavior:
- Actual behavior:
- Reproduction steps:
- Consistency:

## Documentation Sync

- `CLAUDE.md`:
- `README.md`:
- Handoff file: `pr-brief.md` is the single handoff file.
- Release notes, resume entry, and doc sync status are folded into this file.

## Roadmap Progress Sync

- Source RM:
- Roadmap files: `devflow/roadmap.json`, `devflow/ROADMAP.md`, optional `devflow/BACKLOG.md`
- Sync command:
- Status after sync:
- Progress after sync:
- Follow-up writeback:
- No-op reason:

## Release Notes

- Ship mode:
- User impact:
- Verification:
- Roadmap progress:

## Resume Entry

- Requirement:
- Current stage: `cc-act`
- Current task:
- Branch state:
- Active PR / MR:
- Next action:

## Minimum Landing Pack

- Required for this mode: `handoff/pr-brief.md`
- No split handoff files are generated.

## How To Verify

- TBD

## Follow-Ups

- Current behavior:
- Desired behavior:
- Key interfaces:
- Acceptance criteria:
- Out of scope:
- Learning extraction target:

## Risks

- TBD
