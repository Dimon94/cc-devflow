#!/usr/bin/env bash

# Check task completion status in TASKS.md
#
# This script checks the status of tasks in TASKS.md and provides
# progress information.
#
# Usage: ./check-task-status.sh [TASK_ID] [OPTIONS]
#
# ARGUMENTS:
#   TASK_ID             Optional specific task ID to check (e.g., T001)
#
# OPTIONS:
#   --json              Output in JSON format
#   --verbose           Show detailed task information
#   --help, -h          Show help message
#
# EXAMPLES:
#   ./check-task-status.sh              # Show overall progress
#   ./check-task-status.sh T001         # Check specific task
#   ./check-task-status.sh --json       # JSON output
#   ./check-task-status.sh --verbose    # Detailed task list

set -e

# Parse command line arguments
TASK_ID=""
JSON_MODE=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --json)
            JSON_MODE=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            cat << 'EOF'
Usage: check-task-status.sh [TASK_ID] [OPTIONS]

Check task completion status in TASKS.md.

ARGUMENTS:
  TASK_ID             Optional specific task ID to check (e.g., T001)

OPTIONS:
  --json              Output results in JSON format
  --verbose, -v       Show detailed task information
  --help, -h          Show this help message

EXAMPLES:
  # Show overall progress
  ./check-task-status.sh

  # Check specific task status
  ./check-task-status.sh T001

  # JSON output for automation
  ./check-task-status.sh --json

  # Detailed task list
  ./check-task-status.sh --verbose

OUTPUT:
  - Overall progress (completed vs remaining)
  - Phase breakdown
  - Next pending task
  - Specific task status (if TASK_ID provided)

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

# Normalize task ID to uppercase if provided
if [[ -n "$TASK_ID" ]]; then
    TASK_ID=$(echo "$TASK_ID" | tr '[:lower:]' '[:upper:]')

    # Validate task ID format
    if [[ ! "$TASK_ID" =~ ^T[0-9]+$ ]]; then
        echo "ERROR: Invalid task ID format: $TASK_ID" >&2
        echo "Expected format: T001, T002, T003..." >&2
        exit 1
    fi
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

# Count tasks
TOTAL_INCOMPLETE=$(grep -c "^\- \[ \]" "$TASKS_FILE" 2>/dev/null || echo "0")
TOTAL_COMPLETE=$(grep -c "^\- \[x\]" "$TASKS_FILE" 2>/dev/null || echo "0")
TOTAL_TASKS=$((TOTAL_INCOMPLETE + TOTAL_COMPLETE))

# Calculate percentage
if [[ $TOTAL_TASKS -gt 0 ]]; then
    PERCENTAGE=$((TOTAL_COMPLETE * 100 / TOTAL_TASKS))
else
    PERCENTAGE=0
fi

# If specific task requested, check its status
if [[ -n "$TASK_ID" ]]; then
    if grep -q "^\- \[x\] .*$TASK_ID" "$TASKS_FILE"; then
        STATUS="complete"
        TASK_LINE=$(grep "^\- \[x\] .*$TASK_ID" "$TASKS_FILE" | head -1)
    elif grep -q "^\- \[ \] .*$TASK_ID" "$TASKS_FILE"; then
        STATUS="pending"
        TASK_LINE=$(grep "^\- \[ \] .*$TASK_ID" "$TASKS_FILE" | head -1)
    else
        STATUS="not_found"
        TASK_LINE=""
    fi

    if $JSON_MODE; then
        printf '{"task_id":"%s","status":"%s","task_line":"%s"}\n' \
            "$TASK_ID" "$STATUS" "$TASK_LINE"
    else
        case "$STATUS" in
            complete)
                echo "✅ Task $TASK_ID is complete"
                echo "   $TASK_LINE"
                ;;
            pending)
                echo "⏳ Task $TASK_ID is pending"
                echo "   $TASK_LINE"
                ;;
            not_found)
                echo "❌ Task $TASK_ID not found"
                exit 1
                ;;
        esac
    fi
    exit 0
fi

# Find next pending task
NEXT_TASK=$(grep "^\- \[ \]" "$TASKS_FILE" | head -1 || echo "")
if [[ -n "$NEXT_TASK" ]]; then
    # Extract task ID from line (matches T001, T002, etc.)
    NEXT_TASK_ID=$(echo "$NEXT_TASK" | grep -o 'T[0-9]\+' | head -1)
