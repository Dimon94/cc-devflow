# PRD: {{REQ_ID}} - {{TITLE}}

**Status**: Draft
**Created**: {{DATE}}
**Owner**: {{OWNER}}
**Type**: Requirement

**Input**: 用户需求描述、研究材料 from `devflow/requirements/{{REQ_ID}}/research/`
**Prerequisites**: 需求 ID 已创建，初始需求信息已提供

## Execution Flow (PRD 生成流程)
```
1. Load context and research materials
   → Check for research/ directory
   → Extract key insights from research materials
   → Load user-provided requirement description
   → If insufficient context: Ask clarifying questions

2. Analyze requirements using INVEST criteria
   → Break down into Independent user stories
   → Ensure stories are Negotiable in details
   → Verify each story has clear Value
   → Make stories Estimable (size appropriate)
   → Keep stories Small (completable in iteration)
   → Ensure stories are Testable

3. Generate user stories with acceptance criteria
   → For each story: As a... I want... So that...
   → For each story: Write Given-When-Then criteria
   → Include happy path scenarios
   → Include edge cases and error scenarios
   → Mark priority (HIGH/MEDIUM/LOW)

4. Define non-functional requirements
   → Performance targets (response time, throughput)
   → Security requirements (auth, encryption, validation)
   → Scalability requirements
   → Reliability requirements (uptime, backup)

5. Identify technical constraints
   → Technology stack requirements
   → Integration constraints
   → Platform constraints (browser, mobile, OS)
   → Resource constraints (budget, timeline, team)

6. Define success metrics
   → Primary metrics with baseline and targets
   → Secondary metrics
   → Measurement methods
   → Timeline for achievement

7. Constitution Check (验证 Article I, III, X)
   → Article I - Quality First: Requirements complete? No partial specs?
   → Article X - Requirement Boundary: No speculative features? All unclear marked?
   → Article III - Security First: Secret management defined? No hardcoded secrets?
   → Document any violations with justification

8. Validate completeness
   → All user stories have acceptance criteria?
   → All NFRs specified with targets?
   → Success metrics defined?
   → Dependencies identified?
   → Risks assessed?
   → If incomplete: ERROR "Complete missing sections"

9. Return: SUCCESS (PRD ready for Epic planning)
```

**重要**: 这是一个自执行模板。prd-writer agent 应该按照 Execution Flow 生成完整的 PRD.md 文件。

---

## Delta Mapping (规范变更草案)

请列出此需求引入的规范变更，用于生成 `devflow/changes/<change-id>/specs/` 草稿以及后续的 Delta 校验。**Operation** 取值限定为 `ADDED`、`MODIFIED`、`REMOVED`、`RENAMED`。若为重命名，请使用 `旧名称 -> 新名称` 的格式。

| Capability | Operation | Requirement | Summary |
| ---------- | --------- | ----------- | ------- |
| Auth | ADDED | Session Audit Trail | 记录会话审计日志（含用户、过期时间） |
| Auth | MODIFIED | Session Enforcement | 更新过期策略，默认 30 分钟无操作失效 |
| Billing | REMOVED | Legacy Discount Flow | 删除旧折扣流程，统一走新优惠体系 |
| Reports | RENAMED | Legacy Report -> Compliance Report | 对齐合规术语 |

> ⚠️ 所有行都必须填写完整。若暂未识别变更，请写 `_TBD_` 并在 /flow-epic 阶段补全，否则无法生成 Delta 模板。

---

## 背景与目标

### 业务背景
{{BUSINESS_CONTEXT}}

### 问题陈述
{{PROBLEM_STATEMENT}}

### 目标
- **主要目标**: {{PRIMARY_GOAL}}
- **成功指标**: {{SUCCESS_METRICS_HIGH_LEVEL}}
- **影响范围**: {{SCOPE}}

---

## 用户故事与验收标准

