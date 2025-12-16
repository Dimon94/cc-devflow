#!/usr/bin/env bash
# ============================================================================
# calculate-checklist-completion.sh
# ============================================================================
# Calculate completion percentage for checklist files
#
# Usage: ./calculate-checklist-completion.sh [CHECKLISTS_DIR] [OPTIONS]
#
# ARGUMENTS:
#   CHECKLISTS_DIR       Path to checklists directory (optional)
#                        Default: devflow/requirements/{REQ-ID}/checklists/
#
# OPTIONS:
#   --req-id ID          Specify requirement ID (e.g., REQ-002)
#   --json               Output in JSON format
#   --verbose            Show detailed file information
#   --help, -h           Show help message
#
# OUTPUT (JSON):
#   {
#     "total": 57,
#     "checked": 46,
#     "percentage": 80.7,
#     "files": [
#       {"name": "ux.md", "checked": 16, "total": 20, "percentage": 80.0},
#       ...
#     ]
#   }
#
# Reference: TECH_DESIGN.md Section 6.2.2
# ============================================================================

set -e

# ============================================================================
# Load common functions
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# ============================================================================
# Constants
# ============================================================================
REPO_ROOT=$(get_repo_root)

# ============================================================================
# Parse arguments
# ============================================================================
CHECKLISTS_DIR=""
REQ_ID=""
JSON_MODE=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --req-id)
            REQ_ID="$2"
            shift 2
            ;;
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
Usage: calculate-checklist-completion.sh [CHECKLISTS_DIR] [OPTIONS]

Calculate completion percentage for checklist files.

ARGUMENTS:
  CHECKLISTS_DIR       Path to checklists directory (optional)

OPTIONS:
  --req-id ID          Specify requirement ID (e.g., REQ-002)
  --json               Output results in JSON format
  --verbose, -v        Show detailed file information
  --help, -h           Show this help message

OUTPUT (JSON):
  {
    "total": 57,
    "checked": 46,
    "percentage": 80.7,
    "files": [...]
  }

EXAMPLES:
  # Calculate for current requirement
  ./calculate-checklist-completion.sh

  # Calculate for specific requirement
  ./calculate-checklist-completion.sh --req-id REQ-002

  # JSON output for automation
  ./calculate-checklist-completion.sh --json

  # Specify directory directly
  ./calculate-checklist-completion.sh ./checklists/

EOF
            exit 0
            ;;
        -*)
            echo "ERROR: Unknown option '$1'. Use --help for usage information." >&2
            exit 1
            ;;
        *)
            if [[ -z "$CHECKLISTS_DIR" ]]; then
                CHECKLISTS_DIR="$1"
            else
                echo "ERROR: Too many arguments. Use --help for usage information." >&2
                exit 1
            fi
            shift
            ;;
    esac
done

# ============================================================================
# Determine checklists directory
# ============================================================================
if [[ -z "$CHECKLISTS_DIR" ]]; then
    # Get requirement ID if not specified
    if [[ -z "$REQ_ID" ]]; then
        REQ_ID=$(get_current_req_id)
    fi

    if [[ -z "$REQ_ID" ]]; then
        if $JSON_MODE; then
            echo '{"error": "NO_REQ_ID", "message": "Could not determine requirement ID"}'
        else
            echo "ERROR: Could not determine requirement ID" >&2
            echo "Use --req-id REQ-XXX or run from feature branch" >&2
        fi
        exit 1
    fi

    CHECKLISTS_DIR="$REPO_ROOT/devflow/requirements/$REQ_ID/checklists"
fi

# ============================================================================
# Validate directory exists
# ============================================================================
if [[ ! -d "$CHECKLISTS_DIR" ]]; then
    if $JSON_MODE; then
        echo "{\"error\": \"NO_CHECKLISTS\", \"message\": \"Checklists directory not found: $CHECKLISTS_DIR\"}"
    else
        echo "ERROR: NO_CHECKLISTS" >&2
        echo "Checklists directory not found: $CHECKLISTS_DIR" >&2
        echo "" >&2
        echo "Run /flow-checklist --type <type> first." >&2
    fi
    exit 1
fi

# ============================================================================
# Count checklist files
# ============================================================================
shopt -s nullglob
CHECKLIST_FILES=("$CHECKLISTS_DIR"/*.md)
shopt -u nullglob

if [[ ${#CHECKLIST_FILES[@]} -eq 0 ]]; then
    if $JSON_MODE; then
        echo '{"error": "NO_CHECKLISTS", "message": "No checklist files found", "total": 0, "checked": 0, "percentage": 0, "files": []}'
    else
        echo "ERROR: NO_CHECKLISTS" >&2
        echo "No checklist files found in $CHECKLISTS_DIR" >&2
        echo "" >&2
        echo "Run /flow-checklist --type <type> first." >&2
    fi
    exit 1
fi

# ============================================================================
# Calculate completion for each file
# ============================================================================
TOTAL_ALL=0
CHECKED_ALL=0
FILES_JSON=""

for file in "${CHECKLIST_FILES[@]}"; do
    filename=$(basename "$file")

    # Count total checklist items (matches - [ ] and - [x] and - [X])
    # Pattern: "- [" followed by space or x/X, then "]"
    total=$(grep -cE '^\s*- \[[ xX]\]' "$file" 2>/dev/null || echo "0")

    # Count checked items (matches - [x] and - [X])
    checked=$(grep -cE '^\s*- \[[xX]\]' "$file" 2>/dev/null || echo "0")

    # Calculate percentage (avoid division by zero)
    if [[ "$total" -gt 0 ]]; then
        percentage=$(awk "BEGIN {printf \"%.1f\", ($checked / $total) * 100}")
    else
        percentage="0.0"
    fi

    # Accumulate totals
    TOTAL_ALL=$((TOTAL_ALL + total))
    CHECKED_ALL=$((CHECKED_ALL + checked))

    # Build JSON for this file
    if [[ -n "$FILES_JSON" ]]; then
        FILES_JSON="$FILES_JSON,"
    fi
    FILES_JSON="$FILES_JSON{\"name\": \"$filename\", \"checked\": $checked, \"total\": $total, \"percentage\": $percentage}"

    # Verbose output
    if $VERBOSE && ! $JSON_MODE; then
        echo "  $filename: $checked/$total ($percentage%)"
    fi
done

# ============================================================================
# Calculate overall percentage
# ============================================================================
if [[ "$TOTAL_ALL" -gt 0 ]]; then
    PERCENTAGE_ALL=$(awk "BEGIN {printf \"%.1f\", ($CHECKED_ALL / $TOTAL_ALL) * 100}")
else
    PERCENTAGE_ALL="0.0"
fi

# ============================================================================
# Output results
# ============================================================================
if $JSON_MODE; then
    cat << EOF
{
  "total": $TOTAL_ALL,
  "checked": $CHECKED_ALL,
  "percentage": $PERCENTAGE_ALL,
  "files": [$FILES_JSON]
}
EOF
else
    echo "Checklist Completion: $CHECKED_ALL/$TOTAL_ALL ($PERCENTAGE_ALL%)"
    echo "Files scanned: ${#CHECKLIST_FILES[@]}"
fi
