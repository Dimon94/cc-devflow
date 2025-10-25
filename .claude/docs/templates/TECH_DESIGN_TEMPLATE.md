# TECH_DESIGN_TEMPLATE.md

**Purpose**: Self-executable template for generating comprehensive technical design documents that ensure complete task breakdown in EPIC/TASKS phase.

**Usage**: tech-architect agent MUST follow the Execution Flow below step-by-step to generate TECH_DESIGN.md.

---

## Execution Flow

### Step 1: Load Context and Prerequisites

```yaml
Inputs Required:
  - CLAUDE.md: Tech stack baseline (ANTI-TECH-CREEP enforcement)
  - PRD.md: Functional requirements, user stories, acceptance criteria
  - UI_PROTOTYPE.html: (Optional) UI design if exists
  - Codebase Analysis: Existing patterns, technologies, reusable components
  - orchestration_status.json: Current requirement status

Actions:
  1. Run: .claude/scripts/check-prerequisites.sh --json --paths-only
  2. Parse: REQ_ID, REQ_DIR, PRD_FILE paths
  3. **Load Tech Stack Baseline (CRITICAL)**:
     - Read: CLAUDE.md → "## Technical Architecture" section
     - Extract: Frontend, Backend, Database, ORM, Key libraries (with versions)
     - Store as BASELINE_TECH_STACK for later validation
     - Example baseline:
       ```
       Frontend: React 18 with TypeScript 5.0
       Backend: Express 4.18 with TypeScript
       Database: PostgreSQL 15
       ORM: Prisma 5.0
       Authentication: JWT with bcrypt
       Validation: Zod 3.22
       Testing: Jest 29 with supertest
       ```
     - If section missing: ERROR "CLAUDE.md missing tech architecture (Stage 0 should have updated it)"
  4. Read: PRD.md content
  5. Read: research/codebase-analysis.md (if exists)
  6. Read: UI_PROTOTYPE.html summary (if exists)
  7. Extract: Functional requirements from PRD
  8. Extract: Non-functional requirements (performance, security, scalability)

Validation:
  - PRD.md exists and is complete (no {{PLACEHOLDER}})
  - Functional requirements are clear
  - User stories have acceptance criteria
```

### Step 2: Analyze Existing Codebase Patterns

```yaml
Purpose: Understand existing technical stack and reusable components

Actions:
  1. Identify project type:
     - Search: package.json (Node.js)
     - Search: go.mod (Go)
     - Search: pom.xml (Java)
     - Search: requirements.txt, pyproject.toml (Python)

  2. Analyze existing data models:
     - Grep: "class.*Model", "interface.*Entity", "type.*Schema"
     - Locations: models/, entities/, schemas/, database/
     - Extract: Naming patterns, ORM usage

  3. Analyze existing API patterns:
     - Grep: "router\.", "app\.(get|post)", "@(Get|Post|Put|Delete)"
     - Locations: routes/, controllers/, handlers/, api/
     - Extract: REST/GraphQL conventions, middleware patterns

  4. Analyze existing security:
     - Grep: "authenticate", "authorize", "jwt", "oauth"
     - Locations: auth/, middleware/, security/
     - Extract: Auth strategy, secret management

  5. Analyze existing database:
     - Grep: "createConnection", "mongoose", "prisma", "typeorm"
     - Locations: database/, db/, config/
     - Extract: Database type, ORM, migration strategy

Output:
  - Codebase Patterns Summary (for Section 1.4 and reuse in design)
```

### Step 3: Design System Architecture

```yaml
Purpose: Define high-level system architecture and module breakdown

Actions:
  1. Define architecture layers:
     - Frontend: User interface layer (if applicable)
     - API Gateway: Request routing and middleware
     - Business Logic: Core services
     - Data Layer: Database and cache
     - External Services: Third-party integrations

  2. Create architecture diagram (text-based):
     Example:
     ```
     [Frontend] <--HTTPS--> [API Gateway] <---> [Service A]
                                 |                  |
                                 v                  v
                           [Service B]        [Database]
                                 |
                                 v
                             [Cache]
     ```

  3. Define module breakdown:
     - List all modules/services
     - Define responsibility for each
     - Identify dependencies between modules

  4. Define data flow:
     - User Request → Frontend → API → Service → Database
     - Include error handling flow
     - Include authentication flow

Output:
  - Section 1: System Architecture (Overview, Modules, Data Flow)

Validation:
  - ≤3 major modules (Constitution Article VII: Simplicity Gate)
  - Clear separation of concerns
  - No circular dependencies
```

### Step 4: Select Technologies with Justification (ENFORCE BASELINE)

