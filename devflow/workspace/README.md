# devflow/workspace/ - Developer Session Persistence

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

This directory provides **session persistence** for developers.
Each developer has a workspace that tracks their current work and maintains a journal.

## Structure

```
workspace/
├── README.md           # This file
├── index.md            # Active developers list
└── {developer}/        # e.g., dimon/, alice/
    ├── .current-req    # Current requirement ID (e.g., "REQ-007")
    ├── journal-1.md    # Session journal (max 2000 lines)
    ├── journal-2.md    # Overflow journal
    └── ...
```

## Journal Format

```markdown
## [YYYY-MM-DD HH:MM] Session Start

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

## Workflow

1. **Session Start**: `/flow-workspace start` reads `.current-req` and latest journal
2. **During Work**: Progress is automatically appended to journal
3. **Session End**: Journal captures final state for next session

## Integration

- **Context Injection (RM-015)**: Workspace context injected on session start
- **Attention Refresh**: Journal read at Protocol 3 (Ralph iteration start)
- **Error Recovery**: Journal helps resume after interruption

---

**Created**: 2026-02-06
**Version**: v3.0.0 (OpenSpec × Trellis)
