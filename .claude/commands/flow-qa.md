---
name: flow-qa
description: Execute quality assurance and security review. Usage: /flow-qa "REQ-123" or /flow-qa
---

# Flow-QA - 质量保证命令

## 命令格式
```text
/flow-qa "REQ_ID"
/flow-qa              # Auto-detect from current branch
```

### 参数说明
- **REQ_ID**: 需求编号 (可选，默认从当前 Git 分支或环境变量获取)

### 示例
```text
/flow-qa "REQ-123"
/flow-qa               # On feature/REQ-123-* branch
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
   → If missing: ERROR "Requirement not initialized. Run /flow-init first."

   → Determine CHANGE_ID via `jq -r '.change_id // empty' "$REQ_DIR/orchestration_status.json"`

3. Check orchestration status
   → Read: orchestration_status.json
   → Verify: status is "development_complete" or "qa_failed"
   → If wrong phase: ERROR "Development not complete. Run /flow-dev first."

4. Verify development completion
   → Run: check-task-status.sh --json
   → Parse: totalTasks, completedTasks, remaining
   → Verify: remaining == 0
   → If remaining > 0: ERROR "Development incomplete. ${remaining} tasks remaining."

5. Verify all tests passing
   → Run: npm run test (or equivalent test command)
   → Capture exit code
   → If exit_code != 0: ERROR "Tests are failing. Fix tests before QA."

6. Check if QA reports already exist
   → Check: TEST_REPORT.md exists
   → Check: SECURITY_REPORT.md exists
   → If exist: WARN "QA reports exist. Regenerate? (y/n)"
   → User must confirm to proceed

*GATE CHECK: All prerequisite validations passed, development complete, tests passing*
```

### 阶段 2: 测试分析准备

**Execution Flow**:
```
1. Collect test execution data
   → Run: npm run test -- --coverage --json > test-results.json
   → Run: npm run test -- --coverage --verbose > test-output.txt
   → Parse coverage data:
     - Line coverage percentage
     - Branch coverage percentage
     - Function coverage percentage
     - Uncovered files list

2. Identify code changes
   → Run: git diff main...HEAD --name-only --diff-filter=AM
   → Filter: Only source code files (exclude tests, docs)
   → List: Changed/added files since branch creation

3. Load requirement context
   → Read: PRD.md (user stories, acceptance criteria)
   → Read: EPIC.md (success criteria, technical requirements)
   → Read: TASKS.md (all tasks and their DoD criteria)

4. Update orchestration status
   → Set: status = "qa_in_progress"
   → Set: phase = "quality_assurance"
   → Set: updatedAt = current timestamp
   → Write: orchestration_status.json

5. Log QA start
   → Append to EXECUTION_LOG.md:
     "### $(date -Iseconds)
      Quality assurance started
      Total tasks completed: ${completedTasks}
      Test coverage: ${coverage}%
      Changed files: ${file_count}
      Agents: qa-tester, security-reviewer"
```

### 阶段 2.5: Delta 完整性验证 (新增)

**Execution Flow**:
```
1. 如果 CHANGE_ID 存在:
     → 运行 `.claude/scripts/parse-delta.sh "$CHANGE_ID"`
     → 运行 `.claude/scripts/sync-task-progress.sh "$CHANGE_ID"`
     → 运行 `.claude/scripts/run-dualtrack-validation.sh "$CHANGE_ID" --strict`
     - 检查 delta.json 是否存在且含有 requirements
     - 检查 tasks.md 是否无占位符
     - 检查 constitution.json 状态
     → 运行 `.claude/scripts/check-dualtrack-conflicts.sh "$CHANGE_ID" --strict`
       - 若发现冲突: ERROR "Delta conflicts detected. Resolve before QA."

2. 验证失败时:
     → 输出详细错误信息
     → log_event "$REQ_ID" "❌ Delta validation failed before QA"
     → exit 1 阻塞 QA 流程

3. 验证通过时:
     → log_event "$REQ_ID" "✅ Delta validation passed before QA"
```

### 阶段 3: 调用 qa-tester Agent

