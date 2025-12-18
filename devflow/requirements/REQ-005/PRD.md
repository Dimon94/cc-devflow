# PRD: REQ-005 - Multi-Platform Adaptation (Compile From `.claude/`)

**Status**: Draft
**Created**: 2025-12-18
**Owner**: System
**Type**: Requirement

**Input**: `.claude/` 目录资产（commands/scripts/skills/hooks/rules/constitution）+ `spec-kit/` 参考实现
**Prerequisites**: 仓库中已存在 `.claude/`（作为 SSOT）

---

## 概览

实现多平台适配的“编译器式适配层”：以 `.claude/` 为单一事实源（SSOT），将 `.claude/commands`、`.claude/skills`、`.claude/scripts`、`.claude/hooks` 等资产编译为各平台可消费的 rules/workflows/prompts。

目标平台第一批：Codex CLI / Cursor / Qwen Code / Antigravity IDE（谷歌体系仅适配 Antigravity IDE，不做 Gemini CLI）。

---

## 核心价值

- **Single Source of Truth**: `.claude/` 是唯一源资产，避免每个平台维护一套重复模板。
- **Compile, Don’t Duplicate**: 通过编译器生成平台产物（rules/workflows/prompts），生成物可删可重建。
- **Graceful Degradation**: hooks/skills 的能力差异通过“workflow gates + skills registry/loader”降级，避免失控。

---

## 背景与目标

### 业务背景

cc-devflow 希望在多个 agent 平台使用（Codex/Cursor/Qwen/Antigravity 等）。不同平台对“命令、规则、工作流”的承载形式不同，但 `.claude/` 中的内容是当前最完整、最有约束力的资产集合。

### 问题陈述

- 为每个平台手工维护一套配置/模板，会产生大量重复与漂移，无法保证 `.claude/` 的一致性。
- hooks/skills 在 Claude Code 中能提供强约束，但其他平台往往没有等价机制，直接“复制”会失控。

### 目标

- **主要目标**: 实现 Adapter Compiler：从 `.claude/` 编译生成平台产物（commands/workflows/rules/context）。
- **成功指标**:
  - Codex/Cursor/Qwen/Antigravity 能使用核心 `flow-*` workflows。
  - Skills 通过 Registry + Loader 实现渐进披露。
  - hooks 的门禁能力以 workflow gate 形式可执行。

---

## 用户故事与验收标准

### Story 1: Commands 编译（占位符展开 + 多平台输出） (Priority: P1) 🎯 MVP

**As a** Multi-Platform User
**I want** to compile `.claude/commands/*.md` into platform-native command/workflow files
**So that** I can use cc-devflow workflows across platforms without duplicating templates

**Independent Test**: 选取 `flow-prd.md`，分别编译到 Codex 与 Antigravity，验证输出文件存在且占位符已展开。

**Acceptance Criteria**:

```gherkin
AC1: Given source command `.claude/commands/flow-prd.md`
     When compiling for platform "codex"
     Then output `.codex/prompts/flow-prd.md` should exist
     And `{SCRIPT:prereq}` should be expanded into an executable command

AC2: Given a command referencing an undefined `{SCRIPT:alias}`
     When compiling
     Then compilation should fail with a clear error message

AC3: Given platform "antigravity"
     When compiling
     Then output `.agent/workflows/flow-prd.md` should exist
     And workflow frontmatter should include `description:`
```

---

### Story 2: Skills 渐进披露（Registry + Loader） (Priority: P1) 🎯 MVP

**As a** Multi-Platform User
**I want** to see a short list of available skills and load one on demand
**So that** I can keep the default rules/context small while still having full skill content when needed

**Independent Test**: 生成 registry，执行 `load_skill cc-devflow-orchestrator` 输出对应 `SKILL.md`。

**Acceptance Criteria**:

```gherkin
AC1: Given `.claude/skills/*/SKILL.md`
     When compiling skills registry
     Then registry includes name + description + triggers + path for each skill

AC2: Given `load_skill <name>`
     When name exists
     Then tool prints the exact `SKILL.md` content

AC3: Given `load_skill <name>`
     When name does not exist
     Then tool prints a clear error and lists available skills
```

---

### Story 3: Hooks 降级为 Workflow Gates (Priority: P2)

**As a** Platform User
**I want** critical gates (e.g. checklist threshold) to run as explicit workflow steps
**So that** I can keep process control even when the platform lacks native hooks

**Acceptance Criteria**:

```gherkin
AC1: Given a gate-able hook (e.g. checklist gate)
     When compiling to any workflow platform
     Then workflow includes an explicit step that runs the gate and checks exit code
```

---

## 非功能性要求

### 可维护性

- **SSOT**: `.claude/` 必须保持唯一源；禁止手写重复的 `.codex/.cursor/.qwen/.agent`。
- **确定性输出**: 同一输入在同一版本编译器下输出必须稳定（manifest/hash 可追踪）。

### 平台约束

- Antigravity rules/workflows 单文件 ≤ 12,000 chars；超限必须拆分并使用 `@filename` 引用。

---

## 依赖关系

### 上游依赖

- RM-006 (Agent Adapter Architecture)

### 下游依赖

- RM-007 (Command Emitter)
- RM-008 (Adapter Compiler)
- RM-009/010/011/012 (Platform outputs)

