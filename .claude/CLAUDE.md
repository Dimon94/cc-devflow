# CC-DevFlow .claude Directory Architecture

## Purpose
`.claude/` 是 CC-DevFlow 的协议控制层：先用 Skills 写清流程，再用命令入口触发，再由薄 harness 原语执行。

## Directory Structure

```text
.claude/
├── DRIFT_AUDIT.md            # 当前 canonical path 与偏移审计
├── skills/
│   ├── workflow.yaml
│   ├── autopilot/              # 新前门：模糊目标 -> 计划 -> 自动驾驶
│   ├── flow-init/
│   ├── flow-spec/
│   ├── flow-dev/
│   ├── flow-verify/
│   ├── flow-prepare-pr/
│   ├── flow-release/
│   ├── flow-fix/
│   ├── flow-quality/
│   ├── cc-devflow-orchestrator/
│   └── ...                     # 其余 domain/guardrail/utility 技能
├── commands/
│   ├── flow/                   # /flow:* 主入口
│   ├── core/
│   └── util/
├── hooks/
├── scripts/
├── tests/                      # shell/fixture 回归测试
└── docs/templates/
```

## Canonical Flow

```text
/flow:autopilot
  -> converge plan + markdown memory
  -> call flow-init / flow-spec / flow-dev / flow-verify / flow:prepare-pr / flow-release as needed
```

## Execution Ladder

```text
direct -> delegate -> team
```

规则：

- `direct` 是默认路径
- `delegate` 处理可边界化的执行任务
- `team` 只在复杂设计协作时升级
- Team 是角色编排，不是第二套真相源

### Runtime Mapping

| Command | Runtime Ops | Core Output |
|---------|-------------|-------------|
| `/flow:init` | `harness:init` + `harness:pack` | `context-package.md`, `harness-state.json` |
| `/flow:spec` | `harness:plan` | `task-manifest.json` |
| `/flow:dev` | `harness:dispatch` / `harness:resume` | `runtime-events.jsonl` |
| `/flow:verify` | `harness:verify` | `report-card.json` |
| `/flow:prepare-pr` | `harness:prepare-pr` | `devflow/intent/<REQ>/artifacts/pr-brief.md` |
| `/flow:release` | `harness:release` + `harness:janitor` | `release-note.md` |

`/flow:autopilot` 本身优先写 Markdown 工件，不要求新增厚 runtime。

## Command Namespace

| Namespace | Scope | Example |
|-----------|-------|---------|
| `flow` | Requirement delivery | `/flow:spec "REQ-123"` |
| `core` | Project-level governance | `/core:roadmap` |
| `util` | Engineering utilities | `/util:code-review` |

## Active Flow Modules

| Module | Role |
|--------|------|
| `/flow:autopilot` | 模糊目标收敛与自动驾驶 |
| `/flow:init` | 初始化 requirement 上下文 |
| `/flow:spec` | 把 intent / TASKS 收敛为 executable manifest |
| `/flow:dev` | 执行与恢复任务前沿 |
| `/flow:verify` | 质量闸与验证证据 |
| `/flow:prepare-pr` | 生成 PR-ready 工件 |
| `/flow:release` | 发布与 runtime janitor |
| `/flow:fix` | Bug 调试与修复 |
| `/flow:archive` | 生命周期归档 |
| `/flow:workspace` | 开发工作区记录 |
| `/flow:status` | 状态读取与下一步建议 |

## Hooks and Scripts (Thin Execution Spine)

- Hooks enforce lifecycle checks and context injection (`inject-*`, `ralph-loop`, teammate hooks).
- Scripts implement deterministic stage operations (`run-quality-gates.sh`, `recover-workflow.sh`, `verify-gate.sh`).

## Design Invariants

1. 计划、执行、验证、文档必须都有工件证据。
2. Markdown-first 记忆优先于聊天临时上下文。
3. 恢复优先读 `resume-index + checkpoint`，不靠重新猜。
4. 默认路径始终是 `direct -> delegate -> team`。
5. 不为 autopilot 新造厚平台；优先复用现有 harness 原语。

## References

- 命令索引：`docs/commands/README.md`、`docs/commands/README.zh-CN.md`
- 版本历史：`README.md`、`README.zh-CN.md`
- 运行时实现：`bin/harness.js`、`lib/harness/*`
- 当前校准：`.claude/DRIFT_AUDIT.md`

---

**Last Updated**: 2026-03-26
**PR-6.5**: Simplified `.claude` canonical map to current autopilot-first protocol.