**Agent Invocation**:
```
Task: qa-tester agent
Description: Execute comprehensive test analysis for ${REQ_ID}

Prompt:
  You are conducting quality assurance for ${REQ_ID}: ${TITLE}.

  Context:
  - Requirement ID: ${REQ_ID}
  - Development Status: All ${totalTasks} tasks completed
  - Test Status: All tests passing
  - Current Coverage: ${coverage}%
  - Change ID: ${CHANGE_ID:-"(none)"}

  Available Data:
  - PRD.md: User stories and acceptance criteria
  - EPIC.md: Technical requirements and success criteria
  - TASKS.md: All tasks with DoD criteria
  - test-results.json: Detailed test execution results
  - test-output.txt: Verbose test output

  Your task:
  1. Run .claude/scripts/check-prerequisites.sh --json --paths-only
     to get requirement paths

  2. Load all context documents:
     → Read PRD.md for acceptance criteria
     → Read EPIC.md for success criteria and DoD
     → Read TASKS.md for all task DoD requirements
     → Read test-results.json and test-output.txt
     → If CHANGE_ID exists: review devflow/specs/ and devflow/changes/${CHANGE_ID}/specs/ for impacted requirements

  3. Analyze test coverage:
     → Check line coverage ≥ 80% (target)
     → Check branch coverage ≥ 75%
     → Check function coverage ≥ 80%
     → Identify critical paths with low coverage
     → List uncovered files/functions
      → Map uncovered areas back to delta requirements (if CHANGE_ID exists)

  4. Validate TDD compliance:
     → Verify Phase 2 tests exist for all Phase 3 implementations
     → Check tests follow Given-When-Then pattern
     → Verify tests actually test behavior, not implementation
     → Identify any "cheater tests" (tests that don't reveal flaws)

  5. Validate acceptance criteria coverage:
     → For each user story in PRD.md:
       * Check corresponding integration test exists
       * Verify AC scenarios covered (Given-When-Then)
       * Identify gaps in acceptance criteria testing
        * If CHANGE_ID exists: ensure each delta requirement/scenario has explicit test coverage

  6. Validate DoD criteria completion:
     → For each task in TASKS.md:
       * Check all DoD items marked [x]
       * Verify DoD evidence exists (tests, docs, etc.)
       * Identify any incomplete DoD items

  7. Analyze test quality:
     → Check for proper assertions (not just "no errors")
     → Verify edge cases tested
     → Check error handling tested
     → Identify missing test scenarios

  8. Constitution Check:
     → Run: validate-constitution.sh --type code --severity warning --json
     → Analyze violations (if any)
     → Document in report

  9. Generate comprehensive TEST_REPORT.md following template:
     → Executive Summary (PASS/FAIL, coverage %, key issues)
     → Coverage Analysis (detailed breakdown)
     → TDD Compliance (Phase 2/3 validation)
     → Acceptance Criteria Coverage (story-by-story)
     → DoD Completion (task-by-task)
     → Test Quality Assessment
     → Constitution Check Results
     → Issues and Recommendations (prioritized by severity)
     → Quality Gate Status (PASS/FAIL with justification)

  10. Save TEST_REPORT.md to ${REQ_DIR}/TEST_REPORT.md

  11. Log event: log_event "${REQ_ID}" "Test analysis completed"

  Output: Complete TEST_REPORT.md file at ${REQ_DIR}/TEST_REPORT.md

Subagent: qa-tester
```

### 阶段 4: 调用 security-reviewer Agent

