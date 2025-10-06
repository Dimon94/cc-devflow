---
name: flow-epic
description: Generate Epic and Tasks breakdown. Usage: /flow-epic "REQ-123" or /flow-epic
---

# Flow-Epic - Epic 和任务规划命令

## 命令格式
```text
/flow-epic "REQ_ID"
/flow-epic             # Auto-detect from current branch
```

### 参数说明
- **REQ_ID**: 需求编号 (可选，默认从当前 Git 分支或环境变量获取)

### 示例
```text
/flow-epic "REQ-123"
/flow-epic              # On feature/REQ-123-* branch
```

## 执行流程

### 阶段 1: 前置条件检查 (Entry Gate)

**Execution Flow**:
```
1. Determine requirement ID
   → If REQ_ID provided: Use provided ID
   → Else: Run check-prerequisites.sh --json --paths-only
   → Parse REQ_ID from JSON output
   → If not found: ERROR "No requirement ID found"

2. Validate requirement structure exists
   → Run: check-prerequisites.sh --json --require-prd
   → Verify: REQ_DIR exists
   → Verify: PRD_FILE exists and not empty
   → If PRD missing: ERROR "PRD not found. Run /flow-prd first."

3. Check orchestration status
   → Read: orchestration_status.json
   → Verify: status is "prd_complete" or "epic_generation_failed"
   → Verify: "prd" in completedSteps
   → If wrong phase: ERROR "PRD must be completed before Epic generation"

4. Validate PRD quality
   → Run: validate-constitution.sh --type prd --severity error --json
   → Check: error_count == 0
   → If errors: ERROR "PRD has Constitution violations. Fix before Epic generation."

5. Check if Epic/Tasks already exist
   → Check: EPIC_FILE exists
   → Check: TASKS.md exists (single document format)
   → If exist: WARN "Epic/Tasks already exist. Regenerate? (y/n)"
   → User must confirm to proceed

*GATE CHECK: All prerequisite validations passed, PRD quality verified*
```

### 阶段 2: Epic 生成准备

**Execution Flow**:
```
1. Run setup script to initialize Epic/Tasks structure
   → Execute: .claude/scripts/setup-epic.sh --json
   → Parse JSON output for file paths:
     {
       "REQ_ID": "REQ-123",
       "EPIC_FILE": "/path/to/EPIC.md",
       "TASKS_FILE": "/path/to/TASKS.md"
     }
   → Verify: EPIC_FILE and TASKS_FILE paths received

2. Load templates
   → Read: .claude/docs/templates/EPIC_TEMPLATE.md
   → Read: .claude/docs/templates/TASKS_TEMPLATE.md
   → Verify: Both templates have Execution Flow sections
   → If missing: ERROR "Templates are not self-executable"

3. Load PRD for context
   → Read: PRD_FILE
   → Extract: User stories, acceptance criteria, NFRs
   → Count: Total user stories, API endpoints, data entities
   → Log: "Loaded PRD with ${story_count} user stories"

4. Update orchestration status
   → Set: status = "epic_generation_in_progress"
   → Set: phase = "planning"
   → Set: updatedAt = current timestamp
   → Write: orchestration_status.json

5. Log Epic generation start
   → Append to EXECUTION_LOG.md:
     "### $(date -Iseconds)
      Epic and Tasks generation started
      PRD user stories: ${story_count}
      Agent: planner"
```

### 阶段 3: 调用 planner Agent

