# CC-Check Playbook

## Visible State Machine

`cc-do -> cc-check -> cc-act | cc-do | cc-investigate | cc-plan`

## Core Rules

1. Fresh evidence or no pass.
2. Read `task.md`, current diff, and the smallest relevant source files.
3. Re-run commands; do not inherit green claims from chat.
4. Do not generate process files.
5. Separate missing evidence from proven failure.
6. Map every claim to evidence before verdict.
7. Review test quality for behavior changes and bugfixes.
8. Classify failure ownership before routing.
9. Commit the completed Check stage when the environment finishes.

## Role

`cc-check` is the PDCA / IDCA verification node. It turns "should be done" into
"fresh evidence proves or blocks completion".

It writes no process files. Verification facts belong in the current response,
PR files, and Git commits.

## Verification Loop

1. Read `task.md` and current diff.
2. Re-run the smallest trustworthy gate: tests, typecheck, lint, build, browser
   check, CLI smoke, or domain-specific verifier.
3. Map each explicit requirement to proof.
4. Review test quality when behavior changed: red/green proof, public seam,
   confidence-per-minute proof value, suite layer/runtime, honest fixtures,
   low-value tests avoided, and no private implementation assertions.
5. Classify relevant Failure Ledger entries, including review escape
   candidates, as `confirmed-lesson`, `noise`, or `unresolved-risk`.
6. Return `pass`, `fail`, or `blocked`.
7. Commit the stage when this PDCA/IDCA environment completes and repo policy
   allows it.

## Verification Phases

Use `references/gate-contract.md` for detailed phase rules.

1. Reset Contract: read `task.md`, current diff, relevant code/tests, and PR
   text when present.
2. Re-run Reality: rerun trustworthy gates; record command, exit code, key
   output, and skip/blocked reason.
3. Check Boundaries: check runtime, task completion, requirement diff, claim
   evidence, QA/test quality, review freshness, and docs/UI/operator impact.
4. Freeze Verdict: output only `pass`, `fail`, or `blocked`, then route.

If evidence is stale, boundaries conflict, or the conclusion cannot honestly
hold, reset or reroute instead of forcing `pass`.

## Evidence Layers

`cc-check` is not just checking whether tests are green. Select the layers
needed by risk and name skip reasons for uncovered layers:

1. Runtime: test, lint, typecheck, build, script gate.
2. Task Completion: `task.md` completion matches current diff.
3. Requirement Diff: scope is fulfilled without creep or unintended file touch.
4. Claim Evidence: every pass claim has command, exit code, observation, proof.
5. QA Test Quality: red/green, public seam, confidence-per-minute proof value,
   suite layer/runtime, mock boundary, fixture honesty, low-value tests avoided,
   and no test-only API smell.
6. Behavior Evidence: user-visible expected/actual/reproduction path has a
   current feedback loop.
7. Review Freshness: review covers current HEAD or risk is explicit.
8. Failure Ownership: branch, baseline, environment, external, or unknown.
9. Docs / Browser / Operator: affected surfaces have evidence or skip reason.

## Failure Ledger Review

Use `references/gate-contract.md` for classification. Do not send every failure
to postmortem. Only `confirmed-lesson` with `Keep for postmortem: yes` becomes
`cc-act` closeout input.

## Confidence Per Minute

For behavior changes and bugfixes, name:

- suite layer: unit, contract/schema, integration, e2e/browser, visual, smoke,
  migration/data, release, or domain verifier
- command/runtime: focused command run now and whether runtime is acceptable
- proof value: the bug, contract, boundary, migration, or user-visible failure
  this suite would catch
- fixture/mock boundary: real contract fields and external mocks used
- low-value tests avoided or repaired: broad snapshots, duplicate happy paths,
  no-op smoke tests, brittle implementation assertions, overmocked internals

If a green suite does not answer the required behavior question, route to
`cc-do` for a better test or `cc-plan` when the planned seam is wrong. If the
right proof requires missing credentials, services, data, or UI access, verdict
is `blocked`.

## Failure Ownership

Classify every failure:

- `branch`: current branch introduced it or it is related to the current change
- `baseline`: base branch or history proves it already existed
- `environment`: dependency, permission, service, secret, or platform missing
- `external`: third-party or external system failed
- `unknown`: ownership unclear; cannot support `pass`

Every failure needs error name, evidence, owner, and rescue action.

## Verdict Shape

- `pass`: all required behavior and quality claims have fresh evidence.
- `fail`: a command, review, or behavior check proves a defect.
- `blocked`: required evidence, dependency, auth, input, or environment is unavailable.

## Required Output

Short response only:

- Verdict: `pass` / `fail` / `blocked`
- Evidence: commands, exit status, and proven claims
- Review: clean, findings remain, or not reviewed
- QA: feedback loop and test quality where applicable
- Diff: scope match or drift
- Route: `cc-act` / `cc-do` / `cc-investigate` / `cc-plan` / `stop`

Do not write process files.

## Reset Signals

Stop and rebuild the verdict when:

- output is inherited from chat
- command output is stale
- test is green but never proved Red
- behavior is tested through private implementation only
- failure owner is unknown
- current diff does not match `task.md`
- review finding is unresolved or stale
