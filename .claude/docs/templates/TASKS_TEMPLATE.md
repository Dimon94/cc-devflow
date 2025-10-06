# Tasks: {{REQ_ID}} - {{TITLE}}

**Input**: PRD.md, EPIC.md from `.claude/docs/requirements/{{REQ_ID}}/`
**Prerequisites**: PRD.md (required), EPIC.md (required), research/ (optional)

## Execution Flow (任务生成主流程)
```
1. Load PRD.md and EPIC.md from requirement directory
   → If PRD not found: ERROR "Run prd-writer first"
   → If EPIC not found: ERROR "Run planner first"
   → Extract: user stories, technical components, data entities

2. Load optional design documents:
   → research/: Extract technology decisions → setup tasks
   → data-model section in EPIC: Extract entities → model tasks
   → API contracts in EPIC: Each endpoint → contract test task

3. Generate tasks by category (TDD order):
   → Phase 1 Setup: project init, dependencies, linting
   → Phase 2 Tests First: contract tests, integration tests (⚠️ MUST FAIL initially)
   → Phase 3 Core Implementation: models, services, API endpoints
   → Phase 4 Integration: DB, middleware, logging, security
   → Phase 5 Polish: unit tests, performance, documentation

4. Apply task rules:
   → Different files = mark [P] for parallel execution
   → Same file = sequential (no [P])
   → Tests ALWAYS before implementation (TDD principle)
   → Mark test verification checkpoint before Phase 3

5. Number tasks sequentially (T001, T002, T003...)

6. Generate dependency graph

7. Create parallel execution examples for [P] tasks

8. Validate task completeness:
   → All user stories have integration tests?
   → All API endpoints have contract tests?
   → All data entities have model tasks?
   → All tests come before implementation?
   → If validation fails: ERROR "Fix task breakdown"

9. Update Constitution Check section

10. Return: SUCCESS (tasks.md ready for execution)
```

**重要**: 这是一个自执行模板。Planner agent 应该按照 Execution Flow 生成完整的 tasks.md 文件。

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **ID**: T001, T002, T003... (sequential numbering)
- Include exact file paths in task descriptions

## Path Conventions
根据项目类型调整路径：
- **单体项目**: `src/`, `tests/` 在仓库根目录
- **Web 应用**: `backend/src/`, `frontend/src/`
- **移动应用**: `api/src/`, `ios/src/` 或 `android/src/`

---

## Phase 1: Setup (环境准备)

### 任务清单
- [ ] **T001** 创建项目结构按照 EPIC 中定义的架构
- [ ] **T002** 初始化 {{LANGUAGE}} 项目并安装 {{FRAMEWORK}} 依赖
- [ ] **T003** [P] 配置代码检查工具（linting, formatting）

### Constitution Check (Phase 1)
- [ ] NO OVER-ENGINEERING - 避免不必要的抽象
- [ ] 只安装必需的依赖
- [ ] 遵循项目现有的结构模式

---

## Phase 2: Tests First (TDD) ⚠️ 必须在 Phase 3 之前完成

**关键原则**:
- 所有测试必须先写
- 所有测试必须先失败（因为还没有实现）
- 验证测试失败后才能进入 Phase 3

### 2.1 Contract Tests (API 契约测试)
从 EPIC 中的 API contracts 生成：

