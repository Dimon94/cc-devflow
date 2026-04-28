# CC-Investigate Skill Changelog

## v1.1.3 - 2026-04-28

- add the explicit `NO REPAIR WITHOUT A FROZEN ROOT-CAUSE CONTRACT` iron law to keep investigation separate from implementation
- require prior investigation history, pattern analysis, falsification methods, sanitized external research, and escalation decisions before freezing a root cause
- add repair-boundary scope lock fields for affected module, allowed files, forbidden files, blast radius, and split-or-reroute decisions
- update analysis, tasks, and task-manifest templates with root-cause hypothesis and investigation metadata

## v1.1.2 - 2026-04-27

- require investigation outputs to resolve the runtime output policy before writing analysis, task, or change metadata artifacts
- record `Output language` as the machine-enforced language contract while treating `agent_preferences` as advisory style input

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
