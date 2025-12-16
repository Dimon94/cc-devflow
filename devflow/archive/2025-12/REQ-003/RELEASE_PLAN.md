# Release Plan: REQ-003 - Branch Naming Optimization (Chinese to Pinyin)

**Status**: READY FOR MERGE
**Generated**: 2025-12-16T17:30:00+08:00
**Release Manager**: release-manager agent
**Constitution Reference**: CC-DevFlow Constitution v2.0.0

---

## 1. Release Overview

### 1.1 Requirement Summary

| Attribute | Value |
|-----------|-------|
| **REQ ID** | REQ-003 |
| **Title** | 分支命名优化 (中文转拼音) |
| **Milestone** | M3 (v2.0 Release) |
| **Priority** | P1 |
| **Effort** | 0.5 weeks |
| **Type** | Enhancement (Bash Script) |
| **Branch** | `feature/REQ-003-branch-naming-pinyin` |
| **Target** | `main` |

### 1.2 Key Changes

| File | Change Type | Lines Changed | Description |
|------|-------------|---------------|-------------|
| `.claude/scripts/common.sh` | MODIFIED | +71 | Added `_chinese_to_pinyin()` helper + enhanced `slugify()` |
| `.claude/commands/flow-dev.md` | MODIFIED | +1 | Documentation fix |
| `README.md` | MODIFIED | +7 | Optional dependency section for pypinyin |
| `.claude/tests/slugify.bats` | NEW | +82 | bats-core test suite (10 test cases) |

### 1.3 Functional Summary

**Core Enhancement**: The `slugify()` function in `common.sh` now supports Chinese-to-Pinyin conversion for branch naming.

**Before**:
```bash
slugify "用户登录"  # Returns: "" (empty - Chinese removed)
```

**After**:
```bash
slugify "用户登录"  # Returns: "yong-hu-deng-lu"
```

**Backward Compatibility**: 100% preserved. English input behavior unchanged.

---

## 2. Release Readiness Assessment

### 2.1 Task Completion Status

| Phase | Tasks | Completed | Status |
|-------|-------|-----------|--------|
| Phase 1: Setup | 4 | 4 | COMPLETE |
| Phase 3: MVP (US1+US2) | 7 | 7 | COMPLETE |
| Phase 4: Story 3 | 5 | 5 | COMPLETE |
| Phase 5: Polish | 5 | 5 | COMPLETE |
| **TOTAL** | **21** | **21** | **100%** |

### 2.2 Quality Gates Verification

| Gate | Threshold | Actual | Status | Evidence |
|------|-----------|--------|--------|----------|
| Task Completion | 100% | 100% (21/21) | PASS | TASKS.md |
| Test Cases | All Pass | 10/10 PASS | PASS | TEST_REPORT.md |
| AC Coverage | 100% | 100% (10/10) | PASS | TEST_REPORT.md Section 2.2 |
| TDD Compliance | Tests First | VERIFIED | PASS | T005-T007 before T008-T009 |
| Security Scan | No Critical/High | 0 Critical, 0 High | PASS | SECURITY_REPORT.md |
| Constitution | 0 Violations | 0 Violations | PASS | All 10 Articles checked |
| Backward Compat | Zero Regression | Zero Regression | PASS | US2 tests (4 cases) |

### 2.3 TDD Compliance Evidence

```
Phase 3 Execution Order:
T005 [Tests] → T006 [Tests] → T007 [RED Checkpoint] → T008 [Impl] → T009 [Impl] → T010 [GREEN]

Verification:
- T007 confirmed: English tests PASS, Chinese tests FAIL (as expected)
- T010 confirmed: All tests PASS after implementation
```

### 2.4 User Story Completion

| Story | Priority | Tests | Status | Independent Verification |
|-------|----------|-------|--------|--------------------------|
| US1: Chinese to Pinyin | P1 (MVP) | 4 | PASS | `slugify "用户登录"` → `yong-hu-deng-lu` |
| US2: English Compatibility | P1 (MVP) | 4 | PASS | `slugify "User Login"` → `user-login` |
| US3: Dependency Warning | P2 | 2 | PASS | Warning to stderr when pypinyin missing |

---

## 3. Risk Assessment

### 3.1 Risk Level

| Category | Rating | Confidence |
|----------|--------|------------|
| **Overall Risk** | LOW | HIGH |
| Regression Risk | MINIMAL | HIGH |
| Security Risk | LOW | HIGH |
| Performance Impact | NEGLIGIBLE | HIGH |

### 3.2 Risk Analysis

| Risk | Likelihood | Impact | Mitigation | Status |
|------|------------|--------|------------|--------|
| English input regression | L | H | 4 regression tests | MITIGATED |
| pypinyin not installed | M | L | Graceful degradation + warning | MITIGATED |
| Command injection | L | H | sys.argv parameter passing | MITIGATED |
| Polyphone errors | M | L | pypinyin default dictionary | ACCEPTABLE |

### 3.3 Potential Impact

