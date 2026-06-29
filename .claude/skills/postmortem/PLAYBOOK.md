# Postmortem Playbook

## Recall

Build search terms from the current work:

- capability or workflow surface
- primary module or file family
- exact error, failing command, or violated contract
- `failure_class`
- `model_risk`

Read `devflow/postmortems/INDEX.md` first when it exists. Then search incidents:

```bash
rg -n "<recurrence_key|module|error|failure_class|model_risk>" devflow/postmortems
```

Open only matching incident files. Apply lessons as follows:

- `recurring-pattern`: may become a planning, diagnosis, review, verification, or execution guardrail.
- `special-case`: becomes a guardrail only when `recall_only_when` matches the current work.

When used inside cc-devflow, write the applied lesson into the current durable carrier:

| Caller | Writeback |
| --- | --- |
| `cc-plan` | task guardrail, risk, verification, file boundary, or non-goal |
| `cc-diagnose` | root-cause hypothesis, reproduction constraint, or rejected near-cause |
| `cc-review` | review focus or eligible escape check |
| `cc-check` | verification boundary or ledger classification caution |
| standalone | Chinese summary only, unless the user asked to record |

## Interrogate

Ask one question at a time. If repo evidence can answer it, inspect the repo.

Minimum facts before recording:

- symptom
- evidence
- root cause status: `confirmed`, `suspected`, or `unknown`
- lesson type: `recurring-pattern` or `special-case`
- recall condition
- recurrence key candidate

Recommended question order:

1. What exact symptom or command proves the failure?
2. Is the root cause confirmed, suspected, or unknown?
3. Is this reusable, or a special case with narrow recall conditions?
4. What should the next operator check first?

## Record

Before writing, search:

```bash
rg -n "<recurrence_key|error|module|failure_class|stable_signature>" devflow/postmortems
```

Decision:

- same `recurrence_key`: update the existing incident, add a recurrence row, and update `INDEX.md`
- similar symptom but different key: create a new incident and link the related report inside `复发判断`
- no match: create a new incident and add an index row

For active cc-devflow changes:

- `cc-do` records现场 evidence in `task.md#Failure Ledger`
- `cc-check` classifies ledger entries
- `cc-act` writes final incident postmortems during closeout

For standalone recording:

- require explicit user intent to save the lesson
- use `source: manual`
- write `devflow/postmortems/incidents/<date>-manual-<slug>.md`
- update `devflow/postmortems/INDEX.md`

Do not write a confirmed root cause when evidence only supports `suspected` or `unknown`.
