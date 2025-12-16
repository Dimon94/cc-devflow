# Spec-Kit Checklist Implementation Reference

**Source**: spec-kit/templates/commands/checklist.md
**Date**: 2025-12-15
**Type**: Internal Reference Implementation

---

## Core Concept: Unit Tests for English

**CRITICAL CONCEPT**: Checklists are **UNIT TESTS FOR REQUIREMENTS WRITING** - they validate the quality, clarity, and completeness of requirements in a given domain.

### What Checklists Are NOT For

❌ NOT "Verify the button clicks correctly"
❌ NOT "Test error handling works"
❌ NOT "Confirm the API returns 200"
❌ NOT checking if code/implementation matches the spec

### What Checklists ARE For

✅ "Are visual hierarchy requirements defined for all card types?" (completeness)
✅ "Is 'prominent display' quantified with specific sizing/positioning?" (clarity)
✅ "Are hover state requirements consistent across all interactive elements?" (consistency)
✅ "Are accessibility requirements defined for keyboard navigation?" (coverage)
✅ "Does the spec define what happens when logo image fails to load?" (edge cases)

**Metaphor**: If your spec is code written in English, the checklist is its unit test suite.

---

## Quality Dimensions

### Category Structure
- **Requirement Completeness**: Are all necessary requirements documented?
- **Requirement Clarity**: Are requirements specific and unambiguous?
- **Requirement Consistency**: Do requirements align without conflicts?
- **Acceptance Criteria Quality**: Are success criteria measurable?
- **Scenario Coverage**: Are all flows/cases addressed?
- **Edge Case Coverage**: Are boundary conditions defined?
- **Non-Functional Requirements**: Performance, Security, Accessibility, etc.
- **Dependencies & Assumptions**: Are they documented and validated?
- **Ambiguities & Conflicts**: What needs clarification?

### Dimension Tags
- `[Completeness]` - 是否定义了 X？
- `[Clarity]` - X 是否有明确定义？
- `[Consistency]` - X 和 Y 是否一致？
- `[Measurability]` - 如何验证 X？
- `[Coverage]` - 是否覆盖 X 场景？

### Traceability Markers
- `[Spec §X.Y]` - Reference to spec section
- `[Gap]` - Missing requirement
- `[Ambiguity]` - Unclear definition
- `[Conflict]` - Contradicting requirements
- `[Assumption]` - Unstated assumption

---

## Item Writing Patterns

### ✅ CORRECT Patterns (Testing requirements quality)
- "Are [requirement type] defined/specified/documented for [scenario]?"
- "Is [vague term] quantified/clarified with specific criteria?"
- "Are requirements consistent between [section A] and [section B]?"
- "Can [requirement] be objectively measured/verified?"
- "Are [edge cases/scenarios] addressed in requirements?"
- "Does the spec define [missing aspect]?"

### ❌ PROHIBITED Patterns (Testing implementation)
- Any item starting with "Verify", "Test", "Confirm", "Check" + implementation behavior
- References to code execution, user actions, system behavior
- "Displays correctly", "works properly", "functions as expected"
- "Click", "navigate", "render", "load", "execute"
- Test cases, test plans, QA procedures
- Implementation details (frameworks, APIs, algorithms)

---

## Example Checklists by Type

### UX Requirements Quality (ux.md)
```markdown
- [ ] CHK001 - Are visual hierarchy requirements defined with measurable criteria? [Clarity, Spec §FR-1]
- [ ] CHK002 - Is the number and positioning of UI elements explicitly specified? [Completeness, Spec §FR-1]
- [ ] CHK003 - Are interaction state requirements (hover, focus, active) consistently defined? [Consistency]
- [ ] CHK004 - Are accessibility requirements specified for all interactive elements? [Coverage, Gap]
```

### API Requirements Quality (api.md)
```markdown
- [ ] CHK001 - Are error response formats specified for all failure scenarios? [Completeness]
- [ ] CHK002 - Are rate limiting requirements quantified with specific thresholds? [Clarity]
- [ ] CHK003 - Are authentication requirements consistent across all endpoints? [Consistency]
- [ ] CHK004 - Are retry/timeout requirements defined for external dependencies? [Coverage, Gap]
```

### Performance Requirements Quality (performance.md)
```markdown
- [ ] CHK001 - Are performance requirements quantified with specific metrics? [Clarity]
- [ ] CHK002 - Are performance targets defined for all critical user journeys? [Coverage]
- [ ] CHK003 - Are degradation requirements defined for high-load scenarios? [Edge Case, Gap]
```

### Security Requirements Quality (security.md)
```markdown
- [ ] CHK001 - Are authentication requirements specified for all protected resources? [Coverage]
- [ ] CHK002 - Are data protection requirements defined for sensitive information? [Completeness]
- [ ] CHK003 - Is the threat model documented and requirements aligned to it? [Traceability]
```

---

## Quality Thresholds

- **Traceability Minimum**: ≥80% of items MUST include at least one traceability reference
- **Content Cap**: If raw candidate items > 40, prioritize by risk/impact
- **Near-duplicate Merge**: Merge items checking the same requirement aspect

---

## Integration Points

### Clarification Process (Pre-Checklist)
Generate up to THREE contextual clarifying questions:
1. Extract signals from spec/plan/tasks
2. Cluster signals into candidate focus areas (max 4)
3. Identify probable audience & timing
4. Detect missing dimensions

### Question Archetypes
- Scope refinement
- Risk prioritization
- Depth calibration
- Audience framing
- Boundary exclusion
- Scenario class gap

---

## Implementation Notes for cc-devflow

Key adaptations for /flow-checklist:

1. **Simplify Clarification**: Since cc-devflow has /flow-clarify, reduce pre-checklist questions
2. **Gate Integration**: Add completion check to /flow-epic entry gate
3. **YAML Configuration**: Store dimension definitions and thresholds in quality-rules.yml
4. **Agent Design**: checklist-agent should be ~250 lines (spec-kit command is ~300 lines)
5. **Output Structure**: Follow spec-kit's `checklists/[type].md` pattern
