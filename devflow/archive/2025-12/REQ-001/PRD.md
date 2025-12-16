# PRD: REQ-001 - /flow-clarify 需求澄清命令

**Status**: Draft
**Created**: 2025-12-15
**Owner**: Claude
**Type**: Requirement

**Input**: 用户需求描述、研究材料 from `devflow/requirements/REQ-001/research/`
**Prerequisites**: 需求 ID 已创建，初始需求信息已提供

---

## 背景与目标

### 业务背景

CC-DevFlow v2.x 工作流中，PRD 质量直接决定后续 Epic/Task 规划的准确性。目前存在的问题：

1. **研究不完整风险**: /flow-init 生成的 research.md 可能包含模糊表述、隐式假设、未决策的技术选项
2. **歧义传播**: 模糊需求进入 PRD 后，导致 planner agent 产生低质量 TASKS.md
3. **返工成本**: 开发阶段才发现需求不清，需重新澄清并更新所有下游文档

Spec-kit 项目的"质量左移"理念证明：**在 PRD 生成前消除歧义**可将返工率降低 60-70%。

### 问题陈述

**当前痛点**:
- 用户手工检查 research.md 遗漏率高（未系统化扫描）
- 澄清过程依赖主观判断，缺乏标准维度
- 澄清结论以文本形式分散，难以整合回 research.md

**用户期望**:
- 自动化歧义扫描（11 维度全覆盖）
- 智能问题生成（优先级排序，限制 ≤5 个）
- 结构化澄清报告（可追溯决策历史）

### 目标

- **主要目标**: 提供 /flow-clarify 命令，在 PRD 生成前系统化消除需求歧义
- **成功指标**:
  - 平均澄清时间 < 5 分钟
  - 歧义识别覆盖率 ≥ 90%（11 维度中至少 10 个）
  - 用户满意度 ≥ 4.5/5（"问题切中要害，不浪费时间"）
- **影响范围**:
  - **直接用户**: 执行 /flow-init 后的开发者
  - **受益阶段**: PRD 生成、Epic 规划、开发阶段（减少返工）
  - **不影响**: 已通过 Phase 0 的现有需求（可选命令，不强制）

---

## 用户故事与验收标准

### Story 1: 自动歧义扫描 (Priority: P1) 🎯 MVP

**As a** 开发者
**I want** 运行 /flow-clarify 命令自动扫描 research.md 的 11 维度歧义
**So that** 无需手工逐行检查，系统化发现遗漏或模糊的需求

**Why this priority**: 歧义识别是澄清流程的基础，无此功能则整个命令无价值。P1 确保 MVP 可独立交付核心价值。

**Independent Test**:
- 给定包含 3 处功能歧义、2 处数据模型模糊性的 research.md
- 运行 /flow-clarify 后，系统识别 ≥ 4 处（80% 召回率）
- 此功能无需下游 PRD 生成即可验证价值

**Acceptance Criteria**:
```gherkin
AC1: Given research.md 包含 TODO/PLACEHOLDER 标记
     When 运行 /flow-clarify --dimension all
     Then 系统输出包含该标记的维度名称（如 "Dimension 10: Misc/Placeholders - 发现 3 处"）

AC2: Given research.md 使用模糊形容词（如 "robust"、"fast"）无量化指标
     When 扫描 "Non-Functional Quality" 维度
     Then 系统标记该形容词为歧义（"'fast' - no latency target specified"）

AC3: Given research.md 完整且无歧义（所有 11 维度清晰）
     When 运行 /flow-clarify
     Then 系统输出 "✅ No major ambiguities found. Ready for /flow-prd."

AC4: Given 11 维度并行扫描（使用 haiku 模型）
     When 任意单个维度超时（> 20 秒）
     Then 该维度标记为 "TIMEOUT"，其他维度继续执行

AC5: Given 扫描结果包含 8 个维度有发现、3 个维度无问题
     When 显示扫描摘要
     Then 输出表格：| Dimension | Status | Issues Found |
```

**Priority**: P1 (Highest - MVP Critical)
**Complexity**: HIGH（需实现 11 维度检测算法 + 并行执行）

---

### Story 2: 智能问题生成与优先级排序 (Priority: P1) 🎯 MVP

**As a** 开发者
**I want** 系统根据扫描结果生成最高优先级的 ≤5 个问题
**So that** 聚焦最关键的歧义，避免被 20+ 个低优先级问题淹没

**Why this priority**: 问题配额（≤5）是 roadmap 的硬性约束，直接影响用户体验（< 5 min 完成目标）。P1 确保 MVP 可交付。

**Independent Test**:
- 给定 research.md 包含 15 处歧义（分布在 11 维度）
- 运行 /flow-clarify 后，系统生成 5 个问题（优先级由高到低）
- 验证方式：人工评审 5 个问题是否覆盖最高 Impact × Uncertainty 的维度

