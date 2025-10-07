#!/usr/bin/env bash

# Sync task completion marks in TASKS.md
#
# This script helps fix situations where tasks were executed but not marked
# as complete in TASKS.md. It can detect and optionally fix such cases.
#
# Usage: ./sync-task-marks.sh [OPTIONS]
#
# OPTIONS:
#   --dry-run           Show what would be done without making changes
#   --auto-mark         Automatically mark all uncompleted tasks (dangerous!)
#   --help, -h          Show help message
#
# EXAMPLES:
#   ./sync-task-marks.sh --dry-run
#   ./sync-task-marks.sh

set -e

# Parse command line arguments
DRY_RUN=false
AUTO_MARK=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --auto-mark)
            AUTO_MARK=true
            shift
            ;;
        --help|-h)
            cat << 'EOF'
Usage: sync-task-marks.sh [OPTIONS]

Sync task completion marks in TASKS.md.

OPTIONS:
  --dry-run           Show what would be done without making changes
  --auto-mark         Automatically mark tasks (use with caution!)
  --help, -h          Show this help message

EXAMPLES:
  # Check status without changes
  ./sync-task-marks.sh --dry-run

  # Interactive mode (default)
  ./sync-task-marks.sh

NOTES:
  - This script helps diagnose when tasks are done but not marked in TASKS.md
  - It lists all uncompleted tasks ([ ] in TASKS.md)
  - You can then manually run mark-task-complete.sh for each task
  - Or use --auto-mark to mark all (not recommended without review)

EOF
            exit 0
            ;;
        -*)
            echo "ERROR: Unknown option '$1'. Use --help for usage information." >&2
            exit 1
            ;;
        *)
            echo "ERROR: Unexpected argument '$1'. Use --help for usage information." >&2
            exit 1
            ;;
    esac
done

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
    exit 1
fi

echo "🔍 Checking task completion status for $REQ_ID..."
echo ""

# Count total tasks
TOTAL_TASKS=$(grep -c "^- \[ \]" "$TASKS_FILE" 2>/dev/null || echo "0")
COMPLETED_TASKS=$(grep -c "^- \[x\]" "$TASKS_FILE" 2>/dev/null || echo "0")
ALL_TASKS=$((TOTAL_TASKS + COMPLETED_TASKS))

echo "Task Summary:"
echo "  Total tasks:     $ALL_TASKS"
echo "  Completed:       $COMPLETED_TASKS"
echo "  Remaining:       $TOTAL_TASKS"
echo ""

if [[ $TOTAL_TASKS -eq 0 ]]; then
    echo "✅ All tasks are marked as complete!"
    exit 0
fi

echo "⚠️  Uncompleted tasks (still marked as [ ]):"
echo ""

# Extract all uncompleted tasks
UNCOMPLETED=()
while IFS= read -r line; do
    # Extract task ID from line like "- [ ] **T001** Description"
    if [[ "$line" =~ \*\*T([0-9]+)\*\* ]]; then
        task_id="T${BASH_REMATCH[1]}"
        UNCOMPLETED+=("$task_id")
        echo "  [ ] $task_id: $line"
    elif [[ "$line" =~ T([0-9]+) ]]; then
        task_id="T${BASH_REMATCH[1]}"
        UNCOMPLETED+=("$task_id")
        echo "  [ ] $task_id: $line"
    fi
done < <(grep "^- \[ \]" "$TASKS_FILE")

echo ""

if $DRY_RUN; then
    echo "🔍 DRY RUN - No changes will be made"
    echo ""
    echo "To mark these tasks as complete, run:"
    for task_id in "${UNCOMPLETED[@]}"; do
        echo "  bash .claude/scripts/mark-task-complete.sh $task_id"
    done
    exit 0
fi

if $AUTO_MARK; then
    echo "⚠️  AUTO-MARK mode enabled - marking all tasks as complete..."
    echo ""
    for task_id in "${UNCOMPLETED[@]}"; do
        echo "Marking $task_id..."
        bash "$SCRIPT_DIR/mark-task-complete.sh" "$task_id" --no-log
    done
    echo ""
    echo "✅ All tasks marked as complete"
    exit 0
fi

# Interactive mode
echo "What would you like to do?"
echo ""
echo "1. Show commands to manually mark each task"
echo "2. Mark all tasks as complete now (auto-mark)"
echo "3. Exit without changes"
echo ""
read -p "Choose [1-3]: " choice

case "$choice" in
    1)
        echo ""
        echo "Run these commands to mark tasks as complete:"
        echo ""
        for task_id in "${UNCOMPLETED[@]}"; do
            echo "bash .claude/scripts/mark-task-complete.sh $task_id"
        done
        echo ""
        ;;
    2)
        echo ""
        echo "Marking all tasks as complete..."
        for task_id in "${UNCOMPLETED[@]}"; do
            echo "Marking $task_id..."
            bash "$SCRIPT_DIR/mark-task-complete.sh" "$task_id"
        done
        echo ""
        echo "✅ All tasks marked as complete"
        ;;
    3)
        echo "Exiting without changes."
        exit 0
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac
