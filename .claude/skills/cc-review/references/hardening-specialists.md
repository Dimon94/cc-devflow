# Hardening Specialists

Use this reference when `cc-review` sees production hardening risk. These are
conditional lenses, not standalone workflows and not a finding quota. Select
only specialists whose risk is present in the current plan, diff, PR, or user
request.

## Shared Rules

1. Freeze scope first: what surface is being reviewed, what is explicitly out
   of scope, and which specialist lenses are selected.
2. Every selected specialist ends as `checked`, `skipped:<reason>`, or
   `blocked:<missing evidence>`.
3. Report findings only when there is concrete evidence: code, diff, config,
   test, log, command output, UI flow, deployment truth, or missing required
   evidence for the reviewed scope.
4. Findings must name impact, proof path, smallest safe fix, and route.
5. Do not turn a specialist into compliance theater. If the reviewed app does
   not have that surface, skip it with reason.
6. Do not introduce stack mandates. Prefer the repo's existing auth, logging,
   metrics, validation, test, deploy, and feature-flag patterns.
7. Do not create audit reports, microsites, dashboards, or process files during
   review. Return findings in the normal `cc-review` output or write eligible
   plan/investigation findings into `task.md`.

## Hardening Proof Protocol

Use this protocol for every selected specialist. It is the shared shape behind
security, observability, release-readiness, and test-strategy review.

1. Surface map: name the reviewed routes, jobs, webhooks, providers, files,
   configs, UI/admin flows, migrations, test suites, release path, or missing
   evidence. Do not review an unnamed surface.
2. Risk gate: classify each real issue as `must-fix-before-release`,
   `should-fix-soon`, or `accepted/deferred-risk`. The gate must follow impact
   and exploit/failure likelihood, not the amount of prose available.
3. Existing controls: state what already protects the surface, what is absent,
   and whether the absence is acceptable for the current product shape.
4. Proof path: name the test, command, smoke, screenshot, log/event, dashboard,
   dependency audit, or manual path that proves or would prove the control.
5. Skips and blockers: skipped specialists need a reason tied to scope; blocked
   specialists need the missing evidence or environment.
6. Residual risk: every specialist closes with what remains uncertain after the
   current evidence.

Do not say an app is secure, observable, ready to ship, or well tested. Say what
scope was reviewed, which gates passed, which were skipped or blocked, and what
risk remains.

## Specialist Selection

| Specialist | Select when current scope touches |
| --- | --- |
| `security-hardening` | auth, roles, sessions, API keys, secrets, user input, file upload/download, SSRF/network egress, webhooks, admin tools, CORS/CSRF, rate limits, dependency risk, sensitive logging |
| `observability-hardening` | opaque failures, long-running operations, queues/jobs, provider calls, boot/deploy failures, structured logs, request IDs, traces, metrics, dashboards, alerting, user-visible status |
| `release-readiness-hardening` | env/runtime config, migrations, deploy path, health/readiness, smoke tests, rollback, feature flags/kill switches, staging/production verification, post-deploy monitoring |
| `test-strategy-hardening` | broad test-suite trust, flaky/skipped/slow tests, missing contract/regression tests, overmocking, low-value snapshots, missing e2e/visual/smoke coverage |

For broad "productionize this app" review, run the specialists above and
`productization-surfaces.md` as separate facets. If the ask requires building
product services such as audit logs, API keys, OpenAPI, admin UI, or feature
flags, route to `cc-plan` or `cc-do`; do not implement from the review pass.

## Security Hardening

### Checks

- Auth/session: session creation, renewal, revocation, cookie flags, token
  lifetime, and server-side role enforcement.
- Permission boundaries: every meaningful server mutation and sensitive read
  has an authorization story; client-only hidden checks do not count.
- API keys and tokens: scope, storage, encryption/secret handling, rotation,
  revocation, auditability, and rate-limit identity.
- Input validation: body, query, path, webhook, provider, file metadata, and
  external payloads are validated before side effects.
- SSRF/network: URL parsing, protocol allowlist, private IP/localhost blocking,
  redirect handling, timeout, and size limits.
