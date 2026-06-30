# CC-Research Playbook

## Local Grounding Gate

Do not consult prior research or external sources until these facts are known:

- current goal
- project root
- branch, commit, and dirty state, or explicit non-git status
- files, docs, tests, ADRs, issues, or task truth inspected
- current unknowns that local evidence cannot answer

Use the smallest local read set that can answer the question. If grounding is
missing, ask one question or stop with the missing evidence.

## Project Evidence First

Research in this order:

1. current project goal and user constraints
2. current code, docs, tests, ADRs, task truth, and recent Git history
3. `devflow/research/index.jsonl`, then only matching entries
4. external official docs, source, release notes, papers, standards, or product
   references when the project cannot answer the question

Prior research is a lead. Reuse a prior conclusion only after checking that the
referenced code, docs, source links, and assumptions still match the current
project. Otherwise mark it as historical reference.

## Source Plan

Pick sources by question type:

| Question | First sources |
| --- | --- |
| project design | repo docs, ADRs, task.md, code, tests |
| API or dependency behavior | official docs, source, release notes, current repo usage |
| bug diagnosis context | failing loop, logs, current code, dependency docs |
| review background | standards, current diff, tests, official docs |
| product or competitor reference | official product pages, docs, pricing, public examples |

Do not cite unread files or links. Put every cited material in the document's
`参考材料` table.

## Durable Output

Write only when the result should be reused later or a workflow skill approved a
research write. Use:

```text
devflow/research/index.jsonl
devflow/research/entries/<date>-<slug>.md
```

The entry body uses `assets/RESEARCH_TEMPLATE.md`. The index line uses
`assets/RESEARCH_INDEX_TEMPLATE.jsonl`; append one valid JSON object per line.
Keep `summary_zh` to one or two Chinese sentences.

## Evidence Grade

- `高`: current project evidence and current authoritative external evidence agree.
- `中`: current project evidence supports the recommendation, but historical or
  external uncertainty remains.
- `低`: only leads exist; do not use as an action basis.

## Workflow Calls

| Caller | Rule |
| --- | --- |
| `cc-plan` | Use only for real Evidence Gaps before freezing scope, design, or tasks. Write only the research reference and decision implication into `task.md`. |
| `cc-diagnose` | Use only for external dependency, API, platform, or prior-research uncertainty that blocks root-cause work. |
| `cc-review` | Use for standards, ecosystem, API, product, security, or performance background; findings must still cite current code, diff, tests, or behavior. |
| `cc-do` | Do not start by default. If execution hits a blocking Evidence Gap, record it in `task.md` and reroute instead of expanding scope. |
| `cc-check` | Consume existing references only; reroute if new research is needed. |
| `cc-act` | Consume existing references only; reroute if new research is needed. |

## Context Return

Return only:

- research file path
- one-sentence Chinese TL;DR
- recommendation plus Evidence Grade
- remaining evidence gaps

Do not paste the full research body into the main thread unless the user asks or
the caller explicitly needs it.
