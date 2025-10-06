# Epic: {{REQ_ID}} - {{TITLE}}

**Status**: Planned
**Created**: {{DATE}}
**Owner**: {{OWNER}}
**Type**: Epic

**Input**: PRD.md from `.claude/docs/requirements/{{REQ_ID}}/PRD.md`
**Prerequisites**: PRD.md 已完成并通过 Constitution Check

## Execution Flow (Epic 生成流程)
```
1. Load and analyze PRD
   → Read PRD.md completely
   → Extract user stories and acceptance criteria
   → Understand functional and non-functional requirements
   → Identify technical constraints
   → If PRD incomplete: ERROR "Complete PRD first"

2. Define Epic scope
   → Extract core objectives from PRD
   → Define clear boundaries (in-scope vs out-of-scope)
   → Identify success metrics with targets
   → Map user stories to Epic objectives

3. Design technical approach
   → Define high-level architecture
   → Identify key components and their responsibilities
   → Design data model (entities, relationships)
   → Design API contracts (endpoints, request/response)
   → Select technology stack based on constraints

4. Plan implementation phases
   → Phase 1: Setup and infrastructure
   → Phase 2: Core functionality (following TDD)
   → Phase 3: Integration
   → Phase 4: Polish and optimization
   → Estimate effort for each phase

5. Identify dependencies
   → External dependencies (third-party, other teams)
   → Internal dependencies (existing systems, modules)
   → Blocking dependencies with mitigation plans

6. Define quality gates
   → Code review standards
   → Test coverage requirements (≥80%)
   → Security scan requirements
   → Performance benchmarks
   → Documentation requirements

7. Constitution Check
   → NO PARTIAL IMPLEMENTATION: Scope complete?
   → NO CODE DUPLICATION: Reusing existing components?
   → NO OVER-ENGINEERING: Appropriately scaled solution?
   → NO HARDCODED SECRETS: Secret management planned?
   → Document violations with justification

8. Plan rollout strategy
   → Deployment approach (blue-green, canary, rolling)
   → Rollback procedures
   → Monitoring and alerting setup
   → Communication plan

9. Validate completeness
   → All user stories from PRD covered?
   → Technical approach feasible?
   → Dependencies identified and tracked?
   → Quality gates defined?
   → Risks assessed with mitigation?
   → If incomplete: ERROR "Complete missing sections"

10. Return: SUCCESS (Epic ready for task generation)
```

**重要**: 这是一个自执行模板。planner agent 应该按照 Execution Flow 生成完整的 EPIC.md 文件。

---

## 概述

### Epic 描述
{{EPIC_DESCRIPTION}}

### 业务价值
{{BUSINESS_VALUE}}

### 目标用户
{{TARGET_USERS}}

### 成功指标
| 指标 | 基线 | 目标 | 测量方法 | 时间线 |
|------|------|------|----------|--------|
| {{METRIC_1}} | {{BASELINE}} | {{TARGET}} | {{METHOD}} | {{TIMELINE}} |
| {{METRIC_2}} | {{BASELINE}} | {{TARGET}} | {{METHOD}} | {{TIMELINE}} |
| {{METRIC_3}} | {{BASELINE}} | {{TARGET}} | {{METHOD}} | {{TIMELINE}} |

---

## 范围定义

### 包含范围
*从 PRD 用户故事中提取*
- {{IN_SCOPE_1}}
- {{IN_SCOPE_2}}
- {{IN_SCOPE_3}}

### 不包含范围
*明确排除的内容*
- {{OUT_OF_SCOPE_1}}
- {{OUT_OF_SCOPE_2}}
- {{OUT_OF_SCOPE_3}}

### 用户故事映射
*从 PRD 映射到 Epic*

#### Story 1: {{STORY_TITLE_1}}
- **Epic 目标**: {{EPIC_OBJECTIVE_1}}
- **实现阶段**: Phase {{PHASE_NUMBER}}
- **优先级**: {{HIGH|MEDIUM|LOW}}

#### Story 2: {{STORY_TITLE_2}}
- **Epic 目标**: {{EPIC_OBJECTIVE_2}}
- **实现阶段**: Phase {{PHASE_NUMBER}}
- **优先级**: {{HIGH|MEDIUM|LOW}}

#### Story 3: {{STORY_TITLE_3}}
- **Epic 目标**: {{EPIC_OBJECTIVE_3}}
- **实现阶段**: Phase {{PHASE_NUMBER}}
- **优先级**: {{HIGH|MEDIUM|LOW}}

---

## 技术方案

### 系统架构

