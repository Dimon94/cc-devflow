# CC-Plan Skill Changelog

## v3.10.1 - 2026-05-13

- simplify the planning artifact contract to `task.md` plus Git history
- remove old process-file filename lists from entry gates, playbook rules, and task templates

## v3.9.4 - 2026-05-13

- require task blocks to be written directly from `assets/TASKS_TEMPLATE.md`; shorthand TODO tasks are invalid and rejected before machine JSON generation
- clarify that task document budgets are advisory only and must not cause deletion of root-cause, boundary, verification, evidence, completion, or required task fields

## v3.9.3 - 2026-05-13

- route all deterministic workflow commands through the shared `resolve-cc-devflow.sh` CLI resolver before writing durable artifacts
- block old global CLIs and adapter-only entrypoints when `query workflow-context`, `task-contract`, `next-change-key`, or `review` are unavailable
- update generated task templates so `task-manifest.json` and `change-meta.json` are compiled by a capability-checked CLI instead of PATH luck

## v3.9.2 - 2026-05-13

- make CLI-owned machine artifacts a hard rule: AI writes `planning/tasks.md`, then runs `cc-devflow task-contract compile` / `validate` for `task-manifest.json` and `change-meta.json`
- forbid hand-authored process JSON and require CLI / template / validator fixes when machine-state structure changes
- internalize planning operating rules: assumptions first, smallest reversible scope, explicit conflict choice, intent-focused verification, and CLI-owned deterministic state
- keep the thin entrypoint budget under the existing `cc-plan` limit while preserving the planning contract

## v3.9.1 - 2026-05-13

- slim the public `SKILL.md` entrypoint into a thin harness contract focused on branch safety, artifact ownership, density switching, and completion gates
- move low-frequency deep planning, review, postmortem, and external-best-practice details behind conditional `PLAYBOOK.md` / `references/*` escalation instead of default context
- keep `planning/tasks.md`, lean `task-manifest.json`, `change-meta.json`, and `workflow-context --compact` as the durable execution contract

## v3.9.0 - 2026-05-13

- collapse the default planning artifact surface to `planning/tasks.md` plus CLI-generated `task-manifest.json` and `change-meta.json`
- move the human-authored design contract into `planning/tasks.md#Contract Summary` so `planning/design.md` is legacy fallback only
- archive legacy design templates under `assets/legacy/` and keep new task handoffs rooted in `assets/TASKS_TEMPLATE.md`
- ban generated execution process files from new task plans: no `context.md`, `checkpoint.json`, review markdown, or AI-written process notes under `execution/tasks`

## v3.8.7 - 2026-05-13

- add the Worktree Branch Contract so new `REQ` / `FIX` planning anchors detached worktrees to `REQ/<task>` or `FIX/<task>` before artifacts are written
- treat planning on `main` / the default branch as a setup blocker instead of allowing the main checkout to accumulate feature state
- require design, tasks, and change metadata to record the canonical work branch for downstream `cc-do`

## v3.8.6 - 2026-05-12

- require generated execution handoffs to start from `cc-devflow query workflow-context` so progressive disclosure is runtime-derived, not chat memory
- make the compact context packet the default bridge from planning into `cc-do`, `cc-check`, and `cc-act`
- keep deep planning sections available only behind explicit open conditions such as scope drift, scheduling conflict, recovery, or delivery

## v3.8.5 - 2026-05-11

- add the Project Postmortem Recall Gate so plans search `devflow/postmortems` before freezing direction
- update design and task templates to record matching incidents, generalized principles, Git evidence, and concrete task impacts
- require postmortem matches to become scope, test-seam, verification, file-boundary, or review guardrails instead of chat-only reminders

## v3.8.4 - 2026-05-11

- add the Deep Planning Funnel so `cc-plan` must confirm requirement reality, system shape, interface/data contracts, abstraction boundaries, execution architecture, task contracts, and final approval before task generation
- update full-design, tiny-design, and tasks templates so confirmed architecture, methods, fields, categories, failure paths, source funnel rounds, and task grain survive as durable execution handoff without bloating the manifest
- require every generated task to carry a task contract with do-not-re-decide items and artifact updates instead of relying on chat memory or loose TODO titles

## v3.8.3 - 2026-05-11

