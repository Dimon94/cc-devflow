# CC-DevFlow v3.0 Migration Guide

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## Overview

This guide helps migrate from CC-DevFlow v2.x to v3.0.

## What's New in v3.0

### New Modules

| Module | ID | Purpose |
|--------|-----|---------|
| Context Injection | RM-015 | Reduce agent context by 70% |
| Quality Gate | RM-016 | Programmatic verification |
| Delta Specs | RM-017 | Incremental change tracking |
| Workspace | RM-018 | Session persistence |
| Spec Guidelines | RM-019 | Unified specifications |
| Flow Simplification | RM-020 | Streamlined workflow |

### New Commands

| Command | Purpose |
|---------|---------|
| `/flow-context` | Manage context injection |
| `/flow-delta` | Manage delta specs |
| `/flow-workspace` | Manage developer workspace |
| `/flow-quality` | Combined quality verification |

### Deprecated Commands

| Old Command | Replacement |
|-------------|-------------|
| `/flow-review` | `/flow-quality --full` |
| `/flow-qa` | `/flow-quality --full` |

**Note**: Deprecated commands still work but show a warning.

## Migration Steps

### Step 1: Update Directory Structure

v3.0 introduces new directories:

```bash
# These are created automatically by v3.0 commands
devflow/specs/          # SSOT for specifications
devflow/workspace/      # Developer workspaces
devflow/spec/           # Unified project specs
```

### Step 2: Initialize Context (Optional)

For existing requirements, initialize context:

```bash
/flow-context init REQ-XXX --type backend
```

### Step 3: Initialize Workspace (Optional)

For session persistence:

```bash
/flow-workspace init
```

### Step 4: Update Workflow

**Before (v2.x)**:
```
/flow-dev → /flow-review → /flow-qa → /flow-release
```

**After (v3.0)**:
```
/flow-dev → /flow-quality → /flow-release
```

## Backward Compatibility

### Preserved Features

- All existing `/flow-*` commands work unchanged
- Existing requirement directories are compatible
- `orchestration_status.json` format unchanged

### Breaking Changes

None. v3.0 is fully backward compatible.

### Deprecation Timeline

| Version | Status |
|---------|--------|
| v3.0 | `/flow-review` and `/flow-qa` deprecated (warning) |
| v4.0 | `/flow-review` and `/flow-qa` removed |

## Configuration Changes

### quality-gates.yml

New configuration file at `.claude/config/quality-gates.yml`:

```yaml
flow-quality:
  quick:
    verify:
      - name: "Lint Check"
        command: "npm run lint"
      - name: "Type Check"
        command: "npm run typecheck"
      - name: "Unit Tests"
        command: "npm test"
```

### Context Templates

New templates at `.claude/docs/templates/context/`:

- `dev.jsonl.template`
- `epic.jsonl.template`
- `prd.jsonl.template`
- etc.

## FAQ

### Q: Do I need to migrate existing requirements?

No. Existing requirements work without changes. New features are opt-in.

### Q: Can I use old and new commands together?

Yes. `/flow-review` and `/flow-quality` can coexist.

### Q: How do I enable context injection?

Run `/flow-context init REQ-XXX` for each requirement you want to enable.

### Q: What if I don't want session persistence?

Don't run `/flow-workspace init`. The feature is opt-in.

## Support

For issues or questions:
- GitHub: https://github.com/anthropics/claude-code/issues
- Documentation: `.claude/CLAUDE.md`

---

**Version**: v3.0.0
**Last Updated**: 2026-02-06
