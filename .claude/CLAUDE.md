# CC-DevFlow .claude Directory Architecture

## Purpose
This directory contains Claude Code CLI extensions for the CC-DevFlow development workflow system.

## Directory Structure (v4.1 Skills-First Architecture)

```
.claude/
├── skills/                    # Skills 目录 (核心)
│   ├── workflow.yaml          # 工作流依赖图定义 [NEW: v4.0]
│   │
│   ├── workflow/              # 工作流 Skills [NEW: v4.0]
│   │   ├── flow-init/         # 需求初始化
│   │   │   ├── SKILL.md       # 核心指令 (<500 行)
│   │   │   ├── context.jsonl  # 上下文定义 (借鉴 Trellis)
│   │   │   ├── scripts/       # 内嵌脚本
│   │   │   ├── references/    # Agent 指令
│   │   │   └── assets/        # 模板
│   │   ├── flow-spec/         # 统一规格阶段 [NEW: v4.1] ⭐
│   │   ├── flow-prd/          # PRD 生成 (deprecated, use flow-spec)
│   │   ├── flow-tech/         # 技术设计 (deprecated, use flow-spec)
│   │   ├── flow-ui/           # UI 原型 (deprecated, use flow-spec)
│   │   ├── flow-epic/         # Epic/Tasks (deprecated, use flow-spec)
│   │   └── flow-dev/          # 开发执行
│   │
│   ├── domain/                # 领域 Skills
│   │   ├── tdd/               # TDD Iron Law
│   │   ├── debugging/         # 系统化调试
│   │   └── brainstorming/     # 头脑风暴
│   │
│   ├── guardrail/             # 守护 Skills
│   │   ├── constitution-guardian/
│   │   └── tdd-enforcer/
│   │
│   └── utility/               # 工具 Skills
│       ├── git-commit/
│       └── npm-release/
│
├── commands/                  # 精简为触发入口
├── agents/                    # Agent 指令 (迁移到 skills/*/references/)
├── hooks/                     # 钩子脚本
│   └── inject-skill-context.ts  # 上下文注入钩子 [NEW: v4.0]
├── scripts/                   # 共享脚本
└── docs/templates/            # 共享模板
    └── _shared/               # 共享模板组件 [NEW: v4.1]
        ├── CONSTITUTION_CHECK.md
        ├── VALIDATION_CHECKLIST.md
        └── YAML_FRONTMATTER.md

devflow/
├── spec/                      # 分层规范库 [NEW: v4.0]
│   ├── frontend/index.md      # 前端规范
│   ├── backend/index.md       # 后端规范
│   └── shared/index.md        # 共享规范
└── requirements/              # 需求目录
```

## v4.0 Skills-First Architecture

### 核心创新 (借鉴 Trellis + OpenSpec)

| 来源 | 创新点 | 应用方式 |
|------|--------|----------|
| **Trellis** | JSONL 上下文注入 | 每个 Skill 有 `context.jsonl` |
| **Trellis** | 分层规范库 | `devflow/spec/{frontend,backend}/` |
| **OpenSpec** | Schema 驱动工作流 | `workflow.yaml` 定义依赖图 |
| **OpenSpec** | 文件存在性状态检测 | 通过 generates 判断完成状态 |

### Skill 结构规范

```
skill-name/
├── SKILL.md           # 核心指令 (<500 行)
├── context.jsonl      # 上下文定义
├── scripts/           # 内嵌脚本
├── references/        # Agent 指令
└── assets/            # 模板
```

### context.jsonl 格式

```jsonl
{"file": "devflow/requirements/{REQ}/BRAINSTORM.md", "reason": "Original intent"}
{"file": "devflow/spec/frontend/index.md", "reason": "Frontend conventions", "optional": true}
```

---

## Legacy Structure (保留兼容)

```
.claude/
├── agents/                    # Agent instruction files (迁移中)
├── commands/                  # Slash command definitions (精简为触发入口)
├── hooks/                     # JavaScript hooks
├── scripts/                   # Bash utility scripts
└── docs/templates/            # Templates
```

## REQ-002 Module: /flow-checklist

### Purpose
"Unit Tests for English" - Quality validation for requirement documents before task planning.

### Components

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| Command | `commands/flow-checklist.md` | 256 | Command definition and flow |
| Agent | `agents/checklist-agent.md` | 176 | Generation logic with Anti-Example rules |
| Gate Hook | `hooks/checklist-gate.js` | 320 | Epic entry gate validation |
| Calculator | `scripts/calculate-checklist-completion.sh` | 244 | Completion percentage |
| Errors | `scripts/checklist-errors.sh` | 132 | Error codes and validation |
| Template | `docs/templates/CHECKLIST_TEMPLATE.md` | 53 | Output format |

### Integration Points

1. **Entry**: After `/flow-prd`, before `/flow-epic`
2. **Gate**: Integrated into `/flow-epic` Entry Gate (Step 5)
3. **Config**: `config/quality-rules.yml` (80% threshold)
4. **Output**: `devflow/requirements/{REQ}/checklists/*.md`

### Quality Dimensions
- Completeness
- Clarity
- Consistency
- Measurability
- Coverage

---

**Last Updated**: 2025-12-15
**REQ-002 Version**: 1.0.0

---

## v2.3.0 Module: Ralph × Manus Integration

### Purpose
Combine Ralph-Wiggum's autonomous iteration loop with Manus-style Planning-with-Files for memory-enhanced continuous development.

### Core Concepts

**Ralph Loop**: Autonomous iteration until completion (持续迭代直到完成，永不放弃)
- Prompt stays constant, file state changes
- Claude learns from its own previous work
- Auto-retry on errors, no manual intervention

**Manus 6 Principles**:
1. 文件系统作外部记忆 - Filesystem as external memory
2. 注意力操纵 - Attention manipulation (read goal files at key moments)
3. 保留失败痕迹 - Keep failure traces (ERROR_LOG.md, research/attempts/)
4. 避免少样本过拟合 - Avoid few-shot overfitting
5. 稳定前缀优化缓存 - Stable prefix for KV-cache optimization
6. 只追加上下文 - Append-only context

**Why They're a Perfect Match**:
- Ralph: "监督把活干完" (supervise task completion)
- Manus: "认真把进度记下来" (carefully record progress)
- Together: 有记忆的持续迭代系统 (memory-enhanced continuous iteration)

### Components

| Component | File | Purpose |
|-----------|------|---------|
| **Command** | `commands/flow-dev.md` | Autonomous iteration loop (Default) |
| **Attention Skill** | `skills/flow-attention-refresh/SKILL.md` | 4 attention refresh protocols |
| **TDD Skill** | `skills/flow-tdd/SKILL.md` | Error recording integration |
| **Error Template** | `docs/templates/ERROR_LOG_TEMPLATE.md` | Execution error log format |
| **Attempt Template** | `docs/templates/ATTEMPT_TEMPLATE.md` | Research attempt log format |

**Modified Files**:
- `commands/flow-dev.md` - Merged Ralph Loop (Autonomous by default)
- `commands/flow-init.md` - Research made mandatory via `flow-researcher` subagent (context-isolated)
- `skills/cc-devflow-orchestrator/SKILL.md` - Updated routing for autonomous flow

### Attention Refresh Protocols

| Protocol | Trigger Point | Reads | Purpose |
|----------|---------------|-------|---------|
| Protocol 1 | Every flow-* Entry Gate | BRAINSTORM.md | Align with original intent |
| Protocol 2 | flow-dev task start | TASKS.md T### + DoD | Clarify task goal |
| Protocol 3 | Ralph iteration start | TASKS.md + ERROR_LOG.md | Next action + avoid errors |
| Protocol 4 | After error | ERROR_LOG.md | Root cause analysis |

### ERROR_LOG.md Structure

```markdown
## [TIMESTAMP] E###: TITLE

**Phase**: flow-dev / T###
**Error Type**: Test Failure | Build Error | Runtime Error
**Error Message**: [full error]
**Root Cause**: [after analysis]
**Resolution**: [after fix]
**Prevention**: [optional]
```

### research/attempts/ Structure

```markdown
# Attempt: [方案名]

**Date**: YYYY-MM-DD
**Context**: 解决 [什么问题]

## Approach / Result / Reason / Learning / References
```

### Integration Points

1. **Entry**: After `/flow-epic`, execute `/flow-dev`
2. **Trigger**: `status: "epic_complete"` → `/flow-dev` (Autonomous by default)
3. **Output**:
   - `ERROR_LOG.md` (execution errors)
   - `research/attempts/` (research phase failures)
   - All tasks completed with TDD

### Modes: Autonomous (Default) vs Manual

