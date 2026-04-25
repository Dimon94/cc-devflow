# Changelog

All notable changes to cc-devflow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

## [4.4.1] - 2026-04-25

### 🔧 Canonical Change Keys + Planning Contract Hardening

v4.4.1 tightens the planning and release workflow contracts so new change
directories use explicit `REQ-*` / `FIX-*` prefixes and executable plans keep
test-first handoffs as a native requirement.

### Added

- Added a public `cc-investigate` skill so bug work can follow `cc-investigate -> cc-do -> cc-check -> cc-act` instead of overloading `cc-plan`.
- Added a distributed maintenance skill `cc-spec-init` for capability-centered spec bootstrap, capability truth maintenance, and `change-meta.json` link repair.
- Added runtime coverage for canonical change-key generation, legacy lowercase directory compatibility, `FIX-*` ids, and rejection of stale `BUG-*` ids.

### Changed

- Documented the workflow as two shared-tail loops: `PDCA` for feature/scope work and `IDCA/DDCA` for root-cause work.
- Updated public distribution, publish validation, and Codex mirror expectations so `cc-investigate` ships with the pack.
- Updated `cc-do` and `cc-check` contracts so they can consume `ANALYSIS.md` handoffs and reroute failed bug fixes back to `cc-investigate`.
- Updated `cc-roadmap`, `cc-plan`, `cc-investigate`, `cc-do`, `cc-check`, and `cc-act` to carry capability/spec linkage through roadmap, planning, execution, verification, and closeout.
- Updated public docs and example bindings so `devflow/specs/` is documented as durable capability truth and `change-meta.json` is documented as durable change truth.
- Updated `cc-plan` and `cc-investigate` so new planning outputs must use `REQ-<number>-<description>` for requirement work and `FIX-<number>-<description>` for bug-fix work.
- Updated public examples to use uppercase `REQ-*` change directories.

### Fixed

- Fixed path resolution so new change directories no longer silently downcase
  `REQ-*` ids into `req-*`.

## [4.4.0] - 2026-04-10

### 🚀 Review-Gated Delivery + Distribution Cleanup

v4.4.0 tightens the requirement runtime contract so planning, dispatch, verify, and release operate on the same execution state, while npm distribution now ships only the public workflow surface.

### Added

- Added richer task manifest metadata, including phase, parallelism, acceptance, verification, evidence, review state, and execution cursor tracking.
- Added native review aggregation in `lib/harness/review.js` so verify/release can block on missing or failed task review proof.
- Added `.claude/skills/docs-sync/` as a maintenance skill for syncing skill versions, skill changelogs, and affected public docs before commit or ship.
- Added `config/distributable-skills.json` so CLI/template distribution uses an explicit public-skill allowlist.

### Changed

- `planner`, `dispatch`, `resume`, and `query` now derive the same ready task and active phase from manifest state instead of guessing from the first pending item.
- `verify` and release-facing outputs now emit explicit verdicts, review summaries, reroute hints, and blocking findings tied to review artifacts.
- Documented the repository rule that changes to shipped skills must update the skill `version`, local `CHANGELOG.md`, and impacted README / CONTRIBUTING / docs content together.
- `cc-devflow init` and npm packaging now distribute only public workflow skills; maintainer-only skills such as `docs-sync` and `npm-release` stay out of the shipped template.

### Benefits

- ✅ Review proof is now a first-class gate instead of tribal process
- ✅ Requirement execution state is resumable and dependency-aware
- ✅ Packaged output exposes a cleaner public surface for npm consumers

## [4.3.0] - 2026-03-13

### ✨ TDD Enforcement + OpenSpec Interop

v4.3.0 adds automatic TDD order validation and bidirectional OpenSpec conversion to solve requirement drift problems.

#### Added

- **TDD Order Validation**
  - Added `validateTDDOrder()` in `lib/harness/planner.js` to enforce Constitution Article VI
  - Validates that [IMPL] tasks depend on corresponding [TEST] tasks
  - Validates that [TEST] tasks don't depend on [IMPL] tasks
  - Intelligent feature name matching with fuzzy algorithm (removes suffixes like "测试", "实现", "功能")
  - Extended `TaskSchema` in `lib/harness/schemas.js` with `type` field (TEST/IMPL/OTHER)
  - Comprehensive test coverage in `lib/harness/__tests__/planner.tdd.test.js` (10 tests, all passing)

- **OpenSpec Interoperability**
  - Added `.claude/scripts/import-openspec.js` for OpenSpec → CC-DevFlow conversion
    - Parses OpenSpec format (Purpose + Requirements + BDD scenarios)
    - Auto-generates TDD tasks (TEST + IMPL pairs with correct dependencies)
    - Adds Design section with [NEEDS CLARIFICATION] markers
    - Generates Verification checklist
  - Added `.claude/scripts/export-openspec.js` for CC-DevFlow → OpenSpec conversion
    - Strips YAML frontmatter and metadata
    - Removes Design, Tasks, Verification sections
    - Removes [NEEDS CLARIFICATION] markers
    - Outputs pure Requirements in OpenSpec format
  - Added `.claude/commands/flow/import-openspec.md` command documentation
  - Added `.claude/commands/flow/export-openspec.md` command documentation
  - Comprehensive test coverage in `.claude/scripts/__tests__/openspec.test.js` (5 tests, all passing)
  - Round-trip conversion preserves requirements integrity

#### Benefits

- ✅ Automatic enforcement of TDD order (Constitution Article VI)
- ✅ Prevents implementation before tests at parse time
- ✅ Bidirectional OpenSpec compatibility
- ✅ Automatic TDD task generation during import
- ✅ Clean requirement export without implementation details

## [4.2.0] - 2026-02-19

### 🧠 Long-Running Harness Protocol Alignment

v4.2.0 unifies long-running execution protocol across project-level `/core:*` commands and requirement-level `/flow:*` skills, reducing context-loss regressions and premature completion.

#### Added

- **Project-level harness protocol**
  - Added `Initializer / Worker / Done Gate` guidance to:
    - `.claude/commands/core/roadmap.md`
    - `.claude/commands/core/architecture.md`
    - `.claude/commands/core/guidelines.md`
    - `.claude/commands/core/style.md`
  - Standardized resumable artifacts under `devflow/.core-harness/*` (`checklist`, `progress`, `handoff`)

