---
name: cc-simplify
version: 1.8.0
description: >-
  Use when changed code needs a confidence-gated simplification pass for scope
  drift, reuse, code quality, efficiency, test quality, and confirmed smell
  fixes before cc-check or cc-act.
skill_class: capability
route_family: quality
reads:
  - devflow/changes/<change-key>/task.md
  - current Git diff
  - PLAYBOOK.md
  - references/checklist-contract.md
  - references/confirmed-smell-gate.md
  - references/reviewer-swarm.md
  - references/finding-triage.md
  - ../quality-gate-contract/SKILL.md
  - ../cc-dev/references/user-choice-output-protocol.md
writes:
  - path: code changes
    durability: working-tree
    required: false
  - path: test changes
    durability: working-tree
    required: false
---

# CC-Simplify

## Quick Start

All paths below are relative to this `SKILL.md` directory, not the shell cwd.

1. Read `references/checklist-contract.md`.
2. Read `PLAYBOOK.md` for the six-phase flow.
3. Load references only when the matching step needs detail.
4. Fix only confirmed smells inside the current diff; report speculation.
5. After edits, run fresh verification and route back to `cc-check`.

## Iron Law

```text
ONLY FIX CONFIRMED SMELLS. DO NOT BEAUTIFY BY GUESS.
```

## Confirmed Smell Gate

Speculative cleanup candidates are reported, not edited.
A confirmed smell needs code fact, usage fact, requirement fact, and verification fact before any file changes.
When the diff contains a confirmed duplicated branch, repeated helper, false test seam, or shallow wrapper, simplify the smallest behavior-preserving shape and make sure it is rechecked with fresh verification.

Detailed rules live in `references/confirmed-smell-gate.md`.

## Reference Loading

| Load | When |
| --- | --- |
| `PLAYBOOK.md` | any real simplify pass |
| `references/reviewer-swarm.md` | subagent dispatch, reviewer prompts, specialists, Red Team |
| `references/finding-triage.md` | finding line shape, dedupe, confidence gates, fix/ask/reroute decisions |
| `references/confirmed-smell-gate.md` | proving a smell before edit, deletion test, false-positive suppressions |
| `../quality-gate-contract/SKILL.md` | confirmed smell boundary and quality-gate role for cc-simplify |
| `../cc-dev/references/user-choice-output-protocol.md` | public API, behavior, security, or broad design choice requires user decision |

## Default Output

End the simplification pass with:

1. Agents used: yes/no and reason if unavailable.
2. Findings: confirmed smells fixed, deferred smells, or `NO FINDINGS`.
3. Changes: files touched and smell removed.
4. Verification: command, exit status, and claim proven or blocker.
5. Residual risk: none or named risk.
6. Route: `cc-check`, `cc-act`, `cc-do`, or `stop`.

## Exit Criteria

- Current diff scope and task/spec context were frozen.
- Reviewer findings were parsed, deduped, confidence-gated, and verified by the main thread.
- No finding was edited without code, usage, requirement, and verification facts.
- Edits stayed inside the current cleanup boundary.
- Fresh verification ran after any edit, or the blocker is explicit.
