# flow-spec/ - Unified Specification Skill

> L2 | 父级: `.claude/skills/workflow/CLAUDE.md`

## Purpose

统一规格阶段，合并 flow-prd/flow-tech/flow-ui/flow-epic 为单一命令。支持 Team Mode 并行协作 (v4.7)。

## Members

| File | Purpose | Lines |
|------|---------|-------|
| `SKILL.md` | 核心指令：执行流程、模式、错误处理 | ~250 |
| `context.jsonl` | 上下文注入定义 | ~10 |
| `team-config.json` | Team Mode 配置：成员、工作流、协商协议 [v4.7] | ~165 |
| `scripts/entry-gate.sh` | 统一入口检查 | ~150 |
| `scripts/parallel-orchestrator.sh` | 并行调度逻辑文档 | ~200 |
| `scripts/exit-gate.sh` | 统一出口检查 | ~180 |
| `scripts/team-init.sh` | Team Mode 初始化脚本 [v4.7] | ~190 |
| `scripts/team-communication.sh` | Team 通信协议脚本 [v4.7] | ~280 |

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

## Team Mode (v4.7)

### 执行模式检测

| Mode | Flags | Execution |
|------|-------|-----------|
| Team (Full) | (default) | 并行 Team 协作 |
| Subagent (Quick) | `--skip-tech --skip-ui` | 传统 Subagent |
| Subagent (Backend) | `--skip-ui` | 传统 Subagent |
| Subagent (Frontend) | `--skip-tech` | 传统 Subagent |

### team-config.json

定义 spec-design-team 的完整配置：

- **members**: 4 个 Agent (prd-writer, tech-architect, ui-designer, planner)
- **workflow.stages**: 3 阶段执行流程
- **communication.negotiate_topics**: 5 个协商主题 (api_format, field_naming, auth_strategy, state_management, component_granularity)
- **quality_gates**: 入口/出口检查配置
- **error_handling**: 阶段失败处理策略

### scripts/team-init.sh

Team Mode 初始化脚本，提供：

- `detect`: 检测执行模式 (team/subagent)
- `init`: 初始化 Team 状态到 orchestration_status.json
- `config`: 输出 Team 配置 JSON

### scripts/team-communication.sh

Team 通信协议脚本，提供：

- `init`: 初始化 design_decisions.md
- `record`: 记录设计决策
- `template`: 获取协商消息模板
- `participants`: 获取主题参与者
- `owner`: 获取决策所有者
- `example-api`: API 格式协商示例
- `example-state`: 状态管理协商示例

### SendMessage 协商协议 (v4.7)

Team Mode 下 tech-architect 和 ui-designer 通过 SendMessage 工具进行实时协商：

| Topic | Initiator | Decision Owner | 协商内容 |
|-------|-----------|----------------|----------|
| api_format | tech-architect | tech-architect | REST/GraphQL, 分页, 错误格式 |
| field_naming | tech-architect | tech-architect | camelCase/snake_case, 字段命名 |
| auth_strategy | tech-architect | tech-architect | JWT/Session/OAuth |
| state_management | ui-designer | ui-designer | Zustand/Redux/Context |

协商结果记录到 `devflow/requirements/{REQ}/research/design_decisions.md`。

详细协商消息模板见 `SKILL.md` Stage 2 Negotiate Protocol 部分。

---

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
