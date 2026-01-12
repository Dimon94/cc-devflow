# CC-DevFlow .claude Directory Architecture

## Purpose
This directory contains Claude Code CLI extensions for the CC-DevFlow development workflow system.

## Directory Structure

```
.claude/
├── agents/                    # Agent instruction files (research-type, invoked by commands)
│   ├── checklist-agent.md     # Checklist generation logic [NEW: REQ-002]
│   ├── clarify-analyst.md     # Requirements clarification
│   ├── flow-researcher.md     # /flow-init mandatory research runner (subagent; file-based memory)
│   ├── prd-writer.md          # PRD generation
│   ├── tech-architect.md      # Technical design
│   ├── planner.md             # EPIC/TASKS planning
│   ├── code-reviewer.md       # Code review
│   ├── qa-tester.md           # QA testing
│   └── ...                    # Other agents
│
├── commands/                  # Slash command definitions
│   ├── flow-checklist.md      # /flow-checklist command [NEW: REQ-002]
│   ├── flow-init.md           # /flow-init (modified: research delegated to flow-researcher subagent)
│   ├── flow-clarify.md        # /flow-clarify
│   ├── flow-prd.md            # /flow-prd
│   ├── flow-tech.md           # /flow-tech
│   ├── flow-epic.md           # /flow-epic (modified: Checklist Gate)
│   ├── flow-dev.md            # /flow-dev (Autonomous by default, /w --manual opt)
│   └── ...                    # Other commands
│
├── hooks/                     # JavaScript hooks for validation/gating
│   └── checklist-gate.js      # Epic entry gate hook [NEW: REQ-002]
│
├── scripts/                   # Bash utility scripts
│   ├── calculate-checklist-completion.sh  # Completion calculation [NEW: REQ-002]
│   ├── checklist-errors.sh    # Error codes and validation [NEW: REQ-002]
│   ├── common.sh              # Shared functions
│   ├── check-prerequisites.sh # Entry gate checks
│   └── ...                    # Other scripts
│
├── skills/                    # Reusable skill definitions
│   ├── fractal-docs-generator/   # 目录级 CLAUDE.md 自动生成
│   │   └── SKILL.md
│   ├── file-header-guardian/     # 文件头注释 @input/@output/@pos 守护
│   │   └── SKILL.md
│   ├── flow-attention-refresh/   # 注意力刷新协议 [NEW: v2.3.0 Ralph × Manus]
│   │   └── SKILL.md
│   ├── flow-tdd/                 # TDD enforcement (modified: Error Recording)
│   │   └── SKILL.md
│   ├── cc-devflow-orchestrator/
│   │   └── SKILL.md           # Workflow router (modified: /flow-checklist, /flow-dev autonomous)
│   └── ...
│
└── docs/
    └── templates/
        ├── CHECKLIST_TEMPLATE.md  # Checklist output template [NEW: REQ-002]
        ├── ERROR_LOG_TEMPLATE.md  # Error log template [NEW: v2.3.0 Ralph × Manus]
        ├── ATTEMPT_TEMPLATE.md    # Research attempt template [NEW: v2.3.0 Ralph × Manus]
        └── ...                    # Other templates
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

**Last Updated**: 2026-01-08
**v2.3.0 Module**: Ralph × Manus Integration
