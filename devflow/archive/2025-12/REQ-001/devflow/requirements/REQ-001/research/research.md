# Research Document: REQ-001 - /flow-clarify 需求澄清命令

**Status**: ✅ Complete
**Date**: 2025-12-15
**Phase**: 0 (Research & Initialization)

---

## Research Summary

/flow-clarify 命令基于 spec-kit 的"质量左移"理念，通过 11 维度歧义扫描在 PRD 生成前消除需求模糊性。研究表明应采用 **Workflow 模式（非纯 Agent）**，使用 **Orchestrator-Workers 架构**，结合 **Parallelization + HITL + Prompt Chaining** 实现高质量澄清。

---

## Decisions

### R001 — Workflow Pattern vs Pure Agent

**Decision**: Workflow pattern with Orchestrator-Workers architecture

**Rationale**: Clarification has well-defined steps (scan → question → answer → integrate). Workflows offer predictability and validation gates at each phase. Anthropic guide recommends workflows for tasks with clear sequences.

**Alternatives considered**: Pure Agent pattern rejected due to unpredictability and difficulty in quality control.

---

### R002 — Sequential vs Parallel Dimension Scanning

**Decision**: Parallel execution using Parallelization pattern

**Rationale**: 11 independent dimension scans can run simultaneously to reduce total execution time from ~55s (sequential) to ~5s (parallel). Each scanner is stateless and reads the same input.

**Alternatives considered**: Sequential execution rejected due to poor user experience (long wait time).

---

### R003 — Model Selection for Scanners vs Orchestrator

**Decision**: Haiku for dimension scanners, Sonnet-4.5 for orchestrator and question generator

**Rationale**: Dimension scanning is pattern matching (low complexity) → haiku is cost-effective and fast. Question generation requires reasoning and best practice synthesis → sonnet-4.5 provides quality. Research shows larger models perform better for ambiguity detection.

**Alternatives considered**: Using sonnet for all rejected due to 11x cost increase with minimal quality gain for scanning.

---

### R004 — Question Presentation Style

**Decision**: Sequential presentation (one question at a time)

**Rationale**: Spec-kit template uses sequential approach to avoid user overwhelm. Research shows interactive clarification benefits from focused attention. Allows adaptive follow-up questions based on previous answers.

**Alternatives considered**: Batch presentation rejected due to cognitive overload and loss of interactivity.

---

### R005 — AI-Recommended Answers

**Decision**: Yes, provide AI-recommended answer based on best practices, with option to override

**Rationale**: Spec-kit template shows recommended options prominently. Research indicates LLMs can synthesize best practices effectively. Users appreciate guidance but need flexibility to override. Accelerates decision-making.

**Alternatives considered**: No recommendations rejected as it shifts burden entirely to user without leveraging AI capabilities.

---

### R006 — Maximum Question Quota

**Decision**: Maximum 5 questions (strict quota)

**Rationale**: Spec-kit template enforces 5-question limit. Roadmap target is <5 min average clarification time. Research shows user engagement drops after 5 questions. Forces prioritization by (Impact × Uncertainty).

**Alternatives considered**: 10 questions rejected as too time-consuming; 3 questions too restrictive.

---

### R007 — Integration Strategy

**Decision**: Incremental integration after each answer (Prompt Chaining pattern)

**Rationale**: Spec-kit template saves after each answer to prevent context loss. Anthropic guide recommends intermediate validation gates. Allows users to see immediate impact of their answers.

**Alternatives considered**: Batch integration at end rejected due to risk of losing all work if session terminates.

---

### R008 — Clarification Report Storage

**Decision**: research/clarifications/[timestamp]-[feature].md (new directory)

**Rationale**: Separate directory maintains clean separation from research.md. Timestamp ensures uniqueness and traceability. Feature slug improves readability. Aligns with CC-DevFlow file standards.

**Alternatives considered**: Modifying research.md directly (spec-kit approach) rejected to preserve original research materials.

---

### R009 — Exit Gate Validation

**Decision**: 5-level validation: (1) File existence, (2) Structure, (3) Content quality (no TODOs), (4) Tasks valid JSON, (5) Git/status/Constitution

**Rationale**: Flow-init command already implements 5-level validation pattern. Constitution compliance is mandatory per Article I. Multi-level gates catch different error types (structural vs semantic).

**Alternatives considered**: Single-level validation rejected as insufficient for production quality.

---

### R010 — Script Reuse vs New Implementation

**Decision**: Reuse existing scripts (generate-research-tasks.sh, populate-research-tasks.sh) + add 3 new scripts (run-clarify-scan.sh, generate-clarification-report.sh, integrate-clarifications.sh)

**Rationale**: DRY principle - leverage existing research infrastructure. New scripts handle clarify-specific logic (11-dimension scanning, interactive dialog, incremental integration).

**Alternatives considered**: Reimplementing from scratch rejected as violating DRY and increasing maintenance burden.

---

### R011 — Mandatory vs Optional Clarification

**Decision**: Optional command (non-blocking)

**Rationale**: Risk mitigation - don't disrupt existing workflow. Users can skip if research.md is already comprehensive. flow-prd can still proceed without clarification (will just use research.md as-is).

**Alternatives considered**: Mandatory gate rejected due to change management risk and potential user resistance.

---

## Source Library

### Internal Research
- [codebase-overview.md](internal/codebase-overview.md) - 内部代码库调研，分析现有命令/Agent/脚本架构

### Official Documentation
- [claude-code-docs.md](mcp/20251215/official/claude-code-docs.md) - Claude Code 插件系统、多 Agent 编排、质量门禁
- [claude-agent-sdk-docs.md](mcp/20251215/official/claude-agent-sdk-docs.md) - query() API、工具管理、权限控制、多轮对话

### Academic Research
- [resources.md](mcp/20251215/guides/resources.md) - LLM 歧义检测最佳实践 (9 大主题)、工作流模式 (6 种)

### Tutorials
- [anthropic-building-effective-agents.md](mcp/20251215/tutorials/anthropic-building-effective-agents.md) - Anthropic 官方指南：5 大工作流模式、工具设计原则、实现三原则

### Comprehensive Summary
- [research-summary.md](research-summary.md) - 完整研究总结：11 个技术决策、架构设计、实现优先级、风险缓解、成功指标

---

## Key Insights

1. **Architecture**: Workflow > Agent (明确步骤序列，质量门禁)
2. **Patterns**: Orchestrator-Workers + Parallelization + HITL + Prompt Chaining
3. **Models**: Haiku (scanners) + Sonnet-4.5 (orchestrator/generator)
4. **UX**: Sequential questions + AI recommendations + Incremental integration
5. **Quality**: 5-question quota + 5-level validation + Constitution compliance
6. **Integration**: Optional, non-blocking, reuse existing scripts

---

## Next Steps

1. ✅ Phase 0 complete (research & initialization)
2. → Run /flow-prd to generate PRD.md
3. → Run /flow-tech to generate TECH_DESIGN.md
4. → Run /flow-epic to generate EPIC.md + TASKS.md
5. → Run /flow-dev to implement command

---

**Research Status**: ✅ COMPLETE
**Ready for PRD**: ✅ YES
