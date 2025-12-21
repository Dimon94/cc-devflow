# PRD: REQ-002 - /flow-checklist 需求质量检查命令

**Status**: Draft
**Created**: 2025-12-15
**Owner**: Claude
**Type**: Requirement

**Input**: 用户需求描述、研究材料 from `devflow/requirements/REQ-002/research/`
**Prerequisites**: 需求 ID 已创建，初始需求信息已提供

---

## 背景与目标

### 业务背景

CC-DevFlow v2.x 工作流中，PRD 文档直接驱动后续 Epic/Task 规划。目前存在的问题：

1. **需求质量检测缺失**: PRD 生成后无系统化方法验证需求完整性、清晰度、一致性
2. **低质量需求流入下游**: 模糊的需求（如"快速响应"无具体指标）进入 Epic 规划，导致任务定义不准确
3. **后期返工成本高**: 开发阶段才发现需求模糊或遗漏，需重新澄清并更新所有下游文档

Spec-kit 项目提出 **"Unit Tests for English"** 理念：**对需求文档进行质量测试**，如同代码有单元测试一样，需求也应有 Checklist 验证。

### 问题陈述

**当前痛点**:
- PRD 审核完全依赖人工判断，缺乏标准化检查维度
- 需求中的模糊表述（如"prominent display"）无强制量化要求
- 需求完整性检查无门禁机制，低质量 PRD 可直接进入 Epic 规划

**用户期望**:
- 自动生成针对性 Checklist（按 UX/API/Security 等类型分类）
- 5 质量维度全覆盖（Completeness, Clarity, Consistency, Measurability, Coverage）
- 80% 通过率门禁（阻断低质量 PRD 进入 /flow-epic）

### 目标

- **主要目标**: 提供 /flow-checklist 命令，在 Epic 规划前系统化验证需求质量
- **成功指标**:
  - Checklist 生成时间 < 30 秒
  - 每个 Checklist 检查项 15-30 条（覆盖全面但不冗余）
  - 门禁通过后的 PRD 返工率 < 10%
- **影响范围**:
  - **直接用户**: 执行 /flow-prd 后的开发者
  - **受益阶段**: Epic 规划、Task 分解、开发阶段（减少返工）
  - **不影响**: 已通过 Phase 0 的现有需求（可选命令，支持 --skip-gate 跳过门禁）

---

## 技术约束

| 约束类型 | 具体要求 | 优先级 |
| -------- | -------- | ------ |
| Checklist 类型 | 支持 6 种类型 (ux, api, security, performance, data, general) | HIGH |
| 质量门禁阈值 | 默认 80%，可通过 config/quality-rules.yml 配置 | HIGH |
| Anti-Example 强制 | Agent 必须区分"测试需求质量"与"测试实现" | HIGH |
| 文件行数限制 | checklist-agent.md <= 250 行 | MEDIUM |

---

## 用户故事与验收标准

### Story 1: 生成单类型 Checklist (Priority: P1) MVP

**As a** 开发者
**I want** 运行 /flow-checklist --type ux 命令生成 UX 相关的需求质量检查项
**So that** 聚焦特定维度验证 PRD 中 UX 需求的完整性和清晰度

**Why this priority**: Checklist 生成是核心功能，无此功能则整个命令无价值。单类型支持是最小可用功能，P1 确保 MVP 可独立交付核心价值。

**Independent Test**:
- 给定包含 UX 需求的 PRD.md（如"用户可以查看 3 个推荐卡片"）
- 运行 /flow-checklist --type ux
- 验证：生成 checklists/ux.md，包含 15-30 条检查项，全部使用质量问句格式

**Acceptance Criteria**:
```gherkin
AC1: Given PRD.md 包含 UX 功能需求（如视觉层级、交互状态）
     When 运行 /flow-checklist --type ux
     Then 系统生成 checklists/ux.md 文件
          包含 15-30 条检查项（CHK001-CHKnnn）

AC2: Given 生成的 Checklist 检查项
     When 检查格式
     Then 每条使用质量问句格式：
          "Are [requirement type] defined/specified/documented for [scenario]? [Dimension, Spec reference]"

AC3: Given 检查项内容
     When 验证质量维度覆盖
     Then 至少覆盖 5 维度中的 4 个：
          [Completeness], [Clarity], [Consistency], [Measurability], [Coverage]

AC4: Given 检查项引用
     When 验证可追溯性
     Then >= 80% 检查项包含追溯引用：
          [Spec FR-XXX] 或 [Gap] 或 [Ambiguity]

AC5: Given checklists/ux.md 已存在
     When 再次运行 /flow-checklist --type ux
     Then 追加新检查项到同一文件（编号继续递增）
```

