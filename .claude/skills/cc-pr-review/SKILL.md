---
name: cc-pr-review
version: 1.8.0
description: >-
  Use in a separate session to review one remote GitHub PR before landing,
  including PR-scoped complexity, hardening, and productization risk, without
  writing local process files.
triggers:
  - review 这个 PR
  - 单独会话 review PR
  - review remote PR
  - pre-landing PR review
  - PR 复杂度专项 review
  - PR hardening review
  - PR production readiness review
reads:
  - PLAYBOOK.md
  - ../cc-review/SKILL.md
  - ../cc-check/SKILL.md
  - ../cc-review/references/hardening-specialists.md
  - ../cc-review/references/productization-surfaces.md
  - GitHub pull request
  - devflow/changes/<change-key>/task.md
  - devflow/changes/<change-key>/handoff/pr-brief.md
  - references/checklist-contract.md
  - references/pr-review-chain.md
  - references/complexity-optimization-playbook.md
  - references/complexity-report-template.md
  - scripts/analyze_complexity.py
writes:
  - path: GitHub pull request comments or review
    durability: remote
    required: false
    when: remote review feedback is posted
---

# CC-PR-Review

## Quick Start

All paths below are relative to this `SKILL.md` directory, not the shell cwd.

1. Read `references/checklist-contract.md` and `PLAYBOOK.md`.
2. Freeze live PR title, body, commits, head/base, checks, linked issues, and diff.
3. Read linked `task.md` and `pr-brief.md` when a change key exists.
4. Select only facets triggered by PR diff, PR body, linked task, or missing proof.
5. Return verdict and findings in the response or GitHub review only.

## Facet Loading

| Load | When |
| --- | --- |
| `references/pr-review-chain.md` | non-trivial finding, label table, cognitive layers, upstream/downstream chain |
| `references/complexity-*.md`, `scripts/analyze_complexity.py` | loops, rendering, repeated scans, database/API iteration, large inputs, hot paths |
| `../cc-review/references/hardening-specialists.md` | security-hardening, observability-hardening, release-readiness-hardening, test-strategy-hardening |
| `../cc-review/references/productization-surfaces.md` | Productization surface: API/agent docs, audit, admin, feature flags, idempotency, operator paths |

For selected hardening/productization facets, close each as `checked`,
`skipped:<reason>`, or `blocked:<missing evidence>`. Findings name reviewed surface, risk gate, proof path, residual risk, smallest safe fix, and route.

## Entry Rules

- Review remote PR reality; do not merge, push main, or write local process files.
- Scanner output is only a lead; accepted complexity findings cite PR diff or checked-out file lines.
- Changed public API contracts without proof tests are landing blockers; use `PLAYBOOK.md`.
- Missing evidence becomes `needs-clarification` or `blocked`, not a guessed bug.

## Default Output

1. Verdict: `approved-for-landing`, `changes-requested`, `needs-clarification`, or `blocked`.
2. Evidence: PR diff, checks, task facts, command output, or missing proof.
3. Findings: severity ordered with file/line or PR hunk, evidence, diagnosis, and route.
4. PR Review Chain: use the Label table in `references/pr-review-chain.md` for non-trivial findings.
5. Complexity: checked, skipped with reason, blocked, or findings.
6. Hardening/productization: selected facets checked, skipped, blocked, or findings.
7. Route: `cc-pr-land`, `cc-dev`, `cc-review`, or `stop`.

## Exit Criteria

- Verdict is explicit.
- Findings cite concrete PR evidence or missing-evidence proof.
- Selected facets are closed as checked, skipped, or blocked.
- Required fixes route to `cc-dev` or `cc-do`; clean PRs route to `cc-pr-land`.
- No local process file is created.