**Agent Invocation**:
```
Task: security-reviewer agent
Description: Execute comprehensive security review for ${REQ_ID}

Prompt:
  You are conducting security review for ${REQ_ID}: ${TITLE}.

  Context:
  - Requirement ID: ${REQ_ID}
  - Development Status: All ${totalTasks} tasks completed
  - Changed Files: ${changed_files}

  Available Data:
  - PRD.md: Security requirements and constraints
  - EPIC.md: Security considerations
  - Source code: All changed/added files
  - TEST_REPORT.md: Test analysis results (if generated)

  Your task:
  1. Run .claude/scripts/check-prerequisites.sh --json --paths-only
     to get requirement paths

  2. Load security context:
     → Read PRD.md Security Requirements section
     → Read EPIC.md Security section
     → Identify all changed source files
     → Load Constitution security principles

  3. Run automated Constitution check:
     → Execute: validate-constitution.sh --type code --severity error --json
     → Parse JSON output for violations
     → Focus on CRITICAL violations:
       * NO HARDCODED SECRETS
       * NO SQL INJECTION vulnerabilities
       * NO XSS vulnerabilities

  4. Analyze authentication and authorization:
     → Check authentication implementation
     → Verify authorization checks at API boundaries
     → Check session management
     → Verify JWT/token handling (if applicable)
     → Identify missing auth checks

  5. Analyze input validation:
     → Check all user inputs validated
     → Verify sanitization of dangerous inputs
     → Check for SQL injection vulnerabilities
     → Check for XSS vulnerabilities
     → Check for command injection vulnerabilities

  6. Analyze secret management:
     → Verify NO HARDCODED SECRETS (passwords, API keys, tokens)
     → Check all secrets from environment variables
     → Verify .env.example exists with placeholders
     → Check .gitignore includes .env
     → Identify any credential leaks

  7. Analyze data protection:
     → Check sensitive data encryption (at rest, in transit)
     → Verify proper hashing for passwords (bcrypt/argon2)
     → Check PII handling compliance
     → Verify secure communication (HTTPS/TLS)

  8. Analyze dependencies:
     → Check for known vulnerabilities in dependencies
     → Run: npm audit (or equivalent)
     → List vulnerabilities by severity
     → Recommend updates for critical/high vulnerabilities

  9. Analyze error handling:
     → Check no sensitive info in error messages
     → Verify proper error logging (without secrets)
     → Check for information disclosure vulnerabilities

  10. Generate comprehensive SECURITY_REPORT.md following template:
      → Executive Summary (PASS/FAIL, critical/high/medium/low counts)
      → Automated Scan Results (Constitution check output)
      → Authentication & Authorization Analysis
      → Input Validation Analysis
      → Secret Management Analysis (NO HARDCODED SECRETS)
      → Data Protection Analysis
      → Dependency Vulnerabilities
      → Error Handling Analysis
      → Security Issues (categorized by severity)
        * CRITICAL: Must fix before merge
        * HIGH: Should fix before merge
        * MEDIUM: Fix in follow-up
        * LOW: Good to have
      → Recommendations (actionable fixes)
      → Security Gate Status (PASS/FAIL with justification)

  11. Save SECURITY_REPORT.md to ${REQ_DIR}/SECURITY_REPORT.md

  12. Log event: log_event "${REQ_ID}" "Security review completed"

  Output: Complete SECURITY_REPORT.md file at ${REQ_DIR}/SECURITY_REPORT.md

Subagent: security-reviewer
```

### 阶段 5: QA 报告验证 (Exit Gate)

**Exit Gate Validation**:
```
1. Verify TEST_REPORT.md was created
   → Check: TEST_REPORT.md exists
   → If missing: ERROR "Test analysis failed - report not created"

2. Verify SECURITY_REPORT.md was created
   → Check: SECURITY_REPORT.md exists
   → If missing: ERROR "Security review failed - report not created"

3. Parse TEST_REPORT.md for Quality Gate status
   → Extract: Quality Gate Status (PASS/FAIL)
   → Extract: Coverage percentage
   → Extract: Critical issues count
   → If Quality Gate = FAIL: WARN "Quality gate failed. Review issues."

4. Parse SECURITY_REPORT.md for Security Gate status
   → Extract: Security Gate Status (PASS/FAIL)
   → Extract: CRITICAL issues count
   → Extract: HIGH issues count
   → If Security Gate = FAIL: ERROR "Security gate failed. Must fix critical issues."
   → If CRITICAL issues > 0: ERROR "Found ${count} CRITICAL security issues. Must fix before merge."

5. Overall QA Gate Decision:
   → If Security Gate = FAIL: Overall = FAIL
   → If CRITICAL security issues > 0: Overall = FAIL
   → If Quality Gate = FAIL AND HIGH security issues > 0: Overall = FAIL
   → Else: Overall = PASS (may have warnings)

6. Update orchestration status:
   → If Overall = PASS:
     * Set: status = "qa_complete"
     * Set: phase = "release_preparation"
     * Set: completedSteps += ["qa"]
   → If Overall = FAIL:
     * Set: status = "qa_failed"
     * Set: phase = "quality_assurance"
   → Set: updatedAt = current timestamp
   → Write: orchestration_status.json

7. Log QA completion:
   → Append to EXECUTION_LOG.md:
     "### $(date -Iseconds)
      Quality assurance completed
      Test coverage: ${coverage}%
      Quality Gate: ${quality_gate}
      Security Gate: ${security_gate}
      Overall QA Gate: ${overall_gate}
      Critical issues: ${critical_count}
      High issues: ${high_count}"

*GATE CHECK: Both reports generated, QA gates evaluated*
```

