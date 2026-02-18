# Project Context

## devflow-conventions

# CC-DevFlow 工作流约定

> **类型**: 工作流约定 (Workflow Conventions)
> **适用**: CC-DevFlow 需求开发流程
> **层级**: Rules Layer (具体约定和格式)
> **前置**: 遵循 Constitution 和 Core Patterns

---

## 🎯 核心约定

### REQ-ID 格式规范
- **格式**: `REQ-\d+` (例如: REQ-123, REQ-001)
- **唯一性**: 在当前仓库范围内必须唯一
- **禁止**: 重复使用已存在的 REQ-ID

### 命令参数格式
```bash
# 标准格式
/flow-new "REQ-123|支持用户下单|https://plan.example.com/Q1"

# 多文档格式
/flow-new "REQ-124|权限管理|https://spec.doc,https://api.doc"

# 无外部文档
/flow-new "REQ-125|数据导出"
```

---

## 📁 文件组织约定

### 目录结构
```text
devflow/requirements/${reqId}/
├── PRD.md                      # 产品需求文档
├── UI_PROTOTYPE.html           # UI原型 ⚡️ 条件生成 (仅UI需求)
├── EPIC.md                     # Epic 规划
├── TASKS.md                    # 任务分解 (单文件管理所有任务)
├── tasks/                      # 任务执行文档
│   └── IMPLEMENTATION_PLAN.md  # dev-implementer 输出
├── research/                   # 研究资料
│   ├── ${reqId}_plan_1.md
│   ├── ${reqId}_plan_2.md
│   └── ui_design_strategy.md   # UI设计策略 (可选)
├── TEST_PLAN.md                # 测试计划
├── TEST_REPORT.md              # 测试报告
├── SECURITY_PLAN.md            # 安全计划
├── SECURITY_REPORT.md          # 安全报告
├── RELEASE_PLAN.md             # 发布计划
└── EXECUTION_LOG.md            # 执行日志
```

### 文档命名约定
- **PRD 文件**: `PRD.md`
- **Epic 文件**: `EPIC.md`
- **Tasks 文件**: `TASKS.md` (所有任务集中在一个文件，通过 checkbox 标记完成状态)
- **研究文件**: `${reqId}_plan_{序号}.md`
- **测试报告**: `TEST_REPORT.md`
- **执行日志**: `EXECUTION_LOG.md`

---

## 🌿 Git 约定

> Git 分支、worktree、PR、合并由用户自行管理，DevFlow 不参与 Git 拓扑管理。

---

## 💬 提交信息约定

### 提交格式
```text
{type}({reqId}): {taskTitle}

{详细描述}

- 实现功能点1
- 实现功能点2

Co-authored-by: Claude <claude@anthropic.com>
```

### 提交类型
- `feat(REQ-xxx)`: 新功能
- `fix(REQ-xxx)`: 错误修复
- `docs(REQ-xxx)`: 文档更新
- `test(REQ-xxx)`: 测试添加/修改
- `refactor(REQ-xxx)`: 重构
- `chore(REQ-xxx)`: 构建、配置等杂务

---

## 🤖 子代理调用约定

### 调用顺序 (7个阶段)
```text
1. flow-init      → 初始化需求结构
   ↓
2. flow-prd       → prd-writer (研究型) → PRD.md
   ↓
2.5 flow-ui       → ui-designer (研究型) → UI_PROTOTYPE.html ⚡️ 条件触发
   ↓              仅在检测到UI需求时自动执行
3. flow-epic      → planner (研究型) → EPIC.md + TASKS.md
   ↓              如存在UI_PROTOTYPE.html, 自动集成UI上下文
4. flow-dev       → dev-implementer (研究型, 每个任务) → IMPLEMENTATION_PLAN.md
                  → main-agent (执行型) → 代码实现
   ↓              前端任务会引用UI_PROTOTYPE.html
5. flow-qa        → qa-tester (研究型) → TEST_PLAN.md
                  → security-reviewer (研究型) → SECURITY_PLAN.md
                  → main-agent (执行型) → 运行测试、安全扫描
   ↓
6. flow-release   → release-manager (研究型) → RELEASE_PLAN.md
                  → main-agent (执行型) → 创建PR、合并
```

### 状态同步约定
- 每个阶段完成后更新 `orchestration_status.json`
- 每个任务完成后更新 `TASKS.md` 中的 checkbox (`- [ ]` → `- [x]`)
- 所有重要操作记录到 `EXECUTION_LOG.md`

---

## ⚠️ 错误处理约定

### 错误分类
1. **参数错误**: 命令格式、REQ-ID 格式等
2. **环境错误**: Git状态、权限、依赖等
3. **网络错误**: URL访问失败
4. **质量闸错误**: 代码质量不达标
5. **系统错误**: 子代理异常、文件操作失败

### 错误恢复命令
```bash
# 从特定阶段继续
/flow-restart "REQ-123" --from=prd
/flow-restart "REQ-123" --from=dev
/flow-restart "REQ-123" --from=qa
```

### 错误日志格式
```yaml
---
error_type: parameter_error
timestamp: 2024-01-15T10:30:00Z
req_id: REQ-123
step: parameter_parsing
---

# 错误详情
参数格式不正确：缺少标题部分

## 解决方案
请使用正确格式：/flow-new "REQ-123|需求标题|计划URL"
```

---

## 📊 文档元数据约定

### YAML Frontmatter 格式
```yaml
---
req_id: "REQ-123"
title: "支持用户下单"
created_at: "2024-01-15T10:00:00Z"
updated_at: "2024-01-15T15:30:00Z"
version: "1.0.0"
status: "completed"
author: "prd-writer"
---
```

---

## 🎯 性能指标约定

### 时间要求
- **整个流程**: 90% 情况下在 15 分钟内完成
- **单个任务**: 实施时间不超过 5 分钟
- **质量闸检查**: 不超过 2 分钟