<!--
  ======================================================================
  CRITICAL ANTI-EXPANSION RULES (需求不扩散关键规则)
  ======================================================================

  1. **强制澄清机制 (MANDATORY CLARIFICATION)**
     - ✅ 使用 [NEEDS CLARIFICATION: 具体问题] 标记所有不明确的地方
     - ❌ 禁止猜测或假设用户未明确说明的功能
     - 示例: [NEEDS CLARIFICATION: 认证方式未指定 - email/password, SSO, OAuth?]

  2. **用户故事优先级与独立性 (STORY PRIORITY & INDEPENDENCE)**
     - ✅ 每个故事必须有明确优先级 (P1, P2, P3...)
     - ✅ 每个故事必须独立可测试 (Independent Test标准)
     - ✅ 每个故事必须能作为独立 MVP 交付
     - ❌ 禁止添加用户未提及的"可能需要"功能

  3. **禁止技术细节 (NO IMPLEMENTATION DETAILS)**
     - ✅ 专注于 WHAT (用户需要什么) 和 WHY (为什么需要)
     - ❌ 禁止描述 HOW (技术栈、API、代码结构)
     - 示例: ✅ "用户能够重置密码" ❌ "使用 JWT token 实现密码重置"

  4. **禁止推测性功能 (NO SPECULATIVE FEATURES)**
     - ❌ 禁止 "可能需要"、"未来会"、"建议添加" 的功能
     - ✅ 只包含用户明确提出或必需的功能
     - ✅ 所有功能必须映射到用户故事

  ======================================================================
-->

### Story 1: {{STORY_TITLE_1}} (Priority: P1) 🎯 MVP

**As a** {{USER_ROLE}}
**I want** {{CAPABILITY}}
**So that** {{BENEFIT}}

**Why this priority**: {{REASON_FOR_P1_PRIORITY}}

**Independent Test**: {{HOW_TO_TEST_INDEPENDENTLY}}
<!-- 示例: "用户能够注册并登录，此时系统可交付为最小可用产品" -->

**Acceptance Criteria**:
```gherkin
AC1: Given {{PRECONDITION}}
     When {{ACTION}}
     Then {{EXPECTED_RESULT}}

AC2: Given {{PRECONDITION}}
     When {{ACTION}}
     Then {{EXPECTED_RESULT}}

AC3: Given {{ERROR_CONDITION}}
     When {{ACTION}}
     Then {{ERROR_HANDLING}}
```

**Priority**: P1 (Highest - MVP Critical)
**Complexity**: {{HIGH|MEDIUM|LOW}}

---

### Story 2: {{STORY_TITLE_2}} (Priority: P2)

**As a** {{USER_ROLE}}
**I want** {{CAPABILITY}}
**So that** {{BENEFIT}}

**Why this priority**: {{REASON_FOR_P2_PRIORITY}}

**Independent Test**: {{HOW_TO_TEST_INDEPENDENTLY}}
<!-- 示例: "用户能够创建和查看个人资料，独立于其他故事功能" -->

**Acceptance Criteria**:
```gherkin
AC1: Given {{PRECONDITION}}
     When {{ACTION}}
     Then {{EXPECTED_RESULT}}

AC2: Given {{PRECONDITION}}
     When {{ACTION}}
     Then {{EXPECTED_RESULT}}
```

**Priority**: P2 (High)
**Complexity**: {{HIGH|MEDIUM|LOW}}

---

### Story 3: {{STORY_TITLE_3}} (Priority: P3)

**As a** {{USER_ROLE}}
**I want** {{CAPABILITY}}
**So that** {{BENEFIT}}

**Why this priority**: {{REASON_FOR_P3_PRIORITY}}

**Independent Test**: {{HOW_TO_TEST_INDEPENDENTLY}}

**Acceptance Criteria**:
```gherkin
AC1: Given {{PRECONDITION}}
     When {{ACTION}}
     Then {{EXPECTED_RESULT}}
```

