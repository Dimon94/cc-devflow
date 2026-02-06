#!/bin/bash
# [INPUT]: 依赖 .claude/config/quality-gates.yml
# [OUTPUT]: 执行验证命令，返回结果
# [POS]: scripts 的质量闸执行脚本，被 ralph-stop-hook.sh 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/.claude/config/quality-gates.yml"

# ============================================================================
# Usage
# ============================================================================

usage() {
    cat << EOF
Usage: run-quality-gates.sh <phase> [--json] [--verbose]

Execute quality gate verification commands for a phase.

Arguments:
    phase       Phase name (flow-dev, flow-review, flow-quality, flow-qa, flow-release)

Options:
    --json      Output results as JSON
    --verbose   Show command output
    --quick     Use quick mode for flow-quality (default)
    --full      Use full mode for flow-quality

Examples:
    run-quality-gates.sh flow-dev
    run-quality-gates.sh flow-quality --full
    run-quality-gates.sh flow-dev --json
EOF
    exit 1
}

# ============================================================================
# Parse Arguments
# ============================================================================

PHASE=""
JSON_OUTPUT=false
VERBOSE=false
MODE="quick"

while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --quick)
            MODE="quick"
            shift
            ;;
        --full)
            MODE="full"
            shift
            ;;
        --help|-h)
            usage
            ;;
        *)
            if [[ -z "$PHASE" ]]; then
                PHASE="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$PHASE" ]]; then
    echo "Error: phase is required"
    usage
fi

# ============================================================================
# Check Config File
# ============================================================================

if [[ ! -f "$CONFIG_FILE" ]]; then
    if $JSON_OUTPUT; then
        echo '{"success": true, "message": "No quality-gates.yml found, skipping verification"}'
    else
        echo "ℹ️  No quality-gates.yml found, skipping verification"
    fi
    exit 0
fi

# ============================================================================
# Parse YAML (Simple Parser)
# ============================================================================

# Extract verify commands for the phase
# For flow-quality, use the mode (quick/full)
if [[ "$PHASE" == "flow-quality" ]]; then
    YAML_PATH="${PHASE}.${MODE}.verify"
else
    YAML_PATH="${PHASE}.verify"
fi

# Simple YAML extraction using grep and sed
# This is a basic parser - for complex YAML, consider using yq
extract_commands() {
    local in_section=false
    local in_verify=false
    local indent_level=0

    while IFS= read -r line; do
        # Check for phase section
        if [[ "$line" =~ ^${PHASE}: ]]; then
            in_section=true
            continue
        fi

        # Check for mode section (for flow-quality)
        if $in_section && [[ "$PHASE" == "flow-quality" ]] && [[ "$line" =~ ^[[:space:]]+${MODE}: ]]; then
            in_section=true
            continue
        fi

        # Check for verify section
        if $in_section && [[ "$line" =~ ^[[:space:]]+verify: ]]; then
            in_verify=true
            continue
        fi

        # Extract command entries
        if $in_verify; then
            # Check if we've left the verify section (less indentation)
            if [[ "$line" =~ ^[[:space:]]*[a-z_]+: ]] && [[ ! "$line" =~ ^[[:space:]]{4,}- ]]; then
                in_verify=false
                in_section=false
                continue
            fi

            # Extract command value
            if [[ "$line" =~ command:[[:space:]]*\"(.+)\" ]]; then
                echo "${BASH_REMATCH[1]}"
            elif [[ "$line" =~ command:[[:space:]]*(.+) ]]; then
                echo "${BASH_REMATCH[1]}"
            fi
        fi
    done < "$CONFIG_FILE"
}

# ============================================================================
# Execute Commands
# ============================================================================

COMMANDS=$(extract_commands)

if [[ -z "$COMMANDS" ]]; then
    if $JSON_OUTPUT; then
        echo '{"success": true, "message": "No verify commands configured for phase", "phase": "'"$PHASE"'"}'
    else
        echo "ℹ️  No verify commands configured for $PHASE"
    fi
    exit 0
fi

TOTAL=0
PASSED=0
FAILED=0
RESULTS=()

while IFS= read -r cmd; do
    [[ -z "$cmd" ]] && continue

    ((TOTAL++))

    if $VERBOSE; then
        echo "Running: $cmd"
    fi

    # Execute command
    if eval "$cmd" > /dev/null 2>&1; then
        ((PASSED++))
        RESULTS+=("{\"command\": \"$cmd\", \"status\": \"pass\"}")
        if ! $JSON_OUTPUT; then
            echo "  ✓ $cmd"
        fi
    else
        ((FAILED++))
        RESULTS+=("{\"command\": \"$cmd\", \"status\": \"fail\"}")
        if ! $JSON_OUTPUT; then
            echo "  ✗ $cmd"
        fi
    fi
done <<< "$COMMANDS"

# ============================================================================
# Output Results
# ============================================================================

if $JSON_OUTPUT; then
    # Build JSON array of results
    RESULTS_JSON=$(printf '%s\n' "${RESULTS[@]}" | jq -s '.')

    jq -n \
        --arg phase "$PHASE" \
        --arg mode "$MODE" \
        --argjson total "$TOTAL" \
        --argjson passed "$PASSED" \
        --argjson failed "$FAILED" \
        --argjson results "$RESULTS_JSON" \
        '{
            "phase": $phase,
            "mode": $mode,
            "total": $total,
            "passed": $passed,
            "failed": $failed,
            "success": ($failed == 0),
            "results": $results
        }'
else
    echo ""
    echo "Quality Gate Results for $PHASE:"
    echo "  Total: $TOTAL"
    echo "  Passed: $PASSED"
    echo "  Failed: $FAILED"

    if [[ $FAILED -gt 0 ]]; then
        echo ""
        echo "❌ Quality gate FAILED"
        exit 1
    else
        echo ""
        echo "✅ Quality gate PASSED"
    fi
fi