**Success Output (QA PASS)**:
```
✅ Quality Assurance completed successfully!

Requirement ID:    ${REQ_ID}
QA Status:         PASS ✅

Test Analysis:
  Coverage:        ${coverage}% (target: ≥80%)
  Quality Gate:    PASS ✅
  Critical Issues: 0
  Report:          ${TEST_REPORT}

Security Review:
  Security Gate:   PASS ✅
  Critical Issues: 0
  High Issues:     ${high_count}
  Medium Issues:   ${medium_count}
  Report:          ${SECURITY_REPORT}

Overall QA Gate:   PASS ✅

Next Steps:
  1. Review TEST_REPORT.md for any warnings or recommendations
  2. Review SECURITY_REPORT.md for security improvements
  3. Run /flow-release to create PR and merge

Files created/updated:
  - ${TEST_REPORT} (new)
  - ${SECURITY_REPORT} (new)
  - orchestration_status.json (updated: status=qa_complete)
  - EXECUTION_LOG.md (updated: logged QA completion)
```

**Failure Output (QA FAIL)**:
```
❌ Quality Assurance FAILED!

Requirement ID:    ${REQ_ID}
QA Status:         FAIL ❌

Test Analysis:
  Coverage:        ${coverage}% (target: ≥80%)
  Quality Gate:    ${quality_gate}
  Critical Issues: ${critical_count}

Security Review:
  Security Gate:   FAIL ❌
  CRITICAL Issues: ${critical_count} ⚠️
  HIGH Issues:     ${high_count}

Overall QA Gate:   FAIL ❌

BLOCKING ISSUES:
${critical_issues_list}

Action Required:
  1. Review TEST_REPORT.md: ${TEST_REPORT}
  2. Review SECURITY_REPORT.md: ${SECURITY_REPORT}
  3. Fix all CRITICAL security issues
  4. Fix critical quality issues
  5. Re-run /flow-qa after fixes

Cannot proceed to release until QA gate passes.
```

## 输出产物

