# CC-PR-Review Playbook

## Visible State Machine

`remote PR -> cc-pr-review -> cc-dev | cc-do | cc-pr-land | stop`

- Enter from: a remote PR URL, PR number, or `cc-dev` terminal state.
- Stay in: `cc-pr-review` until PR truth, diff intent, checks, artifacts, findings, and verdict are explicit.
- Exit to: `cc-pr-land` when approved, `cc-dev` or `cc-do` when fixes are required, or stop when blocked or unclear.

## Core Rules

1. 只 review，不 merge。
2. 先冻结 GitHub PR truth。
3. 先区分 true PR commits 和 stale base drift。
4. 先写 review packet，再写 findings。
5. finding 必须有证据。
6. 没有证据就写 unknown，不伪装成 bug。
7. 宽 diff 使用 intent/regression、security/privacy、performance/reliability、complexity/hotspots、contracts/coverage 风险 lane。
8. 触碰 auth、secret、输入、telemetry、release、测试信任或产品控制面的 PR，选择对应 hardening / productization facet；不相关时写明 skip reason。
9. subAgent reviewer 只读；主线程负责验证和去重。
10. PR head 或 checks 改了，重新 refresh。
11. 干净 PR 的下一步是 `cc-pr-land`，不是在本 skill 里顺手合并。

## Required Outputs

- PR review packet
- ASCII PR Review Chain for each non-trivial finding
- Output-language check: ASCII connectors only; labels and finding text follow the PR/task/handoff language
- Covered lanes
- Complexity hotspot coverage when the PR touches loops, rendering, repeated scans, database/API iteration, or large-input paths
- Hardening/productization facet coverage when the PR touches production risk or product control surfaces
- Findings triage
- Checks status
- Verdict
- Next gate

## PR Truth Packet

Build review from current remote truth, not stale local memory:

- live PR metadata
- true PR commits
- latest checks
- PR diff
- linked `task.md` and `handoff/pr-brief.md` when available

If PR head or checks change during review, refresh before verdict.

## Facet Selection

Select facets only from PR diff, PR body, linked task, checks, or missing proof:

- Complexity hotspot: nested scans, repeated membership/search, sort-in-loop,
  pairwise comparison, render recomputation, N+1 database/API loops, large input
  paths, or performance-sensitive shared utilities.
- Hardening specialists from `../cc-review/references/hardening-specialists.md`:
  `security-hardening`, `observability-hardening`,
  `release-readiness-hardening`, and `test-strategy-hardening`.
- Productization surface from
  `../cc-review/references/productization-surfaces.md`: shared action layer,
  programmatic API, agent docs, audit trail, admin/manageability UI, feature
  flags, idempotency, or operator paths.

For every selected facet, close it as `checked`, `skipped:<reason>`, or
`blocked:<missing evidence>`. Do not say the PR is secure, observable, ready to
ship, or productized; say which PR surfaces were reviewed and what remains
uncertain.

## Complexity Review

Complexity hotspot review is built in. It must not call or depend on an
external `complexity-optimizer` skill. Use only the local scanner and local
complexity references.

Scanner output is only a lead; accepted findings must cite the PR diff or
checked-out file lines and explain behavior-equivalence risk.

```bash
python3 <active-skill-dir>/scripts/analyze_complexity.py <repo> --format markdown
python3 <active-skill-dir>/scripts/analyze_complexity.py <repo> --format json
```

Each accepted complexity finding includes:

- current pattern
- estimated current complexity
- recommended change
- estimated complexity after
- behavior-equivalence argument
- risk level
- tests, benchmarks, or manual checks needed

## PR Review Chain

Use `references/pr-review-chain.md` for non-trivial findings, cognitive layers,
localized label table, and the upstream/downstream chain template. Do not
fabricate missing layers; mark them as missing evidence and route accordingly.

## API Contract Landing Blocker

Changed public API contracts without proof tests are landing blockers. This
includes route contracts, CLI flags, schemas, exported functions, generated
artifacts, provider prompts, package surfaces, and caller-visible behavior.

When this blocker applies, cite the PR diff hunk, the changed contract surface,
and the missing contract, regression, or caller proof. The verdict is
`changes-requested` or `blocked`; route to `cc-dev` or `cc-do` for the smallest
test and implementation repair before `cc-pr-land`.

## Finding Shape

Each accepted finding should include:

```text
- Path or PR surface:
- Issue:
- Why it matters:
- Evidence:
- Confidence:
- Complexity before/after: required for accepted complexity findings
- ASCII Branch Chain:
- Fix path:
```

Speculative or style-only comments do not block landing.
