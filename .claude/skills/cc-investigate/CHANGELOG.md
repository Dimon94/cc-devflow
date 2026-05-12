# CC-Investigate Skill Changelog

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