- **Requirement-level protocol parity**
  - Added the same long-running protocol to:
    - `.claude/skills/workflow/flow-init/SKILL.md`
    - `.claude/skills/workflow/flow-spec/SKILL.md`
    - `.claude/skills/workflow/flow-dev/SKILL.md`
  - Standardized requirement session artifacts:
    - `session-checklist.json`
    - `session-progress.md`
    - `session-handoff.md`

- **Routing-level enforcement**
  - Extended `.claude/skills/cc-devflow-orchestrator/SKILL.md` with project-level harness routing defaults and artifact-backed completion rules

#### Benefits

- ✅ Consistent long-running behavior between `/core:*` and `/flow:*`
- ✅ Clear resumability across context windows
- ✅ Stronger done criteria via artifact-backed gates (instead of subjective completion)

## [4.1.6] - 2026-02-18

### 🔧 Multi-Platform Adapt Pipeline Stabilization

v4.1.6 fixes multi-platform `adapt` compilation drift and parsing failures, with a focus on deterministic incremental behavior across Codex/Cursor/Qwen/Antigravity targets.

#### Fixed

- **Command parser robustness**
  - `.claude/commands/**/CLAUDE.md` is now excluded from command parsing
  - Prevents false `Missing YAML frontmatter` failures during `npm run adapt`

- **Harness runtime chain bootstrap**
  - `cc-devflow init` and `cc-devflow adapt` now auto-add missing `harness:*` npm scripts into target `package.json`
  - Added `cc-devflow harness <subcommand>` passthrough so injected scripts have a stable runtime entry
  - Injected scripts are now machine-portable (`cc-devflow harness ...`) with no absolute-path coupling
  - Auto-repairs legacy `node bin/harness.js <cmd>`, old `npx` wrappers, and prior absolute-path script values

- **Manifest consistency across platforms**
  - Separated source hash (`sourceHash`) and emitted target hash (`hash`)
  - Drift detection now compares emitted artifact hashes correctly
  - Legacy manifest entries auto-trigger one-time recompilation for migration

- **Stale entry cleanup**
  - Added stale command entry pruning scoped by source prefix + platform
  - Eliminates historical rename/delete residue causing noisy `adapt --check` drift reports

- **Split-output tracking**
  - Manifest dedup key upgraded from `source+platform` to `source+platform+target`
  - Prevents multi-output artifacts from overwriting each other

#### Benefits

- ✅ `npm run adapt` no longer fails on documentation files in command directories
- ✅ `npm run adapt -- --check` produces reliable drift signals
- ✅ Incremental compile behavior is stable for multi-output emitters

## [4.1.5] - 2026-02-08

### 🧹 Remove Git Worktree Management

v4.1.5 removes worktree management from DevFlow. Git topology (branches, worktrees, merges) is now fully user-managed, simplifying the workflow and reducing coupling.

#### Removed

- **using-git-worktrees skill**
  - Deleted `.claude/skills/domain/using-git-worktrees/` (SKILL.md, scripts, assets)
  - Removed worktree-create, worktree-switch, worktree-cleanup, worktree-list, worktree-status scripts

- **Workspace worktree scripts**
  - Deleted `.claude/scripts/flow-workspace-start.sh`
  - Deleted `.claude/scripts/flow-workspace-switch.sh`

- **Common.sh worktree functions**
  - Removed 159 lines of worktree-related helper functions

#### Changed

- **Flow commands and skills**
  - Updated flow-init, flow-release, flow-fix, flow-workspace to remove worktree references
  - Simplified `create-requirement.sh` (removed worktree creation logic)
  - Updated `workflow.yaml` dependency graph

- **Documentation**
  - Updated `.claude/CLAUDE.md` architecture description
  - Removed Git branch conventions from `devflow-conventions.md`
  - Cleaned up `scripts/CLAUDE.md` member list
  - Updated `TEAM_MODE_GUIDE.md`

#### Benefits

- ✅ Simpler workflow: DevFlow focuses on requirement management, not Git topology
- ✅ User control: Developers manage branches/worktrees as they prefer
- ✅ Reduced coupling: No assumptions about Git structure
- ✅ Cleaner codebase: -2345 lines of code removed

---

## [4.1.4] - 2026-02-08

### 🧭 Workspace Worktree Session Recovery & Release Flow Clarity

v4.1.4 strengthens workspace-to-worktree continuity so developers can resume a requirement reliably across sessions, and clarifies flow init/release semantics in command and skill docs.

#### Added

- **Workspace switch script**
  - Added `.claude/scripts/flow-workspace-switch.sh`
  - Supports `REQ/BUG` pointer updates, journal logging, `--print-cd`, and sourced `--cd` switching

- **Scripts architecture map**
  - Added `.claude/scripts/CLAUDE.md` as L2 directory map for script responsibilities

#### Changed

- **Workspace start behavior**
  - `.claude/scripts/flow-workspace-start.sh` now accepts `REQ-XXX/BUG-XXX` override
  - Added `--switch` and sourced `--cd` behavior for faster worktree handoff
  - Added BUG status file compatibility (`devflow/bugs/*/status.json`)

- **Requirement initialization linkage**
  - `.claude/scripts/create-requirement.sh` now syncs `devflow/workspace/{developer}/.current-req` when workspace exists

- **Flow docs and skills alignment**
  - Updated flow init/release/workspace command docs and workflow skills to reflect:
    - default worktree naming semantics
    - merge semantics by release strategy
    - workspace continuity expectations

#### Benefits

- ✅ New session recovery can target the intended REQ/BUG directly
- ✅ Worktree switching is faster and less error-prone via generated `cd` commands
- ✅ Flow release semantics are clearer when deciding between PR-only vs merge paths

## [4.1.3] - 2026-02-08

### 🔧 Flow Quality Default Path + AGENTS.md Safe Emit

v4.1.3 aligns release gates with `/flow-quality` as the default path and improves compiler emitters to preserve user-owned AGENTS memory content.

#### Fixed

- **Flow quality/release gate consistency**
  - `/flow-quality` quick mode now generates minimal `TEST_REPORT.md` and `SECURITY_REPORT.md`
  - Release entry gate accepts `quality_complete` (with `qa_complete` backward compatibility)
  - Flow docs/scripts updated to recommend `/flow-quality` by default, with `--full` as enhanced review mode