- slim `task-manifest.json` back to execution graph truth instead of duplicating `planning/design.md` and `planning/tasks.md`
- retire manifest-only narrative/protocol/status mirrors: top-level `status`, `activePhase`, `sourceRoadmap`, `spec`, `executionProtocol`, `planningMeta.requirementBrief`, `planningMeta.ambiguityGate`, `planningMeta.reviewLoop`, `sourceEvidence[]`, `languageAndDecisions`, `executionDiscipline`, and task-level `completion`
- keep roadmap/spec state in `change-meta.json` and `devflow/roadmap.json`, task completion commands in `planning/tasks.md`, and execution graph state in `task-manifest.json`
- add progressive disclosure indexes to design and task templates so lower-frequency context is opened only when needed

## v3.8.2 - 2026-05-10

- require `cc-plan` to generate executable tasks from the bundled task template instead of loose Markdown checklists
- add a durable execution protocol for ClaudeCode and Codex so ready-task selection and task completion are script-driven
- require task manifests to record template compliance and `mark-task-complete.sh` commands so task status is not hand-edited or forgotten

## v3.8.1 - 2026-05-09

- add the AI Leverage Decision Lens before approach approval so plans must name the real user/operator, current workaround, human-vs-agent effort, complete-lake boundary, ocean boundary, scope recommendation, cost model, and boil-lake/sharp-wedge/needs-evidence/pivot verdict
- update full-design, tiny-design, tasks, manifest, and planning contract templates so AI-era completeness is a durable handoff instead of chat-only advice

## v3.8.0 - 2026-05-09

- change key assignment now uses `cc-devflow next-change-key` script instead of LLM mental arithmetic
- add `scripts/next-change-key.sh` as local fallback when CLI is unavailable
- fixes reliability gap where Claude models could not reliably scan directories and increment numbers

## v3.7.9 - 2026-05-08

- add an opt-in External Best-Practice Validation gate before approach approval
- require generalized search terms, user approval, source trust classification, repo-fit verdicts, and explicit skip reasons
- update design, tiny-design, tasks, and manifest templates so the validation result is durable handoff instead of chat-only context

## v3.7.8 - 2026-05-08

- require decision-question options to use `A` / `B` / `C` letter labels instead of numeric `1` / `2` / `3` labels
- clarify that `D1` / `D2` are question identifiers, while answer options remain lettered

## v3.7.7 - 2026-05-08

- treat the full `REQ/FIX-<number>-<description>` change key as identity so duplicate numbers from parallel worktrees are valid
- stop requiring local planning to resequence or rename changes solely because another worktree used the same numeric suffix
- make runtime path resolution fail clearly when a bare `REQ/FIX-<number>` is ambiguous and no explicit `changeKey` was supplied

## v3.7.6 - 2026-05-06

- add a fixed Decision Question Protocol so user-facing planning gates use numbered questions, recommendations, options, impact, and STOP instead of free-form prose
- record required user decisions in `planning/design.md` and `task-manifest.json.planningMeta.decisionQuestions`
- update design, tiny-design, manifest, and example bindings for the new decision-question contract

## v3.7.5 - 2026-05-06

- absorb the external TDD skill's interface-testability details into native planning: injected dependencies, returned results, concrete boundary operations, and small-interface/deep-implementation checks
- require Red task handoff to include spec-style test names, one logical behavior, public verification paths, and no bulk Red slices
- update design, tiny-design, tasks, and manifest templates with Green minimality guards and concrete refactor candidate fields

## v3.7.4 - 2026-05-06

- clarify that `REQ-*` and `FIX-*` are independent numbering namespaces, so the same numeric suffix can exist under both prefixes
- require new `REQ` numbers to increment from existing `REQ-*` directories and new `FIX` numbers to increment from existing `FIX-*` directories

## v3.7.3 - 2026-05-06

- add PRD-grade requirement brief fields to `cc-plan` design and execution handoff
- require user-perspective problem / solution, user stories, implementation decisions, testing decisions, out-of-scope, and further notes to live inside `planning/design.md` instead of a new `PRD.md`
- add `planningMeta.requirementBrief` to the manifest template and refresh example artifacts for `cc-plan@3.7.3`

## v3.7.2 - 2026-05-06

- add a Roadmap Sync Gate so approved planning runs must reconcile the source RM before handing off to `cc-do`
- document `locate-roadmap-item.sh` and `sync-roadmap-progress.sh` as the canonical way to update `devflow/roadmap.json` and regenerate `ROADMAP.md` / `BACKLOG.md`
- update design, tiny-design, tasks, and manifest templates with roadmap sync status fields

