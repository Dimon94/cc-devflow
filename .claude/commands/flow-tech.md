---
name: flow-tech
description: Generate Technical Design Document. Usage: /flow-tech "REQ-123" or /flow-tech
---

# Flow-Tech - 技术方案生成命令

## 命令格式
```text
/flow-tech "REQ_ID"
/flow-tech             # Auto-detect from current branch
```

### 参数说明
- **REQ_ID**: 需求编号 (可选，默认从当前 Git 分支或环境变量获取)

### 示例
```text
/flow-tech "REQ-123"
/flow-tech              # On feature/REQ-123-* branch
```

## 执行流程

### 阶段 0: CLAUDE.md 技术架构检查与维护 (ANTI-TECH-CREEP Gate)

**Purpose**: 防止技术扩散，确保 CLAUDE.md 记录当前技术架构

**Execution Flow**:
```
1. Read CLAUDE.md
   → Check if "## Technical Architecture" or "## 技术架构" section exists
   → Grep: "^##\s+(Technical Architecture|技术架构)"
   → If found: Extract section content for validation
   → If not found: Mark as MISSING

2. If section MISSING:
   → Read: research/internal/codebase-overview.md (from flow-init)
   → Extract tech stack:
     - Frontend framework (React, Vue, Angular, etc.)
     - Backend framework (Express, NestJS, FastAPI, etc.)
     - Database (PostgreSQL, MySQL, MongoDB, etc.)
     - ORM/ODM (Prisma, TypeORM, Mongoose, etc.)
     - Key libraries (authentication, validation, testing, etc.)
   → Generate refined architecture summary (精炼原则性 - MANDATORY):
     - **Max 10-15 lines total** (hard limit)
     - **Bullet points only** (no paragraphs)
     - **Include versions** for all core technologies
     - **No implementation details** (only architecture-level)
     - **No verbose explanations** (concise statements only)
     - **Focus on core tech** (ignore dev tools, minor packages)
     - **Add "Core Principles" line** at end (≤1 sentence)
   → Append to CLAUDE.md under "## Technical Architecture"
   → Format:
     ```markdown
     ## Technical Architecture

     - **Frontend**: React 18 with TypeScript 5.0
     - **Backend**: Express 4.18 with TypeScript
     - **Database**: PostgreSQL 15
     - **ORM**: Prisma 5.0
     - **Authentication**: JWT with bcrypt
     - **Validation**: Zod 3.22
     - **Testing**: Jest 29 with supertest
     - **Build**: tsc (TypeScript Compiler)
     - **Package Manager**: npm

     **Core Principles**: Direct framework usage, no unnecessary abstractions, reuse existing patterns.
     ```
   → Log: "Added technical architecture to CLAUDE.md"

3. If section EXISTS but PROBLEMATIC:
   → Identify issues:
     - **Too verbose**: >20 lines, contains implementation details
     - **Outdated**: Technologies differ from codebase-overview.md
     - **Inconsistent**: Contradicts actual project structure
     - **Missing versions**: No version numbers for core tech
   → Update section (精炼原则性 - MANDATORY):
     - Read current tech stack from codebase-overview.md
     - Regenerate refined summary:
       * **Max 10-15 lines total** (hard limit)
       * **Bullet points only** (no paragraphs)
       * **Include versions** for core technologies
       * **No implementation details** (only architecture-level)
       * **No verbose explanations** (concise statements only)
       * **Focus on core tech** (ignore dev tools, minor packages)
       * **Add "Core Principles" line** at end (≤1 sentence)
     - Replace existing section in CLAUDE.md
     - Verify: Total section ≤20 lines (including heading)
     - Verify: No redundant content, no examples
   → Log: "Updated technical architecture in CLAUDE.md (reason: ${issue})"

4. If section EXISTS and FINE:
   → Validate content:
     - Check consistency with codebase-overview.md
     - Verify versions are up-to-date
     - Ensure conciseness (≤20 lines)
   → Extract tech stack constraints:
     - Parse frontend framework
     - Parse backend framework
     - Parse database and ORM
     - Parse key libraries
   → Store as baseline for later gates
   → Log: "Technical architecture verified in CLAUDE.md"
   → Continue to Stage 1

**Anti-Tech-Creep Constraints Loaded**:
- **Baseline**: Current tech stack from CLAUDE.md is the approved baseline
- **Deviation Policy**:
  - Any new technology must be explicitly justified in TECH_DESIGN.md
  - No replacement of existing technologies without strong reason
  - No unnecessary refactoring (keep existing patterns)
  - No unfamiliar third-party libraries without proof of necessity
- **Enforcement**: tech-architect agent will be instructed to use baseline tech stack
- **Violations**: Any deviation flagged in Constitution Check with required justification

**Example Anti-Tech-Creep Scenarios**:
- ❌ **Rejected**: "Replace Express with NestJS" (unnecessary refactoring)
- ❌ **Rejected**: "Add GraphQL" (PRD doesn't require it, YAGNI)
- ✅ **Approved**: "Add Redis for caching" (PRD requires performance, justified)
- ✅ **Approved**: "Use Zod for validation" (already in baseline, reuse)

**Output**:
- CLAUDE.md updated or verified (精炼原则性保证: ≤20行，bullet points only)
- Tech stack baseline extracted and stored (for enforcement in subsequent stages)
- Anti-tech-creep constraints activated (no unauthorized tech, no refactoring)
```

