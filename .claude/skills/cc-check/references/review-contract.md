# Review Contract

`cc-check` verifies fresh reality. It does not read or write process files.

## Minimum Review Facts

Use current evidence:

- current Git diff
- `task.md`
- PR diff/body when present
- command output
- code and test inspection
- cc-review findings from the current conversation when available

## Review Layers

- Task completion: every checked task in `task.md` has matching evidence.
- Requirement diff: current diff matches approved scope and has no unexplained extra touch.
- Critical pass: check data safety, injection, trust boundary, time/window safety, errors swallowed, and silent data loss when relevant.
- Test quality: Red/Green proof, public seam, mock boundary, fixture honesty, and no test-only production API.
- Docs/UI/operator: affected surfaces have evidence or explicit skip reason.
- Freshness: review facts cover current HEAD, not an earlier diff.

## Gate Rules

- Unfixed important findings route to `cc-do`.
- Missing behavior evidence is `blocked`, not `pass`.
- Stale command output is ignored.
- Review facts belong in the response, PR brief, or Git commits, not in process files.
- Low-confidence concerns are warnings unless evidence makes them blocking.
- Scope or design invalidation routes to `cc-plan`; disproven root cause routes to `cc-investigate`.
