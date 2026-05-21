# Planning Contract

## Hard Rules

1. `cc-plan` writes only `task.md`.
2. Git commit records Plan completion.
3. Clarification, approval, review notes, and execution protocol live inside `task.md`.
4. No process file beyond `task.md`.
5. New change keys come from `cc-devflow next-change-key`.
6. Branch binds to the full change key before durable output.
7. User decisions that affect scope, design, or verification are written into `task.md#Contract Summary`.
8. Planning flow results are written into `task.md#Contract Summary`; removing old process files must not remove planning thought.
9. Placeholder tasks are invalid.
10. Behavior work uses tracer bullets and TDD unless an exception is recorded.
11. Roadmap sync, when needed, happens through roadmap files and Git commit, not change metadata.
12. Non-trivial plans complete Second-Move Review before approval; the first workable plan is not frozen until a simpler move and a better-architecture move have both been considered.
13. Non-trivial plans complete product/creative discovery before engineering design; if worth, shape, wedge, or 10x/better version is unclear, ask product questions before implementation questions.
14. Product/creative confirmation and engineering confirmation are separate rounds unless roadmap/spec evidence already answers one of them and `task.md` records the skip reason.
15. Non-trivial plans run a Socratic Dialogue before final approval: one question at a time, recommended answer included, repo-answerable questions answered from evidence first, and task generation blocked until the user explicitly says the requirement and technical plan are detailed enough.
16. Technical Socratic dialogue must challenge 3 hidden assumptions, overengineering risk, and the current code or proposal with an adversarial review before task blocks are generated.
17. Every 10 user-facing Socratic question rounds, write a Dialogue Checkpoint into `task.md#Contract Summary` before asking the next question.
18. ASCII branch-chain connector tokens stay ASCII, but labels, evidence, and explanatory text follow `Output language`.
19. User-facing decisions use `../cc-dev/references/user-choice-output-protocol.md`: host-native structured choice first, fixed A/B/C text fallback only when no structured-input tool exists.

## Planning Flow

Every non-trivial plan confirms these rounds before task generation:

1. Product/Creative Discovery: worth doing, desired product shape, narrowest wedge, 10x/better version, do-nothing consequence.
2. Requirement Reality: real user/operator, workaround, painful failure, smallest success signal, non-goals.
3. System Shape: existing code path, module owner, state/data flow, reuse point, boundary systems.
4. Interface/Data Contract: public seam, caller, input/output, fields, error shape, permission/boundary.
5. Abstraction Boundary: where complexity lives, rejected abstractions, public/private method split.
6. Execution Architecture: foundation/core/integration/polish decisions, file responsibility, failure recovery.
7. Task Contract: tracer bullets, Red test names, public seams, Green minimality, refactor candidates.
8. Second-Move Review: first good move, simpler move, better architecture, selected move, and rejected tradeoff.
9. Final Approval: approved option and task contract summary.

Tiny plans may compress a round to one evidence-backed line. Full designs must preserve enough detail that `cc-do` does not invent architecture, fields, interfaces, or tests.

## Socratic Dialogue

The dialogue is complete only when both releases are explicit:

- Requirement release: the user confirms the demand, user/operator, status quo, success signal, non-goals, and scope are detailed enough to enter technical planning.
- Technical release: after repo evidence or proposal review, the user confirms the interface, data contract, abstraction boundary, test seam, and task shape are detailed enough to generate tasks.

Record repo-answered questions, user-answered rounds, ten-round Dialogue Checkpoints, hidden assumptions, overengineering challenge, adversarial review findings, and the release phrase in `task.md#Contract Summary`.

Each Dialogue Checkpoint covers the last 10 user-facing question rounds and records round range, next question number, decisions made, rejected options and reasons, remaining open questions, evidence read, hidden assumptions or review findings so far, and current release status. After context compression, resume from the latest checkpoint before asking another question.

## Decision Questions

Ask only when the answer changes product value, product shape, scope, design, task split, interface, or verification. Before asking, run Second-Move Review on the question itself: can repo evidence answer it, is it too implementation-shaped for the user, and would a better question freeze more downstream decisions? Product/creative questions come before engineering questions when worth or shape is unclear. Use `D<N>` with known evidence, recommendation, 2-3 mutually exclusive options, impact, and a stop point. Prefer Codex `request_user_input` or Claude Code structured input when available; use the fixed A/B/C fallback only when no structured-input tool exists. Record the answer in `task.md#Contract Summary`.

## Required Task Fields

- goal
- user or edge story
- files
- dependencies
- TDD phase
- public verification path
- verification command
- completion evidence
- completion command
- commit point

## Review Gate

Before exit, check product/creative discovery, scope, existing leverage, Second-Move Review, domain language, interface depth, test seam, mock boundary, feedback loop, and failure modes. If the plan is not executable from `task.md`, it is not done.
