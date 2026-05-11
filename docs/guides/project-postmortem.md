# Project Postmortem Contract

cc-devflow treats project postmortems as a durable AI memory surface. They are not
chat summaries. They are repo-owned evidence that future agents can search before
planning, investigating, or executing work.

## Storage Layout

Project-level postmortems live under `devflow/postmortems/`:

| Path | Owner | Purpose |
| --- | --- | --- |
| `INDEX.md` | `cc-act` | Progressive entry point, latest incidents, tags, and search hints |
| `principles.md` | `cc-act` | Generalized lessons about recurring model, process, and engineering mistakes |
| `incidents/<date>-<change-key>.md` | `cc-act` | Immutable-ish factual record for one incident, bug, or repeated AI failure |

`cc-act` owns writes because it has verified closeout, Git state, review state, and
ship facts. Earlier skills only read and project the relevant reminders into their
own artifacts.

## Progressive Disclosure

- Default layer: `INDEX.md` gives tags, one-line lessons, severity, affected
  surfaces, and links to deeper incident files.
- Principle layer: `principles.md` gives reusable rules such as model failure
  modes, domain-specific judgment traps, and required countermeasures.
- Incident layer: `incidents/*.md` gives the detailed facts, Git evidence,
  timeline, root cause, detection gap, repair, follow-ups, and search terms.

Agents should start with keyword search over the default and principle layers, then
open incident files only when the tags or failure class match the current task.

## Required Incident Evidence

Every incident file should include:

- Symptom and impact.
- Trigger and timeline.
- Confirmed root cause and rejected near-causes.
- Why the failure escaped planning, investigation, execution, review, or ship.
- Git evidence: branch, base, head SHA, PR if any, relevant commits, review range,
  and dirty-tree notes when they matter.
- Verification evidence: commands, exit status, key output, and artifact paths.
- Follow-up actions: root-cause fixes, detection improvements, and backlog items.
- AI failure mode: model limitation, pattern-matching trap, missing evidence habit,
  over-broad abstraction, fake compatibility, test-seam mistake, or other reusable
  class.
- Search terms future agents should use before repeating similar work.

## Read Gates

`cc-plan`, `cc-investigate`, and `cc-do` must run a quick local search before they
freeze direction or touch code:

```bash
rg -n "<capability|module|error|failure-class|model-risk>" devflow/postmortems
```

If `devflow/postmortems/` does not exist, record `no-project-postmortems-yet`.
If a match exists, load only `INDEX.md`, `principles.md`, and the one or two
incident files most relevant to the current work.

## State Ownership

Postmortems do not own task status, roadmap progress, review verdicts, or spec sync
state. They cite those stronger owners by path, commit, or command output.