#### 高层架构
```text
{{HIGH_LEVEL_ARCHITECTURE}}

示例:
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │─────▶│   API       │─────▶│  Database   │
│   (React)   │◀─────│   (Node.js) │◀─────│  (Postgres) │
└─────────────┘      └─────────────┘      └─────────────┘
```

#### 核心组件
| 组件 | 职责 | 技术栈 | 依赖 |
|------|------|--------|------|
| {{COMPONENT_1}} | {{RESPONSIBILITY}} | {{TECH}} | {{DEPENDENCIES}} |
| {{COMPONENT_2}} | {{RESPONSIBILITY}} | {{TECH}} | {{DEPENDENCIES}} |
| {{COMPONENT_3}} | {{RESPONSIBILITY}} | {{TECH}} | {{DEPENDENCIES}} |

### 数据模型

#### 实体定义
*从 PRD 提取并细化*

**Entity 1: {{ENTITY_NAME_1}}**
```typescript
interface {{ENTITY_NAME_1}} {
  id: string;
  {{FIELD_1}}: {{TYPE}};
  {{FIELD_2}}: {{TYPE}};
  {{FIELD_3}}: {{TYPE}};
  createdAt: Date;
  updatedAt: Date;
}
```

**Entity 2: {{ENTITY_NAME_2}}**
```typescript
interface {{ENTITY_NAME_2}} {
  id: string;
  {{FIELD_1}}: {{TYPE}};
  {{FIELD_2}}: {{TYPE}};
  createdAt: Date;
  updatedAt: Date;
}
```

#### 关系图
```text
{{ENTITY_RELATIONSHIPS}}

示例:
User ─(1:N)─ Post ─(1:N)─ Comment
  │
  └─(M:N)─ Role
```

### API 设计

#### 端点列表
*这些端点将在 Phase 2 (Tests First) 中先写测试*

| 方法 | 路径 | 描述 | 请求体 | 响应 | Phase |
|------|------|------|--------|------|-------|
| POST | /api/{{RESOURCE}} | {{DESCRIPTION}} | {{REQUEST_SCHEMA}} | {{RESPONSE_SCHEMA}} | 2,3 |
| GET | /api/{{RESOURCE}}/:id | {{DESCRIPTION}} | - | {{RESPONSE_SCHEMA}} | 2,3 |
| PUT | /api/{{RESOURCE}}/:id | {{DESCRIPTION}} | {{REQUEST_SCHEMA}} | {{RESPONSE_SCHEMA}} | 2,3 |
| DELETE | /api/{{RESOURCE}}/:id | {{DESCRIPTION}} | - | {{RESPONSE_SCHEMA}} | 2,3 |

**说明**: Phase 2 写测试，Phase 3 写实现

#### 示例契约: POST /api/users
```typescript
// Request
{
  "name": "string",
  "email": "string",
  "password": "string"
}

// Response (201 Created)
{
  "id": "string",
  "name": "string",
  "email": "string",
  "createdAt": "string"
}

// Error (400 Bad Request)
{
  "error": "string",
  "details": ["string"]
}
```

### 技术栈选型

#### 必须使用
*从 PRD 技术约束中提取*
- **语言/框架**: {{LANGUAGE_FRAMEWORK}} - {{REASON}}
- **数据库**: {{DATABASE}} - {{REASON}}
- **基础设施**: {{INFRASTRUCTURE}} - {{REASON}}

#### 建议使用
- **测试框架**: {{TEST_FRAMEWORK}} - {{REASON}}
- **CI/CD**: {{CICD}} - {{REASON}}
- **监控**: {{MONITORING}} - {{REASON}}

---

## 实施阶段

### Phase 1: Setup (环境准备)
**预计时间**: {{ESTIMATE}}

**任务**:
- 项目结构初始化
- 依赖安装和配置
- CI/CD 管道设置
- 开发环境配置

**交付物**:
- 可运行的项目框架
- CI/CD 自动化
- 开发者文档

### Phase 2: Tests First (TDD 测试优先) ⚠️
**预计时间**: {{ESTIMATE}}

**关键原则**: 所有测试必须在 Phase 3 之前完成并失败

**任务**:
- 编写所有 API 端点的 contract tests
- 编写所有用户故事的 integration tests
- 编写数据模型的 schema tests
- **TEST VERIFICATION CHECKPOINT**: 验证所有测试失败

**交付物**:
- 完整的测试套件（全部失败）
- 测试覆盖报告（0% - 预期）
- 测试文档

### Phase 3: Core Implementation (核心实现)
**预计时间**: {{ESTIMATE}}

**前提**: Phase 2 的所有测试已失败

**任务**:
- 实现数据模型
- 实现业务逻辑
- 实现 API 端点
- **让测试通过**