**Acceptance Criteria**:
```gherkin
AC1: Given 扫描发现 15 处歧义
     When 生成问题清单
     Then 输出数量 ≤ 5 个（严格限制）

AC2: Given 问题按 (Impact × Uncertainty) 排序
     When 第 1 个问题影响核心功能（Impact=9），不确定性高（Uncertainty=8）
     Then 该问题得分 = 9×8 = 72，排在得分 < 72 的其他问题前

AC3: Given 某维度有 3 处歧义但影响低（如 Terminology 维度）
     When 生成问题时
     Then 该维度最多生成 1 个问题（合并同类项）

AC4: Given 生成的每个问题
     When 检查问题格式
     Then 包含：维度名称、具体歧义内容、为何重要（Impact 说明）

AC5: Given 扫描结果无高优先级歧义（所有 Impact < 3）
     When 生成问题清单
     Then 输出 "Low-priority issues found. Suggest proceed to /flow-prd with caution."
```

**Priority**: P1 (Highest - MVP Critical)
**Complexity**: MEDIUM（需实现优先级算法 + 问题模板生成）

---

### Story 3: 交互式澄清对话（Sequential + AI 推荐） (Priority: P1) 🎯 MVP

**As a** 开发者
**I want** 系统逐个呈现问题，并提供 AI 推荐答案（基于最佳实践）
**So that** 快速做出知情决策，无需从零思考（加速澄清流程）

**Why this priority**: 交互体验直接决定用户满意度。Sequential + AI 推荐是 spec-kit 验证的最佳模式。P1 确保 MVP 交付完整 UX。

**Independent Test**:
- 给定 3 个问题待澄清
- 运行 /flow-clarify 进入交互模式
- 验证：每次只显示 1 个问题，提供推荐选项，用户回答后进入下一题

**Acceptance Criteria**:
```gherkin
AC1: Given 5 个问题待澄清
     When 进入交互模式
     Then 第一次只显示 Question 1（不显示 Q2-Q5）

AC2: Given 当前问题为 "认证方式选择"（多选题）
     When 显示问题
     Then 包含：
          - 问题描述
          - AI 推荐答案（标记 ⭐ RECOMMENDED）
          - 2-5 个选项（A/B/C...）
          - 每个选项的简短说明

AC3: Given 用户输入 "A"（选择 Option A）
     When 系统验证答案
     Then 如果 A 是有效选项 → 接受并进入下一题
          如果 A 不在选项中 → 提示 "Invalid option. Please choose from A/B/C."

AC4: Given 当前问题为 "延迟目标"（短答题）
     When 显示问题
     Then 包含：
          - AI 建议值（如 "< 2 seconds"）
          - 输入格式要求（≤5 words）
          - 示例（如 "100ms", "under 1 sec"）

AC5: Given 用户回答所有 5 个问题
     When 交互结束
     Then 显示 "✅ Clarification complete. Generating report..."

AC6: Given 用户在第 3 个问题时按 Ctrl+C
     When 中断交互
     Then 显示 "⚠️ Clarification interrupted. Progress saved for Q1-Q2. Run /flow-clarify to resume."
```

**Priority**: P1 (Highest - MVP Critical)
**Complexity**: MEDIUM（需实现 CLI 交互 + 推荐答案生成）

---

### Story 4: 增量式集成与澄清报告生成 (Priority: P1) 🎯 MVP

**As a** 开发者
**I want** 每回答 1 个问题后，系统立即保存到 clarifications/[timestamp].md
**So that** 即使会话中断（网络/电量问题），不会丢失已回答的内容

**Why this priority**: 上下文丢失是用户最痛恨的体验之一。Prompt Chaining 模式（增量保存）是 Anthropic 推荐的防错设计。P1 确保 MVP 可靠性。

**Independent Test**:
- 给定 3 个问题待澄清
- 回答 Q1 后人工模拟中断（kill process）
- 重新运行 /flow-clarify，验证 Q1 答案已保存且可跳过

**Acceptance Criteria**:
```gherkin
AC1: Given 用户完成 Q1 回答（选择 Option A）
     When 系统处理答案
     Then 立即写入 research/clarifications/[timestamp]-flow-clarify.md
          格式：
          ### Q1: 认证方式
          **Answer**: Option A (OAuth2)
          **Rationale**: [AI 生成的理由]

AC2: Given clarifications/[timestamp].md 已存在（包含 Q1-Q2）
     When 用户回答 Q3
     Then 追加 Q3 内容到同一文件（不覆盖 Q1-Q2）

AC3: Given 所有 5 个问题已回答
     When 生成最终报告
     Then clarifications/[timestamp].md 包含：
          - Metadata（日期、维度扫描数、问题数、耗时）
          - Q&A 详情（每个问题独立章节）
          - Coverage Summary（11 维度状态表格）
          - Updated Sections（列出修改的 research.md 章节）
          - Next Command（建议 /flow-prd）

AC4: Given clarifications/ 目录下有 3 个历史报告
     When 运行 /flow-clarify
     Then 新报告文件名使用当前时间戳，不覆盖历史记录

AC5: Given 澄清报告生成完毕
     When 检查文件完整性
     Then 包含所有必需章节（Clarification Session, Coverage Summary, Updated Sections）
          且无 {{PLACEHOLDER}} 标记
```

