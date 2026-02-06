# _shared/ - Shared Template Components

> L2 | 父级: `.claude/docs/templates/CLAUDE.md`

## Purpose

Reusable template components extracted from PRD/EPIC/TECH_DESIGN/UI_PROTOTYPE templates to reduce duplication and ensure consistency.

## Members

| File | Purpose | Lines | Used By |
|------|---------|-------|---------|
| `CONSTITUTION_CHECK.md` | Constitution compliance check section | ~150 | PRD, EPIC, TECH_DESIGN |
| `VALIDATION_CHECKLIST.md` | Validation checklist patterns | ~100 | All templates |
| `YAML_FRONTMATTER.md` | YAML frontmatter patterns | ~50 | All templates |

## Usage Pattern

Templates reference these components via include syntax:
```markdown
{{INCLUDE: _shared/CONSTITUTION_CHECK.md}}
{{INCLUDE: _shared/VALIDATION_CHECKLIST.md#prd}}
```

Or copy relevant sections based on document type.

## Design Principles

1. **DRY**: Extract repeated content once, reference everywhere
2. **Consistency**: Single source of truth for Constitution checks
3. **Modularity**: Each component is self-contained
4. **Versioned**: Components track Constitution version

---

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
