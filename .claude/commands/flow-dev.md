---
name: flow-dev
description: Execute development tasks following TDD order. Usage: /flow-dev "REQ-123" or /flow-dev
---

# Flow-Dev - 开发执行命令

## 命令格式
```text
/flow-dev "REQ_ID"
/flow-dev              # Auto-detect from current branch
/flow-dev --task T005  # Start from specific task
```

### 参数说明
- **REQ_ID**: 需求编号 (可选，默认从当前 Git 分支或环境变量获取)
- **--task TASK_ID**: 从指定任务开始 (可选，默认从第一个未完成任务开始)

### 示例
```text
/flow-dev "REQ-123"
/flow-dev                    # On feature/REQ-123-* branch
/flow-dev --task T005       # Resume from task T005
```

### 关于 [P] 标记的说明

**[P] 表示"逻辑上可并行"，而非"实际并行执行"**

- **标记含义**: 操作不同文件、无相互依赖、可独立完成的任务
- **执行方式**: 仍然串行执行（主代理需要完整上下文来写代码）
- **实际价值**:
  - 告诉执行者这些任务可以连续快速执行
  - 无需在任务之间等待集成测试或验证
  - 可以一次性完成一组独立任务后再运行测试
- **不能真正并行的原因**:
  - 主代理（Claude）和子代理不共享上下文
  - 开发任务（写代码）必须在主代理线程上执行
  - 并行写代码会导致上下文冲突和文件冲突

## ⚠️ 重要提醒：任务完成标记

**每完成一个任务后，必须立即执行：**
```bash
bash .claude/scripts/mark-task-complete.sh T001
```

**为什么这很重要：**
- ✅ 更新 TASKS.md 中的待办事项复选框 ([ ] → [x])
- ✅ 避免重复执行已完成的任务
- ✅ 正确追踪进度和剩余工作量
- ✅ 生成准确的状态报告

**不要手动编辑 TASKS.md** - 使用脚本确保格式正确和日志记录

---

## 执行流程

### 阶段 1: 前置条件检查 (Entry Gate)

**Execution Flow**:
```
1. Determine requirement ID
   → If REQ_ID provided: Use provided ID
   → Else: Run check-prerequisites.sh --json --paths-only
   → Parse REQ_ID from JSON output
   → If not found: ERROR "No requirement ID found"

2. Validate development readiness
   → Run: check-prerequisites.sh --json --require-epic --require-tasks
   → Verify: REQ_DIR exists
   → Verify: EPIC.md exists
   → Verify: TASKS.md exists
   → If missing: ERROR "Epic/Tasks not found. Run /flow-epic first."

3. Check orchestration status
   → Read: orchestration_status.json
   → Verify: status is "epic_complete" or "development_in_progress"
   → Verify: "epic" in completedSteps
   → If wrong phase: ERROR "Epic planning must be completed before development"

4. Validate TASKS.md structure (TDD compliance)
   → Read: TASKS.md
   → Check: Phase 2 (Tests First) exists
   → Check: Phase 3 (Core Implementation) exists
   → Check: TEST VERIFICATION CHECKPOINT exists
   → Check: 每个阶段末尾存在 Code Review Checkpoint 任务（调用 `/code-reviewer`，输出路径在 `reviews/`）
   → Verify: Phase 2 comes before Phase 3
   → If structure wrong: ERROR "TASKS.md violates TDD order"

5. Check task status and determine starting point
   → Run: check-task-status.sh --json
   → Parse: total_tasks, completed, remaining
   → If --task provided: Verify task exists and not completed
   → Determine: next_task_id to execute
   → Log: "Starting from task ${next_task_id}"

*GATE CHECK: All prerequisites passed, TASKS.md has valid TDD structure*
```

### 阶段 2: TDD 开发循环

**Development Strategy**:
```text
主代理按照 TASKS.md 中定义的顺序执行任务：

Phase 1: Setup (if not completed)
  → 执行基础设置任务
  → 标记完成

Phase 2: Tests First (TDD) ⚠️ CRITICAL
  → 依次执行每个测试任务
  → 编写测试代码（测试必须失败）
  → 标记完成
  → 验证所有 Phase 2 任务完成后进行 TEST VERIFICATION

Phase 2 → Phase 3 CHECKPOINT:
  → 运行所有 Phase 2 测试
  → 验证所有测试都失败（因为还没实现）
  → 如果有测试通过: ERROR "Tests should fail before implementation"
  → 确认可以进入 Phase 3

Phase 3: Core Implementation
  → 依次执行每个实现任务
  → 编写实现代码（让测试通过）
  → 运行相关测试验证通过
  → 标记完成

Phase 4 & 5: Integration and Polish
  → 执行集成和优化任务
  → 标记完成
```

