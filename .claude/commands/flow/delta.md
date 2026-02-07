---
name: flow-delta
description: Manage delta specs for incremental requirement tracking (RM-017)
version: 3.0.0
---

# /flow-delta

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

Manage incremental specification changes (delta specs) for tracking requirement evolution.
Delta specs capture ADDED/MODIFIED/REMOVED changes that are later synced to the SSOT.

## Usage

```bash
# Create a new delta spec
/flow-delta create [module] [description]

# Sync delta specs to SSOT
/flow-delta sync [REQ-ID]

# Show diff of all delta specs
/flow-delta diff [REQ-ID]

# Archive delta specs after release
/flow-delta archive [REQ-ID]
```

## Subcommands

### create

Create a new delta spec for a module.

```bash
/flow-delta create auth "Add 2FA support"
```

Creates: `devflow/requirements/REQ-XXX/delta-specs/auth/spec.md`

### sync

Synchronize delta specs to the SSOT (devflow/specs/).

```bash
/flow-delta sync REQ-007
```

Process:
1. Parse all delta-specs in requirement directory
2. Apply ADDED sections to SSOT
3. Apply MODIFIED sections to SSOT
4. Remove REMOVED sections from SSOT
5. Generate sync report

### diff

Show all changes introduced by this requirement.

```bash
/flow-delta diff REQ-007
```

Output:
```
Delta Specs for REQ-007:

auth/spec.md:
  ADDED:
    - JWT-based authentication
    - Refresh token rotation
  MODIFIED:
    - User model (added email index)
  REMOVED:
    - Legacy session table

Total: 2 ADDED, 1 MODIFIED, 1 REMOVED
```

### archive

Archive delta specs after release.

```bash
/flow-delta archive REQ-007
```

Moves: `delta-specs/` → `devflow/archive/{date}-REQ-007/delta-specs/`

## Delta Spec Format

```markdown
---
req_id: "REQ-007"
module: "auth"
created_at: "2026-02-06T10:00:00Z"
version: "1.0.0"
status: "draft"
---

# Delta Spec: auth

## Summary
Brief description of changes.

## Changes

### ADDED
New specifications.

### MODIFIED
Changes to existing specs.
- BEFORE: original
- AFTER: new
- REASON: why

### REMOVED
Deprecated specs.
- REASON: why
- MIGRATION: steps

## Impact Analysis
Affected files and dependencies.
```

## Integration

### With flow-prd

When `/flow-prd` modifies existing modules, it generates delta-specs:
```
PRD.md changes → delta-specs/{module}/spec.md
```

### With flow-release

Before PR creation, `/flow-release` runs:
```bash
/flow-delta sync REQ-XXX
```

### With flow-archive

After release, `/flow-archive` includes:
```bash
/flow-delta archive REQ-XXX
```

## Scripts

- `.claude/scripts/flow-delta-create.sh` - Create delta spec
- `.claude/scripts/flow-delta-sync.sh` - Sync to SSOT
- `.claude/scripts/flow-delta-diff.sh` - Show changes
- `.claude/scripts/flow-delta-archive.sh` - Archive after release

## Related

- **SSOT**: `devflow/specs/` - Single Source of Truth
- **Template**: `.claude/docs/templates/DELTA_SPEC_TEMPLATE.md`
- **Archive**: `devflow/archive/` - Historical delta specs