**Priority**: P1 (Highest - MVP Critical)
**Complexity**: MEDIUM（需实现增量写入 + 模板生成）

---

### Story 5: 自动更新 research.md（可选功能） (Priority: P2)

**As a** 开发者
**I want** 系统自动将澄清结论集成到 research.md 的相关章节
**So that** 无需手工复制粘贴，确保 research.md 始终是最新版本

**Why this priority**: 虽然有价值，但可手工完成（workaround 存在）。P2 确保 MVP 专注核心流程，此功能可后续迭代。

**Independent Test**:
- 给定 Q1 澄清了数据模型（选择 OAuth2）
- 澄清结束后，检查 research.md 的 "## Decisions" 章节
- 验证：新增 R012 决策点（OAuth2 认证）+ Decision/Rationale/Alternatives

**Acceptance Criteria**:
```gherkin
AC1: Given Q1 澄清了 "Data Model" 维度（OAuth2）
     When 生成报告后
     Then research.md 的 "## Decisions" 章节新增：
          ### R012 — Authentication Method
          **Decision**: OAuth2 with PKCE
          **Rationale**: [用户答案 + AI 补充理由]
          **Alternatives considered**: JWT/Session Cookies

AC2: Given Q2 澄清了 "Performance Target"（2 秒）
     When 更新 research.md
     Then research-summary.md 的 "Non-Functional Quality" 章节新增：
          - Latency: < 2 seconds (clarified on 2025-12-15)

AC3: Given 用户选择 --no-auto-update 标志
     When 运行 /flow-clarify --no-auto-update
     Then 仅生成 clarifications/ 报告，不修改 research.md

AC4: Given research.md 已被用户手工修改（与 clarifications/ 冲突）
     When 检测到冲突
     Then 提示 "⚠️ Conflict detected in research.md. Manual merge required."
          并跳过自动更新
```

**Priority**: P2 (High - Post-MVP Enhancement)
**Complexity**: HIGH（需实现语义匹配 + 章节更新逻辑）

---

### Story 6: 澄清历史查询与可视化 (Priority: P3)

**As a** 开发者
**I want** 运行 /flow-clarify --history 查看过往澄清记录
**So that** 追溯决策历史，理解为何做出某选择

**Why this priority**: Nice-to-have 功能，对 MVP 非必需。P3 确保资源优先投入核心流程。

**Independent Test**:
- 给定 research/clarifications/ 目录下有 3 个历史报告
- 运行 /flow-clarify --history
- 验证：显示 3 个报告的摘要（日期、问题数、覆盖维度）

**Acceptance Criteria**:
```gherkin
AC1: Given clarifications/ 目录下有 3 个报告
     When 运行 /flow-clarify --history
     Then 输出表格：
          | Date       | Feature      | Questions | Dimensions Covered | Time |
          |------------|--------------|-----------|-------------------|------|
          | 2025-12-15 | flow-clarify | 5         | 11                | 4m32s|
          | 2025-12-14 | user-auth    | 3         | 7                 | 2m18s|

AC2: Given 用户选择 /flow-clarify --history --detail
     When 查看详细记录
     Then 显示每个问题的 Q&A 内容（不仅是摘要）

AC3: Given clarifications/ 目录为空
     When 运行 /flow-clarify --history
     Then 输出 "No clarification history found."
```

**Priority**: P3 (Medium - Future Enhancement)
**Complexity**: LOW（读取文件 + 表格输出）

---

### 边界案例处理

- **错误处理**:
  - research.md 不存在 → 提示 "Run /flow-init first."
  - research.md 包含 > 20 处歧义 → 警告 "High ambiguity detected. Consider refining research before clarification."
  - 11 维度扫描全部超时 → 错误 "Clarification scan failed. Check network or retry."

- **权限控制**:
  - /flow-clarify 不修改源码，仅读写 research/ 目录
  - 用户可通过 --dry-run 预览问题，不执行交互

- **数据验证**:
  - 用户答案验证：多选题必须在 A-E 范围内，短答题 ≤5 words
  - 时间戳格式：YYYYMMDD-HHMMSS（避免文件名冲突）

- **边界条件**:
  - research.md 无歧义 → 直接通过，不生成问题
  - 问题数 < 5 → 生成实际数量（如仅 2 个高优先级问题）

### 澄清标记示例

*本 PRD 基于完整研究材料（research.md 170 行 + research-summary.md 607 行），所有技术决策已在 Phase 0 明确，无 [NEEDS CLARIFICATION] 标记*

---

## 非功能性要求

### 性能要求

