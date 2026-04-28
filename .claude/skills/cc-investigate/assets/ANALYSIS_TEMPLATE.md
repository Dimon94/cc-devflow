# ANALYSIS

## Investigation Meta

- Requirement version:
- Analysis version:
- Investigate skill version:
- Output language:
- Source roadmap item:
- Source roadmap version:
- Incident / bug ID:
- Primary capability:
- Related capability specs:

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

## Evidence Chain

- Logs / stack traces:
- Code path:
- Recent changes:
- Existing tests:
- Prior investigations:
- TODO / backlog / report-card signals:
- Native domain / decision context:

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
- Root cause class: `code` | `config` | `environment` | `external` | `timing`
- Broken contract:
- Spec diagnosis: `implementation drift` | `missing spec truth` | `roadmap mismatch`
- Why it escaped:
- Why not code root cause:
- Monitoring or future evidence needed:
- Operator handling after fix:
- Prior history relationship: `new` | `recurring` | `same-root-cause` | `architectural-smell-candidate`

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

## Review Gate

- Repro stable:
- Feedback loop trustworthy:
- Symptom match confirmed:
- Root cause confirmed:
- Correct test seam identified:
- Repair scope still belongs to this requirement:
- If not, reroute:
