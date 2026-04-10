# CC-DevFlow .claude Directory Architecture

## Purpose
`.claude/` 是 CC-DevFlow 的纯 Skill 控制层。用户只需要记住两件事：先用 `roadmap` 定项目中长期方向，再让每个 requirement 走 `req-plan -> req-do -> req-check -> req-act` 的 PDCA 闭环。

## Directory Structure

```text
.claude/
├── DRIFT_AUDIT.md
├── skills/
│   ├── workflow.yaml
│   ├── roadmap/
│   ├── req-plan/
│   ├── req-do/
│   ├── req-check/
│   ├── req-act/
│   └── _reference-implementations/
├── hooks/
├── scripts/
├── tests/
└── docs/templates/
```

## Canonical Model

```text
roadmap

req-plan -> req-do -> req-check -> req-act
```

## Runtime Mapping

| Skill | Runtime Support | Core Output |
|-------|-----------------|-------------|
| `roadmap` | templates + scripts | `ROADMAP.md`, `BACKLOG.md` |
| `req-plan` | thin harness runtime | `BRAINSTORM.md`, `DESIGN.md`, `TASKS.md`, `task-manifest.json` |
| `req-do` | thin harness runtime | code changes, tests, `.harness/runtime/*`, bug analysis |
| `req-check` | thin harness runtime | `report-card.json` |
| `req-act` | thin harness runtime | `pr-brief.md`, `RELEASE_NOTE.md`, synced docs, optional backlog feedback |

## Design Invariants

1. 可见入口只有 Skill，没有命令心智负担。
2. `roadmap` 负责项目中长期规划，不负责逐任务执行。
3. `req-plan` 必须先于 `req-do`。
4. `req-check` 没过，`req-act` 不允许 ship。
5. `req-act` 必须把结果回写成下一轮更清晰的计划输入。
6. 默认不做上下文注入黑盒，所需信息全部显式读取。

## References

- 模板目录：`.claude/docs/templates/`
- 运行时实现：`bin/harness.js`

---

**Last Updated**: 2026-04-10
**PR-9.2**: Remove command-first guidance, keep roadmap plus PDCA skills only.
