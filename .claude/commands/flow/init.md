---
name: flow-init
description: 'Initialize requirement structure. Usage: /flow-init "REQ-123|Title|URLs"'
skill: workflow/flow-init
---

# Flow-Init Command (Trigger Entry)

> 此文件为触发入口，详细实现见 `.claude/skills/workflow/flow-init/SKILL.md`

## Usage

```bash
/flow-init "REQ-123|User Authentication"
/flow-init "REQ-124|数据导出|https://docs.example.com/export-spec.md"
/flow-init --interactive
```

## Quick Reference

| Stage | Purpose | Output |
|-------|---------|--------|
| 1 | Entry Gate | 参数验证 |
| 1.5 | Context Loading | ROADMAP/ARCHITECTURE |
| 2 | Directory Init | 目录结构 |
| 2.3 | Brainstorming | BRAINSTORM.md |
| 2.5 | Research | research/* |
| 3 | README | README.md |
| 4 | Exit Gate | 5-Level 验证 |

## Session Continuity

- 需求上下文由 `devflow/requirements/${REQ_ID}/` 下的文档和 `orchestration_status.json` 持久化。
- REQ 识别优先级：`DEVFLOW_REQ_ID` → `devflow/workspace/.current-req` → 最新需求目录。

## Skill Location

**Full Implementation**: `.claude/skills/workflow/flow-init/SKILL.md`

**Resources**:
- Scripts: `.claude/skills/workflow/flow-init/scripts/`
- References: `.claude/skills/workflow/flow-init/references/`
- Assets: `.claude/skills/workflow/flow-init/assets/`

## Next Step

```
/flow-spec "${REQ_ID}"
```
