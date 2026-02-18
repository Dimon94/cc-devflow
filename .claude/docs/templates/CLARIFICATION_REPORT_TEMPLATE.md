# Clarification Report: {{REQ_ID}}

**Session ID**: {{SESSION_ID}}
**Date**: {{DATE}}
**Duration**: {{SCAN_DURATION}}s (scan) + interactive Q&A
**Status**: {{STATUS}}

---

## Metadata

| Field | Value |
|-------|-------|
| Requirement | {{REQ_ID}} |
| Session ID | {{SESSION_ID}} |
| Questions | {{QUESTIONS_ANSWERED}} / {{QUESTIONS_TOTAL}} |
| Generated | {{GENERATED_AT}} |

---

## Coverage Summary

**Legend**: ✅ Clear | ⚠️ Partial | ❌ Missing | 🔄 Resolved | ⏭️ Deferred

| Category | Status | Issues | Resolution |
|----------|--------|--------|------------|
| Functional Scope | {{DIM_1_STATUS}} | {{DIM_1_ISSUES}} | {{DIM_1_RESOLUTION}} |
| Data Model | {{DIM_2_STATUS}} | {{DIM_2_ISSUES}} | {{DIM_2_RESOLUTION}} |
| UX Flow | {{DIM_3_STATUS}} | {{DIM_3_ISSUES}} | {{DIM_3_RESOLUTION}} |
| Non-Functional Quality | {{DIM_4_STATUS}} | {{DIM_4_ISSUES}} | {{DIM_4_RESOLUTION}} |
| Integration & Dependencies | {{DIM_5_STATUS}} | {{DIM_5_ISSUES}} | {{DIM_5_RESOLUTION}} |
| Edge Cases | {{DIM_6_STATUS}} | {{DIM_6_ISSUES}} | {{DIM_6_RESOLUTION}} |
| Constraints & Tradeoffs | {{DIM_7_STATUS}} | {{DIM_7_ISSUES}} | {{DIM_7_RESOLUTION}} |
| Terminology | {{DIM_8_STATUS}} | {{DIM_8_ISSUES}} | {{DIM_8_RESOLUTION}} |
| Completion Signals | {{DIM_9_STATUS}} | {{DIM_9_ISSUES}} | {{DIM_9_RESOLUTION}} |
| Misc & Placeholders | {{DIM_10_STATUS}} | {{DIM_10_ISSUES}} | {{DIM_10_RESOLUTION}} |
| Security & Privacy | {{DIM_11_STATUS}} | {{DIM_11_ISSUES}} | {{DIM_11_RESOLUTION}} |

**Summary**:
- ✅ Clear: {{CLEAR_COUNT}} categories
- 🔄 Resolved: {{RESOLVED_COUNT}} categories
- ⏭️ Deferred: {{DEFERRED_COUNT}} categories
- ❌ Outstanding: {{OUTSTANDING_COUNT}} categories

---

## Scan Details

### High-Priority Issues (Priority ≥ 50)