**Priority**: P3 (Medium)
**Complexity**: {{HIGH|MEDIUM|LOW}}

---

### 边界案例处理
- **错误处理**: {{ERROR_HANDLING_REQUIREMENTS}}
- **权限控制**: {{PERMISSION_REQUIREMENTS}}
- **数据验证**: {{VALIDATION_REQUIREMENTS}}
- **边界条件**: {{EDGE_CASES}}

### 澄清标记示例
*使用 [NEEDS CLARIFICATION] 标记所有不明确的需求*

**功能需求澄清示例**:
- 用户认证方式: [NEEDS CLARIFICATION: 认证方式未指定 - email/password, SSO, OAuth, 还是多种方式?]
- 数据保留期限: [NEEDS CLARIFICATION: 用户数据保留时长未指定 - 永久, 1年, 还是可配置?]
- 并发处理: [NEEDS CLARIFICATION: 同一用户多设备登录策略未指定 - 允许并发还是踢出旧会话?]

**非功能需求澄清示例**:
- 性能目标: [NEEDS CLARIFICATION: 响应时间目标未指定 - <100ms, <500ms, 还是其他?]
- 用户规模: [NEEDS CLARIFICATION: 预期用户量级未指定 - 百人, 千人, 还是万人级?]
- 可用性要求: [NEEDS CLARIFICATION: 服务可用性目标未指定 - 99%, 99.9%, 还是99.99%?]

**⚠️ 重要**: 所有 [NEEDS CLARIFICATION] 标记必须在 Epic 规划前解决

---

## 非功能性要求

### 性能要求
| 指标 | 目标值 | 关键性 |
|------|--------|--------|
| 响应时间 (p95) | {{RESPONSE_TIME}} | {{HIGH|MEDIUM|LOW}} |
| 吞吐量 | {{THROUGHPUT}} | {{HIGH|MEDIUM|LOW}} |
| 并发用户数 | {{CONCURRENT_USERS}} | {{HIGH|MEDIUM|LOW}} |
| 数据处理量 | {{DATA_VOLUME}} | {{HIGH|MEDIUM|LOW}} |

### 安全要求
- [ ] **身份验证**: {{AUTH_METHOD}}
- [ ] **授权机制**: {{AUTHZ_METHOD}}
- [ ] **数据加密**: {{ENCRYPTION_REQUIREMENTS}}
- [ ] **输入验证**: 所有用户输入必须验证和清理
- [ ] **审计日志**: {{AUDIT_REQUIREMENTS}}
- [ ] **密钥管理**: NO HARDCODED SECRETS - 使用环境变量或密钥管理系统

### 可扩展性要求
- **水平扩展**: {{HORIZONTAL_SCALING}}
- **垂直扩展**: {{VERTICAL_SCALING}}
- **数据库扩展**: {{DB_SCALING}}

### 可靠性要求
- **可用性目标**: {{UPTIME_TARGET}}
- **数据备份**: {{BACKUP_STRATEGY}}
- **灾难恢复**: {{DR_STRATEGY}}
- **错误处理**: {{ERROR_HANDLING_STRATEGY}}

### 可观测性要求
- **日志记录**: {{LOGGING_REQUIREMENTS}}
- **监控指标**: {{MONITORING_METRICS}}
- **告警设置**: {{ALERTING_RULES}}
- **追踪**: {{TRACING_REQUIREMENTS}}

### 可访问性要求
- **无障碍标准**: {{ACCESSIBILITY_STANDARDS}}
- **多语言支持**: {{I18N_REQUIREMENTS}}
- **设备兼容性**: {{DEVICE_COMPATIBILITY}}

---

## 技术约束

### 技术栈
- **语言/框架**: {{LANGUAGE_FRAMEWORK}}
- **数据库**: {{DATABASE}}
- **基础设施**: {{INFRASTRUCTURE}}
- **第三方服务**: {{THIRD_PARTY_SERVICES}}