| 指标 | 目标值 | 关键性 |
|------|--------|--------|
| 11 维度并行扫描 (p95) | < 30 秒 | HIGH（roadmap 要求 < 5 min 总耗时） |
| 单个问题交互延迟 | < 2 秒（从输入到下一题） | MEDIUM（用户感知流畅度） |
| 澄清报告生成 | < 5 秒 | LOW（后台任务） |
| 并发用户数 | 10（CLI 本地执行，无并发需求） | LOW |

### 安全要求

- [ ] **身份验证**: 无需认证（本地 CLI 工具）
- [ ] **授权机制**: 文件系统权限（仅读写 devflow/ 目录）
- [ ] **数据加密**: 不涉及敏感数据（仅需求文档）
- [ ] **输入验证**: 用户答案验证（防止注入攻击）— 多选题限定 A-E，短答题限定 ≤5 words + 字母数字
- [ ] **审计日志**: 记录澄清时间戳、问题数、用户选择（in clarifications/ 报告）
- [ ] **密钥管理**: NO HARDCODED SECRETS（如需调用 LLM API，使用环境变量 CLAUDE_API_KEY）

### 可扩展性要求

- **水平扩展**: 不涉及（单用户 CLI 工具）
- **垂直扩展**: 支持 research.md 文件大小 ≤ 10MB（超过则警告）
- **维度扩展**: 11 维度硬编码，未来可通过配置文件扩展到 15+ 维度

### 可靠性要求

- **可用性目标**: 99.9%（CLI 工具无服务端依赖，除非 LLM API 宕机）
- **数据备份**: 每次澄清前备份 research.md → research.md.backup
- **灾难恢复**: 增量保存机制确保中断后可恢复（clarifications/ 持久化）
- **错误处理**:
  - API 超时 → 重试 3 次 → 降级到规则引擎（无 LLM）
  - 文件写入失败 → 提示手工保存答案到临时文件

### 可观测性要求

- **日志记录**:
  - 每次扫描记录到 EXECUTION_LOG.md（时间戳、维度数、问题数）
  - 错误日志输出到 stderr（如 API 调用失败）
- **监控指标**:
  - 平均澄清时间（记录到 clarifications/ 报告）
  - 歧义覆盖率（11 维度中有发现的数量）
- **告警设置**: 无（本地 CLI 工具）
- **追踪**: 每个问题记录维度来源（traceability 到扫描结果）

### 可访问性要求

- **无障碍标准**: CLI 工具支持屏幕阅读器（输出纯文本，无图形界面）
- **多语言支持**:
  - MVP: 中文优先（问题、推荐答案、报告均中文）
  - P1 Enhancement: 支持 --lang=en 标志（英文输出）
- **设备兼容性**:
  - macOS / Linux / Windows（WSL）
  - 最低要求：Node.js 18+, Bash 4.0+

---

## 技术约束

### 技术栈

- **语言/框架**:
  - Bash 脚本（主控制流，复用现有 .claude/scripts/ 基础设施）
  - Markdown（研究文档、澄清报告格式）
  - Claude Agent SDK（可选，用于高级 LLM 编排）
- **数据库**: 无（文件系统存储）
- **基础设施**: 本地文件系统（devflow/requirements/REQ-XXX/research/）
- **第三方服务**:
  - Claude API（Haiku + Sonnet-4.5，通过 @mcp 或直接 API 调用）
  - Context7 MCP Server（获取最佳实践文档，可选）

### 架构约束

- **必须使用**:
  - Workflow 模式（非纯 Agent）— 明确步骤序列 + 质量门禁
  - Orchestrator-Workers 架构 — 主命令委派给 clarify-analyst agent
  - Parallelization 模式 — 11 维度扫描并行执行（haiku 模型）
- **禁止使用**:
  - 纯 Agent 自由探索（无预定路径）
  - 同步顺序扫描（耗时 > 5 min 违反 roadmap 目标）
- **集成要求**:
  - /flow-prd 命令 Entry Gate 必须检查 clarifications/ 目录（可选通过）
  - orchestration_status.json 新增字段 `"clarify_complete": true`
- **数据格式**:
  - 输入：Markdown (research.md)
  - 输出：Markdown (clarifications/[timestamp].md)
  - 中间数据：JSON (扫描结果，内存临时存储)

### 平台约束

- **浏览器支持**: 不涉及（CLI 工具）
- **移动端支持**: 不涉及
- **操作系统**: macOS (primary), Linux (secondary), Windows WSL (tertiary)

### 资源约束

- **预算限制**:
  - LLM API 成本：haiku ($0.25/1M tokens) × 11 维度 × 平均 2K tokens = $0.0055 per clarification
  - 目标：< $0.01 per clarification（可接受）
- **时间限制**:
  - M1 Milestone (Q4-2025): 2 weeks（MVP 开发 + 测试）
  - M2 Milestone (Q1-2026): 1 week（P1/P2 Enhancement）
- **团队规模**: 1 developer (Claude + Human co-pilot)

