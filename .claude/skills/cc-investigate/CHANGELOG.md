# CC-Investigate Skill Changelog

## v1.1.5 - 2026-04-28

- add a feedback-loop contract so investigations record loop type, command, symptom match, runtime, determinism, failure rate, signal specificity, and sharpening plan before freezing root cause
- require ranked candidate hypotheses before narrowing to active falsification targets, plus probe tags for cleanup-safe diagnostic instrumentation
- add performance-regression, domain/ADR context, correct-test-seam, and evidence-request fields across the analysis, task, manifest, playbook, and investigation contract templates

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
