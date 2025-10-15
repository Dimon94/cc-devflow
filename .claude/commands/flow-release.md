---
name: flow-release
description: Create PR and manage release. Usage: /flow-release "REQ-123" or /flow-release
---

# Flow-Release - 发布管理命令

## 命令格式
```text
/flow-release "REQ_ID"
/flow-release              # Auto-detect from current branch
```

### 参数说明
- **REQ_ID**: 需求编号 (可选，默认从当前 Git 分支或环境变量获取)

### 示例
```text
/flow-release "REQ-123"
/flow-release               # On feature/REQ-123-* branch
```

## 执行流程

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
   → If missing: ERROR "Requirement not initialized."

3. Check orchestration status
   → Read: orchestration_status.json
   → Verify: status is "qa_complete" or "release_failed"
   → If wrong phase: ERROR "QA not complete. Run /flow-qa first."

4. Verify QA completion and pass
   → Check: TEST_REPORT.md exists
   → Check: SECURITY_REPORT.md exists
   → If missing: ERROR "QA reports not found. Run /flow-qa first."
   → Parse TEST_REPORT.md for Quality Gate status
   → Parse SECURITY_REPORT.md for Security Gate status
   → If Quality Gate = FAIL: ERROR "Quality gate failed. Fix issues first."
   → If Security Gate = FAIL: ERROR "Security gate failed. Fix critical issues first."

5. Verify Git status
   → Run: git status --porcelain
   → If uncommitted changes: ERROR "Working directory not clean. Commit or stash changes."
   → Run: git branch --show-current
   → Verify: On feature/bugfix branch (not main/master)
   → If on main: ERROR "Cannot release from main branch."

6. Verify branch is pushed to remote
   → Run: git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null
   → If no upstream: WARN "Branch not pushed. Push now? (y/n)"
   → If yes: Run git push -u origin ${BRANCH_NAME}

7. Check if PR already exists
   → Run: gh pr list --head ${BRANCH_NAME} --json number,state
   → If PR exists and state=OPEN: WARN "PR already exists (#${number}). Continue? (y/n)"
   → If state=MERGED: ERROR "PR already merged. Cannot release again."

*GATE CHECK: All prerequisite validations passed, QA complete, ready for release*
```

### 阶段 2: 发布计划准备

**Execution Flow**:
```
1. Collect release metadata
   → REQ_ID, TITLE from orchestration_status.json
   → BRANCH_NAME from git branch --show-current
   → Changed files: git diff main...HEAD --name-only
   → Commit count: git rev-list --count main...HEAD
   → Test coverage from TEST_REPORT.md
   → Security status from SECURITY_REPORT.md

2. Load release context
   → Read: PRD.md (user stories, success criteria)
   → Read: EPIC.md (technical scope, DoD)
   → Read: TASKS.md (completed tasks list)
   → Read: TEST_REPORT.md (quality status)
   → Read: SECURITY_REPORT.md (security status)
   → Read: EXECUTION_LOG.md (development timeline)
   → Determine CHANGE_ID: `CHANGE_ID=$(jq -r '.change_id // empty' "$REQ_DIR/orchestration_status.json")`
   → If CHANGE_ID present: review `devflow/specs/` and `devflow/changes/${CHANGE_ID}` for final delta content

3. Generate commit summary
   → Run: git log main...HEAD --oneline
   → Categorize commits:
     - feat: Feature additions
     - fix: Bug fixes
     - test: Test additions/changes
     - docs: Documentation updates
     - refactor: Code refactoring
     - chore: Build/tooling changes

4. Update orchestration status
   → Set: status = "release_in_progress"
   → Set: phase = "release"
   → Set: updatedAt = current timestamp
   → Write: orchestration_status.json

5. Log release start
   → Append to EXECUTION_LOG.md:
     "### $(date -Iseconds)
      Release process started
      Branch: ${BRANCH_NAME}
      Commits: ${commit_count}
      Changed files: ${file_count}
      Test coverage: ${coverage}%
      Security status: ${security_gate}
      Agent: release-manager"
```

### 阶段 2.5: Delta 审核关卡

```
1. 如果 CHANGE_ID 存在:
   → `.claude/scripts/parse-delta.sh "$CHANGE_ID"`
   → `.claude/scripts/sync-task-progress.sh "$CHANGE_ID"`
   → `.claude/scripts/run-dualtrack-validation.sh "$CHANGE_ID" --strict`
   → `.claude/scripts/check-dualtrack-conflicts.sh "$CHANGE_ID" --strict`