---

## 成功指标

### 主要指标

| 指标 | 基线 | 目标 | 时间线 | 测量方法 |
|------|------|------|--------|----------|
| 平均澄清时间 | N/A（新功能） | < 5 分钟 | M1 发布后 2 周 | 分析 clarifications/ 报告中的 "Time Taken" 字段 |
| 歧义识别覆盖率 | 60%（人工检查基线） | ≥ 90% | M1 Pilot 阶段 | 对比人工审查结果与系统扫描结果（11 维度中至少 10 个有发现） |
| 用户满意度 | N/A | ≥ 4.5/5 | M1 发布后 1 个月 | 问卷调查："问题是否切中要害？"（5 分制） |

### 次要指标

| 指标 | 基线 | 目标 | 时间线 | 测量方法 |
|------|------|------|--------|----------|
| PRD 质量提升（主观） | N/A | ≥ 30% 用户认为"有显著改善" | M1 发布后 1 个月 | 问卷调查："澄清后的 PRD 是否更清晰？" |
| 返工率降低 | 40%（历史数据） | < 20% | M2 发布后 3 个月 | 统计开发阶段因需求不清导致的任务重做次数 |

---

## Constitution Check (宪法符合性检查)

*GATE: 必须在 Epic 规划前通过*

**Reference**: `.claude/constitution/project-constitution.md` (v2.0.0)

### Article I: Quality First (质量至上)

- [x] **I.1 - NO PARTIAL IMPLEMENTATION**: 需求定义完整且明确？无占位符和模糊表述？
  - ✅ 所有用户故事有明确验收标准（Given-When-Then）
  - ✅ 无 {{PLACEHOLDER}} 标记
  - ✅ 11 维度定义具体（基于 spec-kit + 学术研究）

- [x] **I.3 - No Simplification**: 避免"暂时简化，后续完善"的描述？
  - ✅ MVP (P1) 包含完整核心流程（扫描 → 问题 → 交互 → 报告）
  - ✅ P2/P3 明确标注为 Enhancement（非 MVP 必需）

- [x] 用户故事遵循 INVEST 准则（Independent, Negotiable, Valuable, Estimable, Small, Testable）？
  - ✅ Independent: Story 1 可独立测试（无需 Story 2-6）
  - ✅ Negotiable: 实现细节灵活（如并行扫描可用线程池或异步 API）
  - ✅ Valuable: 每个 Story 有明确用户价值（"So that..." 清晰）
  - ✅ Estimable: Story 1-4 = HIGH/MEDIUM 复杂度，可估算 2-3 天/story
  - ✅ Small: 每个 Story 可在 1 周内完成（符合迭代周期）
  - ✅ Testable: 所有 Story 有 "Independent Test" 标准

- [x] 验收标准具体、可测试、可衡量？
  - ✅ 使用 Given-When-Then 格式
  - ✅ 包含量化指标（如 "≤5 个问题"、"< 30 秒扫描时间"）

### Article X: Requirement Boundary (需求边界) - CRITICAL

- [x] **X.1 - Forced Clarification**: 所有不明确之处标记 `[NEEDS CLARIFICATION: 具体问题]`？
  - ✅ 本 PRD 基于 170 行 research.md + 607 行 research-summary.md
  - ✅ 11 个技术决策（R001-R011）已在 Phase 0 全部明确
  - ✅ 无 [NEEDS CLARIFICATION] 标记（研究充分）

- [x] **X.2 - No Speculative Features**: 无"可能需要"、"未来会"、"建议添加"的功能？
  - ✅ P2/P3 明确标注为 "Enhancement"（非推测，基于 roadmap）
  - ✅ 无 "可能需要支持 XX" 的表述

- [x] **X.3 - User Story Independence**: 每个故事有明确优先级（P1, P2, P3...）？
  - ✅ Story 1-4 = P1 (MVP Critical)
  - ✅ Story 5 = P2 (Post-MVP Enhancement)
  - ✅ Story 6 = P3 (Future Enhancement)

- [x] **X.3 - Independent Test**: 每个故事有独立测试标准？
  - ✅ 所有 Story 包含 "Independent Test" 章节
  - ✅ 测试可独立执行，无需依赖其他 Story

### Article II: Architectural Consistency (架构一致性)

- [x] **II.1 - NO CODE DUPLICATION**: 识别可复用的现有系统和组件？
  - ✅ 复用现有 common.sh 脚本库（log_event, check_file 等函数）
  - ✅ 复用现有 .claude/scripts/ 基础设施（generate-research-tasks.sh 模式）
  - ✅ 复用 orchestration_status.json 状态机制

- [x] **II.3 - Anti-Over-Engineering**: 解决方案适合问题规模？无过度设计？
  - ✅ 选择 Workflow（非纯 Agent）— 符合 Anthropic "right system" 原则
  - ✅ 使用 Bash 脚本（非 TypeSDK）— 复用现有基础设施，无需引入新技术栈
  - ✅ 11 维度硬编码（非配置化）— MVP 阶段优先简单实现

