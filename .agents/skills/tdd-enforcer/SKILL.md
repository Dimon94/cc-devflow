---
name: devflow-tdd-enforcer
description: Enforces TDD order in TASKS.md - Tests MUST be marked complete before Implementation tasks. Blocks violations in real-time.
---

# DevFlow TDD Enforcer

## Purpose
Enforce Test-First Development (TDD) order by preventing users from marking implementation tasks complete before their corresponding test tasks.

**Trigger**: PreToolUse hook when editing `devflow/requirements/**/TASKS.md`

## Enforcement Rule

**Source**: Extracted from planner agent's TDD mandate + Constitution Article VI

### ❌ BLOCKED Pattern (Violation)
```markdown
- [x] **T010** [US1] Implement user registration endpoint
- [ ] **T011** [US1] Test user registration with valid data
```
**Problem**: Implementation marked done BEFORE test

**Regex Pattern**: `\[x\].*Implementation.*\n.*\[ \].*Test`

### ✅ CORRECT Pattern (TDD Sequence)
```markdown
- [ ] **T010** [US1] Test user registration with valid data (write FAILING test)
- [ ] **T011** [US1] Implement user registration endpoint (make test PASS)
```

**Or after completion**:
```markdown
- [x] **T010** [US1] Test user registration with valid data
- [x] **T011** [US1] Implement user registration endpoint
```

## Blocking Message

When violation detected, PreToolUse hook returns **exit code 2** (blocks file save):

```
⚠️ BLOCKED - TDD Violation Detected

📋 REQUIRED ACTION:
1. Re-order TASKS.md to follow TDD sequence
2. Mark test tasks [x] BEFORE implementation tasks
3. Review Constitution Article VI - Test-First Development

Reason: CC-DevFlow enforces TDD (Tests First → Implementation)
Source: planner agent mandate + Constitution Article VI
File: {file_path}

Current Issue:
  Line {N}: Implementation task marked complete
  Line {N+1}: Test task NOT marked complete

💡 SKIP: Add `@skip-tdd-check` comment or set SKIP_TDD_ENFORCER=1
```

## Constitutional Basis

### Article VI: Test-First Development
```yaml
TDD MANDATE:
  - Write test FIRST (must fail)
  - Implement code SECOND (make test pass)
  - No implementation without corresponding test
  - Test coverage ≥80%
```

### planner agent enforces
- Generates TASKS.md with correct TDD order
- Phase 2: All tests listed first
- Phase 3+: Each user story has Test task before Implementation task
- Inserts "⚠️ TEST VERIFICATION CHECKPOINT" between Phase 2 and Phase 3

### devflow-tdd-enforcer guardrail prevents
- Users from manually reversing that order
- Implementation tasks marked complete before test tasks
- Real-time detection during file editing

## Additional Violation Patterns

### Pattern 2: Phase 3+ User Story TDD Order
```markdown
# ❌ BLOCKED
- [x] **T020** [US2] Implement login endpoint
- [ ] **T021** [US2] Test login with valid credentials

# ✅ CORRECT
- [x] **T020** [US2] Test login with valid credentials
- [x] **T021** **T021** [US2] Implement login endpoint
```

**Regex Pattern**: `\[x\].*\[US\d+\].*Implement.*\n.*\[ \].*\[US\d+\].*Test`

### Pattern 3: Implementation without Test
```markdown
# ❌ BLOCKED (if no corresponding test found)
- [ ] **T030** [US3] Implement password reset endpoint
# (No T029 or T031 test task found)

# ✅ CORRECT
- [ ] **T029** [US3] Test password reset with valid email
- [ ] **T030** [US3] Implement password reset endpoint
```

## Skip Conditions

Users can bypass TDD enforcer in specific scenarios:

### 1. Session Skip (One-time per session)
- **Mechanism**: `sessionSkillUsed: true` in skill-rules.json
- **Behavior**: Guardrail only triggers once per Codex session
- **Use case**: User acknowledged TDD violation, wants to continue

### 2. File Marker (Permanent skip for specific file)
- **Marker**: Add `@skip-tdd-check` comment anywhere in TASKS.md
- **Example**:
  ```markdown
  <!-- @skip-tdd-check: Hotfix deployment, will add tests in follow-up -->
  ```
- **Use case**: Emergency hotfix, tests to be added later

### 3. Environment Variable (Temporary global skip)
- **Variable**: `SKIP_TDD_ENFORCER=1`
- **Scope**: Current terminal session
- **Use case**: Batch operations, automated scripts

## Relationship with Other Components

### mark-task-complete.sh (Script)
- **Purpose**: Marks tasks complete in正常 workflow (via /flow-dev)
- **Validation**: Batch validation at phase completion
- **Timing**: After task execution

### devflow-tdd-enforcer (Guardrail)
- **Purpose**: Real-time prevention of manual TDD violations
- **Validation**: Per-edit, blocks save if violation detected
- **Timing**: During file editing (PreToolUse hook)

**Relationship**: **Complementary (双重保险)**
- Script ensures正常流程 follows TDD
- Guardrail prevents手动编辑 from breaking TDD

### Constitution Article VI
- **Defines**: TDD philosophy and mandates
- **Enforcement**: planner agent (generation time) + devflow-tdd-enforcer (edit time)

## Configuration

In `.Codex/skills/skill-rules.json`:

```json
{
  "devflow-tdd-enforcer": {
    "type": "guardrail",
    "enforcement": "block",
    "priority": "critical",
    "description": "Enforces TDD order, extracted from planner agent rules",
    "fileTriggers": {
      "pathPatterns": ["devflow/requirements/**/TASKS.md"],
      "contentPatterns": [
        "\\[x\\].*Implementation.*\\n.*\\[ \\].*Test",
        "\\[x\\].*\\[US\\d+\\].*Implement.*\\n.*\\[ \\].*\\[US\\d+\\].*Test"
      ]
    },
    "blockMessage": "⚠️ BLOCKED - TDD Violation\n\nTasks must follow TDD order:\n1. [ ] Test (write failing test)\n2. [ ] Implementation (make test pass)\n\n📋 ACTION: Re-order TASKS.md\nSource: planner agent mandate + Constitution Article VI\n\n💡 SKIP: @skip-tdd-check or SKIP_TDD_ENFORCER=1",
    "skipConditions": {
      "sessionSkillUsed": true,
      "fileMarkers": ["@skip-tdd-check"],
      "envOverride": "SKIP_TDD_ENFORCER"
    }
  }
}
```

## Design Principle

**This guardrail does NOT contain**:
- ❌ Complete TDD methodology (that's in planner agent)
- ❌ Task generation logic (that's in planner agent)
- ❌ Full Constitution Article VI (that's in project-constitution.md)

**This guardrail ONLY contains**:
- ✅ Prohibition rule extraction (from planner agent)
- ✅ Real-time violation detection (content pattern matching)
- ✅ Blocking mechanism (PreToolUse hook, exit code 2)
- ✅ Links to source documentation

**Rationale**: Avoid duplication ("不重不漏" principle). planner agent owns TDD generation logic, guardrail owns real-time enforcement.
