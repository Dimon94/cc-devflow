---
name: cc-roadmap
version: 5.10.0
description: "Use when project direction must be frozen before cc-plan."
triggers:
  - "帮我定路线图"
  - "下一阶段先做什么"
  - "backlog 太乱了"
  - "项目方向散了"
  - "roadmap this project"
  - "what should we build next"
  - "reset the roadmap"
  - "prioritize the backlog"
reads:
  - "PLAYBOOK.md"
  - "CHANGELOG.md"
  - "assets/ROADMAP_TEMPLATE.md"
  - "assets/BACKLOG_TEMPLATE.md"
  - "assets/TRACKING_TEMPLATE.json"
  - "references/roadmap-dialogue.md"
  - ../cc-dev/references/user-choice-output-protocol.md
  - references/checklist-contract.md
writes:
  - path: "devflow/roadmap.json"
    durability: "durable"
    required: true
  - path: "devflow/ROADMAP.md"
    durability: "durable"
    required: true
  - path: "devflow/BACKLOG.md"
    durability: "durable"
    required: false
    when: "deprecated compatibility projection is generated for downstream readers"
  - path: "devflow/roadmap-tracking.json"
    durability: "durable"
    required: false
    when: "legacy projects are being migrated into devflow/roadmap.json"
entry_gate:
  - "Read roadmap, backlog, specs, and repo context before proposing direction."
  - "Route single requirement execution to cc-plan."
  - "Classify direction mode, evidence maturity, and independent subsystems before approval."
  - "Never decompose implementation tasks while roadmap is undecided."
  - "Run Funnel F0-F9, AI Leverage Route Lens, and Socratic approval from `references/roadmap-dialogue.md`."
  - "Use `../cc-dev/references/user-choice-output-protocol.md` for route-changing choices."
  - "If user/operator, workaround, success signal, or kill signal is missing, mark needs-evidence."
exit_criteria:
  - "Next 1-3 stages have goal, why now, dependencies, exit signal, kill signal, and non-goals."
  - "Ready backlog items can enter cc-plan with capability links, expected spec delta, and review gate hints."
  - "RM dependency graph, serial blockers, and parallel-ready work are explicit."
  - "Recommendation is user-approved and evidence-grounded."
  - "Stage 1 / ready RM items record AI Leverage verdict."
  - "Funnel Transcript is persisted in `roadmap.json`, rendered into `ROADMAP.md`, and carried into ready RM handoffs."
reroutes:
  - when: "The user is already discussing one concrete requirement, bug, or execution task."
    target: "cc-plan"
---

# Roadmap

`cc-roadmap` 只负责一件事：决定项目接下来 1-3 个阶段该推进哪几个 capability，并把现实压成能进入 `cc-plan` 的主线。

## Load Table

| Need | Load |
| --- | --- |
| Complex route, migration, recovery, runtime policy, versioning | `PLAYBOOK.md` |
| Funnel F0-F9, route lens, approval, review scans | `references/roadmap-dialogue.md` |
| Checklist before pause or exit | `references/checklist-contract.md` |
| Durable roadmap state | roadmap/backlog templates |
| Route-changing user choice | `../cc-dev/references/user-choice-output-protocol.md` |

## Flow

context sweep -> direction gate -> evidence maturity -> route lens -> funnel F0-F9 -> route approval -> write `roadmap.json` -> render projections -> review scans.

## Outputs

- `devflow/roadmap.json` is editable truth.
- `devflow/ROADMAP.md` and `devflow/BACKLOG.md` are generated projections.
- `devflow/roadmap-tracking.json` is only for legacy migration.

## Default Output

Answer with: Artifacts, Next battle, Signals, Specs, Handoff, Route (`cc-plan`, `cc-next`, or `stop`).