**Task Execution Loop** (每个任务必须执行完整的5步循环):
```
For each task in TASKS.md (following order):

1. Load task details
   → Read task line from TASKS.md
   → Parse: task_id, parallel_flag, description, file_path
   → Check: Is task already completed? ([x])
   → If completed: Skip to next task

   Example task line:
   - [ ] **T001** [P] 初始化项目结构 `project-init.ts`

   Parsed values:
   - task_id: T001
   - parallel_flag: [P]
   - description: 初始化项目结构
   - file_path: project-init.ts

2. Display task information
   → Show: Task ID, Description, File path
   → Show: Current progress (X of Y tasks completed)
   → Show: Phase context (Phase 2 Tests / Phase 3 Implementation)

3. Execute task implementation
   → Based on task description and file path:
     - For test tasks (Phase 2):
       * Create/modify test file
       * Write test that covers acceptance criteria
       * Ensure test fails (no implementation yet)
       * Run test to verify failure
     - For implementation tasks (Phase 3):
       * Create/modify source file
       * Implement functionality
       * Run related tests to verify they pass
       * Check related Phase 2 test now passes
       * If frontend task and UI_PROTOTYPE.html exists:
         - Read UI_PROTOTYPE.html to understand design
         - Extract page structure and components
         - Extract CSS variables from design system
         - Implement responsive design (mobile/tablet/desktop)
         - Implement interactive states (hover/active/disabled)
         - Use inline images from prototype as reference
     - For integration tasks (Phase 4):
       * Wire up components
       * Run integration tests
     - For polish tasks (Phase 5):
       * Add unit tests for edge cases
       * Optimize performance
       * Update documentation
     - For Code Review Checkpoint tasks:
       * Run `mkdir -p devflow/requirements/${REQ_ID}/reviews`
       * Aggregate completed task IDs for the current phase (read from TASKS.md section)
       * Determine touched files via `git status --short` or supplied artifact list
       * Invoke `/code-reviewer` sub代理，传入 `reqId`、`phaseId`、`phaseTasks`、`artifactPaths`
       * Ensure review写入 `devflow/requirements/${reqId}/reviews/<phase-slug>_code_review.md` 并记录在 `EXECUTION_LOG.md`
       * If report indicates `phaseStatus: blocked` 或 `decision` 为 `request_changes`/`blocker`，halt推进并回到实现阶段修复

4. Verify task completion (DoD check)
   → For test tasks:
     - [ ] Test file created/updated
     - [ ] Test runs and fails (Phase 2) or passes (Phase 5)
     - [ ] Test covers acceptance criteria
   → For implementation tasks:
     - [ ] Code file created/updated
     - [ ] Related Phase 2 tests now pass
     - [ ] No Constitution violations
     - [ ] Type checking passes
   → For all tasks:
     - [ ] File committed to git (if --commit flag)
     - [ ] No syntax errors
     - [ ] Follows coding standards

5. Mark task as complete ⚠️ MANDATORY
   → MUST RUN: .claude/scripts/mark-task-complete.sh ${task_id}
   → This updates: TASKS.md (- [ ] → - [x])
   → DO NOT manually edit TASKS.md
   → DO NOT skip this step
   → Log: "Task ${task_id} completed"

   Example:
   bash .claude/scripts/mark-task-complete.sh T001

   Verify completion:
   - Check output shows "✅ Task T001 marked as complete"
   - Check TASKS.md line changed from [ ] to [x]
   - If error: Stop and fix before next task

6. Check for checkpoint gates
   → If just completed last Phase 2 task:
     * Run TEST VERIFICATION CHECKPOINT
     * Verify all tests fail
     * Require confirmation to proceed to Phase 3
   → If just completed last Phase 3 task:
     * Verify all Phase 2 tests now pass
     * Require confirmation to proceed to Phase 4
   → 在移动到下一个阶段前，确认对应 Code Review Checkpoint 任务已完成、报告 `phaseStatus: ready_for_next_phase` 且 `decision` 为 `approve` 或 `comment`

7. Continue to next task or stop
   → If all tasks complete: Proceed to Exit Gate
   → If --task flag and reached specified task: Stop
   → Else: Continue to next uncompleted task
```