- [x] **II.4 - Single Responsibility**: 清晰的边界和职责划分？
  - ✅ 职责分离：
    - .claude/commands/flow-clarify.md（命令入口）
    - .claude/agents/clarify-analyst.md（主编排 agent）
    - .claude/scripts/run-clarify-scan.sh（11 维度扫描）
    - .claude/scripts/generate-clarification-report.sh（报告生成）
    - .claude/scripts/integrate-clarifications.sh（research.md 更新）

- [x] 模块化和可扩展性考虑合理？
  - ✅ 11 维度可通过配置文件扩展（P2 Enhancement）
  - ✅ 问题生成逻辑可替换（规则引擎 → LLM → 混合模式）

### Article III: Security First (安全优先)

- [x] **III.1 - NO HARDCODED SECRETS**: 定义了密钥管理策略（环境变量/密钥服务）？
  - ✅ Claude API Key 使用环境变量 `CLAUDE_API_KEY`
  - ✅ 脚本中禁止硬编码 API Key（违反则 constitution-guardian 拦截）

- [x] **III.2 - Input Validation**: 输入验证需求明确？
  - ✅ 用户答案验证：多选题限定 A-E，短答题限定 ≤5 words + 字母数字
  - ✅ 文件路径验证：仅允许写入 research/ 目录（防止路径遍历攻击）

- [x] **III.3 - Least Privilege**: 身份验证/授权机制清晰？
  - ✅ CLI 工具无需认证（本地执行）
  - ✅ 文件系统权限：仅读写 devflow/ 目录

- [x] **III.4 - Secure by Default**: 数据加密策略定义？
  - ✅ 不涉及敏感数据（仅需求文档）
  - ✅ clarifications/ 报告使用明文存储（无加密需求）

### Article IV: Performance Accountability (性能责任)

- [x] **IV.1 - NO RESOURCE LEAKS**: 考虑了资源管理（连接、文件句柄等）？
  - ✅ 并行扫描使用固定线程数（11 个）
  - ✅ API 调用设置超时（20 秒/维度）
  - ✅ 文件句柄显式关闭（Bash trap EXIT 机制）

- [x] **IV.2 - Algorithm Efficiency**: 性能目标现实且可测量？
  - ✅ 11 维度并行扫描 < 30 秒（基于 haiku 延迟 2-3 秒/请求）
  - ✅ 总澄清时间 < 5 分钟（符合 roadmap 目标）

- [x] **IV.4 - Caching Strategy**: 规划了监控和告警？
  - ✅ 记录每次澄清时间到 clarifications/ 报告
  - ✅ EXECUTION_LOG.md 记录扫描时长

### Article V: Maintainability (可维护性)

- [x] **V.1 - NO DEAD CODE**: 避免不必要的功能？仅实现明确需求？
  - ✅ P1 专注 MVP（扫描 → 问题 → 交互 → 报告）
  - ✅ P2/P3 基于 roadmap 明确需求（非推测功能）

- [x] **V.2 - Separation of Concerns**: 代码易于理解和修改？
  - ✅ 命令 / Agent / 脚本职责分离
  - ✅ 每个脚本 ≤ 200 行（符合 800 行文件规模限制）

- [x] **V.4 - File Size Limits**: 遵循单一职责原则？
  - ✅ 无单文件超过 800 行的设计
  - ✅ 脚本按功能拆分（scan / report / integrate）

### Constitutional Violations (宪法违规记录)

**重要**: 本 PRD 无宪法违规

---

## 依赖关系

### 上游依赖

*此需求实现前必须完成的依赖*

- ✅ /flow-init 命令已实现（REQ 目录初始化）
- ✅ research.md 5-level 质量检查脚本（validate-research.sh）
- ✅ orchestration_status.json 状态机制
- ✅ EXECUTION_LOG.md 日志机制
- ✅ common.sh 脚本库（log_event, check_file 等函数）

### 下游依赖

*依赖此需求的其他需求*

- /flow-prd 命令（Entry Gate 需检查 clarifications/ 目录，可选通过）
- planner agent（更清晰的 PRD 输入 → 更高质量的 TASKS.md 输出）

### 外部依赖

*第三方或外部系统依赖*

- Claude API（Haiku + Sonnet-4.5）— 需稳定网络连接
- Context7 MCP Server（可选，用于获取最佳实践文档）
- Bash 4.0+（macOS 自带 Bash 3.x，需手工安装 Bash 4）
- Node.js 18+（如使用 Claude Agent SDK）

---

## 风险评估与缓解

### 技术风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| LLM 歧义识别准确率低（< 80%） | M | H | 规则引擎 + LLM 混合模式（规则先行，LLM 补充） |
| 11 维度并行扫描超时（> 2 分钟） | M | M | 单维度超时设为 20 秒，失败后降级为 "SKIPPED" |
| API 成本超预期（> $0.01/clarification） | L | L | 使用 haiku 模型（成本优化），缓存常见问题模板 |

