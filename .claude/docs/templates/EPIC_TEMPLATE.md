# Epic: {{REQ_ID}} - {{TITLE}}

**Status**: Planned
**Created**: {{DATE}}
**Owner**: {{OWNER}}
**Type**: Epic

**Input**: PRD.md from `devflow/requirements/{{REQ_ID}}/PRD.md`
**Prerequisites**: PRD.md 已完成并通过 Constitution Check

## Execution Flow (Epic 生成流程)
```
1. Load and analyze PRD
   → Read PRD.md completely
   → Extract user stories and acceptance criteria
   → Understand functional and non-functional requirements
   → Identify technical constraints
   → If PRD incomplete: ERROR "Complete PRD first"

1.5 Check for UI prototype (条件检查)
   → Check if UI_PROTOTYPE.html exists
   → If UI_PROTOTYPE.html exists:
     • Read UI_PROTOTYPE.html HTML comments section
     • Extract page structure (pages列表)
     • Extract component inventory (组件清单)
     • Extract design system (CSS变量: 色彩/字体/间距)
     • Extract responsive breakpoints (断点: 320px/768px/1024px)
     • Store UI context for Phase 3 frontend tasks
   → If no UI_PROTOTYPE.html:
     • Log: "No UI prototype found, assuming backend-only or manual UI design"
     • Continue without UI context

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

7. Constitution Check (验证 Article I-V 核心原则)
   → Article I - Quality First: Scope complete? No partial implementation?
   → Article II - Architectural Consistency: Reusing existing components? No duplication?
   → Article II - Anti-Over-Engineering: Appropriately scaled solution?
   → Article III - Security First: Secret management planned? No hardcoded secrets?
   → Article IV - Performance: Resource management considered?
   → Article V - Maintainability: Clear separation of concerns?
   → Document violations with justification in Complexity Tracking table

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

## Phase -1: 宪法闸门检查 (Pre-Implementation Gates) ⚠️

<!--
  ======================================================================
  CRITICAL: 这些闸门必须在技术方案设计前通过
  任何违规都必须在 Complexity Tracking 表中证明和记录
  ======================================================================
-->

### Simplicity Gate (简单性闸门) - Constitution Article VII

- [ ] **项目数量**: 使用 ≤3 个项目/模块？
  - 如果 >3: 必须在 Complexity Tracking 中证明必要性

- [ ] **NO FUTURE-PROOFING**: 没有为"未来可能需要"的功能做准备？
  - ❌ 禁止: "预留接口"、"扩展点"、"通用框架"
  - ✅ 允许: 只实现当前需求的最简单方案

- [ ] **Minimal Dependencies**: 只使用必需的依赖库？
  - 检查每个依赖: 是当前需求必需还是"可能有用"

### Anti-Abstraction Gate (反抽象闸门) - Constitution Article VIII

- [ ] **Framework Trust**: 直接使用框架功能，没有封装？
  - ❌ 禁止: BaseController, ServiceLayer, Repository Pattern
  - ✅ 允许: 直接使用 FastAPI, Express, Flask 等

- [ ] **Single Model Representation**: 实体只有一种数据表示？
  - ❌ 禁止: DTO ↔ Entity ↔ ViewModel 多层转换
  - ✅ 允许: 单一数据模型贯穿各层

- [ ] **No Unnecessary Interfaces**: 没有单一实现的接口？
  - ❌ 禁止: 只有一个实现类的 IUserService 接口
  - ✅ 允许: 有多个实现时才抽象接口

### Integration-First Gate (集成优先闸门) - Constitution Article IX

- [ ] **Contracts Defined First**: API contracts 在实现前定义？
  - 必须: 定义 OpenAPI/Swagger 规范或类似契约

- [ ] **Contract Tests Planned**: Contract tests 在 Phase 2 计划？
  - 必须: 每个 endpoint 都有对应的 contract test

- [ ] **Real Environment**: 使用真实数据库而非 mocks？
  - ✅ 优先: PostgreSQL testcontainer, SQLite in-memory
  - ⚠️ 谨慎: Mocks 仅用于外部服务

### Complexity Tracking (复杂度追踪表)

*仅在违反上述闸门时填写*

| 违规项 | 为何需要 | 更简单方案为何不够 | 缓解措施 |
|--------|---------|-------------------|----------|
| {{VIOLATION}} | {{JUSTIFICATION}} | {{WHY_SIMPLE_NOT_ENOUGH}} | {{MITIGATION}} |

**示例**:
| 违规项 | 为何需要 | 更简单方案为何不够 | 缓解措施 |
|--------|---------|-------------------|----------|
| 4个项目 | 前端、后端、移动端、管理后台 | 3个项目无法满足多端需求 | 管理后台复用前端组件库 |
| Repository Pattern | 需要支持 PostgreSQL 和 MongoDB | 直接使用 ORM 会导致业务逻辑耦合数据库 | 只抽象数据访问层，不做过度封装 |

---

## UI 原型集成 (如有) ⚡️

**Note**: 本章节仅在存在 UI_PROTOTYPE.html 时填写

### UI 原型概览
- **文件位置**: `devflow/requirements/{{REQ_ID}}/UI_PROTOTYPE.html`
- **原型类型**: {{单页面|多页面SPA|静态原型}}
- **设计风格**: {{从 ui_design_strategy.md 提取}}

### 页面清单
*从 UI_PROTOTYPE.html 提取*

| 页面 | 路由 | 描述 | 关联用户故事 | 实现阶段 |
|------|------|------|-------------|---------|
| {{PAGE_1}} | {{ROUTE}} | {{DESCRIPTION}} | Story {{NUM}} | Phase {{NUM}} |
| {{PAGE_2}} | {{ROUTE}} | {{DESCRIPTION}} | Story {{NUM}} | Phase {{NUM}} |

**示例**:
| 页面 | 路由 | 描述 | 关联用户故事 | 实现阶段 |
|------|------|------|-------------|---------|
| 订单列表 | /orders | 显示用户所有订单 | Story 1 | Phase 3 |
| 订单详情 | /orders/:id | 显示订单详细信息 | Story 2 | Phase 3 |

### 组件清单
*从 UI_PROTOTYPE.html 提取*

| 组件 | 类型 | 描述 | 复用性 | 优先级 |
|------|------|------|--------|--------|
| {{COMPONENT_1}} | {{TYPE}} | {{DESCRIPTION}} | {{HIGH|MEDIUM|LOW}} | {{P1|P2|P3}} |
| {{COMPONENT_2}} | {{TYPE}} | {{DESCRIPTION}} | {{HIGH|MEDIUM|LOW}} | {{P1|P2|P3}} |

**示例**:
| 组件 | 类型 | 描述 | 复用性 | 优先级 |
|------|------|------|--------|--------|
| OrderCard | 展示组件 | 订单卡片 | HIGH (订单列表/详情共用) | P1 |
| StatusBadge | UI组件 | 状态徽章 | HIGH (多处使用) | P1 |

### 设计系统
*从 UI_PROTOTYPE.html CSS Variables 提取*

#### 色彩系统
```css
--primary-color: {{VALUE}};
--secondary-color: {{VALUE}};
--text-color: {{VALUE}};
--bg-color: {{VALUE}};
```

#### 字体系统
```css
--font-primary: {{VALUE}};
--font-secondary: {{VALUE}};
--font-size-base: {{VALUE}};
```

#### 间距系统
```css
--spacing-xs: {{VALUE}};
--spacing-sm: {{VALUE}};
--spacing-md: {{VALUE}};
--spacing-lg: {{VALUE}};
```

### 响应式断点
*从 UI_PROTOTYPE.html 提取*
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

### 前端技术约束
**基于UI原型的技术要求**:
- 框架: {{React|Vue|Angular|Vanilla JS}}
- CSS方案: {{CSS Modules|Styled Components|Tailwind}}
- 状态管理: {{Redux|Zustand|Context API}}
- 路由: {{React Router|Vue Router|自定义}}

**Note**: 这些约束将在 Phase 3 (前端实现) 任务中使用

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

## Phase -1 Constitutional Gates (宪法前置闸)

**Critical**: 这些闸门必须在架构设计之前通过，防止过度设计和复杂性蔓延

**Reference**: `.claude/rules/project-constitution.md` (v2.0.0)

### Gate 1: Simplicity Gate (Article VII)
**原则**: ≤3 Projects/Modules, No Future-Proofing

**检查项**:
- [ ] **项目数量限制**: 本Epic产生的独立项目/模块 ≤3 个？
- [ ] **无未来预留**: 无"未来可能需要"的抽象层或接口？
- [ ] **最小可行方案**: 选择最简单的可工作方案（不是最灵活）？
- [ ] **直接实现**: 优先直接实现而非通用框架？

**违规示例**:
- ❌ "设计一个插件系统，未来可以..."
- ❌ "创建一个通用的数据访问层支持多种数据库"
- ✅ "直接使用 PostgreSQL 实现用户存储"

### Gate 2: Anti-Abstraction Gate (Article VIII)
**原则**: Direct Framework Usage, No Extra Wrappers

**检查项**:
- [ ] **直接使用框架**: 直接使用 Express/Next.js/Django 等，无自定义封装？
- [ ] **避免工厂模式**: 无不必要的 Factory/Builder/Abstract Factory？
- [ ] **避免中间件层**: 无自定义中间件层（除非有明确性能需求）？
- [ ] **拒绝过度抽象**: 具体实现优先于抽象接口？

**违规示例**:
- ❌ "创建 DatabaseFactory 支持切换 MySQL/PostgreSQL/MongoDB"
- ❌ "封装 Express 为 CustomHttpServer 类"
- ✅ "使用 express.Router() 直接定义路由"

### Gate 3: Integration-First Gate (Article IX)
**原则**: Contracts First, Test in Real Environment

**检查项**:
- [ ] **Contract 优先**: API Contract/Schema 在实现前定义？
- [ ] **真实环境测试**: 集成测试使用真实数据库/服务（Docker）？
- [ ] **端到端优先**: E2E 测试优先于单元测试（先验证整体流程）？
- [ ] **避免 Mock**: 最小化 Mock 使用，优先真实依赖？

**违规示例**:
- ❌ "先实现功能，后面再定义 API"
- ❌ "集成测试全部 Mock 外部依赖"
- ✅ "先定义 OpenAPI Schema，再实现 handlers"

### Phase -1 Gate 决策记录
*必填*: 记录 Phase -1 Gates 的通过情况和任何例外

| Gate | Status | 决策 | 理由（如有例外） |
|------|--------|------|------------------|
| Simplicity Gate (VII) | ✅/❌ | {{DECISION}} | {{JUSTIFICATION}} |
| Anti-Abstraction Gate (VIII) | ✅/❌ | {{DECISION}} | {{JUSTIFICATION}} |
| Integration-First Gate (IX) | ✅/❌ | {{DECISION}} | {{JUSTIFICATION}} |

---

## Constitution Check (宪法符合性检查)

*GATE: 必须在任务生成前通过*

**Reference**: `.claude/rules/project-constitution.md` (v2.0.0)

### Article I: Quality First (质量至上)
- [ ] **I.1 - NO PARTIAL IMPLEMENTATION**: Epic 范围完整且明确？无占位符？
- [ ] **I.2 - Testing Mandate**: TDD 流程明确定义？测试覆盖率 ≥80%？
- [ ] **I.3 - No Simplification**: 避免"暂时简化"的做法？
- [ ] **I.4 - Quality Gates**: 所有验收标准可测试且明确？

### Article II: Architectural Consistency (架构一致性)
- [ ] **II.1 - NO CODE DUPLICATION**: 识别并计划复用现有组件？
- [ ] **II.2 - Consistent Naming**: 命名约定遵循现有代码库模式？
- [ ] **II.3 - Anti-Over-Engineering**: 架构适合问题规模？无过度设计？
- [ ] **II.4 - Single Responsibility**: 关注点正确分离？模块边界清晰？

### Article III: Security First (安全优先)
- [ ] **III.1 - NO HARDCODED SECRETS**: 密钥管理方案明确（环境变量/密钥服务）？
- [ ] **III.2 - Input Validation**: 输入验证策略定义？
- [ ] **III.3 - Least Privilege**: 认证/授权机制设计完整？
- [ ] **III.4 - Secure by Default**: 数据加密方案明确？审计日志设计？

### Article IV: Performance Accountability (性能责任)
- [ ] **IV.1 - NO RESOURCE LEAKS**: 资源管理考虑（连接池、文件句柄等）？
- [ ] **IV.2 - Algorithm Efficiency**: 性能基准明确？算法复杂度合理？
- [ ] **IV.3 - Lazy Loading**: 按需加载策略规划？
- [ ] **IV.4 - Caching Strategy**: 监控指标和缓存策略定义？

### Article V: Maintainability (可维护性)
- [ ] **V.1 - NO DEAD CODE**: 避免不必要功能？无冗余代码？
- [ ] **V.2 - Separation of Concerns**: 代码组织清晰？层次分离明确？
- [ ] **V.3 - Documentation**: 文档完整（架构、API、配置）？
- [ ] **V.4 - File Size Limits**: 单文件 ≤500行？单函数 ≤50行？

### Article VI: Test-First Development (测试优先开发)
- [ ] **VI.1 - TDD Mandate**: Phase 2 测试优先顺序强制执行？
- [ ] **VI.2 - Test Independence**: 测试隔离策略定义？
- [ ] **VI.3 - Meaningful Tests**: 测试质量标准明确（真实场景、错误处理）？

### Article VII-IX: Phase -1 Gates (已在上方检查)
- [ ] **Article VII - Simplicity Gate**: ≤3 个项目/模块？无未来预留？
- [ ] **Article VIII - Anti-Abstraction Gate**: 直接使用框架？无过度封装？
- [ ] **Article IX - Integration-First Gate**: Contracts 优先？真实环境测试？

### Article X: Requirement Boundary (需求边界)
- [ ] **X.1 - Forced Clarification**: 所有不明确之处已标记 [NEEDS CLARIFICATION]？
- [ ] **X.2 - No Speculative Features**: 无推测性功能？仅实现明确需求？
- [ ] **X.3 - User Story Independence**: 每个故事独立可测试？优先级明确？

### Constitutional Violations (宪法违规记录)
*仅在有需要说明的宪法违规时填写*

**重要**: 任何违规都必须有充分理由和缓解措施，否则 EPIC 不通过

| 违规的 Article | 具体违规内容 | 为何必须违规 | 缓解措施 | 责任人 |
|----------------|-------------|-------------|----------|--------|
| {{ARTICLE_NUM}} | {{VIOLATION_DETAIL}} | {{JUSTIFICATION}} | {{MITIGATION}} | {{OWNER}} |

**示例**:
| 违规的 Article | 具体违规内容 | 为何必须违规 | 缓解措施 | 责任人 |
|----------------|-------------|-------------|----------|--------|
| Article VII.1 | 使用4个项目（超过3个限制） | 需要支持Web、iOS、Android、Admin四端 | Admin复用Web组件库，减少重复代码 | Tech Lead |
| Article VIII.1 | 引入 Repository Pattern | 需要同时支持 PostgreSQL 和 MongoDB | 仅抽象数据访问层，不做过度封装 | Backend Lead |

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
**Based on**: PRD.md, CC-DevFlow Constitution v2.0.0
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