## v3.7.1 - 2026-04-29

- add ambiguity, review loop, source evidence, and external document conflict contracts
- update design, tiny-design, tasks, and manifest templates so `cc-do` receives trust and ambiguity gates as machine-readable handoff
- require external text to stay evidence-only unless it is promoted through repo-native contracts

## v3.7.0 - 2026-04-28

- add glossary delta capture for canonical terms, aliases to avoid, ambiguities, and relationship constraints during context sweep
- require non-trivial public interfaces to compare deliberately different shapes before freezing the final seam
- mark vertical slices as `AFK` or `HITL` and require durable design / issue handoffs to describe behavior contracts instead of stale file paths

## v3.6.2 - 2026-04-28

- clarify that canonical language and durable decisions come from cc-devflow native sources: `devflow/specs/`, roadmap/backlog handoff, planning design/analysis, and change metadata
- remove external context/architecture-decision files from the standard planning contract so they are not implied as generated artifacts
- route long-lived decisions into capability spec deltas, roadmap/backlog decision notes, or the current design decision log

## v3.6.1 - 2026-04-28

- require plans to freeze public test seams, behavior assertions, mock boundaries, and feedback loop types before handing Red tasks to `cc-do`
- strengthen TDD planning so Red tasks reject implementation-detail tests, internal collaborator mocks, and fake seams
- update design, tiny-design, tasks, and manifest templates with test quality fields inherited from the TDD workflow review

## v3.6.0 - 2026-04-28

- absorb grilling-session discipline into native planning: one decision branch at a time, recommended answer with evidence, and no user questions when repo evidence can answer
- require domain language and durable decision scans before naming modules, interfaces, tests, or tasks
- add interface/deep-module checks so new public surfaces identify callers, hidden complexity, misuse risk, and alternative shapes before task split
- strengthen test-first planning around vertical tracer bullets so tasks do not become horizontal "all tests first, all implementation later" slices
- update design, tiny-design, tasks, and manifest templates with language handoff, interface shape, and vertical slice fields

## v3.5.6 - 2026-04-28

- require non-trivial plans to compare named option roles, including minimal viable and ideal architecture, before freezing a recommendation
- add implementation decision horizon and error/rescue mapping so full designs resolve implementation-time ambiguity before `cc-do`
- strengthen test-first planning with test framework evidence, coverage quality mapping, and mandatory regression tests for changed existing behavior
- add conditional UI and DX/operator gates for design completeness, interaction states, target persona, time to first value, and magic moment

## v3.5.5 - 2026-04-28

- require over-broad asks to split back into roadmap stages or separate REQ/FIX candidates before detailed planning
- clarify that `tiny-design` is a short approved design, not permission to skip the design gate
- add implementation surface mapping so file responsibilities are locked before task decomposition
- add review calibration so only build-blocking scope, ambiguity, verification, or execution issues fail the planning gate

## v3.5.4 - 2026-04-27

- require planning outputs to resolve the runtime output policy before writing `planning/design.md`, `planning/tasks.md`, or `change-meta.json`
- record `Output language` as the machine-enforced language contract while treating `agent_preferences` as advisory style input

## v3.5.3 - 2026-04-25

- require new planning change directories to use `REQ-<number>-<description>` for requirements and `FIX-<number>-<description>` for fixes
- document that legacy lowercase change directories are read-only compatibility targets, not new outputs

Migration note:

- new plans should choose a canonical `REQ-*` or `FIX-*` change key before writing `planning/` artifacts

## v3.5.2 - 2026-04-25

- make test-first execution a native planning requirement so concrete tasks default to `Red -> Green -> Refactor`
- require `planning/tasks.md` and `task-manifest.json` to expose TDD phase, failing-test evidence, refactor checkpoints, and explicit TDD exceptions
- update planning templates and contract so `cc-plan` no longer hands a non-TDD plan to `cc-do`

Migration note:

- new plans should split behavior changes into `[TEST]`, `[IMPL]`, and `[REFACTOR]` tasks or document a narrow TDD exception with replacement evidence

## v3.5.1 - 2026-04-25

- remove external tool provenance from the public skill contract so planning rules read as native `cc-plan` behavior
- keep the decision principles, discovery pressure, and engineering review gate unchanged while tightening skill self-description

## v3.5.0 - 2026-04-24

