# Tasks: REQ-002 - /flow-checklist 需求质量检查命令

**Input**: PRD.md, EPIC.md, TECH_DESIGN.md from `devflow/requirements/REQ-002/`
**Prerequisites**: PRD.md (required), EPIC.md (required), TECH_DESIGN.md (required)

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5, US6)
- **ID**: T001, T002, T003... (sequential numbering)
- Include exact file paths in task descriptions

## Path Conventions

本项目是 CC-DevFlow CLI 工具扩展，文件结构：
- 命令定义: `.claude/commands/`
- Agent 指令: `.claude/agents/`
- Hooks: `.claude/hooks/`
- Scripts: `.claude/scripts/`
- Templates: `.claude/docs/templates/`
- Config: `config/`
- Output: `devflow/requirements/{REQ-ID}/checklists/`

---

## Phase 1: Setup (共享基础设施)

**Purpose**: 项目初始化和所有用户故事共用的基础结构

### 任务清单

- [ ] **T001** [P] [US1-6] 创建 `config/quality-rules.yml` 质量规则配置文件
  - 包含 gate.threshold: 80, types 定义 (6 种), dimensions 定义 (5 种)
  - 包含 anti_example.prohibited 和 anti_example.required 规则
  - 参考 TECH_DESIGN.md Section 3.2

- [ ] **T002** [P] [US1-6] 创建 `.claude/docs/templates/CHECKLIST_TEMPLATE.md` 输出模板
  - 包含 Header (Title, Purpose, Created, PRD Reference, Quality Dimensions)
  - 包含 Category 分组结构
  - 包含 Notes 章节说明格式
  - 参考 TECH_DESIGN.md Section 3.1 和 data-model.md Section 2

- [ ] **T003** [P] [US1-6] 创建 checklists 目录结构
  - 确保 `devflow/requirements/REQ-XXX/checklists/` 目录可创建
  - 在命令逻辑中处理目录不存在的情况

### Constitution Check (Phase 1)
- [ ] **Article VII - Simplicity Gate**: 只创建必需的配置和模板，无多余文件
- [ ] **Article VIII - Anti-Abstraction**: 配置直接使用 YAML，无抽象层
- [ ] **Article II - Architectural Consistency**: 遵循项目现有的 config/, .claude/docs/templates/ 结构

### Code Review Checkpoint (Phase 1)
- [ ] **T004** 触发 `/code-reviewer` 子代理生成 `reviews/phase-1-setup_code_review.md`

---

## Phase 2: Foundational (阻塞性前置条件)

**Purpose**: 所有用户故事的必需前置条件

**CRITICAL**: No user story work can begin until this phase is complete

### 任务清单

- [ ] **T005** [US1-6] 创建 `.claude/scripts/calculate-checklist-completion.sh` 完成度计算脚本
  - 输入: checklists/ 目录路径
  - 功能: 扫描所有 .md 文件，统计 `- [x]` 和 `- [ ]` 数量
  - 输出: JSON 格式 {total, checked, percentage, files: [...]}
  - 使用 grep + jq 实现，复用 common.sh 函数
  - 参考 TECH_DESIGN.md Section 6.2.2

- [ ] **T006** [P] [US1-6] 扩展 `orchestration_status.json` Schema 支持 checklist 字段
  - 新增字段: checklist_complete, checklist.generated_types, checklist.total_items
  - 新增字段: checklist.checked_items, checklist.completion_percentage
  - 新增字段: checklist.gate_passed, checklist.gate_skipped, checklist.skip_reason
  - 参考 TECH_DESIGN.md Section 3.3 和 data-model.md Section 4

- [ ] **T007** [P] [US1-6] 定义错误码常量和错误消息模板
  - MISSING_PRD, INVALID_TYPE, NO_CHECKLISTS, ITEM_NOT_FOUND
  - GATE_FAILED, SKIP_REASON_REQUIRED
  - 参考 TECH_DESIGN.md Section 4.4 和 contracts/command-interface.md Section 4

**Checkpoint**: Foundation ready - user story implementation can now begin

