# `/core-style` - Generate Project Design Style Guide

[中文文档](./core-style.zh-CN.md) | [English](./core-style.md)

Generate or update `devflow/STYLE.md` as project-level design SSOT.

## Syntax

```bash
/core-style
/core-style --update
```

## Positioning

`/core-style` is a project command (same level as `/core-roadmap`) and feeds the delivery mainline:

- `/flow:spec`: reads STYLE guidance for UI/UX acceptance criteria.
- `/flow:dev`: enforces STYLE tokens and component conventions in implementation.
- `/flow:verify`: checks style consistency as part of quality gates.

## Execution Flow

1. Detect mode (`create` or `update`).
2. Collect style inputs:
- new project: use reference design URL/screenshot/HTML+CSS.
- existing project: mine tokens/components from current code.
3. Produce `devflow/research/style_analysis.md`.
4. Generate `devflow/STYLE.md` from `STYLE_TEMPLATE.md`.
5. Validate structure + constitution constraints.

## Outputs

```text
devflow/STYLE.md
devflow/research/style_analysis.md
devflow/project_status.json (updated)
EXECUTION_LOG.md (updated)
```

## Minimal Post-Style Workflow

```bash
/flow:init "REQ-123|Feature"
/flow:spec "REQ-123"
/flow:dev "REQ-123"
/flow:verify "REQ-123" --strict
```

## Notes

- STYLE is a living SSOT; prefer `--update` instead of ad-hoc per-task overrides.
- Keep style decisions semantic (tokens/components), not page-specific patches.
