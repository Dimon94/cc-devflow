# devflow/specs/ - Single Source of Truth (SSOT)

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

This directory serves as the **Single Source of Truth** for all project specifications.
Delta specs from individual requirements are synchronized here after release.

## Structure

```
specs/
├── README.md           # This file
├── modules/            # Module-level specifications
│   └── {module}/       # e.g., auth/, payment/, user/
│       └── spec.md     # Consolidated module spec
├── api/                # API specifications
│   └── {service}.yaml  # OpenAPI specs
└── data/               # Data model specifications
    └── {entity}.md     # Entity definitions
```

## Workflow

1. **During Development**: Changes are tracked in `requirements/{REQ}/delta-specs/`
2. **On Release**: `/flow-delta sync` merges delta-specs into this SSOT
3. **Archive**: Original delta-specs are archived to `devflow/archive/`

## Integration

- **Context Injection (RM-015)**: Agents reference specs from this directory
- **Delta Specs (RM-017)**: `/flow-delta sync` updates this directory
- **Consistency Check**: `/flow-verify` validates SSOT integrity

---

**Created**: 2026-02-06
**Version**: v3.0.0 (OpenSpec × Trellis)
