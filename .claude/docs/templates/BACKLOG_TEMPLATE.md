# Product Backlog: {{PROJECT_NAME}}

**Updated**: {{UPDATED_DATE}} 北京时间
**Total Items**: {{TOTAL_COUNT}}
**P1 Count**: {{P1_COUNT}} | **P2 Count**: {{P2_COUNT}} | **P3 Count**: {{P3_COUNT}}

**Input**:
- candidates 列表（包含 RM-ID, title, priority, derived_from, description）
- dependencies 依赖关系
- timeline 时间线分配

**Prerequisites**: roadmap-planner agent 正在基于 flow-roadmap 命令的上下文生成此文档

## Execution Flow (Backlog 生成流程)
```
1. Load context from command
   → Parse candidates array
   → Parse dependencies array
   → Parse timeline object
   → Validate all fields present

2. Load BACKLOG_TEMPLATE.md
   → Read template from .claude/docs/templates/BACKLOG_TEMPLATE.md
   → Prepare to fill all sections

3. Group candidates by priority
   → Separate into P1 (MVP Must-Have), P2 (Important), P3 (Nice-to-Have)
   → Sort by RM-ID within each priority group
   → Count items in each priority

4. Generate Priority 1 section
   → For each P1 candidate:
      • Generate detailed entry with all fields
      • Extract business value from description
      • Estimate effort (S/M/L based on effort_weeks)
      • Identify dependencies from dependencies array
      • Extract derived_from source
      • Assign target milestone from timeline
      • Set status = "Backlog"

5. Generate Priority 2 section
   → Similar to P1 but for P2 candidates

6. Generate Priority 3 section
   → Similar to P1 but for P3 candidates

7. Generate Dependency Matrix
   → For each RM-ID:
      • Find what it blocks (RM-IDs that depend on this)
      • Find what blocks it (REQ-IDs or RM-IDs this depends on)
   → Format as markdown table
   → Use "-" for no dependencies

8. Validate completeness
   → All candidates included
   → All have priority assigned
   → Dependency matrix complete
   → No {{PLACEHOLDER}} remaining
   → If incomplete: ERROR "Complete missing sections"

9. Write devflow/BACKLOG.md
   → Write complete file
   → Use UTF-8 encoding

10. Return: SUCCESS (BACKLOG.md generated)
```

**重要**: 这是一个自执行模板。roadmap-planner agent 应该按照 Execution Flow 生成完整的 BACKLOG.md 文件。

---

## Priority 1 (MVP Must-Have)

_P1 是必须完成的核心功能，没有这些功能产品无法交付价值。_

### {{RM_ID_1}}: {{TITLE_1}}

- **Description**: {{DESCRIPTION_1}}
- **Business Value**: {{BUSINESS_VALUE_1}}
  _为什么这是 P1？为什么用户需要这个功能？_

- **Effort**: {{EFFORT_1}} (S/M/L)
  - S (Small): 1 周以内
  - M (Medium): 1-3 周
  - L (Large): 3 周以上

- **Dependencies**: {{DEPENDENCIES_1}}
  _此功能依赖哪些已有需求？格式: REQ-009 (completed), REQ-010 (in progress)_

- **Derived From**: {{DERIVED_FROM_1}}
  _来源：REQ-001, Tech Stack, User Feedback, etc._

- **Target Milestone**: {{MILESTONE_1}}
  _计划在哪个里程碑完成？格式: M1-Q1-2025_

- **Status**: {{STATUS_1}}
  _Backlog | Ready | In Progress | Blocked | Completed_

---

### {{RM_ID_2}}: {{TITLE_2}}

- **Description**: {{DESCRIPTION_2}}
- **Business Value**: {{BUSINESS_VALUE_2}}
- **Effort**: {{EFFORT_2}} (S/M/L)
- **Dependencies**: {{DEPENDENCIES_2}}
- **Derived From**: {{DERIVED_FROM_2}}
- **Target Milestone**: {{MILESTONE_2}}
- **Status**: {{STATUS_2}}

---

_重复以上结构为每个 P1 需求创建条目_

---

## Priority 2 (Important)

_P2 是重要功能，能够显著提升用户体验或解决重要问题，但不影响 MVP 交付。_

### {{RM_ID_3}}: {{TITLE_3}}

- **Description**: {{DESCRIPTION_3}}
- **Business Value**: {{BUSINESS_VALUE_3}}
  _为什么这是 P2？相比 P1 的区别是什么？_

- **Effort**: {{EFFORT_3}} (S/M/L)
- **Dependencies**: {{DEPENDENCIES_3}}
- **Derived From**: {{DERIVED_FROM_3}}
- **Target Milestone**: {{MILESTONE_3}}
- **Status**: {{STATUS_3}}

---

_重复以上结构为每个 P2 需求创建条目_

---

## Priority 3 (Nice-to-Have)