{{#each API_ENDPOINTS}}
- [ ] **T{{ID}}** [P] Contract test {{METHOD}} {{PATH}} in `tests/contract/test_{{NAME}}.{{EXT}}`
  - 验证请求/响应结构
  - 验证状态码
  - 验证错误场景
  - **预期**: 测试应该失败（接口未实现）
{{/each}}

**示例**:
- [ ] **T004** [P] Contract test POST /api/users in `tests/contract/test_users_post.py`
- [ ] **T005** [P] Contract test GET /api/users/{id} in `tests/contract/test_users_get.py`
- [ ] **T006** [P] Contract test PUT /api/users/{id} in `tests/contract/test_users_put.py`
- [ ] **T007** [P] Contract test DELETE /api/users/{id} in `tests/contract/test_users_delete.py`

### 2.2 Integration Tests (集成测试)
从 PRD 中的 user stories 生成：

{{#each USER_STORIES}}
- [ ] **T{{ID}}** [P] Integration test: {{STORY_TITLE}} in `tests/integration/test_{{STORY_NAME}}.{{EXT}}`
  - 完整的用户流程测试
  - 验证业务逻辑正确性
  - **预期**: 测试应该失败（功能未实现）
{{/each}}

**示例**:
- [ ] **T008** [P] Integration test: User registration flow in `tests/integration/test_registration.py`
- [ ] **T009** [P] Integration test: User authentication flow in `tests/integration/test_auth.py`
- [ ] **T010** [P] Integration test: User profile update in `tests/integration/test_profile.py`

### ⚠️ TEST VERIFICATION CHECKPOINT

**在进入 Phase 3 之前，必须验证**:
```bash
# 运行所有测试
npm run test  # 或 pytest, cargo test 等

# 预期结果: 所有测试都应该失败
# ✗ T004: Contract test POST /api/users - FAILED (404 Not Found)
# ✗ T005: Contract test GET /api/users/{id} - FAILED (404 Not Found)
# ✗ T008: Integration test User registration - FAILED (No route)
# ...

# 如果有任何测试通过，检查是否有遗漏的实现
```

**GATE**: 只有当所有测试都正确失败后，才能开始 Phase 3

### Constitution Check (Phase 2)
- [ ] NO CHEATER TESTS - 测试必须真实反映使用场景
- [ ] IMPLEMENT TEST FOR EVERY FUNCTIONS - 每个功能都有测试
- [ ] 测试应该揭示缺陷，而不是掩盖缺陷

---

## Phase 3: Core Implementation (核心实现)

**前提条件**: Phase 2 的所有测试都已失败

### 3.1 Data Models (数据模型)
从 EPIC 中的 data entities 生成：

{{#each DATA_ENTITIES}}
- [ ] **T{{ID}}** [P] {{ENTITY_NAME}} model in `{{MODEL_PATH}}`
  - 定义字段和类型
  - 添加验证规则
  - 实现序列化/反序列化
  - **验证**: 相关的单元测试通过
{{/each}}

**示例**:
- [ ] **T011** [P] User model in `src/models/user.py`
- [ ] **T012** [P] Post model in `src/models/post.py`
- [ ] **T013** [P] Comment model in `src/models/comment.py`

### 3.2 Business Logic (业务逻辑)
从 EPIC 中的 services 生成：

{{#each SERVICES}}
- [ ] **T{{ID}}** {{SERVICE_NAME}} in `{{SERVICE_PATH}}`
  - 实现核心业务逻辑
  - 处理数据验证
  - 处理错误场景
  - **验证**: 集成测试开始通过
{{/each}}

**示例**:
- [ ] **T014** UserService CRUD operations in `src/services/user_service.py`
- [ ] **T015** AuthService authentication logic in `src/services/auth_service.py`
- [ ] **T016** PostService business logic in `src/services/post_service.py`

### 3.3 API Endpoints (API 实现)
按照 contract tests 中定义的顺序实现：

{{#each API_ENDPOINTS}}
- [ ] **T{{ID}}** {{METHOD}} {{PATH}} endpoint in `{{HANDLER_PATH}}`
  - 实现请求处理
  - 调用相应的 service
  - 返回正确的响应格式
  - **验证**: T{{CONTRACT_TEST_ID}} contract test 通过
{{/each}}

**示例**:
- [ ] **T017** POST /api/users endpoint → 验证 T004 通过
- [ ] **T018** GET /api/users/{id} endpoint → 验证 T005 通过
- [ ] **T019** PUT /api/users/{id} endpoint → 验证 T006 通过
- [ ] **T020** DELETE /api/users/{id} endpoint → 验证 T007 通过

### 3.4 Input Validation & Error Handling

- [ ] **T021** Input validation for all endpoints in `src/validators/`
- [ ] **T022** Error handling middleware in `src/middleware/error_handler.{{EXT}}`
- [ ] **T023** Logging setup in `src/lib/logger.{{EXT}}`

### Constitution Check (Phase 3)
- [ ] NO PARTIAL IMPLEMENTATION - 完整实现所有功能
- [ ] NO CODE DUPLICATION - 复用现有函数和常量
- [ ] NO INCONSISTENT NAMING - 遵循命名规范
- [ ] NO MIXED CONCERNS - 正确分离关注点
- [ ] NO DEAD CODE - 删除无用代码

---

## Phase 4: Integration (集成)

### 4.1 Data Layer Integration

- [ ] **T024** Database connection setup in `src/lib/database.{{EXT}}`
- [ ] **T025** Connect UserService to database
- [ ] **T026** Database migrations (if needed)

### 4.2 Middleware & Security

- [ ] **T027** Authentication middleware in `src/middleware/auth.{{EXT}}`
- [ ] **T028** Authorization/permissions in `src/middleware/permissions.{{EXT}}`
- [ ] **T029** Request/response logging in `src/middleware/logger.{{EXT}}`
- [ ] **T030** CORS and security headers in `src/middleware/security.{{EXT}}`

### 4.3 External Integrations (if needed)

{{#if HAS_EXTERNAL_INTEGRATIONS}}
{{#each EXTERNAL_SERVICES}}
- [ ] **T{{ID}}** Integration with {{SERVICE_NAME}} in `src/integrations/{{SERVICE_NAME}}.{{EXT}}`
{{/each}}
{{/if}}

### Constitution Check (Phase 4)
- [ ] NO HARDCODED SECRETS - 使用环境变量
- [ ] NO RESOURCE LEAKS - 正确关闭连接
- [ ] 输入验证和清理完善
- [ ] 正确的身份验证和授权

---

## Phase 5: Polish (完善)

### 5.1 Unit Tests for Edge Cases

- [ ] **T{{ID}}** [P] Unit tests for validation logic in `tests/unit/test_validation.{{EXT}}`
- [ ] **T{{ID}}** [P] Unit tests for error handling in `tests/unit/test_errors.{{EXT}}`
- [ ] **T{{ID}}** [P] Unit tests for edge cases in `tests/unit/test_edge_cases.{{EXT}}`

### 5.2 Performance & Optimization

- [ ] **T{{ID}}** Performance tests (target: <200ms p95) in `tests/performance/`
- [ ] **T{{ID}}** Database query optimization
- [ ] **T{{ID}}** Caching strategy (if needed)

### 5.3 Documentation

- [ ] **T{{ID}}** [P] Update API documentation in `docs/api.md`
- [ ] **T{{ID}}** [P] Update user documentation in `docs/user-guide.md`
- [ ] **T{{ID}}** [P] Update CHANGELOG.md
- [ ] **T{{ID}}** [P] Add code comments for complex logic

### 5.4 Code Quality

- [ ] **T{{ID}}** Remove code duplication
- [ ] **T{{ID}}** Refactor complex functions (> 50 lines)
- [ ] **T{{ID}}** Run linter and fix all issues
- [ ] **T{{ID}}** Ensure test coverage ≥ 80%

### Constitution Check (Phase 5)
- [ ] 代码符合团队规范
- [ ] 测试覆盖率达标
- [ ] 文档完整
- [ ] 无安全问题

---

## Dependencies (依赖关系图)

```text
Phase 1 (Setup) → 必须最先完成
    ↓
Phase 2 (Tests) → 所有测试必须先写并失败
    ↓
TEST VERIFICATION CHECKPOINT → 验证所有测试都失败
    ↓
Phase 3 (Core) → 实现功能让测试通过
    ↓
Phase 4 (Integration) → 集成各个组件
    ↓
Phase 5 (Polish) → 完善和优化
```

### Critical Paths (关键路径):
- **Setup → Tests → Core**: 核心开发路径（必须顺序执行）
- **Core → Integration**: 集成依赖核心实现
- **All → Polish**: Polish 依赖所有其他阶段

### Specific Dependencies (具体依赖):
{{SPECIFIC_DEPENDENCIES}}

**示例**:
- T011 (User model) blocks T014 (UserService)
- T014 (UserService) blocks T017, T018, T019, T020 (User endpoints)
- T027 (Auth middleware) blocks T028 (Permissions)
- Tests (T004-T010) block Phase 3 start

---

## Parallel Execution Examples (并行执行示例)

**示例 1: Phase 2 Contract Tests (可并行)**
```bash
# 所有 contract tests 可以同时编写（不同文件）
Task T004: "Contract test POST /api/users"
Task T005: "Contract test GET /api/users/{id}"
Task T006: "Contract test PUT /api/users/{id}"
Task T007: "Contract test DELETE /api/users/{id}"
```

**示例 2: Phase 2 Integration Tests (可并行)**
```bash
# 所有 integration tests 可以同时编写（不同文件）
Task T008: "Integration test user registration"
Task T009: "Integration test user authentication"
Task T010: "Integration test user profile update"
```

**示例 3: Phase 3 Models (可并行)**
```bash
# 不同 models 可以同时实现（不同文件）
Task T011: "User model"
Task T012: "Post model"
Task T013: "Comment model"
```

**不能并行的示例**:
```bash
# 这些任务修改同一文件，必须顺序执行
Task T017: "POST /api/users endpoint" (修改 api/users.py)
Task T018: "GET /api/users/{id} endpoint" (修改 api/users.py)
# → 这两个任务不能标记 [P]
```

---

## Task Execution Notes (任务执行说明)

### TDD 原则
1. **Red**: 先写测试，确保失败 (Phase 2)
2. **Green**: 写最少的代码让测试通过 (Phase 3)
3. **Refactor**: 重构优化代码 (Phase 5)

### 标记完成
执行完一个任务后：
```bash
# 方式 1: 手动标记
- [x] T001 创建项目结构

# 方式 2: 使用脚本（推荐）
.claude/scripts/mark-task-complete.sh T001

# 方式 3: 在 Git commit 中标记
git commit -m "feat({{REQ_ID}}): Complete T001 - Create project structure"
```

### 验证清单
每个任务完成后检查：
- [ ] 功能完整实现（NO PARTIAL）
- [ ] 相关测试通过
- [ ] 代码通过 linter
- [ ] 无代码重复
- [ ] 添加必要注释
- [ ] 更新相关文档

### 提交规范
```bash
feat({{REQ_ID}}): Complete T001 - Create project structure
^       ^              ^            ^
类型    需求ID         任务ID        简短描述

# 提交类型:
# feat: 新功能
# fix: 修复
# test: 测试
# docs: 文档
# refactor: 重构
```

---

## Task Generation Rules (任务生成规则)
*这些规则由 planner agent 在执行 Execution Flow 时应用*

### 1. From API Contracts
- 每个 contract 文件 → 一个 contract test 任务 [P]
- 每个 endpoint → 一个实现任务
- Contract test 任务在 Phase 2, 实现任务在 Phase 3

### 2. From Data Model
- 每个 entity → 一个 model 创建任务 [P]
- Relationships → service layer 任务

### 3. From User Stories
- 每个 story → 一个 integration test 任务 [P]
- Quickstart scenarios → validation 任务

### 4. Ordering Rules
- Setup → Tests → Models → Services → Endpoints → Integration → Polish
- Dependencies 阻止并行执行
- 相同文件的任务不能并行

### 5. Parallel Rules
- 不同文件 = 可以 [P]
- 同一文件 = 不能 [P]
- 有依赖 = 不能 [P]
- 测试任务 = 通常可以 [P]

---

## Validation Checklist (验证清单)
*GATE: 由 planner 在生成 tasks.md 后检查*

### Completeness (完整性)
- [ ] 所有 API contracts 都有对应的 contract tests
- [ ] 所有 data entities 都有对应的 model tasks
- [ ] 所有 user stories 都有对应的 integration tests
- [ ] 所有 API endpoints 都有对应的实现任务

### TDD Compliance (TDD 符合性)
- [ ] 所有 tests 都在 Phase 2 (Tests First)
- [ ] 所有 implementation 都在 Phase 3 之后
- [ ] 有明确的 TEST VERIFICATION CHECKPOINT
- [ ] Test tasks 明确标注 "预期失败"

### Parallel Safety (并行安全性)
- [ ] 所有 [P] 标记的任务都操作不同文件
- [ ] 同一文件的任务没有 [P] 标记
- [ ] 有依赖关系的任务没有 [P] 标记

### Path Specificity (路径明确性)
- [ ] 每个任务都指定了具体的文件路径
- [ ] 路径使用了正确的项目结构约定
- [ ] 测试文件路径遵循 tests/ 目录结构

### Constitution Alignment (宪法符合性)
- [ ] 没有违反 NO PARTIAL IMPLEMENTATION
- [ ] 没有违反 NO CODE DUPLICATION
- [ ] 没有违反 NO OVER-ENGINEERING
- [ ] 所有安全原则都有对应的任务

### Dependency Correctness (依赖正确性)
- [ ] Dependencies 部分列出了所有关键依赖
- [ ] 没有循环依赖
- [ ] 依赖链清晰可追溯

---

## Progress Tracking (进度跟踪)
*在执行过程中更新*

### Overall Progress
- [ ] Phase 1: Setup ({{SETUP_TASKS_COUNT}} tasks)
- [ ] Phase 2: Tests First ({{TEST_TASKS_COUNT}} tasks)
- [ ] **CHECKPOINT**: All tests failing ✗
- [ ] Phase 3: Core Implementation ({{CORE_TASKS_COUNT}} tasks)
- [ ] Phase 4: Integration ({{INTEGRATION_TASKS_COUNT}} tasks)
- [ ] Phase 5: Polish ({{POLISH_TASKS_COUNT}} tasks)

### Test Coverage Status
- Contract Tests: {{CONTRACT_TESTS_PASSED}} / {{CONTRACT_TESTS_TOTAL}}
- Integration Tests: {{INTEGRATION_TESTS_PASSED}} / {{INTEGRATION_TESTS_TOTAL}}
- Unit Tests: {{UNIT_TESTS_PASSED}} / {{UNIT_TESTS_TOTAL}}
- Coverage: {{COVERAGE_PERCENTAGE}}%

### Constitution Compliance
- [ ] Initial Constitution Check: PASS
- [ ] Post-Implementation Constitution Check: PENDING
- [ ] Security Scan: PENDING
- [ ] Code Review: PENDING

---

## Notes (注意事项)

### Critical Rules
1. **[P] = Parallel**: 只有不同文件、无依赖的任务才能标记 [P]
2. **Tests First**: Phase 2 必须在 Phase 3 之前完成
3. **Verify Failure**: 进入 Phase 3 前必须验证所有测试都失败
4. **Commit Early**: 每完成一个任务就提交

### Common Pitfalls (常见陷阱)
- ❌ 在写测试之前写实现
- ❌ 测试通过了但不应该通过（说明有遗漏的实现）
- ❌ 标记 [P] 但任务修改同一文件
- ❌ 任务描述模糊，没有指定具体文件路径
- ❌ 跳过测试验证 checkpoint

### Best Practices (最佳实践)
- ✅ 测试先行，确保失败
- ✅ 一次只做一个任务
- ✅ 频繁提交，小步前进
- ✅ 运行测试套件验证
- ✅ Code review 每个 PR

---

**Generated by**: planner agent
**Based on**: PRD.md, EPIC.md
**Constitution**: v2.1.1
**Template Version**: 2.0.0 (Spec-Kit inspired)

---

## 相关文档

- **PRD**: `.claude/docs/requirements/{{REQ_ID}}/PRD.md`
- **EPIC**: `.claude/docs/requirements/{{REQ_ID}}/EPIC.md`
- **Constitution**: `.claude/constitution/project-constitution.md`
- **Execution Log**: `.claude/docs/requirements/{{REQ_ID}}/EXECUTION_LOG.md`