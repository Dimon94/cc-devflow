#!/usr/bin/env bash

# Consolidated prerequisite checking script for cc-devflow
#
# This script provides unified prerequisite checking for development workflow.
# Based on spec-kit design principles with cc-devflow enhancements.
#
# Usage: ./check-prerequisites.sh [OPTIONS]
#
# OPTIONS:
#   --json              Output in JSON format
#   --require-epic      Require EPIC.md to exist (for task generation phase)
#   --require-tasks     Require tasks/ to exist (for implementation phase)
#   --include-tasks     Include tasks/ in AVAILABLE_DOCS list
#   --paths-only        Only output path variables (no validation)
#   --help, -h          Show help message
#
# OUTPUTS:
#   JSON mode: {"REQ_ID":"...", "REQ_DIR":"...", "AVAILABLE_DOCS":["..."]}
#   Text mode: REQ_ID:... \n REQ_DIR:... \n AVAILABLE_DOCS: \n ✓/✗ file.md
#   Paths only: REPO_ROOT: ... \n REQ_ID: ... \n REQ_DIR: ... etc.

set -e

# Parse command line arguments
JSON_MODE=false
REQUIRE_EPIC=false
REQUIRE_TASKS=false
INCLUDE_TASKS=false
PATHS_ONLY=false

for arg in "$@"; do
    case "$arg" in
        --json)
            JSON_MODE=true
            ;;
        --require-epic)
            REQUIRE_EPIC=true
            ;;
        --require-tasks)
            REQUIRE_TASKS=true
            ;;
        --include-tasks)
            INCLUDE_TASKS=true
            ;;
        --paths-only)
            PATHS_ONLY=true
            ;;
        --help|-h)
            cat << 'EOF'
Usage: check-prerequisites.sh [OPTIONS]

Consolidated prerequisite checking for cc-devflow workflow.

OPTIONS:
  --json              Output in JSON format
  --require-epic      Require EPIC.md to exist (for task generation phase)
  --require-tasks     Require tasks/ to exist (for implementation phase)
  --include-tasks     Include tasks/ in AVAILABLE_DOCS list
  --paths-only        Only output path variables (no prerequisite validation)
  --help, -h          Show this help message

EXAMPLES:
  # Check planning prerequisites (PRD.md required)
  ./check-prerequisites.sh --json

  # Check task generation prerequisites (PRD.md + EPIC.md required)
  ./check-prerequisites.sh --json --require-epic

  # Check implementation prerequisites (PRD.md + EPIC.md + tasks/ required)
  ./check-prerequisites.sh --json --require-epic --require-tasks --include-tasks

  # Get requirement paths only (no validation)
  ./check-prerequisites.sh --paths-only

EOF
            exit 0
            ;;
        *)
            echo "ERROR: Unknown option '$arg'. Use --help for usage information." >&2
            exit 1
            ;;
    esac
done

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_SH="$SCRIPT_DIR/common.sh"
if [[ ! -f "$COMMON_SH" ]]; then
    COMMON_SH="$SCRIPT_DIR/../../../../scripts/common.sh"
fi
if [[ ! -f "$COMMON_SH" ]]; then
    echo "ERROR: common.sh not found (checked local + .claude/scripts)" >&2
    exit 1
fi
source "$COMMON_SH"

# Get requirement paths
eval $(get_requirement_paths)

# Validate requirement ID exists
if [[ -z "$REQ_ID" ]]; then
    echo "ERROR: No requirement ID found" >&2
    echo "Please ensure you are on a feature branch (feature/REQ-XXX-title)" >&2
    echo "Or set DEVFLOW_REQ_ID environment variable" >&2
    exit 1
fi

# Validate requirement ID format
validate_req_id "$REQ_ID" || exit 1

# If paths-only mode, output paths and exit (support JSON + paths-only combined)
if $PATHS_ONLY; then
    if $JSON_MODE; then
        # Minimal JSON paths payload (no validation performed)
        printf '{"%s":"%s","%s":"%s","%s":"%s","%s":"%s","%s":"%s","%s":"%s"}\n' \
            "REPO_ROOT" "$REPO_ROOT" \
            "REQ_ID" "$REQ_ID" \
            "REQ_TYPE" "$REQ_TYPE" \
            "REQ_DIR" "$REQ_DIR" \
            "PRD_FILE" "$PRD_FILE" \
            "EPIC_FILE" "$EPIC_FILE"
    else
        echo "REPO_ROOT: $REPO_ROOT"
        echo "REQ_ID: $REQ_ID"
        echo "REQ_TYPE: $REQ_TYPE"
        echo "REQ_DIR: $REQ_DIR"
        echo "PRD_FILE: $PRD_FILE"
        echo "EPIC_FILE: $EPIC_FILE"
    fi
    exit 0
fi

# Validate required directories and files
if [[ ! -d "$REQ_DIR" ]]; then
    echo "ERROR: Requirement directory not found: $REQ_DIR" >&2
    echo "Run /flow:init first to create the requirement structure." >&2
    exit 1
