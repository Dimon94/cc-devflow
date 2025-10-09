#!/usr/bin/env bash

# Mark a task as complete in TASKS.md
#
# This script marks a task as complete by updating the checkbox in TASKS.md
# and optionally logging the completion event.
#
# Usage: ./mark-task-complete.sh TASK_ID [OPTIONS]
#
# ARGUMENTS:
#   TASK_ID             Task ID to mark as complete (e.g., T001, T002)
#
# OPTIONS:
#   --json              Output in JSON format
#   --no-log            Don't log to EXECUTION_LOG.md
#   --help, -h          Show help message
#
# EXAMPLES:
#   ./mark-task-complete.sh T001
#   ./mark-task-complete.sh T005 --json
#   ./mark-task-complete.sh T010 --no-log

set -e

# Parse command line arguments
TASK_ID=""
JSON_MODE=false
NO_LOG=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --json)
            JSON_MODE=true
            shift
            ;;
        --no-log)
            NO_LOG=true
            shift
            ;;
        --help|-h)
            cat << 'EOF'
Usage: mark-task-complete.sh TASK_ID [OPTIONS]

Mark a task as complete in TASKS.md.

ARGUMENTS:
  TASK_ID             Task ID to mark as complete (e.g., T001, T002)

OPTIONS:
  --json              Output results in JSON format
  --no-log            Don't log to EXECUTION_LOG.md
  --help, -h          Show this help message

EXAMPLES:
  # Mark T001 as complete
  ./mark-task-complete.sh T001

  # Mark T005 as complete with JSON output
  ./mark-task-complete.sh T005 --json

  # Mark T010 as complete without logging
  ./mark-task-complete.sh T010 --no-log

NOTES:
  - Task ID format: T001, T002, T003... (case insensitive)
  - Marks checkbox as [x] in TASKS.md
  - Logs completion to EXECUTION_LOG.md (unless --no-log)
  - Returns error if task not found or already complete

EOF
            exit 0
            ;;
        -*)
            echo "ERROR: Unknown option '$1'. Use --help for usage information." >&2
            exit 1
            ;;
        *)
            if [[ -z "$TASK_ID" ]]; then
                TASK_ID="$1"
            else
                echo "ERROR: Too many arguments. Use --help for usage information." >&2
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate task ID provided
if [[ -z "$TASK_ID" ]]; then
    echo "ERROR: Task ID is required" >&2
    echo "Usage: mark-task-complete.sh TASK_ID [OPTIONS]" >&2
    exit 1
fi

# Normalize task ID to uppercase
TASK_ID=$(echo "$TASK_ID" | tr '[:lower:]' '[:upper:]')

# Validate task ID format (T + digits)
if [[ ! "$TASK_ID" =~ ^T[0-9]+$ ]]; then
    echo "ERROR: Invalid task ID format: $TASK_ID" >&2
    echo "Expected format: T001, T002, T003..." >&2
    exit 1
fi

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Get all paths
eval $(get_requirement_paths)

# Validate requirement ID exists
if [[ -z "$REQ_ID" ]]; then
    echo "ERROR: No requirement ID found" >&2
    echo "Please ensure you are on a feature branch (feature/REQ-XXX-title)" >&2
    echo "Or set DEVFLOW_REQ_ID environment variable" >&2
    exit 1
fi

# Validate requirement directory exists
if [[ ! -d "$REQ_DIR" ]]; then
    echo "ERROR: Requirement directory not found: $REQ_DIR" >&2
    exit 1
fi

# Check for TASKS.md file
TASKS_FILE="$REQ_DIR/TASKS.md"
if [[ ! -f "$TASKS_FILE" ]]; then
    echo "ERROR: TASKS.md not found at $TASKS_FILE" >&2
    echo "Run planner agent first to create tasks." >&2
    exit 1
fi

# Check if task exists in TASKS.md
if ! grep -q "\\[ \\] .*$TASK_ID" "$TASKS_FILE"; then
    # Check if already completed
    if grep -q "\\[x\\] .*$TASK_ID" "$TASKS_FILE"; then
        if $JSON_MODE; then
            printf '{"status":"already_complete","task_id":"%s","message":"Task %s is already marked as complete"}\n' "$TASK_ID" "$TASK_ID"
        else
            echo "Task $TASK_ID is already marked as complete"
        fi
        exit 0
    else
        echo "ERROR: Task $TASK_ID not found in $TASKS_FILE" >&2
        exit 1
    fi
fi

# Mark task as complete (replace [ ] with [x] for this task)
# Use temporary file to avoid in-place editing issues
TMP_FILE=$(mktemp)

# Use sed to replace the first occurrence of [ ] followed by task ID with [x]
# This pattern matches: "- [ ] **T001**" or "- [ ] T001" etc.
sed "s/- \[ \] \(\*\*\)\{0,1\}$TASK_ID\(\*\*\)\{0,1\}/- [x] \1$TASK_ID\2/" "$TASKS_FILE" > "$TMP_FILE"

# Check if replacement was successful
if grep -q "\\[x\\] .*$TASK_ID" "$TMP_FILE"; then
    mv "$TMP_FILE" "$TASKS_FILE"

    # Log the event
    if ! $NO_LOG; then
        TIMESTAMP=$(get_beijing_time_iso)
        log_event "$REQ_ID" "✅ Task $TASK_ID marked as complete"
    fi

    # Output success
    if $JSON_MODE; then
        printf '{"status":"success","task_id":"%s","message":"Task %s marked as complete","timestamp":"%s"}\n' \
            "$TASK_ID" "$TASK_ID" "$(get_beijing_time_iso)"
    else
        echo "✅ Task $TASK_ID marked as complete"
    fi
else
    rm "$TMP_FILE"
    echo "ERROR: Failed to mark task $TASK_ID as complete" >&2
    exit 1
fi

# Count remaining tasks
TOTAL_TASKS=$(grep -c "^\- \[ \]" "$TASKS_FILE" 2>/dev/null || echo "0")
COMPLETED_TASKS=$(grep -c "^\- \[x\]" "$TASKS_FILE" 2>/dev/null || echo "0")

# Show progress if not in JSON mode
if ! $JSON_MODE; then
    echo ""
    echo "Progress: $COMPLETED_TASKS completed, $TOTAL_TASKS remaining"

    # Calculate percentage
    if [[ $((TOTAL_TASKS + COMPLETED_TASKS)) -gt 0 ]]; then
        PERCENTAGE=$((COMPLETED_TASKS * 100 / (TOTAL_TASKS + COMPLETED_TASKS)))
        echo "Overall: $PERCENTAGE% complete"
    fi
fi