{{#HIGH_PRIORITY_ISSUES}}
| Issue ID | Dimension | Description | Impact | Uncertainty | Priority |
|----------|-----------|-------------|--------|-------------|----------|
{{#ISSUES}}
| {{ISSUE_ID}} | {{DIM_NAME}} | {{DESCRIPTION}} | {{IMPACT}}/10 | {{UNCERTAINTY}}/10 | {{PRIORITY}} |
{{/ISSUES}}
{{/HIGH_PRIORITY_ISSUES}}

{{^HIGH_PRIORITY_ISSUES}}
No high-priority issues detected.
{{/HIGH_PRIORITY_ISSUES}}

---

## Clarification Session

### Session {{DATE}}

{{#QUESTIONS}}
#### {{QUESTION_ID}}: {{DIM_NAME}}

**Question**: {{QUESTION_TEXT}}

**Type**: {{QUESTION_TYPE}}

{{#IS_MULTIPLE_CHOICE}}
| Option | Description |
|--------|-------------|
{{#OPTIONS}}
| **{{OPTION_ID}}** | {{OPTION_TEXT}} - {{OPTION_DESC}} |
{{/OPTIONS}}

**Recommended**: {{RECOMMENDED_OPTION}} ⭐
> {{RECOMMENDED_RATIONALE}}
{{/IS_MULTIPLE_CHOICE}}

{{#IS_SHORT_ANSWER}}
**Format**: Short answer (≤5 words)
**Suggested**: {{SUGGESTED_VALUE}}
{{/IS_SHORT_ANSWER}}

**User Answer**: {{ANSWER}}

**Rationale**: {{ANSWER_RATIONALE}}

**Impact**: {{ANSWER_IMPACT}}

- Q: {{QUESTION_TEXT}} → A: {{ANSWER}}

---

{{/QUESTIONS}}

{{^QUESTIONS}}
No questions generated - research.md appears sufficiently clear.
{{/QUESTIONS}}

---

## Integration Summary

### Sections Updated

{{#UPDATED_SECTIONS}}
| Section | Update Type | Description |
|---------|-------------|-------------|
{{#SECTIONS}}
| {{SECTION_NAME}} | {{UPDATE_TYPE}} | {{UPDATE_DESC}} |
{{/SECTIONS}}
{{/UPDATED_SECTIONS}}

{{^UPDATED_SECTIONS}}
No sections updated (clarification-only session or no material changes required).
{{/UPDATED_SECTIONS}}

---

## Deferred Items

{{#DEFERRED_ITEMS}}
| Category | Reason | Recommendation |
|----------|--------|----------------|
{{#ITEMS}}
| {{CATEGORY}} | {{REASON}} | {{RECOMMENDATION}} |
{{/ITEMS}}
{{/DEFERRED_ITEMS}}

{{^DEFERRED_ITEMS}}
No items deferred.
{{/DEFERRED_ITEMS}}

---

## Outstanding Items

{{#OUTSTANDING_ITEMS}}
> ⚠️ The following items remain unresolved but are low-impact:

{{#ITEMS}}
- **{{CATEGORY}}**: {{DESCRIPTION}}
{{/ITEMS}}
{{/OUTSTANDING_ITEMS}}

{{^OUTSTANDING_ITEMS}}
No outstanding items.
{{/OUTSTANDING_ITEMS}}

---

## Next Steps

{{#ALL_RESOLVED}}
✅ **Clarification complete**. All critical ambiguities have been resolved.

Recommended next command: `/flow:spec {{REQ_ID}}`
{{/ALL_RESOLVED}}

{{#HAS_OUTSTANDING}}
⚠️ **Clarification partially complete**. Some low-impact items remain.

Options:
1. Proceed with `/flow:spec {{REQ_ID}}` (acceptable risk)
2. Re-run `/flow:spec {{REQ_ID}} --overwrite` after planning phase
{{/HAS_OUTSTANDING}}

{{#HAS_DEFERRED}}
⏭️ **Items deferred to planning phase**:
{{#DEFERRED_SUMMARY}}
- {{ITEM}}
{{/DEFERRED_SUMMARY}}

These will be addressed during `/flow:spec` task planning or `/flow:dev` implementation.
{{/HAS_DEFERRED}}

{{#NO_QUESTIONS}}
✅ **No critical ambiguities detected**. research.md is sufficiently specified.

Recommended next command: `/flow:spec {{REQ_ID}}`
{{/NO_QUESTIONS}}

---

## Validation Checklist

- [ ] CLR-001 All Q&A pairs recorded in session section
- [ ] CLR-002 No duplicate questions asked
- [ ] CLR-003 Questions ≤ 5 (actual: {{QUESTIONS_COUNT}})
- [ ] CLR-004 Coverage summary complete for all 11 dimensions
- [ ] CLR-005 No contradictory statements remain in research.md
- [ ] CLR-006 Terminology consistent across updated sections

---

**Generated by**: clarify-analyst agent
**Template Version**: 1.0.0
**Based on**: spec-kit /speckit.clarify pattern
