# PRD: {{REQ_ID}} - {{TITLE}}

**Status**: Draft
**Created**: {{DATE}}
**Owner**: {{OWNER}}
**Type**: Requirement

**Input**: 用户需求描述、研究材料 from `.claude/docs/requirements/{{REQ_ID}}/research/`
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

7. Constitution Check
   → NO PARTIAL IMPLEMENTATION: Requirements complete?
   → NO OVER-ENGINEERING: Solution appropriately scaled?
   → NO HARDCODED SECRETS: Secret management defined?
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

### Story 1: {{STORY_TITLE_1}}
**As a** {{USER_ROLE}}
**I want** {{CAPABILITY}}
**So that** {{BENEFIT}}

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

**Priority**: {{HIGH|MEDIUM|LOW}}
**Complexity**: {{HIGH|MEDIUM|LOW}}

---

### Story 2: {{STORY_TITLE_2}}
**As a** {{USER_ROLE}}
**I want** {{CAPABILITY}}
**So that** {{BENEFIT}}

**Acceptance Criteria**:
```gherkin
AC1: Given {{PRECONDITION}}
     When {{ACTION}}
     Then {{EXPECTED_RESULT}}

AC2: Given {{PRECONDITION}}
     When {{ACTION}}
     Then {{EXPECTED_RESULT}}
```

**Priority**: {{HIGH|MEDIUM|LOW}}
**Complexity**: {{HIGH|MEDIUM|LOW}}

---

### Story 3: {{STORY_TITLE_3}}
**As a** {{USER_ROLE}}
**I want** {{CAPABILITY}}
**So that** {{BENEFIT}}

**Acceptance Criteria**:
```gherkin
AC1: Given {{PRECONDITION}}
     When {{ACTION}}
     Then {{EXPECTED_RESULT}}
```

**Priority**: {{HIGH|MEDIUM|LOW}}
**Complexity**: {{HIGH|MEDIUM|LOW}}

---

### 边界案例处理
- **错误处理**: {{ERROR_HANDLING_REQUIREMENTS}}
- **权限控制**: {{PERMISSION_REQUIREMENTS}}
- **数据验证**: {{VALIDATION_REQUIREMENTS}}
- **边界条件**: {{EDGE_CASES}}

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

### 质量原则
- [ ] **NO PARTIAL IMPLEMENTATION**: 需求定义完整且明确？
- [ ] **NO SIMPLIFICATION**: 避免简化的占位符？
- [ ] 用户故事遵循 INVEST 准则？
- [ ] 验收标准具体且可测试？

### 架构原则
- [ ] **NO CODE DUPLICATION**: 可以利用现有系统？
- [ ] **NO OVER-ENGINEERING**: 解决方案适合问题规模？
- [ ] 清晰的边界和职责划分？
- [ ] 可扩展的架构方法？

### 安全原则
- [ ] **NO HARDCODED SECRETS**: 定义了密钥管理策略？
- [ ] 身份验证/授权机制清晰？
- [ ] 输入验证需求明确？
- [ ] 数据加密策略定义？

### 性能原则
- [ ] **NO RESOURCE LEAKS**: 考虑了资源管理？
- [ ] 性能目标现实且可测量？
- [ ] 规划了监控和告警？

### 可维护性原则
- [ ] **NO DEAD CODE**: 避免不必要的功能？
- [ ] 代码易于理解和修改？
- [ ] 遵循单一职责原则？

### 违规与理由
*仅在有需要说明的宪法违规时填写*

| 违规项 | 为何需要 | 如何缓解 |
|--------|---------|----------|
| {{VIOLATION}} | {{JUSTIFICATION}} | {{MITIGATION}} |

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
**Based on**: CC-DevFlow Constitution v2.1.1
**Template Version**: 2.0.0 (Self-Executable)
**Next Step**: Run planner agent to generate EPIC.md and TASKS.md

---

## Validation Checklist (验证清单)

*GATE: PRD 标记为完成前检查*

### 用户故事质量
- [ ] Independent: 每个故事可独立交付
- [ ] Negotiable: 细节可以讨论
- [ ] Valuable: 有明确的用户/业务价值
- [ ] Estimable: 可以估算工作量
- [ ] Small: 可在一个迭代内完成
- [ ] Testable: 有明确的验收标准

### 验收标准质量
- [ ] 使用 Given-When-Then 格式
- [ ] 包含正常流程
- [ ] 包含边界情况
- [ ] 包含错误场景
- [ ] 具体且可测试

### 完整性
- [ ] 所有必需章节已填写
- [ ] 没有 {{PLACEHOLDER}} 未替换
- [ ] 所有依赖已识别
- [ ] 所有风险已评估

### Constitution 符合性
- [ ] 通过所有宪法检查
- [ ] 违规已文档化并说明理由
- [ ] 安全要求符合 NO HARDCODED SECRETS
- [ ] 质量要求符合 NO PARTIAL IMPLEMENTATION