# Implementation Plan Template

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

---
req_id: "${REQ_ID}"
task_id: "${TASK_ID}"
created_at: "${TIMESTAMP}"
status: "pending"
---

## Task Overview

**Task**: ${TASK_DESCRIPTION}

**DoD (Definition of Done)**:
${DOD_ITEMS}

## Implementation Strategy

### Approach

${APPROACH_DESCRIPTION}

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| ${FILE_PATH} | ${ACTION} | ${DESCRIPTION} |

### Dependencies

- ${DEPENDENCY_1}
- ${DEPENDENCY_2}

## TDD Sequence

### Phase 2: Write Tests First

```${LANGUAGE}
// Test file: ${TEST_FILE_PATH}
${TEST_CODE}
```

**Expected Result**: Test should FAIL initially

### Phase 3: Implementation

```${LANGUAGE}
// Implementation file: ${IMPL_FILE_PATH}
${IMPL_CODE}
```

**Expected Result**: Test should PASS after implementation

## Verification Steps

1. Run tests: `${TEST_COMMAND}`
2. Verify output: ${EXPECTED_OUTPUT}
3. Check coverage: `${COVERAGE_COMMAND}`

## Constitution Compliance

- [ ] Article I: Complete implementation, no placeholders
- [ ] Article II: Reused existing code where possible
- [ ] Article III: No hardcoded secrets
- [ ] Article VI: TDD sequence followed

## Notes

${ADDITIONAL_NOTES}