- **AGENTS.md overwrite prevention in compiler emitters**
  - Added managed block upsert mechanism in base emitter
  - Codex/Antigravity emitters now write compact index blocks instead of appending full agent/rule bodies
  - Existing user memory content in `AGENTS.md` is preserved

#### Added

- **Regression coverage for managed blocks**
  - Tests for AGENTS managed block generation, idempotence, and preservation behavior

#### Benefits

- ✅ `flow-quality` becomes a true default path to `flow-release` without requiring `--full`
- ✅ Compiler output no longer clobbers user-maintained AGENTS memory sections
- ✅ Backward compatibility with legacy QA status remains intact

## [4.1.2] - 2026-02-07

### 🔧 Adapt Compiler Migration Reliability Fixes

v4.1.2 fixes regressions in multi-platform `adapt` output generation and adds regression coverage to prevent command/skill migration gaps.

#### Fixed

- **Nested command compilation restored**
  - `adapt` now recursively scans `.claude/commands/**` instead of top-level only
  - Preserves relative command paths (for example `flow/new` → platform subdirectories)
  - Ensures command outputs are emitted to matching platform folder structures

- **Skills migration completeness restored**
  - Added recursive Skill discovery for grouped and root-level skills
  - Registry and platform emitters now discover the same full skill set
  - Resolved missing Codex/Cursor/Qwen/Antigravity skill outputs

- **Module emission restored in main compile path**
  - `adapt` main flow now emits skills/agents/rules/hooks in addition to commands
  - CLI output now reports module-level emission statistics for easier verification

- **Resource copy reliability improved**
  - Handles Skill resource symlinks more robustly during emitter copy
  - Ignores glob-style inline paths to avoid false missing-file warnings
  - Fixed broken workflow skill symlink targets under `.claude/skills/workflow/*`

#### Added

- **Regression tests for adapt migration pipeline**
  - Parser recursive command discovery tests
  - Skill discovery tests (grouped + root-level)
  - Compile end-to-end regression test
  - Resource copier glob-filter test

#### Benefits

- ✅ `cc-devflow adapt --platform <target>` now generates complete expected outputs
- ✅ Cross-platform command/skill migration behavior is consistent and test-protected
- ✅ Release/debug verification is faster with explicit module emission metrics

## [4.1.1] - 2026-02-07

### 🔧 Flow-Init Script Reliability + Flow Docs Alignment

v4.1.1 focuses on execution reliability for embedded flow-init scripts and removes stale command guidance from flow documentation.

#### Fixed

- **Flow-Init embedded scripts** now resolve shared `common.sh` safely
  - Added fallback loading path from `skills/workflow/flow-init/scripts/*` to `.claude/scripts/common.sh`
  - Prevents runtime failure when running bundled scripts directly from skill directories
  - Affects:
    - `check-prerequisites.sh`
    - `create-requirement.sh`
    - `validate-research.sh`

#### Changed

- **Flow command docs aligned with actual v4.1 workflow**
  - Updated `/flow-new` orchestration to `flow-init → flow-clarify(optional) → flow-spec → flow-dev → flow-quality → flow-release`
  - Removed outdated references to deprecated `/flow-review` and `/flow-qa` in active workflow guidance
  - Synced bilingual README command links to namespace paths under `.claude/commands/flow/`

#### Maintenance

- **Lockfile metadata synchronized**
  - Normalized `package-lock.json` package version markers to match `package.json`

#### Benefits

- ✅ `flow-init` script execution no longer fails due to missing local `common.sh`
- ✅ Command docs now map to real command files and current workflow semantics
- ✅ Release metadata consistency improved for publish pipeline


## [4.1.0] - 2026-02-07

### 🤖 Claude Team Integration: Multi-Agent Parallel Collaboration

v4.1.0 introduces Claude Team functionality for multi-agent parallel development with automatic task scheduling and distributed quality verification.

#### Added

- **Team Mode for /flow:dev** - Multi-agent parallel execution
  - `--team` flag enables parallel agent collaboration
  - `--agents N` specifies agent count (2-5, default 3)
  - Automatic task dependency parsing and conflict detection
  - TeammateIdle Hook for automatic task assignment
  - TaskCompleted Hook for quality verification

- **New Hooks**
  - `teammate-idle-hook.ts` - Task scheduling when teammate goes idle
  - `task-completed-hook.ts` - Quality verification on task completion
  - `types/team-types.d.ts` - TypeScript type definitions for Team state

- **New Scripts**
  - `parse-task-dependencies.js` - TASKS.md dependency parser
  - `detect-file-conflicts.sh` - Parallel task file conflict detection
  - `team-dev-init.sh` - flow-dev Team mode initialization

- **Enhanced orchestration_status.json**
  - `team` section for teammate tracking
  - `ralphLoop.teammates` for per-teammate iteration state
  - Task assignment tracking

- **New common.sh Functions**
  - `is_team_mode_enabled()` - Check Team mode status
  - `init_team_state()` - Initialize Team state
  - `add_teammate()` / `update_teammate_status()` - Teammate management
  - `assign_task_to_teammate()` / `get_unassigned_tasks()` - Task assignment
  - `all_teammates_idle()` / `cleanup_team_state()` - Team lifecycle

#### Changed

- **quality-gates.yml** - New Team mode configuration
  - `teammate_idle` section for idle hook settings
  - `task_completed` section for completion verification
  - `ralph_loop.team_mode` for distributed Ralph Loop

#### Quality Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Parallel agents | 1 | 3-5 | +400% |
| Requirement completion time | 90 min | 50 min | -45% |
| Task scheduling | Manual | Automatic | 100% |
| Quality verification | Single-point | Distributed | 100% |

---

## [4.2.1] - 2026-02-07

### 🌿 Git Worktree Integration: Parallel Development Support

v4.2.1 introduces Git Worktree integration for parallel development with isolated Claude Code sessions.

#### Added

- **Git Worktree Mode (Default)** - Isolated development environments
  - Creates `../repo-name-REQ-xxx/` worktree directories
  - Each worktree has independent Claude Code session
  - Switch between requirements with `cd` instead of `git checkout`
  - `--branch-only` flag for traditional branch mode compatibility