### 资源约束
- **内存占用**: < 500MB (峰值)
- **并发需求**: 支持 3 个并发需求
- **文档数量**: 支持 1000 个需求文档

---

## ⚙️ 配置约定

### .claude/settings.json 配置项
```json
{
  "devflow": {
    "baseBranch": "main",
    "autoApprove": false,
    "qualityGate": {
      "minCoverage": 80,
      "strictMode": true
    },
    "templates": {
      "customPrdTemplate": ".claude/templates/custom-prd.md"
    }
  }
}
```

### 环境变量
```bash
# 调试模式
export FLOW_DEBUG=1

# 超时设置 (秒)
export FLOW_TIMEOUT=300

# 最小测试覆盖率
export MIN_COVERAGE=80
```

---

## 🔧 工具集成约定

### 钩子脚本
- `pre-push-guard.sh`: 推送前质量检查
- `markdown_formatter.py`: 文档格式化
- `auto-progress-update.py`: 进度自动更新

### 测试脚本
- `.claude/tests/run-all-tests.sh`: 运行所有测试
- `.claude/tests/scripts/test_*.sh`: 单个测试套件

---

## 🛠️ 故障排除约定

### 环境检查
```bash
# 检查 Git 状态
git status

# 检查 GitHub CLI
gh auth status

# 检查 npm 脚本
npm run --silent

# 检查权限
ls -la .claude/
```

### 日志查看
```bash
# 查看执行日志
tail -f devflow/requirements/REQ-123/EXECUTION_LOG.md

# 查看错误日志
tail -f .claude/logs/flow-*.log
```

---

## 📋 最佳实践清单

### 开始新需求前
- [ ] 确认 REQ-ID 唯一性
- [ ] 准备完整的需求输入 (标题 + 可选URL)
- [ ] 确保 Git 工作目录干净
- [ ] 在 main 分支上启动

### 开发过程中
- [ ] 遵循 TDD 顺序 (Tests First → Implementation)
- [ ] 每个任务完成后立即提交
- [ ] 定期同步主分支
- [ ] 及时更新文档

### 发布前检查
- [ ] 所有测试通过
- [ ] 测试覆盖率 ≥ 80%
- [ ] 安全扫描无高危问题
- [ ] 文档完整且格式正确

---

**重要提示**: 所有约定都是强制性的。这些约定确保 CC-DevFlow 工作流的一致性和可预测性。


---

## project-constitution

# CC-DevFlow Project Constitution

> **Version**: v2.1.0
> **Effective Date**: 2025-01-10
> **Last Amended**: 2026-01-08
> **Status**: Active
> **Amendment Process**: See Section IX

---

## Preamble

This Constitution establishes the **immutable architectural DNA** of the CC-DevFlow project. It serves as the highest authority governing all development activities, ensuring quality, consistency, security, and maintainability across the entire lifecycle.

**Constitutional Authority**:
1. **Supreme Priority**: Constitutional principles override all other rules and conventions
2. **Inviolable**: No agent, process, or individual may violate constitutional principles
3. **Persistent**: The Constitution remains effective throughout the project lifecycle
4. **Universal**: Applies to all requirements, all stages, all agents

---

## Article I: Quality First (质量至上)

**Principle**: Quality is the non-negotiable baseline.

### The Iron Law

```
NO PARTIAL IMPLEMENTATION - COMPLETE OR NOTHING
```

### Rationalization Defense

