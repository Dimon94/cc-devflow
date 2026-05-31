# Finding Triage

Use this reference after reviewer output is collected.

## Parse

`NO FINDINGS` means that source reported no finding.

Drop any finding line that lacks a concrete file, evidence, or repair route.
Reject speculative output that cannot be tied to the current diff.

Expected line:

```text
severity | confidence | file:line | category | evidence | fix | route
```

## Dedupe

Fingerprint order:

1. `{file}:{line}:{category}`
2. `{file}:{category}:{evidence}` when no line is available
3. merge findings with same evidence and same fix

For duplicates:

- keep the highest-confidence version
- mark `multi-specialist` and add 1 confidence point when independent reviewers
  found the same issue, capped at 10
- order by `critical -> important -> minor`, then confidence descending

## Confidence Gate

- `7-10`: main findings table
- `5-6`: main table, initial decision `verify-first`
- `3-4`: appendix only; upgrade only after main-thread code review confirms it
- `1-2`: suppress

## Main Table

```markdown
| ID | Source | Severity | File:line | Claim | Evidence | Proposed fix | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | spec | critical | | | | | pending |
```

Severity:

- `critical`: breaks function, security, data, or release truth
- `important`: clear smell, spec drift, test illusion, or performance risk
- `minor`: readability, local duplication, or small optimization

Decision:

- `auto-fix`: confirmed, mechanical, low-risk
- `fix`: confirmed and inside the cleanup boundary
- `ask`: user judgment needed or user-visible behavior may change
- `verify-first`: plausible but evidence is incomplete
- `skip-false-positive`: contradicted by code facts
- `skip-not-worth-it`: cost exceeds benefit and current delivery is unaffected
- `reroute`: no longer a simplify problem

## Fix-First Table

Default automatic fixes:

- dead code, unused variable/import, obvious stale comment
- simple duplicate helper, path/version/changelog mismatch
- local magic value replaced by an existing or nearby constant
- obvious O(n*m) lookup converted to map/index with behavior unchanged
- lightweight input shape validation that reuses an existing local pattern

Default ask or reroute:

- auth, XSS, injection, secret, permission, or security boundary
- race condition, data migration, transaction semantics, enum completeness
- more than about 20 lines of new design or more than about 5 touched files
- deleting functionality, changing public API, or user-visible behavior
- finding that disproves the frozen plan, root cause, or acceptance criteria

When decision is `ask`, use `../cc-dev/references/user-choice-output-protocol.md`.
Do not continue automatic edits for findings that change public behavior,
security boundaries, or broad design.