### 阶段 1: 前置条件检查 (Entry Gate)

**Execution Flow**:
```
1. Determine requirement ID
   → If REQ_ID provided: Use provided ID
   → Else: Run check-prerequisites.sh --json --paths-only
   → Parse REQ_ID from JSON output
   → If not found: ERROR "No requirement ID found. Provide REQ_ID or run on feature branch."

2. Validate requirement structure exists
   → Run: check-prerequisites.sh --json
   → Verify: REQ_DIR exists
   → Verify: EXECUTION_LOG.md exists
   → Verify: orchestration_status.json exists
   → If missing: ERROR "Requirement not initialized. Run /flow-init first."

3. Validate PRD exists
   → Check: PRD_FILE exists
   → If missing: ERROR "PRD.md not found. Run /flow-prd first."
   → Verify: PRD is complete (no {{PLACEHOLDER}})
   → If incomplete: ERROR "PRD.md is incomplete. Complete PRD first."

4. Check if TECH_DESIGN already exists
   → Check: TECH_DESIGN_FILE exists
   → If exists: WARN "TECH_DESIGN.md already exists. Overwrite? (y/n)"
   → User must confirm to proceed

5. Check orchestration status
   → Read: orchestration_status.json
   → Verify: status is "prd_complete" or "ui_complete" or "tech_design_failed"
   → If wrong phase: ERROR "Requirement not in correct phase for technical design"

*GATE CHECK: All prerequisite validations passed*
```

### 阶段 2: 技术细化分析 (Technical Deep-Dive Analysis)

**两层分析架构**:
- **Layer 1**: flow-init 已生成 `research/internal/codebase-overview.md` (概览性分析)
- **Layer 2**: flow-tech 生成 `research/codebase-tech-analysis.md` (技术细化分析) ← 本阶段

