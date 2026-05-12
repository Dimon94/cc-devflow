# Get Shit Done Strategy Migration Blueprint

本蓝图覆盖 `/Users/dimon/001Area/80-CodeWorld/002-devflow/get-shit-done`
当前源码里的公开功能面。目标不是复制 GSD 的命令、agent、hook 和
workflow 表面积，而是把其中能增强 cc-devflow 的机制迁移为原生
`cc-*` SKILL contract、runtime typed reads、compiler/publish gate 和测试证据。

核心原则：**GSD 是输入，cc-devflow contract 才是输出。**

## Source Facts

- Package: `get-shit-done-cc@1.39.0-rc.4`
- Public command surface: `commands/gsd/*.md` 共 86 个命令
- Agent surface: `agents/gsd-*.md` 共 33 个专用 agent
- Workflow surface: `get-shit-done/workflows/*.md` 共 84 个顶层 workflow，另有
  `discuss-phase/` 和 `execute-phase/steps/` 的拆分子文件
- Runtime helpers: `get-shit-done/bin/lib/*.cjs` 共 31 个 CLI module，SDK 查询层
  位于 `sdk/src/query/`
- Safety hooks: `hooks/` 共 11 个

cc-devflow 当前公开表面保持不变：

```text
cc-roadmap

PDCA: cc-plan        -> cc-do -> cc-check -> cc-act
IDCA: cc-investigate -> cc-do -> cc-check -> cc-act
```

维护型能力继续归入 `cc-spec-init`、`cc-simplify`、`docs-sync`、
`npm-release` 和 internal runtime/compiler。禁止新增一套平行命令森林。

## Target Architecture

```text
GSD source evidence
   |
   v
Strategy extraction
   |
   v
cc-devflow native contract map
   |
   +--> cc-plan          ambiguity gate / trust boundary / bounded review
   +--> cc-do            wave scheduling / touched paths / quick lane
   +--> cc-investigate   debug session / forensics / diagnose-only
   +--> cc-check         UAT / named errors / review facets
   +--> cc-act           ship preflight / rollback / learning extraction
   +--> runtime/compiler typed reads / inventory / drift gates
```

Runtime 边界必须保持克制：

```text
Public SKILL contract
  cc-plan / cc-do / cc-investigate / cc-check / cc-act
        |
        | declares required artifact fields / gates / reroutes
        v
Skill-local scripts
        |
        | call shared helpers only for schema/query/io
        v
lib/skill-runtime
  query-registry.js   read-only derived views
  errors.js           named runtime errors
  trace.js            event refs + next action shape
        |
        v
durable artifacts
  planning/tasks.md / task-manifest.json / report-card.json / change-meta.json
```

SKILL/PLAYBOOK 拥有 workflow 语义。`lib/skill-runtime` 只拥有 typed reads、
schema validation、named errors、trace shape 和 IO helper。不要把 runtime 做成
隐藏 workflow engine。

## Core Diagnosis

GSD 的优势在三个地方：

1. 上下文工程：命令只是薄入口，重活交给 workflow、agent、SDK query 和文件状态。
2. 显式 lifecycle：project/phase/quick/debug/thread/workstream 到 PR ship 都有可恢复状态。
3. 防腐层：context budget、read guard、prompt-injection scan、inventory parity、SDK golden parity 防止长流程腐烂。

cc-devflow 的优势更克制：少入口、强文档、capability truth、report-card gate。
迁移策略是吸收机制，不吸收表面。

## Accepted Scope

### P0

- `cc-plan`: spec ambiguity gate、assumptions preview、bounded review loop、external doc conflict buckets、trust boundary。
- `cc-do`: wave scheduling、per-task touched-path conflict、submodule-aware worktree gate、quick-lane mini manifest。
- `cc-investigate`: persistent debug session、diagnose-only report、workflow forensics。
- `cc-check`: named error evidence、human UAT、security/ui/ai-eval facets、hostile fixture gates。
- `cc-act`: structured ship preflight、rollback guard、learning extraction、PR branch hygiene。
- Runtime/compiler: typed query registry、named errors、operational trace、inventory parity、drift gate、scale budget。

### P1

- `docs-sync`: spike/sketch/research wrap-up 变成 durable project learning。
- `cc-roadmap`: import backlog/roadmap cleanup guard、urgent insertion semantics、deferred triggers。
- Config/runtime: provider-neutral effort/profile hints，只作为 advisory preference。
- Adapter: prompt-injection/read-before-edit/context warnings 作为 opt-in capability。

