---
name: flow-context
description: Manage staged context injection for agents (RM-015)
version: 3.0.0
---

# /flow-context

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

Manage context injection configuration for CC-DevFlow agents.
Each agent type has a JSONL file defining what context to load.

## Usage

```bash
# Initialize context directory for a requirement
/flow-context init [REQ-ID] [--type backend|frontend|fullstack]

# Add entry to context file
/flow-context add [agent] [path] [purpose] [--optional]

# List current context configuration
/flow-context list [agent]

# Validate context paths exist
/flow-context validate [REQ-ID]
```

## Subcommands

### init

Initialize context directory with templates.

```bash
/flow-context init REQ-007 --type backend
```

Creates:
- `devflow/requirements/REQ-007/context/`
- Copies templates from `.claude/docs/templates/context/*.jsonl.template`
- Customizes based on `--type` (backend removes frontend specs, etc.)

### add

Add an entry to a context JSONL file.

```bash
/flow-context add dev "src/utils/auth.ts" "Authentication utilities" --optional
```

Appends to `context/dev.jsonl`:
```json
{"type": "file", "path": "src/utils/auth.ts", "purpose": "Authentication utilities", "optional": true}
```

### list

Show current context configuration.

```bash
/flow-context list dev
```

Output:
```
Context for 'dev' agent (REQ-007):

  1. [file] TASKS.md - Current task list and progress
  2. [file] EPIC.md - Epic overview and phases
  3. [file] TECH_DESIGN.md - Technical implementation guide
  4. [file] ERROR_LOG.md - Previous errors to avoid (optional)
  5. [spec] devflow/spec/frontend/style.md - Frontend style guide (optional)

Total: 5 entries (3 required, 2 optional)
```

### validate

Validate all context paths exist.

```bash
/flow-context validate REQ-007
```

Output:
```
Validating context for REQ-007...

  ✓ dev.jsonl: 5/5 paths valid
  ✓ epic.jsonl: 4/4 paths valid
  ✗ review.jsonl: 3/4 paths valid
    - Missing: contracts/api.yaml

Overall: 12/13 paths valid (92%)
```

## Integration

### With flow-init

When `/flow-init` creates a new requirement, it automatically runs:
```bash
/flow-context init {REQ-ID} --type {detected-type}
```

### With Agent Invocation

The `inject-agent-context.ts` hook automatically:
1. Detects current REQ-ID from environment or git branch
2. Reads `context/{agent}.jsonl`
3. Injects resolved content into agent prompt

## Context Entry Format

```jsonl
{"type": "file", "path": "PRD.md", "purpose": "Product requirements"}
{"type": "directory", "path": "contracts/", "purpose": "API contracts", "depth": 2}
{"type": "spec", "path": "devflow/spec/backend/api.md", "purpose": "API conventions"}
```

### Entry Types

| Type | Path Resolution | Use Case |
|------|-----------------|----------|
| `file` | Relative to requirement dir | Requirement-specific files |
| `directory` | Relative to requirement dir | Load all files in directory |
| `spec` | Relative to project root | Project-level specifications |

### Optional Entries

Add `"optional": true` for files that may not exist:
```json
{"type": "file", "path": "ERROR_LOG.md", "purpose": "Previous errors", "optional": true}
```

## Scripts

- `.claude/scripts/flow-context-init.sh` - Initialize context directory
- `.claude/scripts/flow-context-add.sh` - Add entry to JSONL
- `.claude/scripts/flow-context-validate.sh` - Validate paths

## Related

- **Hook**: `.claude/hooks/inject-agent-context.ts`
- **Types**: `.claude/hooks/types/context-injection.d.ts`
- **Templates**: `.claude/docs/templates/context/*.jsonl.template`
