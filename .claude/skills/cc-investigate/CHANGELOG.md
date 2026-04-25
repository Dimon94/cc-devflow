# CC-Investigate Skill Changelog

## v1.1.1 - 2026-04-25

- require new bug-fix investigations to use `FIX-<number>-<description>` change keys
- update manifest examples so repair handoffs no longer advertise `REQ-*` for fresh fix work

Migration note:

- existing `REQ-*` investigation directories can still be read as historical requirement-linked work; new bug-fix work should start with `FIX-*`

## v1.1.0 - 2026-04-19

- add `change-meta.json` to the investigation output so bug work also preserves capability/spec linkage
- upgrade `ANALYSIS.md`, debug task handoff, and manifest templates with spec diagnosis and expected spec delta fields
- teach investigation to classify whether the problem is implementation drift, missing spec truth, or roadmap mismatch

Migration note:

- investigated bug changes should now refresh or create `devflow/changes/<change-key>/change-meta.json`

## v1.0.0 - 2026-04-17

- 初始版 `cc-investigate` skill，作为 bug 路径里的专用调查入口。
- 把根因调查从 `cc-do` 中拆出，形成 `cc-investigate -> cc-do -> cc-check -> cc-act` 的独立闭环。
- 新增 `ANALYSIS.md`、debug `TASKS.md`、`task-manifest.json` 的调查输出模型，让 bug 修复也能留下可执行 handoff。
