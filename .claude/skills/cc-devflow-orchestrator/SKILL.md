---
name: cc-devflow-orchestrator
description: CC-DevFlow workflow router and agent recommender. Use when starting requirements, running flow commands, or asking about devflow processes.
---

# CC-DevFlow Orchestrator

## Purpose
Guide users to the correct command/skill without duplicating detailed implementation standards.

## Default Product Story

`cc-devflow` 的默认路径是：

1. 模糊目标先走 `/flow:autopilot`
2. `autopilot` 在 repo 内沉淀 Markdown-first 记忆和计划
3. 批准计划后，再调用 `/flow:init / /flow:spec / /flow:dev / /flow:verify / /flow:prepare-pr / /flow:release` 这些薄原语

结论：
- `autopilot` 是前门
- `flow-*` 是原语
- Team 是升级路径，不是默认路径

## Workflow Map

### Project-Level (run once per project)

```text
/core:roadmap      → ROADMAP.md + BACKLOG.md
/core:architecture → ARCHITECTURE.md
/core:guidelines   → frontend/backend guidelines
/core:style        → STYLE.md
```

## Project-Level Harness Protocol (Long-running)

For `/core:*` commands, enforce a two-session model before declaring completion:

1. Initializer session
   - establish/update `devflow/.core-harness/<command>/checklist.json`, `progress.md`, `session-handoff.md`
   - convert high-level goal into structured acceptance checks (default all failing)
2. Worker session(s)
   - resume from `session-handoff.md` + `progress.md`
   - execute one smallest deliverable per session
   - update checklist status only after command-specific validation
3. Completion gate
   - completion is allowed only when checklist is fully passing and command validation gates pass
   - never declare success from “looks complete”; require artifact evidence

### Core Route Defaults

- no `devflow/ROADMAP.md` → route to `/core:roadmap` (initializer first)
- roadmap exists but architecture missing/stale → route to `/core:architecture`
- architecture exists but guidelines missing/stale → route to `/core:guidelines`
- style missing/stale → route to `/core:style`
- interrupted core command → rerun same command from handoff (`/core:roadmap --resume` if supported; otherwise run command again and continue from `session-handoff.md`)

### Requirement-Level Canonical Mainline (v6)

```text
/flow:init    → harness:init + harness:pack
             → context-package.md (bootstrap bridge) + harness-state.json
     ↓
/flow:spec    → harness:plan
             → task-manifest.json
     ↓
/flow:dev     → harness:dispatch / harness:resume
             → runtime events + checkpoints + manifest status
     ↓
/flow:verify  → harness:verify
             → report-card.json (quick/strict gates)
     ↓
/flow:prepare-pr → harness:prepare-pr
             → devflow/intent/<REQ>/artifacts/pr-brief.md
     ↓
/flow:release → harness:release + harness:janitor
             → RELEASE_NOTE.md + released state
```

### Bug Workflow

```text
/flow:fix "BUG-123|描述" → 系统化调试与修复
```

## Routing Guide

### Requirement kickoff
- 如果用户给的是模糊目标、聊天记录、想法堆、希望系统先理清再自动推进：
  - Recommend: `/flow:autopilot "REQ-123|目标描述"`
- 如果目标已经收敛、只需要接入主链 runtime：
  - Recommend: `/flow:init "REQ-123|Title|URLs?"`
- Then: `/flow:spec "REQ-123"`

### Planning/specification questions
- Recommend: `/flow:spec`
- Notes: this is the unified planning stage for executable task-manifest generation; intent memory stays in `devflow/intent/<REQ>/`, while `TASKS.md` is only a direct planner input when present.

### Development execution / interrupted execution
- Recommend: `/flow:dev "REQ-123"`
- If interrupted/failed: `/flow:dev "REQ-123" --resume`

### QA/security/release readiness
- Recommend: `/flow:verify "REQ-123"`
- Strict gate: `/flow:verify "REQ-123" --strict`

### Release
- Recommend: `/flow:prepare-pr "REQ-123"` when you need review-ready evidence or a PR handoff artifact.
- Recommend: `/flow:release "REQ-123"`
- Release is blocked when report-card overall is fail.

### Code review requests
- Recommend: `/flow:verify "REQ-123" --strict`
- Optional deep review: `/util:code-review "<diff>"`

## Phase Gates (Quick Reference)

### Entry Gates
- `flow:init`: repository and requirement id are valid.
- `flow:spec`: `context-package.md` and `harness-state.json` exist; explicit task source should come from intent memory or `TASKS.md`.
- `flow:dev`: `task-manifest.json` exists and is schema-valid.
- `flow:verify`: task dispatch completed or at least one dispatch/resume run exists.
- `flow:release`: `report-card.json.overall == pass`.

### Exit Gates
- `flow:init`: requirement context packaged.
- `flow:spec`: task-manifest generated.
- `flow:dev`: task statuses updated with runtime checkpoints/events.
- `flow:verify`: report-card emitted (quick/strict/review sections).
- `flow:release`: release note generated and harness state marked released.

## State → Recommended Command

```yaml
no_requirement_context:
  recommend: /flow:init

initialized:
  recommend: /flow:spec

manifest_exists_with_pending_or_failed:
  recommend: /flow:dev
  alternative: /flow:dev --resume

manifest_all_passed_without_report_card:
  recommend: /flow:verify --strict

report_card_fail:
  recommend: /flow:dev --resume
  then: /flow:verify --strict

report_card_pass:
  recommend: /flow:prepare-pr

pr_ready:
  recommend: /flow:release

released:
  recommend: /flow:archive (optional)
```

## Auxiliary Commands

### Progress and recovery
- `/flow:status` - query requirement progress
- `/flow:update "REQ-123" "T012"` - update task progress
- `/flow:restart "REQ-123" --from=dev` - recover interrupted workflow state

### Upgrade and governance
- `/flow:upgrade "REQ-123" --analyze` - PRD version impact analysis
- `/flow:constitution` - constitution governance
- `/flow:verify "REQ-123"` - consistency and quality verification

## Design Principle

This skill only does routing:
- Which command to run next
- Which gate blocks progress
- Prefer `/flow:autopilot` when the request is still fuzzy
- Prefer incremental convergence over one-shot generation
- Require artifact-backed completion for long-running sessions

Detailed quality standards stay in command files and workflow skills.