2. 若任一步失败:
   → 输出 "❌ Delta validation failed before release"
   → log_event "$REQ_ID" "❌ Delta validation failed pre-release"
   → exit 1 阻塞发布

3. 验证通过:
   → log_event "$REQ_ID" "✅ Delta validation passed pre-release"
```

### 阶段 3: 调用 release-manager Agent

**Agent Invocation**:
```
Task: release-manager agent
Description: Generate release plan and create PR for ${REQ_ID}

Prompt:
  You are managing the release for ${REQ_ID}: ${TITLE}.

  Context:
  - Requirement ID: ${REQ_ID}
  - Title: ${TITLE}
  - Branch: ${BRANCH_NAME}
  - Commits: ${commit_count}
  - Changed Files: ${file_count}
  - Test Coverage: ${coverage}%
  - Quality Gate: ${quality_gate}
  - Security Gate: ${security_gate}
  - Change ID: ${CHANGE_ID:-"(none)"}

  Available Data:
  - PRD.md: Original requirements and success criteria
  - EPIC.md: Technical scope and implementation details
  - TASKS.md: All completed tasks
  - TEST_REPORT.md: Quality assurance results
  - SECURITY_REPORT.md: Security review results
  - Git history: All commits since branch creation

  Your task:
  1. Run .claude/scripts/check-prerequisites.sh --json --paths-only
     to get requirement paths

  2. Load all release context:
     → Read PRD.md for user stories and success criteria
     → Read EPIC.md for technical scope and DoD
     → Read TASKS.md for completed tasks (verify 100%)
     → Read TEST_REPORT.md for quality evidence
     → Read SECURITY_REPORT.md for security evidence
     → Load git log for commit history
     → If CHANGE_ID exists: summarize delta (`devflow/changes/${CHANGE_ID}`) and final specs (`devflow/specs/`)

  3. Verify task completion:
     → Run: check-task-status.sh --json
     → Parse: totalTasks, completedTasks, remaining
     → Verify: remaining == 0
     → If remaining > 0: ERROR "Cannot release with incomplete tasks"

  4. Validate Constitution compliance:
     → Run: validate-constitution.sh --type all --severity error --json
     → Parse JSON output
     → Verify: error_count == 0
     → If errors > 0: ERROR "Constitution violations found. Fix before release."

  5. Analyze quality gates:
     → Parse TEST_REPORT.md:
       * Quality Gate status
       * Coverage percentage
       * Critical issues count
     → Parse SECURITY_REPORT.md:
      * Security Gate status
      * CRITICAL issues count
      * HIGH issues count
    → If Quality Gate = FAIL: ERROR "Quality gate failed"
    → If Security Gate = FAIL: ERROR "Security gate failed"
    → If CRITICAL security issues > 0: ERROR "Critical security issues must be fixed"
     → Cross-check delta requirements to ensure quality/security evidence covers all impacted capabilities

  6. Generate PR title and description:
     → Title format: "${REQ_ID}: ${TITLE}"
     → Description includes:
       * Overview (from PRD.md background)
       * Changes summary (categorized commits)
       * User stories implemented (from PRD.md)
       * Technical scope (from EPIC.md)
       * Test coverage (from TEST_REPORT.md)
       * Security status (from SECURITY_REPORT.md)
       * Breaking changes (if any)
       * Migration steps (if needed)

  7. Generate RELEASE_PLAN.md:
     → Executive Summary (status, scope, timeline)
     → Requirements Traceability (PRD → EPIC → Tasks → Code)
     → Quality Evidence (test coverage, DoD completion)
     → Security Evidence (scan results, issues addressed)
     → Release Checklist (pre-merge, post-merge)
     → Rollback Plan (if issues found)
     → Stakeholder Communication (who to notify)

  8. Prepare PR creation command:
     → Generate gh pr create command with:
       * --title: PR title
       * --body: PR description (markdown)
       * --base: main (or target branch)
       * --head: ${BRANCH_NAME}
       * --reviewer: (from .github/CODEOWNERS if exists)

  9. Constitution Final Check:
     → Verify NO PARTIAL IMPLEMENTATION (all tasks complete)
     → Verify NO HARDCODED SECRETS (from security report)
     → Document any deviations with justification

  10. Save RELEASE_PLAN.md to ${REQ_DIR}/RELEASE_PLAN.md

  11. Log event: log_event "${REQ_ID}" "Release plan generated"

  Output:
    - Complete RELEASE_PLAN.md file at ${REQ_DIR}/RELEASE_PLAN.md
    - PR creation command ready for execution