| | /flow-dev (Default) | /flow-dev --manual |
|--|-----------|-------------|
| 退出条件 | 迭代直到完成或上限 | 任务失败可停止 |
| 错误处理 | 自动重试 | 提示用户修复 |
| 注意力刷新 | 每迭代刷新（含错误学习） | 每任务一次 |
| 适用场景 | 可无人值守 | 需要人工监督 |
| ERROR_LOG | 强制记录 | 可选记录 |

### Success Metrics (Target)

| 指标 | 目标 |
|------|------|
| 任务完成率 (无人工干预) | ≥85% |
| 测试失败后自动恢复率 | ≥70% |
| 上下文遗忘导致的返工 | ≤0.5 次/需求 |
| 错误重复发生率 | ≤10% |

---

**Last Updated**: 2026-02-06
**v2.3.0 Module**: Ralph × Manus Integration

---

## v3.0.0 Module: OpenSpec × Trellis Integration

### Purpose

Borrow design concepts from OpenSpec (Delta Specs + Archive) and Trellis (Context Injection + Ralph Loop) to solve 5 major pain points:

1. **Context Bloat** → Staged Context Injection (RM-015)
2. **Weak Quality Gates** → Programmatic Verification (RM-016)
3. **No Incremental Tracking** → Delta Specs Engine (RM-017)
4. **No Session Persistence** → Workspace System (RM-018)
5. **Scattered Guidelines** → Unified Spec Directory (RM-019)
6. **Workflow Redundancy** → Flow Simplification (RM-020)

### New Directory Structure

```
devflow/
├── specs/              # SSOT for specifications [NEW: RM-017]
│   └── modules/        # Module-level specs
├── workspace/          # Developer workspaces [NEW: RM-018]
│   └── {developer}/    # Per-developer journals
├── spec/               # Unified project specs [NEW: RM-019]
│   ├── frontend/       # Frontend specifications
│   ├── backend/        # Backend specifications
│   └── shared/         # Cross-cutting specs
├── QUICK_REFERENCE.md  # v3.0 workflow quick reference [NEW]
└── MIGRATION_v3.0.md   # Migration guide [NEW]

.claude/
├── config/
│   └── quality-gates.yml  # Programmatic verification rules [NEW: RM-016]
├── hooks/
│   ├── inject-agent-context.ts  # Context injection hook [NEW: RM-015]
│   ├── types/
│   │   └── context-injection.d.ts  # TypeScript types [NEW]
│   └── utils/
│       └── jsonl-parser.ts  # JSONL parsing utilities [NEW]
├── commands/
│   ├── flow-context.md    # Context management [NEW: RM-015]
│   ├── flow-delta.md      # Delta specs management [NEW: RM-017]
│   ├── flow-workspace.md  # Workspace management [NEW: RM-018]
│   └── flow-quality.md    # Combined quality verification [NEW: RM-020]
├── scripts/
│   ├── flow-context-*.sh  # Context scripts [NEW]
│   ├── flow-delta-*.sh    # Delta scripts [NEW]
│   ├── flow-workspace-*.sh # Workspace scripts [NEW]
│   ├── flow-quality-*.sh  # Quality scripts [NEW]
│   ├── run-quality-gates.sh  # Gate execution [NEW: RM-016]
│   └── record-quality-error.sh  # Error recording [NEW]
└── docs/templates/
    ├── context/           # Context JSONL templates [NEW: RM-015]
    │   ├── dev.jsonl.template
    │   ├── epic.jsonl.template
    │   └── ...
    ├── DELTA_SPEC_TEMPLATE.md  # Delta spec format [NEW: RM-017]
    └── JOURNAL_TEMPLATE.md     # Journal format [NEW: RM-018]
```

### New Commands

| Command | Purpose | Module |
|---------|---------|--------|
| `/flow-context` | Manage staged context injection | RM-015 |
| `/flow-delta` | Manage delta specs | RM-017 |
| `/flow-workspace` | Manage developer workspace | RM-018 |
| `/flow-quality` | Combined quality verification | RM-020 |

### Simplified Workflows

```
【精简流程】(5 步, 适合小需求)
/flow-init --quick → /flow-prd --quick → /flow-epic → /flow-dev → /flow-release

【标准流程】(6 步, 适合中等需求)
/flow-init → /flow-prd → /flow-epic → /flow-dev → /flow-quality → /flow-release

【完整流程】(8 步, 适合大需求)
/flow-init → /flow-clarify → /flow-prd → /flow-tech → /flow-ui
    → /flow-epic → /flow-dev → /flow-quality --full → /flow-release
```

### Deprecations

