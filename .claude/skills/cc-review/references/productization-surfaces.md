# Productization Surface Review

Use this reference when `cc-review` is asked to review a working demo/prototype
that needs product-shaped services: shared action layer, programmatic API,
agent surface, audit trail, admin/manageability UI, feature flags, idempotency,
or service-oriented product boundaries.

This is a review lens, not a standalone productionization workflow. It sharpens
findings and routes missing work to `cc-plan` or `cc-do`; it does not implement
services, create audit microsites, or mandate a stack.

## Selection

Select this facet when the current scope touches:

- "productionize this app", demo-to-product, product readiness, or durable
  product control surfaces
- shared action layer, command palette actions, jobs, webhooks, REST/tRPC/RPC,
  or duplicated business logic across UI and backend paths
- API keys, scopes, idempotency keys, bulk/filter endpoints, OpenAPI, public
  agent guide, or `/api/v1/skill.md`-style machine-readable docs
- audit logs, admin-only audit viewer, admin actions, actor/resource/action
  metadata, or compliance-adjacent mutation history
- admin settings, role-aware management UI, member states, capability status,
  feature flags, kill switches, rollout controls, or provider-token management

If the issue is only structural cleanup, use `structural-quality.md`. If the
issue is only auth, telemetry, release, or test-suite trust, use
`hardening-specialists.md`. Productization can select both when surfaces overlap.

## Boundary Rules

- Prefer the repo's existing stack and conventions. Do not require Postgres,
  PostHog, OpenAPI, Zod, or any specific provider when the repo has a strong
  local pattern.
- Keep UI local-first sync distinct from programmatic API semantics. They may
  share product actions, but browser sync state should not become the API
  contract by accident.
- Findings must be grounded in repo facts: routes, schemas, migrations, jobs,
  action layers, admin UI, docs, tests, config, logs, or missing required
  evidence for the reviewed scope.
- Missing product services usually route to `cc-plan` first. Use `cc-do` only
  when the requested diff already has an agreed product contract and a small
  implementation fix is obvious.
- Do not create local review reports, audit microsites, dashboards, API docs,
  or migrations during review.

## Checks

### Product Boundary

- Current scripts, deployment topology, database/schema, auth model, API routes,
  jobs, webhooks, provider integrations, frontend state, tests, docs, and dirty
  worktree are known or explicitly blocked.
- Product workflows that must remain intact are named; placeholder/demo-only
  flows are not silently treated as ready product behavior.

### Shared Action Layer

- Meaningful product mutations and reads have one canonical action boundary
  where practical.
- UI handlers, internal RPC/tRPC, REST/API routes, jobs, webhooks, and command
  palette actions do not duplicate business rules.
- Action functions have typed inputs/outputs and can enforce permissions,
  validation, audit, idempotency, and telemetry consistently.

### API And Agent Surface

- Programmatic API behavior is stateless where appropriate and does not depend
  on browser-only local state.
- API keys have scopes, owner identity, storage/revocation story, auditability,
  rate-limit identity, and clear permission mapping.
- Mutations that can be retried have idempotency behavior.
- Bulk/filter/list endpoints preserve tenant, permission, pagination, sorting,
  and missing-record semantics.
- OpenAPI, schema-derived docs, public agent guide, or equivalent machine docs
  are present when external agents or bots are part of the product contract.

### Audit Trail

- Important mutations record actor type, actor id, resource, action, result,
  timestamp, safe metadata, and request/job/API context when relevant.
- Audit entries are append-only or tamper-evident enough for the product's risk.
- Audit viewers are restricted and usable by the intended admin/operator.
- Sensitive payloads, prompts, tokens, cookies, auth headers, and raw private
  content are redacted by default.

### Admin And Manageability

- Admin/settings surfaces expose the real capability state, not just optimistic
  toggles.
- Role-aware UI reflects read-only, member, owner/admin, service account, and
  API actor permissions where relevant.
- Feature flags and kill switches have clear owners, rollout/disable behavior,
  and user/admin visibility when risky behavior is introduced.
- Provider tokens, webhooks, jobs, retries, delivery state, and failed actions
  have an operator path when they are product-critical.

### Product Validation

- Critical product flows have focused tests or a blocked evidence note.
- API/action contracts have request/response tests, schema tests, or
  characterization tests before broad consolidation.
- Production-shaped smokes use nonpermanent records, clean up after themselves,
  and verify zero residue when release readiness is in scope.
- Changed admin or user-visible flows have browser/e2e/screenshot evidence or
  an explicit viewport/UI gap.

## Finding Proof

A productization finding should include:

- missing or duplicated product control surface
- current repo evidence and affected workflow
- why the current shape blocks API, agent, audit, admin, rollout, or operator use
- smallest safe product contract or implementation fix
- route: usually `cc-plan` for missing services, `cc-do` for scoped agreed fixes
- validation path: tests, docs, smoke, screenshots, logs, or blocked evidence
- residual risk if deferred
