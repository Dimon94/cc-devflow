---
name: cc-review
version: 2.14.0
description: >-
  Evidence-backed review for plans, diffs, PRs, complexity hotspots, and
  structural maintainability risk.
triggers:
  - 深度 review 这个方案
  - review 这个 bug 修复
  - 做一次 cc-review
  - deep review this plan
  - review this implementation deeply
  - complexity analysis report
  - hardening specialist review
  - run cc-review
reads:
  - PLAYBOOK.md
  - references/review-methods.md
  - references/checklist-contract.md
  - ../cc-dev/references/domain-context-contract.md
  - ../cc-dev/references/user-choice-output-protocol.md
  - ../task-contract/SKILL.md
  - ../quality-gate-contract/SKILL.md
  - ../postmortem/SKILL.md
writes:
  - path: current response
    durability: ephemeral
    required: true
  - path: devflow/changes/<change-key>/task.md
    durability: durable
    required: false
    when: plan review changes the task contract or an eligible review escape is recorded
entry_gate:
  - "Classify: plan, implementation, PR, mixed, or report-only."
  - "Read relevant `CONTEXT.md`, `CONTEXT-MAP.md`, and ADRs through `../cc-dev/references/domain-context-contract.md` before findings."
  - "Read only evidence needed for the requested scope."
  - "Use Git/current diff as durable review memory; create no process files."
  - "Select extra facets only from the table below."
exit_criteria:
  - "Findings are severity ordered and backed by source evidence."
  - "Every finding has evidence, impact, recommendation, and route: cc-plan, cc-do, cc-check, cc-act, or stop."
  - "Plan findings write task.md; implementation findings ask for repair choice before edits."
  - "Domain context growth was checked before exit; confirmed updates were written to `CONTEXT.md`, `CONTEXT-MAP.md`, or `docs/adr/*.md`, while ADR conflicts or deferred updates were surfaced as findings, residual risk, or `task.md` updates."
  - "Selected facets are checked, skipped, or blocked."
  - "No process file was created."
reroutes:
  - when: Plan assumptions, scope, architecture, or DX contracts are wrong.
    target: cc-plan
  - when: Implementation findings require code, test, docs, UI, logs, or PR text changes.
    target: cc-do
  - when: Review is clean and only fresh verification remains.
    target: cc-check
---

# CC-Review

## Quick Start

All paths below are relative to this `SKILL.md` directory, not the shell cwd.

1. Always read `references/review-methods.md` and `references/checklist-contract.md`.
2. Read `PLAYBOOK.md` only for complex or mixed reviews.
3. Read applicable domain context and ADRs, classify, freeze scope, inspect evidence, emit findings, then route.
4. Review Escape Ledger is only for repeatable and preventable process-escape / test-escape / design-escape / model-pattern-escape; ordinary findings do not enter `task.md#Failure Ledger`.

## Facet Loading

| Load | When |
| --- | --- |
| `../quality-gate-contract/SKILL.md` | shared review severity, advisory handling, and review escape semantics |
| `../cc-dev/references/domain-context-contract.md` | before findings, ADR conflict checks, or context growth proposals |
| `references/plan-review-branch.md` | plan, task.md, docs, issue, architecture, or scope |
| `references/implementation-review-branch.md` | code, tests, docs, or PR diff |
| `references/structural-quality.md` | maintainability, smell, thin wrapper, busy branch, wrong-layer logic |
| `references/hardening-specialists.md` | auth, secrets, untrusted input, telemetry, release, deploy, test trust |
| `references/productization-surfaces.md` | demo-to-product, API, agent docs, audit, admin UI, feature flag, operator path |
| `references/e2e-and-plugin-verification.md` | UI, runtime, plugin, viewport, or browser evidence risk |
| `references/complexity-*.md` | scan/report, repeated scans, large inputs, N+1, O(n^2), hot paths |

## Output

1. Target: review type and selected facets.
2. Findings: severity ordered, evidence-backed, with impact, fix, and route.
3. Branch Chain: use the label table in `review-methods.md` for non-trivial findings.
4. Repair options: required before implementation edits.
5. Residual risk and route: tests, runtime, docs, evidence gaps, then `cc-plan`, `cc-do`, `cc-check`, `cc-act`, or `stop`.
