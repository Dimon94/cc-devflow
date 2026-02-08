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
/flow-workspace start [REQ-XXX|BUG-XXX]
/flow-workspace start REQ-XXX --switch
/flow-workspace start BUG-XXX --switch --cd  # 需 source/eval 场景

# Record progress to journal
/flow-workspace record "message"

# Switch to different requirement
/flow-workspace switch REQ-XXX
/flow-workspace switch BUG-XXX --cd            # 需 source/eval 场景
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
/flow-workspace start REQ-008 --switch
/flow-workspace start BUG-008 --switch
```

Process:
1. Read `.current-req` to get current requirement
2. Read latest journal entries
3. 校验并显示期望 worktree 路径（提示是否在正确目录）
4. Display context summary
5. Ready to continue work

可选行为:
- 传入 `REQ-XXX/BUG-XXX` 会先更新 `.current-req` 再恢复上下文
- `--switch` 输出切换建议；`--cd` 在脚本被 `source` 时可直接切换目录

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
/flow-workspace switch REQ-008 --cd
```

Updates `.current-req` and creates a new journal entry.
如果存在对应 worktree，建议立即切换到：
```bash
cd "$(bash .claude/skills/domain/using-git-worktrees/scripts/worktree-switch.sh REQ-008)"
```

更便捷的一步切换:
```bash
eval "$(bash .claude/scripts/flow-workspace-switch.sh REQ-008 --print-cd)"
# 或
source .claude/scripts/flow-workspace-switch.sh REQ-008 --cd
```

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

When `/flow-init` creates a new requirement (and workspace already initialized):
```bash
# Auto-update workspace
echo "REQ-XXX" > devflow/workspace/{developer}/.current-req
```

`/flow-workspace start` 会基于 REQ-ID 推导期望 worktree 路径：
`../{repo-name}-{REQ_ID}`，并提示是否已在正确 worktree。

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
- `.claude/scripts/flow-workspace-switch.sh` - Switch REQ pointer and worktree action

## Related

- **Template**: `.claude/docs/templates/JOURNAL_TEMPLATE.md`
- **Index**: `devflow/workspace/index.md`
- **Attention Refresh**: `.claude/skills/flow-attention-refresh/SKILL.md`