**Agent Invocation**:
```
Task: planner agent
Prompt:
  You are generating Epic and Tasks breakdown for ${REQ_ID}: ${TITLE}.

  Context:
  - Requirement ID: ${REQ_ID}
  - PRD File: ${PRD_FILE}
  - User Stories: ${story_count} stories

  Your task:
  1. Run .claude/scripts/setup-epic.sh --json
     This initializes EPIC.md and TASKS.md structure
  2. Read PRD.md from ${PRD_FILE}
  3. Read EPIC_TEMPLATE.md and TASKS_TEMPLATE.md
  4. Follow Execution Flow in EPIC_TEMPLATE.md:
     - Load and analyze PRD
     - Define Epic scope and success criteria
     - Design technical approach (data model, API contracts)
     - Plan implementation phases (TDD: Phase 2 Tests, Phase 3 Implementation)
     - Estimate timeline and resources
     - Identify dependencies and risks
     - Constitution Check
     - Validation
  5. Follow Execution Flow in TASKS_TEMPLATE.md:
     - Generate tasks by category (Setup, Tests First, Implementation, Integration, Polish)
     - Phase 2 (Tests First): ALL contract tests, integration tests BEFORE implementation
     - TEST VERIFICATION CHECKPOINT: Ensure tests will fail before Phase 3
     - Phase 3 (Core Implementation): Make tests pass
     - Apply [P] tags for parallel tasks (different files only)
     - Include exact file paths for each task
     - Add Dependencies section
     - Constitution Check for each phase
  6. Write EPIC.md to ${EPIC_FILE}
  7. Write TASKS.md (SINGLE document) to ${TASKS_FILE}
  8. Log event: log_event "${REQ_ID}" "Epic and Tasks generation completed"

  Critical Requirements:
  - TASKS.md must be a SINGLE document with ALL tasks
  - Phase 2 (Tests First) must come BEFORE Phase 3 (Implementation)
  - Include TEST VERIFICATION CHECKPOINT between Phase 2 and 3
  - [P] tag only for truly parallel tasks (different files, no dependencies)
  - Each task must specify exact file path

  Output:
  - ${EPIC_FILE} (complete Epic with TDD phases)
  - ${TASKS_FILE} (single document with all tasks in TDD order)

Subagent: planner
```

### 阶段 4: Epic 和 Tasks 验证 (Exit Gate)

**Exit Gate Validation**:
```
1. Verify files were created
   → Check: EPIC_FILE exists
   → Check: TASKS_FILE exists
   → If either missing: ERROR "Epic/Tasks generation failed - files not created"

2. Validate EPIC completeness
   → Read: EPIC_FILE
   → Check: No {{PLACEHOLDER}} patterns remain
   → Check: "## Technical Approach" section exists
   → Check: "### Phase 2: Tests First (TDD)" section exists
   → Check: "TEST VERIFICATION CHECKPOINT" mentioned
   → Check: Constitution Check section exists
   → If incomplete: ERROR "Epic incomplete - missing required sections"

3. Validate TASKS.md structure (TDD compliance)
   → Read: TASKS_FILE
   → Check: "## Phase 2: Tests First" section exists
   → Check: "## Phase 3: Core Implementation" section exists
   → Verify: Phase 2 section comes BEFORE Phase 3
   → Check: "⚠️ TEST VERIFICATION CHECKPOINT" exists between Phase 2 and 3
   → Check: Dependencies section exists
   → Count: Total tasks, Phase 2 tasks, Phase 3 tasks
   → If structure wrong: ERROR "TASKS.md violates TDD order"

4. Validate task format and quality
   → Parse all tasks from TASKS.md
   → Check each task has format: - [ ] **T###** [P?] Description with file path
   → Verify: Task IDs sequential (T001, T002, ...)
   → Verify: File paths specified for code tasks
   → Verify: [P] tags only on Phase 2 and different-file tasks
   → Count: Parallel tasks, sequential tasks
   → If format wrong: ERROR "Task format violations found"

5. Run Constitution validation
   → Execute: validate-constitution.sh --type epic --severity error
   → Execute: validate-constitution.sh --type tasks --severity error
   → Parse output for violations
   → If critical errors: ERROR "Constitution violations found. Fix before proceeding."

6. Verify TDD compliance
   → Count Phase 2 tasks (tests)
   → Count Phase 3 tasks (implementation)
   → Ratio check: Phase 2 tasks should be >= 30% of total
   → If ratio too low: WARN "Insufficient test coverage planned"

7. Update orchestration status
   → Set: status = "epic_complete"
   → Set: phase = "development"
   → Set: completedSteps = ["init", "prd", "epic"]
   → Set: totalTasks = ${task_count}
   → Set: completedTasks = 0
   → Set: updatedAt = current timestamp
   → Write: orchestration_status.json

*GATE CHECK: Epic and Tasks meet all quality and TDD criteria*
```

**Success Output**:
```
✅ Epic and Tasks generated successfully!

Requirement ID:    ${REQ_ID}
Epic File:         ${EPIC_FILE}
Tasks File:        ${TASKS_FILE}

Epic Summary:
  Phases:          5 phases (Setup → Tests → Implementation → Integration → Polish)
  Timeline:        ${estimated_weeks} weeks
  Success Metrics: ${metric_count} metrics defined
  TDD Compliance:  ✅ Phase 2 (Tests First) before Phase 3

Tasks Breakdown:
  Total Tasks:     ${total_tasks}
  Phase 1 (Setup): ${phase1_count} tasks
  Phase 2 (Tests): ${phase2_count} tasks ⚠️ MUST COMPLETE FIRST
  Phase 3 (Impl):  ${phase3_count} tasks
  Phase 4 (Integ): ${phase4_count} tasks
  Phase 5 (Polish): ${phase5_count} tasks

  Parallel Tasks:  ${parallel_count} tasks marked [P]
  Sequential:      ${sequential_count} tasks

TDD Checkpoint:
  ⚠️ TEST VERIFICATION CHECKPOINT between Phase 2 and Phase 3
  All Phase 2 tests must FAIL before starting Phase 3 implementation

Constitution:
  Epic:   ✅ Passed / ⚠️ Warnings
  Tasks:  ✅ Passed / ⚠️ Warnings

Next Steps:
  1. Review EPIC.md to understand technical approach
  2. Review TASKS.md to understand task breakdown and order
  3. Run /flow-dev to start TDD implementation
  4. Or manually execute tasks following TASKS.md order

Files created/updated:
  - ${EPIC_FILE} (new)
  - ${TASKS_FILE} (new, single document with all tasks)
  - orchestration_status.json (updated: status=epic_complete, totalTasks=${total_tasks})
  - EXECUTION_LOG.md (updated: logged Epic generation)
```

## 输出产物

### Epic 文档结构
```markdown
# Epic: REQ-123 - User Authentication

**Status**: Draft
**Created**: 2025-09-30T13:00:00Z
**Timeline**: 3 weeks
**Team**: Backend + Frontend

## Epic Overview
[Epic description and scope]

## Success Metrics
| Metric | Baseline | Target | Timeline |
|--------|----------|--------|----------|
| User Registration Success Rate | 0% | 95% | Week 3 |
| Login Response Time (p95) | N/A | < 200ms | Week 3 |

## Technical Approach

### Data Model
- User Entity (id, email, passwordHash, createdAt)
- Session Entity (id, userId, token, expiresAt)

### API Design
| Method | Endpoint | Phase |
|--------|----------|-------|
| POST | /api/auth/register | 2,3 |
| POST | /api/auth/login | 2,3 |
| POST | /api/auth/logout | 2,3 |

**Phase 2**: Write contract tests (tests will FAIL)
**Phase 3**: Implement endpoints (make tests PASS)

## Implementation Phases

### Phase 1: Setup (1 day)
- Project initialization
- Dependencies installation
- Linting and formatting setup

### Phase 2: Tests First (TDD 测试优先) ⚠️ (3 days)
**关键原则**: 所有测试必须在 Phase 3 之前完成并失败

**任务**:
- 编写所有 API 端点的 contract tests
- 编写所有用户故事的 integration tests
- **TEST VERIFICATION CHECKPOINT**: 验证所有测试失败

### Phase 3: Core Implementation (5 days)
**前提**: Phase 2 的所有测试已失败
**任务**:
- 实现数据模型
- 实现业务逻辑
- **让测试通过**

[Additional phases...]

## Constitution Check
- [x] NO PARTIAL IMPLEMENTATION: Epic完整定义
- [x] TDD compliance: Phase 2 before Phase 3
- [x] TEST VERIFICATION CHECKPOINT: Clearly marked
[Additional checks...]
```