**Execution Flow**:
```
1. 复用概览性分析
   → Read: research/internal/codebase-overview.md (from flow-init)
   → Extract: Project type, tech stack, module structure
   → If missing: WARN "Run /flow-init first to generate codebase overview"

2. 技术细化分析 - 数据模型实现模式
   → Search: models/, entities/, schemas/, database/, prisma/, typeorm/
   → Grep: "class.*Model", "interface.*Entity", "type.*Schema", "model\s+\w+", "entity\s+\w+"
   → Extract:
     - ORM 使用模式 (Prisma schema, TypeORM decorators, Mongoose models)
     - 字段命名规范 (camelCase, snake_case)
     - 关系定义方式 (decorators, references, foreign keys)
     - 验证规则位置 (model validators, DTO classes)
   → 示例代码片段 (3-5 lines per pattern)

3. 技术细化分析 - API 实现模式
   → Search: routes/, controllers/, handlers/, api/, endpoints/
   → Grep: "router\.", "app\.(get|post)", "@(Get|Post|Put|Delete)", "route\(", "endpoint"
   → Extract:
     - 路由定义方式 (Express Router, NestJS decorators, FastAPI routes)
     - 请求处理模式 (controller → service → repository, handler functions)
     - 参数验证位置 (middleware, decorators, inline)
     - 错误处理策略 (try-catch, error middleware, global handlers)
   → 示例代码片段

4. 技术细化分析 - 认证授权实现
   → Search: auth/, middleware/, guards/, security/
   → Grep: "authenticate", "authorize", "jwt", "passport", "verify.*Token", "checkRole"
   → Extract:
     - 认证中间件位置和实现 (JWT verify, session check)
     - Token 生成/验证函数
     - 权限检查机制 (decorators, middleware, guards)
     - 密钥管理模式 (env vars, config files)
   → 示例代码片段

5. 技术细化分析 - 数据库连接和事务
   → Search: database/, db/, config/, connection/
   → Grep: "createConnection", "getConnection", "transaction", "mongoose\.connect", "prisma"
   → Extract:
     - 数据库连接初始化位置
     - 连接池配置
     - 事务处理模式
     - 迁移管理方式 (migrations/, scripts/)
   → 示例代码片段

6. 技术细化分析 - 可复用组件和工具
   → Search: utils/, helpers/, common/, shared/, lib/
   → Identify:
     - Logger 实现 (winston, pino, custom)
     - Validator 工具 (Zod, Joi, class-validator)
     - Error classes 和 error handler
     - 常用 utility functions (formatDate, slugify, etc.)
   → 示例使用方式

7. 技术细化分析 - 测试模式
   → Search: __tests__/, test/, spec/, *.test.ts, *.spec.ts
   → Extract:
     - 测试框架 (Jest, Mocha, Vitest)
     - Mock 策略 (jest.mock, sinon, test doubles)
     - 测试数据工厂 (factories/, fixtures/)
     - Coverage 配置
   → 示例测试结构

8. 生成技术细化分析报告
   → Save to: REQ_DIR/research/codebase-tech-analysis.md
   → Structure:
     - Executive Summary (技术栈概览, 从 codebase-overview.md 复用)
     - Data Model Patterns (ORM, schema, validation)
     - API Implementation Patterns (routing, handling, error)
     - Auth & Security Patterns (authentication, authorization, secrets)
     - Database Patterns (connection, transaction, migration)
     - Reusable Components (logger, validator, utils)
     - Testing Patterns (framework, mocks, fixtures)
     - Code Examples (具体示例代码片段)
     - Recommendations (可改进点和技术债务)
   → Log: "Technical deep-dive analysis completed"

9. 准备综合输入给 tech-architect
   → Combine:
     - PRD.md (功能需求)
     - codebase-overview.md (项目概览)
     - codebase-tech-analysis.md (技术细节)
     - research/mcp/* (外部研究材料, 如有)
   → 提供完整技术上下文
```

**关键区别**:
| 分析层次 | 来源 | 输出 | 深度 | 目的 |
|---------|------|------|------|------|
| **概览分析** | flow-init | codebase-overview.md | 浅层 | 了解项目全貌 |
| **技术细化分析** | flow-tech | codebase-tech-analysis.md | 深层 | 挖掘具体实现模式,指导设计 |