### TEST_REPORT.md 结构
```markdown
# TEST_REPORT: REQ-123 - User Authentication

**Generated**: 2025-09-30T15:30:00Z
**Status**: PASS ✅ / FAIL ❌
**Coverage**: 85.2%

## Executive Summary

**Quality Gate**: PASS ✅

- **Overall Coverage**: 85.2% (target: ≥80%) ✅
- **Line Coverage**: 85.2%
- **Branch Coverage**: 78.5%
- **Function Coverage**: 88.0%
- **Critical Issues**: 0
- **TDD Compliance**: PASS ✅

**Recommendation**: Ready for release

---

## Coverage Analysis

### Overall Metrics
| Metric | Coverage | Target | Status |
|--------|----------|--------|--------|
| Lines  | 85.2%    | ≥80%   | ✅ PASS |
| Branches | 78.5%  | ≥75%   | ✅ PASS |
| Functions | 88.0% | ≥80%   | ✅ PASS |

### Coverage by File
| File | Lines | Branches | Functions | Status |
|------|-------|----------|-----------|--------|
| src/auth/login.ts | 92% | 88% | 100% | ✅ |
| src/auth/register.ts | 78% | 70% | 85% | ⚠️ |
| src/utils/crypto.ts | 65% | 55% | 70% | ❌ LOW |

### Uncovered Critical Paths
- `src/auth/register.ts:45-52` - Email validation edge case
- `src/utils/crypto.ts:23-30` - Key rotation logic

---

## TDD Compliance

**Status**: PASS ✅

### Phase 2 (Tests First) Validation
- [x] All Phase 2 test tasks completed
- [x] Tests written before implementation
- [x] TEST VERIFICATION CHECKPOINT passed
- [x] All tests initially failed as expected

### Test Quality
- [x] Tests follow Given-When-Then pattern
- [x] Tests verify behavior, not implementation
- [x] Edge cases covered
- [x] Error handling tested
- [ ] Performance tests (optional for this requirement)

---

## Acceptance Criteria Coverage

### Story 1: User Registration
**Status**: PASS ✅

- [x] AC1: Valid email and password → account created ✅
  - Test: `test/auth/register.test.ts:15` PASSING
- [x] AC2: Invalid email → error message ✅
  - Test: `test/auth/register.test.ts:32` PASSING
- [x] AC3: Duplicate email → conflict error ✅
  - Test: `test/auth/register.test.ts:48` PASSING

### Story 2: User Login
[...]

---

## DoD Completion

### TASK_001: Setup Authentication Module
- [x] Code implementation complete
- [x] Unit tests written and passing
- [x] Integration tests written and passing
- [x] Documentation updated
- [x] No TypeScript errors
**Status**: COMPLETE ✅

[Additional tasks...]

---

## Constitution Check Results

**Automated Scan**: `.claude/scripts/validate-constitution.sh --type code --severity warning`

### Quality Principles
- [x] NO PARTIAL IMPLEMENTATION - All features complete ✅
- [x] NO CODE DUPLICATION - DRY principle followed ✅
- [x] NO DEAD CODE - All code in use ✅
- [ ] File size limits - 2 files > 500 lines ⚠️
  - `src/auth/service.ts`: 612 lines (recommend refactoring)

### Security Principles
- [x] NO HARDCODED SECRETS - All secrets from env ✅
- [x] Input validation - All inputs validated ✅
- [x] Authentication/Authorization - Properly implemented ✅

**Overall Constitution**: PASS with warnings ⚠️

---

## Issues and Recommendations

### CRITICAL Issues (0)
None

### HIGH Priority (0)
None

### MEDIUM Priority (2)
1. **Low branch coverage in register.ts**
   - Current: 70%, Target: ≥75%
   - Recommendation: Add tests for edge cases in email validation
   - Files: `src/auth/register.ts`, `test/auth/register.test.ts`

2. **File size limit exceeded**
   - `src/auth/service.ts`: 612 lines (limit: 500)
   - Recommendation: Extract user service and token service to separate files

### LOW Priority (3)
[...]

---

## Quality Gate Status

**Decision**: PASS ✅

**Rationale**:
- Coverage exceeds 80% target
- All critical and high issues: 0
- TDD compliance: PASS
- Acceptance criteria: All covered
- Constitution check: PASS with minor warnings

**Recommendation**: Proceed to release. Address MEDIUM/LOW issues in follow-up.

---

**Generated by**: qa-tester agent
**Workflow**: cc-devflow v1.0
```

