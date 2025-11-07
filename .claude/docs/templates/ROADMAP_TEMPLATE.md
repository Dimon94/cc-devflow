# Product Roadmap: {{PROJECT_NAME}}

**Version**: {{VERSION}}
**Created**: {{CREATED_DATE}} 北京时间
**Updated**: {{UPDATED_DATE}} 北京时间
**Planning Horizon**: {{PLANNING_HORIZON}}
**Status**: {{STATUS}}

**Input**:
- 6 阶段对话的结果（candidates, dependencies, timeline, velocity, quarter_info）
- devflow/requirements/ 已有需求分析
- 用户愿景声明

**Prerequisites**: flow-roadmap 命令已完成 6 阶段对话，收集完整上下文

## Execution Flow (Roadmap 生成流程)
```
1. Load context from command
   → Parse JSON context (candidates, dependencies, timeline, velocity, quarter_info)
   → Validate all required fields present
   → If missing fields: ERROR "Incomplete context from command"

2. Load ROADMAP_TEMPLATE.md
   → Read template from .claude/docs/templates/ROADMAP_TEMPLATE.md
   → Prepare to fill all sections

3. Fill header metadata
   → Extract project name from devflow/project.md or command context
   → Set version (1.0.0 for new, increment for updates)
   → Set created/updated timestamps (Beijing time, ISO 8601)
   → Calculate planning horizon from quarter_info
   → Set status = "Active"

4. Fill Vision Statement
   → Use vision_statement from context
   → Format as clear, concise statement (1-2 paragraphs)
   → Include problem statement, target users, core value propositions

5. Generate Milestone Overview
   → Group candidates by quarter from timeline
   → For each quarter: generate milestone name, theme, success criteria
   → Format as markdown table
   → Status = "Planned" for all

6. Generate Quarterly Details
   → For each quarter in timeline:
      • Create WBS section
      • List all RM-IDs assigned to this quarter
      • Extract descriptions from candidates
      • Identify dependencies from dependencies list
      • Calculate estimated effort (sum of effort_weeks)
      • Generate success criteria based on candidate titles

7. Generate Dependency Graph
   → Convert dependencies array to Mermaid graph syntax
   → Include both REQ-to-RM and RM-to-RM dependencies
   → Color-code nodes:
      • Completed REQs: #90EE90 (light green)
      • In-progress REQs: #FFD700 (gold)
      • Planned RMs: #D3D3D3 (light gray)
   → Validate Mermaid syntax

8. Fill Velocity Tracking
   → Extract metrics from velocity object
   → Format as markdown table
   → Include: completed_reqs, avg_days_per_req, quarterly_capacity

9. Generate Implementation Tracking
   → For each candidate:
      • RM-ID
      • Feature title
      • Derived From (from candidate.derived_from)
      • Status = "Planned"
      • Mapped REQ = "-" (empty initially)
      • Progress = "0%"
   → Format as markdown table

10. Constitution Check (Article VII, VIII, IX)
    → Simplicity Gate: Check if any milestone has >3 major projects
    → Anti-Abstraction Gate: Verify no premature infrastructure items
    → Integration-First Gate: Check if contract-first design mentioned in candidates
    → Document any violations with justification

11. Validate completeness
    → All sections filled (no {{PLACEHOLDER}} remaining)
    → All RM-IDs from context included
    → Dependencies correctly mapped
    → Mermaid syntax valid
    → If incomplete: ERROR "Complete missing sections"

12. Write devflow/ROADMAP.md
    → Write complete ROADMAP.md file
    → Use UTF-8 encoding
    → Ensure markdown formatting correct

13. Return: SUCCESS (ROADMAP.md generated)
```

**重要**: 这是一个自执行模板。roadmap-planner agent 应该按照 Execution Flow 生成完整的 ROADMAP.md 文件。

---

## Vision Statement

{{VISION_STATEMENT}}

_示例:_
> 我们正在打造最好用的 AI 助手桌面应用。在接下来的 3 个月，我们将专注于提升用户体验和性能，通过增强输入框功能和优化系统性能，为用户提供更流畅、更高效的交互体验。同时，我们将扩展核心功能，支持多账号管理和数据分析能力，满足专业用户的需求。

---

## Milestone Overview

| Milestone | Quarter | Theme | Success Criteria | Status |
|-----------|---------|-------|------------------|--------|
| {{MILESTONE_ID_1}} | {{QUARTER_1}} | {{THEME_1}} | {{SUCCESS_CRITERIA_1}} | {{STATUS_1}} |
| {{MILESTONE_ID_2}} | {{QUARTER_2}} | {{THEME_2}} | {{SUCCESS_CRITERIA_2}} | {{STATUS_2}} |
| {{MILESTONE_ID_3}} | {{QUARTER_3}} | {{THEME_3}} | {{SUCCESS_CRITERIA_3}} | {{STATUS_3}} |

_填充规则:_
- Milestone ID 格式: `M{序号}-Q{季度}-{年份}` (例如: M1-Q1-2025)
- Theme: 该季度的核心主题（1-5 个字，如"用户体验增强"）
- Success Criteria: 具体的成功标准（完成哪些 RM-IDs）
- Status: Planned | In Progress | Completed | Cancelled

---

## Q{{QUARTER_NUMBER}} {{YEAR}} Milestones

### {{MILESTONE_ID}}: {{MILESTONE_NAME}}

**Timeline**: {{START_DATE}} ~ {{END_DATE}}
**Theme**: {{THEME}}

**Success Criteria**:
- [ ] {{CRITERION_1}}
- [ ] {{CRITERION_2}}
- [ ] {{CRITERION_3}}

**Feature Cluster 1: {{CLUSTER_NAME_1}}**
- **{{RM_ID_1}}**: {{TITLE_1}} ({{DERIVED_FROM_1}})
  - 描述: {{DESCRIPTION_1}}
  - 优先级: {{PRIORITY_1}}
  - 预计工作量: {{EFFORT_1}}

- **{{RM_ID_2}}**: {{TITLE_2}} ({{DERIVED_FROM_2}})
  - 描述: {{DESCRIPTION_2}}
  - 优先级: {{PRIORITY_2}}
  - 预计工作量: {{EFFORT_2}}

**Feature Cluster 2: {{CLUSTER_NAME_2}}**
- **{{RM_ID_3}}**: {{TITLE_3}} ({{DERIVED_FROM_3}})
  - 描述: {{DESCRIPTION_3}}
  - 优先级: {{PRIORITY_3}}
  - 预计工作量: {{EFFORT_3}}

**Dependencies**:
- **Blocks**: {{BLOCKED_RM_IDS}} (此里程碑完成后可以解锁的需求)
- **Depends on**: {{PREREQUISITE_REQ_IDS}} (此里程碑依赖的已完成需求)

**Risks**:
- **Risk 1**: {{RISK_DESCRIPTION_1}}
  - **Mitigation**: {{MITIGATION_PLAN_1}}

- **Risk 2**: {{RISK_DESCRIPTION_2}}
  - **Mitigation**: {{MITIGATION_PLAN_2}}

**Estimated Effort**: {{TOTAL_EFFORT}} ({{BREAKDOWN}})

_填充规则:_
- Feature Cluster: 将相关功能分组（例如: "用户管理升级", "数据处理模块"）
- Derived From: 标注来源（例如: "REQ-009", "Tech Stack", "User Feedback"）
- Risks: 基于依赖关系和技术复杂度识别风险

_重复此章节为每个季度创建详细规划_

---

## Dependency Graph

```mermaid
graph TD
    {{REQ_NODE_1}}[{{REQ_LABEL_1}}] --> {{RM_NODE_1}}[{{RM_LABEL_1}}]
    {{REQ_NODE_2}}[{{REQ_LABEL_2}}] --> {{RM_NODE_2}}[{{RM_LABEL_2}}]
    {{RM_NODE_1}} --> {{RM_NODE_3}}[{{RM_LABEL_3}}]

    style {{REQ_NODE_1}} fill:#90EE90
    style {{REQ_NODE_2}} fill:#FFD700
    style {{RM_NODE_1}} fill:#D3D3D3
    style {{RM_NODE_2}} fill:#D3D3D3
    style {{RM_NODE_3}} fill:#D3D3D3
```

_填充规则:_
- Node ID 格式: REQ001, REQ010, RM001, RM002 (无破折号，用于 Mermaid 节点 ID)
- Node Label 格式: `REQ-001: 功能名称`, `RM-001: 功能名称`
- 颜色编码:
  - #90EE90 (浅绿): 已完成的 REQ
  - #FFD700 (金色): 进行中的 REQ
  - #D3D3D3 (浅灰): 计划中的 RM
- 箭头方向: 依赖项 → 被依赖项 (例如: REQ-009 → RM-001 表示 RM-001 依赖 REQ-009)

---

## Velocity Tracking

| Metric | Value | Source |
|--------|-------|--------|
| Completed REQs | {{COMPLETED_COUNT}} | devflow/requirements/ |
| Avg Time per REQ | {{AVG_DAYS}} days | EXECUTION_LOG.md analysis |
| Quarterly Capacity | {{CAPACITY}} REQs | Calculated (90 days / avg days) |
| Estimated REQs/Quarter | {{ESTIMATED_CAPACITY}} | Based on remaining days |