fi

if [[ ! -f "$PRD_FILE" ]]; then
    echo "ERROR: PRD.md not found in $REQ_DIR" >&2
    echo "Run prd-writer agent first to create the PRD." >&2
    exit 1
fi

# Check for EPIC.md if required
if $REQUIRE_EPIC && [[ ! -f "$EPIC_FILE" ]]; then
    echo "ERROR: EPIC.md not found in $REQ_DIR" >&2
    echo "Run planner agent first to create the Epic." >&2
    exit 1
fi

# Check for tasks/ or TASKS.md if required
# Support both tasks/ directory (old format) and TASKS.md file (new format)
if $REQUIRE_TASKS; then
    TASKS_FILE="$REQ_DIR/TASKS.md"
    if [[ ! -d "$TASKS_DIR" || -z "$(ls -A "$TASKS_DIR" 2>/dev/null)" ]] && [[ ! -f "$TASKS_FILE" ]]; then
        echo "ERROR: Neither tasks/ directory nor TASKS.md file found in $REQ_DIR" >&2
        echo "Run planner agent first to create the task breakdown." >&2
        exit 1
    fi
fi

# Build list of available documents
docs=()

# Check optional docs
[[ -d "$RESEARCH_DIR" && -n "$(ls -A "$RESEARCH_DIR" 2>/dev/null)" ]] && docs+=("research/")
[[ -f "$TEST_PLAN_FILE" ]] && docs+=("TEST_PLAN.md")
[[ -f "$SECURITY_PLAN_FILE" ]] && docs+=("SECURITY_PLAN.md")
[[ -f "$TEST_REPORT_FILE" ]] && docs+=("TEST_REPORT.md")
[[ -f "$SECURITY_REPORT_FILE" ]] && docs+=("SECURITY_REPORT.md")
[[ -f "$RELEASE_PLAN_FILE" ]] && docs+=("RELEASE_PLAN.md")
[[ -f "$LOG_FILE" ]] && docs+=("EXECUTION_LOG.md")

# Include tasks/ or TASKS.md if requested and it exists
# Support both tasks/ directory (old format) and TASKS.md file (new format)
if $INCLUDE_TASKS; then
    TASKS_FILE="$REQ_DIR/TASKS.md"
    if [[ -d "$TASKS_DIR" && -n "$(ls -A "$TASKS_DIR" 2>/dev/null)" ]]; then
        docs+=("tasks/")
    elif [[ -f "$TASKS_FILE" ]]; then
        docs+=("TASKS.md")
    fi
fi

# For BUG type, check BUG-specific files
if [[ "$REQ_TYPE" == "bug" ]]; then
    [[ -f "$ANALYSIS_FILE" ]] && docs+=("ANALYSIS.md")
    [[ -f "$PLAN_FILE" ]] && docs+=("PLAN.md")
fi

# Output results
if $JSON_MODE; then
    # Build JSON array of documents
    if [[ ${#docs[@]} -eq 0 ]]; then
        json_docs="[]"
    else
        json_docs=$(printf '"%s",' "${docs[@]}")
        json_docs="[${json_docs%,}]"
    fi

    printf '{"%s":"%s","%s":"%s","%s":"%s","%s":%s}\n' \
        "REQ_ID" "$REQ_ID" \
        "REQ_TYPE" "$REQ_TYPE" \
        "REQ_DIR" "$REQ_DIR" \
        "AVAILABLE_DOCS" "$json_docs"
else
    # Text output
    echo "REQ_ID: $REQ_ID"
    echo "REQ_TYPE: $REQ_TYPE"
    echo "REQ_DIR: $REQ_DIR"
    echo "AVAILABLE_DOCS:"

    # Show status of each potential document
    check_dir "$RESEARCH_DIR" "research/"
    check_file "$TEST_PLAN_FILE" "TEST_PLAN.md"
    check_file "$SECURITY_PLAN_FILE" "SECURITY_PLAN.md"
    check_file "$TEST_REPORT_FILE" "TEST_REPORT.md"
    check_file "$SECURITY_REPORT_FILE" "SECURITY_REPORT.md"
    check_file "$RELEASE_PLAN_FILE" "RELEASE_PLAN.md"
    check_file "$LOG_FILE" "EXECUTION_LOG.md"

    if $INCLUDE_TASKS; then
        TASKS_FILE="$REQ_DIR/TASKS.md"
        # Check for tasks/ directory first, fallback to TASKS.md
        if [[ -d "$TASKS_DIR" && -n "$(ls -A "$TASKS_DIR" 2>/dev/null)" ]]; then
            check_dir "$TASKS_DIR" "tasks/"
        else
            check_file "$TASKS_FILE" "TASKS.md"
        fi
    fi

    # BUG-specific files
    if [[ "$REQ_TYPE" == "bug" ]]; then
        check_file "$ANALYSIS_FILE" "ANALYSIS.md"
        check_file "$PLAN_FILE" "PLAN.md"
    fi
fi