- File upload/download: MIME sniffing, extension checks, size limits, path
  traversal, storage prefix, and public/private access boundary.
- Web security: CORS, CSRF, unsafe methods, origin checks, security headers,
  and cookie/session defaults.
- Abuse limits: auth, public, webhook, upload, expensive AI/provider, and API
  routes have appropriate rate limits or an explicit single-instance defer.
- Secrets and logs: no secrets, tokens, cookies, auth headers, raw private
  content, stack traces, or provider raw payloads leak to client bundles, logs,
  screenshots, analytics, fixtures, or generated artifacts.
- Dependencies: package audit, suspicious lockfile additions, postinstall/build
  scripts, known CVEs, abandoned critical packages, and license risk when
  relevant.

### Finding Proof

A security finding should include:

- reviewed attack surface
- vulnerable boundary and actor
- exploit or bypass sketch
- current missing control
- risk gate: `must-fix-before-release`, `should-fix-soon`, or
  `accepted/deferred-risk`
- smallest behavior-preserving fix
- focused test or verification path
- residual risk after the fix

Do not write "make it secure" or "add auth" without naming the exact mutation,
read path, trust boundary, or secret path.

## Observability Hardening

### Checks

- Correlation: request ID, operation ID, job ID, provider run ID, or equivalent
  identifier flows through the reviewed path.
- Structured logs: critical operations log start, success, failure, duration,
  route/action, status, retry count, and safe identifiers.
- Error model: typed error classes or safe error envelopes distinguish user,
  validation, auth, provider, timeout, rate-limit, and internal failures.
- Metrics: latency, error rate, throughput, retry count, queue time, timeout,
  cancellation, cache, token/cost, and provider/model labels where relevant.
- Traces/stage history: multi-step operations can be followed from user action
  to route/job/provider and back.
- User/admin visibility: long-running or retryable workflows show honest
  progress, elapsed time, retry, cancel/timeout, and final failure state.
- Privacy and redaction: no raw private content, prompts, secrets, tokens,
  cookies, auth headers, or unbounded payloads are logged by default.
- Debug surfaces: dashboards, saved log queries, admin/dev views, or runbook
  links answer real incident questions without generating noise.
- Validation: success, failure, retry, cancel, and timeout paths emit distinct,
  correlated, non-duplicated telemetry.

### Finding Proof

An observability finding should include:

- reviewed operation or journey
- incident question that cannot be answered today
- missing signal or broken correlation point
- privacy/redaction constraint
- risk gate: `must-fix-before-release`, `should-fix-soon`, or
  `accepted/deferred-risk`
- proposed event/log/metric/span shape
- smoke or failure-path verification
- residual blind spot

Do not recommend generic "add logging"; name the stage, event, fields, and
redaction rule.

## Release Readiness Hardening

### Checks

- Git/release state: intended branch, dirty files, version/changelog/package
  surfaces, CI status, and PR/release target are clear.
- Local gates: typecheck, lint, unit, build, focused integration, e2e/visual,
  or domain verifier are required according to touched surfaces.
- Environment: required env vars are documented and validated at startup with
  clear errors; production-only config does not fail late.
- Migrations/data: forward/backward compatibility, locking, rollback, backup,
  idempotency, and migration ordering are reviewed.
- Deploy path: preview/staging/production command, platform config, artifact,
  health/readiness check, and provider dependency checks are explicit.
- Feature flags and kill switches: risky new behavior has rollout, disable, or
  fallback control when needed.
- Smoke tests: production-shaped smoke creates nonpermanent records, verifies
  critical routes/auth/persistence/providers, then cleans up and proves no
  residue.
- Rollback: code, config, data, and feature-flag rollback paths are concrete.
- Post-deploy: logs, metrics, dashboards, 4xx/5xx spikes, provider failures,
  boot errors, and watch items are checked or explicitly blocked.

### Finding Proof

A release-readiness finding should include:

- reviewed release surface
- release gate that is missing, stale, or impossible to prove
- concrete release failure mode
- affected deploy/migration/config path
- risk gate: `must-fix-before-release`, `should-fix-soon`, or
  `accepted/deferred-risk`
