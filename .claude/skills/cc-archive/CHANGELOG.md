# CC-Archive Skill Changelog

## v1.0.0 - 2026-06-17

- add a maintenance skill for archive, restore, and list operations around `devflow/changes/<change-key>/`
- route archive work through the existing `cc-devflow archive-change`, `restore-change`, and `list-archived` CLI commands
- keep archived state as filesystem truth and reject manual process files