- **New Skill: using-git-worktrees** - Complete worktree management
  - `SKILL.md` - Core instructions (~200 lines)
  - `context.jsonl` - Context definition
  - `scripts/worktree-create.sh` - Create new worktree
  - `scripts/worktree-list.sh` - List all worktrees
  - `scripts/worktree-switch.sh` - Switch to worktree
  - `scripts/worktree-cleanup.sh` - Clean up merged worktrees
  - `scripts/worktree-status.sh` - Check worktree status
  - `assets/SHELL_ALIASES.md` - Shell aliases template (za/zl/zm/zw)

- **New common.sh Functions**
  - `is_in_worktree()` - Check if in worktree
  - `get_main_repo_path()` - Get main repository path
  - `get_worktree_path()` - Get current worktree path
  - `get_worktree_dir_for_req()` - Get worktree directory for REQ
  - `worktree_exists_for_req()` - Check if worktree exists
  - `get_req_id_from_worktree()` - Extract REQ-ID from worktree path
  - `list_worktrees_with_req()` - List all worktrees with REQ-IDs

#### Changed

- **flow-init** - Default worktree mode
  - New `--worktree` flag (default)
  - New `--branch-only` flag for traditional branch mode
  - Updated `create-requirement.sh` with worktree support

- **flow-release** - Automatic worktree cleanup
  - Detects worktree mode and cleans up after merge
  - `--keep-worktree` flag to skip cleanup

- **devflow-conventions.md** - Updated Git conventions
  - Renamed "Git 分支约定" → "Git Worktree 约定"
  - Added worktree directory layout
  - Added shell aliases recommendations

#### Quality Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Parallel requirements | 1 | 3-5 | +400% |
| Context switch time | 30s | 1s | -97% |
| Emergency hotfix response | Requires stash | Instant | Immediate |
| Session isolation | None | Full | 100% |

---

## [4.0.1] - 2026-02-07

### 🎯 Unified Specification Phase: /flow-spec Command

v4.0.1 merges flow-prd/flow-tech/flow-ui/flow-epic into a single `/flow-spec` command with parallel execution of Tech + UI agents.

#### Added

- **Unified /flow-spec Command** - One command for entire specification phase
  - Full Mode: PRD → Tech + UI (parallel) → Epic/Tasks
  - Quick Mode: `--skip-tech --skip-ui` for small requirements
  - Backend Only: `--skip-ui`
  - Frontend Only: `--skip-tech`

- **Parallel Agent Execution** - Tech + UI agents run concurrently
  - `parallel-orchestrator.sh` for concurrent agent dispatch
  - Shared template components in `.claude/docs/templates/_shared/`

- **Shared Template Components** (v4.1)
  - `_shared/CONSTITUTION_CHECK.md` - Reusable Constitution compliance check
  - `_shared/VALIDATION_CHECKLIST.md` - Reusable validation checklist
  - `_shared/YAML_FRONTMATTER.md` - Reusable YAML frontmatter template

- **New Files**
  - `.claude/skills/workflow/flow-spec/SKILL.md` - Main instruction (~250 lines)
  - `.claude/skills/workflow/flow-spec/context.jsonl` - Context definition
  - `.claude/skills/workflow/flow-spec/scripts/entry-gate.sh` - Unified entry check
  - `.claude/skills/workflow/flow-spec/scripts/parallel-orchestrator.sh` - Parallel dispatch
  - `.claude/skills/workflow/flow-spec/scripts/exit-gate.sh` - Unified exit check
  - `.claude/commands/flow-spec.md` - Command trigger entry

#### Changed

- **workflow.yaml** - Updated with flow-spec as primary specification skill
- **cc-devflow-orchestrator** - Updated routing for unified flow

#### Deprecated

- `/flow-prd` - Use `/flow-spec` instead
- `/flow-tech` - Use `/flow-spec` instead
- `/flow-ui` - Use `/flow-spec` instead
- `/flow-epic` - Use `/flow-spec` instead

#### Simplified Workflows (v4.1)

```
Quick (3 steps):    /flow-init --quick → /flow-spec --skip-tech --skip-ui → /flow-dev → /flow-release
Standard (4 steps): /flow-init → /flow-spec → /flow-dev → /flow-quality → /flow-release
Full (5 steps):     /flow-init → /flow-clarify → /flow-spec → /flow-dev → /flow-quality --full → /flow-release
```

#### Quality Metrics

| Metric | Before (v4.0) | After (v4.1) | Improvement |
|--------|---------------|--------------|-------------|
| Command calls | 4 | 1 | -75% |
| Design phase time | 8-12 min | 5-8 min | -35% |
| Entry/Exit Gate code | ~280 lines | ~100 lines | -64% |

---

## [4.0.0] - 2026-02-07

### 🏗️ Skills-First Architecture: Unified Skills with Context Injection

v4.0.0 introduces a major architectural refactor, reorganizing 135 files into a unified Skills-First Architecture inspired by Trellis and OpenSpec.

#### Added

- **Skills-First Architecture** - All Skills organized into 4 groups
  - `workflow/`: 9 core workflow Skills (flow-init, flow-spec, flow-dev, flow-tech, flow-ui, flow-quality, flow-release, flow-fix)
  - `domain/`: 7 domain expertise Skills (tdd, debugging, brainstorming, attention-refresh, verification, receiving-review, finishing-branch)
  - `guardrail/`: 3 real-time compliance Skills (constitution-guardian, tdd-enforcer, file-header-guardian)
  - `utility/`: 8 development tool Skills (npm-release, skill-creator, skill-developer, writing-skills, fractal-docs, journey-checker, file-standards, constitution-quick-ref)

- **JSONL Context Injection** (Trellis-inspired)
  - Each Skill has `context.jsonl` defining required context files
  - `inject-skill-context.ts` hook auto-loads context before Skill execution
  - Variable substitution: `{REQ}` replaced with actual requirement ID
  - Optional files supported with `"optional": true`

- **workflow.yaml Dependency Graph** (OpenSpec-inspired)
  - Defines Skill dependencies with `requires` and `generates`
  - File existence state detection for workflow status
  - Clear visualization of Skill execution order

- **Self-Contained Skills**
  - Each Skill directory contains: SKILL.md + context.jsonl + scripts/ + references/ + assets/
  - SKILL.md limited to <500 lines for focused instructions
  - Agent instructions moved to `references/` subdirectory
  - Templates moved to `assets/` subdirectory

- **Multi-Module Cross-Platform Compiler** (v3.0)
  - Complete multi-module compilation: skills, commands, agents, rules, hooks
  - Platform-specific output formats:
    - **Codex**: `.codex/skills/`, `.codex/prompts/`, `AGENTS.md`
    - **Cursor**: `.cursor/rules/*.mdc`, `.cursor/subagents/`, `hooks.json`
    - **Qwen**: `.qwen/commands/*.toml`, `.qwen/agents/`, `CONTEXT.md`
    - **Antigravity**: `.agent/skills/`, `.agent/workflows/`, `.agent/rules/`
  - `context.jsonl` compilation-time expansion with platform-specific formats
  - 197 tests passing (24 new multi-module tests)

- **Specification Library** - `devflow/spec/{frontend,backend,shared}/index.md`

#### Changed

- **Skills Directory Structure** - Flat structure → Grouped directories
- **Commands** - Simplified to trigger entries, core logic in Skills
- **Context Loading** - Manual full load → On-demand automatic injection

#### Benefits

- **-75% Maintenance Points**: 4 directories → 1 directory
- **-70% Context Tokens**: On-demand loading vs full manual load
- **+100% Dependency Visibility**: Explicit workflow.yaml vs implicit

---

## [2.5.0] - 2026-01-25

### 🚀 新增 Skills：一致性检查与发版自动化

v2.5.0 引入了两个强大的新 Skills，分别解决了跨需求一致性检查和 NPM 包发版自动化的问题。

#### Added

- **Journey Coherence Checker Skill** - 跨需求一致性检查
  - 检查依赖满足情况 (Dependency Satisfaction)
  - 验证里程碑 Success Criteria
  - 检测累积偏差 (Cumulative Scope Drift)
  - 发现用户旅程空隙 (Journey Gaps)
  - 集成到发布门禁 (`/flow-release`)

- **NPM Release Skill** - NPM 发版流程自动化
  - 标准化发版工作流 (Patch/Minor/Major)
  - 自动更新 CHANGELOG.md
  - 自动创建并验证 Git Tags
  - 发布前安全检查

## [2.4.6] - 2026-01-12

### flow-init 工作流精简：研究步骤抽离为 subagent

将研究型内容从主流程中拆分到独立 subagent，减少上下文消耗，并同步更新命令、模板、脚本与文档。

#### Added

- **flow-researcher agent** - 执行 `/flow-init` 深度研究并写入 `devflow/requirements/$REQ_ID/research/`

#### Changed

- **flow-init command** - 重组流程，研究部分改由 subagent 执行
- **INIT_FLOW_TEMPLATE.md** - 精简初始化模板
- **populate-research-tasks.sh** - 更新 research tasks 填充逻辑
- **flow-init docs** - 同步更新中英文文档

#### Benefits

- **更省上下文**: 主会话仅保留关键决策与路径
- **更可追溯**: 研究产物落盘，便于审计与复用

---

## [2.4.5] - 2026-01-10

### 🛠️ Skills 增强：新增开发辅助工具

新增两个实用 Skills，优化开发工作流体验。

#### Added

- **npm-release Skill** - NPM 包发版流程标准化
  - 语义化版本管理（Patch/Minor/Major）
  - CHANGELOG.md 和 package.json 同步更新
  - Git tag 自动创建和推送
  - npm 发布前 dry-run 验证
  - 网络故障排查指南

- **writing-skills Skill** - Skill 开发最佳实践指南
  - 遵循 Anthropic 官方规范
  - YAML frontmatter 标准格式
  - Progressive disclosure 设计模式
  - Hook 机制集成（UserPromptSubmit, PreToolUse）
  - Trigger pattern 最佳实践

#### Benefits

- ✅ **标准化**: 确保发版流程一致性，减少人为错误
- ✅ **可追溯**: 版本号、CHANGELOG、Git tag 三者强制同步
- ✅ **质量保障**: Skill 开发遵循最佳实践，提升代码质量

---

## [2.4.4] - 2026-01-10

### 🧹 工作流优化：任务状态管理重构

移除 `.completed` 空文件生成机制，统一使用 TASKS.md checkbox 作为任务状态的单一真相源。

#### Changed

- **任务状态跟踪**: 移除 `TASK_*.completed` 文件生成，统一使用 TASKS.md 中的 checkbox 标记 (`- [ ]` / `- [x]`)
- **脚本重构**:
  - `generate-status-report.sh`: 改用 `grep -c "^\- \[x\]"` 统计已完成任务
  - `recover-workflow.sh`: 同步更新任务统计逻辑
- **文档更新**: 移除所有 `.completed` 文件相关说明（conventions, commands, agents, templates）

#### Benefits

- 🎯 **单一真相源**: TASKS.md 成为任务状态的唯一来源
- 🧹 **简洁性**: 不再生成大量空文件，减少文件系统污染
- 👀 **可读性**: 在 TASKS.md 中直接查看任务完成状态，无需查找多个文件

---

## [2.4.3] - 2026-01-09

### 🔄 CLI 变更：强力增量更新 (Aggressive Incremental Update)

`cc-devflow init` 命令现在采用强制同步策略。

#### Changed

- **增量同步机制**: 当目标目录已存在时：
  - 若文件缺失：**复制**新增。
  - 若文件存在但内容不一致：**直接覆盖**（以模板为准），确保项目配置与最新标准一致。
  - 仅当文件内容完全一致时跳过。
- **注意**: 此策略会覆盖用户的本地修改，请确保在使用前 commit 本地变更。

## [2.4.2] - 2026-01-09

### 🩹 CLI 增强：保留增量更新 (Preserved Incremental Update)
> 改为 2.4.3 后已被弃用

`cc-devflow init` 命令支持增量更新，保留用户修改。

#### Added

- **增量更新机制**:
  - 仅复制目标目录中**缺失**的文件。
  - **保留**所有已存在的文件。
  - 若目标文件存在但内容与新版模板不同，生成 `filename.new`。