### 阶段 3: TEST VERIFICATION CHECKPOINT (Phase 2 → Phase 3)

**Critical Gate Between Phases**:
```
When all Phase 2 (Tests First) tasks are completed:

1. Run comprehensive test suite
   → Execute: npm test (or equivalent)
   → Collect: Test results, failure count, coverage
   → Expected: ALL tests should FAIL (no implementation exists)

2. Analyze test results
   → Count: Total tests, Failing tests, Passing tests
   → Expected ratio: Passing = 0, Failing = 100%
   → If passing > 0:
     * ERROR "Some tests are passing before implementation"
     * This indicates tests were written for existing code (anti-pattern)
     * Review and fix tests before proceeding

3. Verify test quality
   → Run: validate-constitution.sh --type code --severity warning
   → Check: No placeholder tests ("TODO", "FIXME")
   → Check: Tests cover acceptance criteria from PRD
   → Check: Tests include error scenarios

4. Require user confirmation
   → Display: Test failure summary
   → PROMPT: "All ${test_count} tests are failing as expected (TDD).
              Ready to proceed to Phase 3 (Implementation)? (y/n)"
   → If no: Stop execution, allow fixing tests
   → If yes: Proceed to Phase 3

5. Update status and log
   → Set: orchestration_status.json phase = "implementation"
   → Log: "TEST VERIFICATION CHECKPOINT passed - ${test_count} tests failing"
   → Log: "Proceeding to Phase 3: Core Implementation"

*CHECKPOINT: All tests fail, ready for implementation*
```

### 阶段 4: 持续验证和监控

**Throughout Development**:
```
1. Constitution monitoring (after each task)
   → Run: validate-constitution.sh --type code --severity error
   → Check: NO PARTIAL IMPLEMENTATION
   → Check: NO HARDCODED SECRETS
   → Check: NO DEAD CODE
   → If violations: WARN user, allow fixing before next task

2. Type checking (after each code task)
   → Run: npm run typecheck (if TypeScript project)
   → If errors: WARN user, recommend fixing before next task
   → Non-blocking: Allow continuing with warnings

3. Test execution (after each implementation task)
   → Run: Related Phase 2 tests
   → Verify: Tests that should pass are now passing
   → If still failing: WARN "Implementation incomplete"
   → Non-blocking: Allow continuing to next task

4. Progress tracking
   → Update: orchestration_status.json after each task
   → Display: Progress bar (X/Y tasks complete, Z% done)
   → Log: Each task completion to EXECUTION_LOG.md

5. Git commits (optional, if --commit flag)
   → After each task:
     * git add <files>
     * git commit -m "feat(${REQ_ID}): ${task_description}"
   → Maintains clean commit history
   → Easy to revert individual tasks if needed

6. Code review archive verification
   → After每个阶段的 Code Review 任务, 检查 `devflow/requirements/${REQ_ID}/reviews/` 下是否生成对应报告
   → 缺失报告或 `decision` 指示 `request_changes`/`blocker` → 立即阻断流程并重新触发 `/code-reviewer`
```

### 阶段 5: 开发完成验证 (Exit Gate)

**Exit Gate Validation**:
```
1. Verify all tasks completed ⚠️ CRITICAL
   → Run: bash .claude/scripts/check-task-status.sh --json
   → Check: remaining == 0, percentage == 100
   → Check: All tasks in TASKS.md marked as [x]
   → If incomplete: ERROR "Not all tasks completed"

   Common issue: Tasks executed but not marked
   - Symptom: Code exists but TASKS.md shows [ ] not [x]
   - Root cause: mark-task-complete.sh was not called
   - Fix: Manually run mark-task-complete.sh for each task
   - Prevention: Always call mark-task-complete.sh in step 5 of loop

2. Verify code review reports
   → Inspect: `devflow/requirements/${REQ_ID}/reviews/`
   → Ensure: 每个阶段的 `<phase-slug>_code_review.md` 存在，frontmatter `phaseStatus` 为 `ready_for_next_phase`，`decision` 为 `approve`/`comment`
   → 如果缺失或状态阻塞/退回: ERROR "Phase code review missing or unresolved"

3. Run complete test suite
   → Execute: npm test
   → Expected: ALL tests pass (100% pass rate)
   → Check: Coverage >= 80% (or configured threshold)
   → If failures: ERROR "Tests failing - development incomplete"

4. Run Constitution validation
   → Execute: validate-constitution.sh --type all --severity error --json
   → Check: errors == 0
   → If violations: ERROR "Constitution violations must be fixed"

5. Run type checking
   → Execute: npm run typecheck
   → If errors: ERROR "Type errors must be fixed before QA"

6. Run build
   → Execute: npm run build
   → If build fails: ERROR "Build errors must be fixed"

7. Verify TDD compliance
   → Check: All Phase 2 tests exist and pass
   → Check: All Phase 3 implementations complete
   → Ratio: Implementation tasks should have made tests pass
   → If mismatch: WARN "Some tests may not be covered by implementation"

8. Update orchestration status
   → Set: status = "development_complete"
   → Set: phase = "quality_assurance"
   → Set: completedSteps = ["init", "prd", "epic", "development"]
   → Set: updatedAt = current timestamp
   → Write: orchestration_status.json

*GATE CHECK: All tasks complete, tests pass, no Constitution violations*
```

