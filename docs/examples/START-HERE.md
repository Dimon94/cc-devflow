# Start Here

This is the **single entry page** for the example set.

Use it in any of these situations:

- you want the fastest path to the right example
- you only know your current symptom
- you only know which artifact file you have
- you want one-page context before diving into the examples

## Version Trust

Examples are pinned to current skill versions through:

- [example-bindings.json](./example-bindings.json): canonical bindings for example-to-skill versions
- [scripts/check-example-bindings.sh](./scripts/check-example-bindings.sh): verifies the bindings against current `SKILL.md` versions and example artifacts

For day-to-day work, the shortest habit is:

```bash
npm run verify
```

For publish-grade validation, use:

```bash
npm run verify:publish
```

## Fast Route

### 1. Do you already have a `report-card.json` verdict?

- If **no**, start with [the happy path example](./pdca-loop/README.md) to understand the full loop once.
- If **yes**, continue below.

### 2. Is the verdict `pass`?

- If **no**, go to [the full-design blocked example](./full-design-blocked/README.md).
  It shows the most important non-happy-path truth:
  green tests do not override a broken planning contract.
- If **yes**, continue below.

### 3. Can you honestly create or update a PR right now?

- If **yes**, go to [the happy path example](./pdca-loop/README.md).
  That sample ends in `create-pr`.
- If **no**, go to [the local-handoff example](./local-handoff/README.md).
  That sample shows how verified work still leaves a clean next entry without pretending to ship.

## Symptom Picker

| If your situation feels like this | Read this example first | Why |
| --- | --- | --- |
| "I just want to understand the normal loop once." | [pdca-loop](./pdca-loop/README.md) | shows the straight-through path |
| "The code is locally green, but I don't trust the requirement anymore." | [full-design-blocked](./full-design-blocked/README.md) | shows `blocked` + reroute to `cc-plan` |
| "The work is verified, but I can't or shouldn't push yet." | [local-handoff](./local-handoff/README.md) | shows `pass` + `local-handoff` |
| "I don't know whether this should stay `tiny-design`." | [pdca-loop](./pdca-loop/README.md), then [full-design-blocked](./full-design-blocked/README.md) | compare a truly small patch against a requirement that outgrew it |

## By Artifact

Use this when the only thing you know is the file in front of you.

| If the main file you have is... | You are probably here | Read this first |
| --- | --- | --- |
| `ROADMAP.md` | `cc-roadmap` | [pdca-loop/ROADMAP.md](./pdca-loop/ROADMAP.md) |
| `roadmap-tracking.json` | `cc-roadmap` machine truth source for roadmap + backlog | [pdca-loop/roadmap-tracking.json](./pdca-loop/roadmap-tracking.json) |
| `BACKLOG.md` | `cc-roadmap` -> `cc-plan` handoff | [pdca-loop/BACKLOG.md](./pdca-loop/BACKLOG.md) |
| `design.md` | `cc-plan` | [pdca-loop/design.md](./pdca-loop/changes/REQ-001-copy-invite-link/planning/design.md) or [full-design-blocked/design.md](./full-design-blocked/changes/REQ-002-bulk-invite-import/planning/design.md) |
| `tasks.md` | `cc-plan` or `cc-do` | [pdca-loop/tasks.md](./pdca-loop/changes/REQ-001-copy-invite-link/planning/tasks.md) |
| `task-manifest.json` | `cc-do` | [pdca-loop/task-manifest.json](./pdca-loop/changes/REQ-001-copy-invite-link/planning/task-manifest.json) |
| `report-card.json` | `cc-check` | [pdca-loop/report-card.json](./pdca-loop/changes/REQ-001-copy-invite-link/review/report-card.json), [full-design-blocked/report-card.json](./full-design-blocked/changes/REQ-002-bulk-invite-import/review/report-card.json), or [local-handoff/report-card.json](./local-handoff/changes/REQ-003-audit-log-export/review/report-card.json) |
| `pr-brief.md` | `cc-act` | [pdca-loop/pr-brief.md](./pdca-loop/changes/REQ-001-copy-invite-link/handoff/pr-brief.md) |
| `resume-index.md` | `cc-act` with `local-handoff` | [local-handoff/resume-index.md](./local-handoff/changes/REQ-003-audit-log-export/handoff/resume-index.md) |

### Read `report-card.json` Like This

| Verdict | Reroute | Meaning |
| --- | --- | --- |
| `pass` | `none` | move toward `cc-act` |
| `fail` | `cc-do` | implementation must continue |
| `blocked` | `cc-do` | proof or execution prerequisites are missing |
| `blocked` | `cc-plan` | design or scope truth is broken; do not keep coding blindly |

### Read `resume-index.md` Like This

Ask only:

1. is verification already `pass`?
2. is the blocker environmental instead of design-related?

If both are true, you are usually in `cc-act` local handoff territory, not back in planning.

## Example Map

### 1. Happy Path: `tiny-design` + `pass` + `create-pr`

- Read: [pdca-loop/README.md](./pdca-loop/README.md)
- Best when:
  - you want to understand the straight-through loop once
  - you need a clean example of `cc-roadmap -> cc-plan -> cc-do -> cc-check -> cc-act`

### 2. Counterexample: `full-design` + `blocked` + reroute to `cc-plan`

- Read: [full-design-blocked/README.md](./full-design-blocked/README.md)
- Best when:
  - tests are green but the requirement still feels untrustworthy
  - you need to see why `cc-check` can honestly block even after execution work happened

### 3. Counterexample: `pass` + `local-handoff`

- Read: [local-handoff/README.md](./local-handoff/README.md)
- Best when:
  - the work is verified
  - but PR or remote actions are intentionally unavailable
  - and you need a clean next-entry handoff instead of fake shipping

## Wrong Turns To Avoid

- Do not jump from `tasks.md` straight to `cc-act`
- Do not treat green tests as stronger than a `report-card.json` reroute
- Do not treat `resume-index.md` as proof that planning failed; it may simply mean local handoff

## One-Minute Rule

If you only have one minute, open these files in order:

1. example `README.md`
2. change `planning/design.md`
3. `report-card.json` or the single final handoff file

That should already tell you:

- what planning density was chosen
- whether verification passed, failed, or blocked
- why `cc-act` selected the final ship mode

## Minimal Output Rule

`devflow/changes/<change>/` should stay lean.

- Durable truth only: `change-state.json`, planning docs, `task-manifest.json`, optional `team-state.json`, task `checkpoint.json`, `report-card.json`, and one final handoff file.
- Runtime scratch belongs in `devflow/workspaces/<change>/`, not beside the durable record.

## If You Still Want The Split Views

- [README.md](./README.md): compact example list
- [BY-ARTIFACT.md](./BY-ARTIFACT.md): compatibility page for artifact-only lookup
