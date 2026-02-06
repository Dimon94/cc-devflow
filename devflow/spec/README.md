# devflow/spec/ - Unified Project Specifications

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

This directory consolidates all **project-level specifications** (guidelines, standards, conventions).
Previously scattered across `.claude/guides/` and `devflow/STYLE.md`.

## Structure

```
spec/
├── README.md           # This file
├── frontend/           # Frontend specifications
│   ├── index.md        # Entry point
│   ├── style.md        # Visual design (migrated from STYLE.md)
│   └── components.md   # Component conventions
├── backend/            # Backend specifications
│   ├── index.md        # Entry point
│   ├── api.md          # API design conventions
│   └── database.md     # Database conventions
├── shared/             # Cross-cutting specifications
│   ├── index.md        # Entry point
│   ├── naming.md       # Naming conventions
│   └── security.md     # Security standards
└── guides/             # Technical guides
    ├── index.md        # Entry point
    └── ...             # Migrated from .claude/guides/
```

## Integration

- **Context Injection (RM-015)**: Agents load relevant specs via `context/*.jsonl`
- **Guidelines Generator**: `/core-guidelines` outputs to this directory
- **Style Guide**: `/core-style` outputs to `frontend/style.md`

## Migration Path

```
.claude/guides/technical-guides/* → devflow/spec/shared/
devflow/STYLE.md                  → devflow/spec/frontend/style.md
```

---

**Created**: 2026-02-06
**Version**: v3.0.0 (OpenSpec × Trellis)
