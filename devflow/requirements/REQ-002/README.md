# REQ-002: /flow-checklist 需求质量检查命令

**Status**: Initialized (Phase 0 Complete)
**Type**: Requirement
**Roadmap Item**: RM-002
**Milestone**: M2 (Quality Gates)
**Quarter**: Q1-2026
**Dependencies**: RM-001 (/flow-clarify) ✅ Completed
**Created**: 2025-12-15T21:52:17+08:00
**Git Branch**: `feature/REQ-002-flow-checklist`

---

## Overview

实现需求单元测试命令，在任务分解前对需求完整性和可测试性进行质量门禁检查。

**核心理念**: "Unit Tests for English" - 对需求文档进行质量测试，而非对实现代码进行测试。

---

## Acceptance Criteria

- [ ] 需求单元测试框架
  - 测试用例自动生成
  - 边界条件覆盖检查
  - 异常场景覆盖检查
- [ ] 质量检查清单引擎
  - 可配置检查规则（YAML）
  - 权重和评分机制
  - 阻断阈值设置
- [ ] 需求覆盖率分析
  - 功能点覆盖率
  - 场景覆盖率
  - 可视化报告
- [ ] 与 `/flow-epic` 集成（检查不通过则阻断）

---

## Research Summary

### Key Decisions
| ID | Decision | Rationale |
|----|----------|-----------|
| R001 | 6 种 Checklist 类型 | 平衡针对性与易用性 |
| R002 | 80% 通过阈值 | 行业标准，可配置 |
| R003 | Anti-Example 强制 | 区分需求测试与实现测试 |
| R004 | YAML 配置格式 | 人类可读，易维护 |
| R005 | /flow-epic 入口门 | 最佳集成时机点 |

### Quality Dimensions
- `[Completeness]` - 是否定义了 X？
- `[Clarity]` - X 是否有明确定义？
- `[Consistency]` - X 和 Y 是否一致？
- `[Measurability]` - 如何验证 X？
- `[Coverage]` - 是否覆盖 X 场景？

---

## Documents

### Phase 0: Research (✅ Complete)
- [x] research/research.md - 研究决策文档
- [x] research/tasks.json - 研究任务列表
- [x] research/internal/codebase-overview.md - 内部代码调研
- [x] research/research-summary.md - 调研摘要
- [x] research/mcp/20251215/ - MCP 外部调研资料

### Phase 1: Planning (Pending)
- [ ] PRD.md - Product Requirements Document
- [ ] TECH_DESIGN.md - Technical Design
- [ ] EPIC.md - Epic Planning
- [ ] TASKS.md - Task Breakdown

### Phase 2: Development (Pending)
- [ ] Implementation following TDD approach
- [ ] Unit and integration tests

### Phase 3: Quality (Pending)
- [ ] TEST_REPORT.md - Test Report
- [ ] SECURITY_REPORT.md - Security Report

### Phase 4: Release (Pending)
- [ ] RELEASE_PLAN.md - Release Plan
- [ ] PR and merge to main

---

## Technical Notes

### New Files
- `core/checklist.js` (new)
- `config/quality-rules.yml` (new)
- `lib/coverage-analyzer.js` (new)
- `.claude/commands/flow-checklist.md` (new)
- `.claude/agents/checklist-agent.md` (new)
- `.claude/hooks/checklist-gate.js` (new)

### Modified Files
- `.claude/commands/flow-epic.md` - 添加入口门检查
- `.claude/skills/cc-devflow-orchestrator/skill.md` - 更新工作流图

---

## Workflow Commands

```bash
# Next: Generate PRD
/flow-prd "REQ-002"

# Then: Technical Design
/flow-tech "REQ-002"

# Then: Epic/Tasks Planning
/flow-epic "REQ-002"

# Then: Development
/flow-dev "REQ-002"
```

---

## Research Materials Location

| Type | Path |
|------|------|
| 内部调研 | `research/internal/` |
| MCP 资料 | `research/mcp/20251215/` |
| 决策文档 | `research/research.md` |
| 任务列表 | `research/tasks.json` |

---

## Related References

- [SPEC_KIT_FINAL_SOLUTION.md](../../../docs/SPEC_KIT_FINAL_SOLUTION.md) - 详细设计规格
- [spec-kit/templates/commands/checklist.md](../../../spec-kit/templates/commands/checklist.md) - 参考实现
- [ROADMAP.md](../../ROADMAP.md) - 项目路线图
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - 系统架构
