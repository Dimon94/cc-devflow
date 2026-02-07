# devflow/spec/ - Unified Project Specifications

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

This directory consolidates all **project-level specifications** (guidelines, standards, conventions).
Previously scattered across `.claude/guides/` and `devflow/STYLE.md`.

## Structure

```
spec/
├── README.md                       # This file
├── frontend/                       # Frontend specifications
│   ├── index.md                    # Entry point
│   ├── directory-structure.md     # Directory organization
│   ├── component-guidelines.md    # Component design patterns
│   ├── state-management.md        # State management conventions
│   ├── quality-guidelines.md      # Code quality standards
│   └── type-safety.md             # TypeScript type patterns
├── backend/                        # Backend specifications
│   ├── index.md                    # Entry point
│   ├── directory-structure.md     # Directory organization
│   ├── database-guidelines.md     # ORM and database patterns
│   ├── error-handling.md          # Error handling strategies
│   └── logging-guidelines.md      # Logging conventions
├── shared/                         # Cross-cutting specifications
│   ├── index.md                    # Entry point
│   ├── typescript.md              # TypeScript conventions
│   ├── git.md                     # Git workflow
│   └── code-quality.md            # Quality standards
└── guides/                         # Thinking guides
    ├── index.md                    # Entry point with triggers
    ├── cross-layer-thinking.md    # Cross-layer development
    └── code-reuse-thinking.md     # Code reuse patterns
```

## Integration

- **Context Injection (RM-015)**: Agents load relevant specs via `context/*.jsonl`
- **Guidelines Generator**: `/core:guidelines` outputs to this directory
- **Style Guide**: `/core:style` outputs to `frontend/style.md`

## Usage in context.jsonl

```jsonl
{"file": "devflow/spec/frontend/index.md", "reason": "Frontend conventions"}
{"file": "devflow/spec/backend/index.md", "reason": "Backend conventions"}
{"file": "devflow/spec/guides/cross-layer-thinking.md", "reason": "Cross-layer feature"}
```

## Thinking Guides

The `guides/` directory contains **thinking guides** that help developers ask the right questions before coding:

| Guide | Trigger |
|-------|---------|
| Cross-Layer Thinking | Feature spans 3+ layers |
| Code Reuse Thinking | Creating new utility/constant |

---

**Created**: 2026-02-06
**Updated**: 2026-02-07
**Version**: v3.0.0 (OpenSpec × Trellis)