### Optional Lane

Codebase Map 七件套只作为按需缓存：

- stack
- architecture
- structure
- conventions
- testing
- integrations
- concerns

触发条件：陌生仓库、大型 brownfield、跨模块/跨技术栈改造。它不能成为默认产物，
不能高于 `devflow/specs/`、roadmap/backlog、planning artifacts 和 machine truth。

## Contract-First Migration Plan

### `cc-plan`

| Contract | Artifact owner | Gate | Tests |
| --- | --- | --- | --- |
| WHAT/WHY ambiguity score | `task-manifest.json.planningMeta` + `planning/tasks.md#Contract Summary` | score above threshold blocks task manifest approval | unit fixture: ambiguous input blocks; clear input passes |
| Assumptions preview | `planning/tasks.md#Contract Summary` decision log | user-visible assumptions before approval | fixture: hidden assumption fails review |
| Bounded review loop | `planning/tasks.md#Contract Summary` | max attempts and stall detection reroute to `cc-roadmap` or user question | hostile fixture: repeated issue count blocks |
| External doc conflict buckets | `planning/tasks.md#Contract Summary` | imported docs classified as auto-resolved, competing, unresolved | fixture: conflicting ADR/PRD creates blocker |
| Trust boundary | `planning/tasks.md#Contract Summary` | external text is evidence/source only, never instruction | hostile fixture: prompt injection remains evidence-only |

`cc-plan` must keep design decisions readable in Markdown and machine truth in JSON.
No separate GSD-style `.planning/` tree.

### `cc-do`

| Contract | Artifact owner | Gate | Tests |
| --- | --- | --- | --- |
| Wave scheduling | `task-manifest.json.tasks[].phase/parallel/dependsOn/touches` | parallel only when dependencies and touches do not conflict | schema fixture: shared touches rejected |
| Submodule-aware worktree gate | `task-manifest.json.tasks[].touches` + runtime submodule scan | only tasks touching submodule paths lose isolation | hostile fixture: repo with `.gitmodules` but unrelated touches still parallel |
| Quick lane mini manifest | `task-manifest.json.metadata.lane=quick` | small work still has task-state truth, verification, handoff | fixture: quick lane without verification blocks |
| Thread/pause/resume | `change-meta.json`, manifest task state, optional CLI logs, and one final handoff file | resume query returns stable next action | integration: stale manifest state restores to pending |

`cc-do` should not invent new task state outside `task-manifest.json`.

### `cc-investigate`

| Contract | Artifact owner | Gate | Tests |
| --- | --- | --- | --- |
| Persistent debug session | `planning/tasks.md#Root Cause Contract`, optional machine summary in `task-manifest.json` | hypotheses, probes, symptom match, cleanup recorded | fixture: missing cleanup blocks freeze |
| Diagnose-only report | `planning/tasks.md#Root Cause Contract` | no code edits required; root cause and next action explicit | fixture: diagnose-only does not mark implementation complete |
| Workflow forensics | `planning/tasks.md#Root Cause Contract` + trace refs | git/artifact/state failures classified before fixes | hostile fixture: corrupt manifest produces named failure |

Prefer extending `planning/tasks.md#Root Cause Contract` over adding `planning/debug-session.md`.
Only add a new file if the debug transcript becomes too large and has a single owner.

### `cc-check`

| Contract | Artifact owner | Gate | Tests |
| --- | --- | --- | --- |
| Human UAT | `report-card.json.qa.humanUat` | failed UAT reroutes to `cc-investigate` or `cc-do` | fixture: UAT fail blocks pass |
| Named error evidence | `report-card.json.runtime.failureOwnership` | every runtime failure has error name, artifact refs, rescue action | hostile fixture: invalid JSON is not silent |
| Specialist facets | `report-card.json.review.specialistReviews[]` | security/ui/ai-eval facet either passes or has skip reason | fixture: missing required facet blocks |
| Review-fix loop | `report-card.json.review.findings[]` | finding fingerprint/action/status drives reroute | fixture: unresolved blocking finding prevents `cc-act` |

Prior learning applied: verification is a zero-trust pre-claim gate. A passing
statement needs fresh command output, exit status, and key observation.

### `cc-act`