else
    NEXT_TASK_ID=""
fi

# Get phase breakdown - ensure all values are clean integers
if grep -q "^## Phase 1:" "$TASKS_FILE" 2>/dev/null; then
    PHASE_1_TOTAL=$(grep "^## Phase 1:" -A 100 "$TASKS_FILE" | grep -c "^\- \[")
    PHASE_1_COMPLETE=$(grep "^## Phase 1:" -A 100 "$TASKS_FILE" | grep "^\- \[x\]" | wc -l | tr -d ' \n')
else
    PHASE_1_TOTAL=0
    PHASE_1_COMPLETE=0
fi

if grep -q "^## Phase 2:" "$TASKS_FILE" 2>/dev/null; then
    PHASE_2_TOTAL=$(grep "^## Phase 2:" -A 100 "$TASKS_FILE" | grep -c "^\- \[")
    PHASE_2_COMPLETE=$(grep "^## Phase 2:" -A 100 "$TASKS_FILE" | grep "^\- \[x\]" | wc -l | tr -d ' \n')
else
    PHASE_2_TOTAL=0
    PHASE_2_COMPLETE=0
fi

if grep -q "^## Phase 3:" "$TASKS_FILE" 2>/dev/null; then
    PHASE_3_TOTAL=$(grep "^## Phase 3:" -A 100 "$TASKS_FILE" | grep -c "^\- \[")
    PHASE_3_COMPLETE=$(grep "^## Phase 3:" -A 100 "$TASKS_FILE" | grep "^\- \[x\]" | wc -l | tr -d ' \n')
else
    PHASE_3_TOTAL=0
    PHASE_3_COMPLETE=0
fi

# Output results
if $JSON_MODE; then
    # JSON output
    printf '{"req_id":"%s","total_tasks":%d,"completed":%d,"remaining":%d,"percentage":%d,"next_task_id":"%s","phases":{"phase_1":{"total":%d,"complete":%d},"phase_2":{"total":%d,"complete":%d},"phase_3":{"total":%d,"complete":%d}}}\n' \
        "$REQ_ID" "$TOTAL_TASKS" "$TOTAL_COMPLETE" "$TOTAL_INCOMPLETE" "$PERCENTAGE" "$NEXT_TASK_ID" \
        "$PHASE_1_TOTAL" "$PHASE_1_COMPLETE" \
        "$PHASE_2_TOTAL" "$PHASE_2_COMPLETE" \
        "$PHASE_3_TOTAL" "$PHASE_3_COMPLETE"
else
    # Human-readable output
    echo "Task Status for $REQ_ID"
    echo "════════════════════════════════════════"
    echo ""
    echo "Overall Progress:"
    echo "  ✅ Completed: $TOTAL_COMPLETE"
    echo "  ⏳ Remaining: $TOTAL_INCOMPLETE"
    echo "  📊 Progress:  $PERCENTAGE%"
    echo ""

    if [[ -n "$NEXT_TASK_ID" ]]; then
        echo "Next Task: $NEXT_TASK_ID"
        echo "  $NEXT_TASK"
        echo ""
    else
        echo "🎉 All tasks complete!"
        echo ""
    fi

    # Phase breakdown
    if [[ $PHASE_1_TOTAL -gt 0 || $PHASE_2_TOTAL -gt 0 || $PHASE_3_TOTAL -gt 0 ]]; then
        echo "Phase Breakdown:"
        if [[ $PHASE_1_TOTAL -gt 0 ]]; then
            echo "  Phase 1 (Setup):          $PHASE_1_COMPLETE / $PHASE_1_TOTAL"
        fi
        if [[ $PHASE_2_TOTAL -gt 0 ]]; then
            echo "  Phase 2 (Tests First):    $PHASE_2_COMPLETE / $PHASE_2_TOTAL"
        fi
        if [[ $PHASE_3_TOTAL -gt 0 ]]; then
            echo "  Phase 3 (Implementation): $PHASE_3_COMPLETE / $PHASE_3_TOTAL"
        fi
        echo ""
    fi

    # Verbose mode: show all tasks
    if $VERBOSE; then
        echo "All Tasks:"
        echo "────────────────────────────────────────"
        grep "^\- \[" "$TASKS_FILE"
    fi
fi