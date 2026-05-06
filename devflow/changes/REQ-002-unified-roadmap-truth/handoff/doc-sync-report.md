# Doc Sync Report

## Document Meta

- Output language: en

- Requirement: REQ-002-unified-roadmap-truth
- Ship mode: post-merge-closeout
- CC-Check verdict: pass
- Spec sync ready: true
- Updated at: 2026-05-06 10:26:05 +0800

## Synced Requirement Artifacts

- `handoff/release-note.md`: refreshed
- `resume-index.md`: refreshed

## Touched Files

- `test/roadmap-tracking.test.js`
- `roadmap-state`
- `tests`
- `.claude/skills/cc-roadmap/scripts/lib/roadmap-tracking/schema.js`
- `.claude/skills/cc-roadmap/scripts/lib/roadmap-tracking/store.js`
- `roadmap-render`
- `.claude/skills/cc-roadmap/scripts/lib/roadmap-tracking/markdown.js`
- `test/locate-roadmap-item.test.js`
- `roadmap-helpers`
- `.claude/skills/cc-roadmap/scripts/roadmap-tracking.js`
- `.claude/skills/cc-roadmap/scripts/locate-roadmap-item.sh`
- `.claude/skills/cc-roadmap/scripts/sync-roadmap-progress.sh`
- `.claude/skills/cc-roadmap/scripts/lib/roadmap-tracking/query.js`
- `lib/compiler/__tests__/skills-registry.test.js`
- `lib/skill-runtime/__tests__/cli-bootstrap.integration.test.js`
- `skill-contract`
- `.claude/skills/cc-roadmap/SKILL.md`
- `.claude/skills/cc-roadmap/PLAYBOOK.md`
- `.claude/skills/cc-roadmap/CHANGELOG.md`
- `.claude/skills/cc-roadmap/assets/ROADMAP_TEMPLATE.md`
- `.claude/skills/cc-roadmap/assets/BACKLOG_TEMPLATE.md`
- `.claude/skills/cc-roadmap/assets/TRACKING_TEMPLATE.json`
- `docs/examples/scripts/check-example-bindings.sh`
- `docs/examples/example-bindings.json`
- `examples`
- `docs-validation`
- `docs/examples/**`
- `README.md`
- `README.zh-CN.md`
- `docs/guides/getting-started.md`
- `.codex/skills/cc-roadmap/**`
- `docs`
- `codex-mirror`
- `devflow/changes/REQ-002-unified-roadmap-truth/review/report-card.json`
- `verification`

## Spec Targets

- `devflow/changes/REQ-002-unified-roadmap-truth/change-meta.json`
- `.claude/skills/cc-roadmap/SKILL.md`
- `.claude/skills/cc-roadmap/PLAYBOOK.md`
- `.claude/skills/cc-roadmap/assets/ROADMAP_TEMPLATE.md`
- `.claude/skills/cc-roadmap/assets/TRACKING_TEMPLATE.json`

## Project Doc Targets

### CLAUDE Targets

- `CLAUDE.md`
- `lib/compiler/CLAUDE.md`
- `lib/skill-runtime/CLAUDE.md`
- `docs/CLAUDE.md`

### README Candidates

- `README.md`
- `README.zh-CN.md`

## Manual Follow-Ups

- Update the listed `CLAUDE.md` files if structure, workflow, or operational truth changed.
- Update README candidates if user-visible behavior or setup flow changed.
- Re-render `pr-brief.md` after any manual doc edits so the PR body stays in sync.
- Main risk to reflect in docs: deprecated `BACKLOG.md` remains a generated compatibility projection for one release and must not become durable roadmap truth again.