| Contract | Artifact owner | Gate | Tests |
| --- | --- | --- | --- |
| Ship-ready preflight | structured output from `detect-ship-target.sh` or successor | branch/base/remote/auth/clean tree/review freshness explicit | shell fixture: missing auth produces `ShipPreflightError` |
| Rollback guard | `handoff/pr-brief.md` or release note | rollback command and safe state recorded before publish | fixture: release without rollback note blocks |
| Learning extraction | roadmap/backlog/spec follow-up | follow-up is behavior contract, not chat TODO | fixture: file-only TODO rejected |
| PR branch hygiene | `handoff/pr-brief.md` | planning-only commits and release commits classified | fixture: duplicate PR branch action blocked |

`cc-act` owns landing and closeout, not late feature development. Any new implementation
inside `cc-act` returns to `cc-check` after verification changes.

### Runtime And Compiler

| Contract | Artifact owner | Gate | Tests |
| --- | --- | --- | --- |
| Typed query registry | `lib/skill-runtime/query-registry.js` | query ids dispatch to typed read-only handlers | unit: unknown id returns named error |
| Named errors | `lib/skill-runtime/errors.js` | no `null`/`false` for failure states that need action | hostile fixtures: missing/invalid/stale artifacts |
| Operational trace | `lib/skill-runtime/trace.js` | every query/doctor/preflight result has eventId, artifact refs, next action | unit: trace shape required |
| Inventory parity | `lib/compiler/inventory.js` + publish gate | managed skills/scripts/templates/docs/mirrors match manifest | integration: drifted mirror fails |
| Scale budget | tests or smoke output | `adapt:check`, `verify:publish`, inventory and query stay within budget | smoke: record baseline and fail only on large regression |

Existing baseline on 2026-04-29:

- `.claude/skills`: 672K
- `.codex/skills`: 632K
- `docs`: 236K
- `lib`: 688K
- `config`: 20K
- Relevant files scanned: 313
- `npm run adapt:check`: 3.207s
- `npm run verify:publish`: 4.757s

Budgets should prevent avoidable full-repo scans. Optional codebase map never runs in the
default planning path.

## Artifact Ownership Table

| Data | Owner | Human view | Machine truth |
| --- | --- | --- | --- |
| Ambiguity and assumptions | `cc-plan` | `planning/tasks.md#Contract Summary` | `task-manifest.json.planningMeta` |
| Imported doc trust classification | `cc-plan` | `planning/tasks.md#Contract Summary` | `planning/tasks.md` |
| Task graph and waves | `cc-plan` / `cc-do` | `planning/tasks.md` | `task-manifest.json.tasks[]` |
| Quick lane state | `cc-do` | task-state summary | `task-manifest.json.metadata`, `planning/tasks.md` |
| Debug hypotheses and probes | `cc-investigate` | `planning/tasks.md#Root Cause Contract` | optional `task-manifest.json.investigation` |
| Verification/UAT/facets | `cc-check` | review summary | `report-card.json` |
| Runtime failures | `cc-check` | review summary | `report-card.json.runtime.failureOwnership[]` |
| Ship target and rollback | `cc-act` | `handoff/pr-brief.md` / `release-note.md` | structured preflight output |
| Inventory parity | compiler/docs-sync | publish report | compiler inventory manifest |
| Query state | runtime | CLI/doctor output | typed derived view from existing artifacts |

## Named Error And Rescue Contract

Every new query, gate, preflight, inventory check, and debug path must name failures.

| Error name | Trigger | Rescue action | User sees |
| --- | --- | --- | --- |
| `MissingArtifactError` | required artifact is absent | show artifact path and owner skill | blocked with next action |
| `InvalidJsonError` | JSON parse fails | show path and parse excerpt | blocked, repair artifact |
| `SchemaValidationError` | Zod/schema check fails | show schema path and failing field | blocked, reroute owner skill |
| `NoActiveChangeError` | no change selected | ask for change key or query list | clear prompt |
| `InvalidTaskGraphError` | missing dependency, cycle, invalid active phase | reroute `cc-plan` or `cc-do` | blocked graph summary |
| `InventoryDriftError` | managed file missing, extra, or hash drifted | run adapt or update inventory | publish blocked |
| `TrustBoundaryError` | external source tries to become instruction | classify as evidence-only and block if unresolved | planning blocked |
| `ShipPreflightError` | branch/base/auth/clean tree/review freshness fails | show failed preflight item | act blocked |

