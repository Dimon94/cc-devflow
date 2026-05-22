# CC-Investigate Skill Changelog

## v1.13.0 - 2026-05-22

- require `detect-worktree-state.sh` before FIX worktree preparation so Investigate entry uses the shared read-only worktree preflight
- clarify that submodule entry, wrong linked worktree, case collisions, and target branch mismatches are setup blockers

## v1.12.0 - 2026-05-21

- add the shared user-choice output protocol so repair-boundary questions prefer Codex `request_user_input` or Claude Code structured input before falling back to fixed A/B/C text
- require investigation solution choices to use the host-native choice protocol and then persist the selected answer in `task.md#Root Cause Contract`

## v1.11.0 - 2026-05-20

- add `task.md#Failure Ledger` to repair handoffs so real investigation and implementation failures can be filtered before incident postmortems

## v1.10.0 - 2026-05-20

- require ten-round Dialogue Checkpoints in `task.md#Root Cause Contract` so long phenomenon and repair-boundary confirmation can resume after context compression
- update the investigation contract and task template to record round ranges, decisions, rejected repair options, open questions, evidence sources, adversarial findings, and release status

## v1.9.0 - 2026-05-20

- require current-state inspection before technical-detail or solution-shape questions during investigations
- add the Investigation Socratic Dialogue Protocol so phenomenon gaps and repair decisions proceed one question at a time with recommended answers after evidence gathering
- record repo-answered facts, user-answered phenomenon gaps, hidden repair assumptions, symptom-fix challenges, adversarial review findings, and explicit repair release in `task.md#Root Cause Contract`

## v1.8.0 - 2026-05-18

- add a Default Output contract for root-cause handoff summaries without adding new process files

## v1.7.0 - 2026-05-18

- add an investigation-specific checklist contract for symptom, reproduction, hypothesis falsification, root-cause proof, repair boundary, and handoff pause points

## v1.6.5 - 2026-05-17

- require new FIX investigations to prepare an isolated worktree before writing `task.md`
- keep the main checkout bound to `main` while investigations continue in the returned `WORKTREE_PATH`

## v1.6.4 - 2026-05-17

- require ASCII branch-chain node labels and evidence text to follow `Output language` while keeping tree connector tokens ASCII
- replace hard-coded English branch-chain examples with an `en` / `zh-CN` label table and semantic slots

## v1.6.3 - 2026-05-17

- require ASCII Branch Chain Analysis in `task.md#Root Cause Contract` so investigations trace problem chains upstream to the first proven creator, solution chains through the repaired contract, and impact chains downstream to affected seams
- add prompt/provider source tracing and evidence-request handling to the investigation task template

## v1.6.2 - 2026-05-14

- restore the investigation flow that was over-pruned during artifact minimization: mode classification, feedback loop contract, evidence chain, hypothesis falsification, boundary/backward/reference evidence, diagnostic instrumentation, and correct test seam
- keep root-cause proof and diagnose-only/reroute boundaries inside `task.md#Root Cause Contract` instead of reviving analysis, manifest, or report process files
- update the task template and investigation contract so `cc-investigate` stays artifact-light without becoming a shallow bug checklist

## v1.6.1 - 2026-05-13

- simplify the investigation artifact contract to `task.md` plus Git history
- remove legacy process-file filename lists from the root-cause handoff rules

## v1.5.3 - 2026-05-13

- require repair task blocks to be written directly from `assets/TASKS_TEMPLATE.md`; shorthand TODO tasks are invalid and rejected before machine JSON generation
- clarify that task document budgets are advisory only and must not cause deletion of root-cause proof, evidence chain, repair boundary, verification, completion, or required task fields

## v1.5.2 - 2026-05-13

- route investigation workflow commands through the shared `resolve-cc-devflow.sh` CLI resolver before freezing machine artifacts
- fail closed when the available CLI lacks `query workflow-context`, `task-contract`, `next-change-key`, or `review`
- update root-cause task templates so machine JSON generation cannot fall back to simulated adapter output

## v1.5.1 - 2026-05-13

- slim the public `SKILL.md` entrypoint into a thin root-cause contract with conditional escalation packs
- make CLI-owned machine artifacts a hard rule: AI writes `planning/tasks.md#Root Cause Contract`, then runs `cc-devflow task-contract compile` / `validate` for `task-manifest.json` and `change-meta.json`
- add CLI compile support for Root Cause Contract handoffs so investigations do not require hand-authored JSON
- internalize investigation operating rules: assumptions first, evidence over guesses, explicit conflict choice, reroute spec/roadmap ambiguity, and loud Evidence Requests

## v1.5.0 - 2026-05-13