**Success Output**:
```
✅ Development completed successfully!

Requirement ID:    ${REQ_ID}
Total Tasks:       ${total_tasks}
Completed:         ${completed_tasks}
Duration:          ${elapsed_time}

Test Results:
  Total Tests:     ${test_count}
  Passing:         ${passing_tests} (100%)
  Failing:         0
  Coverage:        ${coverage}%

Quality Checks:
  Constitution:    ✅ 0 errors
  Type Checking:   ✅ Passed
  Build:           ✅ Success
  TDD Compliance:  ✅ Verified

Implementation Summary:
  Phase 1 (Setup):  ${phase1_count} tasks ✅
  Phase 2 (Tests):  ${phase2_count} tasks ✅ (all initially failed)
  Phase 3 (Impl):   ${phase3_count} tasks ✅ (all tests now pass)
  Phase 4 (Integ):  ${phase4_count} tasks ✅
  Phase 5 (Polish): ${phase5_count} tasks ✅

Next Steps:
  1. Review implementation quality
  2. Run /flow-qa for comprehensive quality assurance
  3. Or manually review code before proceeding

Files modified:
  ${file_list}

Git commits:
  ${commit_count} commits (if --commit was used)
```

## 输出产物

### 代码实现
按照 TASKS.md 中定义的文件路径创建/修改：
- 测试文件 (Phase 2)
- 源代码文件 (Phase 3)
- 集成代码 (Phase 4)
- 文档和优化 (Phase 5)

### 状态更新
**orchestration_status.json**:
```json
{
  "reqId": "REQ-123",
  "title": "User Authentication",
  "status": "development_complete",
  "phase": "quality_assurance",
  "completedSteps": ["init", "prd", "epic", "development"],
  "totalTasks": 25,
  "completedTasks": 25,
  "testsPassing": 50,
  "coverage": 85.5,
  "createdAt": "2025-09-30T12:00:00Z",
  "updatedAt": "2025-09-30T16:30:00Z"
}
```

### Git 提交历史 (if --commit)
```bash
feat(REQ-123): Initialize project structure
feat(REQ-123): Add contract test for POST /api/auth/register
feat(REQ-123): Add contract test for POST /api/auth/login
feat(REQ-123): Add integration test for user registration
feat(REQ-123): Implement User model
feat(REQ-123): Implement AuthService registration logic
feat(REQ-123): Implement POST /api/auth/register endpoint
...
```

## Constitution Check

This command enforces Constitution during development:

### Quality First (NO PARTIAL IMPLEMENTATION)
- [ ] Each task fully implemented before marked complete
- [ ] No TODO or FIXME comments in production code
- [ ] All functions have implementations, no empty stubs

### TDD Compliance (Critical 🔥)
- [ ] Phase 2 tasks executed before Phase 3
- [ ] All Phase 2 tests initially failed
- [ ] TEST VERIFICATION CHECKPOINT verified failures
- [ ] All Phase 3 implementations made tests pass

### Security First (NO HARDCODED SECRETS)
- [ ] No API keys, passwords, tokens in code
- [ ] Sensitive config from environment variables
- [ ] Constitution validation run after each task

### Code Quality
- [ ] Type checking passes
- [ ] Build succeeds
- [ ] No dead code introduced
- [ ] Follows project coding standards

## Error Handling

### Common Errors

**1. TASKS.md not found**
```
ERROR: TASKS.md not found for requirement REQ-123
Expected: devflow/requirements/REQ-123/TASKS.md
Run /flow-epic "REQ-123" first to generate task breakdown.
```