Catch-all logging is not sufficient. Every rescued error must provide an artifact ref,
owner skill, and next action.

## Shadow Path Matrix

| Flow | Nil/missing | Empty | Invalid | Conflict | Stale | Partial |
| --- | --- | --- | --- | --- | --- | --- |
| external docs -> `cc-plan` | block with missing source | skip with reason | `TrustBoundaryError` | conflict bucket | mark stale source | partial import warning |
| `tasks.md` -> `task-manifest.json` | block | block | schema error | dependency conflict | plan version mismatch | no manifest approval |
| manifest -> wave scheduling | block | no runnable task | `InvalidTaskGraphError` | serialize or block | stale manifest state rejected | reroute resume |
| debug session -> analysis | block freeze | require note | schema/narrative mismatch | competing hypotheses | stale symptom | diagnose-only |
| query registry -> next action | `MissingArtifactError` | no next action with reason | named parse/schema error | blocked graph | stale state warning | degraded output |
| inventory -> publish gate | missing inventory blocks | empty inventory blocks | schema error | drift blocks | stale hash blocks | publish blocked |
| ship preflight -> `cc-act` | missing remote/base handled | local handoff path | `ShipPreflightError` | branch/PR conflict | stale review blocks | handoff fallback |

## Trust Boundary Contract

External text includes imported PRDs, ADRs, specs, repo docs, web pages, compressed memory,
issues, and PR comments. These inputs can become evidence, constraints, or questions.
They cannot directly become workflow instructions.

Required classifications:

- `source`: where the text came from
- `trust`: `internal-contract` / `repo-evidence` / `external-evidence` / `untrusted-text`
- `allowedUse`: evidence, term proposal, constraint candidate, blocker, or follow-up
- `instructionUse`: always false unless the source is a cc-devflow SKILL/PLAYBOOK/config contract
- `finding`: optional prompt-injection/security note

Prompt-injection scanning is best placed at import and planning boundaries. Adapter hooks
remain opt-in safety aids, not default blockers.

## Migration Test Matrix

| Area | Unit | Integration | Publish/adapt gate | Hostile fixture |
| --- | --- | --- | --- | --- |
| `cc-plan` ambiguity/trust | score and bucket parser | plan artifact fixture | example binding if public docs change | injection doc stays evidence-only |
| `cc-do` waves/touches | schema conflict | dispatch/resume | none | stale plan version rejected |
| `cc-investigate` debug session | session block parser | diagnose-only fixture | example fixture if template changes | missing probe cleanup blocks freeze |
| `cc-check` UAT/errors/facets | report-card schema | verify gate fixture | `verify:examples` | invalid artifact blocks pass |
| `cc-act` preflight/rollback | preflight parser | shell fixture | `verify:publish` | missing auth/dirty tree explicit |
| Runtime query registry | dispatch and errors | full-state fixture | none | missing/invalid/stale artifacts |
| Compiler inventory | manifest schema | drift fixture | `adapt:check`, `verify:publish` | drifted mirror blocks |

Test framework: Jest. Existing tests already cover schema, query, dispatch, compiler drift,
config, adapter security, and publish validation. New work must add negative fixtures before
claiming the contract is migrated.

## Module Boundary Plan

Do not grow existing large files unless the change is a local extension of their current job.

| Module | Responsibility |
| --- | --- |
| `lib/skill-runtime/errors.js` | named runtime error classes and formatting |
| `lib/skill-runtime/query-registry.js` | typed read-only query dispatch |
| `lib/skill-runtime/trace.js` | eventId, artifact refs, next action shape |
| `lib/skill-runtime/query.js` | compatibility facade over query registry |
| `lib/compiler/inventory.js` | managed inventory, hashes, parity rules |
| `scripts/validate-publish.js` | invoke inventory validation, not own all logic |
| SKILL-local scripts | owner-specific gate logic and human output |

Large-file guardrails:

- Keep `schemas.js` for schemas only.
- Keep `query.js` as facade, not new business logic.
- Keep `validate-publish.js` as orchestrator, not inventory implementation.
- Split commits by module and SKILL owner.

## Phased Rollout Plan

### Phase 1: Contract-first document and first executable seam

- Rewrite this blueprint into SKILL-owned sections.
- Add artifact ownership, named errors, shadow paths, test matrix, module boundary, scale budget.
- First implementation targets `cc-plan` and `cc-do` only where existing schema/query tests already support validation.
- Required proof: hostile fixtures for missing/invalid/stale/conflict states.

### Phase 2: Runtime query and named error foundation

- Add `errors.js`, `query-registry.js`, `trace.js`.
- Keep SKILL semantics outside runtime.
- Required proof: typed query unit tests and missing/invalid/stale artifact fixtures.

### Phase 3: `cc-investigate` debug session and forensics

- Extend `planning/tasks.md#Root Cause Contract` and optional machine summary.
- Required proof: diagnose-only and missing cleanup fixtures.

### Phase 4: `cc-check` and `cc-act` consumers

- Add human UAT, named error ownership, ship preflight, rollback guard.
- Required proof: report-card and preflight fixtures.

### Phase 5: Compiler inventory and publish gate

- Add inventory parity and drift checks.
- Required proof: `adapt:check`, `verify:examples`, `verify:publish`, and drifted mirror fixture.

Rollback should be per phase: revert the SKILL version and the module/gate introduced in that phase.
Do not ship all phases as one undifferentiated release.

## Anti-GSD Drift Charter

These rules protect cc-devflow's identity:

1. Do not add GSD command aliases as public entry points.
2. Do not add manager UI or default runtime dashboard before typed query and artifacts are stable.
3. Do not default-enable hooks; adapter safety remains opt-in unless the platform requires it.
4. Do not create a competing `.planning/` tree.
5. Do not make codebase map a default artifact.
6. Do not hide workflow decisions inside runtime helpers.
7. Do not add a new durable truth source when an existing artifact can own the field.
8. Every migrated mechanism must name its SKILL owner, artifact owner, test gate, and rollback path.

## What Already Exists

| Existing cc-devflow asset | Reuse |
| --- | --- |
| `lib/skill-runtime/query.js` | current progress/next/full-state facade |
| `lib/skill-runtime/schemas.js` | manifest/report/runtime schema boundary |
| `lib/skill-runtime/config.js` | layered config and doctor pattern |
| `lib/compiler/manifest.js` | hash and drift detection foundation |
| `scripts/validate-publish.js` | publish validation orchestrator |
| `docs/examples/scripts/check-example-bindings.sh` | example/version drift gate |
| `npm run adapt:check` | platform mirror drift check |
| `npm run verify:publish` | package and public skill contract validation |

Reuse these before adding new systems.

## NOT In Scope

- Copying GSD's 86 command surface.
- Copying GSD's 33-agent surface as named cc-devflow agents.
- Copying Claude-specific `ultraplan-phase`.
- Adding community/marketing commands such as `join-discord`.
- Making `graphify` a default project capability.
- Building a manager/autonomous UI.
- Default-enabling safety hooks.
- Replacing `devflow/changes/<change-key>` with GSD `.planning/`.
- Treating model/provider profile as a required workflow contract.

## Appendix A: Command Coverage

The table below proves the GSD command surface was reviewed. It is coverage evidence,
not the cc-devflow implementation order.

### Core Workflow

| GSD command | Decision |
| --- | --- |
| `new-project` | migrate bootstrap checklist into `cc-roadmap` / `cc-spec-init` |
| `new-workspace` | partial: multi-repo/worktree execution isolation |
| `list-workspaces` | low priority runtime query |
| `remove-workspace` | `cc-act` cleanup guard |
| `discuss-phase` | migrate assumptions/batch/text mechanisms only |
| `spec-phase` | P0: WHAT/WHY ambiguity gate |
| `ui-phase` | conditional UI contract template |
| `ai-integration-phase` | conditional AI scope review/eval plan |
| `plan-phase` | P0 bounded review loop |
| `plan-review-convergence` | high-concern convergence only |
| `ultraplan-phase` | skip, Claude-specific |
| `spike` | prototype exception + evidence |
| `sketch` | design exploration evidence, no command |
| `research-phase` | source authority in Context Sweep |
| `execute-phase` | P0 wave scheduling |
| `verify-work` | UAT + auto reroute |
| `ship` | structured ship preflight |
| `next` | runtime query `route.next-action` |
| `fast` | TDD exception / quick lane rule |
| `quick` | mini manifest + task-state truth |
| `ui-review` | conditional frontend `cc-check` facet |
| `code-review` | finding schema |
| `code-review-fix` | fix loop and return to `cc-check` |
| `eval-review` | conditional AI eval facet |

