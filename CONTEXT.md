# Project Context

## Canonical Positioning

CC-DevFlow 当前的默认路线是：

- skill-first
- autopilot-first
- markdown-first
- local-first
- thin harness spine

系统目标不是堆厚平台，而是把：

- 模糊目标收敛
- Markdown 记忆沉淀
- 本地 subagent / team 委派
- 执行 / 验证 / PR-ready 收尾

串成一条可恢复、可审计、可自治的主链。

---

## Canonical Flow

### 模糊目标入口

```bash
/flow:autopilot "REQ-123|支持用户下单"
```

### 手动主链

```bash
/flow:init "REQ-123|支持用户下单|https://plan.example.com/Q1"
/flow:spec "REQ-123"
/flow:dev "REQ-123"
/flow:verify "REQ-123" --strict
/flow:prepare-pr "REQ-123"
/flow:release "REQ-123"
```

---

## State Surfaces

### 语义记忆层

```text
devflow/intent/${reqId}/
├── summary.md
├── facts.md
├── decision-log.md
├── plan.md
├── resume-index.md
├── delegation-map.md
├── checkpoints/
└── artifacts/
    ├── briefs/
    ├── results/
    └── pr-brief.md
```

### requirement runtime 层

```text
devflow/requirements/${reqId}/
├── context-package.md     # bootstrap bridge artifact
├── harness-state.json     # lifecycle truth
├── TASKS.md               # optional planner input / human mirror
├── task-manifest.json     # executable task truth
├── report-card.json       # verify truth
└── RELEASE_NOTE.md
```

### runtime 执行层

```text
.harness/runtime/${reqId}/
├── events.jsonl
├── checkpoints/
└── workers/
```

### compatibility artifacts

旧脚本或旧需求目录中可能仍会出现：

- `orchestration_status.json`
- `EXECUTION_LOG.md`

它们只应被视为 compatibility mirror / append-only audit，不再是主状态面。

---

## Truth Sources

- 目标、计划、恢复：优先读 `devflow/intent/${reqId}/`
- 生命周期：优先读 `harness-state.json`
- 执行状态：优先读 `task-manifest.json` 与 `.harness/runtime/`
- 验证结论：优先读 `report-card.json`
- PR-ready 收尾：优先读 `devflow/intent/${reqId}/artifacts/pr-brief.md`

额外原则：

- `context-package.md` 只负责 bootstrap，不承载长期产品判断
- `TASKS.md` 不是必需真相源；若存在，只是 planner 输入或可读镜像
- 没有 artifact 证据，不算完成

---

## Execution Ladder

```text
direct -> delegate -> team
```

- `direct`: 默认路径，适合小任务和短上下文
- `delegate`: 任务边界清晰、可并行时使用本地 worker/subagent
- `team`: 只在多角色判断明显有价值时升级

Team 的共享记忆与协作状态，应继续写回 `devflow/intent/${reqId}/` 与 team-state truth，而不是另起一套编排中心。

---

## Harness Mapping

| Command | Harness Op | Core Output |
|---------|------------|-------------|
| `/flow:init` | `harness:init` + `harness:pack` | `harness-state.json`, `context-package.md` |
| `/flow:spec` | `harness:plan` | `task-manifest.json` |
| `/flow:dev` | `harness:dispatch` / `harness:resume` | runtime checkpoints + events |
| `/flow:verify` | `harness:verify` | `report-card.json` |
| `/flow:prepare-pr` | `harness:prepare-pr` | `artifacts/pr-brief.md` |
| `/flow:release` | `harness:release` + `harness:janitor` | `RELEASE_NOTE.md` |

---

## Active References

优先参考这些文件理解当前系统：

- `.claude/CLAUDE.md`
- `.claude/DRIFT_AUDIT.md`
- `.claude/rules/devflow-conventions.md`
- `.claude/skills/workflow.yaml`
- `lib/harness/CLAUDE.md`

---

## Recovery Shortcuts

```bash
cat devflow/intent/REQ-123/resume-index.md
ls -la devflow/intent/REQ-123/artifacts/results/
ls -la .harness/runtime/REQ-123/
```

如果这些存在，就优先依赖它们继续推进，而不是重新扫描整仓库并猜测上下文。
