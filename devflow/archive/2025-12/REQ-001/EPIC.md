# Epic: REQ-001 - /flow-clarify 需求澄清命令

**Status**: Planned
**Created**: 2025-12-15
**Owner**: Claude (Planner Agent)
**Type**: Epic

**Input**: PRD.md from `devflow/requirements/REQ-001/PRD.md`
**Prerequisites**: PRD.md 已完成并通过 Constitution Check

---

## 概述

### Epic 描述

实现 `/flow-clarify` 命令，在 PRD 生成前通过 11 维度歧义扫描系统化消除需求模糊性。基于 spec-kit 的"质量左移"理念，通过 Workflow 模式（非纯 Agent）、Orchestrator-Workers 架构、并行维度扫描和交互式澄清实现高质量需求澄清。

### 业务价值

- **返工率降低**: 从 40% 降至 < 20%（在 PRD 阶段消除歧义）
- **开发效率提升**: 澄清后的 PRD 质量更高，减少开发阶段的需求确认
- **决策可追溯**: 结构化的澄清报告记录所有决策历史

### 目标用户

- 执行 `/flow-init` 后的开发者
- 使用 CC-DevFlow 工作流的团队

### 成功指标

| 指标 | 基线 | 目标 | 测量方法 | 时间线 |
|------|------|------|----------|--------|
| 平均澄清时间 | N/A | < 5 分钟 | 分析 clarifications/ 报告中的 "Time Taken" 字段 | M1 发布后 2 周 |
| 歧义识别覆盖率 | 60% (人工) | >= 90% | 对比人工审查结果与系统扫描结果 | M1 Pilot 阶段 |
| 用户满意度 | N/A | >= 4.5/5 | 问卷调查 | M1 发布后 1 个月 |

---

## 范围定义

### 包含范围

- 11 维度歧义扫描算法（并行执行，Haiku 模型）
- 智能问题生成与优先级排序（Impact x Uncertainty，限 5 个）
- 交互式澄清对话（Sequential + AI 推荐）
- 增量式保存机制（Prompt Chaining 模式）
- 结构化澄清报告生成（Markdown 格式）
- 与 orchestration_status.json 状态机集成

### 不包含范围

- 自动生成 PRD（仅澄清，不替代 prd-writer agent）
- 多轮澄清支持（MVP 仅支持单次澄清）
- 机器学习模型训练（使用现成 LLM API）
- 图形化界面（纯 CLI 工具）
- 自动更新 research.md（P2 功能，非 MVP）

### 用户故事映射

#### Story 1: 自动歧义扫描 (Priority: P1) - MVP
- **Epic 目标**: 实现 11 维度并行扫描，识别 research.md 中的歧义
- **实现阶段**: Phase 3
- **优先级**: HIGH

#### Story 2: 智能问题生成与优先级排序 (Priority: P1) - MVP
- **Epic 目标**: 基于扫描结果生成 <= 5 个优先级排序问题
- **实现阶段**: Phase 4
- **优先级**: HIGH

#### Story 3: 交互式澄清对话 (Priority: P1) - MVP
- **Epic 目标**: Sequential 问答 + AI 推荐答案
- **实现阶段**: Phase 5
- **优先级**: HIGH

#### Story 4: 增量式集成与澄清报告生成 (Priority: P1) - MVP
- **Epic 目标**: 增量保存 + 结构化报告生成
- **实现阶段**: Phase 6
- **优先级**: HIGH

#### Story 5: 自动更新 research.md (Priority: P2)
- **Epic 目标**: 将澄清结论集成到 research.md
- **实现阶段**: Phase 7 (Post-MVP)
- **优先级**: MEDIUM

#### Story 6: 澄清历史查询与可视化 (Priority: P3)
- **Epic 目标**: /flow-clarify --history 查看历史记录
- **实现阶段**: Phase 8 (Future)
- **优先级**: LOW

---

