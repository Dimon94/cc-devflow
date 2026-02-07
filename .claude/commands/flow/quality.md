---
name: flow-quality
description: Combined quality verification (replaces flow-review + flow-qa)
version: 3.0.0
---

# /flow-quality

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

Combined quality verification command that replaces the separate `/flow-review` and `/flow-qa` commands.
Provides both quick programmatic verification and full comprehensive review.

## Usage

```bash
# Quick mode (default) - programmatic verification only
/flow-quality [REQ-ID]

# Full mode - comprehensive review including spec compliance
/flow-quality [REQ-ID] --full
```

## Modes

### Quick Mode (Default)

Fast programmatic verification using quality-gates.yml:

1. **Lint Check** - `npm run lint`
2. **Type Check** - `npm run typecheck`
3. **Unit Tests** - `npm test`

**Use Case**: Rapid iteration during development, CI/CD pipelines.

**Duration**: ~1-2 minutes

### Full Mode (`--full`)

Comprehensive review including:

1. **Programmatic Checks** (same as quick mode)
2. **Spec Compliance Review** - Verify implementation matches PRD/TECH_DESIGN
3. **Code Quality Review** - Structure, patterns, Constitution compliance
4. **Security Scan** - `npm audit`, secret detection
5. **Integration Tests** - `npm run test:integration` (if available)

**Use Case**: Before PR creation, milestone completion.

**Duration**: ~5-10 minutes

## Entry Gate

```yaml
prerequisites:
  - development_complete: true
  - TASKS.md: All tasks marked [x]
  - Tests: All passing
```

## Exit Gate

### Quick Mode
```yaml
exit_criteria:
  - lint: pass
  - typecheck: pass
  - tests: pass
```

### Full Mode
```yaml
exit_criteria:
  - lint: pass
  - typecheck: pass
  - tests: pass
  - spec_review: PASS
  - code_quality: PASS
  - security: no high-severity issues
```

## Output

### Quick Mode
```
✅ Quality Gate PASSED (Quick Mode)

  ✓ Lint Check
  ✓ Type Check
  ✓ Unit Tests (42 passed)

Duration: 1m 23s
```

### Full Mode
```
✅ Quality Gate PASSED (Full Mode)

Programmatic Checks:
  ✓ Lint Check
  ✓ Type Check
  ✓ Unit Tests (42 passed)
  ✓ Integration Tests (8 passed)

Reviews:
  ✓ Spec Compliance: PASS
  ✓ Code Quality: PASS
  ✓ Security: No issues

Reports Generated:
  - SPEC_REVIEW.md
  - CODE_QUALITY_REVIEW.md
  - SECURITY_REPORT.md

Duration: 7m 45s
```

## Integration

### With flow-dev

After `/flow-dev` completes, the orchestrator recommends:
```
status: "development_complete"
  → Recommend: /flow-quality (quick verification)
  → Alternative: /flow-quality --full (comprehensive review)
```

### With flow-release

`/flow-release` requires quality gate to pass:
```yaml
flow-release:
  prerequisites:
    - quality_complete: true
```

## Deprecation Notice

The following commands are deprecated in v3.0:

- `/flow-review` → Use `/flow-quality --full`
- `/flow-qa` → Use `/flow-quality --full`

These commands still work for backward compatibility but will show a deprecation warning.

## Scripts

- `.claude/scripts/flow-quality-quick.sh` - Quick verification
- `.claude/scripts/flow-quality-full.sh` - Full verification
- `.claude/scripts/run-quality-gates.sh` - Core gate execution

## Related

- **Config**: `.claude/config/quality-gates.yml`
- **Error Log**: `ERROR_LOG.md` (errors recorded here)
- **Orchestrator**: Updates `orchestration_status.json` on completion