_填充规则:_
- Completed Count: 从 requirements/ 目录统计
- Avg Time: 从 EXECUTION_LOG.md 中提取 phase complete 时间戳计算
- Quarterly Capacity: 90 天 / 平均天数（标准季度容量）
- Estimated Capacity: 当前季度剩余天数 / 平均天数（当前季度预估容量）

_说明: 此表用于追踪项目速度，帮助评估时间线的合理性_

---

## Implementation Tracking

| RM-ID | Feature | Derived From | Status | Mapped REQ | Progress |
|-------|---------|--------------|--------|------------|----------|
| {{RM_ID_1}} | {{FEATURE_1}} | {{SOURCE_1}} | {{STATUS_1}} | {{REQ_ID_1}} | {{PROGRESS_1}} |
| {{RM_ID_2}} | {{FEATURE_2}} | {{SOURCE_2}} | {{STATUS_2}} | {{REQ_ID_2}} | {{PROGRESS_2}} |
| {{RM_ID_3}} | {{FEATURE_3}} | {{SOURCE_3}} | {{STATUS_3}} | {{REQ_ID_3}} | {{PROGRESS_3}} |

_填充规则:_
- RM-ID: 路线图项目标识符 (RM-001, RM-002, ...)
- Feature: 功能简短标题
- Derived From: 来源需求 ID (REQ-001) 或其他来源 (Tech Stack, User Feedback)
- Status: Planned | In Progress | Completed | Blocked | Cancelled
- Mapped REQ: 关联的正式需求 ID（初始为 "-"，运行 /flow-init 后填充）
- Progress: 完成百分比 (0%, 20%, 80%, 100%)

_说明: 此表用于追踪路线图项到正式需求的映射，以及进度同步_

---

## Constitution Check (Phase -1 Gates)

### Simplicity Gate (Article VII)
- [ ] 每个里程碑 ≤3 个主要项目
  - **检查结果**: {{GATE_RESULT_SIMPLICITY}}

### Anti-Abstraction Gate (Article VIII)
- [ ] 无过早基础设施建设
  - **检查结果**: {{GATE_RESULT_ANTI_ABSTRACTION}}

### Integration-First Gate (Article IX)
- [ ] 采用契约优先设计方法
  - **检查结果**: {{GATE_RESULT_INTEGRATION_FIRST}}

### Complexity Tracking
| Potential Violation | Justification | Approved? |
|---------------------|---------------|-----------|
| {{VIOLATION_1}} | {{JUSTIFICATION_1}} | {{APPROVED_1}} |
| {{VIOLATION_2}} | {{JUSTIFICATION_2}} | {{APPROVED_2}} |

_填充规则:_
- Gate Result: ✅ PASS | ⚠️ WARNING | ❌ FAIL
- Violations: 记录任何宪法违规及其理由
- Approved: YES (经用户批准) | NO (需要调整)

---

## Validation Checklist

验证此路线图是否完整：

- [ ] 愿景声明清晰且可操作
- [ ] 所有里程碑有明确的成功标准
- [ ] 所有意向需求已分配优先级 (P1/P2/P3)
- [ ] 依赖关系已映射并可视化
- [ ] 基于历史速度的现实时间线
- [ ] Constitution Check 通过
- [ ] 无循环依赖
- [ ] 风险缓解计划已制定

**Ready for Stakeholder Review**: {{READY_STATUS}}

_填充规则:_
- 每个 checkbox 应被标记为 `[x]` 或 `[ ]`
- Ready Status: YES | NO (with reasons)
- 如果任何 critical item 未完成，Status 应为 NO

---

## Appendix: Terminology

- **RM-ID**: Roadmap Item ID，路线图意向项标识符（如 RM-001）
- **REQ-ID**: Requirement ID，正式需求标识符（如 REQ-010）
- **Derived From**: 来源，标注该意向项从哪个已有需求或来源延伸而来
- **Mapped REQ**: 映射需求，当意向项通过 /flow-init 正式创建为需求后，记录其 REQ-ID
- **Feature Cluster**: 功能集群，将相关的意向项分组便于理解和管理
- **Milestone**: 里程碑，一个季度内要完成的一组功能集群
- **Velocity**: 速度，团队完成需求的平均速率（天数/需求）

---

**生成说明**:
1. 所有 `{{PLACEHOLDER}}` 必须被实际内容替换
2. Mermaid 代码必须语法正确
3. 所有日期使用北京时间 + ISO 8601 格式
4. 进度百分比应准确反映实际状态
5. 依赖关系应与 BACKLOG.md 保持一致
