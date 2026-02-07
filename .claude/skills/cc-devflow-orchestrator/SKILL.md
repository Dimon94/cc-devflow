---
name: cc-devflow-orchestrator
description: CC-DevFlow workflow router and agent recommender. Use when starting requirements, running flow commands, or asking about devflow processes.
---

# CC-DevFlow Orchestrator

## Purpose
Guide users to the correct agent/command WITHOUT duplicating their detailed standards.

## Workflow Map

### 🏢 项目级工作流（Project-Level, 项目初期执行一次）

```
/core:roadmap → ROADMAP.md + BACKLOG.md (产品路线图)
/core:architecture → ARCHITECTURE.md (系统架构设计)
/core:guidelines → frontend-guidelines.md / backend-guidelines.md (项目规范)
/core:style → STYLE.md (设计风格指南)
```

### 📦 需求级工作流（Requirement-Level, 每个需求执行一次）

```
/flow:init → research.md + tasks.json + BRAINSTORM.md (研究初始化 + 头脑风暴)
     ↓
/flow:clarify → clarifications/*.md (11 维度歧义扫描, 可选)
     ↓
/flow:spec → PRD + Tech + UI + Epic (统一规格阶段)
  Modes:
  - Full: PRD → Tech+UI (并行) → Epic
  - Quick: PRD → Epic (--skip-tech --skip-ui)
  - Backend: PRD → Tech → Epic (--skip-ui)
  - Frontend: PRD → UI → Epic (--skip-tech)
     ↓
/flow:dev → TASKS.md execution (TDD + Autonomous mode default)
     ↓
/flow:quality → Quality verification
     ↓
/flow:release → PR creation + deployment
     ↓
/flow:verify → consistency check (任意阶段可调用)
```

### 🚀 简化流程

```
【精简流程】(适合小需求, 3 步)
/flow:init --quick → /flow:spec --skip-tech --skip-ui → /flow:dev → /flow:release

【标准流程】(适合中等需求, 4 步)
/flow:init → /flow:spec → /flow:dev → /flow:quality → /flow:release

【完整流程】(适合大需求, 5 步)
/flow:init → /flow:clarify → /flow:spec → /flow:dev → /flow:quality --full → /flow:release
```

### 🐛 Bug 修复工作流

```
/flow:fix "BUG-123|描述" → 系统化调试 (4阶段: Root Cause → Pattern → Hypothesis → TDD Fix)
```

**说明**:
- `/flow:spec` 是统一规格命令，合并 PRD/Tech/UI/Epic 为单一命令
- `/flow:spec` 内部并行执行 Tech + UI，减少 ~35% 设计阶段时间
- `/flow:dev` 默认 Autonomous 模式（自动重试），使用 `--manual` 退出到 Manual 模式

## Agent Delegation Guide

### When User Asks About Unified Specification
- **DO**: Recommend `/flow:spec` command → orchestrates prd-writer + tech-architect + ui-designer + planner
- **Link**: See `.claude/skills/workflow/flow-spec/SKILL.md` for details
- **Modes**: Full (default), Quick (--skip-tech --skip-ui), Backend (--skip-ui), Frontend (--skip-tech)

### When User Asks About Requirements Clarification
- **DO**: Recommend `/flow:clarify` command → invokes clarify-analyst agent
- **Link**: See `.claude/commands/flow/clarify.md` for details

### When User Asks About PRD/Tech/UI/Epic
- **DO**: Recommend `/flow:spec` command (unified)
- **Link**: See `.claude/agents/prd-writer.md`, `tech-architect.md`, `ui-designer.md`, `planner.md` for agent details

### When User Asks About QA/Security
- **DO**: Recommend `/flow:quality` command → invokes qa-tester + security-reviewer agents
- **Link**: See `.claude/agents/qa-tester.md` for QA details

### When User Asks About Code Review
- **DO**: Recommend `/flow:review` command → invokes spec-reviewer + code-quality-reviewer agents
- **Link**: See `.claude/commands/flow/review.md` for details

### When User Asks About Bug Fix
- **DO**: Recommend `/flow:fix` command → 4-phase systematic debugging
- **Link**: See `.claude/commands/flow/fix.md` for details

## Phase Gates (Quick Reference)

### Entry Gates
- **flow:init Entry**: Git 工作区干净, main 分支
- **flow:clarify Entry**: research.md 存在, phase0_complete == true
- **flow:spec Entry**: BRAINSTORM.md 存在, research.md 无 TODO placeholder
- **flow:dev Entry**: EPIC.md + TASKS.md 存在
- **flow:quality Entry**: development_complete == true
- **flow:release Entry**: quality_complete == true

### Exit Gates
- **flow:init Exit**: research.md 5-level quality check, BRAINSTORM.md 完整
- **flow:spec Exit**: PRD.md + EPIC.md + TASKS.md 完整, TDD 顺序正确
- **flow:dev Exit**: 所有 TASKS 完成, TDD Checkpoint 通过
- **flow:quality Exit**: 无 high-severity 漏洞
- **flow:release Exit**: PR 创建成功

## State Machine: Status → Recommended Command

```yaml
status: "initialized"
  → Recommend: /flow:spec (统一规格阶段)
  → Alternative: /flow:clarify (optional)

status: "clarify_complete" OR "clarify_skipped"
  → Recommend: /flow:spec

status: "spec_complete"
  → Recommend: /flow:dev (TDD development, Autonomous mode default)

status: "development_complete"
  → Recommend: /flow:quality

status: "quality_complete"
  → Recommend: /flow:release

status: "released"
  → Recommend: /flow:verify (final consistency check)
```

## Auxiliary Commands

### Status and Progress
- `/flow:status` - Query requirement progress
- `/flow:update "REQ-123" "T012"` - Update task completion
- `/flow:restart "REQ-123" --from=spec` - Resume interrupted workflow

### Upgrade and Analysis
- `/flow:upgrade "REQ-123" --analyze` - PRD version upgrade impact analysis
- `/flow:constitution` - Constitution management
- `/flow:verify "REQ-123"` - Comprehensive consistency verification

### Bug Fix
- `/flow:fix "BUG-123|描述"` - 系统化 BUG 修复
- `/util:problem-analyzer "<issue>"` - Problem diagnosis

### Code Review
- `/flow:review "REQ-123"` - Two-Stage Code Review
- `/util:code-review "<diff>"` - High-rigor code review

## Design Principle

**This skill ONLY contains**:
- ✅ Workflow routing (which command to run next)
- ✅ Agent delegation (which agent handles what)
- ✅ Quick reference (Phase Gates summary)
- ✅ Links to detailed documentation

**Rationale**: Avoid duplication. Agents and Commands own detailed standards.