### 架构约束
- **必须使用**: {{REQUIRED_TECH}}
- **禁止使用**: {{FORBIDDEN_TECH}}
- **集成要求**: {{INTEGRATION_REQUIREMENTS}}
- **数据格式**: {{DATA_FORMAT_REQUIREMENTS}}

### 平台约束
- **浏览器支持**: {{BROWSER_SUPPORT}}
- **移动端支持**: {{MOBILE_SUPPORT}}
- **操作系统**: {{OS_SUPPORT}}

### 资源约束
- **预算限制**: {{BUDGET}}
- **时间限制**: {{TIMELINE}}
- **团队规模**: {{TEAM_SIZE}}

---

## 成功指标

### 主要指标
| 指标 | 基线 | 目标 | 时间线 | 测量方法 |
|------|------|------|--------|----------|
| {{METRIC_1}} | {{BASELINE}} | {{TARGET}} | {{TIMELINE}} | {{METHOD}} |
| {{METRIC_2}} | {{BASELINE}} | {{TARGET}} | {{TIMELINE}} | {{METHOD}} |
| {{METRIC_3}} | {{BASELINE}} | {{TARGET}} | {{TIMELINE}} | {{METHOD}} |

### 次要指标
| 指标 | 基线 | 目标 | 时间线 | 测量方法 |
|------|------|------|--------|----------|
| {{METRIC_4}} | {{BASELINE}} | {{TARGET}} | {{TIMELINE}} | {{METHOD}} |

---

## Constitution Check (宪法符合性检查)

*GATE: 必须在 Epic 规划前通过*

**Reference**: `.claude/constitution/project-constitution.md` (v2.0.0)

### Article I: Quality First (质量至上)
- [ ] **I.1 - NO PARTIAL IMPLEMENTATION**: 需求定义完整且明确？无占位符和模糊表述？
- [ ] **I.3 - No Simplification**: 避免"暂时简化，后续完善"的描述？
- [ ] 用户故事遵循 INVEST 准则（Independent, Negotiable, Valuable, Estimable, Small, Testable）？
- [ ] 验收标准具体、可测试、可衡量？

### Article X: Requirement Boundary (需求边界) - CRITICAL
- [ ] **X.1 - Forced Clarification**: 所有不明确之处标记 `[NEEDS CLARIFICATION: 具体问题]`？
- [ ] **X.2 - No Speculative Features**: 无"可能需要"、"未来会"、"建议添加"的功能？
- [ ] **X.3 - User Story Independence**: 每个故事有明确优先级（P1, P2, P3...）？
- [ ] **X.3 - Independent Test**: 每个故事有独立测试标准？

### Article II: Architectural Consistency (架构一致性)
- [ ] **II.1 - NO CODE DUPLICATION**: 识别可复用的现有系统和组件？
- [ ] **II.3 - Anti-Over-Engineering**: 解决方案适合问题规模？无过度设计？
- [ ] **II.4 - Single Responsibility**: 清晰的边界和职责划分？
- [ ] 模块化和可扩展性考虑合理？

### Article III: Security First (安全优先)
- [ ] **III.1 - NO HARDCODED SECRETS**: 定义了密钥管理策略（环境变量/密钥服务）？
- [ ] **III.2 - Input Validation**: 输入验证需求明确？
- [ ] **III.3 - Least Privilege**: 身份验证/授权机制清晰？
- [ ] **III.4 - Secure by Default**: 数据加密策略定义？

### Article IV: Performance Accountability (性能责任)
- [ ] **IV.1 - NO RESOURCE LEAKS**: 考虑了资源管理（连接、文件句柄等）？
- [ ] **IV.2 - Algorithm Efficiency**: 性能目标现实且可测量？
- [ ] **IV.4 - Caching Strategy**: 规划了监控和告警？

