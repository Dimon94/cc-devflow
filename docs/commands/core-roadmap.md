# `/core:roadmap` - Generate Product Roadmap

[中文文档](./core-roadmap.zh-CN.md) | [English](./core-roadmap.md)

---

## Overview

`/core:roadmap` builds a project-level roadmap through a 6-stage dialogue, then generates durable planning artifacts under `devflow/`.

This command now uses an LLM-native planning model:
- `llm_effort` is the primary scheduling unit
- `human_effort` stays as a baseline for risk and communication
- `completeness` means scope integrity, not progress
- `scope_shape` forces each candidate to be classified as `lake` or `ocean`
- every roadmap item must keep item-level `Acceptance Criteria`

## Syntax

```bash
/core:roadmap
/core:roadmap --regenerate
/core:roadmap --resume
```

## When To Use It

Recommended:
- define the next quarter of product direction
- reorder or rewrite roadmap priorities
- convert fuzzy ambition into milestone-ready work

Not recommended:
- executing one concrete requirement; use `/flow:init` for that path

## Planning Model

### Key Fields

| Field | Meaning | Role |
|------|---------|------|
| `llm_effort` | LLM-native delivery effort | Primary scheduling truth |
| `human_effort` | Traditional team baseline | Risk calibration only |
| `completeness_score` | Whether the item is scoped as a whole deliverable | Scope integrity, not progress |
| `scope_shape` | `lake` or `ocean` | Forces correct decomposition |
| `acceptance_criteria` | 2-3 observable completion checks | Item-level definition of done |

### Lake vs Ocean

- `lake`: can be completed as a whole within one planning cycle
- `ocean`: too large for one item and must be decomposed before scheduling

## Execution Flow

The command runs as 6 dialogue stages plus system stages for context detection and document generation.

```text
System Stage 0: detect context, current quarter, and baseline velocity
Stage 1: capture vision statement
Stage 2: analyze existing requirements and extension directions
Stage 3: brainstorm roadmap candidates with effort, completeness, scope shape, and acceptance criteria
Stage 4: map dependencies
Stage 5: assign timeline by quarter
Stage 6: final confirmation
System Stage 7-8: generate ROADMAP.md, BACKLOG.md, ARCHITECTURE.md and report results
```

## Output Files

- `devflow/ROADMAP.md`
  - vision statement
  - milestone overview and quarterly plans
  - dependency graph
  - velocity tracking
  - completeness / lake-ocean review
  - item-level acceptance criteria

- `devflow/BACKLOG.md`
  - priority-sorted roadmap items
  - business value, effort, dependencies
  - completeness and scope-shape decisions
  - item-level acceptance criteria

- `devflow/ARCHITECTURE.md`
  - diagrams aligned with the roadmap decomposition

## Reading Guide

- `Acceptance Criteria` and `Completeness` are not substitutes.
- `Acceptance Criteria` answer: "How do we know this item is done?"
- `Completeness` answers: "Is this item defined as a full deliverable or just a shortcut shard?"

## Related Commands

- [`/flow:init`](./flow-init.md) - turn one roadmap item into a formal requirement
- [`/core:architecture`](./core-architecture.md) - generate architecture from roadmap context

## Deep Reading

- [ROADMAP_TEMPLATE](../../.claude/docs/templates/ROADMAP_TEMPLATE.md)
- [BACKLOG_TEMPLATE](../../.claude/docs/templates/BACKLOG_TEMPLATE.md)
- [ROADMAP_DIALOGUE_TEMPLATE](../../.claude/docs/templates/ROADMAP_DIALOGUE_TEMPLATE.md)