- required gate or rollback fix
- command or smoke evidence needed
- accepted risk if deferred

Do not declare "ready to ship" if required gates are skipped without owner,
reason, and risk.

## Test Strategy Hardening

### Confidence Per Minute Protocol

Test strategy review optimizes confidence per minute, not raw coverage count.
Use this protocol when reviewing broad suite trust or changed testing surfaces:

1. Inventory commands, frameworks, e2e/visual harnesses, fixtures, mocks,
   snapshots, CI config, coverage tooling, and approximate runtime.
2. Classify suites by layer: pure unit, contract/schema, integration,
   e2e/browser, visual, smoke, load/perf, migration/data, and release.
3. Record current status: pass, fail, flaky, skipped, quarantined, network-bound,
   order-dependent, slow, or blocked.
4. Judge proof value: name which real bug, regression, product contract,
   critical journey, external/provider parse, migration, permission, or failure
   mode each important suite would catch.
5. Flag low-value tests: broad snapshots, duplicate happy paths, brittle
   implementation assertions, no-op smoke tests, overmocked internals, tests
   whose names promise more than their assertions prove, and fixtures that hide
   coupling.
6. Recommend the smallest suite shape: fast local default, focused
   changed-surface commands, high-signal e2e golden paths, release smoke, and
   optional nightly/heavy checks.
7. Slow valuable tests are not automatically bad. Keep them, but move them to an
   explicit suite if they block normal developer feedback.

### Checks

- Inventory: unit, typecheck, lint, build, integration, e2e, visual, smoke,
  coverage, migration/data, and release suites are known with commands.
- Runtime: cold/warm runtime, slow suites, retries, sleeps, and blocking normal
  developer feedback are identified when the review scope is suite-level.
- Flake/skips: skipped tests, quarantines, retries, network dependencies,
  date/time/timezone/locale/randomness, and order dependence are visible.
- Fixtures: size, ownership, determinism, hidden coupling, casts, partial
  objects, generated stubs, and stale golden artifacts are honest.
- Mocks: mocks sit at true system boundaries; internal module mocks do not hide
  contract failures.
- High-value coverage: API request/response contracts, provider parsing/retry,
  state/schema migrations, auth/permissions, critical create/edit/delete
  flows, and past regressions are covered where relevant.
- Failure states: error, empty, loading, cancel, timeout, retry, permission
  denied, single-item, duplicate, concurrency, and boundary values are covered
  when behavior depends on them.
- Browser/visual: user-visible UI changes have mobile, desktop, tablet, and
  wide viewport coverage or a stated gap.
- Dedupe/removal: duplicated happy paths, broad snapshots, implementation-only
  assertions, no-op smoke tests, and tests that would pass during user-visible
  breakage are flagged.

### Finding Proof

A test-strategy finding should include:

- reviewed suite or behavior layer
- behavior or contract currently unprotected
- why existing tests do not catch the failure
- minimal high-signal test shape
- fixture/mock boundary requirements
- confidence-per-minute argument: what bug the suite would catch relative to
  runtime and maintenance cost
- risk gate: `must-fix-before-release`, `should-fix-soon`, or
  `accepted/deferred-risk`
- expected suite command and runtime impact
- whether to keep, rewrite, delete, or quarantine affected tests

Do not equate raw coverage percentage with confidence. The question is what bug
the suite would catch that it used to miss, and whether it is worth its runtime
and maintenance cost.

## Specialist Output Shape

When specialists are selected, include this information inside the normal
`cc-review` output:

```text
Hardening specialists:
- surface-map: <routes/jobs/providers/configs/suites/release path reviewed or blocked>
- security-hardening: checked | skipped:<reason> | blocked:<missing evidence>
- observability-hardening: checked | skipped:<reason> | blocked:<missing evidence>
- release-readiness-hardening: checked | skipped:<reason> | blocked:<missing evidence>
- test-strategy-hardening: checked | skipped:<reason> | blocked:<missing evidence>
- residual-risk: <remaining uncertainty after evidence>
```

Findings still come first and stay ordered by severity. The specialist list is
only coverage evidence, not a separate report.