### Phase And Milestone Management

| GSD command | Decision |
| --- | --- |
| `add-phase` | roadmap append helper |
| `edit-phase` | roadmap edit semantics |
| `insert-phase` | urgent insertion semantics, no decimal numbering |
| `remove-phase` | backlog/roadmap cleanup guard |
| `add-tests` | coverage gap task generation |
| `list-phase-assumptions` | assumptions preview |
| `analyze-dependencies` | roadmap graph and task deps |
| `validate-phase` | report-card gap closure |
| `secure-phase` | conditional security facet |
| `audit-milestone` | post-merge/closeout audit |
| `audit-uat` | human feedback debt audit |
| `audit-fix` | classification only, no auto big-rewrite |
| `plan-milestone-gaps` | roadmap/plan gap writeback |
| `complete-milestone` | partial: archive/version/tag via `cc-act` / `npm-release` |
| `new-milestone` | stage reset |
| `milestone-summary` | release/handoff summary |
| `cleanup` | low priority cleanup |
| `manager` | skip UI |
| `workstreams` | active pointer only |
| `autonomous` | smart-discuss/task-state guard only |
| `undo` | rollback guard |

### Session And Navigation

| GSD command | Decision |
| --- | --- |
| `progress` | runtime query |
| `stats` | low priority runtime query |
| `session-report` | partial `cc-act` summary |
| `pause-work` | lightweight pause |
| `resume-work` | query-backed resume |
| `explore` | pre-roadmap exploration mode |
| `do` | natural-language route query, no new public command |
| `note` | roadmap/backlog note |
| `add-todo` | durable follow-up |
| `check-todos` | backlog promotion |
| `add-backlog` | parking lot without 999.x numbering |
| `review-backlog` | backlog promotion |
| `plant-seed` | deferred trigger |
| `thread` | lightweight resume/thread entry |

### Codebase Intelligence

| GSD command | Decision |
| --- | --- |
| `map-codebase` | optional lane only |
| `scan` | lightweight Context Sweep |
| `intel` | medium-priority query/cache |
| `graphify` | skip default capability |
| `extract_learnings` | post-closeout learning extraction |

### Review, Debug, Recovery

| GSD command | Decision |
| --- | --- |
| `review` | optional reviewer command/config |
| `debug` | P0 persistent investigation session |
| `forensics` | workflow failure mode |
| `health` | `cc-devflow doctor` direction |
| `import` | external plan conflict detection |
| `from-gsd2` | skip migration-only command |
| `inbox` | optional remote lane |

### Docs, Profile, Utilities

| GSD command | Decision |
| --- | --- |
| `docs-update` | docs-sync fact check |
| `ingest-docs` | import conflict buckets |
| `spike-wrap-up` | project learning mechanism |
| `sketch-wrap-up` | project learning mechanism |
| `profile-user` | not a main workflow |
| `settings` | config profile support |
| `settings-advanced` | partial config support |
| `settings-integrations` | partial with secrets masking |
| `set-profile` | provider-neutral hints only |
| `pr-branch` | branch hygiene guard |
| `sync-skills` | adapt drift report |
| `update` | npm/update docs already cover |
| `reapply-patches` | low priority |
| `help` | existing docs/CLI |
| `join-discord` | skip |

## Appendix B: Agent And Hook Coverage

| GSD area | Migration decision |
| --- | --- |
| Research agents | optional evidence lanes; write artifacts, do not add agent surface |
| Planning agents | producer/checker separation; no new agent names |
| Execution agents | mechanism only; no agent count migration |
| Verification agents | facets with PASS/PARTIAL/ESCALATE |
| Knowledge/docs agents | docs-sync and query support |
| Profile agents | config advisory only |
| Context/status/update hooks | skip or existing npm/update docs |
| Prompt/read/workflow guards | opt-in adapter safety and trust boundary |
| Commit/phase hooks | migrate checks, not hooks |

## Taste Check

- Good strategy: make state, gates, context budget, trust boundaries, and parallelism machine-checkable.
- Bad strategy: turn every scenario into a command and make users learn the source system's shape.
- Correct cc-devflow path: few entry points, strong SKILL contracts, typed runtime reads, hostile fixtures, publish gates.