### SECURITY_REPORT.md 结构
```markdown
# SECURITY_REPORT: REQ-123 - User Authentication

**Generated**: 2025-09-30T15:35:00Z
**Status**: PASS ✅ / FAIL ❌
**Severity Summary**: Critical: 0, High: 1, Medium: 3, Low: 5

## Executive Summary

**Security Gate**: PASS ✅

- **CRITICAL Issues**: 0 ✅
- **HIGH Issues**: 1 ⚠️ (non-blocking)
- **MEDIUM Issues**: 3
- **LOW Issues**: 5
- **Constitution Compliance**: PASS ✅

**Recommendation**: Ready for release (with HIGH issue documentation)

---

## Automated Scan Results

**Tool**: `.claude/scripts/validate-constitution.sh --type code --severity error`

### Constitution Security Check
- [x] NO HARDCODED SECRETS ✅
  - All secrets loaded from environment variables
  - .env.example provided with placeholders
  - .gitignore includes .env
- [x] NO SQL INJECTION vulnerabilities ✅
  - All queries use parameterized statements
- [x] NO XSS vulnerabilities ✅
  - All outputs properly escaped

**Scan Result**: PASS ✅

---

## Authentication & Authorization Analysis

### Authentication Implementation
**Status**: SECURE ✅

- [x] Password hashing: bcrypt with 12 rounds ✅
- [x] JWT tokens: HS256 with secure secret ✅
- [x] Token expiration: 15 minutes (access), 7 days (refresh) ✅
- [x] Session management: Secure, httpOnly cookies ✅

### Authorization Implementation
**Status**: NEEDS IMPROVEMENT ⚠️

- [x] RBAC implementation present ✅
- [ ] Missing rate limiting on login endpoint ⚠️ HIGH
- [x] API endpoints check permissions ✅
- [ ] Admin actions logged (recommended) 💡 LOW

**Issues**:
- **HIGH**: No rate limiting on `/api/auth/login` (brute force risk)

---

## Input Validation Analysis

### Validation Coverage
**Status**: GOOD ✅

- [x] Email validation: Proper regex + format check ✅
- [x] Password validation: Length, complexity enforced ✅
- [x] SQL injection prevention: Parameterized queries ✅
- [x] XSS prevention: Output escaping ✅
- [ ] File upload validation: N/A (no file uploads)

**Issues**:
- **MEDIUM**: Password complexity could be stronger (add special char requirement)

---

## Secret Management Analysis

### NO HARDCODED SECRETS Check
**Status**: PASS ✅

**Scan Results**:
```bash
# Scanned for hardcoded patterns:
- API keys: None found ✅
- Passwords: None found ✅
- JWT secrets: None found ✅
- Database credentials: None found ✅
```

**Verification**:
- [x] All secrets from `process.env.*` ✅
- [x] `.env.example` provided ✅
- [x] `.gitignore` includes `.env` ✅
- [x] No secrets in git history ✅

---

## Data Protection Analysis

### Encryption
**Status**: SECURE ✅

- [x] Passwords: bcrypt with 12 rounds ✅
- [x] Communication: HTTPS enforced in production ✅
- [x] JWT tokens: Signed with HS256 ✅
- [x] Database: Connection encrypted (TLS) ✅

### PII Handling
**Status**: COMPLIANT ✅

- [x] User emails: Stored securely
- [x] Passwords: Hashed, never stored plaintext ✅
- [x] Tokens: Secure storage (httpOnly cookies) ✅
- [ ] Data retention policy: Not defined 💡 LOW

---

## Dependency Vulnerabilities

**Tool**: `npm audit`

### Vulnerability Summary
- **Critical**: 0 ✅
- **High**: 0 ✅
- **Moderate**: 2 ⚠️
- **Low**: 5

### Notable Vulnerabilities
1. **MEDIUM**: `jsonwebtoken@8.5.1` - Token verification bypass
   - Current: 8.5.1
   - Fixed in: 9.0.0
   - Recommendation: Upgrade to 9.0.0

2. **MEDIUM**: `validator@13.7.0` - ReDoS vulnerability
   - Current: 13.7.0
   - Fixed in: 13.9.0
   - Recommendation: Upgrade to 13.9.0

**Action**: Update dependencies before release

---

## Error Handling Analysis

### Information Disclosure
**Status**: SECURE ✅

- [x] No stack traces in production ✅
- [x] Generic error messages to clients ✅
- [x] Detailed errors logged server-side only ✅
- [x] No secrets in error messages ✅

**Examples**:
```typescript
// Good: Generic message
return res.status(401).json({ error: "Invalid credentials" });