Subagent: release-manager
```

### 阶段 4: 双轨归档与摘要

**Execution Flow**:
```
1. 读取 change_id
   → CHANGE_ID=$(jq -r '.change_id // empty' "$REQ_DIR/orchestration_status.json")
   → 若为空: ERROR "change_id missing. Run /flow-init or migrate scripts first."

2. 归档待归档 Delta
   → bash .claude/scripts/archive-change.sh "$CHANGE_ID"
   → 若失败: ERROR "Archive failed. Review delta specs."

3. 生成归档摘要与 Changelog
   → bash .claude/scripts/generate-archive-summary.sh "$CHANGE_ID"
     - 输出: devflow/changes/archive/$CHANGE_ID/summary.md
   → bash .claude/scripts/generate-spec-changelog.sh "$CHANGE_ID"
     - 更新: devflow/specs/<capability>/CHANGELOG.md

4. 日志记录
   → log_event "$REQ_ID" "Change $CHANGE_ID archived to devflow/specs/ (summary + changelog)"

5. 提示回滚命令
   → 若归档后发现问题，可运行:
     `bash .claude/scripts/rollback-archive.sh "$CHANGE_ID"`
```

### 阶段 5: 创建 Pull Request

**Execution Flow**:
```
1. Verify RELEASE_PLAN.md was created
   → Check: RELEASE_PLAN.md exists
   → If missing: ERROR "Release plan generation failed"

2. Parse RELEASE_PLAN.md for PR details
   → Extract: PR title
   → Extract: PR body/description
   → Extract: Release checklist

3. Display PR preview to user
   → Show: PR title
   → Show: PR description (first 20 lines)
   → Show: Changed files count
   → Show: Commits count
   → PROMPT: "Create PR with these details? (y/n/edit)"
   → If edit: Allow user to modify title/body

4. Create PR using gh CLI
   → Run: gh pr create \
       --title "${PR_TITLE}" \
       --body "${PR_BODY}" \
       --base main \
       --head ${BRANCH_NAME}
   → Capture PR number from output
   → If failed: ERROR "PR creation failed. Check gh CLI setup."

5. Add labels to PR (if configured)
   → Run: gh pr edit ${PR_NUMBER} --add-label "cc-devflow,${REQ_ID}"
   → Optional labels: enhancement, bug-fix, security, etc.

6. Request reviewers (if configured)
   → Check: .github/CODEOWNERS exists
   → Run: gh pr edit ${PR_NUMBER} --add-reviewer ${REVIEWERS}
   → If no reviewers configured: Skip

7. Log PR creation
   → Append to EXECUTION_LOG.md:
     "### $(date -Iseconds)
      Pull Request created
      PR Number: #${PR_NUMBER}
      URL: ${PR_URL}
      Base: main ← Head: ${BRANCH_NAME}"
```

### 阶段 6: 发布完成确认 (Exit Gate)

**Exit Gate Validation**:
```
1. Verify RELEASE_PLAN.md was created
   → Check: RELEASE_PLAN.md exists and is complete
   → Verify: Contains all required sections

2. Verify PR was created successfully
   → Check: PR_NUMBER is valid
   → Run: gh pr view ${PR_NUMBER} --json number,url,state
   → Verify: state == "OPEN"
   → If not open: ERROR "PR creation failed or PR was closed"

3. Verify PR checks are triggered
   → Wait 10 seconds for CI to start
   → Run: gh pr checks ${PR_NUMBER}
   → Display: CI status (queued, in_progress, completed)

4. Constitution Final Verification:
   → Verify: All quality gates passed (from reports)
   → Verify: No Constitution violations (from validation)
   → Verify: All tasks completed (from status)
   → Document: Any accepted risks or deviations

5. Update orchestration status
   → Set: status = "release_complete"
   → Set: phase = "released"
   → Set: completedSteps += ["release"]
   → Set: pr_number = ${PR_NUMBER}
   → Set: pr_url = ${PR_URL}
   → Set: updatedAt = current timestamp
   → Write: orchestration_status.json