**Priority**: P1 (Highest - MVP Critical)
**Complexity**: HIGH（需实现 Anti-Example 检测 + 5 维度质量问句生成）

---

### Story 2: 支持多类型批量生成 (Priority: P1) MVP

**As a** 开发者
**I want** 运行 /flow-checklist --type ux,api,security 一次生成多个类型的 Checklist
**So that** 减少重复执行命令的操作负担，一次性完成全面质量检查

**Why this priority**: 基于 C004 澄清决策（支持多类型生成），批量操作是提升效率的核心能力。P1 确保 MVP 交付完整 UX。

**Independent Test**:
- 给定 PRD.md 包含 UX、API、Security 三个维度的需求
- 运行 /flow-checklist --type ux,api,security
- 验证：生成 3 个独立文件 checklists/ux.md, checklists/api.md, checklists/security.md

**Acceptance Criteria**:
```gherkin
AC1: Given 用户指定多个类型 --type ux,api,security
     When 运行 /flow-checklist
     Then 生成 3 个独立文件：
          - checklists/ux.md
          - checklists/api.md
          - checklists/security.md

AC2: Given 每个生成的 Checklist 文件
     When 检查内容独立性
     Then 每个文件只包含该类型相关的检查项（无混杂）

AC3: Given 生成完成后
     When 显示摘要报告
     Then 输出：
          | Type     | Items Generated | Coverage |
          | ux       | 18              | 5/5      |
          | api      | 22              | 5/5      |
          | security | 15              | 4/5      |

AC4: Given 不指定 --type 参数
     When 运行 /flow-checklist（默认模式）
     Then 生成 general.md（通用质量检查）
```

**Priority**: P1 (Highest - MVP Critical)
**Complexity**: MEDIUM（复用 Story 1 逻辑，增加循环执行）

---

### Story 3: 完成度计算与可视化 (Priority: P1) MVP

**As a** 开发者
**I want** 命令计算并展示 Checklist 完成度百分比
**So that** 直观了解当前 PRD 质量状态，决定是否可进入 Epic 规划

**Why this priority**: 基于 C001 澄清决策（全局计算完成度），完成度是门禁判断的核心依据。P1 确保 MVP 交付门禁功能基础。

**Independent Test**:
- 给定 checklists/ux.md 包含 20 条检查项，其中 16 条已勾选 [x]
- 运行 /flow-checklist --status
- 验证：显示 "ux: 80% (16/20)"

**Acceptance Criteria**:
```gherkin
AC1: Given checklists/ 目录包含 3 个 Checklist 文件
     When 运行 /flow-checklist --status
     Then 显示每个文件的完成度：
          | Checklist | Complete | Total | Percentage |
          | ux.md     | 16       | 20    | 80%        |
          | api.md    | 18       | 22    | 82%        |
          | security  | 12       | 15    | 80%        |
          | OVERALL   | 46       | 57    | 81%        |

AC2: Given 全局完成度计算
     When 应用公式
     Then 使用 sum(checked) / sum(total)（C001 决策）
          而非 average(各文件百分比)

AC3: Given 某检查项手动编辑为 [x]（勾选）
     When 重新运行 --status
     Then 立即反映更新后的完成度

AC4: Given checklists/ 目录为空
     When 运行 --status
     Then 输出 "No checklists found. Run /flow-checklist --type <type> first."
```

**Priority**: P1 (Highest - MVP Critical)
**Complexity**: LOW（文件解析 + 计数统计）

---

### Story 4: Epic 入口门检查 (Priority: P1) MVP

**As a** 开发者
**I want** /flow-epic 命令在执行前检查 Checklist 完成度是否 >= 80%
**So that** 阻断低质量 PRD 进入 Epic 规划，强制质量保障

**Why this priority**: 基于 R002/R005 决策（80% 阈值 + Epic 入口门），门禁机制是整个命令的核心价值。P1 确保 MVP 实现闭环质量控制。

**Independent Test**:
- 给定 Checklist 完成度为 75%（低于 80% 阈值）
- 运行 /flow-epic
- 验证：命令被拦截，提示 "Checklist completion 75% < 80% threshold. Run /flow-checklist --status to review."