---

## [2.4.0] - 2025-12-19

### 🎯 REQ-005 完成：Command Emitter (Multi-Platform Adapter Compiler)

v2.3.0 实现了命令模板编译器，将 `.claude/commands/*.md` 作为 SSOT 编译到 Codex/Cursor/Qwen/Antigravity 四个平台。

#### Added - 核心功能

- **`npm run adapt`** - 多平台命令编译器
  - `--platform <name>`: 指定目标平台 (codex, cursor, qwen, antigravity)
  - `--all`: 编译到所有平台 (默认)
  - `--check`: 漂移检测，不执行编译
  - `--skills`: 生成 skills-registry.json
  - `--verbose`: 详细输出

- **Parser 模块** (`lib/compiler/parser.js`)
  - 使用 gray-matter 解析 frontmatter
  - 检测占位符: `{SCRIPT:*}`, `{AGENT_SCRIPT}`, `$ARGUMENTS`
  - 生成 SHA-256 hash 支持增量编译

- **Transformer 模块** (`lib/compiler/transformer.js`)
  - `{SCRIPT:alias}` → `"bash <path>"`
  - `$ARGUMENTS` 平台映射: Qwen→`{{args}}`, Antigravity→`[arguments]`
  - `{AGENT_SCRIPT}` + `__AGENT__` 替换

- **Emitter 模块** (`lib/compiler/emitters/`)
  - `codex-emitter.js`: `.codex/prompts/*.md` (YAML frontmatter)
  - `cursor-emitter.js`: `.cursor/commands/*.md` (纯 Markdown)
  - `qwen-emitter.js`: `.qwen/commands/*.toml` (TOML 格式)
  - `antigravity-emitter.js`: `.agent/workflows/*.md` (12K 限制，自动拆分)

- **Manifest 模块** (`lib/compiler/manifest.js`)
  - 增量编译支持 (source/target hash 对比)
  - 漂移检测 (`--check` 模式)
  - 位置: `devflow/.generated/manifest.json`

- **Skills Registry** (`lib/compiler/skills-registry.js`)
  - 解析 `.claude/skills/` 目录
  - 生成 `skills-registry.json`
  - 支持 Markdown table 输出

#### Added - 新增文件

- `bin/adapt.js` - CLI 入口 (198 lines)
- `lib/compiler/index.js` - 编译器入口 (161 lines)
- `lib/compiler/parser.js` - 解析器 (170 lines)
- `lib/compiler/transformer.js` - 转换器 (95 lines)
- `lib/compiler/manifest.js` - Manifest 管理 (160 lines)
- `lib/compiler/schemas.js` - Zod schemas (100 lines)
- `lib/compiler/errors.js` - 错误类型 (100 lines)
- `lib/compiler/skills-registry.js` - Skills 注册表 (101 lines)
- `lib/compiler/emitters/*.js` - 4 个平台发射器
- `lib/compiler/CLAUDE.md` - 架构文档

#### Quality Metrics

- **测试覆盖率**: 79.81% (目标 ≥80%)
- **测试用例**: 203 passed
- **性能**: 单文件 1.6ms, 全量 <200ms (远优于 100ms/5s 目标)

---

## [2.2.0] - 2025-12-16

### 🎯 里程碑 M2 完成：质量左移 (Quality Left-Shift)

v2.2.0 完成了里程碑 M2，实现了完整的质量左移流程，在需求澄清后、任务分解前引入质量门禁检查。

#### Added - 核心功能

- **`/flow-checklist`** - 需求质量检查命令
  - 6 种 Checklist 类型 (ux, api, security, performance, data, general)
  - 5 质量维度评估 (Completeness, Clarity, Consistency, Measurability, Coverage)
  - Anti-Example 规则防止生成实现测试
  - 80% 门禁阈值与 `/flow-epic` Entry Gate 集成
  - 完成度计算脚本 (`calculate-checklist-completion.sh`)
  - 可视化报告 (`--status` 表格输出)
  - JSON 格式输出 (`--json` 参数)

#### Added - 新增文件

- `.claude/commands/flow-checklist.md` - 命令定义 (255 lines)
- `.claude/agents/checklist-agent.md` - 生成逻辑 (175 lines)
- `.claude/hooks/checklist-gate.js` - 门禁验证 (397 lines)
- `.claude/scripts/calculate-checklist-completion.sh` - 完成度计算 (243 lines)
- `.claude/scripts/checklist-errors.sh` - 错误码定义 (131 lines)
- `.claude/docs/templates/CHECKLIST_TEMPLATE.md` - 输出模板 (52 lines)
- `.claude/config/quality-rules.yml` - 质量规则配置 (161 lines)

#### Changed - 功能增强

- **`/flow-epic`** - 添加 Entry Gate 集成
  - Step 5 Checklist Gate 自动检查 PRD 质量
  - 支持 `--skip-gate --reason` 跳过门禁（需提供原因）
  - 审计日志记录所有门禁跳过操作

- **`.claude/skills/cc-devflow-orchestrator/SKILL.md`** - 工作流路由更新
  - 添加 `/flow-checklist` 命令路由
  - 更新工作流依赖关系

#### Quality Metrics

- **测试覆盖率**: 90% (26/29 AC covered)
- **安全评分**: 96.75/100 (0 Critical, 0 High issues)
- **User Stories**: 6/6 (100% delivered, including P2/P3 stories)
- **Constitution Compliance**: PASS

#### Technical Details

- 检查规则存储: `.claude/config/quality-rules.yml`
- Checklist 输出: `devflow/requirements/{REQ}/checklists/*.md`
- 最低通过分数: 80% (可配置)
- 技术栈: Bash, Node.js 18+, Claude API, YAML, Markdown

---

## [2.2.1] - 2025-12-16

### ✨ 功能增强：分支命名优化

v2.2.1 完成了 RM-003（M3 里程碑的一部分），增强了 Git 分支命名功能，支持中文特性名自动转换为拼音。

#### Added - 核心功能

- **中文转拼音分支命名支持**
  - 在 `slugify()` 函数中集成 `pypinyin` 库
  - 支持多音字智能选择（使用 `lazy_pinyin` 进行词组识别）
  - 保留英文和数字字符
  - 自动过滤特殊字符
  - 100% 向后兼容（英文输入行为不变）

