---
name: cc-archive
version: 1.0.0
description: >-
  Use when cc-devflow change directories need archive maintenance: archive a
  completed or intentionally shelved devflow/changes/<change-key>/ directory
  under devflow/changes/archive/YYYY-MM/, restore an archived change, or list
  archived changes.
triggers:
  - 归档 change
  - 归档 devflow/changes
  - archive change
  - restore archived change
  - list archived changes
reads:
  - devflow/changes/<change-key>/task.md
  - devflow/changes/<change-key>/handoff/pr-brief.md
  - devflow/changes/archive/
  - PLAYBOOK.md
writes:
  - path: devflow/changes/archive/YYYY-MM/<change-key>/
    durability: working-tree
    required: true
  - path: devflow/changes/<change-key>/
    durability: working-tree
    required: false
effects:
  - Moves active change directories into or out of archive with the cc-devflow CLI.
entry_gate:
  - Confirm archive, restore, or list mode.
  - For archive, confirm the active change directory exists.
  - For archive, confirm closeout evidence exists or the user explicitly requested shelving.
  - For restore, confirm the archive path exists and the active destination is absent.
exit_criteria:
  - The cc-devflow CLI command exited 0 and final path proof was reported.
  - If the CLI command failed, report the blocker and do not move files manually.
reroutes:
  - when: Change is still active and the user did not request shelving.
    target: cc-dev or cc-check
---

# CC-Archive

Move `devflow/changes/<change-key>/` between active and archived state. Do not invent archive state from UI labels; use filesystem truth plus `task.md`, handoff, Git, or explicit user instruction.

## Quick Start

1. Read `PLAYBOOK.md`.
2. Use the CLI, not raw `mv`:

```bash
cc-devflow archive-change <change-key> --cwd <repo>
cc-devflow restore-change <absolute-archive-path> --cwd <repo>
cc-devflow list-archived --cwd <repo>
```

When working inside this repository source tree, use `node bin/cc-devflow-cli.js ...`.

## Guardrails

- `ArchiveSkip` in handoff or task truth blocks archive unless the user explicitly overrides it.
- Archive only completed changes, or changes the user explicitly asked to shelve.
- Keep archive output to path proof; do not create report files, status files, or resume files.
- Treat CLI target conflicts as blockers.

## Default Output

Report mode, command, result path, evidence checked, and next route: `cc-next`, `cc-dev`, `cc-check`, or `stop`.