```yaml
Purpose: Choose specific technologies for each layer with clear reasoning
CRITICAL: Use BASELINE_TECH_STACK from Step 1 (ANTI-TECH-CREEP enforcement)

Actions:
  0. **Load Baseline Constraints**:
     - Retrieve: BASELINE_TECH_STACK from Step 1
     - Default Policy: Use baseline tech stack for all layers
     - Deviation Policy: Only add new tech if PRD explicitly requires it
     - Rejection Examples:
       * ❌ "Replace Express with NestJS" (unnecessary refactoring)
       * ❌ "Add GraphQL" (PRD doesn't require it, YAGNI)
       * ❌ "Switch from Prisma to TypeORM" (no justification)
     - Approval Examples:
       * ✅ "Add Redis for caching" (PRD requires <500ms API response)
       * ✅ "Add Zod for validation" (already in baseline, reuse)

  1. Frontend technology selection (if applicable):
     - **ENFORCE BASELINE**: Use baseline frontend framework from CLAUDE.md
     - Framework: ${BASELINE.frontend} (e.g., React 18 with TypeScript 5.0)
       * Justification: "Using existing ${BASELINE.frontend} from CLAUDE.md baseline"
     - State Management: ${BASELINE.state_mgmt or "lightweight option"}
       * If not in baseline: Justify why needed for PRD requirements
     - UI Library: ${BASELINE.ui_library or "framework defaults"}
       * Only add if PRD requires specific UI components
     - Build Tool: ${BASELINE.build_tool or "framework defaults"}
       * Use existing tooling

  2. Backend technology selection:
     - **ENFORCE BASELINE**: Use baseline backend framework from CLAUDE.md
     - Framework: ${BASELINE.backend} (e.g., Express 4.18 with TypeScript)
       * Justification: "Using existing ${BASELINE.backend} from CLAUDE.md baseline"
     - ORM: ${BASELINE.orm} (e.g., Prisma 5.0)
       * Justification: "Using existing ${BASELINE.orm} from CLAUDE.md baseline"
     - Validation: ${BASELINE.validation} (e.g., Zod 3.22)
       * Justification: "Using existing ${BASELINE.validation} from CLAUDE.md baseline"
     - If new library needed:
       * Justification format: "Adding ${lib} because ${prd_requirement} requires ${capability}"
       * Example: "Adding express-rate-limit because PRD requires protection against brute-force attacks"

  3. Database selection:
     - **ENFORCE BASELINE**: Use baseline database from CLAUDE.md
     - Primary DB: ${BASELINE.database} (e.g., PostgreSQL 15)
       * Justification: "Using existing ${BASELINE.database} from CLAUDE.md baseline"
     - Cache: ${BASELINE.cache or "Add if needed"}
       * If not in baseline: Justify with PRD performance requirements
       * Example: "Adding Redis 7.0 because PRD requires <500ms API response time"

  4. Infrastructure selection:
     - **ENFORCE BASELINE**: Use existing deployment approach
     - Deployment: ${BASELINE.deployment or "Docker + Docker Compose"}
       * Justification: "Using existing deployment approach"
     - CI/CD: ${BASELINE.cicd or "GitHub Actions"}
       * Justification: "Using existing CI/CD pipeline"
     - Hosting: ${BASELINE.hosting or "[TBD based on requirements]"}

  5. **Deviation Tracking**:
     - Compare selected tech stack with BASELINE_TECH_STACK
     - Document all deviations in a "Deviation from Baseline" list
     - Format: `| New Technology | PRD Requirement | Justification | Approved? |`
     - Example: `| Redis Cache | <500ms API response | High-frequency reads require caching | YES |`

Output:
  - Section 2: Technology Stack (Frontend, Backend, Database, Infrastructure)
  - Each technology with version number and justification
  - **NEW**: "Deviation from Baseline" subsection (if any deviations)

Validation:
  - **Baseline Adherence**: All baseline technologies reused (no replacements)
  - All technologies are specific with versions (no "modern framework")
  - Direct framework usage (Constitution Article VIII: Anti-Abstraction Gate)
  - All deviations explicitly justified with PRD requirements
  - No over-engineering (Constitution Article II)
```

### Step 5: Define Data Models and Relationships

```yaml
Purpose: Design complete database schema with all tables, fields, and relationships

Actions:
  1. Extract data entities from PRD user stories:
     - Identify nouns in user stories (User, Order, Product, etc.)
     - Map to database tables

  2. Define table schemas:
     For each table:
     - Table name (plural, snake_case)
     - Columns:
       * Column name (snake_case)
       * Data type (UUID, VARCHAR, INTEGER, TIMESTAMP, etc.)
       * Constraints (PRIMARY KEY, UNIQUE, NOT NULL, FOREIGN KEY)
       * Description
     - Primary key
     - Foreign keys

  3. Define entity relationships:
     - One-to-One (1:1)
     - One-to-Many (1:N)
     - Many-to-Many (M:N) with junction tables
     - Example: User 1:N Orders, Order N:M Products (through order_items)

  4. Define indexes for performance:
     - Unique indexes for unique constraints
     - Indexes on frequently queried fields
     - Composite indexes for multi-column queries
     - Example: users(email), orders(user_id, created_at)

  5. Define constraints:
     - Foreign key constraints with ON DELETE/UPDATE actions
     - Check constraints (if needed)
     - Default values

Output:
  - Section 3: Data Model Design
    - 3.1: Database Schema (all tables with columns)
    - 3.2: Entity Relationships (visual text representation)
    - 3.3: Indexes and Constraints

Validation:
  - All entities from PRD are represented
  - All tables have primary keys
  - All foreign keys are defined
  - Indexes on frequently queried fields
  - No redundant data (normalized to 3NF unless justified)
```

### Step 6: Design API Contracts

```yaml
Purpose: Define all API endpoints with request/response schemas BEFORE implementation

Actions:
  1. Extract API requirements from PRD:
     - Identify all user actions (register, login, create order, etc.)
     - Map to CRUD operations

  2. Define API endpoints:
     For each endpoint:
     - HTTP Method: GET, POST, PUT, PATCH, DELETE
     - Path: /api/resource or /api/resource/:id
     - Purpose: 1 sentence description
     - Authentication: Required? (Yes/No, Role required)
     - Request:
       * Query params (if GET)
       * Path params (if /:id)
       * Request body (JSON schema)
       * Validation rules
     - Response:
       * Success (200/201/204): JSON schema
       * Errors: 400, 401, 403, 404, 409, 500 with messages

  3. Define data validation rules:
     - Email: valid format, max length
     - Password: min length, complexity requirements
     - Required fields
     - Optional fields with defaults
     - Array min/max length
     - Number min/max values

  4. Define error response format:
     Standard error schema:
     ```json
     {
       "error": {
         "code": "VALIDATION_ERROR",
         "message": "Human-readable message",
         "details": [
           {
             "field": "email",
             "issue": "Invalid email format"
           }
         ]
       }
     }
     ```

  5. Group endpoints by resource:
     - Auth endpoints: /api/auth/*
     - User endpoints: /api/users/*
     - Order endpoints: /api/orders/*
     - etc.

Output:
  - Section 4: API Design
    - 4.1: API Endpoints (grouped by resource)
    - Each endpoint with method, path, request, response, errors
    - 4.2: Validation Rules
    - 4.3: Error Response Format

Validation:
  - All user stories map to API endpoints
  - All endpoints have request/response schemas
  - All endpoints have error handling
  - RESTful conventions followed (unless GraphQL)
  - Constitution Article IX: Integration-First Gate (Contracts defined first)
```

### Step 7: Plan Security Strategy

```yaml
Purpose: Define authentication, authorization, secret management, and input validation

Actions:
  1. Define authentication strategy:
     - Strategy: JWT/OAuth2/Session-based/API Keys
     - Token expiry: Access token TTL, Refresh token TTL
     - Token storage: Where tokens are stored (database, Redis, etc.)
     - Token refresh mechanism

  2. Define authorization model:
     - Model: RBAC (Role-Based) / ABAC (Attribute-Based) / ACL
     - Roles: admin, user, guest, etc.
     - Permissions per role
     - Implementation: Middleware checks

  3. Define secret management:
     - ✅ **NO HARDCODED SECRETS** (Constitution Article III)
     - Strategy: Environment variables (.env file)
     - Required secrets:
       * JWT_SECRET or equivalent
       * DATABASE_URL
       * REDIS_URL
       * API keys for third-party services
     - Secret rotation: Every 90 days or per security policy
     - Secret storage: .env file (not committed), CI/CD secrets

  4. Define input validation:
     - Tool: Zod/Joi/class-validator/express-validator
     - Validation points: All API endpoints
     - SQL injection prevention: Use ORM (parameterized queries)
     - XSS prevention: React escapes by default, CSP headers
     - CSRF prevention: SameSite cookies, CSRF tokens

  5. Define rate limiting:
     - Login attempts: Max attempts per IP/user per time window
     - API requests: Max requests per user/IP per time window
     - Tool: express-rate-limit or equivalent

  6. Define security headers:
     - Helmet.js or equivalent
     - CSP (Content Security Policy)
     - HSTS (Strict Transport Security)
     - X-Frame-Options

Output:
  - Section 5: Security Design
    - 5.1: Authentication (strategy, tokens, refresh)
    - 5.2: Authorization (model, roles, permissions)
    - 5.3: Secret Management (NO HARDCODED SECRETS, env vars, rotation)
    - 5.4: Input Validation (tool, SQL/XSS/CSRF prevention)
    - 5.5: Rate Limiting (rules, tool)
    - 5.6: Security Headers

Validation:
  - ✅ NO HARDCODED SECRETS (Constitution Article III)
  - All secrets in environment variables
  - Input validation on all endpoints
  - SQL/XSS/CSRF prevention measures defined
```

