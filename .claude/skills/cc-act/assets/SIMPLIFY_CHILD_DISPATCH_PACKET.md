# Simplify Child Dispatch Packet

Use this packet for the pre-act `cc-simplify` child thread. Fill every field
before dispatch. Do not send partial child prompts from chat memory.

```text
Change:
Route skill: cc-simplify
Parent thread id:
Parent branch:
Base commit:
Parent repo path:
Target mode: project worktree | project local

Changed implementation surface:
-

Current Git evidence:
- Status:
- Latest commits:
- Diff summary:
- Latest cc-check evidence:

Read first:
- ../cc-simplify/SKILL.md
- ../cc-simplify/PLAYBOOK.md
- ../cc-simplify/references/checklist-contract.md
- ../cc-simplify/references/confirmed-smell-gate.md
- ../cc-simplify/references/reviewer-swarm.md
- ../cc-simplify/references/finding-triage.md
- references/git-commit-guidelines.md

Non-goals:
- Do not choose delivery mode.
- Do not push, create a PR, merge local main, archive, or write postmortems.
- Do not edit outside the changed implementation surface unless the parent
  explicitly listed the file.
- Do not make speculative cleanup edits.

Simplify scope:
- Freeze the current diff and task/spec context.
- Review scope drift, reuse, code quality, efficiency, and test quality.
- Fix only confirmed smells with code fact, usage fact, requirement fact, and
  verification fact.
- If no confirmed smell exists, report `NO FINDINGS`.

Verification commands:
-

Commit requirement:
- Commit required: yes only if the child changes files
- Commit scope: simplify changes only
- Commit message contract: follow references/git-commit-guidelines.md

Execution rules:
- Run `cc-simplify` only.
- If you edit code, tests, or verification posture, run fresh verification and
  recommend `Route: cc-check`.
- If you do not edit, report the exact reviewed diff and `NO FINDINGS` or
  deferred smells.
- Keep durable workflow truth in Git history/status and final report only.
- Do not create child threads, sibling worktrees, final `cc-check`, or delivery
  decisions.

Child-to-parent handoff:
- If `send_message_to_thread` is available, send the parent a short completion
  notice after the final report is ready.
- The handoff notice is only a wake-up hint; the parent still verifies the
  thread, commit, dirty state, touched files, blockers, and verification before
  trusting the result.

Final report format:
Environment: pre-act-simplify
Route: cc-simplify
Status: completed | blocked
Thread:
Worktree:
Branch:
Commit: <hash subject> | none
Agents used: yes | no <reason>
Findings fixed:
-
Findings skipped:
-
Verification:
- <command or review scope>: pass | fail | blocked
Dirty state: clean | dirty <files>
Touched files:
-
Blockers:
-
Route recommendation: cc-check | cc-act | cc-plan | cc-diagnose | blocked
```
