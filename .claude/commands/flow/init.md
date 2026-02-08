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
| 1.2 | Git Worktree (默认) / Branch (--branch-only) | `../{repo}-{REQ_ID}` + `feature|bugfix/{REQ_ID}-{slug}` |
| 1.5 | Context Loading | ROADMAP/ARCHITECTURE |
| 2 | Directory Init | 目录结构 |
| 2.3 | Brainstorming | BRAINSTORM.md |
| 2.5 | Research | research/* |
| 3 | README | README.md |
| 4 | Exit Gate | 5-Level 验证 |

## Worktree Naming

- 默认模式会创建独立 worktree（不是只建分支）。
- 目录命名：`{repo-name}-{REQ_ID}`（示例：`cc-devflow-REQ-123`）。
- 分支命名：
  - Requirement: `feature/{REQ_ID}-{slug(title)}`
  - Bug: `bugfix/{REQ_ID}-{slug(title)}`
- `--branch-only` 才会退回传统单仓库分支模式。

## Session Continuity

- 需求上下文由 `devflow/requirements/${REQ_ID}/` 下的文档和 `orchestration_status.json` 持久化。
- REQ 识别优先级：`DEVFLOW_REQ_ID` → worktree 目录名 → 当前分支名。
- 进入新会话时，应先进入目标 worktree 目录再继续命令；worktree 路径可按命名规则直接定位，或使用 `using-git-worktrees` 的切换脚本。

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
