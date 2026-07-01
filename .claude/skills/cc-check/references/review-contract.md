# Review Contract

`cc-check` verifies fresh reality and owns final `cc-review` convergence. It
does not read or write process files.

## Minimum Review Facts

Use current evidence:

- current Git diff
- `task.md`
- PR diff/body when present
- command output
- code and test inspection
- cc-review findings from the current conversation when available
- subAgent `cc-review` findings launched for this check

## Review Layers

- Task completion: every checked task in `task.md` has matching evidence.
- Requirement diff: current diff matches approved scope and has no unexplained extra touch.
- Critical pass: check data safety, injection, trust boundary, time/window safety, errors swallowed, and silent data loss when relevant.
- Test quality: Red/Green proof, public seam, confidence-per-minute proof value, suite layer/runtime, mock boundary, fixture honesty, low-value tests avoided, and no test-only production API.
- Docs/UI/operator: affected surfaces have evidence or explicit skip reason.
- Freshness: review facts cover current HEAD, not an earlier diff.
- Convergence: repeated subAgent `cc-review` finds no P0/P1/P2 issue.

## Gate Rules

- Unfixed important findings route to `cc-do`.
- Any P0/P1/P2 finding blocks `pass`; repair or reroute, then review again.
- If review subAgents cannot be launched or their required evidence is missing,
  verdict is `blocked`.
- In Codex App, review subAgents inherit the shared child-thread resource
  contract from `cc-dev/references/codex-thread-orchestration.md`: launch
  `cc-review` threads with host-default resources unless the user explicitly
  requested a supported resource, and block instead of silently downgrading when
  the platform cannot honor that request.
- Missing behavior evidence is `blocked`, not `pass`.
- Green tests with no meaningful proof value route to `cc-do`; wrong planned seams route to `cc-plan`.
- Stale command output is ignored.
- Review facts belong in the response, PR brief, or Git commits, not in process files.
- Low-confidence concerns are warnings unless evidence makes them blocking.
- Scope or design invalidation routes to `cc-plan`; disproven root cause routes to `cc-diagnose`.
