# flow-spec/ - Unified Specification Skill

> L2 | 父级: `.claude/skills/workflow/CLAUDE.md`

## Purpose

统一规格阶段，合并 flow-prd/flow-tech/flow-ui/flow-epic 为单一命令。

## Members

| File | Purpose | Lines |
|------|---------|-------|
| `SKILL.md` | 核心指令：执行流程、模式、错误处理 | ~250 |
| `context.jsonl` | 上下文注入定义 | ~10 |
| `scripts/entry-gate.sh` | 统一入口检查 | ~150 |
| `scripts/parallel-orchestrator.sh` | 并行调度逻辑文档 | ~200 |
| `scripts/exit-gate.sh` | 统一出口检查 | ~180 |

## Execution Flow

```
PRD (sequential) → Tech + UI (parallel) → Epic (sequential)
```

## Mode Matrix

| Mode | Flags | Agents |
|------|-------|--------|
| Full | (default) | PRD + Tech + UI + Epic |
| Quick | `--skip-tech --skip-ui` | PRD + Epic |
| Backend | `--skip-ui` | PRD + Tech + Epic |
| Frontend | `--skip-tech` | PRD + UI + Epic |

## Agent References

复用现有 agent 指令:
- `flow-prd/references/prd-writer.md`
- `flow-tech/references/tech-architect.md`
- `flow-ui/references/ui-designer.md`
- `flow-epic/references/planner.md`

---

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