#### Added - 新增函数

- `_chinese_to_pinyin()` - 中文转拼音辅助函数
  - 使用 Python `pypinyin` 库进行转换
  - 支持词组级识别，优化多音字处理
  - 缺失依赖时提供友好的警告信息

#### Changed - 功能增强

- **`slugify()` 函数增强**
  - 自动检测中文字符（Unicode 范围 \u4e00-\u9fff）
  - 中文输入时自动调用 `_chinese_to_pinyin()` 转换
  - 转换结果与其他字符统一处理为 slug 格式

#### Added - 测试覆盖

- `.claude/tests/slugify.bats` - 完整的单元测试套件 (10 个测试用例)
  - 英文输入兼容性测试（回归测试）
  - 中文输入转换测试
  - 混合输入处理测试
  - 特殊字符过滤测试
  - 多音字处理测试

#### Changed - 文档更新

- `README.md` - 添加 `pypinyin` 可选依赖说明
- `.claude/commands/flow-dev.md` - 文档修正

#### Technical Details

- **依赖**: `pypinyin` (Python 库，可选安装)
- **安装命令**: `pip install pypinyin`
- **文件修改**: `.claude/scripts/common.sh` (+71 lines)
- **测试文件**: `.claude/tests/slugify.bats` (+82 lines)
- **向后兼容**: ✅ 100% 兼容现有英文分支命名

#### Example

```bash
# 中文输入自动转换为拼音
slugify "用户登录功能"  # => "yong-hu-deng-lu-gong-neng"

# 混合输入处理
slugify "OAuth2认证"    # => "oauth2-ren-zheng"

# 英文输入行为不变（向后兼容）
slugify "User Login"    # => "user-login"
```

---

## [2.1.0] - 2025-11-07

### 🏢 核心突破：引入项目级命令（Project-Level Commands）

v2.1.0 的核心突破是引入了**项目级命令**，与之前的**需求级命令**形成两层体系：

#### Added - 项目级命令

**项目级命令** - 项目整体规划和架构设计（项目初期执行一次）

- **`/flow-roadmap`** - 交互式产品路线图生成
  - 6阶段交互式对话（愿景、用户、功能、技术、里程碑、指标）
  - 生成 `devflow/ROADMAP.md` 和 `devflow/BACKLOG.md`
  - 季度规划（Q1-Q4）和里程碑定义（M1-M8）
  - Feature Roadmap 表格和 Implementation Tracking 表格

- **`/flow-architecture`** - 系统架构设计与图生成
  - 生成 4 种架构图（Mermaid 格式）
    1. Feature Architecture（功能分层架构）
    2. Technical Architecture（技术架构）
    3. Module Structure（模块结构图）
    4. Requirement Dependency（需求依赖关系）
  - 生成 `devflow/ARCHITECTURE.md`

- **`/flow-guidelines`** - 项目规范生成
  - 基于 package.json 自动识别技术栈
  - 生成 frontend-guidelines Skill（React/Vue/Angular等）
  - 生成 backend-guidelines Skill（Node/Go/Python等）
  - 包含编码规范、最佳实践、测试要求

#### Added - 需求级命令增强

**Stage 1.5: 路线图与架构上下文加载** (`/flow-init` 增强)

- 初始化需求时自动检查 `ROADMAP.md` 存在性
- 自动定位需求在路线图中的位置
  - RM-ID (Roadmap Item ID)
  - Milestone (M{n}-Q{q}-{yyyy})
  - Quarter & Cluster
- 自动加载 `ARCHITECTURE.md` 并显示架构上下文
  - Feature Architecture Layer
  - Technical Architecture (Tech Stack)
  - Module Structure (Target Modules)

#### Added - 新增代理

- **`architecture-designer`** - 架构设计专家（4种架构图生成）
- **`project-guidelines-generator`** - 项目规范生成器
- **`roadmap-planner`** - 产品路线图规划师（已规划，待实现）

#### Added - 新增脚本

- `locate-requirement-in-roadmap.sh` - 从 ROADMAP.md 定位需求位置
- `sync-roadmap-progress.sh` - 同步实际开发进度到路线图
- `calculate-quarter.sh` - 计算日期对应的季度
- `validate-hooks.sh` - 验证 Hooks 配置和执行权限
- `check-dependencies.sh` - 检查项目依赖完整性

#### Added - 新增模板

- `ROADMAP_TEMPLATE.md` - 产品路线图模板
- `ARCHITECTURE_TEMPLATE.md` - 架构设计模板
- `BACKLOG_TEMPLATE.md` - 需求待办列表模板

#### Changed - 文档改进

- **README 完全重构**
  - 从 2,101 行精简到 377 行（减少 82%）
  - 使用 `<details>` 折叠非核心内容
  - 添加完整目录（可点击锚点导航）
  - 新增"核心概念"章节（Hooks 系统、Skills 系统）
  - 大幅扩展"命令参考"章节
    - 明确区分**项目级命令**和**需求级命令**
    - 每个命令都有详细的使用说明
    - 包含使用场景表（✅ 推荐 / ❌ 不推荐）
    - 提供多个实际示例
    - 说明预期输出
    - 列出相关命令
  - 新增"版本历史"章节
  - 双语同步（中文/英文）

- **新增 25+ 个详细文档**
  - `docs/commands/*.md` - 13 个命令详细文档
  - `docs/guides/*.md` - 5 个使用指南
  - `docs/architecture/*.md` - 4 个架构文档
  - `docs/examples/*.md` - 3 个示例文档

#### Changed - 配置变更

- `.claude/settings.json` 更新所有 hook 路径为 `.sh`
- 新增 Skills 配置（roadmap-planner, architecture-designer）

#### Fixed - Bug 修复

- 修复 flow-init Stage 2.6 的 `populate-research-tasks.sh` 调用缺失问题
- 修复 research.md TODO 占位符问题
- 实施数据契约一致性

---

## [1.0.0] - 2025-09-25

### 🎉 Major Updates

#### Added - Constitution System v2.0.0

