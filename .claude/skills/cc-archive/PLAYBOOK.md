# CC-Archive Playbook

## Modes

- `archive`: move `devflow/changes/<change-key>/` to `devflow/changes/archive/YYYY-MM/<change-key>/`.
- `restore`: move an archived directory back to `devflow/changes/<change-key>/`.
- `list`: show archived changes.

## Archive Flow

1. Identify repo root and exact `<change-key>`.
2. Read `task.md` and optional `handoff/pr-brief.md` when present.
3. Stop on `ArchiveSkip` unless the user explicitly says to override it.
4. Require done/closed evidence, or an explicit shelving request from the user.
5. Run:

```bash
cc-devflow archive-change <change-key> --cwd <repo>
```

6. Verify the old active path is gone and the archived path exists.

## Restore Flow

1. Identify the exact archived path.
2. Confirm `devflow/changes/<change-key>/` does not already exist.
3. Run:

```bash
cc-devflow restore-change <absolute-archive-path> --cwd <repo>
```

4. Verify the active path exists.

## List Flow

Run:

```bash
cc-devflow list-archived --cwd <repo>
```

## Failure Rule

Do not repair CLI failures with manual `mv`. A missing directory, existing target, or unclear closeout state is the truth to report.
