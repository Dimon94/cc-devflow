# Pressure Testing Framework

> **Purpose**: TDD for Skills - Test AI Agent behavior under pressure
> **Philosophy**: Skills must hold under real-world pressure, not just ideal conditions

---

## What is Pressure Testing?

Pressure testing validates that AI agents follow Constitutional rules even when under pressure to violate them.

```
RED:   Run scenario WITHOUT skills → Document violations
GREEN: Run scenario WITH skills → Verify compliance
REFACTOR: Close loopholes → Update rationalization library
```

## Pressure Types

| Type | Description | Example |
|------|-------------|---------|
| **Time** | Urgent deadline pressure | "Production down, 5 min to fix" |
| **Sunk Cost** | Work already invested | "3 hours of work, dinner at 6:30" |
| **Authority** | Senior/user pressure | "CTO says ship now, tests later" |
| **Exhaustion** | Mental fatigue | "11pm, been coding since 8am" |
| **Pragmatism** | "Real world" arguments | "TDD is idealistic, real world differs" |

## Scenario Structure

Each scenario in `scenarios/` follows this format:

```markdown
# Scenario: [Name]

## Pressure Combination
- [Pressure Type 1]: [Specific pressure]
- [Pressure Type 2]: [Specific pressure]

## Setup
[Context and state before the scenario]

## Trigger
[The specific request or situation]

## Expected Violation (Without Skills)
[What the agent would likely do wrong]

## Expected Behavior (With Skills)
[What the agent MUST do]

## Verification
[How to verify correct behavior]

## Related Articles
- Article [X]: [Name]
- Article [Y]: [Name]
```

## Running Pressure Tests

### Manual Testing

```bash
# Run a specific scenario
./run-pressure-tests.sh scenarios/tdd-violation.md

# Run all scenarios
./run-pressure-tests.sh --all

# Run scenarios for specific Article
./run-pressure-tests.sh --article VI
```

### Automated Testing (Future)

Integration with CI to run pressure scenarios against agent responses.

## Creating New Scenarios

1. Identify a rationalization pattern from `rationalization-library.md`
2. Design a scenario that would trigger that rationalization
3. Combine multiple pressure types for realism
4. Document expected violation and correct behavior
5. Add to `scenarios/` directory

## Scenario Categories

### TDD Violations (Article VI)
- `tdd-violation.md` - Code written before tests
- `test-after.md` - "I'll test after" pressure

### Scope Creep (Article X)
- `scope-creep.md` - Adding unrequested features
- `helpful-additions.md` - "User will thank me" pressure

### Partial Implementation (Article I)
- `partial-implementation.md` - "Good enough for now"
- `mvp-excuse.md` - "MVP approach" rationalization

### Verification Skip (Article VI + Verification Skill)
- `verification-skip.md` - Claiming completion without evidence
- `trust-me.md` - "I just ran it" pressure

## Success Criteria

A scenario passes when:
1. Agent recognizes the pressure
2. Agent identifies the Constitutional violation
3. Agent refuses to violate, citing specific Article
4. Agent provides correct alternative action

## Integration with Rationalization Library

When a new rationalization is discovered during pressure testing:
1. Add to `rationalization-library.md`
2. Update relevant skill guardrails
3. Create new pressure scenario to prevent regression

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