### Step 8: Plan Performance and Scalability

```yaml
Purpose: Define caching, optimization, and scalability strategies

Actions:
  1. Define caching strategy:
     - Cache layer: Redis/Memcached/In-memory
     - What to cache:
       * User sessions: TTL (e.g., 15min)
       * User profiles: TTL (e.g., 5min)
       * Product catalog: TTL (e.g., 10min)
     - Cache key patterns: user:{userId}:profile, product:{productId}
     - Cache invalidation: On data update (write-through/write-behind)

  2. Define database optimization:
     - Indexes: On frequently queried fields
     - Query optimization: Use ORM's select to fetch only needed fields
     - Connection pooling: Max connections (e.g., 20)
     - Read replicas: For read-heavy operations (if needed)

  3. Define scalability approach:
     - Horizontal scaling: Stateless API servers behind load balancer
     - Database: Read replicas, sharding (if needed)
     - Cache: Redis cluster for high availability
     - CDN: For static assets (if applicable)

  4. Define performance targets:
     - API Response Time (p95): < 200ms
     - Database Query Time (p95): < 50ms
     - Concurrent Users: 100 / 1000 / 10000 (based on requirements)
     - Throughput: Requests per second (RPS)

Output:
  - Section 6: Performance Design
    - 6.1: Caching Strategy (what, TTL, invalidation)
    - 6.2: Database Optimization (indexes, pooling, replicas)
    - 6.3: Scalability (horizontal scaling, load balancing)
    - 6.4: Performance Targets (response time, throughput, concurrency)

Validation:
  - Caching strategy defined for frequently accessed data
  - Database indexes defined
  - Scalability approach appropriate for expected load
  - Performance targets measurable and realistic
```

### Step 9: Execute Phase -1 Constitutional Gates

```yaml
Purpose: Validate design against Constitution Articles VII, VIII, IX + ANTI-TECH-CREEP BEFORE implementation

Actions:
  0. **Baseline Deviation Check (ANTI-TECH-CREEP)**:
     Check:
     - [ ] All baseline technologies from CLAUDE.md are reused (no replacements)
     - [ ] All new technologies explicitly justified with PRD requirements
     - [ ] No unnecessary refactoring (keep existing patterns)
     - [ ] No unfamiliar third-party libraries without strong reason

     Validation:
     - Compare Section 2 (Technology Stack) with BASELINE_TECH_STACK from Step 1
     - Identify all deviations (new tech, replaced tech, removed tech)
     - For each deviation:
       * Verify it's listed in "Deviation from Baseline" subsection in Section 2
       * Verify PRD requirement that necessitates it
       * Verify justification is concrete (not "might be useful" or "best practice")
       * Example valid: "Adding Redis because PRD requires <500ms API response"
       * Example invalid: "Replacing Express with NestJS for better architecture"

     If violations found:
     - Document in Complexity Tracking table
     - Format: `| Baseline Deviation | ${tech_change} | ${justification} | ${approved} |`
     - Example: `| Redis Cache | PRD requires <500ms response | Caching layer needed | YES |`
     - Require explicit approval for all deviations

  1. Simplicity Gate (Article VII):
     Check:
     - [ ] ≤3 projects/modules (count frontend, backend, database as separate if truly separate)
     - [ ] No future-proofing (no "we might need X later" features)
     - [ ] Minimal dependencies (only essential packages)

     If violated:
     - Document in Complexity Tracking table
     - Provide justification
     - Require explicit approval

  2. Anti-Abstraction Gate (Article VIII):
     Check:
     - [ ] Direct framework usage (no custom wrappers around Express/React/etc.)
     - [ ] Single data model (Prisma schema / TypeORM entities as single source)
     - [ ] No unnecessary interfaces (no BaseController, BaseService unless justified)

     If violated:
     - Document in Complexity Tracking table
     - Provide justification
     - Require explicit approval

  3. Integration-First Gate (Article IX):
     Check:
     - [ ] Contracts defined first (API endpoints in Section 4)
     - [ ] Contract tests planned (will write in TASKS Phase 2)
     - [ ] Real environment testing (Docker for Postgres + Redis, not mocks)

     If violated:
     - Document in Complexity Tracking table
     - Provide justification
     - Require explicit approval

Output:
  - Section 7: Constitution Check (Phase -1 Gates)
    - **7.0: Baseline Deviation Check (ANTI-TECH-CREEP)**
    - 7.1: Simplicity Gate checklist
    - 7.2: Anti-Abstraction Gate checklist
    - 7.3: Integration-First Gate checklist
    - 7.4: Complexity Tracking table (if any violations)

Validation:
  - All gates checked
  - All violations documented and justified
  - No violations OR all violations explicitly approved
```

### Step 10: Validate Completeness and Generate Output

```yaml
Purpose: Final validation before outputting TECH_DESIGN.md

Validation Checklist:
  - [ ] Section 1: System Architecture (Overview, Modules, Data Flow) - Complete
  - [ ] Section 2: Technology Stack (Frontend, Backend, Database, Infrastructure) - Complete with versions and justifications
  - [ ] Section 3: Data Model Design (Schema, Relationships, Indexes) - Complete
  - [ ] Section 4: API Design (Endpoints, Request/Response, Errors) - Complete
  - [ ] Section 5: Security Design (Auth, Authz, Secret Mgmt, Validation) - Complete
  - [ ] Section 6: Performance Design (Caching, Optimization, Scalability) - Complete
  - [ ] Section 7: Constitution Check (Phase -1 Gates) - Complete
  - [ ] Section 8: Validation Checklist - Complete
  - [ ] No {{PLACEHOLDER}} patterns remaining
  - [ ] All technologies are specific with versions
  - [ ] All tables have primary keys and relationships defined
  - [ ] All API endpoints have schemas
  - [ ] ✅ NO HARDCODED SECRETS
  - [ ] Constitution gates passed or violations justified

Actions:
  1. If validation fails:
     - DO NOT output TECH_DESIGN.md
     - Report which checklist items failed
     - Provide guidance on what needs to be added/fixed
     - Example: "ERROR: Section 3 incomplete - missing user_roles table referenced in Section 5.2"

  2. If validation passes:
     - Generate complete TECH_DESIGN.md using the template structure below
     - Write to: devflow/requirements/${REQ_ID}/TECH_DESIGN.md
     - Update: orchestration_status.json (status = "tech_design_complete")
     - Log: log_event "${REQ_ID}" "Technical design completed"
     - Append to EXECUTION_LOG.md

Output:
  - Complete TECH_DESIGN.md file
  - Status update in orchestration_status.json
  - Log entry in EXECUTION_LOG.md
```

---

## Output Template Structure

```markdown
# Technical Design: ${REQ_ID} - ${TITLE}

**Status**: Draft
**Created**: ${ISO_8601_UTC_TIMESTAMP}
**Updated**: ${ISO_8601_UTC_TIMESTAMP}
**Type**: Technical Design

---

## 1. System Architecture

### 1.1 Architecture Overview

[Text-based architecture diagram showing all layers and components]

Example:
\`\`\`
[Frontend (React)] <--HTTPS--> [API Gateway (Express)] <---> [Auth Service]
                                     |                            |
                                     v                            v
                              [User Service]                [Database (PostgreSQL)]
                                     |
                                     v
                                [Cache (Redis)]
\`\`\`

### 1.2 Module Breakdown

- **Module A**: [Responsibility and purpose]
- **Module B**: [Responsibility and purpose]
- **Module C**: [Responsibility and purpose]

### 1.3 Data Flow

[Describe request → response flow with authentication, processing, and error handling]

Example:
1. User Request → Frontend
2. Frontend → API Gateway (with JWT token)
3. API Gateway → Auth Middleware (verify token)
4. Auth Middleware → Service (if authorized)
5. Service → Database (query/mutation)
6. Service → Cache (read/write)
7. Service → API Gateway (response)
8. API Gateway → Frontend (JSON response)

### 1.4 Existing Codebase Integration

[Describe how this design integrates with existing codebase patterns]

- Reuses: [List reusable components, middleware, utilities]
- Follows: [Existing naming conventions, file structure, code style]
- Extends: [Existing data models, API patterns, authentication]

---

## 2. Technology Stack

### 2.1 Frontend (if applicable)

- **Framework**: [e.g., React 18.2 with TypeScript 5.0]
  - **Justification**: [1-2 sentences on why this choice]
- **State Management**: [e.g., Redux Toolkit 2.0]
  - **Justification**: [1-2 sentences on why this choice]
- **UI Library**: [e.g., Material-UI 5.14]
  - **Justification**: [1-2 sentences on why this choice]
- **Build Tool**: [e.g., Vite 5.0]
  - **Justification**: [1-2 sentences on why this choice]

### 2.2 Backend

- **Framework**: [e.g., Express 4.18 with TypeScript 5.0]
  - **Justification**: [1-2 sentences on why this choice]
- **ORM**: [e.g., Prisma 5.0]
  - **Justification**: [1-2 sentences on why this choice]
- **Validation**: [e.g., Zod 3.22]
  - **Justification**: [1-2 sentences on why this choice]
- **Authentication**: [e.g., jsonwebtoken 9.0]
  - **Justification**: [1-2 sentences on why this choice]

### 2.3 Database

- **Primary DB**: [e.g., PostgreSQL 15]
  - **Justification**: [1-2 sentences on why this choice]
- **Cache**: [e.g., Redis 7.0]
  - **Justification**: [1-2 sentences on why this choice]

### 2.4 Infrastructure

- **Deployment**: [e.g., Docker + Docker Compose]
  - **Justification**: [1-2 sentences on why this choice]
- **CI/CD**: [e.g., GitHub Actions]
  - **Justification**: [1-2 sentences on why this choice]
- **Hosting**: [e.g., AWS EC2 / Vercel / Self-hosted]
  - **Justification**: [1-2 sentences on why this choice]

---

## 3. Data Model Design

### 3.1 Database Schema

[For each table, use this format:]

#### Table: ${table_name}

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | [Description] |
| ${column_name} | ${data_type} | ${constraints} | [Description] |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Update timestamp |

[Repeat for all tables]

### 3.2 Entity Relationships

[Visual text representation of relationships]

Example:
- User 1:N Orders (one user can have multiple orders)
- Order N:M Products (many-to-many through order_items junction table)
- User 1:1 UserProfile (one-to-one relationship)

[ERD-style text diagram if helpful:]
\`\`\`
users (1) ----< (N) orders
orders (N) >----< (M) products (through order_items)
users (1) ----| (1) user_profiles
\`\`\`

### 3.3 Indexes and Constraints

**Indexes**:
- ${table_name}(${column_name}) - [Purpose, e.g., "for login lookup"]
- ${table_name}(${col1}, ${col2}) - [Purpose, e.g., "composite index for user order history"]

**Constraints**:
- Foreign Keys:
  - orders.user_id → users.id ON DELETE CASCADE
  - order_items.order_id → orders.id ON DELETE CASCADE
- Unique Constraints:
  - users.email UNIQUE
- Check Constraints:
  - orders.total_amount > 0

---

## 4. API Design

### 4.1 API Endpoints

[Group endpoints by resource. For each endpoint:]

#### ${HTTP_METHOD} ${endpoint_path}

**Purpose**: [1 sentence description]

**Authentication**: [Required: Yes/No] [Role: admin/user/guest]

**Request**:
\`\`\`json
{
  "${field_name}": "${value_type}",
  ...
}
\`\`\`

**Validation**:
- ${field_name}: [validation rules, e.g., "valid email format, max 255 chars"]
- ${field_name}: [validation rules, e.g., "min 8 chars, must include uppercase, lowercase, number, special char"]

**Response** (${success_code}):
\`\`\`json
{
  "${field_name}": "${value}",
  ...
}
\`\`\`

**Errors**:
- 400: [Description, e.g., "Invalid input (email format, password strength)"]
- 401: [Description, e.g., "Unauthorized - invalid or missing token"]
- 403: [Description, e.g., "Forbidden - insufficient permissions"]
- 404: [Description, e.g., "Resource not found"]
- 409: [Description, e.g., "Conflict - email already exists"]
- 500: [Description, e.g., "Internal server error"]

[Repeat for all endpoints, grouped by resource]

### 4.2 Error Response Format

Standard error response schema:
\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "field_name",
        "issue": "Specific issue description"
      }
    ]
  }
}
\`\`\`

---

## 5. Security Design

### 5.1 Authentication

- **Strategy**: [e.g., JWT with access and refresh tokens]
- **Token Expiry**: Access [e.g., 15 minutes], Refresh [e.g., 7 days]
- **Token Storage**: [e.g., Access tokens in httpOnly cookies, Refresh tokens in database]
- **Token Refresh Mechanism**: [Describe refresh flow]

### 5.2 Authorization

- **Model**: [e.g., RBAC (Role-Based Access Control)]
- **Roles**:
  - admin: [Permissions, e.g., "Full access to all resources"]
  - user: [Permissions, e.g., "Access to own resources"]
  - guest: [Permissions, e.g., "Read-only access to public resources"]
- **Implementation**: [e.g., "Middleware checks JWT claims for role, blocks unauthorized requests"]

### 5.3 Secret Management

- ✅ **NO HARDCODED SECRETS** (Constitution Article III)
- **Strategy**: Environment variables stored in .env file (not committed to Git)
- **Required Secrets**:
  - JWT_SECRET: [Purpose, e.g., "For signing JWT access tokens"]
  - DATABASE_URL: [Purpose, e.g., "Database connection string"]
  - REDIS_URL: [Purpose, e.g., "Redis connection string"]
  - [Additional API keys for third-party services]
- **Secret Rotation**: [e.g., "Every 90 days or per security policy"]
- **Secret Storage**:
  - Development: .env file (gitignored)
  - Production: CI/CD secrets (GitHub Secrets, AWS Secrets Manager, etc.)

### 5.4 Input Validation

- **Tool**: [e.g., Zod schemas for all API inputs]
- **Validation Points**: All API endpoints validate request body, query params, path params
- **SQL Injection Prevention**: Use ORM (Prisma/TypeORM) with parameterized queries
- **XSS Prevention**:
  - React escapes by default
  - CSP (Content Security Policy) headers
  - Sanitize user-generated content
- **CSRF Prevention**:
  - SameSite cookies
  - CSRF tokens for state-changing operations (POST/PUT/DELETE)

### 5.5 Rate Limiting

- **Login Attempts**: [e.g., "Max 5 attempts per IP per 15 minutes"]
- **API Requests**: [e.g., "Max 100 requests per user per minute"]
- **Tool**: [e.g., "express-rate-limit middleware"]
- **Implementation**: [Describe rate limiting strategy]

### 5.6 Security Headers

- **Tool**: [e.g., "Helmet.js for Express"]
- **Headers**:
  - CSP (Content Security Policy): [Configuration]
  - HSTS (HTTP Strict Transport Security): [Configuration]
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: no-referrer

---

## 6. Performance Design

### 6.1 Caching Strategy

- **Cache Layer**: [e.g., Redis 7.0]
- **What to Cache**:
  - User sessions: TTL [e.g., 15 minutes]
  - User profiles: TTL [e.g., 5 minutes], invalidate on update
  - [Other cached data]: TTL [e.g., 10 minutes]
- **Cache Key Patterns**:
  - `user:{userId}:session`
  - `user:{userId}:profile`
  - [Additional patterns]
- **Cache Invalidation**:
  - Write-through: Update cache on data write
  - TTL-based: Expire after TTL
  - Manual: Invalidate on specific events

### 6.2 Database Optimization

- **Indexes**: [List all indexes from Section 3.3]
- **Query Optimization**:
  - Use ORM's select to fetch only needed fields
  - Avoid N+1 query problems with eager loading
- **Connection Pooling**: Max [e.g., 20] connections
- **Read Replicas**: [If applicable, describe read replica strategy]

### 6.3 Scalability

- **Horizontal Scaling**: Stateless API servers behind load balancer
- **Load Balancer**: [e.g., "Nginx or cloud provider load balancer"]
- **Database**:
  - Read replicas for read-heavy operations
  - Sharding [if needed]: [Describe sharding strategy]
- **Cache**: Redis cluster for high availability
- **CDN**: [If applicable] For static assets (images, CSS, JS)

### 6.4 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (p95) | < 200ms | Application Performance Monitoring (APM) |
| Database Query Time (p95) | < 50ms | Database query logs |
| Concurrent Users | [e.g., 1000+] | Load testing |
| Throughput (RPS) | [e.g., 500 requests/sec] | Load testing |

---

## 7. Constitution Check (Phase -1 Gates)

### 7.0 Baseline Deviation Check (ANTI-TECH-CREEP)

**Baseline Tech Stack** (from CLAUDE.md):
- **Frontend**: [e.g., React 18 with TypeScript 5.0]
- **Backend**: [e.g., Express 4.18 with TypeScript]
- **Database**: [e.g., PostgreSQL 15]
- **ORM**: [e.g., Prisma 5.0]
- **Authentication**: [e.g., JWT with bcrypt]
- **Validation**: [e.g., Zod 3.22]
- **Testing**: [e.g., Jest 29 with supertest]

**Deviation Analysis**:
- [x] **All baseline technologies reused**: [Verify all baseline tech in Section 2]
- [x] **All new technologies justified**: [List all deviations with PRD requirements]
- [x] **No unnecessary refactoring**: [Verify no replacements of baseline tech]
- [x] **No unfamiliar third-party libraries**: [Verify all new libraries have clear necessity]

**Deviations from Baseline** (if any):
| New/Changed Technology | PRD Requirement | Justification | Status |
|------------------------|-----------------|---------------|--------|
| [e.g., Redis Cache] | [e.g., <500ms API response] | [e.g., High-frequency reads require caching] | ✅ Approved |
| [If none, write "None"] | N/A | N/A | N/A |

**Status**: ✅ Passed (no deviations) / ⚠️ Deviations (see table above)

### 7.1 Simplicity Gate (Article VII)

- [ ] **≤3 projects/modules**: [List modules: e.g., "Frontend, Backend, Database = 3 modules"]
- [ ] **No future-proofing**: [Verify no speculative features like "might need message queue later"]
- [ ] **Minimal dependencies**: [List essential dependencies only]

**Status**: ✅ Passed / ⚠️ Violations (see Complexity Tracking)

### 7.2 Anti-Abstraction Gate (Article VIII)

- [ ] **Direct framework usage**: [Verify no custom wrappers, e.g., "Using Express directly, no BaseController"]
- [ ] **Single data model**: [Verify single source of truth, e.g., "Prisma schema is single source"]
- [ ] **No unnecessary interfaces**: [Verify no unnecessary abstraction layers]

**Status**: ✅ Passed / ⚠️ Violations (see Complexity Tracking)

### 7.3 Integration-First Gate (Article IX)

- [ ] **Contracts defined first**: [Verify API contracts in Section 4]
- [ ] **Contract tests planned**: [Verify tests will be written in TASKS Phase 2]
- [ ] **Real environment testing**: [Verify Docker for Postgres + Redis, not mocks]

**Status**: ✅ Passed / ⚠️ Violations (see Complexity Tracking)

### 7.4 Complexity Tracking

[Only if there are violations:]

| Violation Type | Potential Violation | Justification | Approved? |
|----------------|---------------------|---------------|-----------|
| Baseline Deviation | [Example: "Added Redis Cache"] | [Example: "PRD requires <500ms API response time"] | [YES/NO] |
| Simplicity | [Example: "4 modules instead of 3"] | [Example: "Frontend/Backend/Database/Cache - cache required for performance"] | [YES/NO] |
| Anti-Abstraction | [Example: "Custom BaseController"] | [Example: "..."] | [YES/NO] |
| Integration-First | [Example: "Mock database in tests"] | [Example: "..."] | [YES/NO] |

**Note**: If no violations, this table can be omitted or replaced with:
| [e.g., "Using 4 modules instead of 3"] | [e.g., "Separate admin service required for security isolation"] | [Yes/No/Pending] |
| [If none, write "None"] | N/A | N/A |

---

## 8. Validation Checklist

- [ ] **Section 1**: System Architecture (Overview, Modules, Data Flow) - Complete
- [ ] **Section 2**: Technology Stack (Frontend, Backend, Database, Infrastructure) - Complete with versions and justifications
- [ ] **Section 3**: Data Model Design (Schema, Relationships, Indexes) - Complete
- [ ] **Section 4**: API Design (Endpoints, Request/Response, Errors) - Complete
- [ ] **Section 5**: Security Design (Auth, Authz, Secret Mgmt, Validation) - Complete
- [ ] **Section 6**: Performance Design (Caching, Optimization, Scalability) - Complete
- [ ] **Section 7**: Constitution Check (Phase -1 Gates) - Complete
- [ ] **No placeholders**: No {{PLACEHOLDER}} patterns remaining
- [ ] **Specific technologies**: All technologies have versions (e.g., "React 18.2", not "modern framework")
- [ ] **Complete schema**: All tables have primary keys, foreign keys, indexes
- [ ] **Complete API**: All endpoints have request/response schemas and error handling
- [ ] **✅ NO HARDCODED SECRETS**: All secrets in environment variables
- [ ] **Constitution compliance**: Phase -1 Gates passed or violations justified

**Ready for Epic Planning**: ✅ YES / ❌ NO (if NO, explain what needs to be fixed)

---

**Generated by**: tech-architect agent (research-type)
**Template Version**: 1.0.0
**Constitution Version**: v2.0.0
```