**交付物**:
- 功能代码
- 测试覆盖率 ≥80%
- API 文档

### Phase 4: Integration (集成)
**预计时间**: {{ESTIMATE}}

**任务**:
- 数据库集成
- 认证/授权集成
- 第三方服务集成
- 中间件配置

**交付物**:
- 完全集成的系统
- 集成测试通过
- 部署脚本

### Phase 5: Polish (完善)
**预计时间**: {{ESTIMATE}}

**任务**:
- 性能优化
- 安全加固
- 文档完善
- 用户体验优化

**交付物**:
- 生产就绪的系统
- 完整文档
- 运维手册

---

## 依赖关系

### 外部依赖
| 依赖 | 类型 | 负责方 | 状态 | 预计完成 | 风险 |
|------|------|--------|------|----------|------|
| {{DEP_1}} | {{TYPE}} | {{OWNER}} | {{STATUS}} | {{DATE}} | {{RISK}} |
| {{DEP_2}} | {{TYPE}} | {{OWNER}} | {{STATUS}} | {{DATE}} | {{RISK}} |

### 内部依赖
| 依赖 | 描述 | 影响 | 缓解措施 |
|------|------|------|----------|
| {{DEP_1}} | {{DESCRIPTION}} | {{IMPACT}} | {{MITIGATION}} |
| {{DEP_2}} | {{DESCRIPTION}} | {{IMPACT}} | {{MITIGATION}} |

---

## 质量标准

### Definition of Done (DoD)

#### 代码质量
- [ ] 代码审查通过
- [ ] 符合团队编码规范
- [ ] 无 linter 错误
- [ ] NO CODE DUPLICATION 验证
- [ ] NO DEAD CODE 验证

#### 测试质量
- [ ] 单元测试覆盖率 ≥80%
- [ ] 所有集成测试通过
- [ ] 所有 contract tests 通过
- [ ] 性能测试达标
- [ ] TDD 流程遵循（测试先行）

#### 安全质量
- [ ] 安全扫描无高危漏洞
- [ ] NO HARDCODED SECRETS 验证
- [ ] 所有输入已验证
- [ ] 认证/授权正确实现

#### 文档质量
- [ ] API 文档更新
- [ ] README 更新
- [ ] CHANGELOG 更新
- [ ] 运维文档完整

#### 部署就绪
- [ ] 部署脚本测试通过
- [ ] 回滚程序验证
- [ ] 监控和告警配置
- [ ] 日志记录完整

### 验收标准
*从 PRD 映射*
- {{ACCEPTANCE_CRITERION_1}}
- {{ACCEPTANCE_CRITERION_2}}
- {{ACCEPTANCE_CRITERION_3}}

---

## Constitution Check (宪法符合性检查)

*GATE: 必须在任务生成前通过*

### 质量原则
- [ ] **NO PARTIAL IMPLEMENTATION**: Epic 范围完整且明确？
- [ ] **NO SIMPLIFICATION**: 避免简化占位符？
- [ ] TDD 流程明确定义？
- [ ] 所有验收标准可测试？

### 架构原则
- [ ] **NO CODE DUPLICATION**: 识别可复用组件？
- [ ] **NO OVER-ENGINEERING**: 架构适合问题规模？
- [ ] **NO INCONSISTENT NAMING**: 命名约定统一？
- [ ] **NO MIXED CONCERNS**: 关注点正确分离？
- [ ] 清晰的模块边界？

### 安全原则
- [ ] **NO HARDCODED SECRETS**: 密钥管理方案明确？
- [ ] 认证/授权机制设计完整？
- [ ] 输入验证策略定义？
- [ ] 数据加密方案明确？
- [ ] 审计日志设计？

### 性能原则
- [ ] **NO RESOURCE LEAKS**: 资源管理考虑？
- [ ] 性能基准明确？
- [ ] 监控指标定义？
- [ ] 优化策略规划？

### 可维护性原则
- [ ] **NO DEAD CODE**: 避免不必要功能？
- [ ] 代码组织清晰？
- [ ] 文档完整？
- [ ] 测试覆盖充分？

### 违规与理由
*仅在有需要说明的宪法违规时填写*

| 违规项 | 为何需要 | 如何缓解 |
|--------|---------|----------|
| {{VIOLATION}} | {{JUSTIFICATION}} | {{MITIGATION}} |

---

## 风险管理

### 技术风险
| 风险 | 可能性 | 影响 | 缓解措施 | 负责人 |
|------|--------|------|----------|--------|
| {{TECH_RISK_1}} | {{L/M/H}} | {{L/M/H}} | {{MITIGATION}} | {{OWNER}} |
| {{TECH_RISK_2}} | {{L/M/H}} | {{L/M/H}} | {{MITIGATION}} | {{OWNER}} |