- collapse default investigation output to `planning/tasks.md` plus CLI-generated `task-manifest.json` and `change-meta.json`
- move root-cause truth into `planning/tasks.md#Root Cause Contract` so `planning/analysis.md` is legacy fallback only
- archive the legacy analysis template under `assets/legacy/` and keep repair handoffs rooted in `assets/TASKS_TEMPLATE.md`

## v1.4.3 - 2026-05-13

- add the Worktree Branch Contract so new `FIX` investigations anchor detached worktrees to `FIX/<task>` before artifacts are written
- treat investigations on `main` / the default branch as a setup blocker instead of allowing the main checkout to accumulate repair state
- require analysis, tasks, and change metadata to record the canonical work branch for downstream `cc-do`

## v1.4.2 - 2026-05-12

- require IDCA repair handoffs to be consumable by `cc-devflow query workflow-context`
- add the compact runtime reset to investigation task templates so `cc-do`, `cc-check`, and `cc-act` continue from the frozen root-cause packet instead of chat history

## v1.4.1 - 2026-05-11

- add the Project Postmortem Recall Gate so investigations search `devflow/postmortems` before final hypotheses are frozen
- update analysis and repair-task templates to connect similar incidents, principles, Git evidence, and model-risk lessons to the current root-cause table
- require recurring or same-root-cause findings to be classified explicitly instead of treated as novel bugs

## v1.4.0 - 2026-05-11

- add the Root Cause Proof Ladder so investigations must prove symptom site, first bad state, violated contract, original trigger, counterfactual proof, and escape reason before repair tasks are generated
- upgrade `planning/analysis.md`, `planning/tasks.md`, and `task-manifest.json` templates so downstream `cc-do` inherits the root-cause proof instead of re-deciding from chat
- require investigations that cannot prove first bad state, original trigger, or counterfactual proof to stop at evidence request or reroute instead of producing symptom patches

## v1.3.1 - 2026-05-11

- slim investigation task manifests so roadmap/spec status stays owned by `change-meta.json` and `devflow/roadmap.json`
- remove duplicate design/review/status mirrors from the investigation manifest template while keeping root-cause evidence in `planning/analysis.md`

## v1.3.0 - 2026-05-09

- FIX change key assignment now uses `cc-devflow next-change-key` instead of prose instructions
- fixes reliability gap where Claude models could not reliably compute the next FIX number

## v1.2.2 - 2026-05-06

- add a Roadmap Sync Gate so frozen investigations must reconcile the source RM before handing off repair work
- classify roadmap updates by `implementation drift`, `missing spec truth`, and `roadmap mismatch` outcomes
- update analysis, tasks, and manifest templates with roadmap sync status fields

## v1.2.1 - 2026-04-29

- add persistent debug session fields for active hypothesis, probes, cleanup state, and next evidence action
- add diagnose-only and workflow-forensics modes so root-cause reports do not masquerade as completed repairs
- update the analysis template with debug session, workflow forensics, and diagnose-only outcome sections

## v1.2.0 - 2026-04-28

- treat feedback loops as investigation products that must be made faster, sharper, and more deterministic before root cause freeze
- require flaky investigations to raise reproduction rate with stress, repetition, timing-window narrowing, or differential loops instead of guessing from weak signals
- add prevention handoff so confirmed root causes produce either a regression task, architecture finding, or explicit non-recorded reason

## v1.1.6 - 2026-04-28

- clarify that investigation domain language and durable decisions come from cc-devflow native sources: `devflow/specs/`, roadmap/backlog handoff, historical design/analysis, and change metadata
- remove external context/architecture-decision files from the standard investigation contract so they are not implied as generated artifacts
- route conflicts through capability specs, roadmap decisions, or historical design decisions instead of external decision-document language

## v1.1.5 - 2026-04-28

- add a feedback-loop contract so investigations record loop type, command, symptom match, runtime, determinism, failure rate, signal specificity, and sharpening plan before freezing root cause
- require ranked candidate hypotheses before narrowing to active falsification targets, plus probe tags for cleanup-safe diagnostic instrumentation
- add performance-regression, native domain/decision context, correct-test-seam, and evidence-request fields across the analysis, task, manifest, playbook, and investigation contract templates

## v1.1.4 - 2026-04-28

- add boundary-probe, backward-trace, reference-comparison, diagnostic-instrumentation, and condition-wait investigation modes for multi-component, deep-stack, similar-path, and flaky failures
- require analysis templates to record boundary matrices, caller chains, working-vs-broken comparisons, probe cleanup, root-cause class, and no-code-root-cause evidence
- update tasks and manifest templates so repair handoffs preserve the probe/trace facts that prove the confirmed root cause

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
