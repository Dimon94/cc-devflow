---
description: Generate project-specific development guidelines skills (frontend/backend separately). Usage: /core-guidelines [--frontend|--backend|--new|--force]
---

# Generate Project Development Guidelines

**Purpose**: Automatically detect or configure your project's tech stack and generate customized development guidelines as separate Claude Code skills (frontend-guidelines, backend-guidelines).

## Core Principle: Separation of Concerns

**Frontend and backend are INDEPENDENT skills**, each with clear activation boundaries:
- `frontend-guidelines`: Activates when editing `.tsx`, `.vue`, `.svelte` files
- `backend-guidelines`: Activates when editing backend/, api/, server/ files

## Usage

```bash
# Auto-detect and generate (may create 1 or 2 skills)
/core-guidelines

# Generate frontend guidelines only
/core-guidelines --frontend

# Generate backend guidelines only
/core-guidelines --backend

# New project - interactive tech stack setup
/core-guidelines --new

# Force regenerate existing guidelines
/core-guidelines --force

# Preview without writing files
/core-guidelines --dry-run
```

---

## Process

### Step 1: Determine Scope

You will first determine what to generate based on:

1. **Command arguments**:
   - `--frontend` → Generate frontend-guidelines only
   - `--backend` → Generate backend-guidelines only
   - No argument → Auto-detect

2. **Project detection** (if no argument):
   ```typescript
   const hasFrontend = await detectFrontend();  // Check for src/, package.json with react/vue
   const hasBackend = await detectBackend();    // Check for backend/, api/, server/ directories

   if (!hasFrontend && !hasBackend) {
       // New project - ask user
       scope = await askUserScope();
   } else {
       scope = {
           frontend: hasFrontend,
           backend: hasBackend
       };
   }
   ```

3. **Detection logic**:
   ```bash
   # Frontend detection
   - Check for package.json with dependencies: react, vue, angular, svelte
   - Check for src/ directory with .tsx, .vue, .svelte files
   - Check for frontend/, client/, web/ directories

   # Backend detection
   - Check for backend/, server/, api/ directories
   - Check for Express, Fastify, NestJS in package.json
   - Check for requirements.txt (Python)
   - Check for go.mod (Go)
   ```

---

### Step 2: Gather Tech Stack Information

#### Scenario A: New Project (Interactive)

If no tech stack detected, present interactive selection:

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 NEW PROJECT SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What are you building?
a) Frontend only (SPA, SSR app)
b) Backend only (API server)
c) Full-stack (both frontend + backend)

Choice: [user input]

```

**If Frontend chosen or detected**:

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 FRONTEND TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Framework:
a) React
b) Vue
c) Angular
d) Svelte
e) Next.js (React framework)
f) Nuxt (Vue framework)

Choice: [user input]

UI Library (optional):
a) Material-UI (MUI)
b) Ant Design
c) Chakra UI
d) Tailwind CSS
e) Shadcn UI
f) None (CSS-in-JS only)

Choice: [user input]

Data Fetching (optional):
a) TanStack Query (React Query)
b) SWR
c) Apollo Client (GraphQL)
d) RTK Query (Redux)
e) Native fetch

Choice: [user input]

```

**If Backend chosen or detected**:

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️  BACKEND TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Framework:
a) Express (Node.js)
b) Fastify (Node.js)
c) NestJS (Node.js)
d) Django (Python)
e) FastAPI (Python)
f) Gin/Echo (Go)

Choice: [user input]

Database/ORM:
a) Prisma (Node.js - PostgreSQL/MySQL/SQLite)
b) TypeORM (Node.js)
c) Sequelize (Node.js)
d) Drizzle ORM (Node.js)
e) SQLAlchemy (Python)
f) GORM (Go)
g) Raw SQL

Choice: [user input]

```

#### Scenario B: Existing Project (Auto-detect + Confirm)

If tech stack detected, confirm with user:

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 DETECTED TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend:
  ✓ React 18.2.0
  ✓ Material-UI v7
  ✓ TanStack Query
  ✓ TanStack Router

  Files found: src/**/*.tsx (23 files)
  Confidence: HIGH ✓

Backend:
  ✓ Express 4.18.2
  ✓ Prisma ORM
  ✓ TypeScript
  ✓ MySQL 8.0

  Files found: backend/**/*.ts (18 files)
  Confidence: HIGH ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Is this correct?
a) Yes, generate guidelines for both
b) Yes, but frontend only
c) Yes, but backend only
d) No, let me specify manually
e) Cancel

Choice: [user input]

```

---

### Step 3: Invoke Agent (Separately for Frontend/Backend)

**IMPORTANT**: Call the agent SEPARATELY for each skill to maintain separation of concerns.

#### If generating frontend-guidelines:

```typescript
await Task({
    subagent_type: "project-guidelines-generator",
    prompt: `Generate frontend-guidelines skill.

Target Skill: frontend-guidelines
Scope: frontend-only

Tech Stack:
${JSON.stringify(frontendTechStack, null, 2)}

Instructions:
1. Read reference from .claude/skills/_reference-implementations/frontend-react-mui/
2. Fetch official documentation via Context7 for:
   - ${frontendTechStack.framework}
   - ${frontendTechStack.ui_library || 'N/A'}
   - ${frontendTechStack.data_fetching || 'N/A'}
3. Adapt reference implementation to target tech stack
4. Generate SKILL.md + resources/ for frontend patterns
5. Update skill-rules.json with frontend-specific triggers
6. Return result

DO NOT ask user questions. All information provided above.`
});
```

#### If generating backend-guidelines:

```typescript
await Task({
    subagent_type: "project-guidelines-generator",
    prompt: `Generate backend-guidelines skill.

Target Skill: backend-guidelines
Scope: backend-only

Tech Stack:
${JSON.stringify(backendTechStack, null, 2)}

Instructions:
1. Read reference from .claude/skills/_reference-implementations/backend-express-prisma/
2. Fetch official documentation via Context7 for:
   - ${backendTechStack.framework}
   - ${backendTechStack.orm || 'N/A'}
3. Adapt reference implementation to target tech stack
4. Generate SKILL.md + resources/ for backend patterns
5. Update skill-rules.json with backend-specific triggers
6. Return result

DO NOT ask user questions. All information provided above.`
});
```

---

### Step 4: Display Results

After generation, display comprehensive summary:

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DEVELOPMENT GUIDELINES GENERATED!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 FRONTEND GUIDELINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tech Stack: React + Material-UI v7 + TanStack Query
Location: .claude/skills/frontend-guidelines/

Files Created:
  ✓ SKILL.md (487 lines)
  ✓ resources/component-patterns.md
  ✓ resources/data-fetching.md
  ✓ resources/styling-guide.md
  ✓ resources/routing-guide.md
  ✓ resources/performance.md
  ✓ resources/typescript-standards.md

Activation Triggers:
  • File patterns: src/**/*.tsx, frontend/**/*.ts, client/**/*.jsx
  • Keywords: component, React, MUI, styling, hooks
  • Intent: "create a component", "fetch data", "style with MUI"

📝 Test Activation:
   Edit a file: src/components/App.tsx
   → frontend-guidelines should auto-suggest

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️  BACKEND GUIDELINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tech Stack: Express + Prisma + TypeScript
Location: .claude/skills/backend-guidelines/

Files Created:
  ✓ SKILL.md (452 lines)
  ✓ resources/architecture-overview.md
  ✓ resources/routing-controllers.md
  ✓ resources/services-repositories.md
  ✓ resources/validation-patterns.md
  ✓ resources/database-patterns.md
  ✓ resources/error-handling.md

Activation Triggers:
  • File patterns: backend/**/*.ts, api/**/*.ts, server/**/*.ts
  • Keywords: controller, service, API, Prisma, endpoint
  • Intent: "create an API", "database query", "validate input"

📝 Test Activation:
   Edit a file: backend/controllers/user.ts
   → backend-guidelines should auto-suggest

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 NEXT STEPS

1. Try editing a frontend file
   → frontend-guidelines activates (backend doesn't interfere)

2. Try editing a backend file
   → backend-guidelines activates (frontend doesn't interfere)

3. Customize for your project:
   • Add project-specific patterns to resources/
   • Update examples with your code style

4. Update when tech stack changes:
   /core-guidelines --force

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```

---

## Detection Patterns Reference

### Frontend Detection

```bash
# React
- dependencies.react || devDependencies.react
- Files: src/**/*.jsx, src/**/*.tsx
- Config: vite.config.ts with @vitejs/plugin-react

# Vue
- dependencies.vue
- Files: src/**/*.vue
- Config: vite.config.ts with @vitejs/plugin-vue

# Angular
- dependencies["@angular/core"]
- Files: angular.json exists

# Next.js
- dependencies.next
- Files: next.config.js

# Svelte
- dependencies.svelte
- Files: src/**/*.svelte
```

### Backend Detection

```bash
# Express
- dependencies.express
- Files: backend/app.ts, server/index.ts

# Fastify
- dependencies.fastify

# NestJS
- dependencies["@nestjs/core"]
- Files: nest-cli.json

# Django
- Files: requirements.txt with "django"
- Files: manage.py

# FastAPI
- Files: requirements.txt with "fastapi"

# Go
- Files: go.mod
- Files: main.go
```

---

## Edge Cases

### Multiple Frameworks Detected

```markdown
⚠️  MULTIPLE FRAMEWORKS DETECTED

Frontend:
  • React (23 files) ✓ RECOMMENDED
  • Vue (5 files)

Backend:
  • Express (18 files) ✓ RECOMMENDED
  • Django (2 files)

Options:
a) Generate for most-used (React + Express)
b) Let me choose which frameworks
c) Cancel and specify manually

Choice: [user input]
```

### No Tech Stack Detected (New Project)

Automatically trigger interactive setup (see Scenario A above).

### Partial Detection

```markdown
Detected Frontend: React + MUI
Backend: Not detected

Options:
a) Generate frontend-guidelines only
b) Setup backend tech stack now
c) Cancel

Choice: [user input]
```

---

## Options Reference

| Flag | Description | Example |
|------|-------------|---------|
| `--frontend` | Generate frontend-guidelines only | `/core-guidelines --frontend` |
| `--backend` | Generate backend-guidelines only | `/core-guidelines --backend` |
| `--new` | Force interactive setup (ignore detection) | `/core-guidelines --new` |
| `--force` | Overwrite existing guidelines | `/core-guidelines --force` |
| `--dry-run` | Show what would be generated (no writes) | `/core-guidelines --dry-run` |

---

## Related Commands

- `/flow-init` - Initialize new requirement (can call /core-guidelines)
- `/flow-tech` - Technical design (analyzes tech stack similarly)

---

## Constitution Compliance

Before finalizing, verify:
- [ ] No hardcoded project-specific paths in generated examples
- [ ] No secrets or credentials
- [ ] SKILL.md < 500 lines (progressive disclosure to resources/)
- [ ] skill-rules.json is valid JSON
- [ ] File triggers match actual project structure
- [ ] Both frontend and backend skills are INDEPENDENT (no cross-dependencies)

---

Now execute the workflow above!
