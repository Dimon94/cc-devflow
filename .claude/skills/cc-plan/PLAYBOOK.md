# CC-Plan Playbook

## State Machine

`roadmap -> cc-plan -> cc-do`

- Enter with one requirement or bug-shaped planning request.
- Stay until `task.md` has approved scope, task blocks, and verification commands.
- Exit after the Plan commit exists.

## Rules

1. Only `task.md` is written during Plan.
2. Git commits record Plan completion; no JSON state, ledger, status, resume, or principles files.
3. Current branch must bind to the full change key before writing durable output.
4. The task list must let `cc-do` continue without chat memory.
5. Ask only blocking questions; otherwise choose from repo evidence.

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

## Exit

Run the smallest relevant validation for the plan artifacts, stage only owned changes, and commit the Plan stage. Then hand off to `cc-do`.