6. Generate final status summary
   → Total timeline: createdAt → updatedAt
   → Total commits: ${commit_count}
   → Total files changed: ${file_count}
   → Test coverage: ${coverage}%
   → Security status: ${security_gate}

*GATE CHECK: PR created successfully, ready for review and merge*
```

**Success Output**:
```
✅ Release process completed successfully!

Requirement ID:    ${REQ_ID}
Title:             ${TITLE}
Branch:            ${BRANCH_NAME}

Pull Request:
  Number:          #${PR_NUMBER}
  URL:             ${PR_URL}
  Status:          OPEN ✅
  Base:            main
  Head:            ${BRANCH_NAME}

Release Summary:
  Commits:         ${commit_count}
  Files Changed:   ${file_count}
  Test Coverage:   ${coverage}% ✅
  Quality Gate:    PASS ✅
  Security Gate:   PASS ✅

Quality Evidence:
  All Tasks:       ${totalTasks}/${totalTasks} complete ✅
  Test Report:     ${TEST_REPORT}
  Security Report: ${SECURITY_REPORT}
  Release Plan:    ${RELEASE_PLAN}

CI/CD Status:
  ${CI_STATUS}

Next Steps:
  1. Monitor CI/CD checks: gh pr checks ${PR_NUMBER}
  2. Wait for code review approval
  3. Merge PR when approved and CI passes: gh pr merge ${PR_NUMBER} --squash
  4. Or use GitHub web UI: ${PR_URL}

Post-Merge:
  1. Delete feature branch: git branch -D ${BRANCH_NAME}
  2. Delete remote branch: git push origin --delete ${BRANCH_NAME}
  3. Pull latest main: git checkout main && git pull

Files created/updated:
  - ${RELEASE_PLAN} (new)
  - orchestration_status.json (updated: status=release_complete, pr_number=${PR_NUMBER})
  - EXECUTION_LOG.md (updated: logged PR creation)

---

🎉 Requirement ${REQ_ID} successfully released!
Total development time: ${duration}
```

**Failure Output**:
```
❌ Release process FAILED!

Requirement ID:    ${REQ_ID}
Status:            ${status}

Failure Reason:
${error_message}

Details:
${error_details}

Action Required:
  1. Review error details above
  2. Fix identified issues
  3. Re-run /flow-release after fixes

Common Issues:
  - Quality gate failed: Fix test coverage or quality issues
  - Security gate failed: Fix CRITICAL/HIGH security issues
  - Constitution violations: Fix code quality violations
  - Git issues: Ensure branch is clean and pushed
  - PR creation failed: Check gh CLI setup and permissions

Check logs:
  - EXECUTION_LOG.md: ${EXECUTION_LOG}
  - orchestration_status.json: ${STATUS_FILE}
```

## 输出产物

### RELEASE_PLAN.md 结构
```markdown
# RELEASE_PLAN: REQ-123 - User Authentication

**Generated**: 2025-09-30T16:00:00Z
**Status**: Ready for Release ✅
**PR Number**: #456
**Branch**: feature/REQ-123-user-authentication

## Executive Summary

**Release Decision**: APPROVED ✅

- **Requirement ID**: REQ-123
- **Title**: User Authentication
- **Development Duration**: 3 days (2025-09-27 → 2025-09-30)
- **Total Commits**: 25
- **Files Changed**: 18 files (+1,234 -89 lines)
- **Test Coverage**: 85.2% ✅
- **Quality Gate**: PASS ✅
- **Security Gate**: PASS ✅
- **Breaking Changes**: None

**Recommendation**: Approve and merge

---

## Requirements Traceability

### PRD → EPIC → Tasks → Code Mapping

#### User Story 1: User Registration
- **PRD**: PRD.md L45-67 - "As a new user..."
- **EPIC**: EPIC.md L89-120 - Registration flow implementation
- **Tasks**:
  - TASK_002: Write registration contract tests ✅
  - TASK_005: Implement user model ✅
  - TASK_008: Implement registration endpoint ✅
- **Code**:
  - `src/auth/register.ts` (new, 145 lines)
  - `test/auth/register.test.ts` (new, 98 lines)
- **Tests**: 8 tests, all passing ✅
- **Coverage**: 92% ✅

