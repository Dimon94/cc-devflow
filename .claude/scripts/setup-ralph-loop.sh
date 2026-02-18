#!/bin/bash

# CC-DevFlow Ralph Loop Setup Script
# Adapted from ralph-wiggum for cc-devflow integration
# Creates state file for Ralph autonomous loop

set -euo pipefail

# ========== Arguments ==========

REQ_ID=""
MAX_ITERATIONS=10
COMPLETION_PROMISE="RALPH_COMPLETE"

# Parse options
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      cat << 'HELP_EOF'
CC-DevFlow Ralph Loop Setup

USAGE:
  setup-ralph-loop.sh REQ_ID [OPTIONS]

ARGUMENTS:
  REQ_ID       Requirement ID (e.g., REQ-123)

OPTIONS:
  --max-iterations <n>           Maximum iterations (default: 10)
  --completion-promise '<text>'  Promise phrase (default: "RALPH_COMPLETE")
  -h, --help                     Show this help

DESCRIPTION:
  Sets up Ralph loop state for CC-DevFlow autonomous development.
  Used by /flow-ralph command.

EXAMPLES:
  setup-ralph-loop.sh REQ-123
  setup-ralph-loop.sh REQ-123 --max-iterations 20
  setup-ralph-loop.sh REQ-123 --completion-promise "ALL_TASKS_DONE"

OUTPUT:
  Creates .claude/ralph-loop.local.md with loop state
HELP_EOF
      exit 0
      ;;
    --max-iterations)
      if [[ -z "${2:-}" ]] || ! [[ "$2" =~ ^[0-9]+$ ]]; then
        echo "❌ Error: --max-iterations requires a positive integer" >&2
        exit 1
      fi
      MAX_ITERATIONS="$2"
      shift 2
      ;;
    --completion-promise)
      if [[ -z "${2:-}" ]]; then
        echo "❌ Error: --completion-promise requires a text argument" >&2
        exit 1
      fi
      COMPLETION_PROMISE="$2"
      shift 2
      ;;
    *)
      if [[ -z "$REQ_ID" ]]; then
        REQ_ID="$1"
        shift
      else
        echo "❌ Error: Unknown argument: $1" >&2
        exit 1
      fi
      ;;
  esac
done

# Validate REQ_ID
if [[ -z "$REQ_ID" ]]; then
  echo "❌ Error: REQ_ID is required" >&2
  echo "" >&2
  echo "   Usage: setup-ralph-loop.sh REQ-123 [OPTIONS]" >&2
  echo "   For help: setup-ralph-loop.sh --help" >&2
  exit 1
fi

if ! [[ "$REQ_ID" =~ ^(REQ|BUG)-[0-9]+$ ]]; then
  echo "❌ Error: Invalid REQ_ID format: $REQ_ID" >&2
  echo "   Expected format: REQ-123 or BUG-456" >&2
  exit 1
fi

# Check if requirement directory exists
REQ_DIR="devflow/requirements/${REQ_ID}"
if [[ ! -d "$REQ_DIR" ]]; then
  echo "❌ Error: Requirement directory not found: $REQ_DIR" >&2
  echo "   Run /flow:init first to create the requirement structure" >&2
  exit 1
fi

# Check if TASKS.md exists
if [[ ! -f "${REQ_DIR}/TASKS.md" ]]; then
  echo "❌ Error: TASKS.md not found in $REQ_DIR" >&2
  echo "   Run /flow:spec first to generate tasks" >&2
  exit 1
fi

# Create state file for stop hook
mkdir -p .claude

# Quote completion promise for YAML if needed
if [[ -n "$COMPLETION_PROMISE" ]] && [[ "$COMPLETION_PROMISE" != "null" ]]; then
  COMPLETION_PROMISE_YAML="\"$COMPLETION_PROMISE\""
else
  COMPLETION_PROMISE_YAML="null"
fi

# Initial prompt for Ralph loop
INITIAL_PROMPT="Continue working on ${REQ_ID}. Use {SKILL:attention} Protocol 3 to refresh attention, then execute the next task in TASKS.md using TDD approach ({SKILL:tdd}). Record errors in ERROR_LOG.md. Output <promise>$COMPLETION_PROMISE</promise> when all tasks are complete."

cat > .claude/ralph-loop.local.md <<EOF
---
active: true
iteration: 1
max_iterations: $MAX_ITERATIONS
completion_promise: $COMPLETION_PROMISE_YAML
req_id: "$REQ_ID"
started_at: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
---

$INITIAL_PROMPT
EOF

# Output setup message
cat <<EOF
🔄 Ralph loop activated for $REQ_ID!

Iteration: 1
Max iterations: $(if [[ $MAX_ITERATIONS -gt 0 ]]; then echo $MAX_ITERATIONS; else echo "unlimited"; fi)
Completion promise: $COMPLETION_PROMISE

The stop hook is now active. When you try to exit, the loop will:
1. Check if all tasks in TASKS.md are complete
2. Check if completion promise is detected
3. If not complete, continue to next iteration

To monitor: head -10 .claude/ralph-loop.local.md
To cancel: /cancel-ralph

⚠️  WARNING: Loop runs until max iterations or all tasks complete.

🔄 Starting autonomous development...
EOF

# Set environment variable for scripts
export RALPH_REQ_ID="$REQ_ID"

exit 0
