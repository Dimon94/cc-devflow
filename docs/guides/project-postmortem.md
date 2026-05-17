# Project Postmortems

Postmortems preserve recurring failures without turning every workflow step into a file.

## Files

- `devflow/postmortems/INDEX.md`
- `devflow/postmortems/incidents/<date>-<change-key>.md`

## When To Write One

- closing a `FIX-*`
- repeated AI, test, release, Git, or architecture failure
- explicit user request

`cc-act` must make the decision explicit by running:

```bash
.claude/skills/cc-act/scripts/evaluate-postmortem-trigger.sh --dir devflow/changes/<change-key>
```

If the trigger only exists in the current session, pass it as `--trigger <short-label>` so the final closeout does not silently drop rework or unusual failure evidence.

## Rules

- Use Git evidence, commands, and current files.
- Redact secrets, customer data, private logs, and local machine paths.
- Do not create a separate principles file.
- Do not use postmortems as task, review, or release state.
