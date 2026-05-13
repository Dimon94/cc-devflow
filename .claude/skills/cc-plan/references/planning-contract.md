# Planning Contract

## Hard Rules

1. `cc-plan` writes only `task.md`.
2. Git commit records Plan completion.
3. Clarification, approval, review notes, and execution protocol live inside `task.md`.
4. No process JSON, design side-doc, status file, resume file, review file, or principles file.
5. New change keys come from `cc-devflow next-change-key`.
6. Branch binds to the full change key before durable output.
7. User decisions that affect scope, design, or verification are written into `task.md#Contract Summary`.
8. Placeholder tasks are invalid.
9. Behavior work uses tracer bullets and TDD unless an exception is recorded.
10. Roadmap sync, when needed, happens through roadmap files and Git commit, not change metadata.

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

Before exit, check scope, existing leverage, non-goals, ambiguity, test seam, mock boundary, and failure modes. If the plan is not executable from `task.md`, it is not done.