### Code Review Checkpoint (Phase 2)
- [ ] **T008** 触发 `/code-reviewer` 子代理生成 `reviews/phase-2-foundational_code_review.md`

---

## Phase 3: User Story 1 - 生成单类型 Checklist (Priority: P1) MVP

**Goal**: 运行 /flow-checklist --type ux 生成 UX 相关的需求质量检查项

**Independent Test**:
- 给定包含 UX 需求的 PRD.md
- 运行 /flow-checklist --type ux
- 验证：生成 checklists/ux.md，包含 15-30 条检查项，全部使用质量问句格式

### Implementation for User Story 1

- [ ] **T009** [US1] 创建 `.claude/agents/checklist-agent.md` Agent 指令文件
  - 文件大小限制: <= 250 行 (R003 决策)
  - 包含 Agent 身份和目标定义
  - 包含输入分析指令 (读取 PRD.md，按类型分析需求)
  - 包含 Anti-Example 强制规则 (R003 决策):
    - 禁止: "Verify", "Test", "Confirm", "Check that", "works correctly"
    - 要求: "Are ... defined", "Is ... quantified", "Can ... be measured"
  - 包含 5 维度质量问句生成指令 (Completeness, Clarity, Consistency, Measurability, Coverage)
  - 包含输出格式指令 (使用 CHECKLIST_TEMPLATE.md)
  - 包含追溯引用要求 (>= 80% 检查项包含 [Spec §X.Y] 或 [Gap])
  - 参考 TECH_DESIGN.md Section 1.2, research/research.md R003

- [ ] **T010** [US1] 创建 `.claude/commands/flow-checklist.md` 命令定义文件
  - 包含命令 Synopsis 和 Options 定义
  - 包含 Entry Gate: 检查 PRD.md 存在性
  - 包含参数解析逻辑 (--type, --status, --mark, --mark-all, --file, --help)
  - 包含类型验证 (valid_types: ux, api, security, performance, data, general)
  - 包含单类型生成流程: 调用 checklist-agent.md，输出到 checklists/{type}.md
  - 包含 Exit Gate: 更新 orchestration_status.json, 记录 EXECUTION_LOG.md
  - 参考 TECH_DESIGN.md Section 4.1, contracts/command-interface.md

- [ ] **T011** [US1] 实现追加模式：当 checklists/{type}.md 已存在时追加新检查项
  - 读取现有文件，获取最大 CHK 编号
  - 追加新检查项，编号继续递增
  - 参考 PRD.md Story 1 AC5

- [ ] **T012** [US1] 更新 EXECUTION_LOG.md 记录 Checklist 生成事件
  - Event: Checklist Generated
  - 记录: Type, Items, Dimensions, Traceability
  - 参考 data-model.md Section 5.3

**Checkpoint**: User Story 1 完成 - 可独立验证单类型 Checklist 生成

### Constitution Check (Phase 3)
- [ ] **Article I.1 - NO PARTIAL IMPLEMENTATION**: checklist-agent.md 完整实现 5 维度生成
- [ ] **Article III.1 - NO HARDCODED SECRETS**: API 调用使用 CLAUDE_API_KEY 环境变量
- [ ] **Article V.4 - File Size Limits**: checklist-agent.md <= 250 行

### Code Review Checkpoint (Phase 3)
- [ ] **T013** 触发 `/code-reviewer` 子代理生成 `reviews/phase-3-user-story-1_code_review.md`

---

## Phase 4: User Story 2 - 支持多类型批量生成 (Priority: P1) MVP

**Goal**: 运行 /flow-checklist --type ux,api,security 一次生成多个类型的 Checklist

**Independent Test**:
- 给定 PRD.md 包含 UX、API、Security 三个维度的需求
- 运行 /flow-checklist --type ux,api,security
- 验证：生成 3 个独立文件 checklists/ux.md, checklists/api.md, checklists/security.md

### Implementation for User Story 2

- [ ] **T014** [US2] 扩展 `.claude/commands/flow-checklist.md` 支持逗号分隔多类型
  - 解析 --type 参数，分割逗号获取类型数组
  - 验证每个类型的有效性
  - 循环调用 checklist-agent.md 生成每个类型
  - 参考 contracts/command-interface.md Section 3.2