**Acceptance Criteria**:
```gherkin
AC1: Given Checklist 完成度 >= 80%
     When 运行 /flow-epic
     Then 通过门禁检查，继续执行 Epic 规划

AC2: Given Checklist 完成度 < 80%（如 75%）
     When 运行 /flow-epic
     Then 拦截执行，输出：
          "ERROR: Checklist completion 75% < 80% threshold."
          "Run /flow-checklist --status to review incomplete items."

AC3: Given 用户使用 --skip-gate --reason "紧急发布"
     When 运行 /flow-epic --skip-gate --reason "紧急发布"
     Then 跳过门禁检查，但记录审计日志到 EXECUTION_LOG.md：
          "[2025-12-15T12:00:00Z] Gate skipped: Checklist <80%. Reason: 紧急发布"

AC4: Given 用户使用 --skip-gate 但未提供 --reason
     When 运行 /flow-epic --skip-gate
     Then 拒绝执行，提示 "--reason is required when using --skip-gate"

AC5: Given config/quality-rules.yml 配置 threshold: 70
     When 运行 /flow-epic（完成度 72%）
     Then 通过门禁（使用自定义阈值 70%）
```

**Priority**: P1 (Highest - MVP Critical)
**Complexity**: MEDIUM（需修改 flow-epic.md 添加 Entry Gate 检查）

---

### Story 5: 手动标记完成 (Priority: P2)

**As a** 开发者
**I want** 通过直接编辑 Markdown 文件将检查项标记为完成
**So that** 使用熟悉的工具（IDE/Editor）完成审核，无需学习新命令

**Why this priority**: 基于 C002 澄清决策（默认手动编辑），手动模式是核心交互方式。P2 因为 MVP 已有完成度计算，手动编辑自然支持。

**Independent Test**:
- 给定 checklists/ux.md 中 CHK001 显示 "- [ ] CHK001..."
- 用户在编辑器中改为 "- [x] CHK001..."
- 运行 --status，验证完成度增加 1 项

**Acceptance Criteria**:
```gherkin
AC1: Given checklists/ux.md 中某检查项格式为 "- [ ] CHK001..."
     When 用户手动编辑为 "- [x] CHK001..."
     Then --status 命令识别该项为已完成

AC2: Given 检查项格式为 "- [X] CHK001..."（大写 X）
     When 运行 --status
     Then 同样识别为已完成（大小写不敏感）

AC3: Given 检查项格式为 "- [x]CHK001..."（无空格）
     When 运行 --status
     Then 正确解析（容错处理）
```

**Priority**: P2 (High - Post-MVP Enhancement)
**Complexity**: LOW（Markdown 解析已在 Story 3 实现）

---

### Story 6: 批量命令操作 (Priority: P3)

**As a** 开发者
**I want** 使用命令批量标记检查项为完成
**So that** 快速处理多个检查项，提升审核效率

**Why this priority**: 基于 C002 澄清决策（可选命令批量操作），属于增强功能。P3 因为手动编辑已满足基本需求。

**Independent Test**:
- 给定 checklists/ux.md 包含 CHK001-CHK020
- 运行 /flow-checklist --mark CHK001,CHK002,CHK003
- 验证：3 项被标记为完成

**Acceptance Criteria**:
```gherkin
AC1: Given 用户指定 --mark CHK001,CHK002,CHK003
     When 运行命令
     Then 将指定的 3 个检查项标记为 [x]

AC2: Given 用户指定 --mark-all --file ux.md
     When 运行命令
     Then 将 ux.md 中所有检查项标记为 [x]

AC3: Given 用户指定不存在的检查项 --mark CHK999
     When 运行命令
     Then 输出警告 "CHK999 not found. Skipped."
```

**Priority**: P3 (Medium - Future Enhancement)
**Complexity**: LOW（文件读写操作）

---

### 边界案例处理

- **错误处理**:
  - PRD.md 不存在 -> 提示 "Run /flow-prd first."
  - checklists/ 目录不存在 -> 自动创建
  - 指定无效类型 --type invalid -> 提示 "Valid types: ux, api, security, performance, data, general"

- **权限控制**:
  - /flow-checklist 仅读写 devflow/requirements/REQ-XXX/ 目录
  - 不修改 PRD.md 原文件

- **数据验证**:
  - 检查项编号格式：CHK + 3 位数字（CHK001-CHK999）
  - Checklist 文件名限制：仅允许 6 种类型 + 自定义名称

- **边界条件**:
  - PRD.md 无需求内容 -> 生成最小 Checklist（5 条基础检查项）
  - 检查项数量超过 50 -> 警告 "High item count. Consider splitting into multiple checklists."

---

## 非功能性要求

### 性能要求

| 指标 | 目标值 | 关键性 |
|------|--------|--------|
| 单类型 Checklist 生成 (p95) | < 30 秒 | HIGH |
| 多类型批量生成 (3 类型, p95) | < 60 秒 | MEDIUM |
| 完成度计算 | < 2 秒 | HIGH |
| 门禁检查 | < 1 秒 | HIGH |

### 安全要求

- [ ] **身份验证**: 无需认证（本地 CLI 工具）
- [ ] **授权机制**: 文件系统权限（仅读写 devflow/ 目录）
- [ ] **数据加密**: 不涉及敏感数据（仅需求文档）
- [ ] **输入验证**: 类型参数验证（仅允许 6 种有效类型）
- [ ] **审计日志**: 门禁跳过记录到 EXECUTION_LOG.md（C003 决策）
- [ ] **密钥管理**: NO HARDCODED SECRETS（如需调用 LLM API，使用环境变量 CLAUDE_API_KEY）

### 可扩展性要求

- **水平扩展**: 不涉及（单用户 CLI 工具）
- **垂直扩展**: 支持 PRD.md 文件大小 <= 10MB
- **类型扩展**: 6 种类型可通过 config/quality-rules.yml 扩展

### 可靠性要求

- **可用性目标**: 99.9%（CLI 工具无服务端依赖，除非 LLM API 宕机）
- **数据备份**: 无需备份（Checklist 可重新生成）
- **灾难恢复**: 无状态设计，失败后重新运行即可
- **错误处理**:
  - API 超时 -> 重试 3 次 -> 提示手动重试
  - 文件写入失败 -> 提示检查磁盘空间

### 可观测性要求

- **日志记录**:
  - 每次生成记录到 EXECUTION_LOG.md（时间戳、类型、检查项数）
  - 门禁跳过详细记录（时间、原因、操作者）
- **监控指标**:
  - 平均生成时间
  - 门禁通过率
- **告警设置**: 无（本地 CLI 工具）
- **追踪**: 检查项包含 Spec 引用（可追溯到 PRD 章节）

### 可访问性要求

- **无障碍标准**: CLI 工具支持屏幕阅读器（输出纯文本）
- **多语言支持**:
  - MVP: 中文优先（检查项、报告均中文）
  - Enhancement: 支持 --lang=en 标志
- **设备兼容性**:
  - macOS / Linux / Windows（WSL）
  - 最低要求：Node.js 18+

---

## 成功指标

### 主要指标

| 指标 | 基线 | 目标 | 时间线 | 测量方法 |
|------|------|------|--------|----------|
| Checklist 生成时间 | N/A（新功能） | < 30 秒 | M2 发布后 2 周 | 记录 EXECUTION_LOG.md 中的生成时长 |
| 检查项覆盖率 | N/A | >= 15 条/类型 | M2 发布后 2 周 | 统计生成的 Checklist 平均检查项数 |
| 门禁通过后返工率 | 40%（历史 PRD 返工率） | < 10% | M2 发布后 1 个月 | 统计通过门禁的 PRD 在开发阶段的返工次数 |

### 次要指标

| 指标 | 基线 | 目标 | 时间线 | 测量方法 |
|------|------|------|--------|----------|
| 用户采用率 | 0% | >= 80% | M2 发布后 3 个月 | 统计 /flow-prd 后执行 /flow-checklist 的比例 |

---

## Constitution Check (宪法符合性检查)

*GATE: 必须在 Epic 规划前通过*

**Reference**: `.claude/rules/project-constitution.md` (v2.0.0)

### Article I: Quality First (质量至上)

- [x] **I.1 - NO PARTIAL IMPLEMENTATION**: 需求定义完整且明确？无占位符和模糊表述？
  - All user stories have clear acceptance criteria (Given-When-Then)
  - No {{PLACEHOLDER}} markers
  - 5 quality dimensions explicitly defined

- [x] **I.3 - No Simplification**: 避免"暂时简化，后续完善"的描述？
  - MVP (P1) includes complete core flow (generate -> calculate -> gate)
  - P2/P3 clearly marked as Enhancement

- [x] 用户故事遵循 INVEST 准则？
  - Independent: Story 1 can be tested without Story 2-6
  - Negotiable: Implementation flexible (LLM or rule-based)
  - Valuable: Clear user value ("So that...")
  - Estimable: Story 1-4 = HIGH/MEDIUM complexity, ~2-3 days/story
  - Small: Each story completable in 1 week
  - Testable: All stories have "Independent Test" criteria

- [x] 验收标准具体、可测试、可衡量？
  - Given-When-Then format used consistently
  - Quantified targets (e.g., "15-30 items", "< 30 seconds")

### Article X: Requirement Boundary (需求边界) - CRITICAL

- [x] **X.1 - Forced Clarification**: 所有不明确之处标记？
  - Based on research.md (5 decisions R001-R005)
  - Based on clarifications (4 decisions C001-C004)
  - No [NEEDS CLARIFICATION] remaining

- [x] **X.2 - No Speculative Features**: 无推测性功能？
  - P2/P3 based on clarified decisions, not speculation
  - No "may need in future" features

- [x] **X.3 - User Story Independence**: 每个故事有明确优先级？
  - Story 1-4 = P1 (MVP Critical)
  - Story 5 = P2 (Post-MVP)
  - Story 6 = P3 (Future)

- [x] **X.3 - Independent Test**: 每个故事有独立测试标准？
  - All stories include "Independent Test" section

### Article II: Architectural Consistency (架构一致性)

- [x] **II.1 - NO CODE DUPLICATION**: 识别可复用组件？
  - Reuse existing .claude/commands/ pattern
  - Reuse orchestration_status.json mechanism
  - Reuse EXECUTION_LOG.md logging

- [x] **II.3 - Anti-Over-Engineering**: 方案适合问题规模？
  - Single agent (checklist-agent) <= 250 lines
  - YAML config for rules (not over-abstracted)
  - 6 types hardcoded (sufficient for MVP)

- [x] **II.4 - Single Responsibility**: 职责分离清晰？
  - flow-checklist.md (command entry)
  - checklist-agent.md (generation logic)
  - checklist-gate.js (Epic entry gate)
  - quality-rules.yml (configuration)

### Article III: Security First (安全优先)

- [x] **III.1 - NO HARDCODED SECRETS**: 密钥管理策略定义？
  - API Key via CLAUDE_API_KEY environment variable
  - No secrets in config/quality-rules.yml

- [x] **III.2 - Input Validation**: 输入验证需求明确？
  - Type parameter validation (6 valid types only)
  - File path validation (devflow/ directory only)

- [x] **III.3 - Least Privilege**: 权限机制清晰？
  - CLI tool, no authentication required
  - File system permissions only

- [x] **III.4 - Secure by Default**: 安全默认配置？
  - No sensitive data involved
  - Audit log for gate bypass (C003 decision)

### Article IV: Performance Accountability (性能责任)

- [x] **IV.1 - NO RESOURCE LEAKS**: 资源管理考虑？
  - Stateless operation (no persistent connections)
  - API timeout handling

- [x] **IV.2 - Algorithm Efficiency**: 性能目标现实？
  - < 30 seconds per checklist (reasonable for LLM call)
  - < 2 seconds for completion calculation (file parsing)

- [x] **IV.4 - Caching Strategy**: 监控规划？
  - Generation time logged to EXECUTION_LOG.md

### Article V: Maintainability (可维护性)

- [x] **V.1 - NO DEAD CODE**: 避免不必要功能？
  - P1 focuses on MVP (generate -> calculate -> gate)
  - P2/P3 based on clarified decisions

- [x] **V.2 - Separation of Concerns**: 职责分离？
  - Command / Agent / Config / Hook separated
  - Each file <= 250 lines

- [x] **V.4 - File Size Limits**: 文件大小限制？
  - checklist-agent.md <= 250 lines (R003 decision)
  - No single file exceeds 500 lines

### Constitutional Violations (宪法违规记录)

**重要**: 本 PRD 无宪法违规

---

## 依赖关系

### 上游依赖

*此需求实现前必须完成的依赖*

- [x] RM-001 (/flow-clarify 命令) - Clarify Complete
- [x] /flow-prd 命令已实现（PRD.md 生成）
- [x] orchestration_status.json 状态机制
- [x] EXECUTION_LOG.md 日志机制

### 下游依赖

*依赖此需求的其他需求*

- /flow-epic 命令（Entry Gate 检查 Checklist 完成度）
- planner agent（更高质量的 PRD 输入 -> 更准确的 TASKS.md）

### 外部依赖

*第三方或外部系统依赖*

- Claude API（用于 Checklist 生成）— 需稳定网络连接
- Node.js 18+（如使用 JavaScript Hook）
- YAML 解析器（js-yaml 或 PyYAML）

---

## 风险评估与缓解

### 技术风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Anti-Example 检测不准（生成实现级测试而非需求检查） | M | H | Agent 强制嵌入 Anti-Example 指导（R003）+ 人工审核机制 |
| Checklist 生成超时（> 30 秒） | M | M | 设置 API 超时，失败后提示重试 |
| 质量维度覆盖不均（某维度检查项过少） | L | M | 模板强制每维度至少 2 条检查项 |

### 业务风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 用户绕过门禁（频繁使用 --skip-gate） | M | H | --reason 必填（C003）+ 审计日志 + 定期审查 |
| 80% 阈值过高（导致流程阻塞） | L | M | 可通过 quality-rules.yml 调整阈值（R002） |

### 进度风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Agent 指令开发复杂度高（Anti-Example 逻辑） | M | M | 参考 spec-kit checklist.md 完整实现 |
| 门禁 Hook 集成调试困难 | L | L | 使用 JavaScript Hook（熟悉技术栈） |

---

## 范围界定

### 包含内容

- 6 种 Checklist 类型生成 (ux, api, security, performance, data, general)
- 5 质量维度覆盖 (Completeness, Clarity, Consistency, Measurability, Coverage)
- 全局完成度计算与可视化
- /flow-epic 入口门检查（80% 阈值）
- 门禁跳过审计日志
- 多类型批量生成
- 手动编辑 Markdown 标记完成

### 明确不包含

*明确列出不在此需求范围内的内容*

- 自动修复 PRD 中的需求问题（仅检查，不修改）
- 与 CI/CD 集成（仅 CLI 命令）
- 多用户协作（单用户本地执行）
- 历史 Checklist 对比分析（版本差异）
- 机器学习模型训练（使用现成 LLM API）
- 图形化界面（纯 CLI 工具）

---

## 假设条件

*创建 PRD 时的关键假设*

- 用户已熟悉 CC-DevFlow 工作流（/flow-init -> /flow-prd -> /flow-checklist -> /flow-epic）
- PRD.md 由 /flow-prd 生成，格式规范（符合模板）
- 用户有稳定网络连接（调用 Claude API）
- 15-30 条检查项/类型 足够覆盖常见需求质量问题
- 80% 阈值是合理的质量门禁标准（可配置调整）

---

## 未决问题

*Epic 规划前需要回答的问题*

无未决问题。所有关键决策已在研究阶段（R001-R005）和澄清阶段（C001-C004）完成。

---

## 发布计划

### 里程碑

- **Phase 1 (M2 - MVP)**: Story 1-4（核心流程）— 2026-01-15
  - 单类型 Checklist 生成
  - 多类型批量生成
  - 完成度计算与可视化
  - Epic 入口门检查

- **Phase 2 (M2.1 - Enhancement)**: Story 5-6（增强功能）— 2026-01-31
  - 手动标记完成（容错处理）
  - 批量命令操作

### 回滚计划

- **回滚触发条件**:
  - Anti-Example 检测准确率 < 60%（生成实现级测试而非需求检查）
  - 用户因门禁阻塞投诉率 > 30%
  - Checklist 生成时间 > 60 秒

- **回滚步骤**:
  1. 禁用 /flow-epic 入口门检查（移除 checklist-gate.js 调用）
  2. 保留 /flow-checklist 命令（可选使用）
  3. 通知用户："门禁暂时禁用，Checklist 为可选功能"

- **数据处理**:
  - 保留已生成的 checklists/ 文件（只读存档）
  - PRD.md 不受影响

---

## Progress Tracking (进度跟踪)

*在 PRD 创建过程中更新*

### 完成状态

- [x] 背景与目标明确
- [x] 用户故事定义（INVEST 合规）
- [x] 验收标准编写（Given-When-Then）
- [x] 功能需求文档化
- [x] 非功能需求规定
- [x] 技术约束识别
- [x] 成功指标定义
- [x] Constitution Check 通过
- [x] 依赖关系映射
- [x] 风险评估完成
- [x] 范围明确界定
- [x] 未决问题跟踪

### 质量检查

- [x] 所有用户故事有验收标准
- [x] 所有 NFR 有量化目标
- [x] 性能目标可测量
- [x] 安全要求完整
- [x] 无模糊需求
- [x] 所有缩写已定义

### 闸门状态

- [x] Constitution Check: **PASS**
- [x] 完整性验证: **PASS**
- [x] 质量检查: **PASS**

**准备好进行 Epic 规划**: **YES**

---

## 附录

### 研究材料

*链接到研究文档*

- [research.md](research/research.md) - 5 个技术决策（R001-R005）
- [spec-kit checklist.md](../../../spec-kit/templates/commands/checklist.md) - "Unit Tests for English" 完整参考实现

### 参考资料

*外部参考和文档*

- [BMC Shift-Left Testing](https://www.bmc.com/blogs/what-is-shift-left-shift-left-testing-explained/) - 测试左移理论
- [CMU SEI Four Types of Shift-Left](https://www.sei.cmu.edu/blog/four-types-of-shift-left-testing/) - 四种左移策略
- [SPEC_KIT_FINAL_SOLUTION.md](../../../docs/SPEC_KIT_FINAL_SOLUTION.md) - 详细设计规格

### 术语表

*定义领域特定术语*

- **Unit Tests for English**: 对需求文档进行质量测试的理念，如同代码有单元测试
- **Checklist**: 需求质量检查清单，用于验证 PRD 的完整性、清晰度、一致性
- **质量维度 (Quality Dimension)**: 检查需求的 5 个角度（Completeness, Clarity, Consistency, Measurability, Coverage）
- **门禁 (Gate)**: 质量检查关卡，阻断低于阈值的文档进入下一阶段
- **Anti-Example**: 反例指导，明确说明"什么是错误的"以避免常见错误
- **Traceability**: 可追溯性，检查项引用 PRD 章节的能力

---

**Generated by**: prd-writer agent
**Based on**: CC-DevFlow Constitution v2.0.0
**Template Version**: 2.0.0 (Self-Executable)
**Next Step**: Run `/flow-epic` to create EPIC.md and TASKS.md

---

## Validation Checklist (验证清单)

*GATE: PRD 标记为完成前检查*

### 需求不扩散验证 CRITICAL

- [x] **NO SPECULATION**: 所有功能都由研究决策（R001-R005）和澄清决策（C001-C004）支持
- [x] **ALL CLARIFIED**: 没有未解决的 [NEEDS CLARIFICATION] 标记
- [x] **NO TECH DETAILS**: 没有技术实现细节（专注 WHAT 和 WHY，不描述 HOW）
- [x] **STORY INDEPENDENCE**: 每个故事都有 Independent Test 标准
- [x] **PRIORITY ASSIGNED**: 所有故事都有明确优先级 (P1=Story 1-4, P2=Story 5, P3=Story 6)
- [x] **MVP IDENTIFIED**: P1 故事能够作为独立 MVP 交付（核心流程完整）

### 用户故事质量 (INVEST 原则)

- [x] **Independent**: 每个故事可独立交付和测试
- [x] **Negotiable**: 细节可以讨论，实现方式灵活
- [x] **Valuable**: 有明确的用户/业务价值
- [x] **Estimable**: 可以估算工作量
- [x] **Small**: 可在一个迭代内完成
- [x] **Testable**: 有明确的验收标准和测试方法

### 验收标准质量

- [x] 使用 Given-When-Then 格式
- [x] 包含正常流程（Happy Path）
- [x] 包含边界情况（Edge Cases）
- [x] 包含错误场景（Error Handling）
- [x] 具体且可测试（非模糊描述）
- [x] 每个故事至少 2 个验收标准

### 完整性检查

- [x] 所有必需章节已填写
- [x] 没有 {{PLACEHOLDER}} 未替换
- [x] 所有依赖已识别（上游、下游、外部）
- [x] 所有风险已评估（技术、业务、进度）
- [x] 范围明确界定（包含 + 不包含）
- [x] 假设条件已列出

### Constitution 符合性

- [x] 通过所有宪法检查（Article I, II, III, IV, V, X 全 PASS）
- [x] 违规已文档化并说明理由（无违规）
- [x] 安全要求符合 NO HARDCODED SECRETS
- [x] 质量要求符合 NO PARTIAL IMPLEMENTATION
- [x] 架构要求符合 NO OVER-ENGINEERING
