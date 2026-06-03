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

Current environment block:
<paste the exact environment block from task.md>

Included task blocks:
<paste each task block assigned to this environment>

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
