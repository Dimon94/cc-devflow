# <date> <change-key> Postmortem

## Progressive Disclosure Index

- Default read: Summary, Search Tags, Prevention Summary, Git Evidence.
- Open for recurrence: Root Cause, AI Failure Mode, Why It Escaped.
- Open for audit: Timeline, Verification Evidence, Follow-up Actions.

## Summary

- Change:
- Incident / failure:
- Severity: low / medium / high
- Impact:
- Current status: repaired / mitigated / deferred / monitoring
- Owner:

## Search Tags

- Capabilities:
- Modules:
- Failure class:
- Model-risk tags:
- Related principles:

## Prevention Summary

- Do this next time:
- Do not do this next time:
- Planning reminder:
- Investigation reminder:
- Execution reminder:
- Ship reminder:

## Git Evidence

- Base branch:
- Working branch:
- Base SHA:
- Head SHA:
- Review range:
- Relevant commits:
- PR / handoff:
- Dirty-tree notes:
- Commands used:
  - `git status -sb`
  - `git log --oneline --decorate -n 12`
  - `git diff --stat <base>...HEAD`

## Timeline

| Time | Event | Evidence |
| --- | --- | --- |
|  |  |  |

## Root Cause

- Confirmed root cause:
- Broken contract:
- Rejected near-causes:
- Why symptom-site fix was insufficient:

## AI Failure Mode

- Model limitation:
- Bad default behavior observed:
- Missing evidence or professional rule:
- Countermeasure:

## Why It Escaped

- Planning gap:
- Investigation gap:
- Execution gap:
- Review / verification gap:
- Ship / handoff gap:

## Verification Evidence

| Command / artifact | Result | Key observation |
| --- | --- | --- |
|  |  |  |

## Follow-up Actions

| Type | Action | Owner | Target |
| --- | --- | --- | --- |
| root-cause-fix / detection / docs / backlog / principle |  |  |  |

## Principle Extraction

- Promote to `principles.md`: yes / no
- Principle title:
- Search terms:
- Incident file linked from `INDEX.md`: yes / no