### Article V: Maintainability (可维护性)
- [ ] **V.1 - NO DEAD CODE**: 避免不必要的功能？仅实现明确需求？
- [ ] **V.2 - Separation of Concerns**: 代码易于理解和修改？
- [ ] **V.4 - File Size Limits**: 遵循单一职责原则？

### Constitutional Violations (宪法违规记录)
*仅在有需要说明的宪法违规时填写*

**重要**: 任何违规都必须有充分理由，否则 PRD 不通过

| 违规的 Article | 具体违规内容 | 为何需要 | 如何缓解 |
|----------------|-------------|----------|----------|
| {{ARTICLE_NUM}} | {{VIOLATION_DETAIL}} | {{JUSTIFICATION}} | {{MITIGATION}} |

**示例**:
| 违规的 Article | 具体违规内容 | 为何需要 | 如何缓解 |
|----------------|-------------|----------|----------|
| Article X.2 | 包含"未来可能支持移动端"的描述 | 产品规划需要体现长期愿景 | 移至"未来展望"章节，不纳入当前需求范围 |

---

## 依赖关系

### 上游依赖
*此需求实现前必须完成的依赖*
- {{UPSTREAM_DEPENDENCY_1}}
- {{UPSTREAM_DEPENDENCY_2}}

### 下游依赖
*依赖此需求的其他需求*
- {{DOWNSTREAM_DEPENDENCY_1}}
- {{DOWNSTREAM_DEPENDENCY_2}}

### 外部依赖
*第三方或外部系统依赖*
- {{EXTERNAL_DEPENDENCY_1}}
- {{EXTERNAL_DEPENDENCY_2}}

---

## 风险评估与缓解

### 技术风险
| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| {{TECH_RISK_1}} | {{L/M/H}} | {{L/M/H}} | {{MITIGATION}} |
| {{TECH_RISK_2}} | {{L/M/H}} | {{L/M/H}} | {{MITIGATION}} |

### 业务风险
| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| {{BIZ_RISK_1}} | {{L/M/H}} | {{L/M/H}} | {{MITIGATION}} |

### 进度风险
| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| {{SCHEDULE_RISK_1}} | {{L/M/H}} | {{L/M/H}} | {{MITIGATION}} |

---

## 范围界定

### 包含内容
- {{IN_SCOPE_1}}
- {{IN_SCOPE_2}}
- {{IN_SCOPE_3}}

### 明确不包含
*明确列出不在此需求范围内的内容*
- {{OUT_OF_SCOPE_1}}
- {{OUT_OF_SCOPE_2}}
- {{OUT_OF_SCOPE_3}}

---

## 假设条件

*创建 PRD 时的关键假设*
- {{ASSUMPTION_1}}
- {{ASSUMPTION_2}}
- {{ASSUMPTION_3}}

---

## 未决问题

*Epic 规划前需要回答的问题*
- [ ] **Q1**: {{QUESTION_1}}
  - 负责人: {{OWNER}}
  - 截止日期: {{DEADLINE}}

- [ ] **Q2**: {{QUESTION_2}}
  - 负责人: {{OWNER}}
  - 截止日期: {{DEADLINE}}

---

## 发布计划

### 里程碑
- **Phase 1**: {{PHASE_1_DELIVERABLES}} - {{PHASE_1_DATE}}
- **Phase 2**: {{PHASE_2_DELIVERABLES}} - {{PHASE_2_DATE}}
- **Phase 3**: {{PHASE_3_DELIVERABLES}} - {{PHASE_3_DATE}}

### 回滚计划
- **回滚触发条件**: {{ROLLBACK_CONDITIONS}}
- **回滚步骤**: {{ROLLBACK_STEPS}}
- **数据处理**: {{DATA_ROLLBACK_STRATEGY}}

---

## Progress Tracking (进度跟踪)

*在 PRD 创建过程中更新*