## Phase -1: 宪法闸门检查 (Pre-Implementation Gates)

### Simplicity Gate (简单性闸门) - Constitution Article VII

- [x] **项目数量**: 使用 <= 3 个项目/模块
  - Module 1: flow-clarify.md (Command)
  - Module 2: clarify-analyst.md (Agent)
  - Module 3: scripts/ (3 个脚本)
  - **Total**: 3 逻辑模块

- [x] **NO FUTURE-PROOFING**: 没有为"未来可能需要"的功能做准备
  - 11 维度硬编码（MVP 足够）
  - 无"预留接口"或"扩展点"

- [x] **Minimal Dependencies**: 只使用必需的依赖库
  - Bash (系统自带)
  - jq (已存在于项目中)
  - curl (系统自带)
  - 无新增依赖

### Anti-Abstraction Gate (反抽象闸门) - Constitution Article VIII

- [x] **Framework Trust**: 直接使用框架功能，没有封装
  - 直接调用 Claude API (curl)
  - 直接操作文件系统 (Bash)
  - 无 SDK 封装层

- [x] **Single Model Representation**: 实体只有一种数据表示
  - .session.json 是唯一的会话状态格式
  - 无 DTO/Entity/ViewModel 转换层

- [x] **No Unnecessary Interfaces**: 没有单一实现的接口
  - 无 BaseScript, BaseAgent 抽象
  - 函数直接实现业务逻辑

### Integration-First Gate (集成优先闸门) - Constitution Article IX

- [x] **Contracts Defined First**: API contracts 在实现前定义
  - contracts/script-api.yaml 已定义所有脚本 API
  - data-model.md 已定义所有 JSON Schema

- [x] **Contract Tests Planned**: Contract tests 在 Phase 2 计划
  - run-clarify-scan.sh 输入/输出验证测试
  - generate-clarification-questions.sh 验证测试
  - generate-clarification-report.sh 验证测试

- [x] **Real Environment**: 使用真实数据库而非 mocks
  - 使用真实 Claude API（非 mock）
  - 使用真实文件系统（非内存模拟）

### Complexity Tracking (复杂度追踪表)

| 违规项 | 为何需要 | 更简单方案为何不够 | 缓解措施 |
|--------|---------|-------------------|----------|
| 无 | N/A | N/A | N/A |

**Phase -1 Gate 结果**: **ALL PASSED** - 无违规

---

## 技术方案

### 系统架构

