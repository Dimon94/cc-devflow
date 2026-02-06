---
name: flow-epic
description: 'Generate Epic and Tasks breakdown with bite-sized tasks. Usage: /flow-epic "REQ-123" or /flow-epic'
---

# Flow-Epic Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

生成 Epic 和 Tasks 分解，遵循 bite-sized tasks 原则。

## Bite-Sized Tasks 原则

```yaml
Task 粒度规范:
  - 每个 step 2-5 分钟可完成
  - "Write the failing test" = 1 step
  - "Run it to make sure it fails" = 1 step
  - "Implement minimal code to pass" = 1 step

Bad Examples:
  ❌ "Implement user authentication"
  ❌ "Add validation"

Good Examples:
  ✅ "Create src/auth/login.ts with LoginRequest interface"
  ✅ "Write failing test: POST /api/login returns 401"
```

## Input Format

```
/flow-epic "REQ_ID"
/flow-epic             # Auto-detect
```

## Entry Gate

1. **PRD.md** 完整且无 `{{PLACEHOLDER}}`
2. **TECH_DESIGN.md** 存在 (推荐)
3. **Checklist Gate** (如 checklists/ 存在)
4. **Constitution Gate** 通过

## Execution Flow

### Stage 1: Context Loading

加载:
- PRD.md
- TECH_DESIGN.md
- research/research.md
- BRAINSTORM.md

### Stage 2: Epic Generation

调用 `planner` agent:
- 输出: EPIC.md + TASKS.md
- TDD 顺序: Tests → Implementation
- Phase -1 Gates 检查

### Stage 3: Exit Gate

1. EPIC.md 存在
2. TASKS.md 存在且 TDD 顺序正确
3. 无 `{{PLACEHOLDER}}`
4. Status: `epic_complete`

## Output

```
devflow/requirements/${REQ_ID}/
├── EPIC.md
└── TASKS.md
```

## TDD Task Order

```
Phase 2: Tests (先写测试)
  - [ ] T001: Write failing test for X
  - [ ] T002: Write failing test for Y

Phase 3: Implementation (后写实现)
  - [ ] T003: Implement X to pass tests
  - [ ] T004: Implement Y to pass tests
```

## Next Step

```
/flow-dev "${REQ_ID}"
```
