# Journey Coherence Checker - Pressure Scenarios

## Purpose
TDD RED Phase: Define scenarios to test agent behavior WITHOUT the skill.

---

## Scenario 1: Dependency Not Satisfied

**Setup**:
- REQ-007 declares `dependencies: ["RM-006", "RM-007"]`
- RM-006 (REQ-004) is `release_complete`
- RM-007 (REQ-005) is `release_complete`
- But REQ-005's actual output doesn't match what REQ-007 expects

**Pressure**:
```
User: "REQ-007 开发完成了，请帮我检查一下"
```

**Expected Baseline Behavior (WITHOUT skill)**:
- Agent only checks REQ-007's internal consistency
- Agent doesn't verify RM-007's output matches REQ-007's input expectation
- Agent says "PASS" even though there's a gap

**Desired Behavior (WITH skill)**:
- Agent reads REQ-007's `dependencies` field
- Agent reads REQ-005's actual output (from TECH_DESIGN or contracts)
- Agent compares expected vs actual
- Agent reports mismatch if found

---

## Scenario 2: Milestone Success Criteria Not Met

**Setup**:
- M4 Success Criteria: "All 4 platforms can execute core workflows"
- REQ-004, REQ-005, REQ-006 are `release_complete`
- But only 2 platforms actually work (Claude + Codex)

**Pressure**:
```
User: "M4 完成了吗？"
```

**Expected Baseline Behavior (WITHOUT skill)**:
- Agent checks individual REQ status
- Agent sees all REQs are complete
- Agent says "M4 完成了"

**Desired Behavior (WITH skill)**:
- Agent reads M4's Success Criteria from ROADMAP.md
- Agent verifies each criterion against actual implementation
- Agent reports "2/4 platforms working, M4 not complete"

---

## Scenario 3: Cumulative Scope Reduction

**Setup**:
- ROADMAP M4 originally planned 7 deliverables (RM-007 to RM-013)
- Each REQ's PRD "slightly simplified" the scope
- Final implementation covers only 60% of original vision

**Pressure**:
```
User: "M4 的所有需求都开发完了，可以发布了吗？"
```

**Expected Baseline Behavior (WITHOUT skill)**:
- Agent checks each REQ's status
- Agent sees all are `release_complete`
- Agent says "可以发布"

**Desired Behavior (WITH skill)**:
- Agent compares ROADMAP deliverables vs actual PRD scope
- Agent calculates coverage percentage
- Agent reports "60% coverage, 40% scope reduction detected"

---

## Scenario 4: Journey Gap (Missing Glue)

**Setup**:
- User journey: `/flow-init` → `/flow-prd` → `/flow-epic` → `/flow-dev` → `/flow-release`
- REQ-005 implements `/flow-dev` improvements
- REQ-006 implements compiler
- But there's no REQ connecting them (the "glue" is missing)

**Pressure**:
```
User: "从 /flow-init 到 /flow-release 的完整流程能跑通吗？"
```

**Expected Baseline Behavior (WITHOUT skill)**:
- Agent checks individual command implementations
- Agent doesn't test end-to-end flow
- Agent says "应该可以"

**Desired Behavior (WITH skill)**:
- Agent identifies the user journey
- Agent traces through each step
- Agent finds the gap between REQ-005 and REQ-006
- Agent reports "Gap found: no integration between X and Y"

---

## Scenario 5: Orphan Requirement

**Setup**:
- REQ-008 exists but is not mapped to any ROADMAP item
- REQ-008 is `release_complete`
- But it doesn't contribute to any Milestone

**Pressure**:
```
User: "所有需求都完成了，项目进度如何？"
```

**Expected Baseline Behavior (WITHOUT skill)**:
- Agent counts completed REQs
- Agent reports "X/Y REQs complete"
- Agent doesn't notice REQ-008 is orphan

**Desired Behavior (WITH skill)**:
- Agent maps REQs to ROADMAP items
- Agent identifies REQ-008 as orphan
- Agent reports "REQ-008 not mapped to any Milestone"

---

## Test Execution Plan

### Phase 1: Baseline Testing (RED)
1. Create mock REQ-007 with unmet dependency
2. Ask agent to verify REQ-007
3. Document agent's response verbatim
4. Identify rationalizations used

### Phase 2: Skill Writing (GREEN)
1. Write skill addressing baseline failures
2. Re-run scenarios
3. Verify agent now catches issues

### Phase 3: Refinement (REFACTOR)
1. Find new rationalizations
2. Add explicit counters
3. Re-test until bulletproof

---

## Key Rationalizations to Watch For

| Potential Excuse | Counter |
|------------------|---------|
| "依赖已经标记完成了" | 完成 ≠ 满足。检查实际输出。 |
| "每个需求都通过了验证" | 单需求验证 ≠ 全局一致性。 |
| "ROADMAP 是规划，不是承诺" | Success Criteria 是承诺。 |
| "这超出了我的检查范围" | 这正是你的检查范围。 |
| "用户没有要求检查全局" | 全局检查是隐含要求。 |

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
