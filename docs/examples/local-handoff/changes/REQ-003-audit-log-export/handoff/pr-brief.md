# PR Brief

## Change

- Change key: REQ-003-audit-log-export
- Branch: REQ/003-audit-log-export

## Task Summary

- Done: audit log export handoff example

## Validation

- Command: example binding check
- Result: pass

## Release Readiness

| Gate | Status | Evidence / reason | Rollback / watch |
|------|--------|-------------------|------------------|
| Local quality | passed | example binding check | rerun `npm run verify:examples` |
| Runtime config | not-applicable | documentation-only example | no runtime config change |
| Migrations / data | not-applicable | no data shape change | no migration rollback needed |
| Deploy / health | not-applicable | local handoff example is not deployed | verify in target repo before release |
| Smoke / cleanup | not-applicable | no smoke data is created | no cleanup needed |
| Rollback / watch | passed | revert this example doc change | watch example binding drift |

## Issue Closeout

- Closed now: none
- Close on merge: none
- Related only: none
- Blocked / manual: none
- Reason: local handoff example has no tracker issue in scope

## PR Body Draft

```markdown
## Summary

- Demonstrates local handoff with `task.md` and this PR brief.

## Validation

- Example files are checked by `docs/examples/scripts/check-example-bindings.sh`.

## Issue Closeout

- No tracker issue is in scope for this example; do not add closing keywords.

## Risk / Rollback

- Documentation-only example.
```
