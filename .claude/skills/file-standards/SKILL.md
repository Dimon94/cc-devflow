---
name: devflow-file-standards
description: File naming conventions, directory structure, and state-surface standards for current CC-DevFlow. Focus on intent memory and harness artifacts.
---

# DevFlow File Standards

## Purpose

定义当前 CC-DevFlow 的文件组织与真相源边界。

核心原则：

- Markdown-first for humans and agents
- JSON for runtime/schema only
- `intent/` 是恢复与连续执行的主阅读面
- `requirements/` 是 requirement 生命周期与执行状态面

## Requirement IDs

### Format

```text
REQ-\d+
```

### Usage

- Requirement path: `devflow/requirements/REQ-XXX/`
- Intent path: `devflow/intent/REQ-XXX/`
- Flow commands: `/flow:* "REQ-XXX"`

## Task IDs

### Format

```text
T\d{3}
```

### Usage in `TASKS.md`

```markdown
- [ ] T001 Task title (src/file.ts)
- [ ] T002 Task title dependsOn:T001 (src/other.ts)
- [ ] T003 Task title [P] (src/parallel.ts)
```

## Current Directory Structure

### Requirement State Surface

```text
devflow/requirements/REQ-XXX/
├── context-package.md
├── harness-state.json
├── TASKS.md                    # optional human-maintained task source
├── task-manifest.json          # execution truth source
├── report-card.json
└── RELEASE_NOTE.md
```

### Intent Memory Surface

```text
devflow/intent/REQ-XXX/
├── summary.md
├── facts.md
├── decision-log.md
├── plan.md
├── delegation-map.md
├── resume-index.md
├── checkpoints/
└── artifacts/
    ├── results/
    ├── workers/
    └── pr-brief.md
```

### Runtime Surface

```text
.harness/runtime/REQ-XXX/
└── T001/
    ├── checkpoint.json
    └── events.jsonl
```

## Truth Sources

### Requirement lifecycle

- `harness-state.json`

### Execution status

- `task-manifest.json`
- `.harness/runtime/**/checkpoint.json`
- `.harness/runtime/**/events.jsonl`

### Verification status

- `report-card.json`

### Resume and continuity

- `devflow/intent/<REQ>/resume-index.md`

### PR-ready handoff

- `devflow/intent/<REQ>/artifacts/pr-brief.md`

## Naming Patterns

### Markdown

- `summary.md`, `facts.md`, `plan.md`, `decision-log.md`, `resume-index.md`
- `context-package.md`, `RELEASE_NOTE.md`, `TASKS.md`

### JSON

- `harness-state.json`
- `task-manifest.json`
- `report-card.json`

### Scripts

- `kebab-case.sh`
- `kebab-case.ts`

## Anti-Patterns

- 只看聊天记录，不看 `resume-index.md`
- 只写 JSON，不写 Markdown memory

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
