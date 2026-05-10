# E2E and Plugin Verification

Use this reference when implementation review touches UI, browser behavior, desktop app behavior, local app flows, CLI runtime, logs, or Codex plugin interactions.

## Applicability

Run this pass when any of these are true:

- frontend/UI files changed
- user-visible interaction changed
- route, API, or CLI output changed
- background job or log-based progress changed
- user asked to use Browser, Computer Use, or Codex plugins
- plan claims UI and implementation are consistent

Skip with reason for backend-only, docs-only, or pure planning reviews.

## Evidence Chain

Each affected path becomes a review node. Do not claim E2E/plugin review is done until each selected path is checked, skipped, or blocked.

1. Identify the user path:
   - page, route, command, app screen, or plugin operation
   - expected visible result
   - logs or artifacts that prove backend behavior
2. Start the smallest safe runtime:
   - use repo scripts when available
   - avoid production spend unless explicitly required
   - record blocked env vars or missing services
3. Use the right tool:
   - Browser plugin for local web targets and screenshots
   - Computer Use plugin for native desktop apps or real app UI
   - shell/CLI for commands and logs
4. Click or run every affected primary action.
5. Check:
   - visible result
   - console/errors/logs
   - persisted artifact or backend state
   - empty/error/loading states when applicable

## UI Verification Checklist

For each changed flow:

```text
FLOW
├── page opened
├── primary action clicked
├── expected UI state observed
├── error/empty/loading state checked or explicitly skipped
├── console/log checked
└── backend artifact/log checked when relevant
```

## Plugin Verification Checklist

When Codex plugins are part of the expected path:

- confirm the plugin exists in the current environment
- use Browser for localhost/file targets instead of shell-only inspection
- use Computer Use for desktop app interactions
- record if plugin access is unavailable and what verification replaced it
- never claim end-to-end UI proof from code inspection alone

## Report Format

Add an E2E section to `cc-review-report.md`:

```markdown
## E2E / Plugin Evidence

| Flow | Tool | Evidence | Result |
| --- | --- | --- | --- |
| ... | Browser / Computer Use / CLI | screenshot, log, command, artifact | pass / fail / blocked |
```

Also append one ledger record per flow so a later review can skip unchanged flows or re-open only changed flows.

If blocked, include:

- missing dependency
- command attempted
- exact error or missing tool
- fallback evidence
- whether this blocks `cc-check`