### Tasks 文档结构 (单一文档)
```markdown
# Tasks: REQ-123 - User Authentication

**Status**: Ready for Implementation
**Created**: 2025-09-30T13:00:00Z
**Total Tasks**: 25
**Estimated Duration**: 3 weeks

## Phase 1: Setup (Day 1)

- [ ] **T001** Initialize project structure in src/
- [ ] **T002** Install dependencies: express, bcrypt, jsonwebtoken
- [ ] **T003** Setup ESLint and Prettier configuration

## Phase 2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE Phase 3 (Days 2-4)

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests
- [ ] **T004** [P] Contract test POST /api/auth/register in tests/contract/test_auth_register.py
- [ ] **T005** [P] Contract test POST /api/auth/login in tests/contract/test_auth_login.py
- [ ] **T006** [P] Contract test POST /api/auth/logout in tests/contract/test_auth_logout.py

### Integration Tests
- [ ] **T007** [P] Integration test: User registration flow in tests/integration/test_user_registration.py
- [ ] **T008** [P] Integration test: User login flow in tests/integration/test_user_login.py

### Schema Tests
- [ ] **T009** [P] Schema test: User model validation in tests/unit/test_user_schema.py

⚠️ **TEST VERIFICATION CHECKPOINT**
在进入 Phase 3 之前，必须验证：
- [ ] 所有上述测试已编写
- [ ] 所有测试都失败（因为还没有实现）
- [ ] 测试覆盖所有验收标准

## Phase 3: Core Implementation (Days 5-9) - ONLY AFTER TESTS FAIL

**前提**: Phase 2 所有测试已完成且失败

### Data Models
- [ ] **T010** [P] User model in src/models/user.ts
- [ ] **T011** [P] Session model in src/models/session.ts

### Services
- [ ] **T012** AuthService with registration logic in src/services/auth_service.ts → 验证 T004, T007 通过
- [ ] **T013** AuthService with login logic in src/services/auth_service.ts → 验证 T005, T008 通过
- [ ] **T014** AuthService with logout logic in src/services/auth_service.ts → 验证 T006 通过

### API Endpoints
- [ ] **T015** POST /api/auth/register endpoint in src/routes/auth.ts → 验证 T004 通过
- [ ] **T016** POST /api/auth/login endpoint in src/routes/auth.ts → 验证 T005 通过
- [ ] **T017** POST /api/auth/logout endpoint in src/routes/auth.ts → 验证 T006 通过

[Additional phases...]

## Dependencies

### Task Dependencies Graph
```
T001-T003 (Setup) → T004-T009 (Tests) → TEST CHECKPOINT → T010-T017 (Implementation)
```

### Parallel Execution
Tasks marked [P] can run in parallel:
- Phase 2: T004, T005, T006 (different test files)
- Phase 2: T007, T008 (different test files)
- Phase 3: T010, T011 (different model files)

### Sequential Requirements
- ALL Phase 2 tasks MUST complete before ANY Phase 3 task
- T012-T014 depend on T010-T011 (models must exist)
- T015-T017 depend on T012-T014 (services must exist)

## Constitution Check

### Phase 2 (Tests First)
- [ ] All tests come before implementation
- [ ] Tests cover all acceptance criteria from PRD
- [ ] Tests include error scenarios and edge cases
- [ ] No placeholder tests

### Phase 3 (Implementation)
- [ ] NO PARTIAL IMPLEMENTATION: Complete all features
- [ ] NO HARDCODED SECRETS: Use environment variables
- [ ] Make all tests pass

## Validation Checklist

- [x] All contracts have corresponding tests
- [x] All entities have model tasks
- [x] All tests come before implementation
- [x] TEST VERIFICATION CHECKPOINT clearly marked
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] Dependencies section complete
```

### 状态更新
```json
{
  "reqId": "REQ-123",
  "title": "User Authentication",
  "status": "epic_complete",
  "phase": "development",
  "completedSteps": ["init", "prd", "epic"],
  "totalTasks": 25,
  "completedTasks": 0,
  "createdAt": "2025-09-30T12:00:00Z",
  "updatedAt": "2025-09-30T13:15:00Z"
}
```

## Constitution Check

This command enforces Constitution and TDD principles:

### Quality First
- [ ] Epic is complete with clear success criteria
- [ ] Tasks are atomic and completable in ≤1 day
- [ ] All acceptance criteria from PRD mapped to tasks

### TDD Compliance (Critical 🔥)
- [ ] Phase 2 (Tests First) exists and comes BEFORE Phase 3
- [ ] TEST VERIFICATION CHECKPOINT clearly marked
- [ ] All API endpoints have contract tests in Phase 2
- [ ] All user stories have integration tests in Phase 2
- [ ] Phase 3 tasks reference which tests they make pass

### Single Document Management
- [ ] TASKS.md is a SINGLE document (not separate TASK_*.md files)
- [ ] Easy to mark progress with [x]
- [ ] Easy to see dependencies and parallel tasks
- [ ] Dependencies section shows clear task relationships

## Error Handling

