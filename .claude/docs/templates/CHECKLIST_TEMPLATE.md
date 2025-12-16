# {{TYPE}} Checklist: {{REQ_ID}}

**Purpose**: {{TYPE_DESCRIPTION}}
**Created**: {{TIMESTAMP}}
**PRD Reference**: PRD.md
**Quality Dimensions**: Completeness, Clarity, Consistency, Measurability, Coverage

---

## Requirement Completeness

- [ ] CHK001 - Are all {{TYPE}} requirements documented in PRD? [Completeness, Spec §FR-XXX]
- [ ] CHK002 - Are success criteria defined for {{TYPE}} features? [Completeness]
- [ ] CHK003 - Are error handling scenarios specified? [Completeness, Gap]

## Requirement Clarity

- [ ] CHK004 - Is '{{VAGUE_TERM}}' quantified with specific metrics? [Clarity, Spec §NFR-XXX]
- [ ] CHK005 - Are {{TYPE}} behaviors explicitly specified? [Clarity]
- [ ] CHK006 - Are technical constraints clearly documented? [Clarity]

## Requirement Consistency

- [ ] CHK007 - Are {{TYPE}} requirements consistent across sections? [Consistency]
- [ ] CHK008 - Are terminology and naming conventions consistent? [Consistency]
- [ ] CHK009 - Are data formats consistent between requirements? [Consistency]

## Acceptance Criteria Quality

- [ ] CHK010 - Can {{TYPE}} requirements be objectively verified? [Measurability]
- [ ] CHK011 - Are acceptance criteria in Given-When-Then format? [Measurability]
- [ ] CHK012 - Are performance metrics quantified with specific numbers? [Measurability]

## Scenario Coverage

- [ ] CHK013 - Are edge cases defined for {{TYPE}} scenarios? [Coverage, Gap]
- [ ] CHK014 - Are error states and recovery paths specified? [Coverage]
- [ ] CHK015 - Are boundary conditions addressed? [Coverage]

---

## Notes

- Check items off as completed: change `[ ]` to `[x]`
- Items are numbered sequentially (CHK001-CHKnnn)
- Quality dimensions: [Completeness], [Clarity], [Consistency], [Measurability], [Coverage]
- References:
  - `[Spec §X.Y]` - Links to existing PRD requirement
  - `[Gap]` - Missing requirement identified
  - `[Ambiguity]` - Unclear requirement needs clarification
  - `[Conflict]` - Requirement conflicts with another
  - `[Assumption]` - Needs validation
