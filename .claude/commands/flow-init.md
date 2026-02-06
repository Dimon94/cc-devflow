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
| 1.2 | Git Branch | feature/REQ-xxx-title |
| 1.5 | Context Loading | ROADMAP/ARCHITECTURE |
| 2 | Directory Init | 目录结构 |
| 2.3 | Brainstorming | BRAINSTORM.md |
| 2.5 | Research | research/* |
| 3 | README | README.md |
| 4 | Exit Gate | 5-Level 验证 |

## Skill Location

**Full Implementation**: `.claude/skills/workflow/flow-init/SKILL.md`

**Resources**:
- Scripts: `.claude/skills/workflow/flow-init/scripts/`
- References: `.claude/skills/workflow/flow-init/references/`
- Assets: `.claude/skills/workflow/flow-init/assets/`

## Next Step

```
/flow-prd "${REQ_ID}"
```