#### User Story 2: User Login
[Similar mapping...]

**Traceability Status**: 100% - All user stories implemented and tested ✅

---

## Quality Evidence

### Test Coverage
**Overall**: 85.2% (target: ≥80%) ✅

| Component | Coverage | Tests | Status |
|-----------|----------|-------|--------|
| Authentication | 92% | 15 tests | ✅ PASS |
| User Management | 78% | 10 tests | ✅ PASS |
| Utilities | 88% | 8 tests | ✅ PASS |

### DoD Completion
**All Tasks**: 25/25 complete ✅

Sample Task DoD Verification:
- **TASK_001: Setup Authentication Module**
  - [x] Code implementation complete
  - [x] Unit tests written and passing (5/5)
  - [x] Integration tests written and passing (3/3)
  - [x] Documentation updated (README.md, API.md)
  - [x] No TypeScript errors
  - [x] Code review completed
  **Status**: COMPLETE ✅

[Additional tasks...]

### TDD Compliance
- [x] Phase 2 (Tests First) completed before Phase 3 ✅
- [x] TEST VERIFICATION CHECKPOINT passed ✅
- [x] All tests initially failed, now pass ✅
- [x] Test quality validated ✅

### Quality Gate
**Decision**: PASS ✅

- Coverage: 85.2% ≥ 80% ✅
- Critical issues: 0 ✅
- High issues: 0 ✅
- TDD compliance: PASS ✅

**Evidence**: TEST_REPORT.md

---

## Security Evidence

### Security Gate
**Decision**: PASS ✅

- CRITICAL issues: 0 ✅
- HIGH issues: 1 (documented, non-blocking) ⚠️
- MEDIUM issues: 3
- Constitution compliance: PASS ✅

### Security Highlights
- [x] NO HARDCODED SECRETS: PASS ✅
  - All secrets from environment variables
  - .env.example provided
  - No secrets in git history
- [x] Authentication: bcrypt password hashing ✅
- [x] Authorization: RBAC implemented ✅
- [x] Input validation: All inputs validated ✅
- [x] SQL injection: Parameterized queries ✅
- [x] XSS prevention: Output escaping ✅

### Known Security Issues
**HIGH** (1 issue, documented):
- Missing rate limiting on login endpoint
- **Mitigation**: Monitoring enabled, planned for next release
- **Risk**: LOW (monitoring in place, no incidents expected)

**Evidence**: SECURITY_REPORT.md

---

## Change Summary

### Commits by Category (25 total)

#### Features (15 commits)
- feat(auth): implement user registration endpoint
- feat(auth): implement user login endpoint
- feat(auth): add password reset functionality
- feat(users): implement user profile management
[...]

#### Tests (8 commits)
- test(auth): add registration contract tests
- test(auth): add login integration tests
- test(users): add profile management tests
[...]

#### Documentation (2 commits)
- docs(auth): add authentication API documentation
- docs(readme): update setup instructions

---

## Files Changed (18 files)

### New Files (8)
- `src/auth/register.ts` (145 lines) - User registration
- `src/auth/login.ts` (123 lines) - User login
- `src/auth/password.ts` (89 lines) - Password management
- `src/users/profile.ts` (156 lines) - User profile
- `test/auth/register.test.ts` (98 lines)
- `test/auth/login.test.ts` (87 lines)
- `test/users/profile.test.ts` (102 lines)
- `docs/API.md` (234 lines) - API documentation

### Modified Files (10)
- `src/index.ts` (+23 -5) - Add auth routes
- `src/database/schema.ts` (+45 -0) - Add users table
- `package.json` (+5 -0) - Add dependencies
[...]

**Total Changes**: +1,234 -89 lines

---

## Breaking Changes

**None** - This is a new feature with no breaking changes to existing functionality.

---

## Migration Steps

**Not Required** - No database migrations or configuration changes needed.

Deployment checklist:
1. Set environment variables (see .env.example)
2. Deploy application
3. Verify health check: GET /health
4. Test authentication flow: POST /api/auth/register

---

## Release Checklist

### Pre-Merge Checklist
- [x] All tasks completed (25/25) ✅
- [x] All tests passing ✅
- [x] Test coverage ≥ 80% (85.2%) ✅
- [x] No CRITICAL security issues ✅
- [x] Constitution compliance verified ✅
- [x] Code review completed ✅
- [x] Documentation updated ✅
- [x] PR description complete ✅
- [x] CI/CD checks passing ⏳ (pending)

