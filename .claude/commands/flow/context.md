---
name: flow-context
description: Manage context injection for current CC-DevFlow agents and workers. Usage: /flow:context init [REQ-ID] | add [agent] [path] [purpose] | validate [REQ-ID]
version: 6.2.0
---

# /flow:context

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

管理当前 CC-DevFlow 的上下文注入配置。

默认语义：

- 主阅读面优先指向 `devflow/intent/<REQ>/` 和 `devflow/requirements/<REQ>/`
- 优先注入 `plan.md / resume-index.md / task-manifest.json / report-card.json`
- 任何补充设计资料都只能作为次级输入，不能盖过当前主工件

## Usage

```bash
/flow:context init REQ-007
/flow:context add dev "devflow/intent/REQ-007/plan.md" "Current approved plan"
/flow:context list dev
/flow:context validate REQ-007
```

## 推荐上下文面

### Controller / autopilot

- `devflow/intent/<REQ>/summary.md`
- `devflow/intent/<REQ>/facts.md`
- `devflow/intent/<REQ>/plan.md`
- `devflow/intent/<REQ>/resume-index.md`

### Execution / dev

- `devflow/requirements/<REQ>/task-manifest.json`
- `.harness/runtime/<REQ>/**/checkpoint.json`
- `devflow/intent/<REQ>/artifacts/results/*.md`

### Verification / release

- `devflow/requirements/<REQ>/report-card.json`
- `devflow/intent/<REQ>/artifacts/pr-brief.md`
- `devflow/requirements/<REQ>/RELEASE_NOTE.md`

## Context Entry Format

```jsonl
{"type": "file", "path": "devflow/intent/REQ-123/plan.md", "purpose": "Current approved plan"}
{"type": "file", "path": "devflow/requirements/REQ-123/task-manifest.json", "purpose": "Executable task graph"}
{"type": "file", "path": "devflow/intent/REQ-123/resume-index.md", "purpose": "Resume pointer", "optional": true}
```

## Secondary Inputs

如果仓库中仍存在补充设计资产：

- 可以按需注入到特定 worker 或 review 场景
- 但必须明确标注用途，不能替代 `intent + harness artifacts` 的主阅读面