- add completeness decision principles, one-question discovery pressure, existing leverage mapping, test diagrams, failure modes, and explicit `NOT in scope` requirements
- strengthen discovery and review contracts as native `cc-plan` behavior
- strengthen planning contract and playbook so taste decisions, user challenges, and engineering review outputs land inside `planning/design.md` instead of new side documents

Migration note:

- new planning artifacts should include existing leverage, scope challenge, test diagram, failure modes, and decision classification before task generation

## v3.4.0 - 2026-04-19

- add `change-meta.json` as a required planning output so roadmap items, capability specs, and execution share one machine truth source
- upgrade design and tiny-design templates with capability handoff, invariant impact, expected spec delta, and gap change sections
- extend `task-manifest.json` and task handoff templates so `cc-do` can load capability specs without relying on chat memory

Migration note:

- new planning runs should generate `devflow/changes/<change-key>/change-meta.json`
- capability-linked roadmap items should carry one explicit `Primary capability`

## v3.3.0 - 2026-04-17

- add structured frontmatter contract fields so cc-plan is machine-readable as a skill-first harness stage
- add explicit `Harness Contract` and `Visible State Machine` sections to move stage orchestration into `SKILL.md` and `PLAYBOOK.md`
- clarify reroute and recovery behavior so design reopening happens in the skill contract instead of hidden runtime assumptions

Migration note:

- existing requirement artifacts stay valid
- registry and publish tooling now expect the structured frontmatter keys on the public skill

## v3.2.0 - 2026-04-15

- upgrade bundled templates so `DESIGN.md`, `TASKS.md`, and `task-manifest.json` teach quality by example instead of empty placeholders
- add first-read checks that make planning density and task quality obvious to the next executor

## v3.1.0 - 2026-04-15

- add stronger trigger phrases in frontmatter
- add `Quick Start` to classify planning into `clarify-first` / `tiny-design` / `full-design`
- tighten `Good Output` so the chosen planning density is explicit on first read

## v3.0.0 - 2026-04-15

- 收敛 `cc-plan` 输出模型，默认交付物只保留 `DESIGN.md`、`TASKS.md`、`task-manifest.json`。
- 把 clarification / brainstorm / review 结论并入 `DESIGN.md`，不再默认拆出独立文档。
- 把执行 handoff 并入 `TASKS.md`，不再要求 `context-package.md` 作为 planning 产物。
- 删除 `BRAINSTORM_TEMPLATE.md`、`CLARIFICATION_REPORT_TEMPLATE.md`、`PLAN_REVIEW_TEMPLATE.md`、`CONTEXT_PACKAGE_TEMPLATE.md`、`RESUME_INDEX_TEMPLATE.md`。
- 删除面向旧输出模型的 clarification 脚本引用。

Migration note:

- 旧 requirement 目录如果已有 `BRAINSTORM.md`、`PLAN_REVIEW.md`、`context-package.md`，不要继续维护同类新文件；把仍然有效的信息吸收进 `DESIGN.md` 或 `TASKS.md`。
- `resume-index.md` 不再属于 `cc-plan` 阶段产物，它属于 `cc-act` 的 handoff / closeout 工件。
- `cc-do` 的默认任务上下文现在以 `DESIGN.md` + `TASKS.md` 为主，不再默认读取 `context-package.md`。

## v2.0.0 - 2026-04-10

- 增加 `version` frontmatter，并定义 cc-plan skill 的 semver 规则。
- 强化 `Context Sweep`，要求在 planning 前显式读取上游 roadmap handoff、requirement 目录现状、代码与文档上下文。
- 增加 `Source Handoff` / `Source Alignment` 约定，保证 `roadmap -> cc-plan` 的 success signal、constraints、dependencies、non-goals 不在 handoff 时丢失。
- 升级 `BRAINSTORM.md`、`DESIGN.md`、`PLAN_REVIEW.md`、`context-package.md`、`TASKS.md`、`task-manifest.json` 模板，加入版本链和来源元数据。
- 新增 `scripts/bump-skill-version.sh`，用于递增 skill 版本并同步 changelog。

Migration note:

- 旧 requirement 目录仍可继续使用，但建议补齐 requirement version、design version、source roadmap item / version 等元数据。
- `task-manifest.json` 新增 `sourceRoadmap` 和 `planningMeta` 字段；旧消费方若只读取原有字段不会受影响。

## v1.0.0 - 2026-04-10

- 初始版 cc-plan skill，提供 requirement planning 基础工作流。
