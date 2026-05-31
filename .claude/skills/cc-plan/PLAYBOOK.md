# CC-Plan Playbook

## State Machine

`roadmap -> cc-plan -> cc-do`

- Enter with one requirement or bug-shaped planning request.
- Stay until `task.md` has approved scope, task blocks, and verification commands.
- Exit after the Plan commit exists.

## Setup

1. Resolve the CLI with `../cc-dev/scripts/resolve-cc-devflow.sh require next-change-key config`.
2. Create a canonical key with `next-change-key --prefix REQ|FIX --description "..."`.
3. Run `../cc-dev/scripts/detect-worktree-state.sh` before any write.
4. Run `../cc-dev/scripts/prepare-change-worktree.sh --change-key <REQ/FIX-...>`.
5. Enter returned `WORKTREE_PATH`.
6. Run `../cc-dev/scripts/ensure-work-branch.sh --change-key <REQ/FIX-...>`.

Submodule entry, wrong linked worktree, branch case collision, target mismatch, or missing CLI capability is a setup blocker. Keep the main checkout on `main`.

## Rules

1. Only `task.md` is written during Plan.
2. Git commits record Plan completion; do not create process files beyond `task.md`.
3. Current branch must bind to the full change key before writing durable output.
4. The task list must let `cc-do` continue without chat memory.
5. Ask only decisions that change product value, product shape, scope, design, task split, interface, or verification; otherwise choose from repo evidence.
6. Product/creative questions come before engineering questions when worth or shape is unclear.
7. Preserve planning thought inside `task.md#Contract Summary`: product/creative discovery, requirement reality, system shape, interface/data contract, abstraction boundary, execution architecture, task contract, Second-Move Review, and final approval.
8. Non-trivial plans complete Second-Move Review: first good move, simpler move, better architecture, selected move, and rejected tradeoff. Tiny plans still record why the short path is enough.
9. Non-trivial plans use at least two confirmation rounds unless source evidence already answers one: product/creative confirmation, then engineering/task confirmation.
10. User-facing decisions use `D<N>` questions with recommendation, options, impact, and STOP.

## Progressive Flow

1. Gather repo evidence first: roadmap handoff, specs, relevant code/tests/docs, recent commits, and existing task truth.
2. Product/Creative Discovery: worth doing, desired product shape, narrowest wedge, 10x/better version, do-nothing consequence.
3. Requirement Reality: real user/operator, workaround, painful failure, smallest success signal, non-goals.
4. System Shape: existing code path, module owner, state/data flow, reuse point, boundary systems.
5. Interface/Data Contract: public seam, caller, fields, errors, permissions, and external boundaries.
6. Abstraction Boundary and Design Pressure: deep module shape, hidden complexity, caller knowledge, public seam, vertical task slices, and special-case elimination.
7. Execution Architecture: file responsibility, failure recovery, task order, verification commands, and escalation triggers.
8. Second-Move Review: first good move, simpler move, better architecture, selected move, rejected tradeoff.
9. Final Approval: task generation waits until the user releases both requirement and technical plan, unless repo evidence gives an explicit skip reason.

Tiny plans may compress rounds to evidence-backed lines. Full designs preserve enough detail that `cc-do` does not invent architecture, fields, interfaces, or tests.

## Dialogue And Decisions

Ask only decisions that change product value, product shape, scope, design, task split, interface, or verification. Use `../cc-dev/references/user-choice-output-protocol.md`: host-native structured choice first, fixed A/B/C fallback only when needed.

Before task blocks, challenge 3 hidden assumptions, overengineering risk, and the current code or proposal with an adversarial review. Every 10 user-facing Socratic rounds, persist a Dialogue Checkpoint in `task.md#Contract Summary` before asking the next question.

## Required Task Fields

Each task block includes:

- ID and title
- TDD phase
- dependencies
- touched files
- read-first context
- verification command
- completion evidence
- commit point if the task closes an execution environment

Tasks must be tracer bullets: `[TEST] -> [IMPL] -> [REFACTOR]`. Each task names the public verification path, command, completion evidence, suite layer/runtime, proof value, fixture/mock boundary, and low-value tests to avoid. Regression tests cannot be deferred; if no honest seam exists, plan a spike or design correction.

## Contract Summary Fields

`task.md#Contract Summary` includes:

- Source handoff and repo evidence
- Product/creative discovery: worth doing, desired product shape, narrowest wedge, 10x/better version, do-nothing consequence
- Requirement reality
- Decision questions and answers
- Planning flow table
- Second-Move Review when non-trivial
- Approved direction and non-goals
- User stories and edge stories
- Engineering review gate
- Verification and escalation triggers

Also record ASCII Branch Chain Analysis, Design Pressure, test strategy shape, user-facing D<N> decisions, roadmap sync status, and explicit skip reasons for any compressed planning round.

## Handoff

Exit with:

- change key, worktree, and branch
- `task.md` path
- task count and first ready task
- planned verification commands
- roadmap sync status
- Plan commit hash
- next route: `cc-do`, `cc-investigate`, `roadmap`, or `stop`

## Exit

Run the smallest relevant validation for the plan artifacts, stage only owned changes, and commit the Plan stage. Then hand off to `cc-do`.
