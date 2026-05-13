# Review Contract

`cc-check` verifies fresh reality. It does not read or write review process files.

## Minimum Review Facts

Use current evidence:

- current Git diff
- `task.md`
- PR diff/body when present
- command output
- code and test inspection
- cc-review findings from the current conversation when available

## Gate Rules

- Unfixed important findings route to `cc-do`.
- Missing behavior evidence is `blocked`, not `pass`.
- Stale command output is ignored.
- Review facts belong in the response, PR brief, or Git commits, not in JSON/JSONL/Markdown process files.
