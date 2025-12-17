# Release Plan: REQ-004 - Agent Adapter Architecture

**Status**: Ready for Release
**Date**: 2025-12-17T17:59:00Z
**Branch**: feature/REQ-004-agent-adapter-architecture

---

## 1. Scope Overview

### What's Changing
Introducing the Agent Adapter Architecture to enable cc-devflow to run across multiple AI agent platforms (Claude Code + Codex CLI) with a unified interface.

### Key Components
| Component | File | Purpose |
|-----------|------|---------|
| AgentAdapter Interface | `lib/adapters/adapter-interface.js` | Abstract contract for adapters |
| AdapterRegistry | `lib/adapters/registry.js` | Singleton for discovery/selection |
| ClaudeAdapter | `lib/adapters/claude-adapter.js` | Default adapter for Claude Code |
| CodexAdapter | `lib/adapters/codex-adapter.js` | MVP adapter for Codex CLI |
| Config Validator | `lib/adapters/config-validator.js` | Zod-based config validation |
| Structured Logger | `lib/adapters/logger.js` | JSON observability logging |
| CLI Entry | `bin/cc-devflow.js` | Unified command entry point |

### Configuration Files
- `config/adapters.yml` — Default secure configuration
- `config/schema/adapters.schema.json` — JSON Schema definition

---

## 2. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Claude Code regression | LOW | HIGH | Tests verify existing behavior |
| Codex CLI incomplete | MEDIUM | LOW | MVP scope documented |
| Security policy bypass | LOW | HIGH | Capability model + tests |

---

## 3. Quality Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Tests | ✅ PASS | 11/11 tests passing |
| Security | ✅ PASS | SECURITY_REPORT.md — 0 issues |
| Constitution | ✅ PASS | validate-constitution.sh — 0 errors |
| TDD Compliance | ✅ PASS | Phase 2 tests before implementation |

---

## 4. Rollback Strategy

**Trigger Conditions**:
- Claude Code commands fail after merge
- Security policy not enforced correctly

**Rollback Steps**:
1. Revert merge commit: `git revert <merge-sha>`
2. Force default adapter: Set `preferred: "claude"` in config
3. Disable registry: Direct claude-code CLI calls

---

## 5. Monitoring Plan

### Key Metrics (Post-Release)
- Adapter detection latency (target: <50ms)
- CLI command success rate
- Security policy enforcement rate

### Observability
- Structured JSON logs via `lib/adapters/logger.js`
- Detection timing in log entries

---

## 6. Dependencies

### Upstream
- None (new standalone module)

### Downstream
- Future commands will use Registry for multi-platform support

---

## 7. Merge Blockers

> [!IMPORTANT]
> This PR is **BLOCKED** until the following requirements are complete.

| Requirement | Status | Description |
|-------------|--------|-------------|
| RM-007 | Pending | TBD |
| RM-008 | Pending | TBD |
| RM-009 | Pending | TBD |

### Branching Strategy

Subsequent requirements should branch **FROM this branch**, not from `main`:

```
main
  └── feature/REQ-004-agent-adapter-architecture (base)
       ├── feature/RM-007-xxx
       ├── feature/RM-008-xxx
       └── feature/RM-009-xxx
```

**Merge Order**:
1. Complete RM-007, RM-008, RM-009 on child branches
2. Merge child branches into REQ-004 branch (or use stacked PRs)
3. Final merge of REQ-004 into `main`

---

## 8. Release Checklist

- [x] All tests passing
- [x] Security review complete
- [x] Constitution validation passed
- [x] TASKS.md all items complete
- [x] EPIC.md status = Complete
- [ ] Git changes committed
- [ ] Branch pushed to remote
- [ ] PR created

---

## 8. PR Description Draft

```markdown
## REQ-004: Agent Adapter Architecture

### Summary
Introduces pluggable adapter architecture for cross-platform agent support.

### Changes
- New `lib/adapters/` module with Registry, Interface, and 2 adapters
- CLI entry point at `bin/cc-devflow.js`
- Secure defaults with capability-based access control

### Testing
- 11 unit tests covering registry, security, and performance
- `npm test` — all passing

### Security
- Default deny for shell/network capabilities
- Zod config validation
- No hardcoded secrets (verified)

### Verification
```bash
npm install
npm test
node bin/cc-devflow.js
```

### Related
- PRD: devflow/requirements/REQ-004/PRD.md
- Tech Design: devflow/requirements/REQ-004/TECH_DESIGN.md
- Security Report: devflow/requirements/REQ-004/SECURITY_REPORT.md
```