### 完成状态
- [ ] 背景与目标明确
- [ ] 用户故事定义（INVEST 合规）
- [ ] 验收标准编写（Given-When-Then）
- [ ] 功能需求文档化
- [ ] 非功能需求规定
- [ ] 技术约束识别
- [ ] 成功指标定义
- [ ] Constitution Check 通过
- [ ] 依赖关系映射
- [ ] 风险评估完成
- [ ] 范围明确界定
- [ ] 未决问题跟踪

### 质量检查
- [ ] 所有用户故事有验收标准
- [ ] 所有 NFR 有量化目标
- [ ] 性能目标可测量
- [ ] 安全要求完整
- [ ] 无模糊需求
- [ ] 所有缩写已定义

### 闸门状态
- [ ] Constitution Check: {{PASS|FAIL}}
- [ ] 完整性验证: {{PASS|FAIL}}
- [ ] 质量检查: {{PASS|FAIL}}

**准备好进行 Epic 规划**: {{YES|NO}}

---

## 附录

### 研究材料
*链接到研究文档*
- [Research 1](research/{{REQ_ID}}_1.md)
- [Research 2](research/{{REQ_ID}}_2.md)

### 参考资料
*外部参考和文档*
- {{REFERENCE_1}}
- {{REFERENCE_2}}

### 术语表
*定义领域特定术语*
- **{{TERM_1}}**: {{DEFINITION}}
- **{{TERM_2}}**: {{DEFINITION}}

---

**Generated by**: prd-writer agent
**Based on**: CC-DevFlow Constitution v2.0.0
**Template Version**: 2.0.0 (Self-Executable)
**Next Step**: Run planner agent to generate EPIC.md and TASKS.md

---

## Validation Checklist (验证清单)

*GATE: PRD 标记为完成前检查*

### 需求不扩散验证 ⚠️ CRITICAL
- [ ] **NO SPECULATION**: 所有功能都由用户明确提出或必需
- [ ] **ALL CLARIFIED**: 没有未解决的 [NEEDS CLARIFICATION] 标记
- [ ] **NO TECH DETAILS**: 没有技术实现细节（API, 数据库, 框架等）
- [ ] **STORY INDEPENDENCE**: 每个故事都有 Independent Test 标准
- [ ] **PRIORITY ASSIGNED**: 所有故事都有明确优先级 (P1, P2, P3...)
- [ ] **MVP IDENTIFIED**: P1 故事能够作为独立 MVP 交付

### 用户故事质量 (INVEST 原则)
- [ ] **Independent**: 每个故事可独立交付和测试
- [ ] **Negotiable**: 细节可以讨论，实现方式灵活
- [ ] **Valuable**: 有明确的用户/业务价值
- [ ] **Estimable**: 可以估算工作量（不太大不太小）
- [ ] **Small**: 可在一个迭代内完成
- [ ] **Testable**: 有明确的验收标准和测试方法

### 验收标准质量
- [ ] 使用 Given-When-Then 格式
- [ ] 包含正常流程（Happy Path）
- [ ] 包含边界情况（Edge Cases）
- [ ] 包含错误场景（Error Handling）
- [ ] 具体且可测试（非模糊描述）
- [ ] 每个故事至少 2 个验收标准

### 完整性检查
- [ ] 所有必需章节已填写
- [ ] 没有 {{PLACEHOLDER}} 未替换
- [ ] 所有依赖已识别（上游、下游、外部）
- [ ] 所有风险已评估（技术、业务、进度）
- [ ] 范围明确界定（包含 + 不包含）
- [ ] 假设条件已列出

### Constitution 符合性
- [ ] 通过所有宪法检查
- [ ] 违规已文档化并说明理由
- [ ] 安全要求符合 NO HARDCODED SECRETS
- [ ] 质量要求符合 NO PARTIAL IMPLEMENTATION
- [ ] 架构要求符合 NO OVER-ENGINEERING
