# CC-DevFlow .claude Directory Architecture

## Purpose
`.claude/` 现在只保留 canonical Skill 包。每个 skill 自带自己的模板、参考资料和脚本，流程定义也只在 skill 包里。

## Directory Structure

```text
.claude/
├── CLAUDE.md
└── skills/
    ├── CLAUDE.md
    ├── roadmap/
    │   ├── CLAUDE.md
    │   ├── SKILL.md
    │   ├── PLAYBOOK.md
    │   ├── assets/
    │   ├── references/
    │   └── scripts/
    ├── req-plan/
    │   ├── CLAUDE.md
    │   ├── SKILL.md
    │   ├── PLAYBOOK.md
    │   ├── assets/
    │   ├── references/
    │   └── scripts/
    ├── req-do/
    │   ├── CLAUDE.md
    │   ├── SKILL.md
    │   ├── PLAYBOOK.md
    │   ├── references/
    │   └── scripts/
    ├── req-check/
    │   ├── CLAUDE.md
    │   ├── SKILL.md
    │   ├── PLAYBOOK.md
    │   ├── assets/
    │   ├── references/
    │   └── scripts/
    └── req-act/
        ├── CLAUDE.md
        ├── SKILL.md
        ├── PLAYBOOK.md
        ├── assets/
        ├── references/
        └── scripts/
```

## Canonical Model

```text
roadmap

req-plan -> req-do -> req-check -> req-act
```

## Runtime Mapping

| Skill | Core Output |
|-------|-------------|
| `roadmap` | `ROADMAP.md`, `BACKLOG.md` |
| `req-plan` | `BRAINSTORM.md`, `DESIGN.md`, `TASKS.md`, `task-manifest.json` |
| `req-do` | code changes, tests, `.harness/runtime/*`, bug analysis |
| `req-check` | `report-card.json` |
| `req-act` | `pr-brief.md`, `RELEASE_NOTE.md`, synced docs, optional backlog feedback |

## Design Invariants

1. 真相源只在 `.claude/skills/**`；`.agents/skills/**` 只是镜像面。
2. 每个 skill 必须自带闭环说明、模板和脚本。
3. `roadmap` 负责项目中长期规划，不负责逐任务执行。
4. `req-plan` 必须先于 `req-do`。
5. `req-check` 没过，`req-act` 不允许 ship。
6. `req-act` 必须把结果回写成下一轮更清晰的计划输入。

## References

- canonical skills：`.claude/skills/*`
- 运行时实现：`bin/harness.js`
- 分发镜像：`.agents/skills/`

---

**Last Updated**: 2026-04-10
**PR-9.4**: Collapse `.claude` to canonical skill packages and move templates/scripts into each skill directory.
