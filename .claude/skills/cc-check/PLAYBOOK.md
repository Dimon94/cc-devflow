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