### 业务风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 用户抵触交互式澄清（认为"浪费时间"） | M | H | A/B 测试：对比有/无 clarify 的 PRD 质量，用数据说服 |
| 问题过于理论化（脱离实际需求） | M | M | 基于 spec-kit 验证模板，Pilot 阶段收集反馈迭代 |

### 进度风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 11 维度检测算法开发复杂度高 | H | M | 优先实现 3 个核心维度（Functional Scope, Data Model, Non-Functional Quality），其余维度 M2 补充 |
| 交互式 CLI 调试困难 | M | L | 使用 expect 库编写自动化测试脚本 |

---

## 范围界定

### 包含内容

- ✅ 11 维度歧义扫描算法（基于 spec-kit + 学术研究）
- ✅ 交互式澄清对话（Sequential + AI 推荐）
- ✅ 结构化澄清报告生成（Markdown 格式）
- ✅ 增量式保存机制（Prompt Chaining 模式）
- ✅ 与 /flow-prd 集成（Entry Gate 验证）
- ✅ 优先级排序算法（Impact × Uncertainty）
- ✅ 5 问题配额限制（硬性约束）

### 明确不包含

*明确列出不在此需求范围内的内容*

- ❌ 自动生成 PRD（仅澄清，不替代 prd-writer agent）
- ❌ 多轮澄清支持（MVP 仅支持单次澄清，不支持"再澄清一次"）
- ❌ 机器学习模型训练（使用现成 LLM API，不自研模型）
- ❌ 图形化界面（纯 CLI 工具，无 Web UI）
- ❌ 多用户协作（单用户本地执行）
- ❌ 版本控制集成（不自动提交 Git）

---

## 假设条件

*创建 PRD 时的关键假设*

- ✅ 用户已熟悉 CC-DevFlow 工作流（/flow-init → /flow-prd → /flow-epic）
- ✅ research.md 由 /flow-init 生成，格式规范（符合模板）
- ✅ 用户有稳定网络连接（调用 Claude API）
- ✅ 用户理解 11 维度分类法（或通过文档学习）
- ✅ 歧义识别召回率 ≥ 80% 可满足业务需求（基于 spec-kit 经验）
- ✅ 5 问题配额足够覆盖核心歧义（基于 roadmap 时间约束）

---

## 未决问题

*Epic 规划前需要回答的问题*

- [x] **Q1**: 11 维度扫描使用规则引擎还是纯 LLM？
  - **决策**: 混合模式（规则引擎优先，LLM 补充）
  - **理由**: 规则引擎可快速识别 TODO/PLACEHOLDER 等明显标记（高精度），LLM 识别语义歧义（如模糊形容词）
  - **决策人**: Claude (based on R010 研究)

- [x] **Q2**: 是否需要支持 --skip-clarify 标志（跳过澄清直接进入 /flow-prd）？
  - **决策**: 是（设计为可选命令）
  - **理由**: 符合 R011 决策（非强制澄清）
  - **决策人**: Claude (based on R011)

- [ ] **Q3**: Pilot 测试用户范围（内部团队 vs 外部开发者）？
  - **负责人**: Product Owner
  - **截止日期**: 2025-12-20（M1 开发启动前）

---

## 发布计划

### 里程碑

- **Phase 1 (M1 - MVP)**: Story 1-4（核心流程）— 2025-12-31
  - 11 维度扫描（并行执行）
  - 问题生成与优先级排序
  - 交互式澄清对话
  - 结构化报告生成
  - 集成到 /flow-prd Entry Gate

- **Phase 2 (M2 - Enhancement)**: Story 5-6（增强功能）— 2026-01-31
  - 自动更新 research.md
  - 澄清历史查询
  - 多语言支持（中英文）

- **Phase 3 (Post-M2 - Future)**: 待定 — 2026-Q2
  - 机器学习增强（学习用户偏好）
  - 多轮澄清支持
  - 自动回归验证

### 回滚计划

- **回滚触发条件**:
  - 歧义识别准确率 < 60%（严重低于预期）
  - 平均澄清时间 > 10 分钟（违反 roadmap 约束）
  - 用户满意度 < 3.0/5（负面反馈过多）

- **回滚步骤**:
  1. 禁用 /flow-clarify 命令（移除 .claude/commands/flow-clarify.md）
  2. 移除 /flow-prd Entry Gate 中的 clarifications/ 检查
  3. 通知用户："暂时禁用澄清功能，直接运行 /flow-prd"

- **数据处理**:
  - 保留已生成的 clarifications/ 报告（只读存档）
  - research.md 不回滚（已集成的澄清结论保留）

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

