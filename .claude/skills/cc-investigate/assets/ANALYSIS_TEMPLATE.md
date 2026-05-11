# ANALYSIS

## Investigation Meta

- Requirement version:
- Analysis version:
- Investigate skill version:
- Output language:
- Source roadmap item:
- Source roadmap version:
- Roadmap sync status:
- Incident / bug ID:
- Primary capability:
- Related capability specs:

## Progressive Disclosure Index

- Default read: Symptom, Feedback Loop Contract, Confirmed Root Cause, Repair Boundary.
- Open for root-cause doubt: Project Postmortem Recall, Evidence Chain, Root Cause Proof Ladder, Boundary Probe Matrix, Backward Trace Chain, Hypothesis Ledger.
- Open for workflow failures: Workflow Forensics, Debug Session, Cleanup Checklist.
- Open for handoff/audit: Prevention Handoff, Roadmap Sync Gate, Review Notes.

## Symptom

- What the user saw:
- Reproduction command / path:
- Repro stability: `stable` | `intermittent` | `not-yet-reproduced` | `narrowed-only`
- Matches reported symptom: `yes` | `no` | `partial` | `unknown`
- Symptom match evidence:
- Expected:
- Actual:
- Impact / blast radius:

## Feedback Loop Contract

- Loop type: `failing-test` | `http-script` | `cli-fixture` | `browser-script` | `trace-replay` | `throwaway-harness` | `property-fuzz` | `bisect` | `differential` | `hitl`
- Command or manual driver:
- Expected failing signal:
- Actual failing signal:
- Runtime:
- Determinism: `deterministic` | `high-rate-flaky` | `low-rate-flaky` | `unknown`
- Failure rate:
- Signal specificity:
- Sharpening plan:
- If no loop, evidence request:

## Debug Session

- Session ID:
- Started at:
- Current mode: `reproduce-first` | `feedback-loop` | `diff-trace` | `boundary-probe` | `backward-trace` | `reference-compare` | `condition-wait` | `history-trace` | `pattern-research` | `contract-check` | `diagnose-only` | `workflow-forensics`
- Active hypothesis:
- Completed probes:
- Open probes:
- Cleanup status:
- Next evidence action:

## Evidence Chain

- Logs / stack traces:
- Code path:
- Recent changes:
- Existing tests:
- Prior investigations:
- TODO / backlog / report-card signals:
- Native domain / decision context:

## Project Postmortem Recall

- Search status: `no-project-postmortems-yet` | `searched-no-match` | `matches-found`
- Search command:
- Search terms:
- Sources opened:
  - `devflow/postmortems/INDEX.md`
  - `devflow/postmortems/principles.md`
  - `devflow/postmortems/incidents/<date>-<change-key>.md`
- Similar incidents:
- Matching principles:
- Relevant Git evidence:
- Relationship to current bug: `new` | `recurring` | `same-root-cause` | `similar-symptom-different-root-cause` | `not-related`
- Impact on hypotheses:
- Impact on repair boundary:
- No-op reason:

## Workflow Forensics

| Failure surface | Observed state | Owner | Rescue action | Evidence |
| --- | --- | --- | --- | --- |
| artifact / git / runtime-state / tool / permission / process | | | | |

## Boundary Probe Matrix

| Component boundary | Input observed | Output observed | Config / env observed | State observed | Verdict |
| --- | --- | --- | --- | --- | --- |
| | | | | | unknown |

## Backward Trace Chain

- Immediate failure site:
- Direct caller:
- Caller chain:
- Bad value origin:
- Original trigger:
- Why symptom-site fix is rejected:

## Root Cause Proof Ladder

| Layer | Required proof | Evidence | Status |
| --- | --- | --- | --- |
| L1 Symptom Site | User-visible failure, command, UI state, log, or bad artifact | | pending |
| L2 First Bad State | First field, artifact, cache entry, queue message, config, response, or memory object that becomes invalid | | pending |
| L3 Violated Contract | Schema, capability invariant, API contract, state transition, trust boundary, or timing condition violated | | pending |
| L4 Original Trigger | User action, command, event, recent diff, config change, or external response that created the first bad state | | pending |
| L5 Counterfactual Proof | Actual observation after restoring the contract, replacing input, rolling back diff, fixing config, or asserting boundary | | pending |
| L6 Escape Reason | Why existing tests, types, validators, monitoring, review, or artifact gates missed it | | pending |