| Old Command | Replacement | Status |
|-------------|-------------|--------|
| `/flow-review` | `/flow-quality --full` | Deprecated (warning) |
| `/flow-qa` | `/flow-quality --full` | Deprecated (warning) |

### Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Agent context size | 10000+ tokens | 3000 tokens | -70% |
| Single command time | 2-3 min | 1-1.5 min | -50% |
| Full workflow time | 30-45 min | 15-20 min | -50% |
| Rework rate | ~30% | ~10% | -67% |

---

**Last Updated**: 2026-02-07
**v3.0.0 Module**: OpenSpec × Trellis Integration

---

## v4.1.0 Module: Unified Specification Phase

### Purpose

合并 flow-prd/flow-tech/flow-ui/flow-epic 为统一的 `/flow-spec` 命令，减少命令调用次数，利用 Agent 并行执行潜力。

### Key Changes

| Before (v4.0) | After (v4.1) | Improvement |
|---------------|--------------|-------------|
| 4 个独立命令 | 1 个统一命令 | -75% 命令数 |
| 串行执行 | Tech + UI 并行 | -35% 时间 |
| 重复 Entry/Exit Gate | 统一 Gate | -280 行代码 |

### New Command: /flow-spec

```bash
# Full Mode (默认)
/flow-spec "REQ-123"

# Quick Mode (小需求)
/flow-spec "REQ-123" --skip-tech --skip-ui

# Backend Only
/flow-spec "REQ-123" --skip-ui

# Frontend Only
/flow-spec "REQ-123" --skip-tech
```

### Execution Flow

```
PRD (sequential) → Tech + UI (parallel) → Epic (sequential)

Time ────────────────────────────────────────────►

T0   ┌─────────────┐
     │ prd-writer  │  (必须先完成)
     └──────┬──────┘
            │
T1          ├────────────────────┐
            │                    │
     ┌──────▼──────┐      ┌──────▼──────┐
     │tech-architect│      │ ui-designer │  (并行)
     └──────┬──────┘      └──────┬──────┘
            │                    │
T2          └─────────┬──────────┘
                      │
               ┌──────▼──────┐
               │   planner   │  (等待两者完成)
               └─────────────┘
```

### New Files

| File | Purpose |
|------|---------|
| `.claude/skills/workflow/flow-spec/SKILL.md` | 主指令 (~250 行) |
| `.claude/skills/workflow/flow-spec/context.jsonl` | 上下文定义 |
| `.claude/skills/workflow/flow-spec/scripts/entry-gate.sh` | 统一入口检查 |
| `.claude/skills/workflow/flow-spec/scripts/parallel-orchestrator.sh` | 并行调度逻辑 |
| `.claude/skills/workflow/flow-spec/scripts/exit-gate.sh` | 统一出口检查 |
| `.claude/docs/templates/_shared/CONSTITUTION_CHECK.md` | 共享 Constitution 检查 |
| `.claude/docs/templates/_shared/VALIDATION_CHECKLIST.md` | 共享验证清单 |
| `.claude/docs/templates/_shared/YAML_FRONTMATTER.md` | 共享 YAML 头部 |

### Deprecations

| Old Command | Replacement | Status |
|-------------|-------------|--------|
| `/flow-prd` | `/flow-spec` | Deprecated (warning) |
| `/flow-tech` | `/flow-spec` | Deprecated (warning) |
| `/flow-ui` | `/flow-spec` | Deprecated (warning) |
| `/flow-epic` | `/flow-spec` | Deprecated (warning) |

### Simplified Workflows (v4.1)

```
【精简流程】(3 步, 适合小需求)
/flow-init --quick → /flow-spec --skip-tech --skip-ui → /flow-dev → /flow-release

【标准流程】(4 步, 适合中等需求)
/flow-init → /flow-spec → /flow-dev → /flow-quality → /flow-release

【完整流程】(5 步, 适合大需求)
/flow-init → /flow-clarify → /flow-spec → /flow-dev → /flow-quality --full → /flow-release
```

### Expected Improvements

| Metric | Before (v4.0) | After (v4.1) | Improvement |
|--------|---------------|--------------|-------------|
| 命令调用次数 | 4 | 1 | -75% |
| 设计阶段时间 | 8-12 min | 5-8 min | -35% |
| Entry/Exit Gate 代码 | ~280 行 | ~100 行 | -64% |

---

**Last Updated**: 2026-02-07
**v4.1.0 Module**: Unified Specification Phase
