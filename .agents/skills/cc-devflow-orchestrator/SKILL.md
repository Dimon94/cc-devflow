---
name: cc-devflow-orchestrator
description: CC-DevFlow workflow router and agent recommender. Use when starting requirements, running flow commands, or asking about devflow processes.
---

# CC-DevFlow Orchestrator

## Purpose
Guide users to the correct command/skill without duplicating detailed implementation standards.

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
             → context-package.md + harness-state.json
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
/flow:release → harness:release + harness:janitor
             → RELEASE_NOTE.md + released state
```

### Bug Workflow

```text
/flow:fix "BUG-123|描述" → 系统化调试与修复
```

### Deprecated Migrations (keep for compatibility)

```text
/flow:new       → /flow:init → /flow:spec → /flow:dev → /flow:verify → /flow:release
/flow:clarify   → merged into /flow:spec
/flow:checklist → merged into /flow:verify --strict
/flow:quality   → merged into /flow:verify
```

## Routing Guide

### Requirement kickoff
- Recommend: `/flow:init "REQ-123|Title|URLs?"`
- Then: `/flow:spec "REQ-123"`

### Planning/specification questions
- Recommend: `/flow:spec`
- Notes: this is the unified planning stage for executable task-manifest generation.

### Development execution / interrupted execution
- Recommend: `/flow:dev "REQ-123"`
- If interrupted/failed: `/flow:dev "REQ-123" --resume`

### QA/security/release readiness
- Recommend: `/flow:verify "REQ-123"`
- Strict gate: `/flow:verify "REQ-123" --strict`

### Release
- Recommend: `/flow:release "REQ-123"`
- Release is blocked when report-card overall is fail.

### Code review requests
- Recommend: `/flow:verify "REQ-123" --strict`
- Optional deep review: `/util:code-review "<diff>"`

## Phase Gates (Quick Reference)

### Entry Gates
- `flow:init`: repository and requirement id are valid.
- `flow:spec`: `context-package.md` and `harness-state.json` exist.
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

initialized_or_context_packed:
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
- Which migration path applies for deprecated commands
- Prefer incremental convergence over one-shot generation
- Require artifact-backed completion for long-running sessions

Detailed quality standards stay in command files and workflow skills.
