# Roadmap Skill Changelog

## v4.3.1 - 2026-04-19

- refactor `scripts/roadmap-tracking.js` into focused schema / markdown / store helpers so the CLI stops carrying parsing, rendering, upgrade, and persistence in one 1000-line file
- route `locate-roadmap-item.sh` through the shared tracking query path instead of maintaining a second inline Node formatter
- preserve existing `backlog` fields when auto-upgrading legacy v1 tracking JSON so shared lookup and render paths stay behaviorally correct

## v4.3.0 - 2026-04-19

- expand `devflow/roadmap-tracking.json` from implementation-only tracking into the shared truth source for `ROADMAP.md` and `BACKLOG.md`
- teach `roadmap-tracking.js render` and `sync-roadmap-progress.sh` to regenerate both files from the same sidecar so roadmap status and backlog handoff can no longer drift apart
- upgrade locator, templates, docs, examples, and tests so backlog queue / ready / parked data are read from the sidecar before falling back to markdown text

Migration note:

- existing v4.2.x `roadmap-tracking.json` files are auto-upgraded on first render or sync run
- if you maintain backlog handoff by hand, move the durable fields into `roadmap-tracking.json` and rerender instead of treating `BACKLOG.md` as the writable source
- `scripts/roadmap-tracking.js render` now requires both `--roadmap` and `--backlog`

## v4.2.1 - 2026-04-19

- teach `locate-roadmap-item.sh` to resolve `RM-*` and `REQ-*` through `devflow/roadmap-tracking.json` before falling back to markdown grep
- realign bundled examples with the capability-aware backlog contract so templates, examples, and helper checks no longer drift apart
- tighten example validation to require the new backlog queue columns and `Ready For Req-Plan` handoff fields

## v4.2.0 - 2026-04-19

- add `devflow/roadmap-tracking.json` as the structured truth source for `Implementation Tracking`
- replace fragile column-position markdown rewrites with JSON-first sync plus markdown re-rendering
- ship a reusable `render` path so manual edits to the tracking sidecar can be pushed back into `ROADMAP.md`

Migration note:

- keep `devflow/ROADMAP.md` as the human-facing roadmap, but let helper automation update `devflow/roadmap-tracking.json`
- the first sync run bootstraps `roadmap-tracking.json` from an existing `Implementation Tracking` table, then rewrites the section in the new generated shape
- if you were scripting direct table edits, switch to `scripts/sync-roadmap-progress.sh` or edit `roadmap-tracking.json` and rerender

## v4.1.0 - 2026-04-19

- teach `cc-roadmap` to anchor roadmap items to capability specs instead of leaving future work as requirement-shaped fragments
- upgrade roadmap and backlog templates with `Primary Capability`, `Secondary Capabilities`, `Capability Gap`, and `Expected Spec Delta`
- extend `sync-roadmap-progress.sh` so roadmap tracking can update capability/spec columns together with status progress

Migration note:

- roadmap items should now point to at least one capability, with one explicit primary capability
- backlog handoffs should carry expected spec delta into `cc-plan`

## v4.0.0 - 2026-04-18

- restore `cc-roadmap` durable outputs to `devflow/ROADMAP.md` and `devflow/BACKLOG.md`, matching the repository contract and keeping roadmap artifacts under `devflow/`
- update bundled helper scripts to prefer `devflow/ROADMAP.md` and `devflow/BACKLOG.md`, while still falling back to the recent repo-root paths and the older `devflow/roadmap/*` paths
- realign skill docs, public guides, and registry/bootstrap tests with the restored canonical paths

Migration note:

- new roadmap runs should write `devflow/ROADMAP.md` and `devflow/BACKLOG.md`
- if you temporarily have repo-root `ROADMAP.md` / `BACKLOG.md` from v3.0.0, move them back under `devflow/`
- helper scripts now resolve files in this order: `devflow/*.md` -> repo-root `*.md` -> legacy `devflow/roadmap/*.md`

## v3.0.0 - 2026-04-17

- change `cc-roadmap` durable outputs to repo-root `ROADMAP.md` and `BACKLOG.md`, aligning the skill contract with README, examples, and live usage
- require roadmap output to include an explicit `RM Dependency Graph` plus `Parallel Waves`, so serial blockers and concurrent work are visible
- upgrade backlog handoff fields to record `Depends On` and `Parallel With`
- update bundled helper scripts to prefer repo-root files and fall back to legacy `devflow/roadmap/*` files when present

Migration note:

- new roadmap runs should write repo-root `ROADMAP.md` and `BACKLOG.md`
- helper scripts still read legacy `devflow/roadmap/*` files as fallback, but the canonical path is now the repo root
- if you maintain automation that parses the `Implementation Tracking` table, account for the new `Depends On` column before `Status`

## v2.2.0 - 2026-04-17

- convert public frontmatter from loose prose into structured harness contract fields: `triggers`, `reads`, `writes`, `entry_gate`, `exit_criteria`, `reroutes`, `recovery_modes`, `tool_budget`
- add `Harness Contract` to `SKILL.md` and `Visible State Machine` to `PLAYBOOK.md`
- make roadmap explicitly skill-first: strategy stays in skill text and artifacts instead of hidden harness behavior

Migration note:

- any downstream tooling that only read `name` and `description` can keep working, but new registry consumers should prefer the structured contract fields
- roadmap users do not need to change existing `ROADMAP.md` / `BACKLOG.md` files; the new contract only makes the operating rules explicit

## v2.1.0 - 2026-04-15

- 增强 frontmatter `description`，补充中英文触发词，提升命中率。
- 新增 `Quick Start` 和 `Route Selection Rule`，把首次路线判断前置成更易执行的入口。
- 新增 `Recommendation Test`，要求推荐必须同时说明“为什么选它”和“为什么不先做另外两条”。
- 升级 `ROADMAP_TEMPLATE.md`，增加 `Recommended Route` 区块。
- 升级 `BACKLOG_TEMPLATE.md`，让 ready 项显式写清“为什么现在 ready”。

Migration note:

- 旧版 `ROADMAP.md` / `BACKLOG.md` 可以继续使用；建议在下次重跑 roadmap 时补齐 `Recommended Route` 和 ready rationale，以减少后续 `cc-plan` 阶段的解释成本。

## v2.0.0 - 2026-04-10

- 增加 `version` frontmatter，并定义 roadmap skill 的 semver 规则。
- 强化 `Context Sweep`，要求先读取现有 roadmap、文档、最近提交、forcing functions，再开始追问。
- 增加 `Approval Gates` 与 `Review Loop`，避免没有证据、没有退出信号的伪路线图。
- 升级 `ROADMAP_TEMPLATE.md`，加入 metadata、context snapshot、evidence ledger、route options、dependencies、kill signal、版本差异记录。
- 升级 `BACKLOG_TEMPLATE.md`，让事项带上 evidence、dependency、next decision、ready 状态。
- 新增 `scripts/bump-skill-version.sh`，用于递增 skill 版本并同步 changelog。

Migration note:

- 旧版 `ROADMAP.md` / `BACKLOG.md` 仍可继续使用，但建议补齐新模板里的 metadata、evidence、dependencies、kill signal、ready 字段。
- `Implementation Tracking` 表保持兼容，`scripts/sync-roadmap-progress.sh` 无需修改。

## v1.0.0 - 2026-04-10

- 初始版 roadmap skill，提供基础路线图和 backlog 产物。