### Post-Merge Checklist
- [ ] Merge PR (squash and merge)
- [ ] Verify deployment successful
- [ ] Run smoke tests in production
- [ ] Monitor error logs for 24 hours
- [ ] Update release notes
- [ ] Notify stakeholders
- [ ] Close related issues
- [ ] Delete feature branch

---

## Rollback Plan

### If Issues Found Post-Deployment

**Immediate Rollback**:
```bash
# 1. Identify problematic commit
git log main --oneline -10

# 2. Revert merge commit
git revert -m 1 <merge-commit-sha>

# 3. Push revert
git push origin main

# 4. Verify rollback successful
curl https://api.example.com/health
```

**Symptoms Requiring Rollback**:
- Authentication completely broken (cannot login)
- Database errors (500 errors on auth endpoints)
- Security breach detected
- Critical production issue

**Rollback Decision**: Engineering Lead approval required

---

## Stakeholder Communication

### Notification List
- **Engineering Team**: Full release notes
- **QA Team**: Test reports and coverage data
- **Security Team**: Security report and any HIGH issues
- **Product Manager**: Feature completion and user stories
- **DevOps Team**: Deployment checklist and rollback plan

### Communication Template
```
Subject: [Release] REQ-123 User Authentication - Ready for Deployment

Team,

REQ-123 (User Authentication) has been completed and is ready for deployment.

Key Highlights:
- 25 tasks completed
- Test coverage: 85.2%
- No critical security issues
- All quality gates passed

Details: [Link to RELEASE_PLAN.md]
PR: [Link to PR]

Deployment window: [TBD]

Please review and provide approval.
```

---

## Constitution Compliance Final Check

### Quality Principles
- [x] NO PARTIAL IMPLEMENTATION - All 25 tasks complete ✅
- [x] NO CODE DUPLICATION - DRY principle followed ✅
- [x] NO DEAD CODE - All code in active use ✅
- [x] File size limits - 2 files > 500 lines ⚠️
  - `src/auth/service.ts`: 612 lines (refactoring recommended)
  - **Justification**: Core service, will refactor in next sprint

### Security Principles
- [x] NO HARDCODED SECRETS - All secrets from env ✅
- [x] Input validation - All inputs validated ✅
- [x] Authentication/Authorization - Implemented per design ✅

### Architectural Principles
- [x] Follows existing patterns ✅
- [x] Modular design ✅
- [x] Clear separation of concerns ✅

**Constitution Status**: COMPLIANT with documented exceptions ✅

---

## PR Description Template

```markdown
# REQ-123: User Authentication

## Overview
Implements comprehensive user authentication system including registration, login, and password management.

## Changes
- ✨ User registration with email/password
- ✨ User login with JWT tokens
- ✨ Password reset functionality
- ✨ User profile management
- 🧪 Comprehensive test suite (85.2% coverage)
- 📚 API documentation

## User Stories Implemented
- [x] Story 1: User Registration (PRD.md L45-67)
- [x] Story 2: User Login (PRD.md L68-89)
- [x] Story 3: Password Reset (PRD.md L90-108)

## Quality Evidence
- **Test Coverage**: 85.2% ✅
- **Quality Gate**: PASS ✅
- **Security Gate**: PASS ✅
- **All Tasks**: 25/25 complete ✅

## Security Notes
- ✅ NO HARDCODED SECRETS
- ✅ bcrypt password hashing (12 rounds)
- ✅ JWT tokens with secure secret
- ⚠️ Note: Rate limiting planned for next release (monitoring enabled)

## Breaking Changes
None

## Deployment Notes
Set these environment variables before deployment:
- `JWT_SECRET`: JWT signing secret
- `BCRYPT_ROUNDS`: Password hashing rounds (default: 12)

See `.env.example` for full list.

## Links
- PRD: [PRD.md](devflow/requirements/REQ-123/PRD.md)
- Epic: [EPIC.md](devflow/requirements/REQ-123/EPIC.md)
- Test Report: [TEST_REPORT.md](devflow/requirements/REQ-123/TEST_REPORT.md)
- Security Report: [SECURITY_REPORT.md](devflow/requirements/REQ-123/SECURITY_REPORT.md)
- Release Plan: [RELEASE_PLAN.md](devflow/requirements/REQ-123/RELEASE_PLAN.md)

---
Generated by cc-devflow /flow-release
```