// Bad: Reveals info
// return res.status(401).json({ error: "Password incorrect" });
```

---

## Security Issues (Prioritized)

### CRITICAL Issues (0)
None ✅

### HIGH Issues (1)
1. **Missing Rate Limiting on Login Endpoint**
   - **Severity**: HIGH
   - **Location**: `src/auth/routes.ts:23` - POST /api/auth/login
   - **Risk**: Brute force attacks on user accounts
   - **Impact**: Account compromise
   - **Recommendation**: Implement rate limiting (e.g., express-rate-limit)
     ```typescript
     import rateLimit from 'express-rate-limit';

     const loginLimiter = rateLimit({
       windowMs: 15 * 60 * 1000, // 15 minutes
       max: 5, // 5 attempts
       message: 'Too many login attempts, please try again later.'
     });

     router.post('/login', loginLimiter, authController.login);
     ```
   - **Blocking**: No (can be documented and addressed post-release with monitoring)

### MEDIUM Issues (3)
1. **Weak Password Complexity Requirements**
   - Current: 8 chars, 1 uppercase, 1 lowercase, 1 number
   - Recommendation: Add special character requirement

2. **Dependency Vulnerability: jsonwebtoken**
   - Upgrade to 9.0.0

3. **Dependency Vulnerability: validator**
   - Upgrade to 13.9.0

### LOW Issues (5)
[...]

---

## Recommendations

### Immediate (Before Release)
1. ⚠️ **Document HIGH issue**: Add monitoring for login attempts, plan rate limiting for next release
2. Update dependencies: jsonwebtoken, validator
3. Review and acknowledge security risks

### Short-term (Next Sprint)
1. Implement rate limiting on login endpoint
2. Enhance password complexity requirements
3. Add admin action logging

### Long-term
1. Security audit by external firm
2. Implement security headers (Helmet.js)
3. Add 2FA support

---

## Security Gate Status

**Decision**: PASS ✅

**Rationale**:
- CRITICAL issues: 0 ✅
- HIGH issues: 1 (non-blocking, can be monitored and addressed post-release)
- NO HARDCODED SECRETS: PASS ✅
- Constitution compliance: PASS ✅
- Core security controls in place (auth, encryption, input validation)

**Conditions**:
- HIGH issue (rate limiting) documented and tracked for next release
- Monitoring in place for suspicious login activity
- Dependencies updated before deployment

**Recommendation**: Approve for release with documented risk acceptance

---

**Generated by**: security-reviewer agent
**Workflow**: cc-devflow v1.0
```

### 状态更新
**orchestration_status.json** (QA PASS):
```json
{
  "reqId": "REQ-123",
  "title": "User Authentication",
  "status": "qa_complete",
  "phase": "release_preparation",
  "completedSteps": ["init", "prd", "epic", "development", "qa"],
  "totalTasks": 25,
  "completedTasks": 25,
  "createdAt": "2025-09-30T12:00:00Z",
  "updatedAt": "2025-09-30T15:40:00Z"
}
```

**orchestration_status.json** (QA FAIL):
```json
{
  "reqId": "REQ-123",
  "title": "User Authentication",
  "status": "qa_failed",
  "phase": "quality_assurance",
  "completedSteps": ["init", "prd", "epic", "development"],
  "createdAt": "2025-09-30T12:00:00Z",
  "updatedAt": "2025-09-30T15:40:00Z"
}
```

## Constitution Check

This command enforces Constitution principles during QA:

### Quality First
- [ ] Test coverage ≥ 80% (NO PARTIAL IMPLEMENTATION of testing)
- [ ] All acceptance criteria covered by tests
- [ ] All DoD criteria completed and verified
- [ ] TDD compliance validated (Phase 2 → Phase 3)

### Security First
- [ ] NO HARDCODED SECRETS verified (automated scan)
- [ ] No CRITICAL security issues
- [ ] HIGH security issues documented and tracked
- [ ] Input validation comprehensive

### Architectural Consistency
- [ ] Code follows existing patterns (Constitution check)
- [ ] No code duplication violations
- [ ] File size limits respected (≤500 lines)
- [ ] No dead code

## Error Handling

### Common Errors

**1. Development not complete**
```
ERROR: Development not complete for REQ-123
Current status: development_in_progress
Remaining tasks: 3
Completed: 22/25

Cannot run QA until all tasks are completed.
Run /flow-dev to continue development.
```

**2. Tests failing**
```
ERROR: Tests are failing for REQ-123
Test command: npm run test
Exit code: 1

Failed tests:
  - test/auth/login.test.ts:45 - "should reject invalid credentials"
  - test/auth/register.test.ts:32 - "should validate email format"

Fix failing tests before running QA.
```