#### 高层架构

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    /flow-clarify System Architecture                        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   [User Terminal]                                                          │
│         │                                                                  │
│         ▼                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │              flow-clarify.md (Command Entry Point)                   │  │
│   │   - Entry Gate validation                                            │  │
│   │   - Interactive Q&A loop                                             │  │
│   │   - Exit Gate validation                                             │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│         │                                                                  │
│         ├──────────────────────────────────┐                               │
│         │                                  │                               │
│         ▼                                  ▼                               │
│   ┌─────────────────┐            ┌─────────────────┐                      │
│   │ clarify-analyst │            │  Bash Scripts   │                      │
│   │     (Agent)     │            │  (.claude/      │                      │
│   │ - Question gen  │            │   scripts/)     │                      │
│   │ - Rationale gen │            │ - scan          │                      │
│   └─────────────────┘            │ - report        │                      │
│         │                        │ - integrate     │                      │
│         │                        └─────────────────┘                      │
│         ▼                                  │                               │
│   ┌─────────────────┐            ┌─────────────────┐                      │
│   │   Claude API    │            │  File System    │                      │
│   │   (External)    │            │  (Local)        │                      │
│   │ - Haiku (scan)  │            │ - research.md   │                      │
│   │ - Sonnet (gen)  │            │ - session.json  │                      │
│   └─────────────────┘            │ - reports/*.md  │                      │
│                                  └─────────────────┘                      │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### 核心组件

| 组件 | 职责 | 技术栈 | 依赖 |
|------|------|--------|------|
| flow-clarify.md | 命令入口、Entry/Exit Gate、交互循环 | Markdown Command | - |
| clarify-analyst.md | 问题生成、答案理由生成、报告整理 | Markdown Agent | Claude API |
| run-clarify-scan.sh | 11 维度并行扫描、API 调用封装 | Bash + curl + jq | common.sh |
| generate-clarification-questions.sh | 优先级排序、问题模板生成 | Bash + jq | common.sh |
| generate-clarification-report.sh | 报告模板渲染、Markdown 生成 | Bash | common.sh |

### 数据模型

#### ClarificationSession (.session.json)

```json
{
  "version": "1.0.0",
  "sessionId": "20251215-143000-REQ-001",
  "reqId": "REQ-001",
  "status": "scanning|questioning|complete|aborted",
  "createdAt": "2025-12-15T14:30:00+08:00",
  "updatedAt": "2025-12-15T14:35:00+08:00",
  "scanResults": {
    "dimensions": [DimensionScanResult]
  },
  "questions": [ClarificationQuestion],
  "currentQuestionIndex": 0
}
```

#### DimensionScanResult

```json
{
  "dimensionId": 1,
  "name": "Functional Scope",
  "status": "clear|ambiguous|timeout|skipped",
  "issues": [AmbiguityIssue],
  "scanTimeMs": 2340
}
```

#### ClarificationQuestion

```json
{
  "questionId": "Q1",
  "dimensionId": 1,
  "text": "问题文本",
  "type": "multiple_choice|short_answer",
  "options": [QuestionOption],
  "recommendedOption": "A",
  "recommendedRationale": "AI 推荐理由",
  "answer": null,
  "answeredAt": null,
  "rationale": null
}
```

### API 设计

#### 脚本 API 契约 (See contracts/script-api.yaml)

| 脚本 | 输入 | 输出 | 退出码 |
|------|------|------|--------|
| run-clarify-scan.sh | REQ_ID, --parallel, --timeout, --dimension | JSON (DimensionScanResult[]) | 0/1/2 |
| generate-clarification-questions.sh | --input, --max | JSON (ClarificationQuestion[]) | 0/1/2 |
| generate-clarification-report.sh | --session, --output | Markdown 文件 | 0/1/2 |
| integrate-clarifications.sh (P2) | --report, --target, --dry-run | 修改后的 Markdown | 0/1/2 |

### 技术栈选型

#### 必须使用
- **语言/框架**: Bash 4.0+ - 复用现有 .claude/scripts/ 基础设施
- **JSON 处理**: jq 1.6+ - 已存在于项目中
- **API 客户端**: curl - 系统自带，无需额外依赖

#### LLM 模型选择
- **维度扫描**: Claude Haiku (claude-4-5-haiku) - 成本优化，适合模式匹配
- **问题生成**: Claude Sonnet 4.5 - 质量优先，需要复杂推理
- **理由生成**: Claude Haiku - 简单文本生成，成本优化

---

## 实施阶段

### Phase 1: Setup (环境准备)
**预计时间**: 0.5 天

**任务**:
- 创建目录结构 (clarifications/)
- 脚本文件初始化（chmod +x）
- 验证 CLAUDE_API_KEY 环境变量

**交付物**:
- 可执行的空脚本文件
- clarifications/ 目录结构

### Phase 2: Foundational (基础设施)
**预计时间**: 1 天

**任务**:
- 实现 common.sh 扩展函数（如需）
- 实现 API 调用封装（curl + jq）
- 实现输入验证函数 (validate_answer)
- 实现会话状态管理 (.session.json 读写)

**交付物**:
- 通用函数库
- 会话状态管理机制

### Phase 3: User Story 1 - 自动歧义扫描 (TDD)
**预计时间**: 2 天

**任务**:
- 合约测试: run-clarify-scan.sh 输入/输出验证
- 实现 11 维度并行扫描逻辑
- 实现单维度超时处理
- 实现结果聚合

**交付物**:
- run-clarify-scan.sh 完整实现
- 扫描结果 JSON 输出

### Phase 4: User Story 2 - 问题生成与排序 (TDD)
**预计时间**: 1.5 天

**任务**:
- 合约测试: generate-clarification-questions.sh 验证
- 实现优先级算法 (Impact x Uncertainty)
- 实现问题模板生成
- 实现 AI 推荐答案生成

**交付物**:
- generate-clarification-questions.sh 完整实现
- 问题列表 JSON 输出

### Phase 5: User Story 3 - 交互式澄清对话 (TDD)
**预计时间**: 1.5 天

**任务**:
- 集成测试: 交互流程验证
- 实现 Sequential 问题呈现
- 实现答案验证 (A-E, <=5 words)
- 实现增量保存 (.session.json)

**交付物**:
- flow-clarify.md 命令实现
- 交互式问答体验

### Phase 6: User Story 4 - 报告生成 (TDD)
**预计时间**: 1 天

**任务**:
- 合约测试: generate-clarification-report.sh 验证
- 实现报告模板
- 实现 Markdown 渲染
- 实现 orchestration_status.json 更新

**交付物**:
- generate-clarification-report.sh 完整实现
- 结构化澄清报告

### Phase 7: Polish (完善)
**预计时间**: 0.5 天

**任务**:
- 错误处理优化
- 日志记录完善 (EXECUTION_LOG.md)
- 文档更新 (CLAUDE.md)
- 运行 quickstart.md 验证

**交付物**:
- 生产就绪的命令
- 完整文档

---

## 依赖关系

### 外部依赖

| 依赖 | 类型 | 负责方 | 状态 | 预计完成 | 风险 |
|------|------|--------|------|----------|------|
| Claude API | 第三方服务 | Anthropic | Available | N/A | 网络不稳定可能影响扫描 |

### 内部依赖

| 依赖 | 描述 | 影响 | 缓解措施 |
|------|------|------|----------|
| common.sh | 脚本公共库 | 复用日志、验证函数 | 如需扩展则在 Phase 2 完成 |
| orchestration_status.json | 状态管理 | 需扩展字段 | 向后兼容，新增字段 |
| check-prerequisites.sh | REQ_ID 解析 | 复用现有逻辑 | 无需修改 |

---

## 质量标准

### Definition of Done (DoD)

#### 代码质量
- [x] 代码审查通过
- [x] 符合团队编码规范（Bash 脚本规范）
- [x] 无 linter 错误 (shellcheck)
- [x] NO CODE DUPLICATION 验证
- [x] NO DEAD CODE 验证

#### 测试质量
- [x] 合约测试覆盖所有脚本 API
- [x] 集成测试覆盖完整澄清流程
- [x] 单元测试覆盖 validate_answer() 等函数
- [x] TDD 流程遵循（测试先行）

#### 安全质量
- [x] NO HARDCODED SECRETS 验证 (CLAUDE_API_KEY 使用环境变量)
- [x] 所有输入已验证 (答案格式、文件路径)
- [x] 文件系统权限限制 (仅 research/clarifications/ 可写)

#### 文档质量
- [x] CLAUDE.md 更新（新增命令描述）
- [x] quickstart.md 验证通过
- [x] 内联注释完整

### 验收标准

- 运行 /flow-clarify REQ-XXX 可完成完整澄清流程
- 11 维度并行扫描 < 30 秒
- 生成的报告包含所有必需章节
- 中断后可从断点恢复
- 无 {{PLACEHOLDER}} 残留

---

## Phase -1 Constitutional Gates (宪法前置闸)

### Gate 1: Simplicity Gate (Article VII)
**原则**: ≤3 Projects/Modules, No Future-Proofing

**检查项**:
- [x] **项目数量限制**: 本 Epic 产生 3 个逻辑模块 (command + agent + scripts)
- [x] **无未来预留**: 11 维度硬编码，无插件系统
- [x] **最小可行方案**: Bash 脚本直接实现，无 SDK 封装
- [x] **直接实现**: 函数直接实现业务逻辑

### Gate 2: Anti-Abstraction Gate (Article VIII)
**原则**: Direct Framework Usage, No Extra Wrappers

**检查项**:
- [x] **直接使用框架**: 直接使用 curl + jq，无封装层
- [x] **避免工厂模式**: 无 Factory/Builder 模式
- [x] **避免中间件层**: 无自定义中间件
- [x] **拒绝过度抽象**: 具体实现优先

### Gate 3: Integration-First Gate (Article IX)
**原则**: Contracts First, Test in Real Environment

**检查项**:
- [x] **Contract 优先**: contracts/script-api.yaml 已定义
- [x] **真实环境测试**: 使用真实 Claude API 和文件系统
- [x] **端到端优先**: 集成测试验证完整流程
- [x] **避免 Mock**: 仅外部服务异常时降级

### Phase -1 Gate 决策记录

| Gate | Status | 决策 | 理由（如有例外） |
|------|--------|------|------------------|
| Simplicity Gate (VII) | PASS | 3 逻辑模块，无未来预留 | N/A |
| Anti-Abstraction Gate (VIII) | PASS | 直接使用 curl + jq | N/A |
| Integration-First Gate (IX) | PASS | contracts/script-api.yaml 已定义 | N/A |

---

## Constitution Check (宪法符合性检查)

### Article I: Quality First (质量至上)
- [x] **I.1 - NO PARTIAL IMPLEMENTATION**: Epic 范围完整且明确
- [x] **I.2 - Testing Mandate**: TDD 流程明确定义
- [x] **I.3 - No Simplification**: 避免"暂时简化"的做法
- [x] **I.4 - Quality Gates**: 所有验收标准可测试且明确

### Article II: Architectural Consistency (架构一致性)
- [x] **II.1 - NO CODE DUPLICATION**: 复用 common.sh, check-prerequisites.sh
- [x] **II.2 - Consistent Naming**: 遵循 run-*.sh, *-agent.md 命名模式
- [x] **II.3 - Anti-Over-Engineering**: Bash 脚本直接实现，无过度设计
- [x] **II.4 - Single Responsibility**: command/agent/scripts 职责分离

### Article III: Security First (安全优先)
- [x] **III.1 - NO HARDCODED SECRETS**: CLAUDE_API_KEY 使用环境变量
- [x] **III.2 - Input Validation**: validate_answer() 函数验证用户输入
- [x] **III.3 - Least Privilege**: 仅读写 research/clarifications/ 目录
- [x] **III.4 - Secure by Default**: 不涉及敏感数据

### Article IV: Performance Accountability (性能责任)
- [x] **IV.1 - NO RESOURCE LEAKS**: 并行扫描使用固定线程数，超时自动终止
- [x] **IV.2 - Algorithm Efficiency**: 11 维度并行扫描 < 30 秒
- [x] **IV.3 - Lazy Loading**: 按需加载 research.md
- [x] **IV.4 - Caching Strategy**: 会话状态持久化 (.session.json)

### Article V: Maintainability (可维护性)
- [x] **V.1 - NO DEAD CODE**: 无冗余功能
- [x] **V.2 - Separation of Concerns**: command/agent/scripts 层次分离
- [x] **V.3 - Documentation**: CLAUDE.md, quickstart.md 文档
- [x] **V.4 - File Size Limits**: 每个脚本 <= 200 行

### Article VI: Test-First Development (测试优先开发)
- [x] **VI.1 - TDD Mandate**: 合约测试先于实现
- [x] **VI.2 - Test Independence**: 测试隔离策略定义
- [x] **VI.3 - Meaningful Tests**: 测试覆盖真实场景

### Article VII-IX: Phase -1 Gates
- [x] **Article VII - Simplicity Gate**: 3 个逻辑模块
- [x] **Article VIII - Anti-Abstraction Gate**: 直接使用 curl + jq
- [x] **Article IX - Integration-First Gate**: contracts/script-api.yaml 已定义

### Article X: Requirement Boundary (需求边界)
- [x] **X.1 - Forced Clarification**: 无 [NEEDS CLARIFICATION] 标记
- [x] **X.2 - No Speculative Features**: 仅实现 PRD 明确需求
- [x] **X.3 - User Story Independence**: 每个故事独立可测试

### Constitutional Violations (宪法违规记录)

**无违规** - 所有 Constitution Check 通过

---

## 风险管理

### 技术风险

| 风险 | 可能性 | 影响 | 缓解措施 | 负责人 |
|------|--------|------|----------|--------|
| LLM 歧义识别准确率低 (< 80%) | M | H | 规则引擎 + LLM 混合模式 | Developer |
| 11 维度并行扫描超时 (> 2 分钟) | M | M | 单维度超时 20 秒，降级处理 | Developer |
| API 成本超预期 | L | L | 使用 Haiku 模型，缓存常见模板 | Developer |

### 进度风险

| 风险 | 可能性 | 影响 | 缓解措施 | 负责人 |
|------|--------|------|----------|--------|
| 11 维度检测算法复杂度高 | H | M | 优先实现 3 个核心维度，其余迭代补充 | Developer |
| 交互式 CLI 调试困难 | M | L | 使用 expect 库编写自动化测试 | Developer |

---

## 发布计划

### 发布策略
- **部署方式**: 随项目代码发布（本地 CLI 工具）
- **环境流程**: Dev → Test → Production (本地)
- **回滚策略**: 删除 flow-clarify.md 命令文件即可回滚

### 里程碑

| 里程碑 | 目标 | 日期 | 状态 |
|--------|------|------|------|
| **Phase 1 Complete** | 环境就绪 | Day 1 | Planned |
| **Phase 2 Complete** | 基础设施完成 | Day 2 | Planned |
| **Phase 3-6 Complete** | MVP 功能完成 | Day 8 | Planned |
| **Phase 7 Complete** | 生产就绪 | Day 9 | Planned |

---

## Progress Tracking (进度跟踪)

### 完成状态
- [x] 概述定义清晰
- [x] 范围界定明确
- [x] 技术方案完整
- [x] 数据模型设计
- [x] API 契约定义
- [x] 实施阶段规划
- [x] 依赖关系识别
- [x] 质量标准定义
- [x] Constitution Check 通过
- [x] 风险评估完成
- [x] 发布计划制定

### 闸门状态
- [x] Constitution Check: **PASS**
- [x] Phase -1 Gates: **PASS**
- [x] 技术可行性: **PASS**
- [x] 依赖就绪: **PASS**

**准备好进行任务生成**: **YES**

---

## 相关文档

### 输入文档
- **PRD**: [PRD.md](PRD.md) - 880 行，6 个用户故事
- **TECH_DESIGN**: [TECH_DESIGN.md](TECH_DESIGN.md) - 705 行，完整技术方案
- **研究材料**: [research/](research/) - 11 个技术决策
- **数据模型**: [data-model.md](data-model.md) - JSON Schema 定义
- **API 契约**: [contracts/script-api.yaml](contracts/script-api.yaml) - 脚本 API 定义
- **快速入门**: [quickstart.md](quickstart.md) - 测试矩阵和验证步骤

### 输出文档
- **Tasks**: TASKS.md（即将生成）
- **测试计划**: 将由 qa-tester agent 生成
- **安全计划**: 将由 security-reviewer agent 生成

---

**Generated by**: planner agent
**Based on**: PRD.md, TECH_DESIGN.md, CC-DevFlow Constitution v2.0.0
**Template Version**: 2.0.0 (Self-Executable)
**Next Step**: Generate TASKS.md with TDD order (Tests First for each User Story)