### Common Errors

**1. PRD not found**
```
ERROR: PRD not found for requirement REQ-123
Expected: .claude/docs/requirements/REQ-123/PRD.md
Run /flow-prd "REQ-123" first to generate the PRD.
```

**2. Wrong workflow phase**
```
ERROR: Requirement REQ-123 not in correct phase for Epic generation
Current status: prd_generation_in_progress (expected: prd_complete)
Wait for PRD generation to complete, then retry /flow-epic.
```

**3. PRD has Constitution violations**
```
ERROR: PRD has Constitution violations that must be fixed first

[error] NO_PARTIAL_IMPLEMENTATION: Unfilled placeholders detected
  Location: PRD.md:145

Fix these issues in PRD.md, then run /flow-epic again.
```

**4. TDD structure violation**
```
ERROR: Generated TASKS.md violates TDD order

Issue: Phase 3 (Implementation) comes before Phase 2 (Tests)
Expected: Phase 2 → TEST CHECKPOINT → Phase 3

This is a critical error. Regenerate tasks with correct TDD order.
```

### Recovery

If Epic/Tasks generation fails:
1. Check EXECUTION_LOG.md for error details
2. Review planner agent output
3. Fix any PRD issues if needed
4. Re-run /flow-epic to regenerate

## Integration with Other Commands

### Workflow Integration
```text
/flow-init     → Initialize structure ✅
  ↓
/flow-prd      → Generate PRD.md ✅
  ↓
/flow-epic     → Generate EPIC.md and TASKS.md ← YOU ARE HERE
  ↓
/flow-dev      → Implement tasks following TDD order
  ↓
/flow-qa       → Quality assurance
  ↓
/flow-release  → Create PR and merge
```

### Dependency on /flow-prd
This command requires /flow-prd to have completed:
- PRD.md must exist and be complete
- orchestration_status.json must show status="prd_complete"
- PRD must pass Constitution validation

### Enables /flow-dev
After successful Epic/Tasks generation:
- TASKS.md becomes execution plan
- Developers follow TDD order: Phase 2 → Phase 3
- Tasks can be marked complete with mark-task-complete.sh

## Script Integration

### Scripts Called
```bash
# 1. Setup Epic/Tasks structure
.claude/scripts/setup-epic.sh --json

# 2. Validate prerequisites
.claude/scripts/check-prerequisites.sh --json --require-prd

# 3. Validate Constitution
.claude/scripts/validate-constitution.sh --type prd --severity error
.claude/scripts/validate-constitution.sh --type epic --severity error
.claude/scripts/validate-constitution.sh --type tasks --severity error

# 4. Log events
source .claude/scripts/common.sh
log_event "$REQ_ID" "Epic and Tasks generation completed"
```

### Agent Called
```text
planner agent (research-type)
- Reads PRD.md, EPIC_TEMPLATE.md, TASKS_TEMPLATE.md
- Follows Execution Flow for both templates
- Writes EPIC.md and TASKS.md (single document)
- Enforces TDD order with TEST VERIFICATION CHECKPOINT
- Logs events
```

## Best Practices

### Before Running
1. Ensure /flow-prd completed successfully
2. Review PRD.md for completeness
3. Fix any Constitution violations in PRD
4. Understand TDD workflow: Tests → Implementation

### During Execution
1. Review any Constitution warnings
2. Confirm regeneration if Epic/Tasks exist
3. Wait for planner agent to complete

### After Running
1. **Review EPIC.md thoroughly**
2. **Review TASKS.md - verify TDD order**
3. Check TEST VERIFICATION CHECKPOINT is present
4. Verify Phase 2 (Tests) comes before Phase 3 (Implementation)
5. Understand task dependencies
6. Note parallel tasks marked [P]
7. Proceed to /flow-dev to start implementation

### Troubleshooting
1. Check planner agent output for errors
2. Review EXECUTION_LOG.md for detailed steps
3. Use validate-constitution.sh to check specific issues
4. Verify TDD structure: Phase 2 → TEST CHECKPOINT → Phase 3
5. Re-run /flow-epic after fixing issues

---

**Note**: This command invokes the planner research agent which analyzes PRD and generates Epic and Tasks breakdown. The critical output is TASKS.md as a **single document** with all tasks in **TDD order** (Phase 2 Tests before Phase 3 Implementation).