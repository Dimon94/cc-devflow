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

## Planning Flow

Every non-trivial plan confirms these rounds before task generation:

1. Requirement Reality: real user/operator, workaround, painful failure, smallest success signal, non-goals.
2. System Shape: existing code path, module owner, state/data flow, reuse point, boundary systems.
3. Interface/Data Contract: public seam, caller, input/output, fields, error shape, permission/boundary.
4. Abstraction Boundary: where complexity lives, rejected abstractions, public/private method split.
5. Execution Architecture: foundation/core/integration/polish decisions, file responsibility, failure recovery.
6. Task Contract: tracer bullets, Red test names, public seams, Green minimality, refactor candidates.
7. Final Approval: approved option and task contract summary.

Tiny plans may compress a round to one evidence-backed line. Full designs must preserve enough detail that `cc-do` does not invent architecture, fields, interfaces, or tests.

## Decision Questions

Ask only when the answer changes scope, design, task split, interface, or verification. Use `D<N>` with known evidence, recommendation, 2-3 mutually exclusive options, impact, and a stop point. Record the answer in `task.md#Contract Summary`.

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

Before exit, check scope, existing leverage, option role, domain language, interface depth, test seam, mock boundary, feedback loop, and failure modes. If the plan is not executable from `task.md`, it is not done.