### 进度风险
| 风险 | 可能性 | 影响 | 缓解措施 | 负责人 |
|------|--------|------|----------|--------|
| {{SCHEDULE_RISK_1}} | {{L/M/H}} | {{L/M/H}} | {{MITIGATION}} | {{OWNER}} |

### 资源风险
| 风险 | 可能性 | 影响 | 缓解措施 | 负责人 |
|------|--------|------|----------|--------|
| {{RESOURCE_RISK_1}} | {{L/M/H}} | {{L/M/H}} | {{MITIGATION}} | {{OWNER}} |

---

## 发布计划

### 发布策略
- **部署方式**: {{DEPLOYMENT_STRATEGY}}
- **环境流程**: Dev → Test → Staging → Production
- **回滚策略**: {{ROLLBACK_STRATEGY}}

### 里程碑
| 里程碑 | 目标 | 日期 | 状态 |
|--------|------|------|------|
| **Phase 1 Complete** | 环境就绪 | {{DATE}} | {{STATUS}} |
| **Phase 2 Complete** | 测试完成（失败） | {{DATE}} | {{STATUS}} |
| **TEST CHECKPOINT** | 验证测试失败 | {{DATE}} | {{STATUS}} |
| **Phase 3 Complete** | 核心实现（测试通过） | {{DATE}} | {{STATUS}} |
| **Phase 4 Complete** | 集成完成 | {{DATE}} | {{STATUS}} |
| **Phase 5 Complete** | 生产就绪 | {{DATE}} | {{STATUS}} |

### 部署检查清单
- [ ] 环境配置验证
- [ ] 数据库迁移测试
- [ ] 性能测试通过
- [ ] 安全扫描通过
- [ ] 监控和告警配置
- [ ] 回滚程序验证
- [ ] 文档更新完成
- [ ] 团队培训完成

---

## Progress Tracking (进度跟踪)

*在 Epic 创建过程中更新*

### 完成状态
- [ ] 概述定义清晰
- [ ] 范围界定明确
- [ ] 技术方案完整
- [ ] 数据模型设计
- [ ] API 契约定义
- [ ] 实施阶段规划
- [ ] 依赖关系识别
- [ ] 质量标准定义
- [ ] Constitution Check 通过
- [ ] 风险评估完成
- [ ] 发布计划制定

### 质量检查
- [ ] 所有 PRD 用户故事已映射
- [ ] 技术方案可行性验证
- [ ] TDD 流程明确定义
- [ ] API 契约完整
- [ ] 依赖全部识别
- [ ] 风险评估充分

### 闸门状态
- [ ] Constitution Check: {{PASS|FAIL}}
- [ ] 技术可行性: {{PASS|FAIL}}
- [ ] 依赖就绪: {{PASS|FAIL}}

**准备好进行任务生成**: {{YES|NO}}

---

## 相关文档

### 输入文档
- **PRD**: [PRD.md](PRD.md)
- **研究材料**: [research/](research/)

### 输出文档
- **Tasks**: 将由 planner agent 生成 TASKS.md（TDD 顺序）
- **测试计划**: 将由 qa-tester agent 生成
- **安全计划**: 将由 security-reviewer agent 生成

---

**Generated by**: planner agent
**Based on**: PRD.md, CC-DevFlow Constitution v2.1.1
**Template Version**: 2.0.0 (Self-Executable)
**Next Step**: Generate TASKS.md with TDD order (Phase 2 Tests → Phase 3 Implementation)

---

## Validation Checklist (验证清单)

*GATE: Epic 标记为完成前检查*

### PRD 对齐
- [ ] 所有用户故事已映射到 Epic
- [ ] 所有验收标准已包含
- [ ] 成功指标与 PRD 一致
- [ ] 技术约束已考虑

### 技术方案完整性
- [ ] 架构设计清晰
- [ ] 数据模型完整
- [ ] API 契约定义
- [ ] 技术栈选型合理

### TDD 准备
- [ ] Phase 2 明确定义为"Tests First"
- [ ] TEST VERIFICATION CHECKPOINT 已标记
- [ ] 测试策略明确
- [ ] Phase 3 依赖 Phase 2 完成

### 质量保证
- [ ] DoD 明确且可验证
- [ ] Constitution Check 通过
- [ ] 风险已识别和评估
- [ ] 回滚策略明确

### 可执行性
- [ ] 实施阶段清晰
- [ ] 依赖已识别
- [ ] 资源需求明确
- [ ] 时间估算合理