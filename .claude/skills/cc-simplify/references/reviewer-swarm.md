# Reviewer Swarm

Use this reference when `cc-simplify` dispatches read-only reviewers or runs the
same review dimensions in the main thread.

## Dispatch Rules

- Claude Code: use available `Task` / subAgent support.
- Codex App / Codex tools: prefer a built-in `explorer` read-only agent.
- If only `default` exists, the prompt must say read-only review, no edits.
- Do not depend on repo-local `.codex/agents/*.toml` for the core flow.
- Each reviewer receives the same scope packet: repo root, complete diff,
  relevant task/spec paths, current verification evidence, and its dimension.
- Reviewers never edit files and never write reports.
- Small diffs still get at least one combined reviewer when the host supports
  subagents.
- Specialists are conditional; do not start them for completeness.

Fallback: if no subagent tool is available or allowed, run these dimensions in
the main thread and report `Agents used: no (subagent tool unavailable)`.

## Prompt Contract

```text
你是 cc-simplify 的只读评审智能体。不要编辑文件。
输入：repo root、完整 diff、相关任务/spec 路径、你的评审维度。
输出：每行一个 finding；没有发现时只输出 NO FINDINGS。
没有证据的猜测不要输出为 finding。
```

Finding line shape:

```text
severity | confidence | file:line | category | evidence | fix | route
```

Required fields: `severity`, `confidence`, `file:line`, `category`,
`evidence`, `fix`, and `route`. Confidence is 1-10; findings below 5 cannot
enter the automatic fix list.

## Default Reviewers

### Agent A: Spec / Scope

Goal: confirm implementation still matches the frozen requirement boundary.

Check:

- missing task requirements
- extra unrequested behavior
- behavior, boundary, or invariant drift without `task.md` or spec sync
- bug fixes disguised as requirements, or requirements disguised as cleanup
- reroute need: design drift to `cc-plan`, invalid root cause to
  `cc-investigate`, verification gap to `cc-check`

### Agent B: Reuse / Structure

Goal: delete duplication and meaningless abstraction.

Check:

- new helpers duplicating existing helper, utility, shared module, or nearby
  pattern
- hand-written path parsing, string parsing, env detection, type guard, schema
  validation, or error wrapping where a local canonical helper exists
- copy-paste with slight variation
- parameter sprawl instead of a clearer input object or split responsibility
- boundary leaks where callers know internals, file layout, protocol detail, or
  test-only mechanism
- current diff causing a file to take multiple responsibilities
- shallow wrappers whose interface complexity equals implementation complexity
- hypothetical seams with one adapter and no concrete second caller
- deep-module opportunities where a small interface can hide repeated call
  order, error handling, config, or state transformation

### Agent C: Quality / Efficiency / Test

Goal: find maintenance or runtime cost created or amplified by this diff.

Check:

- redundant state, derived cache, duplicate truth source, useless observer/effect
- startup, request, render, polling, or event hot-path work
- repeated IO, network/API calls, N+1, or whole-file read for local data
- missed concurrency for independent reads, searches, requests, or checks
- redundant updates where no real state changed
- TOCTOU check-then-act where direct operation plus error handling is simpler
- unbounded arrays/maps/caches, listener leaks, or timer leaks
- tests that assert mocks, add test-only production methods, overmock effects,
  omit real response fields, fail to prove regression catch, miss error/empty/
  permission/concurrency paths, share global state, depend on time/locale/random
  data without seed, assert unordered results in order, or use brittle timeouts

## Conditional Specialists

Load only when the diff touches the surface:

- `security`: auth/backend changes, user input, file paths, command execution,
  HTML escape hatches, tokens, secrets
- `api-contract`: endpoint, request/response fields, status codes, auth
  requirements, pagination, OpenAPI/SDK docs
- `release`: VERSION, CHANGELOG, release scripts, CI artifact, tag format,
  publish idempotency
- `frontend-performance`: render loops, list lookup, repeated style injection,
  bundle/lazy-loading boundary

If any specialist finds `critical`, run one Red Team read-only pass for missed
cross-boundary failure modes. Red Team must not repeat existing findings.