**2. Wrong workflow phase**
```
ERROR: Requirement REQ-123 not ready for development
Current status: prd_complete (expected: epic_complete)
Run /flow-epic first to complete task planning.
```

**3. TDD structure violation**
```
ERROR: TASKS.md violates TDD order
Issue: Phase 3 (Implementation) comes before Phase 2 (Tests)

This is a critical error. Tasks must follow TDD order:
  Phase 2 (Tests) → TEST CHECKPOINT → Phase 3 (Implementation)

Fix TASKS.md or regenerate with /flow-epic.
```

**4. Test verification checkpoint failure**
```
ERROR: TEST VERIFICATION CHECKPOINT failed

Expected: All tests should FAIL (no implementation yet)
Actual: 3 tests are PASSING

This indicates tests were written for existing code (anti-pattern).
Review and fix these tests:
  - test_user_registration.py:TestUserRegistration.test_register_success
  - test_auth_login.py:TestAuth.test_login_success
  - test_user_model.py:TestUserModel.test_create_user

Cannot proceed to Phase 3 until all tests fail.
```

**5. Tests still failing after implementation**
```
WARNING: Phase 3 task completed but related tests still failing

Task: T015 - Implement POST /api/auth/register endpoint
Related test: T004 - Contract test POST /api/auth/register

Test failure:
  AssertionError: Expected status 201, got 500

Implementation may be incomplete. Review and fix before next task.
```

**6. Constitution violations**
```
ERROR: Constitution violations detected

[error] NO_HARDCODED_SECRETS: API key found in code
  Location: src/services/auth_service.ts:23
  Issue: const API_KEY = "sk-1234567890abcdef"
  Fix: Move to environment variable

Cannot proceed. Fix violations before continuing.
```

### Recovery

If development fails or is interrupted:
1. Run `/flow-dev` again - it will resume from last uncompleted task
2. Or use `/flow-dev --task T010` to resume from specific task
3. Check `EXECUTION_LOG.md` for detailed progress
4. Use `check-task-status.sh` to see current status

## Command-line Options

### Flags
```text
/flow-dev "REQ-123" [OPTIONS]

OPTIONS:
  --task TASK_ID      Start from specific task (e.g., T005)
  --commit            Auto-commit after each task
  --skip-tests        Skip test execution (not recommended)
  --verbose, -v       Detailed output for each task

NOTE: [P] marked tasks are executed serially, not in parallel.
      [P] indicates logical independence for faster consecutive execution.
```

### Examples
```bash
# Standard usage
/flow-dev "REQ-123"

# Resume from specific task
/flow-dev --task T010

# Enable auto-commit
/flow-dev --commit

# Verbose mode for debugging
/flow-dev --verbose
```

## Integration with Other Commands

### Workflow Integration
```text
/flow-init     → Initialize structure ✅
  ↓
/flow-prd      → Generate PRD.md ✅
  ↓
/flow-epic     → Generate EPIC.md and TASKS.md ✅
  ↓
/flow-dev      → Implement tasks ← YOU ARE HERE
  ↓
/flow-qa       → Quality assurance
  ↓
/flow-release  → Create PR and merge
```

### Dependency on /flow-epic
Requires:
- EPIC.md exists
- TASKS.md exists with TDD structure
- orchestration_status.json shows status="epic_complete"

### Enables /flow-qa
After successful development:
- All tasks completed
- All tests passing
- Code ready for QA review

## Best Practices

### Before Running
1. Ensure /flow-epic completed successfully
2. Review TASKS.md to understand task order
3. Understand TDD workflow: Tests → Implementation
4. Check development environment is ready

### During Execution
1. Follow TDD strictly: Write tests first (Phase 2)
2. Verify tests fail before implementation (TEST CHECKPOINT)
3. Implement to make tests pass (Phase 3)
4. Review Constitution warnings promptly
5. Don't skip TEST VERIFICATION CHECKPOINT

### After Running
1. Review all implemented code
2. Verify all tests pass
3. Check Constitution compliance
4. Review git commit history
5. Proceed to /flow-qa for quality assurance

### Troubleshooting
1. Check EXECUTION_LOG.md for detailed progress
2. Use check-task-status.sh to see current status
3. Use validate-constitution.sh to check specific issues
4. Resume with /flow-dev --task TASK_ID if interrupted

---

**Note**: This command guides the main agent (Claude) to execute development tasks. The agent directly writes code following TASKS.md, enforcing TDD order through TEST VERIFICATION CHECKPOINT. All research agents remain read-only; only the main agent modifies code.