- [research.md](research/research.md) - 11 个技术决策（R001-R011）
- [research-summary.md](research/research-summary.md) - 完整研究总结（607 行）
- [codebase-overview.md](research/internal/codebase-overview.md) - 内部架构调研
- [claude-code-docs.md](research/mcp/20251215/official/claude-code-docs.md) - Claude Code 官方文档
- [claude-agent-sdk-docs.md](research/mcp/20251215/official/claude-agent-sdk-docs.md) - SDK API 参考
- [resources.md](research/mcp/20251215/guides/resources.md) - 学术论文索引
- [anthropic-building-effective-agents.md](research/mcp/20251215/tutorials/anthropic-building-effective-agents.md) - Anthropic 官方指南

### 参考资料

*外部参考和文档*

- [Spec-Kit Clarify Template](../../../spec-kit/templates/commands/clarify.md) - 质量左移最佳实践
- [Requirements Ambiguity Detection (IEEE Paper)](https://www.ipr.mdu.se/pdf_publications/7221.pdf) - 学术研究
- [Building Effective AI Agents (Anthropic)](https://www.anthropic.com/engineering/building-effective-agents) - 工作流模式指南
- [Agentic Workflows (AI-SDK)](https://ai-sdk.dev/docs/agents/workflows) - 架构模式参考

### 术语表

*定义领域特定术语*

- **歧义 (Ambiguity)**: 需求表述中的模糊性、不确定性或缺失信息
- **维度 (Dimension)**: 歧义检测的分类法（如功能范围、数据模型等 11 个类别）
- **质量左移 (Shift-Left Quality)**: 在开发流程早期（PRD 阶段）解决质量问题，降低后期返工成本
- **INVEST 原则**: 用户故事质量标准（Independent, Negotiable, Valuable, Estimable, Small, Testable）
- **Workflow 模式**: 预定代码路径编排，适合明确定义的任务（vs Agent 自由探索）
- **Orchestrator-Workers**: 中央编排器（主 agent）委派任务给专业工作器（子 agent）的架构模式
- **Prompt Chaining**: 顺序步骤，每步处理前一步输出的工作流模式
- **Parallelization**: 并行执行独立子任务的工作流模式
- **HITL (Human-in-the-Loop)**: 在 LLM 工作流中引入人工交互的模式

---

**Generated by**: prd-writer agent (manual execution, following template)
**Based on**: CC-DevFlow Constitution v2.0.0
**Template Version**: 2.0.0 (Self-Executable)
**Next Step**: Run `/flow-tech` to generate TECH_DESIGN.md, then `/flow-epic` to create EPIC.md and TASKS.md

---

## Validation Checklist (验证清单)

*GATE: PRD 标记为完成前检查*

### 需求不扩散验证 ⚠️ CRITICAL

- [x] **NO SPECULATION**: 所有功能都由用户明确提出或必需（基于 research.md 11 决策）
- [x] **ALL CLARIFIED**: 没有未解决的 [NEEDS CLARIFICATION] 标记（研究充分）
- [x] **NO TECH DETAILS**: 没有技术实现细节（API, 数据库, 框架等）— 仅在"技术约束"章节高层次提及
- [x] **STORY INDEPENDENCE**: 每个故事都有 Independent Test 标准（Story 1-6 全覆盖）
- [x] **PRIORITY ASSIGNED**: 所有故事都有明确优先级 (P1=Story 1-4, P2=Story 5, P3=Story 6)
- [x] **MVP IDENTIFIED**: P1 故事能够作为独立 MVP 交付（核心流程完整）

### 用户故事质量 (INVEST 原则)

- [x] **Independent**: 每个故事可独立交付和测试（Story 1 无需 Story 2 即可验证）
- [x] **Negotiable**: 细节可以讨论，实现方式灵活（如并行扫描可用多线程或异步 API）
- [x] **Valuable**: 有明确的用户/业务价值（"So that..." 清晰）
- [x] **Estimable**: 可以估算工作量（Story 1-4 = HIGH/MEDIUM，2-3 天/story）
- [x] **Small**: 可在一个迭代内完成（每个 Story ≤ 1 周）
- [x] **Testable**: 有明确的验收标准和测试方法（所有 Story 有 "Independent Test"）

### 验收标准质量

- [x] 使用 Given-When-Then 格式（所有 AC 符合）
- [x] 包含正常流程（Happy Path）— AC1-AC2 覆盖
- [x] 包含边界情况（Edge Cases）— AC3-AC5 覆盖
- [x] 包含错误场景（Error Handling）— Story 1 AC4 覆盖超时场景
- [x] 具体且可测试（非模糊描述）— 所有 AC 有量化指标
- [x] 每个故事至少 2 个验收标准（Story 1-4 均 ≥ 5 AC）

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
- [x] 安全要求符合 NO HARDCODED SECRETS（使用 CLAUDE_API_KEY 环境变量）
- [x] 质量要求符合 NO PARTIAL IMPLEMENTATION（MVP 包含完整核心流程）
- [x] 架构要求符合 NO OVER-ENGINEERING（选择 Workflow 模式，复用现有基础设施）
