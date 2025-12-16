#!/usr/bin/env bash
# ============================================================================
# checklist-errors.sh
# ============================================================================
# Error codes and messages for /flow-checklist command and related hooks
#
# Usage: source this file in scripts that need checklist error handling
#
# Reference: TECH_DESIGN.md Section 4.4, contracts/command-interface.md Section 4
# ============================================================================

# ============================================================================
# Error Codes
# ============================================================================

# PRD.md not found in requirement directory
export ERR_MISSING_PRD="MISSING_PRD"

# Invalid checklist type specified
export ERR_INVALID_TYPE="INVALID_TYPE"

# No checklists found in directory
export ERR_NO_CHECKLISTS="NO_CHECKLISTS"

# Checklist item ID not found
export ERR_ITEM_NOT_FOUND="ITEM_NOT_FOUND"

# Checklist completion below gate threshold
export ERR_GATE_FAILED="GATE_FAILED"

# Skip reason required but not provided
export ERR_SKIP_REASON_REQUIRED="SKIP_REASON_REQUIRED"

# ============================================================================
# Valid Checklist Types (R001 Decision)
# ============================================================================
export VALID_CHECKLIST_TYPES="ux,api,security,performance,data,general"

# ============================================================================
# Error Message Functions
# ============================================================================

# Print error message to stderr
# Usage: print_error "ERROR_CODE" "additional message"
print_checklist_error() {
    local code="$1"
    local extra="${2:-}"

    case "$code" in
        "$ERR_MISSING_PRD")
            echo "ERROR: $code" >&2
            echo "PRD.md not found in requirement directory." >&2
            echo "" >&2
            echo "Run /flow-prd first." >&2
            ;;
        "$ERR_INVALID_TYPE")
            echo "ERROR: $code" >&2
            echo "Invalid checklist type: $extra" >&2
            echo "" >&2
            echo "Valid types: $VALID_CHECKLIST_TYPES" >&2
            ;;
        "$ERR_NO_CHECKLISTS")
            echo "ERROR: $code" >&2
            echo "No checklists found in checklists/ directory." >&2
            echo "" >&2
            echo "Run /flow-checklist --type <type> first." >&2
            ;;
        "$ERR_ITEM_NOT_FOUND")
            echo "WARNING: $code" >&2
            echo "Checklist item not found: $extra. Skipped." >&2
            ;;
        "$ERR_GATE_FAILED")
            echo "ERROR: $code" >&2
            echo "Checklist completion $extra" >&2
            echo "" >&2
            echo "Run /flow-checklist --status to review incomplete items." >&2
            echo "Or use --skip-gate --reason \"your reason\" to bypass." >&2
            ;;
        "$ERR_SKIP_REASON_REQUIRED")
            echo "ERROR: $code" >&2
            echo "--reason is required when using --skip-gate" >&2
            echo "" >&2
            echo "Usage: --skip-gate --reason \"your reason\"" >&2
            ;;
        *)
            echo "ERROR: Unknown error code: $code" >&2
            if [[ -n "$extra" ]]; then
                echo "$extra" >&2
            fi
            ;;
    esac
}

# Return JSON error object
# Usage: json_error "ERROR_CODE" "message"
json_checklist_error() {
    local code="$1"
    local message="$2"
    echo "{\"error\": \"$code\", \"message\": \"$message\"}"
}

# ============================================================================
# Validation Functions
# ============================================================================

# Validate checklist type
# Usage: validate_checklist_type "ux" && echo "valid"
validate_checklist_type() {
    local type="$1"
    if [[ ",$VALID_CHECKLIST_TYPES," == *",$type,"* ]]; then
        return 0
    else
        return 1
    fi
}

# Validate checklist item ID format (CHK + 3 digits)
# Usage: validate_item_id "CHK001" && echo "valid"
validate_item_id() {
    local id="$1"
    if [[ "$id" =~ ^CHK[0-9]{3}$ ]]; then
        return 0
    else
        return 1
    fi
}

# ============================================================================
# Gate Threshold Constants
# ============================================================================
export DEFAULT_GATE_THRESHOLD=80