---

**Generated by**: release-manager agent
**Workflow**: cc-devflow v1.0
**Ready for Review**: YES ✅
```

### PR 创建命令示例
```bash
gh pr create \
  --title "REQ-123: User Authentication" \
  --body-file devflow/requirements/REQ-123/PR_BODY.md \
  --base main \
  --head feature/REQ-123-user-authentication \
  --label "cc-devflow,enhancement,REQ-123"
```

### 状态更新
**orchestration_status.json** (Release Complete):
```json
{
  "reqId": "REQ-123",
  "title": "User Authentication",
  "status": "release_complete",
  "phase": "released",
  "completedSteps": ["init", "prd", "epic", "development", "qa", "release"],
  "totalTasks": 25,
  "completedTasks": 25,
  "pr_number": 456,
  "pr_url": "https://github.com/org/repo/pull/456",
  "createdAt": "2025-09-27T10:00:00Z",
  "updatedAt": "2025-09-30T16:15:00Z"
}
```

## Constitution Check

This command enforces Constitution principles during release:

### Quality First
- [ ] All tasks completed (NO PARTIAL IMPLEMENTATION)
- [ ] Test coverage ≥ 80%
- [ ] All quality gates passed
- [ ] DoD criteria 100% complete

### Security First
- [ ] NO HARDCODED SECRETS verified across entire codebase
- [ ] No CRITICAL security issues
- [ ] HIGH security issues documented and risk accepted
- [ ] Security gate passed

### Architectural Consistency
- [ ] Constitution compliance verified (automated scan)
- [ ] Code follows existing patterns
- [ ] No architecture violations
- [ ] Breaking changes documented (if any)

### Release Integrity
- [ ] Complete requirements traceability (PRD → EPIC → Tasks → Code)
- [ ] Quality evidence documented (TEST_REPORT.md)
- [ ] Security evidence documented (SECURITY_REPORT.md)
- [ ] Rollback plan defined

## Error Handling

### Common Errors

**1. QA not complete**
```
ERROR: Quality assurance not complete for REQ-123
Current status: development_complete (expected: qa_complete)

Cannot release without completing QA.
Run /flow-qa to execute quality assurance.
```

**2. Quality gate failed**
```
ERROR: Quality gate FAILED for REQ-123

Quality Issues:
  - Test coverage: 72% (target: ≥80%)
  - Critical issues: 2

Cannot release with failed quality gate.
Fix issues and re-run /flow-qa, then retry /flow-release.
```

**3. Security gate failed**
```
ERROR: Security gate FAILED for REQ-123

CRITICAL Security Issues (2):
1. HARDCODED API KEY in src/config/api.ts:12
2. SQL INJECTION in src/users/query.ts:45

Cannot release with CRITICAL security issues.
Fix all CRITICAL issues, re-run /flow-qa, then retry /flow-release.
```

**4. Working directory not clean**
```
ERROR: Working directory not clean

Uncommitted changes:
  M src/auth/login.ts
  ?? src/temp/debug.log

Commit or stash changes before creating PR.
```

**5. PR creation failed**
```
ERROR: Failed to create Pull Request

gh CLI error: GraphQL error: Resource not accessible by integration

Possible causes:
  - gh CLI not authenticated: Run 'gh auth login'
  - Insufficient permissions: Check repo access
  - Branch not pushed: Run 'git push -u origin ${BRANCH_NAME}'

Fix the issue and re-run /flow-release.
```

**6. Constitution violations**
```
⚠️  Constitution violations found:

[error] NO_PARTIAL_IMPLEMENTATION: 2 tasks incomplete
  TASK_023: Documentation pending
  TASK_024: Integration test missing

Cannot release with incomplete tasks.
Complete all tasks and re-run /flow-release.
```

### Recovery

If release fails:
1. Check EXECUTION_LOG.md for detailed error information
2. Review orchestration_status.json for current state
3. Fix identified issues:
   - Quality issues: Re-run /flow-qa after fixes
   - Security issues: Fix CRITICAL, re-run /flow-qa
   - Git issues: Clean working directory, push branch
   - PR issues: Fix gh CLI setup
4. Re-run /flow-release after fixes

## Integration with Other Commands

### Workflow Integration
```text
/flow-qa       → Quality assurance ✅
  ↓
