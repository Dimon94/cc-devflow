# CC-Plan Playbook

## State Machine

`roadmap -> cc-plan -> cc-do`

- Enter with one requirement or bug-shaped planning request.
- Stay until `task.md` has approved scope, task blocks, and verification commands.
- Exit after the Plan commit exists.

## Rules

1. Only `task.md` is written during Plan.
2. Git commits record Plan completion; do not create process files beyond `task.md`.
3. Current branch must bind to the full change key before writing durable output.
4. The task list must let `cc-do` continue without chat memory.
5. Ask only decisions that change scope, design, task split, interface, or verification; otherwise choose from repo evidence.
6. Preserve planning thought inside `task.md#Contract Summary`: requirement reality, system shape, interface/data contract, abstraction boundary, execution architecture, task contract, and final approval.
7. Non-trivial plans compare `minimal viable` and `ideal architecture`; tiny plans still record why the short path is enough.
8. User-facing decisions use `D<N>` questions with recommendation, options, impact, and STOP.

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

## Contract Summary Fields

`task.md#Contract Summary` includes:

- Source handoff and repo evidence
- Requirement reality
- Decision questions and answers
- Planning flow table
- Minimal viable / ideal architecture comparison when non-trivial
- Approved direction and non-goals
- User stories and edge stories
- Engineering review gate
- Verification and escalation triggers

## Exit

Run the smallest relevant validation for the plan artifacts, stage only owned changes, and commit the Plan stage. Then hand off to `cc-do`.