**Positive**:
- Chinese feature names now produce readable branch names
- Enhanced developer experience for Chinese-speaking teams

**Neutral**:
- No impact on existing English-only workflows
- Optional dependency (pypinyin) - system works without it

**Negative**:
- None identified

---

## 4. Rollback Plan

### 4.1 Trigger Conditions

Rollback MUST be executed if ANY of:
- English input behavior changes (regression)
- CI/CD pipeline failures
- Security vulnerability discovered
- Critical runtime errors reported

### 4.2 Rollback Procedure

```bash
# Step 1: Identify merge commit
git log --oneline -5 main

# Step 2: Revert the merge commit
git revert -m 1 <merge-commit-sha>

# Step 3: Push revert
git push origin main

# Step 4: Verify rollback
source .claude/scripts/common.sh
slugify "User Login"  # Should return: user-login
```

### 4.3 Rollback Scope

| File | Rollback Action |
|------|-----------------|
| `.claude/scripts/common.sh` | Revert to pre-merge state |
| `.claude/tests/slugify.bats` | Keep (no harm) or delete |
| `README.md` | Revert pypinyin section |

### 4.4 Data Impact

- **Data Loss**: NONE (no data persistence)
- **State Impact**: NONE (stateless function)
- **User Impact**: Chinese input reverts to original behavior (characters removed)

---

## 5. Monitoring Plan

### 5.1 Pre-Release Verification

```bash
# Run test suite
bats .claude/tests/slugify.bats

# Manual verification
source .claude/scripts/common.sh

# Test Chinese input
slugify "用户登录功能"
# Expected: yong-hu-deng-lu-gong-neng

# Test English input (regression)
slugify "User Login Feature"
# Expected: user-login-feature

# Test mixed input
slugify "OAuth2认证"
# Expected: oauth2-ren-zheng
```

### 5.2 Post-Release Verification

```bash
# 1. Clone fresh and verify
git clone <repo-url> /tmp/verify-req003
cd /tmp/verify-req003
source .claude/scripts/common.sh

# 2. Run quick smoke test
slugify "测试功能"  # Should output: ce-shi-gong-neng

# 3. Verify no pypinyin warning for English
slugify "test feature" 2>&1 | grep -v Warning  # No warning expected

# 4. Full test suite
bats .claude/tests/slugify.bats
```

### 5.3 Key Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Test Pass Rate | 100% | `bats` exit code 0 |
| Regression Tests | 4/4 PASS | US2 test cases |
| Warning on Missing Dep | Output to stderr | Manual check |

---

## 6. Dependencies

### 6.1 Upstream Dependencies

| Dependency | Type | Status | Impact if Missing |
|------------|------|--------|-------------------|
| Python3 | Runtime | REQUIRED | Function uses Python for regex |
| pypinyin | Optional | RECOMMENDED | Chinese conversion disabled, warning shown |
| bats-core | Dev-only | REQUIRED | Tests cannot run |

### 6.2 Downstream Impact

| Consumer | Impact | Action Required |
|----------|--------|-----------------|
| `/flow-init` | Uses `slugify()` for branch names | None - backward compatible |
| `create-requirement.sh` | Calls `slugify()` | None - backward compatible |
| Existing workflows | Branch naming | None - English unchanged |

### 6.3 External Systems

- **GitHub**: Branch naming rules compatible (ASCII output)
- **CI/CD**: No changes required

---

## 7. Pull Request Description Draft

### 7.1 PR Title

```
feat(REQ-003): add Chinese-to-Pinyin support for branch naming
```

### 7.2 PR Body

```markdown
## Summary

- Add Chinese-to-Pinyin conversion support in `slugify()` function
- Enable meaningful branch names for Chinese feature titles
- Maintain 100% backward compatibility with English input

## Changes

| File | Change |
|------|--------|
| `.claude/scripts/common.sh` | +`_chinese_to_pinyin()` helper, enhanced `slugify()` |
| `.claude/tests/slugify.bats` | New test suite (10 test cases) |
| `README.md` | Optional dependency documentation |

## Test Results

```
bats .claude/tests/slugify.bats

 ✓ slugify: English phrase converts to lowercase hyphenated
 ✓ slugify: English with numbers preserves numbers
 ✓ slugify: Empty input returns empty string
 ✓ slugify: Pure numbers preserved
 ✓ slugify: Pure Chinese converts to pinyin
 ✓ slugify: Mixed Chinese-English converts correctly
 ✓ slugify: Chinese with special characters filters correctly
 ✓ slugify: Polyphone word uses default pronunciation
 ✓ slugify: No warning for English input regardless of pypinyin
 ✓ slugify: Warning function exists and handles missing pypinyin

10 tests, 0 failures
```

## Security Status

- **Risk Level**: LOW
- **Command Injection**: MITIGATED (sys.argv parameter passing)
- **Input Validation**: PASS (whitelist filter `[a-z0-9-]`)
- See: `devflow/requirements/REQ-003/SECURITY_REPORT.md`

## Verification Commands

```bash
# Quick smoke test
source .claude/scripts/common.sh
slugify "用户登录"  # Expected: yong-hu-deng-lu
slugify "User Login" # Expected: user-login (unchanged)

# Full test suite
bats .claude/tests/slugify.bats
```

## Breaking Changes

None. This is a backward-compatible enhancement.

## Documentation

- [PRD](devflow/requirements/REQ-003/PRD.md)
- [EPIC](devflow/requirements/REQ-003/EPIC.md)
- [TASKS](devflow/requirements/REQ-003/TASKS.md)
- [TEST_REPORT](devflow/requirements/REQ-003/TEST_REPORT.md)
- [SECURITY_REPORT](devflow/requirements/REQ-003/SECURITY_REPORT.md)

## Checklist

- [x] All tests passing (10/10)
- [x] TDD compliance verified
- [x] Security review complete
- [x] Documentation updated
- [x] Backward compatibility confirmed
```

---

## 8. Release Checklist

### 8.1 Pre-Release Checks

- [x] All 21 tasks completed (TASKS.md)
- [x] All 10 tests passing (TEST_REPORT.md)
- [x] Security review approved (SECURITY_REPORT.md)
- [x] TDD compliance verified (Phase 2 tests before Phase 3 implementation)
- [x] Constitution check passed (10 Articles)
- [x] Backward compatibility verified (US2 regression tests)
- [x] Documentation updated (README.md, function contracts)
- [x] Code review checkpoints completed (4 phases)

### 8.2 Release Commands (for Main Agent)

```bash
# Step 1: Final verification
bats .claude/tests/slugify.bats

# Step 2: Ensure clean working directory
git status

# Step 3: Create Pull Request
gh pr create \
  --base main \
  --head feature/REQ-003-branch-naming-pinyin \
  --title "feat(REQ-003): add Chinese-to-Pinyin support for branch naming" \
  --body-file devflow/requirements/REQ-003/RELEASE_PLAN.md

# Step 4: After PR approval, merge with squash
gh pr merge --squash --delete-branch

# Step 5: Update orchestration status
# Update devflow/requirements/REQ-003/orchestration_status.json:
# "status": "release_complete"

# Step 6: Log release event
source .claude/scripts/common.sh
log_event "REQ-003" "Release complete - merged to main via squash merge"
```

### 8.3 Post-Release Validation

- [ ] Verify merge successful on GitHub
- [ ] Run smoke test on main branch
- [ ] Confirm no CI failures
- [ ] Update CHANGELOG.md (if applicable)
- [ ] Archive requirement documentation
- [ ] Notify stakeholders

---

## 9. Changelog Entry

```markdown
## [Unreleased]

### Added
- Chinese-to-Pinyin conversion support in `slugify()` function (REQ-003)
  - New `_chinese_to_pinyin()` helper function using pypinyin library
  - Graceful degradation with warning when pypinyin not installed
  - 10 bats test cases covering all user stories

### Documentation
- Added pypinyin optional dependency instructions to README.md
```

---

## 10. Sign-Off

### 10.1 Quality Gate Summary

| Gate | Owner | Status | Date |
|------|-------|--------|------|
| Task Completion | planner | PASS | 2025-12-16 |
| Test Coverage | qa-tester | PASS | 2025-12-16 |
| Security Review | security-reviewer | PASS | 2025-12-16 |
| Constitution Compliance | release-manager | PASS | 2025-12-16 |
| Release Readiness | release-manager | PASS | 2025-12-16 |

### 10.2 Final Assessment

**RELEASE VERDICT**: **APPROVED**

REQ-003 has passed all quality gates and is ready for merge to main:

1. **Functional Complete**: All 3 User Stories implemented and tested
2. **Quality Assured**: 10/10 tests passing, 100% AC coverage
3. **Security Cleared**: No vulnerabilities, proper input sanitization
4. **Backward Compatible**: Zero regression in English input behavior
5. **TDD Compliant**: Tests written before implementation
6. **Constitution Aligned**: All 10 Articles satisfied

**Recommendation**: Proceed with PR creation and merge.

---

## Appendix A: File Diff Summary

### A.1 common.sh Changes (Lines 176-264)

```bash
# New function added (L184-234)
_chinese_to_pinyin() {
    # Check pypinyin availability
    # Convert Chinese to pinyin using Python3 + pypinyin
    # Graceful degradation with warning
}

# Enhanced slugify() (L241-264)
slugify() {
    # Added: Chinese character detection
    # Added: Conditional call to _chinese_to_pinyin()
    # Preserved: Original English processing logic
}
```

### A.2 Test Coverage

| Test File | Test Cases | Coverage |
|-----------|------------|----------|
| `.claude/tests/slugify.bats` | 10 | 100% ACs |

---

**Generated by**: release-manager agent
**Based on**: TEST_REPORT.md, SECURITY_REPORT.md, TASKS.md, orchestration_status.json
**Constitution**: CC-DevFlow Constitution v2.0.0
**Next Step**: Main agent executes PR creation and merge commands