**示例 - 技术细化分析输出**:
```markdown
## Data Model Patterns

### ORM: Prisma 5.0
- **Schema Location**: `prisma/schema.prisma`
- **Model Definition Pattern**:
  ```prisma
  model User {
    id        String   @id @default(uuid())
    email     String   @unique
    createdAt DateTime @default(now())
  }
  ```
- **Validation**: Zod schemas in `src/validators/user.schema.ts`

### Naming Convention
- Database: `snake_case` (e.g., `created_at`)
- TypeScript: `camelCase` (e.g., `createdAt`)
- Auto-mapping by Prisma

### Relationship Pattern
- One-to-Many: `User 1:N Posts`
  ```prisma
  model User {
    posts Post[]
  }
  model Post {
    userId String
    user   User   @relation(fields: [userId], references: [id])
  }
  ```

## API Implementation Patterns

### Router: Express 4.18
- **Location**: `src/routes/*.ts`
- **Pattern**:
  ```typescript
  const router = express.Router();
  router.post('/users', validateBody(userSchema), userController.create);
  ```

### Controller Pattern
- **Location**: `src/controllers/*.ts`
- **Structure**: `async (req, res, next) => { try { ... } catch (next) }`
- **Service Layer**: Controllers call `userService.create()` for business logic

### Error Handling
- **Global Handler**: `src/middleware/errorHandler.ts`
- **Pattern**: Controllers throw custom errors, middleware catches and formats
  ```typescript
  throw new BadRequestError("Invalid email format");
  ```

[... 继续其他章节 ...]
```
```

### 阶段 3: 技术方案生成准备

**Execution Flow**:
```
1. Load TECH_DESIGN template
   → Read: .claude/docs/templates/TECH_DESIGN_TEMPLATE.md
   → Verify template has Execution Flow section
   → If missing: ERROR "TECH_DESIGN template is not self-executable"

2. Prepare agent prompt
   → Include: REQ_ID, Title (from status.json)
   → Include: PRD.md content (functional requirements)
   → Include: Codebase analysis report
   → Include: UI_PROTOTYPE.html (if exists)
   → Include: TECH_DESIGN template structure
   → Include: Instruction to follow Execution Flow

3. Update orchestration status
   → Set: status = "tech_design_in_progress"
   → Set: phase = "technical_design"
   → Set: updatedAt = current timestamp
   → Write: orchestration_status.json

4. Log technical design start
   → Append to EXECUTION_LOG.md:
     "### $(date -Iseconds)
      Technical design started
      Codebase analysis: Complete
      Agent: tech-architect"
```

### 阶段 4: 调用 tech-architect Agent

**Agent Invocation**:
```
Task: tech-architect agent
Prompt:
  You are generating a Technical Design Document for ${REQ_ID}: ${TITLE}.

  Context:
  - Requirement ID: ${REQ_ID}
  - Requirement Title: ${TITLE}
  - PRD available: Yes
  - UI Prototype available: ${UI_EXISTS ? "Yes" : "No"}
  - Codebase analysis: Complete

  PRD Content:
  ${prd_content}

  Codebase Analysis:
  ${codebase_analysis}

  ${UI_EXISTS ? "UI Prototype:\n" + ui_prototype_summary : ""}

  Your task:
  1. Run .claude/scripts/check-prerequisites.sh --json --paths-only
     to get requirement paths
  2. Read TECH_DESIGN_TEMPLATE.md from .claude/docs/templates/
  3. Follow the Execution Flow in the template step-by-step:
       - Load PRD and extract technical requirements
       - Analyze existing codebase patterns (use provided analysis)
       - Design system architecture
       - Select technologies with justification
       - Define data models and relationships
       - Design API contracts
       - Plan security and performance strategies
       - Phase -1 Gates (Simplicity, Anti-Abstraction, Integration-First)
       - Validate completeness
  4. Write complete TECH_DESIGN.md to ${TECH_DESIGN_FILE}
       - Fill all sections, no {{PLACEHOLDER}} left
       - Include Constitution Check section
       - Include Validation Checklist
  5. Log event: log_event "${REQ_ID}" "Technical design completed"

  Output: Complete TECH_DESIGN.md file at ${TECH_DESIGN_FILE}

Subagent: tech-architect
```

### 阶段 5: 技术方案验证 (Exit Gate)

**Exit Gate Validation**:
```
1. Verify TECH_DESIGN.md was created
   → Check: TECH_DESIGN_FILE exists
   → If missing: ERROR "Technical design failed - file not created"

2. Validate TECH_DESIGN completeness
   → Read: TECH_DESIGN_FILE
   → Check: No {{PLACEHOLDER}} patterns remain
   → Check: Constitution Check section exists and filled
   → Check: System Architecture section exists
   → Check: Technology Stack section exists with justifications
   → Check: Data Model Design section exists with schema
   → Check: API Design section exists with endpoints
   → Check: Security Design section exists
   → Check: Performance Design section exists
   → If incomplete: ERROR "TECH_DESIGN incomplete - missing required sections"

3. Run Constitution validation
   → Execute: validate-constitution.sh --type tech_design --severity warning
   → Parse output for violations
   → If errors: WARN "Constitution violations found. Review and fix."
   → Display violations to user

4. Verify file size and content
   → Get: wc -l TECH_DESIGN_FILE
   → Check: At least 150 lines (sanity check for completeness)
   → Check: Contains "## 1. System Architecture" section
   → Check: Contains "## 2. Technology Stack" section
   → Check: Contains "## 3. Data Model Design" section
   → Check: Contains "## 4. API Design" section
   → If too small: ERROR "TECH_DESIGN appears incomplete or corrupted"

5. Update orchestration status
   → Set: status = "tech_design_complete"
   → Set: phase = "epic_planning"
   → Set: completedSteps = [...previousSteps, "tech_design"]
   → Set: updatedAt = current timestamp
   → Write: orchestration_status.json

*GATE CHECK: TECH_DESIGN meets all quality criteria*
```

**Success Output**:
```
✅ Technical Design generated successfully!

Requirement ID:    ${REQ_ID}
TECH_DESIGN File:  ${TECH_DESIGN_FILE}
Lines:             ${line_count}
Constitution:      ✅ Passed / ⚠️ Warnings

Key Sections:
  ✅ System Architecture (${module_count} modules)
  ✅ Technology Stack (Frontend, Backend, Database, Infrastructure)
  ✅ Data Model Design (${table_count} tables)
  ✅ API Design (${endpoint_count} endpoints)
  ✅ Security Design (Authentication, Authorization, Secret Management)
  ✅ Performance Design (Caching, Optimization, Scalability)
  ✅ Constitution Check (Phase -1 Gates)

Next Steps:
  1. Review TECH_DESIGN.md to ensure technical soundness
  2. Run /flow-epic to generate Epic and task breakdown
     (planner will use TECH_DESIGN.md to ensure complete task coverage)
  3. Or edit TECH_DESIGN.md manually if adjustments needed

Files created/updated:
  - ${TECH_DESIGN_FILE} (new)
  - research/codebase-analysis.md (new, codebase analysis report)
  - orchestration_status.json (updated: status=tech_design_complete)
  - EXECUTION_LOG.md (updated: logged technical design)
```

## 输出产物

### 技术方案文档结构
```markdown
# Technical Design: REQ-123 - User Authentication

**Status**: Draft
**Created**: 2025-01-10T12:34:56Z
**Updated**: 2025-01-10T13:45:00Z
**Type**: Technical Design

## 1. System Architecture

### 1.1 Architecture Overview
```
[Frontend (React)] <--HTTPS--> [API Gateway] <---> [Auth Service]
                                     |                    |
                                     v                    v
                              [User Service]        [Database]
                                     |
                                     v
                                [Cache (Redis)]
```

### 1.2 Module Breakdown
- **Frontend**: React 18 with TypeScript, user interface
- **API Gateway**: Express 4.18, routing and middleware
- **Auth Service**: JWT-based authentication service
- **User Service**: User CRUD operations
- **Database**: PostgreSQL 15 for persistent storage
- **Cache**: Redis 7 for session management

### 1.3 Data Flow
User Request → Frontend → API Gateway → Auth Middleware → Service → Database

## 2. Technology Stack

### 2.1 Frontend
- **Framework**: React 18.2 with TypeScript 5.0
  - Justification: Modern, component-based, strong typing
- **State Management**: Redux Toolkit 2.0
  - Justification: Centralized state, good DevTools
- **UI Library**: Material-UI 5.14
  - Justification: Comprehensive components, accessibility

### 2.2 Backend
- **Framework**: Express 4.18 with TypeScript
  - Justification: Minimal, flexible, large ecosystem
- **ORM**: Prisma 5.0
  - Justification: Type-safe, migrations, modern API
- **Validation**: Zod 3.22
  - Justification: TypeScript-first, composable schemas

### 2.3 Database
- **Primary DB**: PostgreSQL 15
  - Justification: ACID compliance, JSON support, mature
- **Cache**: Redis 7.0
  - Justification: Fast, session storage, pub/sub

### 2.4 Infrastructure
- **Deployment**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Hosting**: [TBD based on requirements]

## 3. Data Model Design

### 3.1 Database Schema

#### Table: users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | User ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| name | VARCHAR(100) | NOT NULL | User name |
| role | VARCHAR(50) | NOT NULL | User role (admin, user) |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Update timestamp |

#### Table: sessions
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Session ID |
| user_id | UUID | FOREIGN KEY users(id) | User reference |
| token | VARCHAR(500) | UNIQUE, NOT NULL | JWT token |
| expires_at | TIMESTAMP | NOT NULL | Expiration time |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |

### 3.2 Entity Relationships
- User 1:N Sessions (one user can have multiple active sessions)

### 3.3 Indexes
- users(email) - for login lookup
- sessions(user_id, expires_at) - for session validation

## 4. API Design

### 4.1 API Endpoints

#### POST /api/auth/register
**Purpose**: Create new user account

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Validation**:
- email: valid email format, max 255 chars
- password: min 8 chars, must include uppercase, lowercase, number, special char
- name: min 2 chars, max 100 chars

**Response** (201):
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "createdAt": "2025-01-10T12:00:00Z"
}
```

**Errors**:
- 400: Invalid input (email format, password strength)
- 409: Email already exists

#### POST /api/auth/login
**Purpose**: Authenticate user and create session

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200):
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "expiresAt": "2025-01-10T20:00:00Z"
}
```

**Errors**:
- 400: Invalid input
- 401: Invalid credentials
- 429: Too many login attempts

#### [Additional endpoints...]

## 5. Security Design

### 5.1 Authentication
- **Strategy**: JWT with refresh tokens
- **Token Expiry**: Access 15min, Refresh 7 days
- **Storage**: Refresh tokens in database, access tokens client-side

### 5.2 Authorization
- **Model**: RBAC (Role-Based Access Control)
- **Roles**: admin (full access), user (limited access), guest (read-only)
- **Implementation**: Middleware checks JWT claims for role

### 5.3 Secret Management
- ✅ **NO HARDCODED SECRETS**
- **Strategy**: Environment variables (.env file, not committed)
- **Secrets**:
  - JWT_SECRET: For signing JWT tokens
  - DATABASE_URL: Database connection string
  - REDIS_URL: Redis connection string
- **Rotation**: Secrets rotated every 90 days

### 5.4 Input Validation
- **Tool**: Zod schemas for all API inputs
- **SQL Injection Prevention**: Prisma ORM (parameterized queries)
- **XSS Prevention**: React escapes by default, CSP headers
- **CSRF Prevention**: SameSite cookies, CSRF tokens for state-changing operations

### 5.5 Rate Limiting
- **Login Attempts**: 5 attempts per 15 minutes per IP
- **API Requests**: 100 requests per minute per user
- **Tool**: express-rate-limit middleware

## 6. Performance Design

### 6.1 Caching Strategy
- **User Sessions**: Redis (TTL 15min for access tokens, 7 days for refresh)
- **User Profiles**: Redis (TTL 5min, invalidate on update)
- **Cache Key Pattern**: `user:{userId}:profile`, `session:{sessionId}`

### 6.2 Database Optimization
- **Indexes**: On frequently queried fields (email, user_id, expires_at)
- **Query Optimization**: Use Prisma's select to fetch only needed fields
- **Connection Pooling**: Max 20 connections

### 6.3 Scalability
- **Horizontal Scaling**: Stateless API servers behind load balancer
- **Database**: Read replicas for read-heavy operations
- **Cache**: Redis cluster for high availability

### 6.4 Performance Targets
- API Response Time (p95): < 200ms
- Database Query Time (p95): < 50ms
- Concurrent Users: 1000+

## 7. Constitution Check (Phase -1 Gates)

### Simplicity Gate (Article VII)
- [x] **≤3 projects/modules**: 3 modules (Frontend, Backend, Database)
- [x] **No future-proofing**: No microservices, no message queue (not needed yet)
- [x] **Minimal dependencies**: Only essential packages listed

### Anti-Abstraction Gate (Article VIII)
- [x] **Direct framework usage**: Direct Express and React usage, no custom wrappers
- [x] **Single data model**: Prisma schema is the single source of truth
- [x] **No unnecessary interfaces**: Direct service calls, no repository pattern

### Integration-First Gate (Article IX)
- [x] **Contracts defined first**: All API endpoints defined above
- [x] **Contract tests planned**: Will write API contract tests in Phase 2
- [x] **Real environment testing**: Integration tests against real Postgres + Redis (Docker)

### Complexity Tracking
| Potential Violation | Justification | Approved? |
|---------------------|---------------|-----------|
| None | All gates passed | N/A |

## 8. Validation Checklist

- [x] All layers designed (frontend, backend, database, cache)
- [x] All technologies selected with justification
- [x] Complete data model with relationships and indexes
- [x] All API endpoints defined with request/response schemas
- [x] Security strategy complete (auth, authz, secret management, validation)
- [x] Performance strategy complete (caching, optimization, scalability)
- [x] Constitution Check passed (Phase -1 Gates)
- [x] No placeholders remaining

**Ready for Epic Planning**: YES
```

### 状态更新
**orchestration_status.json**:
```json
{
  "reqId": "REQ-123",
  "title": "User Authentication",
  "status": "tech_design_complete",
  "phase": "epic_planning",
  "completedSteps": ["init", "prd", "tech_design"],
  "createdAt": "2025-01-10T12:00:00Z",
  "updatedAt": "2025-01-10T13:45:00Z"
}
```

### 研究材料
**research/codebase-analysis.md**:
```markdown
# Codebase Analysis for REQ-123

**Generated**: 2025-01-10T12:30:00Z

## Project Structure
- Type: Node.js TypeScript project
- Package Manager: npm
- Build Tool: tsc (TypeScript Compiler)

## Existing Patterns

### Data Models
- Location: src/models/
- Pattern: Prisma ORM
- Example: src/models/schema.prisma

### API Patterns
- Location: src/routes/
- Pattern: Express Router
- Convention: RESTful endpoints
- Example: src/routes/users.ts

### Security
- Location: src/middleware/auth.ts
- Pattern: JWT authentication middleware
- Existing: authenticate(), authorize(role)

### Database
- Type: PostgreSQL
- ORM: Prisma 5.0
- Migrations: Yes (prisma/migrations/)

## Reusable Components
- `src/utils/logger.ts` - Winston logger
- `src/middleware/errorHandler.ts` - Global error handler
- `src/utils/validator.ts` - Zod schema validator

## Recommendations
- Follow existing Prisma schema patterns
- Use existing auth middleware for new endpoints
- Reuse logger and error handler
```

## Constitution Check

This command enforces Constitution principles during technical design:

### Simplicity Gate (Article VII)
- [ ] Design uses ≤3 projects/modules
- [ ] No future-proofing (no microservices, message queues unless required)
- [ ] Minimal dependencies (only essential packages)

### Anti-Abstraction Gate (Article VIII)
- [ ] Direct framework usage (no custom wrappers)
- [ ] Single data model (Prisma schema as single source)
- [ ] No unnecessary interfaces (no repository pattern unless justified)

### Integration-First Gate (Article IX)
- [ ] API contracts defined first
- [ ] Contract tests planned in TASKS
- [ ] Real environment testing (Docker for Postgres + Redis)

## Error Handling

### Common Errors

**1. PRD not found**
```
ERROR: PRD.md not found for requirement REQ-123
Run /flow-prd "REQ-123" first to generate PRD
```

**2. Wrong workflow phase**
```
ERROR: Requirement REQ-123 not in correct phase for technical design
Current phase: initialized (expected: prd_complete or ui_complete)
PRD not found: devflow/requirements/REQ-123/PRD.md
```

**3. Codebase analysis failed**
```
WARNING: Unable to analyze existing codebase patterns
Reason: No project files found (package.json, go.mod, etc.)
Proceeding with generic design - manual review required
```

**4. Constitution violations**
```
⚠️ Constitution violations found in generated TECH_DESIGN:

[error] OVER_ENGINEERING: Unnecessary abstraction detected
  Location: TECH_DESIGN.md:Section 2.2
  Issue: Custom repository pattern - use Prisma directly per Article VIII

[warning] FUTURE_PROOFING: Speculative feature detected
  Location: TECH_DESIGN.md:Section 1.2
  Issue: Message queue for "future event-driven architecture" - remove per Article VII

Review and fix these issues before proceeding to /flow-epic.
```

### Recovery

If technical design fails:
1. Check EXECUTION_LOG.md for error details
2. Review tech-architect agent output
3. Fix any validation errors
4. Re-run /flow-tech to regenerate

## Integration with Other Commands

### Workflow Integration
```text
/flow-init     → Initialize structure ✅
  ↓
/flow-prd      → Generate PRD.md ✅
  ↓
/flow-ui       → Generate UI_PROTOTYPE.html (optional) ✅
  ↓
/flow-tech     → Generate TECH_DESIGN.md ← YOU ARE HERE
  ↓
/flow-epic     → Generate EPIC.md and TASKS.md (uses TECH_DESIGN.md)
  ↓
/flow-dev      → Implement tasks
  ↓
/flow-qa       → Quality assurance
  ↓
/flow-release  → Create PR and merge
```

### Dependency on /flow-prd
This command requires /flow-prd to have been run first:
- PRD.md must exist with complete functional requirements
- orchestration_status.json must show status="prd_complete" or "ui_complete"
- EXECUTION_LOG.md must exist

### Enables /flow-epic
After successful technical design:
- TECH_DESIGN.md becomes input for Epic planning
- planner agent uses TECH_DESIGN.md to generate comprehensive TASKS.md
- **Ensures task breakdown includes all technical layers (no missing details)**

## Script Integration

This command uses the unified script infrastructure:

### Scripts Called
```bash
# 1. Get requirement paths
.claude/scripts/check-prerequisites.sh --json --paths-only

# 2. Validate Constitution
.claude/scripts/validate-constitution.sh --type tech_design --severity warning

# 3. Log events (via common.sh)
source .claude/scripts/common.sh
log_event "$REQ_ID" "Technical design completed"
```

### Agent Called
```text
tech-architect agent (research-type)
- Analyzes existing codebase
- Reads TECH_DESIGN_TEMPLATE.md
- Follows Execution Flow
- Writes complete TECH_DESIGN.md
- Logs events
```

## Best Practices

### Before Running
1. Ensure /flow-prd completed successfully
2. Review PRD.md to understand functional requirements
3. Understand existing codebase structure
4. Have clear idea of non-functional requirements (performance, security, scalability)

### During Execution
1. Analyze existing codebase thoroughly
2. Reuse existing patterns and components
3. Justify every technology choice
4. Design complete data models upfront
5. Define all API contracts before implementation

### After Running
1. **Review TECH_DESIGN.md thoroughly**
2. Verify all technologies are compatible with existing stack
3. Check Constitution compliance (Phase -1 Gates)
4. Validate completeness before /flow-epic
5. Edit TECH_DESIGN.md manually if adjustments needed

### Troubleshooting
1. Check tech-architect agent output for errors
2. Review EXECUTION_LOG.md for detailed steps
3. Use validate-constitution.sh to check specific issues
4. Re-run /flow-tech after fixing PRD or adding missing information

---

**Note**: This command invokes the tech-architect research agent which analyzes requirements and codebase, then generates structured technical design. The agent does not execute code, only creates the TECH_DESIGN.md file following the self-executable template pattern.

## Key Benefits for planner

By generating TECH_DESIGN.md before EPIC/TASKS, we provide planner with:

1. **Complete Technical Context**:
   - All layers (frontend, backend, database, API) designed
   - All technologies selected and justified
   - All data models and relationships defined

2. **Clear Implementation Guidance**:
   - Specific technologies and versions
   - Exact API endpoints and schemas
   - Database tables and indexes
   - Security and performance strategies

3. **Better Task Breakdown**:
   - planner can generate tasks for ALL layers
   - No missing technical details
   - Tasks aligned with technical architecture
   - Clear DoD based on technical design

4. **Reduced Ambiguity**:
   - Technology choices already made
   - API contracts predefined
   - Data model complete
   - Security/performance requirements clear

This ensures TASKS.md is comprehensive and implementation-ready.
