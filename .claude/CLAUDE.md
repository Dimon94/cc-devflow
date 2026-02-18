# CC-DevFlow .claude Directory Architecture

## Purpose
`.claude/` 是 CC-DevFlow 的执行控制层：定义命令入口、Skill 依赖、运行时脚本、Hook 策略与模板约束。

## Directory Structure (v6.0 Harness-First)

```text
.claude/
├── skills/
│   ├── workflow.yaml
│   ├── workflow/
│   │   ├── flow-init/
│   │   ├── flow-spec/
│   │   ├── flow-dev/
│   │   ├── flow-verify/
│   │   ├── flow-release/
│   │   ├── flow-fix/
│   │   └── flow-quality/        # 兼容保留
│   ├── domain/
│   ├── guardrail/
│   └── utility/
├── commands/
│   ├── flow/                    # /flow:*
│   ├── core/                    # /core:*
│   └── util/                    # /util:*
├── hooks/
├── scripts/
└── docs/templates/
```

## Current Canonical Flow (Default)

```text
/flow:init -> /flow:spec -> /flow:dev -> /flow:verify -> /flow:release
```

### Runtime Mapping

| Command | Runtime Ops | Core Output |
|---------|-------------|-------------|
| `/flow:init` | `harness:init` + `harness:pack` | `context-package.md`, `harness-state.json` |
| `/flow:spec` | `harness:plan` | `task-manifest.json` |
| `/flow:dev` | `harness:dispatch` / `harness:resume` | `runtime-events.jsonl` |
| `/flow:verify` | `harness:verify` | `report-card.json` |
| `/flow:release` | `harness:release` + `harness:janitor` | `release-note.md` |

## Command Namespace

### Active Namespaces

| Namespace | Scope | Example |
|-----------|-------|---------|
| `flow` | Requirement delivery | `/flow:spec "REQ-123"` |
| `core` | Project-level governance | `/core:roadmap` |
| `util` | Engineering utilities | `/util:code-review` |

### Migration (Legacy -> Current)

| Legacy | Current |
|--------|---------|
| `/flow-init` | `/flow:init` |
| `/flow-spec` | `/flow:spec` |
| `/flow-dev` | `/flow:dev` |
| `/flow-restart` | `/flow:restart` |
| `/flow-status` | `/flow:status` |
| `/core-architecture` | `/core:architecture` |
| `/git-commit` | `/util:git-commit` |

## Deprecated Entry Points (Compatibility Kept)

| Deprecated | Migration |
|------------|-----------|
| `/flow:new` | use canonical 5-stage flow |
| `/flow:clarify` | merged into `/flow:spec` |
| `/flow:checklist` | merged into `/flow:verify --strict` |
| `/flow:quality` | merged into `/flow:verify` |
| `/flow-prd` + `/flow-tech` + `/flow-ui` + `/flow-epic` | unified as `/flow:spec` |

## Key Compatibility Modules

| Module | Status | Note |
|--------|--------|------|
| `/flow:delta` | active | incremental spec evolution |
| `/flow:archive` | active | archive + restore |
| `/flow:workspace` | active | developer workspace/journal |
| `flow-quality` skill directory | compatibility | historical quality path retained |

## Hooks and Scripts (Execution Spine)

- Hooks enforce lifecycle checks and context injection (`inject-*`, `ralph-loop`, teammate hooks).
- Scripts implement deterministic stage operations (`run-quality-gates.sh`, `recover-workflow.sh`, `verify-gate.sh`).
- `scripts/common.sh` is the shared contract for REQ detection and state helpers.

## Historical Modules (Archived Summary)

以下内容是 v2.3 - v4.7 的历史演进摘要，仅用于理解设计来源，不作为当前执行标准。

| Version | Theme | Key Outcome | Current Status |
|---------|-------|-------------|----------------|
| v2.3.0 | Ralph × Manus | 引入自主迭代 + 外部记忆（ERROR_LOG / attempts） | 已并入 `/flow:dev` |
| v3.0.0 | OpenSpec × Trellis | Skills-first + JSONL 上下文注入 + workflow 图 | 已演进到 v6 harness 主线 |
| v4.1.0 | Unified Spec | PRD/Tech/UI/Epic 合并为统一 spec 阶段 | 保留为 `/flow:spec` 能力基础 |
| v4.4.0 | Programmatic Ralph Loop | Hook 级别迭代控制与可验证退出 | 已融入现有 hooks/runtime |
| v4.5.0 | Delta Specs | 需求增量变更与 apply 流程 | 兼容保留（`/flow:delta`） |
| v4.6.0 | Archive Enhancement | 归档元数据与可恢复能力 | 兼容保留（`/flow:archive`） |
| v4.7.0 | Claude Team | 多 Agent 并行调度与任务依赖管理 | 能力保留，非默认路径 |

## Design Invariants

1. 阶段输出必须可审计（状态文件 + 产物 + 日志）。
2. 质量闸必须可重跑并可追踪证据。
3. 恢复策略优先从失败阶段继续，不做整链回滚。
4. 默认路径保持单一主链，兼容入口仅作迁移过渡。

## References

- 命令索引：`docs/commands/README.md`、`docs/commands/README.zh-CN.md`
- 版本历史：`README.md`、`README.zh-CN.md`
- 运行时实现：`bin/harness.js`、`lib/harness/*`

---

**Last Updated**: 2026-02-18
**PR-6.3**: Rebuilt CLAUDE L1 doc into concise canonical map + archived history summary.