> See [rationalization-library.md](./rationalization-library.md#article-i-quality-first---rationalization-table) for full table.

| Excuse | Reality |
|--------|---------|
| "This is simplified for now" | CONSTITUTIONAL VIOLATION. Complete it or don't ship it. |
| "Will complete in v2" | Future versions don't exist. Implement fully now. |
| "80% is good enough" | 80% = broken for 20% of users. Not good enough. |

### Red Flags - STOP

If you find yourself thinking:
- "This is good enough for now"
- "I'll fix it before PR"
- "Core logic works, edge cases later"

**STOP. You are rationalizing. Complete the implementation or don't ship.**

### I.1 Complete Implementation Mandate

```yaml
NO PARTIAL IMPLEMENTATION:
  Prohibition: Any form of partial implementation or placeholder code
  Requirement: Complete implementation or no implementation
  Examples:
    ❌ Forbidden: "// TODO: Implement this later"
    ❌ Forbidden: "// Simplified for now, will complete in v2"
    ✅ Required: Fully functional, production-ready code
```

### I.2 Testing Mandate

```yaml
MANDATORY TEST COVERAGE:
  Rule: Every function must have corresponding tests
  Coverage Threshold: ≥80%
  Test Types: Unit, Integration, Contract, E2E (as appropriate)
  Verification: Tests must fail first (TDD), then pass
```

### I.3 No Simplification Clause

```text
"This is simplified for now, complete implementation would..."
↑ CONSTITUTIONAL VIOLATION - Immediate rejection
```

### I.4 Quality Gates

All code must pass:
- [ ] Type checking (TypeScript, Python type hints, etc.)
- [ ] Linting (ESLint, Pylint, etc.)
- [ ] Security scanning (no high-severity issues)
- [ ] Build verification
- [ ] Documentation completeness

**Enforcement**: Pre-push guard (`pre-push-guard.sh`)

---

## Article II: Architectural Consistency (架构一致性)

**Principle**: Maintain codebase uniformity and predictability.

### The Iron Law

```
REUSE EXISTING CODE - NO DUPLICATION
```

### Rationalization Defense

> See [rationalization-library.md](./rationalization-library.md#article-ii-architectural-consistency---rationalization-table) for full table.

| Excuse | Reality |
|--------|---------|
| "Faster to rewrite" | Faster now = slower forever. Find and reuse. |
| "Slightly different use case" | Extract common, parameterize difference. |
| "I understand my version better" | Understand the shared version. That's your job. |

### Red Flags - STOP

If you find yourself thinking:
- "That code is messy, I'll write my own"
- "I don't have time to search"
- "It's just a small function"

**STOP. Search the codebase. Reuse or refactor existing code.**

### II.1 No Code Duplication

```yaml
REUSE MANDATE:
  Before Writing New Code:
    1. Search existing codebase for similar functionality
    2. Use Read/Grep/Glob tools to find reusable functions
    3. Prefer function call over copy-paste

  Violation Examples:
    ❌ Copying validation logic across files
    ❌ Duplicate database connection code
    ❌ Repeated error handling patterns
```

### II.2 Consistent Naming

```yaml
NAMING CONSISTENCY:
  Requirement: Follow existing codebase naming patterns
  Process:
    1. Read existing files before naming new entities
    2. Match verb-noun patterns (getUserById, createOrder)
    3. Match case conventions (camelCase, snake_case)

  Tools: Use Grep to find naming patterns in codebase
```

### II.3 Anti-Over-Engineering

```yaml
SIMPLICITY MANDATE:
  Prohibited Patterns:
    ❌ BaseController, AbstractService, GenericRepository
    ❌ Factory patterns for simple object creation
    ❌ Middleware layers with single responsibility
    ❌ "Future-proofing" abstractions

  Required Approach:
    ✅ Direct framework usage (Express, FastAPI, Flask)
    ✅ Solve current problem with simplest solution
    ✅ Refactor when actual need emerges
```

### II.4 Single Responsibility

```yaml
MODULE COHESION:
  Rule: Each module/class/function has ONE reason to change
  File Size Limit: ≤500 lines per file
  Function Length Limit: ≤50 lines per function

  Violation Indicators:
    - File has multiple unrelated imports
    - Function has multiple if-else branches for different concerns
    - Class name contains "And" or "Manager" or "Helper"
```

**Enforcement**: Phase -1 Anti-Abstraction Gate (EPIC_TEMPLATE.md)

---

## Article III: Security First (安全优先)

**Principle**: Security is foundational, not an afterthought.

### The Iron Law

```
NO HARDCODED SECRETS - ENVIRONMENT VARIABLES ONLY
```

### Rationalization Defense

> See [rationalization-library.md](./rationalization-library.md#article-iii-security-first---rationalization-table) for full table.

| Excuse | Reality |
|--------|---------|
| "It's just for testing" | Commits are forever. Use env vars even for tests. |
| "I'll remove it before commit" | You won't. You'll forget. Use env vars. |
| "Local development only" | Local becomes production. Start secure. |

### Red Flags - STOP

If you find yourself thinking:
- "Nobody will see the repo"
- "It's not a real secret"
- "I'll rotate it later"

**STOP. Never commit secrets. Use environment variables from the start.**

### III.1 No Hardcoded Secrets

```yaml
SECRET MANAGEMENT:
  Prohibited:
    ❌ API_KEY = "sk-abc123..." in source code
    ❌ PASSWORD = "admin123" in config files
    ❌ JWT_SECRET embedded in code

  Required:
    ✅ Environment variables (.env files, not committed)
    ✅ Secret management services (AWS Secrets Manager, etc.)
    ✅ Configuration injection at runtime

  Detection: Pre-push guard scans for secret patterns
```

### III.2 Input Validation

```yaml
VALIDATION MANDATE:
  Rule: All external inputs must be validated BEFORE processing
  Scope:
    - User inputs (forms, API requests)
    - File uploads
    - Database query results (防止 SQL injection)
    - Environment variables

  Validation Types:
    - Type checking
    - Range validation
    - Format validation (regex)
    - Sanitization (XSS prevention)
```

### III.3 Principle of Least Privilege

```yaml
PERMISSION CONTROL:
  Default: Deny all, explicitly allow needed permissions
  File Permissions: Minimal necessary (no 777)
  Database Access: Read-only when possible
  API Scopes: Request minimum required scopes
```

### III.4 Secure by Default

```yaml
DEFAULT SECURITY:
  Examples:
    ✅ HTTPS by default, not HTTP
    ✅ CORS with explicit origin whitelist
    ✅ Authentication required unless explicitly public
    ✅ Rate limiting enabled by default
```

**Enforcement**: Security-reviewer agent + pre-push security scan

---

## Article IV: Performance Accountability (性能责任)

**Principle**: Performance is user experience; proactive optimization required.

### The Iron Law

```
NO RESOURCE LEAKS - ALWAYS CLEANUP
```

### Rationalization Defense

> See [rationalization-library.md](./rationalization-library.md#article-iv-performance-accountability---rationalization-table) for full table.

| Excuse | Reality |
|--------|---------|
| "Garbage collector will handle it" | GC doesn't close files/connections. Explicit cleanup. |
| "Small leak, won't matter" | Small leaks become big crashes. Fix now. |
| "Framework handles it" | Verify that. Don't assume. |

### Red Flags - STOP

If you find yourself thinking:
- "It's a short-lived process"
- "I'll add cleanup later"
- "Only happens in edge case"

**STOP. Add cleanup with creation. Edge cases run in production.**

### IV.1 No Resource Leaks

```yaml
RESOURCE MANAGEMENT:
  Mandatory Cleanup:
    - Database connections (use connection pooling)
    - File handles (use with/try-finally)
    - Event listeners (removeEventListener)
    - Timers (clearTimeout, clearInterval)
    - HTTP connections (connection.close())

  Pattern:
    try:
        resource = acquire_resource()
        use_resource(resource)
    finally:
        resource.close()  # MUST execute
```

### IV.2 Algorithm Efficiency

```yaml
COMPLEXITY AWARENESS:
  Before Implementation:
    - Choose appropriate data structure (Array vs Set vs Map)
    - Avoid O(n²) when O(n) exists
    - Use binary search for sorted data

  Review Triggers:
    - Nested loops over same dataset
    - Repeated database queries in loops
    - Full table scans
```

### IV.3 Lazy Loading

```yaml
ON-DEMAND LOADING:
  Apply To:
    - Large datasets (pagination)
    - Heavy dependencies (dynamic import)
    - Images/media (lazy loading)
    - Database records (streaming)

  Example:
    ❌ loadAllUsers()  # Loads 1M users into memory
    ✅ getUsersPaginated(page, limit)  # Loads 50 at a time
```

### IV.4 Caching Strategy

```yaml
INTELLIGENT CACHING:
  When to Cache:
    ✅ Expensive computations with stable inputs
    ✅ External API responses with TTL
    ✅ Database query results (with invalidation)

  When NOT to Cache:
    ❌ User-specific sensitive data
    ❌ Real-time data requirements
    ❌ Infrequently accessed data
```

**Enforcement**: Performance profiling in QA stage

---

## Article V: Maintainability (可维护性)

**Principle**: Code must be understandable, modifiable, and extensible.

### The Iron Law

```
NO DEAD CODE - USE IT OR DELETE IT
```

### Rationalization Defense

> See [rationalization-library.md](./rationalization-library.md#article-v-maintainability---rationalization-table) for full table.

| Excuse | Reality |
|--------|---------|
| "Might need it later" | Git history exists. Delete now, retrieve if needed. |
| "It's just commented out" | Commented code = noise. Delete it. |
| "Too risky to delete" | Tests exist. If tests pass after delete, it's safe. |

### Red Flags - STOP

If you find yourself thinking:
- "Reference for future work"
- "Someone else might need it"
- "I worked hard on this"

**STOP. Sunk cost fallacy. Delete dead code. Git remembers.**

### V.1 No Dead Code

```yaml
CODE HYGIENE:
  Rule: Use it or delete it, no middle ground

  Dead Code Patterns:
    ❌ Commented-out code blocks
    ❌ Unused imports
    ❌ Unreachable branches (if false:)
    ❌ Functions with no callers

  Tools: Use IDE "Find Usages" before writing new code
```

### V.2 Separation of Concerns

```yaml
CLEAR BOUNDARIES:
  Prohibited Mixing:
    ❌ Validation logic inside API handlers
    ❌ Database queries inside UI components
    ❌ Business logic in presentation layer

  Required Separation:
    ✅ Models (data structure)
    ✅ Services (business logic)
    ✅ Controllers (request handling)
    ✅ Views (presentation)
```

### V.3 Documentation

```yaml
DOCUMENTATION MANDATE:
  Required Documentation:
    - Complex algorithms (why this approach)
    - Business logic (domain rules)
    - Public APIs (parameters, return types, examples)
    - Configuration options

  Format:
    - Inline comments for WHY, not WHAT
    - Docstrings for public functions
    - README for modules
```

### V.4 File Size Limits

```yaml
SIZE CONSTRAINTS:
  Single File: ≤500 lines (including comments)
  Single Function: ≤50 lines

  Violation Response:
    - Extract functions/classes to separate files
    - Split by responsibility
    - Use modules for grouping
```

**Enforcement**: Linting rules + code review

---

## Article VI: Test-First Development (测试优先开发)

**Principle**: Tests define behavior; implementation makes tests pass.

### The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

### Rationalization Defense

> See [rationalization-library.md](./rationalization-library.md#article-vi-test-first-development---rationalization-table) for full table.

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |
| "TDD slows me down" | TDD faster than debugging. Pragmatic = test-first. |
| "This is different because..." | No. This is rationalization. Follow the law. |

### Red Flags - STOP

If you find yourself thinking:
- "Just this once"
- "I'm being pragmatic, not dogmatic"
- "Spirit not letter"
- "Need to explore first" (without deleting exploration code)

**STOP. You are rationalizing. Delete the code. Write the test first.**

### VI.1 TDD Mandate (NON-NEGOTIABLE)

```yaml
STRICT TDD SEQUENCE:
  Phase 2: Write Tests FIRST ⚠️
    - Contract tests
    - Integration tests
    - E2E tests
    - Unit tests

  TEST VERIFICATION CHECKPOINT:
    → All tests MUST fail initially
    → If test passes immediately → ERROR (invalid test)

  Phase 3: Write Implementation
    → Goal: Make tests pass
    → Refactor while keeping tests green
```

### VI.2 Test Independence

```yaml
INDEPENDENT TESTS:
  Rule: Each test must run in isolation

  Prohibited:
    ❌ Tests depending on execution order
    ❌ Shared mutable state between tests
    ❌ Tests modifying global variables

  Required:
    ✅ Setup before each test
    ✅ Teardown after each test
    ✅ Mock external dependencies
```

### VI.3 Meaningful Tests

```yaml
TEST QUALITY:
  Prohibited "Cheater Tests":
    ❌ assert True  # Always passes
    ❌ assert result is not None  # Too weak
    ❌ Mock everything, test nothing

  Required:
    ✅ Test actual behavior, not implementation
    ✅ Use realistic test data
    ✅ Verify error cases, not just happy path
```

**Enforcement**: TEST VERIFICATION CHECKPOINT in TASKS.md

---

## Article VII: Simplicity Gate (简单性闸门)

**Principle**: Default to simplicity; complexity requires justification.

### The Iron Law

```
MAXIMUM 3 PROJECTS - JUSTIFY ANY ADDITIONAL COMPLEXITY
```

### Rationalization Defense

> See [rationalization-library.md](./rationalization-library.md#article-vii-simplicity-gate---rationalization-table) for full table.

| Excuse | Reality |
|--------|---------|
| "Microservices are better" | For your scale? Monolith is simpler. Start there. |
| "Future scalability" | YAGNI. Scale when you need to. |
| "Best practices say..." | Best practices assume scale you don't have. |

### Red Flags - STOP

If you find yourself thinking:
- "Separation of concerns" (as justification for new project)
- "Team autonomy"
- "We might need it"

**STOP. Build for now. Refactor when needed. Complexity is the enemy.**

### VII.1 Project Count Limit

```yaml
MAXIMUM 3 PROJECTS/MODULES:
  Rule: Use ≤3 distinct projects/services

  If >3 needed:
    → Must fill Complexity Tracking table in EPIC.md
    → Justify why simpler alternative insufficient
    → Document mitigation strategy
```

### VII.2 No Future-Proofing

```yaml
YAGNI ENFORCEMENT:
  Prohibited:
    ❌ "Reserved interfaces" for future features
    ❌ "Extension points" with no current use
    ❌ "Generic framework" when specific solution exists
    ❌ "Will need this later" abstractions

  Required:
    ✅ Implement ONLY what current requirement needs
    ✅ Refactor when new requirement emerges
```

**Enforcement**: Phase -1 Simplicity Gate in EPIC_TEMPLATE.md

---

## Article VIII: Anti-Abstraction (反抽象)

**Principle**: Trust frameworks; avoid unnecessary wrapping.

### The Iron Law

```
USE FRAMEWORKS DIRECTLY - NO UNNECESSARY WRAPPERS
```

### Rationalization Defense

> See [rationalization-library.md](./rationalization-library.md#article-viii-anti-abstraction---rationalization-table) for full table.

| Excuse | Reality |
|--------|---------|
| "Abstraction for future flexibility" | YAGNI. You won't switch frameworks. |
| "Cleaner interface" | Framework interface IS clean. Learn it. |
| "Easier testing" | Mock the framework. Don't wrap it. |

### Red Flags - STOP

If you find yourself thinking:
- "Hide implementation details"
- "Consistent with other projects"
- "Best practice pattern"

**STOP. Use the framework directly. Wrappers add complexity, not value.**

### VIII.1 Direct Framework Usage

```yaml
FRAMEWORK TRUST:
  Prohibited Wrappers:
    ❌ BaseController extending Express/FastAPI
    ❌ DatabaseService wrapping ORM
    ❌ CacheManager wrapping Redis client

  Required:
    ✅ Use Express/FastAPI/Flask directly
    ✅ Use ORM (Prisma/SQLAlchemy) directly
    ✅ Use libraries as intended
```

### VIII.2 Single Model Representation

```yaml
ONE ENTITY, ONE REPRESENTATION:
  Prohibited:
    ❌ UserDTO → User Entity → UserViewModel
    ❌ Multiple mappings between layers

  Required:
    ✅ One User model used across layers
    ✅ Add fields as needed, don't transform
```

**Enforcement**: Phase -1 Anti-Abstraction Gate in EPIC_TEMPLATE.md

---

## Article IX: Integration-First Testing (集成优先测试)

**Principle**: Test with real environments, not mocks.

### The Iron Law

```
CONTRACTS FIRST - REAL ENVIRONMENTS
```

### Rationalization Defense

> See [rationalization-library.md](./rationalization-library.md#article-ix-integration-first-testing---rationalization-table) for full table.

| Excuse | Reality |
|--------|---------|
| "Unit tests are faster" | Fast wrong tests waste time. Integration tests catch real bugs. |
| "Mocks are simpler" | Mocks hide integration issues. Real databases find them. |
| "In-memory database works" | In-memory differs from production. Test with real DB. |

### Red Flags - STOP

If you find yourself thinking:
- "CI is slow"
- "Docker is complex"
- "We can mock this"

**STOP. Production bugs are expensive. Test with real environments.**

### IX.1 Contract-First

```yaml
CONTRACT DEFINITION:
  Sequence:
    1. Define API contracts BEFORE implementation
    2. Write contract tests in Phase 2
    3. Implement to satisfy contracts in Phase 3

  Tools:
    - OpenAPI specifications
    - GraphQL schemas
    - gRPC proto files
```

### IX.2 Real Environment Testing

```yaml
INTEGRATION TESTING:
  Preferred:
    ✅ Real database (use Docker for local)
    ✅ Real message queue
    ✅ Real cache (Redis)

  Avoid:
    ❌ Mocking database layer
    ❌ In-memory substitutes (unless testing speed critical)
```

**Enforcement**: Phase -1 Integration-First Gate in EPIC_TEMPLATE.md

---

## Article X: Requirement Boundary (需求边界)

**Principle**: Implement what's requested, nothing more.

### The Iron Law

```
IMPLEMENT WHAT'S REQUESTED, NOTHING MORE
```

### Rationalization Defense

> See [rationalization-library.md](./rationalization-library.md#article-x-requirement-boundary---rationalization-table) for full table.

| Excuse | Reality |
|--------|---------|
| "User might need this later" | User didn't ask. Don't add. YAGNI. |
| "It's just a small addition" | Small additions compound. Scope creep. |
| "I'm being helpful" | Helpful = following spec. Unhelpful = scope creep. |

### Red Flags - STOP

If you find yourself thinking:
- "While I'm here anyway"
- "It's only 5 more lines"
- "User will thank me"
- "This is a natural extension"

**STOP. Stay on task. Create separate requirement for extensions.**

### X.1 Forced Clarification

```yaml
[NEEDS CLARIFICATION] MANDATE:
  Rule: Mark ALL ambiguities explicitly

  Prohibited:
    ❌ Guessing user intent
    ❌ Adding "helpful" features not requested
    ❌ Assuming technical details

  Required:
    ✅ Use [NEEDS CLARIFICATION: specific question]
    ✅ Wait for user clarification
    ✅ Document assumptions made
```

### X.2 No Speculative Features

```yaml
ANTI-EXPANSION:
  Prohibited Phrases:
    ❌ "May need in the future..."
    ❌ "Should also add..."
    ❌ "Might want to consider..."

  Required:
    ✅ Only implement explicitly requested features
    ✅ Focus on current user stories
```

### X.3 User Story Independence

```yaml
STORY ISOLATION:
  Each User Story Must Have:
    - Explicit priority (P1, P2, P3...)
    - Independent Test criteria
    - Standalone deliverability (can ship as MVP)

  Organization:
    - Tasks organized by user story [US1], [US2], [US3]
    - Each story testable independently
```

**Enforcement**:
- PRD anti-expansion validation checklist (prd-writer agent)
- validate-scope-boundary.sh script

---

## Immutable Constraints

### Workflow Constraints

1. **Standard Flow Mandate**: All development through `/flow-init` → `/flow-prd` → `/flow-epic` → `/flow-dev` → `/flow-qa` → `/flow-release`
2. **No Gate Skipping**: Quality gates (Entry/Exit) cannot be bypassed
3. **Document-Driven**: Important decisions must be documented
4. **Version Control**: All changes through Git

### Agent Behavior Constraints

1. **Main Agent Authority**: Only main agent (Claude) may execute code modifications
2. **Research Agent Role**: Research agents (prd-writer, planner, etc.) only analyze and output documents
3. **Coordination**: Agents must coordinate via `orchestration_status.json`
4. **Error Handling**: Agents must stop and report errors, not ignore

### Technology Choice Constraints

1. **Existing Stack First**: Prefer project's existing technologies
2. **Backward Compatibility**: New features must not break existing functionality
3. **Dependency Evaluation**: New dependencies require justification
4. **Standards Compliance**: Follow industry best practices

---

## Constitutional Violations

### Severity Levels

#### Minor Violations
- **Examples**: Inconsistent code style, missing documentation
- **Consequence**: Immediate correction required, re-review

#### Moderate Violations
- **Examples**: Partial implementation, missing tests, security risks
- **Consequence**: Block commit, mandatory fix

#### Severe Violations
- **Examples**: Hardcoded secrets, resource leaks, architectural destruction
- **Consequence**: Immediate rollback, comprehensive audit

---

## Amendment Process

### Amendment Principles

1. **Cautious Amendment**: Constitutional changes require careful justification
2. **Backward Compatible**: Amendments must not break existing commitments
3. **Community Consensus**: Major amendments need broad discussion
4. **Version Tracking**: All amendments tracked with semantic versioning

### Amendment Procedure

```yaml
Amendment Workflow:
  1. Proposal:
     - Submit amendment proposal with rationale
     - Document affected Articles and implications
     - Provide migration strategy

  2. Review:
     - Community discussion (minimum 7 days)
     - Impact analysis (compatibility-checker agent)
     - Test amendment in isolated environment

  3. Approval:
     - Requires consensus or majority vote
     - Update Constitution version (MAJOR.MINOR.PATCH)
     - Generate Sync Impact Report

  4. Propagation:
     - Update all templates referencing amended Articles
     - Update agent instructions
     - Update validation scripts
     - Notify all stakeholders
```

### Versioning Scheme

```yaml
Version Format: MAJOR.MINOR.PATCH

MAJOR (e.g., 1.0.0 → 2.0.0):
  - Fundamental principle changes
  - Breaking changes to existing rules
  - Requires full codebase audit

MINOR (e.g., 2.0.0 → 2.1.0):
  - New Article additions
  - Non-breaking clarifications
  - Enhanced enforcement mechanisms

PATCH (e.g., 2.1.0 → 2.1.1):
  - Typo corrections
  - Example updates
  - Documentation improvements
```

---

## Constitutional Enforcement

### Four-Layer Defense System

```text
Layer 1: Template Hard Constraints
  ↓
  - PRD_TEMPLATE.md: ANTI-EXPANSION RULES (Article X)
  - EPIC_TEMPLATE.md: Phase -1 Gates (Articles VII, VIII, IX)
  - TASKS_TEMPLATE.md: TDD enforcement (Article VI)

Layer 2: Command-Level Enforcement
  ↓
  - /flow-constitution: Update and propagate Constitution
  - /flow-verify: Consistency checking across documents

Layer 3: Agent-Level Constraints
  ↓
  - prd-writer: Anti-Expansion Validation Checklist
  - planner: Phase -1 Gate Enforcement
  - dev-implementer: TDD Sequence Validation
  - qa-tester: Test Quality Standards
  - security-reviewer: Security Mandate Compliance

Layer 4: Validation Scripts
  ↓
  - validate-scope-boundary.sh: Boundary compliance
  - validate-constitution.sh: Constitutional compliance
  - pre-push-guard.sh: Pre-commit quality gates
```

### Compliance Checklist

**Before Code Commit**:
- [ ] Article I: Complete implementation, no placeholders (Quality First)
- [ ] Article I: Tests written and passing, coverage ≥80%
- [ ] Article II: No code duplication, existing code reused (Architectural Consistency)
- [ ] Article II: Naming follows existing patterns
- [ ] Article III: No hardcoded secrets (Security First)
- [ ] Article IV: Resources properly managed, no leaks (Performance Accountability)
- [ ] Article V: No dead code, clean codebase (Maintainability)
- [ ] Article VI: TDD sequence followed (Test-First Development)

**Before Flow Execution**:
- [ ] Article VII: ≤3 projects/modules (Simplicity Gate)
- [ ] Article VIII: No unnecessary abstractions (Anti-Abstraction)
- [ ] Article IX: Contracts defined first, real environments (Integration-First)
- [ ] Article X: No speculative features, all ambiguities marked (Requirement Boundary)

**Tools**:
```bash
# Automated Constitutional Compliance Check
bash .claude/scripts/validate-constitution.sh

# Scope Boundary Compliance Check
bash .claude/scripts/validate-scope-boundary.sh

# Pre-push Quality Gates
bash .claude/hooks/pre-push-guard.sh
```

---

## Single Source of Truth

This Constitution is the **architectural DNA** of CC-DevFlow. All templates, agent instructions, validation scripts, and documentation derive their authority from this document.

**Consistency Propagation**: When this Constitution is amended, changes MUST automatically propagate to:
- `.claude/docs/templates/*.md` (PRD, EPIC, TASKS templates)
- `.claude/agents/*.md` (All agent instruction files)
- `.claude/scripts/validate-*.sh` (Validation scripts)
- `.claude/hooks/*.sh` (Git hooks)
- `CLAUDE.md` (Project documentation)

**Amendment Impact Report**: Use `/flow-constitution --amend` command to generate automatic sync report.

---

**Declaration**: This Constitution represents the unwavering commitment of CC-DevFlow to excellence, consistency, and sustainable development. All participants bear the responsibility to uphold and defend these principles.

---

*CC-DevFlow Project Constitution - Ensuring Excellence, Rejecting Compromise*

**Version History**:
- v2.1.0 (2026-01-08): Added Iron Law + Rationalization Defense + Red Flags to all 10 Articles
- v2.0.0 (2025-10-09): Article-based restructure, enforcement mechanisms, amendment process
- v1.0.0 (2025-01-20): Initial version with five core principles


---

## rationalization-library

# CC-DevFlow Rationalization Library

> **Version**: 1.0.0
> **Purpose**: Centralized defense against AI Agent rationalization attempts
> **Source**: Extracted from superpowers TDD skill + CC-DevFlow operational experience

---

## How to Use This Library

When an agent is about to violate a Constitutional Article, they will often produce
rationalizations. This library provides pre-crafted responses.

**Pattern**:
1. Agent produces excuse
2. Lookup excuse in relevant Article section
3. Respond with "Reality" column
4. If not found, add new rationalization to library

---

## Article I: Quality First - Rationalization Table

### Iron Law
```
NO PARTIAL IMPLEMENTATION - COMPLETE OR NOTHING
```

### Rationalizations

| Excuse | Reality |
|--------|---------|
| "This is simplified for now" | CONSTITUTIONAL VIOLATION. Complete it or don't ship it. |
| "Will complete in v2" | Future versions don't exist. Implement fully now. |
| "Core logic works, edge cases later" | Edge cases ARE the implementation. No later. |
| "Time constraint" | Ship later, ship complete. Never ship incomplete. |
| "MVP approach" | MVP = Minimum VIABLE. Viable means works completely. |
| "Placeholder for now" | Placeholders = technical debt = future bugs. |
| "I'll fix it before PR" | Fix it NOW. Not later. Now. |
| "80% is good enough" | 80% = broken for 20% of users. Not good enough. |
| "Works on my machine" | Production is not your machine. Test properly. |

---

## Article II: Architectural Consistency - Rationalization Table

### Iron Law
```
REUSE EXISTING CODE - NO DUPLICATION
```

### Rationalizations

| Excuse | Reality |
|--------|---------|
| "Faster to rewrite" | Faster now = slower forever. Find and reuse. |
| "That code is messy" | Refactor it. Don't duplicate it. |
| "Slightly different use case" | Extract common, parameterize difference. |
| "I don't have time to search" | Searching takes 5 min. Maintaining duplicates takes forever. |
| "The other code might change" | Good. Your copy will be outdated. Use shared version. |
| "It's just a small function" | Small duplications compound. No exceptions. |
| "I understand my version better" | Understand the shared version. That's your job. |

---

## Article III: Security First - Rationalization Table

### Iron Law
```
NO HARDCODED SECRETS - ENVIRONMENT VARIABLES ONLY
```

### Rationalizations

| Excuse | Reality |
|--------|---------|
| "It's just for testing" | Commits are forever. Use env vars even for tests. |
| "I'll remove it before commit" | You won't. You'll forget. Use env vars. |
| "It's not a real secret" | Any credential is a real secret. Treat it as such. |
| "Local development only" | Local becomes production. Start secure. |
| "Nobody will see the repo" | Repos get shared. Git history is permanent. |
| "I'll rotate it later" | Rotation doesn't erase history. Never commit secrets. |
| "It's encrypted" | Encrypted secrets in code are still secrets in code. |

---

## Article IV: Performance Accountability - Rationalization Table

### Iron Law
```
NO RESOURCE LEAKS - ALWAYS CLEANUP
```

### Rationalizations

| Excuse | Reality |
|--------|---------|
| "Garbage collector will handle it" | GC doesn't close files/connections. Explicit cleanup. |
| "Small leak, won't matter" | Small leaks become big crashes. Fix now. |
| "It's a short-lived process" | Process lifetime is not your decision. Always cleanup. |
| "I'll add cleanup later" | Later = never. Add cleanup with creation. |
| "Framework handles it" | Verify that. Don't assume. |
| "Only happens in edge case" | Edge cases run in production. Handle them. |

---

## Article V: Maintainability - Rationalization Table

### Iron Law
```
NO DEAD CODE - USE IT OR DELETE IT
```

### Rationalizations

| Excuse | Reality |
|--------|---------|
| "Might need it later" | Git history exists. Delete now, retrieve if needed. |
| "It's just commented out" | Commented code = noise. Delete it. |
| "Reference for future work" | Write docs. Don't keep dead code. |
| "Someone else might need it" | They'll write their own. Delete yours. |
| "Too risky to delete" | Tests exist. If tests pass after delete, it's safe. |
| "I worked hard on this" | Sunk cost fallacy. Delete it. |

---

## Article VI: Test-First Development - Rationalization Table

### Iron Law
```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

### Rationalizations

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |
| "Tests after achieve same goals" | Tests-after = "what does this do?" Tests-first = "what should this do?" |
| "Already manually tested" | Ad-hoc ≠ systematic. No record, can't re-run. |
| "Deleting X hours is wasteful" | Sunk cost fallacy. Keeping unverified code is technical debt. |
| "Keep as reference, write tests first" | You'll adapt it. That's testing after. Delete means delete. |
| "Need to explore first" | Fine. Throw away exploration, start with TDD. |
| "Test hard = design unclear" | Listen to test. Hard to test = hard to use. |
| "TDD slows me down" | TDD faster than debugging. Pragmatic = test-first. |
| "This is different because..." | No. This is rationalization. Follow the law. |
| "Spirit not letter" | Violating letter IS violating spirit. No loopholes. |
| "I'm being pragmatic, not dogmatic" | TDD IS pragmatic. Shortcuts = debugging in production = slower. |
| "Just this once" | No exceptions. Rules exist for this exact moment. |
| "Existing code has no tests" | You're improving it. Add tests for existing code. |
| "Manual test faster" | Manual doesn't prove edge cases. You'll re-test every change. |

---

## Article VII: Simplicity Gate - Rationalization Table

### Iron Law
```
MAXIMUM 3 PROJECTS - JUSTIFY ANY ADDITIONAL COMPLEXITY
```

### Rationalizations

| Excuse | Reality |
|--------|---------|
| "Microservices are better" | For your scale? Monolith is simpler. Start there. |
| "Future scalability" | YAGNI. Scale when you need to. |
| "Separation of concerns" | Modules separate concerns. Projects add overhead. |
| "Team autonomy" | Autonomy ≠ architectural chaos. Coordinate. |
| "Best practices say..." | Best practices assume scale you don't have. |
| "We might need it" | Might ≠ do. Build for now, refactor when needed. |

---

## Article VIII: Anti-Abstraction - Rationalization Table

### Iron Law
```
USE FRAMEWORKS DIRECTLY - NO UNNECESSARY WRAPPERS
```

### Rationalizations

| Excuse | Reality |
|--------|---------|
| "Abstraction for future flexibility" | YAGNI. You won't switch frameworks. |
| "Cleaner interface" | Framework interface IS clean. Learn it. |
| "Hide implementation details" | Framework IS implementation. Don't hide it. |
| "Consistent with other projects" | Consistency ≠ unnecessary abstraction. |
| "Easier testing" | Mock the framework. Don't wrap it. |
| "Best practice pattern" | Pattern ≠ always apply. Use judgment. |

---

## Article IX: Integration-First Testing - Rationalization Table

### Iron Law
```
CONTRACTS FIRST - REAL ENVIRONMENTS
```

### Rationalizations

| Excuse | Reality |
|--------|---------|
| "Unit tests are faster" | Fast wrong tests waste time. Integration tests catch real bugs. |
| "Mocks are simpler" | Mocks hide integration issues. Real databases find them. |
| "CI is slow" | CI is cheap. Production bugs are expensive. |
| "Docker is complex" | Docker is simpler than debugging integration issues. |
| "In-memory database works" | In-memory differs from production. Test with real DB. |

---

## Article X: Requirement Boundary - Rationalization Table

### Iron Law
```
IMPLEMENT WHAT'S REQUESTED, NOTHING MORE
```

### Rationalizations

| Excuse | Reality |
|--------|---------|
| "User might need this later" | User didn't ask. Don't add. YAGNI. |
| "It's just a small addition" | Small additions compound. Scope creep. |
| "This is a natural extension" | Extensions require explicit request. |
| "Would be nice to have" | Nice ≠ required. Focus on requirements. |
| "While I'm here anyway" | Stay on task. Create separate requirement. |
| "It's only 5 more lines" | 5 lines = testing + docs + maintenance. Not 5 lines. |
| "User will thank me" | User will thank you for ON-TIME, IN-SCOPE delivery. |
| "I'm being helpful" | Helpful = following spec. Unhelpful = scope creep. |
| "It's best practice" | Best practice: implement what's requested. |
| "Future-proofing" | Future-proofing = over-engineering = waste. |
| "Obvious feature" | If obvious, it should be in spec. Not in spec = don't do. |

---

## Cross-Article Rationalizations

These excuses appear across multiple Articles:

| Excuse | Reality | Articles |
|--------|---------|----------|
| "Just this once" | No exceptions. Rules exist for this exact moment. | All |
| "I'm being pragmatic" | Pragmatic = following rules. Shortcuts = technical debt. | All |
| "Time is tight" | Rushed work = bugs = more time spent debugging. | All |
| "It's obvious it works" | Nothing is obvious. Prove with tests. | I, VI |
| "Everyone does this" | Everyone is wrong. We do it right. | All |
| "Senior says skip it" | Constitution > authority. No skipping. | All |
| "Emergency situation" | Emergencies especially need rules. | III, VI |
| "This is different" | It's not different. Follow the rules. | All |
| "Spirit over letter" | Violating letter IS violating spirit. | VI |
| "Being practical" | Practical = disciplined. Shortcuts = impractical. | All |

---

## Adding New Rationalizations

When you encounter a new excuse not in this library:

1. **Capture verbatim** - Record exact words used
2. **Identify Article** - Which Constitutional Article does it violate?
3. **Craft Reality response** - Brief, direct, no compromise
4. **Add to library** - PR to update this document
5. **Update guardrails** - Add pattern to relevant skill if blocking needed

---

## Integration Points

This library is consumed by:
- `.claude/rules/project-constitution.md` (inline tables per Article)
- `.claude/agents/*.md` (relevant tables per agent role)
- `.claude/skills/devflow-tdd-enforcer/SKILL.md`
- `.claude/skills/constitution-guardian/SKILL.md`
- `tests/pressure-scenarios/` (test scenarios)

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