- First bad state:
- First bad state evidence:
- Original trigger:
- Counterfactual command / probe:
- Counterfactual expected observation:
- Counterfactual actual observation:
- Root cause proof status: `confirmed` | `needs-more-evidence` | `reroute-cc-plan` | `reroute-roadmap`

## Reference Comparison

- Similar working example:
- Broken path:
- Differences found:
- Differences accepted as hypothesis:
- Differences ruled out:

## Diagnostic Instrumentation Plan

| Probe tag | Probe location | Question answered | Command to run | Expected signal | Actual signal | Cleanup requirement |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

## Pattern Analysis

| Pattern | Evidence checked | Status | Notes |
| --- | --- | --- | --- |
| race condition | | ruled-out | |
| null propagation | | ruled-out | |
| state corruption | | ruled-out | |
| integration failure | | ruled-out | |
| configuration drift | | ruled-out | |
| stale cache | | ruled-out | |
| resource leak | | ruled-out | |
| performance regression | | ruled-out | |
| trust boundary drift | | ruled-out | |
| timing guess / flaky wait | | ruled-out | |

## Candidate Hypotheses

| Rank | Hypothesis | Why plausible | Prediction | Status |
| --- | --- | --- | --- | --- |
| 1 | | | | pending |

## Research Evidence

- External research used: `yes` | `no`
- Sanitized query:
- Source / result:
- Applicability:
- Accepted into hypothesis: `yes` | `no`
- If skipped, reason:

## Hypothesis Table

| Hypothesis | Evidence for | Evidence against | Falsification method | Expected observation | Actual observation | Status |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | pending |

## Escalation Decision

- Failed hypothesis count:
- Attempted evidence:
- Why current entry is suspect:
- Next option: `continue-with-new-hypothesis` | `instrument-and-wait` | `human-review` | `reroute-cc-plan`
- Evidence request:
- Recommendation:

## Root Cause

- Confirmed root cause:
- Root cause proof ladder status: `confirmed` | `needs-more-evidence` | `reroute-cc-plan` | `reroute-roadmap`
- First bad state:
- Original trigger:
- Counterfactual proof:
- Root cause class: `code` | `config` | `environment` | `external` | `timing`
- Broken contract:
- Spec diagnosis: `implementation drift` | `missing spec truth` | `roadmap mismatch`
- Why it escaped:
- Why not code root cause:
- Monitoring or future evidence needed:
- Operator handling after fix:
- Prior history relationship: `new` | `recurring` | `same-root-cause` | `architectural-smell-candidate`

## Diagnose-Only Outcome

- Applies: `yes` | `no`
- Why no repair now:
- Root cause owner:
- Risk if left unresolved:
- Monitoring / follow-up evidence:
- Next action: `human-action` | `monitor` | `backlog` | `reroute-cc-plan` | `handoff-cc-do`
- Explicit no-repair verdict:

## Correct Test Seam

- Test seam:
- Public interface exercised:
- Why this seam reaches the real trigger chain:
- Why a shallower test would be false confidence:
- If no correct seam exists:

## Repair Boundary

- Fix strategy:
- Affected module:
- Allowed files:
- Files likely touched:
- Do not change:
- Blast radius file count:
- Blast radius risk: `low` | `medium` | `high`
- Split / reroute decision if >5 files:
- Expected spec delta:
- Verification after fix:
- Why this can enter `cc-do`:

## Roadmap Sync Gate

- Source RM:
- Locate command:
- Sync command:
- Updated files: `devflow/roadmap.json`, `devflow/ROADMAP.md`, optional `devflow/BACKLOG.md`
- Spec diagnosis effect: `implementation drift` | `missing spec truth` | `roadmap mismatch`
- Status after sync: `Repair planned` | `Reroute to cc-plan` | `Reroute to roadmap` | `No source RM`
- Progress after sync:
- No-op reason:
- Blocking mismatch:

## Review Gate

- Repro stable:
- Feedback loop trustworthy:
- Symptom match confirmed:
- Root cause confirmed:
- Debug session cleanup complete:
- Workflow forensics classified:
- Diagnose-only verdict if applicable:
- Correct test seam identified:
- Repair scope still belongs to this requirement:
- Roadmap sync closed:
- If not, reroute:
