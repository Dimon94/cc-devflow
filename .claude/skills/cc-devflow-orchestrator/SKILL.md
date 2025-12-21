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
/core-roadmap → ROADMAP.md + BACKLOG.md (产品路线图)
/core-architecture → ARCHITECTURE.md (系统架构设计)
/core-guidelines → frontend-guidelines.md / backend-guidelines.md (项目规范)
/core-style → STYLE.md (设计风格指南) ⭐ 新增
```

### 📦 需求级工作流（Requirement-Level, 每个需求执行一次）

```
/flow-init → research.md + tasks.json (研究初始化)
     ↓
/flow-clarify → clarifications/*.md (11 维度歧义扫描, 可选) ⭐ 新增
     ↓
/flow-prd → PRD.md (invoke prd-writer agent)
     ↓
/flow-checklist → checklists/*.md (需求质量检查, 可选) ⭐ 新增
     ↓
/flow-tech → TECH_DESIGN.md + data-model + contracts (invoke tech-architect agent)
     ↓
/flow-ui → UI_PROTOTYPE.html (invoke ui-designer agent, 可选, 引用 STYLE.md) ⭐ 变更
     ↓
/flow-epic → EPIC.md + TASKS.md (invoke planner agent with PRD+TECH+UI)
     ↓
/flow-dev → TASKS.md execution (TDD order enforced, 引用 STYLE.md) ⭐ 变更
     ↓
/flow-qa → QA reports (invoke qa-tester + security-reviewer agents)
     ↓
/flow-release → PR creation + deployment
     ↓
/flow-verify → consistency check (invoke consistency-checker agent, 任意阶段可调用)
```

**说明**:
- 项目级命令建立全局标准（SSOT），需求级命令引用这些标准
- `/flow-clarify` 在 PRD 前可选执行，消除 research.md 中的歧义
- `/flow-ui` 和 `/flow-dev` 自动加载 `devflow/STYLE.md`（如存在）
- 项目级命令可按需执行，无严格顺序要求

## Agent Delegation Guide

### When User Asks About Requirements Clarification
- **DO**: Recommend `/flow-clarify` command → invokes clarify-analyst agent
- **DON'T**: Duplicate clarification logic (flow-clarify.md has ~128 lines)
- **Link**: See [.claude/commands/flow-clarify.md](.claude/commands/flow-clarify.md) for details
- **Outputs**: clarifications/[timestamp]-flow-clarify.md (澄清报告)
- **Features**: 11-dimension scan, ≤5 prioritized questions, session recovery

### When User Asks About PRD
- **DO**: Recommend `/flow-prd` command → invokes prd-writer agent
- **DON'T**: Duplicate PRD standards (prd-writer agent has ~300 lines)
- **Link**: See [.claude/agents/prd-writer.md](.claude/agents/prd-writer.md) for PRD details
- **Standards**: INVEST principles, Anti-Expansion mandate, Given-When-Then criteria

### When User Asks About Requirement Quality Checklist
- **DO**: Recommend `/flow-checklist` command → invokes checklist-agent
- **DON'T**: Duplicate checklist standards (checklist-agent has ~180 lines)
- **Link**: See [.claude/commands/flow-checklist.md](.claude/commands/flow-checklist.md) for details
- **Outputs**: checklists/*.md (ux, api, security, performance, data, general)
- **Features**: 5 quality dimensions, Anti-Example rules, 80% gate threshold
- **Level**: Requirement-level (optional, before /flow-epic)

### When User Asks About Tech Design
- **DO**: Recommend `/flow-tech` command → invokes tech-architect agent
- **DON'T**: Duplicate tech standards (tech-architect agent has ~516 lines)
- **Link**: See [.claude/agents/tech-architect.md](.claude/agents/tech-architect.md) for design details
- **Outputs**: TECH_DESIGN.md, data-model.md, contracts/, quickstart.md

### When User Asks About Design Style Guide
- **DO**: Recommend `/core-style` command → invokes style-guide-generator agent
- **DON'T**: Duplicate style guide standards (style-guide-generator agent has ~400 lines)
- **Link**: See [.claude/agents/style-guide-generator.md](.claude/agents/style-guide-generator.md) for details
- **Outputs**: STYLE.md (project-level SSOT for visual consistency)
- **Level**: Project-level (execute once per project)

### When User Asks About UI Prototype
- **DO**: Recommend `/flow-ui` command → invokes ui-designer agent
- **DON'T**: Duplicate UI standards (ui-designer agent has ~485 lines)
- **Link**: See [.claude/agents/ui-designer.md](.claude/agents/ui-designer.md) for UI details
- **Features**: 80+ design masters sampling, responsive design, NO PLACEHOLDER, references STYLE.md

### When User Asks About Task Planning
- **DO**: Recommend `/flow-epic` command → invokes planner agent
- **DON'T**: Duplicate planning logic (planner agent has ~400 lines)
- **Link**: See [.claude/agents/planner.md](.claude/agents/planner.md) for task breakdown rules
- **Enforces**: Phase -1 Gates (Articles VII, VIII, IX), TDD sequence

### When User Asks About QA/Security
- **DO**: Recommend `/flow-qa` command → invokes qa-tester + security-reviewer agents
- **DON'T**: Duplicate QA standards (qa-tester agent has ~300 lines)
- **Link**: See [.claude/agents/qa-tester.md](.claude/agents/qa-tester.md) for QA details

## Phase Gates (Quick Reference Only)

### Entry Gates
- **flow-clarify Entry**: research.md 存在, phase0_complete == true
- **flow-prd Entry**: research.md 无 TODO placeholder, phase0_complete == true (clarify 可选)
- **flow-checklist Entry**: PRD.md 必须完成 (prd_complete == true)
- **flow-tech Entry**: PRD.md 必须完成
- **flow-ui Entry**: PRD.md 必须完成（可与 tech 并行）
- **flow-epic Entry**: PRD 完成，tech/ui 推荐但可选，Checklist Gate (如存在 checklists/)
- **flow-dev Entry**: EPIC.md + TASKS.md 存在
- **flow-qa Entry**: development_complete == true

### Exit Gates
- **flow-init Exit**: research.md 5-level quality check
- **flow-clarify Exit**: clarification report 完整, orchestration_status.clarify_complete == true
- **flow-prd Exit**: PRD.md 无 placeholder, Constitution 合规
- **flow-tech Exit**: TECH_DESIGN.md + data-model + contracts 完整
- **flow-epic Exit**: TASKS.md TDD 顺序正确, Phase -1 Gates 通过
- **flow-dev Exit**: 所有 TASKS 完成, 测试通过
- **flow-qa Exit**: 无 high-severity 漏洞

**For Details**: See [orchestration_status.json](devflow/requirements/REQ-XXX/orchestration_status.json) and [EXECUTION_LOG.md](devflow/requirements/REQ-XXX/EXECUTION_LOG.md)

## State Machine: Status → Recommended Command

Read `orchestration_status.json` to determine current phase:

```yaml
status: "initialized"
  → Recommend: /flow-clarify (optional, clarify ambiguities)
  → Alternative: /flow-prd (skip clarification, generate PRD directly)

status: "clarify_complete" OR "clarify_skipped"
  → Recommend: /flow-prd (generate PRD)

status: "prd_complete"
  → Recommend: /flow-tech (generate technical design)
  → Alternative: /flow-ui (generate UI prototype, optional)

status: "tech_design_complete"
  → If UI not done: /flow-ui (optional)
  → Else: /flow-epic (generate EPIC and TASKS)

status: "epic_complete"
  → Recommend: /flow-dev (start TDD development)

status: "development_complete"
  → Recommend: /flow-qa (quality assurance and security review)

status: "qa_complete"
  → Recommend: /flow-release (create PR and release)

status: "released"
  → Recommend: /flow-verify (final consistency check)
```

## Troubleshooting Quick Routing

### Phase gate blocked?
- **Action**: Check `orchestration_status.json` for current status
- **Script**: Run `.claude/scripts/check-prerequisites.sh --json`

### Document missing?
- **Action**: Check which phase is incomplete
- **Script**: Run `.claude/scripts/generate-status-report.sh`

### Need detailed standards?
- **Clarify**: See flow-clarify.md command + clarify-analyst agent
- **PRD**: Consult prd-writer agent
- **Tech**: Consult tech-architect agent
- **UI**: Consult ui-designer agent
- **Tasks**: Consult planner agent
- **QA**: Consult qa-tester agent

### Constitution violation?
- **Real-time check**: constitution-guardian guardrail (PreToolUse hook)
- **Batch validation**: Run `.claude/scripts/validate-constitution.sh`
- **Reference**: See `.claude/rules/project-constitution.md` v2.0.0

### TDD order violated?
- **Real-time check**: devflow-tdd-enforcer guardrail (PreToolUse hook)
- **Manual check**: See TASKS.md, tests MUST be marked [x] before implementation

## Auxiliary Commands

### Status and Progress
- `/flow-status` - Query requirement progress
- `/flow-update "REQ-123" "T012"` - Update task completion
- `/flow-restart "REQ-123" --from=epic` - Resume interrupted workflow

### Upgrade and Analysis
- `/flow-upgrade "REQ-123" --analyze` - PRD version upgrade impact analysis
- `/flow-constitution` - Constitution management
- `/flow-verify "REQ-123"` - Comprehensive consistency verification

### Bug Fix
- `/flow-fix "BUG-123|登录超时"` - One-shot BUG fix workflow
- `/problem-analyzer "<issue>"` - Problem diagnosis

### Code Review
- `/code-review-high "<diff>"` - High-rigor code review

## Integration with Other Skills

- **devflow-tdd-enforcer**: Enforces TDD order in TASKS.md (Guardrail, blocks)
- **constitution-guardian**: Enforces Constitution compliance (Guardrail, blocks)
- **devflow-file-standards**: File naming and directory structure reference
- **devflow-constitution-quick-ref**: Constitution quick reference

## Design Principle

**This skill does NOT contain**:
- ❌ Detailed agent execution standards (those are in agent files)
- ❌ Full Phase Gate validation logic (those are in flow command files)
- ❌ Complete Constitution articles (those are in project-constitution.md)

**This skill ONLY contains**:
- ✅ Workflow routing (which command to run next)
- ✅ Agent delegation (which agent handles what)
- ✅ Quick reference (Phase Gates summary, not full details)
- ✅ Links to detailed documentation

**Rationale**: Avoid duplication ("不重不漏" principle). Agents and Commands own detailed standards.
