# Project Postmortem Index

## How To Search

Start here, then open only the incident files whose tags or failure class match
the current work.

```bash
rg -n "<capability|module|error|failure-class|model-risk>" devflow/postmortems
```

## Latest Entries

| Date | Change | Severity | Tags | One-line lesson | Incident |
| --- | --- | --- | --- | --- | --- |
|  |  | low / medium / high |  |  | `incidents/<date>-<change-key>.md` |

## Recurring Patterns

| Pattern | Count | Last seen | Principle |
| --- | ---: | --- | --- |
|  | 0 |  | `principles.md#` |

## Deep-Dive Rules

- Open `principles.md` when the current work involves architecture choices,
  test-seam design, model judgment, reliability, release hygiene, or recurring
  review findings.
- Open a specific incident file when the current task touches the same module,
  failure class, or Git/release workflow.
