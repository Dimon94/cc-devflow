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
- Expected:
- Actual:
- Impact / blast radius:

## Evidence Chain

- Logs / stack traces:
- Code path:
- Recent changes:
- Existing tests:
- Prior investigations:
- TODO / backlog / report-card signals:

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
| trust boundary drift | | ruled-out | |

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
- Recommendation:

## Root Cause

- Confirmed root cause:
- Broken contract:
- Spec diagnosis: `implementation drift` | `missing spec truth` | `roadmap mismatch`
- Why it escaped:
- Prior history relationship: `new` | `recurring` | `same-root-cause` | `architectural-smell-candidate`

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
- Root cause confirmed:
- Repair scope still belongs to this requirement:
- If not, reroute:
