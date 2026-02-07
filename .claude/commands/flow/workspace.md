---
name: flow-workspace
description: Manage developer workspace and session persistence (RM-018)
version: 3.0.0
---

# /flow-workspace

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

Manage developer workspaces for session persistence.
Enables context recovery across sessions and tracks development progress.

## Usage

```bash
# Initialize workspace for a developer
/flow-workspace init [developer]

# Start session (recover context)
/flow-workspace start

# Record progress to journal
/flow-workspace record "message"

# Switch to different requirement
/flow-workspace switch REQ-XXX
```

## Subcommands

### init

Initialize a workspace for a developer.

```bash
/flow-workspace init dimon
```

Creates:
```
devflow/workspace/dimon/
├── .current-req    # Current requirement ID
├── journal-1.md    # Session journal
└── ...
```

### start

Start a new session, recovering context from previous session.

```bash
/flow-workspace start
```

Process:
1. Read `.current-req` to get current requirement
2. Read latest journal entries
3. Display context summary
4. Ready to continue work

### record

Record progress to the journal.

```bash
/flow-workspace record "Completed T015, starting T016"
```

Appends to current journal file. Creates new journal file when approaching 2000 lines.

### switch

Switch to a different requirement.

```bash
/flow-workspace switch REQ-008
```

Updates `.current-req` and creates a new journal entry.

## Workspace Structure

```
devflow/workspace/
├── index.md            # Active developers list
└── {developer}/
    ├── .current-req    # Current REQ-ID (e.g., "REQ-007")
    ├── journal-1.md    # Session journal (max 2000 lines)
    ├── journal-2.md    # Overflow journal
    └── ...
```

## Journal Format

```markdown
## [2026-02-06 10:30] Session Start

**REQ**: REQ-007
**Phase**: flow-dev
**Task**: T015

### Progress
- Completed: T014 (auth middleware)
- Current: T015 (rate limiting)
- Blocked: None

### Notes
- Discovered edge case in token refresh
- Need to revisit error handling in T016
```

## Integration

### With flow-init

When `/flow-init` creates a new requirement:
```bash
# Auto-update workspace
echo "REQ-XXX" > devflow/workspace/{developer}/.current-req
```

### With flow-dev

During development, progress is automatically recorded:
```bash
/flow-workspace record "Completed T015"
```

### With Attention Refresh

Journal is read at Protocol 3 (Ralph iteration start) to maintain context.

## Scripts

- `.claude/scripts/flow-workspace-init.sh` - Initialize workspace
- `.claude/scripts/flow-workspace-start.sh` - Start session
- `.claude/scripts/flow-workspace-record.sh` - Record progress

## Related

- **Template**: `.claude/docs/templates/JOURNAL_TEMPLATE.md`
- **Index**: `devflow/workspace/index.md`
- **Attention Refresh**: `.claude/skills/flow-attention-refresh/SKILL.md`
