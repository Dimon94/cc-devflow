---
name: flow-delta
description: Manage delta specs for incremental requirement tracking (RM-017)
version: 4.0.0
---

# /flow:delta

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

Manage incremental specification changes (delta specs) for tracking requirement evolution.
Delta specs capture ADDED/MODIFIED/REMOVED/RENAMED changes that are later applied to the SSOT.

借鉴 OpenSpec 的 Delta Specs 设计，实现增量规格管理。

## Usage

```bash
# Create a new delta spec
/flow:delta create "REQ-123" "add-2fa"

# List all deltas for a requirement
/flow:delta list "REQ-123"

# Apply delta to main specs (PRD.md)
/flow:delta apply "REQ-123" "add-2fa"

# Check delta status
/flow:delta status "REQ-123" "add-2fa"
```

## Subcommands

### create

Create a new delta spec for a requirement.

```bash
/flow:delta create "REQ-123" "add-2fa"
```

Creates:
```
devflow/requirements/REQ-123/
└── deltas/
    └── {YYYY-MM-DD}-add-2fa/
        ├── delta.md
        └── tasks.md
```

**Process**:
1. Validate REQ-ID exists
2. Generate delta_id: `{YYYY-MM-DD}-{slug}`
3. Create directory structure
4. Generate delta.md from template
5. Generate tasks.md for delta-specific tasks

### list

List all deltas for a requirement.

```bash
/flow:delta list "REQ-123"
```

**Output**:
```
Deltas for REQ-123:
  1. 2026-02-01-add-2fa       [approved]  Add 2FA support
  2. 2026-02-05-fix-login     [draft]     Fix login timeout
  3. 2026-02-07-add-oauth     [review]    Add OAuth providers

Total: 3 deltas (1 approved, 1 draft, 1 review)
```

### apply

Apply a delta to the main PRD.md specification.

```bash
/flow:delta apply "REQ-123" "add-2fa"
```

**Process**:
1. Parse delta.md using delta-parser.ts
2. Validate delta status is "approved"
3. Apply changes to PRD.md:
   - RENAMED: Rename requirement headers
   - REMOVED: Remove requirement blocks
   - MODIFIED: Replace requirement content
   - ADDED: Append new requirements
4. Update delta status to "applied"
5. Move to archive/

**Validation**:
- Delta must be in "approved" status
- No duplicate requirements in ADDED
- MODIFIED/REMOVED targets must exist
- RENAMED source must exist, target must not

### status

Check the status of a specific delta.

```bash
/flow:delta status "REQ-123" "add-2fa"
```

**Output**:
```
Delta: 2026-02-01-add-2fa
Status: approved
Created: 2026-02-01T10:00:00Z

Changes:
  ADDED:     2 requirements
  MODIFIED:  1 requirement
  REMOVED:   0 requirements
  RENAMED:   1 requirement

Validation:
  ✓ All ADDED requirements are unique
  ✓ All MODIFIED targets exist
  ✓ All RENAMED sources exist
  ✓ Ready to apply
```

## Delta Spec Format

```markdown
---
delta_id: "2026-02-01-add-2fa"
req_id: "REQ-123"
title: "Add 2FA Support"
created_at: "2026-02-01T10:00:00Z"
status: "draft|review|approved|applied"
---

# Delta: Add 2FA Support

## Summary
Brief description of changes.

## ADDED Requirements

### Requirement: Two-Factor Authentication
Description of the new requirement.

#### Scenario: Enable 2FA
- GIVEN user is logged in
- WHEN user enables 2FA
- THEN system generates QR code

## MODIFIED Requirements

### Requirement: User Login
New description.
(Previously: old description)

## REMOVED Requirements

### Requirement: Legacy Session
**Reason**: Replaced by JWT
**Migration**: Run migration script

## RENAMED Requirements

- FROM: Old Name
- TO: New Name
```

## Status Workflow

```
draft → review → approved → applied
  │       │         │
  │       │         └── /flow:delta apply
  │       │
  │       └── Manual review approval
  │
  └── /flow:delta create
```

## Scripts

| Script | Purpose |
|--------|---------|
| `flow-delta-create.sh` | Create delta directory and files |
| `flow-delta-list.sh` | List all deltas for a requirement |
| `flow-delta-apply.sh` | Apply delta to PRD.md |
| `flow-delta-status.sh` | Check delta status |
| `delta-parser.ts` | Parse and apply delta blocks |

## Integration

### With /flow:spec

When `/flow:spec` modifies existing requirements, it can generate deltas:
```
PRD.md changes → deltas/{date}-{slug}/delta.md
```

### With /flow:release

Before PR creation, `/flow:release` applies all approved deltas:
```bash
/flow:delta apply REQ-XXX --all
```

### With /flow:archive

After release, `/flow:archive` includes applied deltas:
```bash
devflow/archive/{date}-REQ-XXX/deltas/
```

## Directory Structure

```
devflow/requirements/REQ-123/
├── PRD.md                    # Main specification (SSOT)
├── deltas/                   # Delta specs directory
│   ├── 2026-02-01-add-2fa/
│   │   ├── delta.md          # Delta specification
│   │   └── tasks.md          # Delta-specific tasks
│   └── 2026-02-05-fix-login/
│       ├── delta.md
│       └── tasks.md
└── ...

devflow/archive/
└── 2026-02/
    └── REQ-123/
        └── deltas/           # Archived deltas
            └── 2026-02-01-add-2fa/
                └── delta.md
```

## Related

- **Template**: `.claude/docs/templates/DELTA_SPEC_TEMPLATE.md`
- **Parser**: `.claude/scripts/delta-parser.ts`
- **Archive**: `devflow/archive/` - Historical delta specs