_P3 是锦上添花的功能，有更好没有也不影响核心价值。_

### {{RM_ID_4}}: {{TITLE_4}}

- **Description**: {{DESCRIPTION_4}}
- **Business Value**: {{BUSINESS_VALUE_4}}
  _为什么这是 P3？什么情况下会提升到 P2 或 P1？_

- **Effort**: {{EFFORT_4}} (S/M/L)
- **Dependencies**: {{DEPENDENCIES_4}}
- **Derived From**: {{DERIVED_FROM_4}}
- **Target Milestone**: {{MILESTONE_4}}
- **Status**: {{STATUS_4}}

---

_重复以上结构为每个 P3 需求创建条目_

---

## Dependency Matrix

| RM-ID | Blocks | Blocked By |
|-------|--------|------------|
| {{RM_ID_1}} | {{BLOCKS_1}} | {{BLOCKED_BY_1}} |
| {{RM_ID_2}} | {{BLOCKS_2}} | {{BLOCKED_BY_2}} |
| {{RM_ID_3}} | {{BLOCKS_3}} | {{BLOCKED_BY_3}} |
| {{RM_ID_4}} | {{BLOCKS_4}} | {{BLOCKED_BY_4}} |

_填充规则:_
- **Blocks**: 此需求完成后可以解锁的其他需求（逗号分隔）
  - 例如: `RM-003, RM-005`
  - 如果没有: `-`

- **Blocked By**: 此需求依赖的其他需求（逗号分隔）
  - 格式: `REQ-001 (completed)`, `REQ-010 (in progress)`, `RM-002 (backlog)`
  - 如果没有: `-`

_说明: 此矩阵用于快速识别需求间的依赖关系，避免优先级冲突_

---

## Backlog Management Notes

### 优先级调整指南

**何时提升 P3 → P2**:
- 用户强烈要求
- 技术依赖需要（为了完成 P1/P2，需要先完成此功能）
- 竞争压力（竞品已有类似功能）

**何时提升 P2 → P1**:
- 成为 MVP 的阻塞项
- 影响核心用户体验
- 安全或合规要求

**何时降低优先级**:
- 用户需求不明确
- 技术复杂度过高，风险大
- 有更好的替代方案

### 准入标准 (Definition of Ready)

一个 backlog item 准备好进入开发 (运行 /flow-init) 的标准：
- [ ] Description 清晰明确
- [ ] Business Value 已明确
- [ ] Effort 已评估
- [ ] Dependencies 已识别并满足（依赖的需求已完成）
- [ ] Derived From 已标注
- [ ] 已分配到具体的 Milestone
- [ ] 用户已确认需求

### 完成标准 (Definition of Done)

一个 backlog item 被认为完成的标准：
- [ ] 通过 /flow-prd, /flow-tech, /flow-epic, /flow-dev 流程
- [ ] 所有 TASKS.md 中的任务完成
- [ ] 通过 /flow-qa (测试 + 安全审查)
- [ ] 代码已合并到主分支
- [ ] 文档已更新
- [ ] 用户验收通过

---

## Appendix: Priority Guidelines

### P1 (MVP Must-Have) - 优先级评估标准

| 标准 | 说明 | 示例 |
|------|------|------|
| **核心价值** | 没有此功能产品无法交付核心价值 | 用户认证（没有认证就无法使用） |
| **阻塞依赖** | 其他高优先级功能依赖此功能 | 权限管理（多个功能需要权限控制） |
| **用户痛点** | 解决用户最迫切的问题 | 性能优化（启动慢导致用户流失） |
| **合规要求** | 法律、安全、合规必须 | 数据加密（隐私合规要求） |

### P2 (Important) - 优先级评估标准

| 标准 | 说明 | 示例 |
|------|------|------|
| **体验提升** | 显著提升用户体验但不影响核心功能 | 输入框增强（Markdown 预览） |
| **运营需求** | 支持运营、分析、监控 | 数据分析模块 |
| **扩展性** | 为未来扩展打基础 | 多账号支持 |
| **差异化** | 与竞品形成差异化 | AI 辅助功能 |

### P3 (Nice-to-Have) - 优先级评估标准

| 标准 | 说明 | 示例 |
|------|------|------|
| **锦上添花** | 有更好，没有也不影响 | 快捷键自定义 |
| **小众需求** | 只有少数用户需要 | 高级配置项 |
| **实验性** | 需要验证是否有价值 | 新 UI 风格 |
| **技术优化** | 技术层面的优化，用户无感知 | 代码重构 |

---

**生成说明**:
1. 所有 `{{PLACEHOLDER}}` 必须被实际内容替换
2. Business Value 应具体说明为什么这个功能重要
3. Effort 估算基于历史 Velocity
4. Dependency Matrix 应与 ROADMAP.md 保持一致
5. 所有日期使用北京时间