---

## Template Usage Notes

### For tech-architect Agent

1. **Load this template** at the start of technical design process
2. **Follow Execution Flow** step-by-step (Steps 1-10)
3. **Fill all sections** of the Output Template Structure
4. **Validate completeness** using Step 10 checklist
5. **Output complete TECH_DESIGN.md** with no {{PLACEHOLDER}} remaining

### For planner Agent

After TECH_DESIGN.md is generated:

1. **Read TECH_DESIGN.md** as input to Epic and Tasks generation
2. **Use Section 3 (Data Model)** to generate database migration tasks
3. **Use Section 4 (API Design)** to generate API implementation tasks
4. **Use Section 5 (Security)** to generate security implementation tasks
5. **Use Section 6 (Performance)** to generate optimization tasks
6. **Ensure TASKS.md covers ALL layers** defined in TECH_DESIGN.md

This ensures comprehensive task breakdown with no missing technical details.

---

## Quality Criteria Summary

A complete TECH_DESIGN.md must have:

✅ **All 8 sections filled** with concrete technical details
✅ **No {{PLACEHOLDER}}** patterns remaining
✅ **Specific technologies** with versions and justifications
✅ **Complete database schema** with tables, columns, relationships, indexes
✅ **Complete API contracts** with all endpoints, request/response schemas, errors
✅ **Complete security plan** with NO HARDCODED SECRETS
✅ **Complete performance plan** with caching, optimization, scalability
✅ **Constitution compliance** with Phase -1 Gates passed or violations justified
✅ **Validation checklist** fully checked

Only then is it ready for Epic planning and task breakdown.