/flow-release  → Create PR and merge ← YOU ARE HERE
  ↓
(Manual)       → Code review and approve PR
  ↓
(Manual)       → Merge PR when approved
```

### Dependency on /flow-qa
This command requires /flow-qa to have been completed:
- TEST_REPORT.md must exist
- SECURITY_REPORT.md must exist
- Quality Gate must be PASS
- Security Gate must be PASS (no CRITICAL issues)
- orchestration_status.json must have status="qa_complete"

### Enables Manual Steps
After successful release command:
- PR is created and ready for review
- Code reviewers can approve PR
- Once approved and CI passes, PR can be merged
- Workflow completes with merge to main branch

## Script Integration

This command uses the unified script infrastructure:

### Scripts Called
```bash
# 1. Get requirement paths
.claude/scripts/check-prerequisites.sh --json --paths-only

# 2. Check task completion status
.claude/scripts/check-task-status.sh --json

# 3. Validate Constitution compliance (final check)
.claude/scripts/validate-constitution.sh --type all --severity error --json

# 4. Log events (via common.sh)
source .claude/scripts/common.sh
log_event "$REQ_ID" "Release process completed"
```

### Agent Called
```text
release-manager agent (research-type)
- Analyzes release readiness
- Generates release plan
- Creates PR description
- Produces RELEASE_PLAN.md
```

### External Tools
```bash
# Git operations
git status --porcelain
git branch --show-current
git diff main...HEAD
git log main...HEAD --oneline
git push -u origin ${BRANCH_NAME}

# GitHub CLI (gh)
gh pr list --head ${BRANCH_NAME}
gh pr create --title "..." --body "..." --base main
gh pr view ${PR_NUMBER}
gh pr checks ${PR_NUMBER}
gh pr merge ${PR_NUMBER} --squash
```

## Best Practices

### Before Running
1. Ensure /flow-qa completed successfully (QA PASS)
2. Review TEST_REPORT.md and SECURITY_REPORT.md
3. Ensure all changes committed and pushed
4. Verify on correct feature/bugfix branch
5. Ensure gh CLI is authenticated (gh auth status)

### During Execution
1. Review RELEASE_PLAN.md carefully before PR creation
2. Review PR preview before confirming
3. Verify PR created successfully
4. Monitor CI/CD checks start

### After Running (PR Created)
1. **Monitor CI/CD checks**: gh pr checks ${PR_NUMBER}
2. **Respond to code review feedback**
3. **Address any CI failures**
4. **Wait for approval from reviewers**
5. **Merge when approved and CI passes**:
   ```bash
   gh pr merge ${PR_NUMBER} --squash --delete-branch
   ```
6. **Post-merge cleanup**:
   ```bash
   git checkout main
   git pull
   git branch -D ${BRANCH_NAME}
   ```

### After Merge
1. Verify deployment successful (if auto-deploy enabled)
2. Monitor production logs for issues
3. Update stakeholders on completion
4. Archive requirement documents (if applicable)

### Troubleshooting
1. Check release-manager agent output for plan generation issues
2. Review EXECUTION_LOG.md for detailed steps
3. Verify gh CLI setup: gh auth status, gh repo view
4. Check branch relationship: git log main...HEAD
5. Verify all quality gates passed before retrying

## Advanced Options

### PR Creation Options
```bash
# Skip PR creation, only generate release plan
/flow-release "REQ-123" --plan-only

# Specify custom PR base branch
/flow-release "REQ-123" --base develop

# Add custom labels
/flow-release "REQ-123" --labels "priority-high,security"

# Add reviewers
/flow-release "REQ-123" --reviewers "alice,bob"

# Draft PR (not ready for review)
/flow-release "REQ-123" --draft
```

### Post-PR Commands
```bash
# View PR status
gh pr view ${PR_NUMBER}

# Check CI status
gh pr checks ${PR_NUMBER}

# Merge PR (after approval)
gh pr merge ${PR_NUMBER} --squash --delete-branch

# Close PR without merging
gh pr close ${PR_NUMBER}
```

---

**Note**: This command invokes the release-manager research agent which analyzes release readiness and generates release plan. The agent does not execute code or create PRs directly, only creates the RELEASE_PLAN.md document and prepares PR content. PR creation is executed by the main agent using gh CLI.