- **10 Articles** governing quality, security, and architecture
  1. Article I: Quality First
  2. Article II: Security First
  3. Article III: No Hardcoded Secrets
  4. Article IV: Test-First Development
  5. Article V: Deployment-First Integration
  6. Article VI: Test Coverage Mandate
  7. Article VII: No Code Duplication
  8. Article VIII: Fail Fast
  9. Article IX: Clear Error Messages
  10. Article X: Requirement Boundary

- **Phase -1 Constitutional Gates**
  - Simplicity Gate（简洁性闸门）
  - Anti-Abstraction Gate（反抽象闸门）
  - Integration-First Gate（集成优先闸门）

- **100% test coverage** (38/38 tests passed)
- Automated compliance checking at every workflow stage
- Amendment process with formal versioning and auto-propagation

#### Added - Research Agent Model

**Execution Model**: Research Agents + Main Agent

- **11 Read-only Analysis Agents**
  - prd-writer
  - ui-designer (conditional)
  - tech-architect
  - planner
  - dev-implementer
  - qa-tester (called twice)
  - security-reviewer (called twice)
  - release-manager
  - impact-analyzer
  - compatibility-checker
  - consistency-checker
  - bug-analyzer

- **Main Agent (Claude)** handles all code operations

- **Clear Tool Distribution**
  - Research Agents: Read, Grep, Glob (analysis only)
  - Main Agent: Edit, Write, Bash, Git (execution)

#### Added - Template-Driven Development

**Self-Executable Templates**:

- `PRD_TEMPLATE.md` - Product Requirements (10-step execution flow)
- `UI_PROTOTYPE_TEMPLATE.md` - UI Prototype (Artistic design guidance)
- `EPIC_TEMPLATE.md` - Epic Planning (10-step execution flow)
- `TASKS_TEMPLATE.md` - Task Breakdown (TDD-ordered phases)
- `INTENT_CLARIFICATION_TEMPLATE.md` - Intent-driven clarification flow

**Template Usage**:
1. Agent reads template
2. Follows Execution Flow steps
3. Generates complete document
4. No placeholders left unfilled
5. Passes Validation Checklist

#### Added - Unified Script Infrastructure

**Standardized Scripts** (`.claude/scripts/`):

- `common.sh` - Core functions (log_event, get_repo_root)
- `check-prerequisites.sh` - Prerequisites validation
- `setup-epic.sh` - Epic/Tasks structure initialization
- `check-task-status.sh` - Task status and progress tracking
- `mark-task-complete.sh` - Task completion marking
- `generate-status-report.sh` - Status report generation
- `validate-constitution.sh` - Constitution compliance checking
- `recover-workflow.sh` - Workflow recovery logic

**Benefits**:
- 100% test coverage
- JSON output support (`--json` flag)
- Consistent code paths across all agents
- Easier maintenance and updates

#### Added - Quality Gates & Hooks

**Quality Gates**:
- Pre-push Guard (TypeScript, tests, linting, security, build)
- Constitution Compliance (enforced at every stage)
- TDD Checkpoint (TEST VERIFICATION CHECKPOINT)
- Markdown Formatter (automatic documentation formatting)
- Conventional Commits (standardized commit message format)

**Hooks System**:
- PreToolUse Hook - Block non-compliant operations (real-time)
- PostToolUse Hook - Auto-record file changes
- UserPromptSubmit Hook - Intelligent skill recommendations
- Stop Hook - Error handling hints

#### Added - Core Commands

**Requirement Management**:
- `/flow-new` - Start new requirement development (full flow)
- `/flow-init` - Initialize requirement structure
- `/flow-status` - Query development progress
- `/flow-restart` - Resume interrupted development
- `/flow-update` - Update task progress

**Quality Assurance**:
- `/flow-verify` - Verify document consistency
- `/flow-qa` - Execute quality assurance
- `/flow-constitution` - Manage Constitution compliance

**Tools**:
- `/flow-fix` - One-command bug fix flow
- `/flow-ideate` - Intent-driven requirement development
- `/flow-upgrade` - PRD version management
- `/flow-release` - Create release

#### Added - Single-Track Architecture

**Philosophy**: Keep one canonical workspace per requirement

```
devflow/requirements/REQ-123/
├── orchestration_status.json  # Single source of truth
├── EXECUTION_LOG.md           # Audit trail
├── PRD.md
├── EPIC.md
├── TASKS.md                   # Single unified task list
├── tasks/                     # Task artifacts
├── research/                  # External references
├── TEST_PLAN.md
├── TEST_REPORT.md
├── SECURITY_PLAN.md
└── SECURITY_REPORT.md
```

#### Added - Testing Framework

**100% Test Coverage**:

**Script Test Suites** (8/8 Passed):
- test_check_prerequisites (18 tests)
- test_check_task_status (18 tests)
- test_common (15 tests)
- test_mark_task_complete (15 tests)
- test_setup_epic (13 tests)
- test_validate_constitution (4 tests)

**Constitution Test Suites** (4/4 Passed):
- test_version_consistency (5 tests)
- test_article_coverage (10 tests)
- test_template_completeness (10 tests)
- test_agent_assignment (13 tests)

**Total**: 38/38 tests passed ✅

#### Added - Three-Layer Information Architecture

**Constitution Layer** (Immutable Principles):
- 10 Articles + Phase -1 Gates
- Quality gates and compliance standards
- Highest authority

**Guides Layer** (Operational How-To):
- Workflow SOPs
- Technical operation guides
- Agent coordination protocols

**Rules Layer** (Project Conventions):
- Core Patterns (4 fundamental principles)
- DevFlow Conventions (CC-DevFlow specific)

**Benefits**:
- 55% reduction in rules context (~100KB tokens saved)
- Clear separation of concerns
- Easy maintenance
- Scalable for 10+ years

---

## [0.9.0] - 2025-09-10 (Beta)

### Added

- Initial beta release
- Basic workflow commands (`/flow-new`, `/flow-init`)
- PRD and EPIC generation
- Basic quality gates
- Git integration

### Known Issues

- No Constitution system
- Manual task tracking
- Limited test coverage
- No consistency verification

---

## Future Releases

See [ROADMAP.md](devflow/ROADMAP.md) for planned features and improvements.

---

## Links

- [GitHub Repository](https://github.com/Dimon94/cc-devflow)
- [Documentation](docs/)
- [Contributing](CONTRIBUTING.md)
- [License](LICENSE)
