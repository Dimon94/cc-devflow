# `/flow:init` - Initialize Requirement Bootstrap

[中文文档](./flow-init.zh-CN.md) | [English](./flow-init.md)

---

## Overview

`/flow:init` is the manual bootstrap entry for the current requirement mainline:

```text
/flow:init -> /flow:spec -> /flow:dev -> /flow:verify -> /flow:prepare-pr -> /flow:release
```

It prepares deterministic runtime state with the thinnest possible harness layer.

If the goal is still fuzzy, prefer `/flow:autopilot` first.

## Syntax

```bash
/flow:init "REQ-ID|Feature Title|Optional URLs"
```

## Parameters

| Parameter | Description | Required | Example |
|-----------|-------------|----------|---------|
| `REQ-ID` | Requirement number | Yes | `REQ-123` |
| `Feature Title` | Brief description | Yes | `User Authentication Feature` |
| `Optional URLs` | Optional comma-separated source URLs | No | `https://plan.example.com/req-123` |

> If the title contains non-ASCII text, the agent may generate an English semantic translation for branch naming while keeping the original title in docs.

## Recommended

- The goal is already clear and you want to enter the manual mainline
- You already have intent notes / roadmap context and need runtime bootstrap
- You want `harness-state.json` and `context-package.md` before planning

## Not Recommended

- You expect one command to finish the whole delivery
- You are resuming an interrupted requirement; use `/flow:restart`
- The goal is still fuzzy; use `/flow:autopilot`

## Execution Flow

```text
/flow:init "REQ-123|User Authentication Feature"
  ↓
Stage 1: Bootstrap validation
  ├─ Validate REQ-ID and title
  ├─ Check repository and devflow/ availability
  └─ Assemble goal string
  ↓
Stage 2: Harness init
  └─ Write devflow/requirements/REQ-123/harness-state.json
  ↓
Stage 3: Harness pack
  └─ Write devflow/requirements/REQ-123/context-package.md
  ↓
Stage 4: Continue planning
  ├─ Reuse intent memory under devflow/intent/REQ-123/
  └─ Run /flow:spec "REQ-123"
```

## Output

- `devflow/requirements/REQ-123/harness-state.json`
- `devflow/requirements/REQ-123/context-package.md`

Long-lived semantic memory should continue to live under:

```text
devflow/intent/REQ-123/
├── summary.md
├── plan.md
└── resume-index.md
```

Some repositories may still generate compatibility files such as `EXECUTION_LOG.md` or `orchestration_status.json`, but they are not the primary state surface anymore.

## Related Commands

- Prefer `/flow:autopilot` when the goal is still fuzzy
- `/flow:spec` - compile planning input into `task-manifest.json`
- `/flow:status` - inspect current stage and next action
- `/flow:restart` - recover interrupted work from existing artifacts