**3. Critical security issues found**
```
❌ Quality Assurance FAILED - CRITICAL security issues found!

CRITICAL Issues (2):
1. HARDCODED API KEY in src/config/api.ts:12
   const API_KEY = "sk_live_abc123..."; // ❌ VIOLATION

2. SQL INJECTION vulnerability in src/users/query.ts:45
   db.query(`SELECT * FROM users WHERE id = ${userId}`); // ❌ UNSAFE

These CRITICAL issues MUST be fixed before proceeding.
Re-run /flow-qa after fixes.
```

**4. Agent execution failed**
```
ERROR: qa-tester agent failed to generate TEST_REPORT.md

Check EXECUTION_LOG.md for details.
Possible causes:
  - Test results not available (test-results.json missing)
  - Insufficient context (PRD.md or EPIC.md missing)
  - Agent execution error

Retry: /flow-qa "REQ-123"
```

### Recovery

If QA fails:
1. Check EXECUTION_LOG.md for detailed error information
2. Review TEST_REPORT.md and SECURITY_REPORT.md (if generated)
3. Fix identified issues:
   - Critical/High security issues (must fix)
   - Test coverage gaps (if below 80%)
   - Constitution violations
4. Re-run /flow-qa after fixes

## Integration with Other Commands

### Workflow Integration
```text
/flow-dev      → Implement tasks ✅
  ↓
/flow-qa       → Quality assurance ← YOU ARE HERE
  ↓
/flow-release  → Create PR and merge
```

### Dependency on /flow-dev
This command requires /flow-dev to have been completed:
- All tasks must be completed (remaining: 0)
- All tests must be passing
- orchestration_status.json must have status="development_complete"

### Enables /flow-release
After successful QA:
- TEST_REPORT.md and SECURITY_REPORT.md provide release evidence
- orchestration_status.json updated to allow /flow-release
- QA gate pass enables PR creation

## Script Integration

This command uses the unified script infrastructure:

### Scripts Called
```bash
# 1. Get requirement paths
.claude/scripts/check-prerequisites.sh --json --paths-only

# 2. Check task completion status
.claude/scripts/check-task-status.sh --json

# 3. Validate Constitution compliance
.claude/scripts/validate-constitution.sh --type code --severity error --json

# 4. Log events (via common.sh)
source .claude/scripts/common.sh
log_event "$REQ_ID" "Quality assurance completed"
```

### Agents Called
```text
qa-tester agent (research-type)
- Analyzes test coverage and quality
- Validates TDD compliance
- Checks acceptance criteria coverage
- Generates TEST_REPORT.md

security-reviewer agent (research-type)
- Performs security analysis
- Checks Constitution security principles
- Analyzes dependencies
- Generates SECURITY_REPORT.md
```

## Best Practices

### Before Running
1. Ensure all development tasks are completed (/flow-dev done)
2. Verify all tests are passing (npm run test)
3. Review code for obvious issues
4. Ensure Constitution compliance

### During Execution
1. Review TEST_REPORT.md carefully
2. Review SECURITY_REPORT.md for security issues
3. Pay special attention to CRITICAL and HIGH issues
4. Understand why QA gate passed or failed

### After Running (QA PASS)
1. **Review both reports thoroughly** (even if gate passed)
2. Document any HIGH security issues and mitigation plan
3. Address MEDIUM/LOW issues if time permits
4. Proceed to /flow-release for PR creation

### After Running (QA FAIL)
1. **Fix CRITICAL issues immediately**
2. Fix HIGH issues (required for gate pass)
3. Consider fixing MEDIUM issues
4. Re-run /flow-qa after fixes
5. Do NOT proceed to /flow-release until gate passes

### Troubleshooting
1. Check both agent outputs for detailed analysis
2. Review EXECUTION_LOG.md for execution details
3. Use validate-constitution.sh directly to check specific issues
4. Run tests manually to verify test status
5. Check test-results.json and test-output.txt for raw test data

---

**Note**: This command invokes two research agents (qa-tester and security-reviewer) which analyze code and generate reports. The agents do not execute code, only create analysis documents. All quality gates are evaluated based on these reports.
