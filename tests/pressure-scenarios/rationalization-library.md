# Rationalization Library

> Purpose: shared pressure-test excuses, reality checks, and guardrail targets.
> Keep this file aligned with `scenarios/` whenever a new failure pattern is found.

## Articles

| Article | Name | Guardrail |
| --- | --- | --- |
| Article I | Quality First | Complete the specified behavior or do not claim it is done. |
| Article VI | Test-First Development | No production behavior ships without fresh, behavior-level verification. |
| Article VII | Simplicity Gate | Remove accidental complexity instead of hiding it behind more branches. |
| Article X | Requirement Boundary | Implement the approved scope, nothing more and nothing less. |

## Pressure Patterns

| Pattern | Common Excuse | Reality | Skill Guardrail | Scenario |
| --- | --- | --- | --- | --- |
| Partial implementation | "Core logic works, edge cases later." | Edge cases are part of the specified behavior. | `cc-do` must keep task status incomplete until every required behavior has evidence. | `scenarios/partial-implementation.md` |
| Future-version escape | "Will complete in v2." | Future versions do not satisfy the current contract. | `cc-check` must classify missing required scope as `fail`, not residual risk. | `scenarios/partial-implementation.md` |
| MVP misuse | "MVP means ship the 80% that works." | Minimum viable still means the approved slice works completely. | `cc-plan` must shrink scope before implementation, not after partial delivery. | `scenarios/partial-implementation.md` |
| Scope creep | "User might need this later." | Unrequested features are defects against the current contract. | `cc-do` must stop at `task.md`; `cc-review` flags out-of-scope additions. | `scenarios/scope-creep.md` |
| Helpful addition | "While I am here anyway." | Small extras compound into hidden product decisions. | `cc-plan` must create a new requirement or explicit decision before scope expands. | `scenarios/scope-creep.md` |
| Natural extension | "This is just the obvious next feature." | Obvious does not mean approved. | `cc-next` / `cc-plan` route new work through a separate Goal Packet or task contract. | `scenarios/scope-creep.md` |
| Manual-test substitution | "I already checked it manually." | Ad hoc checking is not repeatable evidence. | `cc-check` requires fresh command, browser, CLI, or documented behavior proof. | `scenarios/tdd-violation.md` |
| Sunk-cost pressure | "Deleting hours of work is wasteful." | Keeping unverified code is technical debt. | `cc-do` must restore Red -> Green discipline or record an explicit exception. | `scenarios/tdd-violation.md` |
| Authority override | "The user said commit it now." | User pressure does not erase the quality gate unless scope or test policy is explicitly changed. | `cc-act` must reroute to `cc-check` or `cc-do` when verification is missing. | `scenarios/tdd-violation.md` |
| Stale evidence | "I just ran it." | Any change after the run makes the evidence stale. | `cc-check` must rerun the smallest trustworthy gate before `pass`. | `scenarios/verification-skip.md` |
| Trivial-change bypass | "The change is too small to break anything." | Trivial changes break contracts when they touch the wrong seam. | `cc-check` treats missing fresh evidence as `blocked` or `fail`, not confidence. | `scenarios/verification-skip.md` |
| Confidence claim | "I am sure it works." | Confidence is not evidence. | Completion claims must cite command output, exit status, and observed behavior. | `scenarios/verification-skip.md` |

## Maintenance Rules

1. Add a row when a scenario names a new excuse.
2. Link every row to one skill guardrail and one scenario.
3. If a row has no scenario, create the scenario before relying on it as regression coverage.
4. If a skill guardrail changes, update the linked skill `Default Output` or exit criteria when needed.
