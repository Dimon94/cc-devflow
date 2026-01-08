---
name: flow-tdd
description: "Enforces TDD Iron Law in flow-dev. NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST."
---

# Flow TDD - Test-Driven Development Enforcement

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

This is NON-NEGOTIABLE. No exceptions. No "just this once."

## The TDD Cycle

```
RED:    Write a failing test
        → Run it
        → Confirm it FAILS
        → If it passes immediately → ERROR (invalid test)

GREEN:  Write minimal code to pass
        → Only enough to make the test pass
        → No extra features
        → No "while I'm here" additions

REFACTOR: Clean up
        → Keep tests green
        → Improve structure
        → Remove duplication
```

## Enforcement in flow-dev

### Phase 2: Tests First

```yaml
TASKS.md Phase 2 (Tests):
  - Write contract tests
  - Write integration tests
  - Write unit tests
  - Run all tests → ALL MUST FAIL

⚠️ TEST VERIFICATION CHECKPOINT:
  → Run: npm test (or equivalent)
  → Expected: All new tests FAIL
  → If any test passes immediately → STOP
  → Passing test = invalid test or code already exists
```

### Phase 3: Implementation

```yaml
TASKS.md Phase 3 (Implementation):
  - Implement to make tests pass
  - One test at a time
  - Minimal code only

After each implementation:
  → Run tests
  → Verify previously failing test now passes
  → Verify no regressions
```

## What If Code Already Exists?

If you've written code before tests:

```yaml
Option A: DELETE AND RESTART (Recommended)
  1. Delete the implementation code
  2. Keep only the interface/contract
  3. Write failing tests
  4. Re-implement with TDD

Option B: WRITE TESTS THAT FAIL FIRST
  1. Comment out the implementation
  2. Write tests
  3. Run tests → verify they fail
  4. Uncomment implementation
  5. Run tests → verify they pass

NEVER: Keep code and write passing tests
  → This is "testing after" disguised as TDD
  → Tests that pass immediately prove nothing
```

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |
| "Tests after achieve same goals" | Tests-after = "what does this do?" Tests-first = "what should this do?" |
| "Already manually tested" | Ad-hoc ≠ systematic. No record, can't re-run. |
| "Deleting X hours is wasteful" | Sunk cost fallacy. Keeping unverified code is technical debt. |
| "Keep as reference, write tests first" | You'll adapt it. That's testing after. Delete means delete. |
| "Need to explore first" | Fine. Throw away exploration, start with TDD. |
| "Test hard = design unclear" | Listen to test. Hard to test = hard to use. |
| "TDD slows me down" | TDD faster than debugging. Pragmatic = test-first. |
| "This is different because..." | No. This is rationalization. Follow the law. |
| "Spirit not letter" | Violating letter IS violating spirit. No loopholes. |
| "I'm being pragmatic, not dogmatic" | TDD IS pragmatic. Shortcuts = debugging in production = slower. |
| "Just this once" | No exceptions. Rules exist for this exact moment. |

## Red Flags - STOP

If you find yourself:
- Writing code before tests
- Tests passing immediately
- Saying "just this once"
- Keeping "exploration" code
- Writing tests that describe existing code

**STOP. Delete the code. Write the test first.**

## Test Quality Requirements

```yaml
Good Tests:
  ✅ Test behavior, not implementation
  ✅ Use realistic data
  ✅ Cover edge cases
  ✅ Independent (no shared state)
  ✅ Fast (< 1 second each)
  ✅ Descriptive names

Bad Tests (Cheater Tests):
  ❌ assert True
  ❌ assert result is not None
  ❌ Mock everything, test nothing
  ❌ Test implementation details
  ❌ Depend on execution order
```

## Integration with Constitution

- **Article I**: Complete implementation includes tests
- **Article VI**: TDD Mandate (this skill)
- **Article IX**: Integration-first testing

## Cross-Reference

- [rationalization-library.md](../../rules/rationalization-library.md#article-vi-test-first-development---rationalization-table)
- [project-constitution.md](../../rules/project-constitution.md#article-vi-test-first-development-测试优先开发)

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
