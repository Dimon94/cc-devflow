# Project Postmortems

Postmortems preserve recurring and special-case failures without turning every workflow step into a file. The `postmortem` skill owns recall, interrogation, format, recurrence, and standalone recording rules.

## Files

- `devflow/postmortems/INDEX.md`
- `devflow/postmortems/incidents/<date>-<change-key-or-manual-slug>.md`

## When To Write One

- closing a `FIX-*`
- repeated AI, test, release, Git, or architecture failure
- explicit user request

`cc-act` must make the decision explicit by running:

```bash
.claude/skills/cc-act/scripts/evaluate-postmortem-trigger.sh --dir devflow/changes/<change-key>
```

If the trigger only exists in the current session, pass it as `--trigger <short-label>` so the final closeout does not silently drop rework or unusual failure evidence.

Standalone recording is allowed only when the user explicitly asks to save the lesson and the minimum facts exist: symptom, evidence, lesson type, recall condition, and root-cause status.

## Rules

- Use Git evidence, commands, and current files.
- Search `devflow/postmortems/INDEX.md` and `rg` incidents before writing.
- Update the existing incident when `recurrence_key` matches.
- Mark narrow incidents as `lesson_type: special-case` and gate recall through `recall_only_when`.
- Redact secrets, customer data, private logs, and local machine paths.
- Do not create a separate principles file.
- Do not use postmortems as task, review, or release state.
