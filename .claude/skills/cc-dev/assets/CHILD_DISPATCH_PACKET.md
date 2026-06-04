# Child Dispatch Packet

Use this packet for one `task.md#Execution Environments` child thread. Fill
every field before dispatch. Do not send partial child prompts from chat memory.

```text
Change:
Environment:
Route skill:
Parent thread id:
Parent branch:
Base commit:
Parent task file:
Child worktree task file:
Assigned task IDs:
-

Child dispatch boundary:
<paste the exact range from `--- CHILD DISPATCH START <Env> ---` through `--- CHILD DISPATCH END <Env> ---` in task.md>

Task block completeness check:
- Every task listed in the environment appears inside the dispatch boundary as
  a full task block.
- Each task block includes ID/title, Environment, TDD phase, dependencies,
  Files, Read first, Verification, Evidence, Completion, Public verification
  path, and Ready when.
- If any assigned task is only a branch label, workstream name, or prose TODO,
  stop and report `Route recommendation: cc-plan`.
- Implementation environments are Red/Green/Refactor closed loops unless the
  boundary records an explicit `TDD exception`.

Environment completeness check:
- Boundary includes Env metadata, Child fields, Integration fields, Merge gate,
  Touches, Mutable resources, and Verification.
- Integration is parent-owned; the child must not cherry-pick, unlock sibling
  environments, or mark itself integrated.

Allowed touched paths:
-

Mutable resources:
-

Read first:
-
- Commit guideline: references/git-commit-guidelines.md

Non-goals:
-

Verification commands:
-

Commit requirement:
- Commit required: yes | no
- Commit scope: this environment only
- Commit message contract: follow references/git-commit-guidelines.md
- Commit message shape: Conventional Commit title plus required structured body
  when the guideline says a body is required

Execution rules:
- Execute only this environment.
- Read the task contract from `Child worktree task file` after entering the
  child worktree root; do not use the parent checkout path for task selection.
- Execute only `Assigned task IDs`; use the same IDs when running
  `mark-task-complete.sh`.
- Do not inspect, update, unlock, or complete sibling environments except for
  dependency status explicitly needed by this environment.
- Do not create child threads, sibling worktrees, integration commits, phase
  gates, final `cc-check`, or delivery-mode choices.
- Keep durable workflow truth in `task.md`, Git history/status, and PR/handoff
  reality only.
- Do not create vague, one-line, or mixed-scope commits when
  `references/git-commit-guidelines.md` requires semantic splitting,
  root-cause text, validation, risk, or refs.

Child-to-parent handoff:
- If `send_message_to_thread` is available, send the parent a short completion
  notice after the final report is ready.
- The handoff notice is only a wake-up hint; the parent still verifies the
  thread, commit, dirty state, touched files, blockers, and verification before
  integration.

Final report format:
Environment:
Route:
Status: completed | blocked
Task file:
Assigned task IDs:
Thread:
Worktree:
Branch:
Commit: <hash subject> | none
Verification:
- <command or review scope>: pass | fail | blocked
Dirty state: clean | dirty <files>
Touched files:
-
Blockers:
-
Route recommendation: integrate | retry | cc-plan | cc-diagnose | blocked
```