- [ ] **T015** [US2] 实现批量生成摘要报告输出
  - 输出格式: 表格显示每个类型的 Items Generated 和 Coverage
  - 计算 TOTAL 汇总行
  - 参考 TECH_DESIGN.md Section 4.2.2

- [ ] **T016** [US2] 实现默认类型（无 --type 参数时使用 general）
  - 参考 PRD.md Story 2 AC4

**Checkpoint**: User Story 2 完成 - 可独立验证多类型批量生成

### Code Review Checkpoint (Phase 4)
- [ ] **T017** 触发 `/code-reviewer` 子代理生成 `reviews/phase-4-user-story-2_code_review.md`

---

## Phase 5: User Story 3 - 完成度计算与可视化 (Priority: P1) MVP

**Goal**: 命令计算并展示 Checklist 完成度百分比

**Independent Test**:
- 给定 checklists/ux.md 包含 20 条检查项，其中 16 条已勾选 [x]
- 运行 /flow-checklist --status
- 验证：显示 "ux: 80% (16/20)"

### Implementation for User Story 3

- [ ] **T018** [US3] 扩展 `.claude/commands/flow-checklist.md` 支持 --status 参数
  - 调用 calculate-checklist-completion.sh 获取完成度数据
  - 如果 checklists/ 目录为空或不存在，输出 NO_CHECKLISTS 错误
  - 参考 contracts/command-interface.md Section 3.3

- [ ] **T019** [US3] 实现完成度表格可视化输出
  - 输出格式: | Checklist | Complete | Total | Percentage |
  - 计算 OVERALL 汇总行 (使用 sum(checked)/sum(total)，C001 决策)
  - 显示 Gate Threshold 和 Status (PASS/FAIL)
  - 参考 TECH_DESIGN.md Section 4.2.3

- [ ] **T020** [US3] 更新 orchestration_status.json 中的 checklist 字段
  - 更新 completion_percentage, total_items, checked_items
  - 更新 last_check_at 时间戳
  - 参考 data-model.md Section 4.3

**Checkpoint**: User Story 3 完成 - 可独立验证完成度计算和可视化

### Code Review Checkpoint (Phase 5)
- [ ] **T021** 触发 `/code-reviewer` 子代理生成 `reviews/phase-5-user-story-3_code_review.md`

---

## Phase 6: User Story 4 - Epic 入口门检查 (Priority: P1) MVP

**Goal**: /flow-epic 命令在执行前检查 Checklist 完成度是否 >= 80%

**Independent Test**:
- 给定 Checklist 完成度为 75%（低于 80% 阈值）
- 运行 /flow-epic
- 验证：命令被拦截，提示 "Checklist completion 75% < 80% threshold"

### Implementation for User Story 4

