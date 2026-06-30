---
name: cc-research
version: 1.0.0
description: >-
  cc-devflow project-grounded research capability skill. Use as a sidecar when
  the user asks for /research, project research, evidence gathering, or when a
  workflow skill has a real Evidence Gap that current project code, docs, tests,
  prior research, or authoritative sources must resolve before a decision.
triggers:
  - /research
  - 项目调研
  - 调研这个问题
  - 先做研究
  - cc-research
  - research this
reads:
  - PLAYBOOK.md
  - assets/RESEARCH_TEMPLATE.md
  - assets/RESEARCH_INDEX_TEMPLATE.jsonl
writes:
  - path: devflow/research/index.jsonl
    durability: durable
    required: false
    when: standalone research or workflow-approved research writes a new entry
  - path: devflow/research/entries/<date>-<slug>.md
    durability: durable
    required: false
    when: standalone research or workflow-approved research writes a new entry
---

# CC-Research

`cc-research` is a capability skill for project-grounded sidecar research. It
can be invoked directly by the user or consulted by workflow skills, but it is
not a PDCA stage and does not change the `cc-plan -> cc-do -> cc-check ->
cc-act` chain.

It owns `devflow/research/`. Other skills must not write research files by
hand; they either consume existing research references or route through this
skill.

## Quick Start

1. Read `PLAYBOOK.md` and the templates.
2. Pass the Local Grounding Gate before old research or external sources.
3. Apply Project Evidence First: current repo evidence before prior research,
   prior research before external sources.
4. Treat prior research as leads until the Prior Research Freshness Check
   revalidates current code, docs, and source state.
5. Write a Chinese Research Evidence Document only when research must persist.
6. Append one compact metadata line to `devflow/research/index.jsonl`.
7. Return only the Context Return: path, one-line TL;DR, recommendation with
   Evidence Grade, and remaining evidence gaps.

## Modes

| Mode | Use |
| --- | --- |
| `standalone` | The user explicitly asks for `/research` or project research. |
| `consult` | A workflow skill needs existing research or a short research answer, without writing a new entry. |
| `write` | A workflow skill or standalone run has a real Evidence Gap that should persist in `devflow/research/`. |

## Hard Rules

- Research output is Chinese.
- The research document starts with reference materials.
- Every important recommendation has an Evidence Grade: `高`, `中`, or `低`.
- `index.jsonl` stores searchable metadata only, not recommendation body text.
- The full research body stays out of the main thread unless explicitly needed.
- Research is not an implementation plan, not a task breakdown, not a commit
  plan, not a roadmap, and not a TODO list.
- `cc-check` and `cc-act` do not start new research. If new research is
  required there, reroute to `cc-plan` or `cc-diagnose`.

## Exit Criteria

- Local Grounding Gate is passed or the run stops with the missing grounding.
- Relevant prior research was searched through `devflow/research/index.jsonl`
  when present.
- Stale or unverified prior research is labeled as historical reference.
- New durable output, when written, uses `assets/RESEARCH_TEMPLATE.md` and
  updates `devflow/research/index.jsonl`.
- The main thread receives only the Context Return.
