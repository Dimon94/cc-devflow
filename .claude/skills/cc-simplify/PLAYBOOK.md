# CC-Simplify Playbook

## Purpose

`cc-simplify` is the ship-before-check cleanup gate. It is not opportunistic
refactoring. It removes confirmed smells introduced or amplified by the current
diff, then returns the work to fresh verification.

## Resource Resolution

`SKILL.md` is the entrypoint. `PLAYBOOK.md` and `references/` are loaded
relative to the current `SKILL.md` directory. Do not resolve resources from the
shell cwd.

## Phase 1: Identify The Change

1. Prefer current Git evidence:
   - staged diff: run `git diff --cached` and `git diff`
   - unstaged diff: run `git diff HEAD`
   - no diff: review the files named by the user or edited in this turn
2. Freeze the cleanup boundary:
   - changed files
   - affected modules
   - stack signals: `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`
   - test signals: `jest`, `vitest`, `pytest`, `go test`, etc.
   - scope flags: API, auth, backend, frontend, migration, docs, release
   - related `task.md`, capability specs, and already-run verification
3. If the diff spans unrelated modules, group by module; do not turn cleanup
   into a repo-wide sweep.
4. Historical debt enters scope only when it blocks delivery or this diff
   expands it.

## Phase 2: Read-Only Reviewer Dispatch

`cc-simplify` itself is explicit authorization to use read-only reviewer agents
when the host supports them. Do not ask the user to re-authorize subagents.

Use `references/reviewer-swarm.md` for dispatch rules, prompt shape, default
reviewers, conditional specialists, and fallback behavior.

Main thread responsibilities never move to subagents:

- define scope packet
- verify each finding
- choose fix / ask / reroute / skip
- edit files
- run fresh verification

If no subagent tool exists, run the same reviewer dimensions in the main thread
and report `Agents used: no (subagent tool unavailable)`.

## Phase 3: Triage Findings

Use `references/finding-triage.md` to parse finding lines, drop weak output,
dedupe fingerprints, apply confidence gates, and decide whether each finding is
`auto-fix`, `fix`, `ask`, `verify-first`, `skip-false-positive`,
`skip-not-worth-it`, or `reroute`.

Never treat reviewer output as a verdict. Subagent findings are evidence leads.

## Phase 4: Prove The Smell

Use `references/confirmed-smell-gate.md` before editing.

Every fix needs four facts:

1. code fact: the problem exists in the named code
2. usage fact: callers do not invalidate the claim
3. requirement fact: task/spec/invariant allows the simplification
4. verification fact: there is a concrete post-fix check

Architecture findings also need the deletion test: if deleting the helper,
wrapper, seam, or module only moves the same complexity to callers, it may be a
valid deep module rather than a smell.

## Phase 5: Fix Confirmed Smells Only

Fix order:

1. critical
2. simple important fixes
3. complex important fixes
4. minor fixes only when low-risk

Boundaries:

- no unrelated refactor
- no public API change unless the API itself is the confirmed smell
- no multiple architecture directions in one cleanup
- no 50-line abstraction to remove 3 lines of duplication
- if the fix touches more than about 5 files or needs more than about 20 lines
  of new design, stop and ask whether to split, reroute, or fix only the
  critical path

Route redesign to `cc-plan`, disproven root cause to `cc-investigate`, and
verification gaps to `cc-check`.

## Phase 6: Fresh Verification

After edits, run the smallest current checks that prove the cleanup:

1. formatting/structure: `git diff --check`, JSON/YAML parse, `bash -n`
2. targeted test or smoke for touched modules
3. broader gate when the touched surface needs it: `npm test`,
   `npm run verify:*`, or the project equivalent

Old command output and reviewer reports cannot prove the edited tree.

## Output

Return a compact `Simplify Report`:

- Reviewed diff:
- Agents used: `yes` / `no`
- Findings fixed:
- Findings skipped:
- Reroutes / blockers:
- Verification run:
- Next step: `cc-check` / `cc-act` / `cc-plan` / `cc-investigate`

If `cc-simplify` changed code, tests, or verification posture, next step is
`cc-check`; do not carry old verification into `cc-act`.

## Do Not

- Do not treat cleanup as a rewrite entrypoint.
- Do not edit because a reviewer suggested it.
- Do not upgrade style preference to critical.
- Do not skip spec drift.
- Do not use a mock passing as proof of real behavior.
- Do not claim completion without fresh verification.