- [ ] **T022** [US4] 创建 `.claude/hooks/checklist-gate.js` 门禁 Hook
  - 输入: --req-id, --json, --skip, --reason
  - 功能: 扫描 checklists/*.md，计算完成度，读取 quality-rules.yml 阈值
  - 输出 (JSON): {status, completion, threshold, details, message}
  - 支持 --skip --reason 跳过门禁 (require_reason 验证)
  - 参考 TECH_DESIGN.md Section 4.3, contracts/hook-interface.md

- [ ] **T023** [US4] 修改 `.claude/commands/flow-epic.md` 添加 Entry Gate
  - 在执行 Epic 生成前调用: node .claude/hooks/checklist-gate.js --req-id {REQ_ID} --json
  - 如果 status == "FAIL" 且无 --skip-gate: 显示错误，建议运行 /flow-checklist --status
  - 如果 --skip-gate 提供: 验证 --reason 存在，调用 hook 带 --skip --reason
  - 参考 contracts/hook-interface.md Section 9

- [ ] **T024** [US4] 实现审计日志记录（门禁跳过）
  - 在 EXECUTION_LOG.md 记录: Event: Gate Skipped, Actor, Completion, Threshold, Reason, Command
  - 更新 orchestration_status.json: gate_skipped: true, skip_reason: "..."
  - 参考 TECH_DESIGN.md Section 5.5, data-model.md Section 5.3

- [ ] **T025** [US4] 支持 quality-rules.yml 自定义阈值
  - 读取 config/quality-rules.yml 的 gate.threshold
  - 如果配置文件不存在，使用默认阈值 80%
  - 参考 PRD.md Story 4 AC5

**Checkpoint**: User Story 4 完成 - 可独立验证 Epic 入口门检查

### Constitution Check (Phase 6)
- [ ] **Article III.4 - Secure by Default**: 门禁跳过必须记录审计日志
- [ ] **Article X.2 - No Speculative Features**: 仅实现 PRD 定义的门禁逻辑

### Code Review Checkpoint (Phase 6)
- [ ] **T026** 触发 `/code-reviewer` 子代理生成 `reviews/phase-6-user-story-4_code_review.md`

---

## Phase 7: User Story 5 - 手动标记完成 (Priority: P2)

**Goal**: 通过直接编辑 Markdown 文件将检查项标记为完成

**Independent Test**:
- 给定 checklists/ux.md 中 CHK001 显示 "- [ ] CHK001..."
- 用户在编辑器中改为 "- [x] CHK001..."
- 运行 --status，验证完成度增加 1 项

### Implementation for User Story 5

- [ ] **T027** [US5] 增强 `calculate-checklist-completion.sh` 支持大小写不敏感
  - 识别 `- [x]` 和 `- [X]` 为已完成
  - 容错处理: `- [x]CHK001` (无空格) 也能正确解析
  - 参考 PRD.md Story 5 AC2, AC3

- [ ] **T028** [US5] 增强 `.claude/hooks/checklist-gate.js` 中的解析逻辑
  - 使用正则表达式 `/^- \[[xX]\]/gm` 匹配已完成项
  - 使用正则表达式 `/^- \[[ xX]\]/gm` 匹配所有检查项
  - 参考 contracts/hook-interface.md Section 7.1

**Checkpoint**: User Story 5 完成 - 可独立验证手动编辑识别

### Code Review Checkpoint (Phase 7)
- [ ] **T029** 触发 `/code-reviewer` 子代理生成 `reviews/phase-7-user-story-5_code_review.md`

---

## Phase 8: User Story 6 - 批量命令操作 (Priority: P3)

**Goal**: 使用命令批量标记检查项为完成

**Independent Test**:
- 给定 checklists/ux.md 包含 CHK001-CHK020
- 运行 /flow-checklist --mark CHK001,CHK002,CHK003
- 验证：3 项被标记为完成

### Implementation for User Story 6

- [ ] **T030** [US6] 扩展 `.claude/commands/flow-checklist.md` 支持 --mark 参数
  - 解析 --mark 参数，分割逗号获取 ID 列表
  - 验证 ID 格式 (CHK + 3 位数字)
  - 搜索所有 checklists/*.md 找到匹配的检查项
  - 将 `- [ ]` 替换为 `- [x]`
  - 如果 ID 不存在，输出警告 "CHK999 not found. Skipped."
  - 参考 contracts/command-interface.md Section 3.4

- [ ] **T031** [US6] 扩展 `.claude/commands/flow-checklist.md` 支持 --mark-all 参数
  - 必须配合 --file 参数使用
  - 验证指定文件存在
  - 将文件中所有 `- [ ]` 替换为 `- [x]`
  - 参考 contracts/command-interface.md Section 3.5

- [ ] **T032** [US6] 实现批量标记完成后的确认输出
  - 输出: "Updated completion: X items marked"
  - 建议: "Run /flow-checklist --status to see updated completion"
  - 参考 TECH_DESIGN.md Section 4.2.4

**Checkpoint**: User Story 6 完成 - 可独立验证批量命令操作

### Code Review Checkpoint (Phase 8)
- [ ] **T033** 触发 `/code-reviewer` 子代理生成 `reviews/phase-8-user-story-6_code_review.md`

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: 跨用户故事的改进和最终验收

### 任务清单

- [ ] **T034** [P] [US1-6] 更新 `.claude/skills/cc-devflow-orchestrator/skill.md` 工作流图
  - 在 /flow-prd 和 /flow-epic 之间添加 /flow-checklist
  - 更新工作流状态机描述

- [ ] **T035** [P] [US1-6] 创建或更新 `.claude/CLAUDE.md` 架构文档
  - 添加 /flow-checklist 模块描述
  - 更新文件树结构

- [ ] **T036** [US1-6] 运行 quickstart.md 全流程验证
  - 执行 Section 3 Quick Start 所有命令
  - 验证 Section 9 Testing Commands 所有测试
  - 记录验证结果

- [ ] **T037** [US1-6] 代码清理和注释完善
  - 确保所有文件有头部注释说明用途
  - 移除调试代码
  - 检查文件大小限制 (单文件 <= 500 行，agent <= 250 行)

- [ ] **T038** [US1-6] 安全审查
  - 验证 NO HARDCODED SECRETS
  - 验证输入参数验证完整
  - 验证文件路径限制 (仅 devflow/requirements/)

### Constitution Check (Phase 9)
- [ ] **Article I - Quality First**: 所有用户故事功能完整可用
- [ ] **Article II - Architectural Consistency**: 遵循现有项目模式
- [ ] **Article III - Security First**: 通过安全审查
- [ ] **Article V - Maintainability**: 文档完整，代码清晰

### Code Review Checkpoint (Phase 9)
- [ ] **T039** 触发 `/code-reviewer` 子代理生成 `reviews/phase-9-polish_code_review.md`

---

## Dependencies & Execution Order (依赖关系与执行顺序)

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS all user stories
    ↓
┌───────────────────────────────────────────────────────────────┐
│  Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4) │
│                        MVP Critical (P1)                        │
└───────────────────────────────────────────────────────────────┘
    ↓
Phase 7 (US5) → Phase 8 (US6)
    Enhancement (P2, P3)
    ↓
Phase 9 (Polish)
```

### User Story Dependencies

| User Story | 依赖 | 说明 |
|------------|------|------|
| US1 (P1) | Phase 2 | 需要配置和基础设施 |
| US2 (P1) | US1 | 复用 US1 的生成逻辑，扩展为批量 |
| US3 (P1) | Phase 2 | 需要完成度计算脚本 |
| US4 (P1) | US3 | 门禁依赖完成度计算 |
| US5 (P2) | US3 | 增强解析逻辑 |
| US6 (P3) | US1 | 需要 Checklist 文件存在 |

### Within Each User Story

- 命令定义 (flow-checklist.md) 依赖 Agent (checklist-agent.md)
- Hook (checklist-gate.js) 依赖配置 (quality-rules.yml)
- 所有任务依赖 Phase 1 的配置文件

### Parallel Opportunities

**Phase 1 (全部可并行)**:
```bash
# Launch together:
Task T001: 创建 config/quality-rules.yml
Task T002: 创建 CHECKLIST_TEMPLATE.md
Task T003: 创建目录结构
```

**Phase 2 (部分可并行)**:
```bash
# Launch together:
Task T006: 扩展 orchestration_status.json Schema
Task T007: 定义错误码常量

# Then:
Task T005: 创建完成度计算脚本 (依赖 T006 Schema 定义)
```

**Phase 9 (部分可并行)**:
```bash
# Launch together:
Task T034: 更新工作流图
Task T035: 更新 CLAUDE.md

# Sequential:
Task T036: quickstart.md 验证
Task T037: 代码清理
Task T038: 安全审查
```

---

## Implementation Strategy (实施策略)

### MVP First (User Story 1-4)

1. Complete Phase 1: Setup (0.5 天)
2. Complete Phase 2: Foundational (1 天)
3. Complete Phase 3: User Story 1 - 单类型生成 (1 天)
4. **CHECKPOINT**: 验证单类型生成能力
5. Complete Phase 4: User Story 2 - 多类型生成 (0.5 天)
6. Complete Phase 5: User Story 3 - 完成度计算 (0.5 天)
7. **CHECKPOINT**: 验证完成度统计能力
8. Complete Phase 6: User Story 4 - 门禁检查 (1 天)
9. **MVP COMPLETE**: /flow-checklist 核心功能可用

### Incremental Delivery

1. MVP (Phase 1-6) -> 核心功能交付
2. Add User Story 5 (Phase 7) -> 手动编辑支持
3. Add User Story 6 (Phase 8) -> 批量操作支持
4. Polish (Phase 9) -> 生产就绪

### Sequential Team Strategy

由于任务间存在依赖关系，建议单人顺序执行：

1. Day 1: Phase 1 + Phase 2 前半
2. Day 2: Phase 2 后半 + Phase 3
3. Day 3: Phase 4 + Phase 5
4. Day 4: Phase 6
5. Day 5: Phase 7 + Phase 8
6. Day 6: Phase 9

**总估算**: 5-6 工作日

---

## Notes (注意事项)

### Critical Rules
- **[P] = Parallel**: 只有不同文件、无依赖的任务才能标记 [P]
- **[US#] = Story Label**: 所有任务必须标记所属用户故事
- **Story Independence**: US1-US4 是 MVP，必须按顺序完成
- **Foundational First**: Phase 2 必须完成才能开始用户故事
- **Tests Optional**: 本需求使用 quickstart.md 验收测试，不需要传统单元测试
- **Commit Early**: 每完成一个任务就提交

### File Size Limits (CRITICAL)
- checklist-agent.md: <= 250 行 (R003 决策)
- 其他单文件: <= 500 行 (Constitution Article V.4)

### Common Pitfalls (常见陷阱)
- [ ] 忘记在 checklist-agent.md 嵌入 Anti-Example 规则
- [ ] 门禁 Hook 忘记验证 --reason 参数
- [ ] 完成度计算忘记大小写不敏感
- [ ] 追加模式忘记获取最大 CHK 编号

### Best Practices (最佳实践)
- [ ] 每个用户故事完成后运行 quickstart.md 对应测试
- [ ] 频繁提交，小步前进
- [ ] 参考 TECH_DESIGN.md 确保实现与设计一致
- [ ] 使用 contracts/ 目录的接口定义作为实现参考

---

## Validation Checklist (验证清单)

### User Story Organization (CRITICAL)
- [x] 每个用户故事有自己的 Phase (Phase 3-8)
- [x] 所有任务都有 [US#] 标签标记所属故事
- [x] 每个故事有 Independent Test 标准
- [x] 每个故事有 Checkpoint 验证点
- [x] Foundational phase 只包含所有故事共需的前置条件

### Completeness (完整性)
- [x] 所有 TECH_DESIGN.md 定义的模块都有对应任务
- [x] 所有 PRD.md 用户故事都有对应的任务集合
- [x] Setup 和 Foundational phase 明确定义
- [x] 所有 contracts/ 接口都有实现任务

### Story Independence (故事独立性)
- [x] US1 可以独立实现和测试（单类型生成）
- [x] US2 依赖 US1（复用生成逻辑）
- [x] US3 可以独立实现（完成度计算）
- [x] US4 依赖 US3（门禁依赖完成度）
- [x] US5 可以独立实现（解析增强）
- [x] US6 依赖 US1（需要 Checklist 文件）

### Parallel Safety (并行安全性)
- [x] 所有 [P] 标记的任务都操作不同文件
- [x] 同一文件的任务没有 [P] 标记
- [x] 有依赖关系的任务没有 [P] 标记

### Path Specificity (路径明确性)
- [x] 每个任务都指定了具体的文件路径
- [x] 路径使用了正确的项目结构约定
- [x] 配置文件路径: config/quality-rules.yml
- [x] 模板路径: .claude/docs/templates/CHECKLIST_TEMPLATE.md
- [x] 命令路径: .claude/commands/flow-checklist.md
- [x] Agent 路径: .claude/agents/checklist-agent.md
- [x] Hook 路径: .claude/hooks/checklist-gate.js
- [x] Script 路径: .claude/scripts/calculate-checklist-completion.sh

### Constitution Alignment (宪法符合性)
- [x] **Article I - Quality First**: 没有部分实现，所有任务完整定义
- [x] **Article II - Architectural Consistency**: 复用现有组件 (common.sh, check-prerequisites.sh)
- [x] **Article II - Anti-Over-Engineering**: 无过度抽象
- [x] **Article III - Security First**: 密钥管理、输入验证任务明确
- [x] **Article V - Maintainability**: 文件大小限制明确
- [x] **Article VII - Simplicity Gate**: 最小必需模块
- [x] **Article VIII - Anti-Abstraction Gate**: 直接实现，无封装
- [x] **Article IX - Integration-First Gate**: 基于 contracts/ 定义实现
- [x] **Article X - Requirement Boundary**: 任务仅实现 PRD 明确的需求

---

## Progress Tracking (进度跟踪)

### Overall Progress
- [ ] Phase 1: Setup (3 tasks + 1 review)
- [ ] Phase 2: Foundational (3 tasks + 1 review)
- [ ] **CHECKPOINT**: Foundation ready
- [ ] Phase 3: User Story 1 (4 tasks + 1 review) MVP
- [ ] Phase 4: User Story 2 (3 tasks + 1 review) MVP
- [ ] Phase 5: User Story 3 (3 tasks + 1 review) MVP
- [ ] Phase 6: User Story 4 (4 tasks + 1 review) MVP
- [ ] **CHECKPOINT**: MVP complete
- [ ] Phase 7: User Story 5 (2 tasks + 1 review)
- [ ] Phase 8: User Story 6 (3 tasks + 1 review)
- [ ] Phase 9: Polish (5 tasks + 1 review)

### User Story Completion
- [ ] US1 (P1): 0/5 tasks - Independent Test: PENDING
- [ ] US2 (P1): 0/4 tasks - Independent Test: PENDING
- [ ] US3 (P1): 0/4 tasks - Independent Test: PENDING
- [ ] US4 (P1): 0/5 tasks - Independent Test: PENDING
- [ ] US5 (P2): 0/3 tasks - Independent Test: PENDING
- [ ] US6 (P3): 0/4 tasks - Independent Test: PENDING

### Constitution Compliance
- [ ] **Initial Check**: Phase -1 Gates validated in EPIC.md
- [ ] **Article I-V**: Core principles checked per phase
- [ ] **Article VII-IX**: Phase -1 Gates passed
- [ ] **Article X**: Requirement boundary validated
- [ ] **Post-Implementation**: Constitution Check at Phase 9
- [ ] **Security Scan**: Task T038
- [ ] **Code Review**: Per-phase checkpoints

---

## Task Summary

| Phase | Tasks | Story | Description |
|-------|-------|-------|-------------|
| 1 | T001-T004 | US1-6 | Setup: 配置、模板、目录 |
| 2 | T005-T008 | US1-6 | Foundational: 计算脚本、Schema、错误码 |
| 3 | T009-T013 | US1 | 单类型 Checklist 生成 |
| 4 | T014-T017 | US2 | 多类型批量生成 |
| 5 | T018-T021 | US3 | 完成度计算与可视化 |
| 6 | T022-T026 | US4 | Epic 入口门检查 |
| 7 | T027-T029 | US5 | 手动标记完成 |
| 8 | T030-T033 | US6 | 批量命令操作 |
| 9 | T034-T039 | US1-6 | Polish: 文档、验证、安全 |

**Total Tasks**: 39

---

**Generated by**: planner agent
**Based on**: PRD.md, EPIC.md, TECH_DESIGN.md
**Constitution**: `.claude/rules/project-constitution.md` v2.0.0
**Template Version**: 3.0.0 (User Story Centric)

---

## 相关文档

- **PRD**: `devflow/requirements/REQ-002/PRD.md`
- **EPIC**: `devflow/requirements/REQ-002/EPIC.md`
- **TECH_DESIGN**: `devflow/requirements/REQ-002/TECH_DESIGN.md`
- **Contracts**: `devflow/requirements/REQ-002/contracts/`
- **Data Model**: `devflow/requirements/REQ-002/data-model.md`
- **Quickstart**: `devflow/requirements/REQ-002/quickstart.md`
- **Constitution**: `.claude/rules/project-constitution.md`
- **Execution Log**: `devflow/requirements/REQ-002/EXECUTION_LOG.md`
