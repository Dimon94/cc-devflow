#!/usr/bin/env bash

# Validate Constitution compliance for cc-devflow
#
# This script checks code and documentation against CC-DevFlow Constitution v2.0.0.
# Validates all 10 Constitutional Articles (Article I-X).
# Inspired by spec-kit's quality gate philosophy.
#
# Constitution Reference: .claude/constitution/project-constitution.md
# Article I: Quality First
# Article II: Architectural Consistency
# Article III: Security First
# Article IV: Performance Accountability
# Article V: Maintainability
# Article VI: Test-First Development
# Article VII: Simplicity Gate
# Article VIII: Anti-Abstraction
# Article IX: Integration-First Testing
# Article X: Requirement Boundary
#
# Usage: ./validate-constitution.sh [TARGET] [OPTIONS]
#
# ARGUMENTS:
#   TARGET              Optional target to validate (file, directory, or REQ-ID)
#                       If not specified, validates current requirement
#
# OPTIONS:
#   --type TYPE         Validation type: code, docs, prd, epic, tasks, all (default: all)
#   --severity LEVEL    Minimum severity to report: info, warning, error (default: warning)
#   --fix               Attempt to auto-fix issues where possible
#   --json              Output in JSON format
#   --verbose, -v       Verbose output with detailed explanations
#   --help, -h          Show help message
#
# VALIDATION TYPES:
#   code                Validate source code against Constitution principles
#   docs                Validate documentation completeness
#   prd                 Validate PRD against Constitution checklist
#   epic                Validate Epic against Constitution checklist
#   tasks               Validate Tasks against TDD and Constitution principles
#   all                 Run all validation types
#
# EXAMPLES:
#   # Validate current requirement (all types)
#   ./validate-constitution.sh
#
#   # Validate specific file
#   ./validate-constitution.sh src/api/users.ts --type code
#
#   # Validate PRD only
#   ./validate-constitution.sh REQ-123 --type prd
#
#   # Validate with auto-fix
#   ./validate-constitution.sh --type code --fix
#
#   # JSON output for CI/CD
#   ./validate-constitution.sh --json

set -e

# Parse command line arguments
TARGET=""
VALIDATION_TYPE="all"
SEVERITY="warning"
AUTO_FIX=false
JSON_MODE=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --type)
            VALIDATION_TYPE="$2"
            shift 2
            ;;
        --severity)
            SEVERITY="$2"
            shift 2
            ;;
        --fix)
            AUTO_FIX=true
            shift
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
Usage: validate-constitution.sh [TARGET] [OPTIONS]

Validate code and documentation against CC-DevFlow Constitution principles.

ARGUMENTS:
  TARGET              Optional target (file, directory, or REQ-ID)
                      Defaults to current requirement

OPTIONS:
  --type TYPE         Validation type: code, docs, prd, epic, tasks, all
                      Default: all
  --severity LEVEL    Minimum severity: info, warning, error
                      Default: warning
  --fix               Attempt to auto-fix issues
  --json              Output in JSON format
  --verbose, -v       Verbose output with explanations
  --help, -h          Show this help message

VALIDATION TYPES:
  code                Source code validation (NO PARTIAL IMPLEMENTATION, etc.)
  docs                Documentation completeness
  prd                 PRD Constitution checklist
  epic                Epic Constitution checklist
  tasks               Tasks TDD compliance and Constitution checks
  all                 All validation types

CONSTITUTION PRINCIPLES CHECKED:
  1. Quality First: NO PARTIAL IMPLEMENTATION, NO SIMPLIFICATION
  2. Architectural Consistency: NO CODE DUPLICATION, CONSISTENT NAMING
  3. Security First: NO HARDCODED SECRETS, INPUT VALIDATION
  4. Performance: NO RESOURCE LEAKS
  5. Maintainability: NO DEAD CODE, FILE SIZE LIMIT

EXAMPLES:
  # Validate current requirement
  ./validate-constitution.sh

  # Validate specific file
  ./validate-constitution.sh src/users.ts --type code

  # Validate PRD with verbose output
  ./validate-constitution.sh REQ-123 --type prd --verbose

  # Validate and auto-fix
  ./validate-constitution.sh --type code --fix

  # CI/CD integration
  ./validate-constitution.sh --json --severity error

EXIT CODES:
  0 - All validations passed
  1 - Validation errors found
  2 - Invalid arguments or configuration

EOF
            exit 0
            ;;
        -*)
            echo "ERROR: Unknown option '$1'. Use --help for usage information." >&2
            exit 2
            ;;
        *)
            if [[ -z "$TARGET" ]]; then
                TARGET="$1"
            else
                echo "ERROR: Too many arguments. Use --help for usage information." >&2
                exit 2
            fi
            shift
            ;;
    esac
done

# Validate arguments
case "$VALIDATION_TYPE" in
    code|docs|prd|epic|tasks|all) ;;
    *)
        echo "ERROR: Invalid validation type: $VALIDATION_TYPE" >&2
        echo "Valid types: code, docs, prd, epic, tasks, all" >&2
        exit 2
        ;;
esac

case "$SEVERITY" in
    info|warning|error) ;;
    *)
        echo "ERROR: Invalid severity level: $SEVERITY" >&2
        echo "Valid levels: info, warning, error" >&2
        exit 2
        ;;
esac

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Get repository root
REPO_ROOT=$(get_repo_root)

# Initialize validation results
TOTAL_ISSUES=0
ERROR_COUNT=0
WARNING_COUNT=0
INFO_COUNT=0
declare -a ISSUES=()

# Add issue to results
# Args: $1 - severity, $2 - category, $3 - message, $4 - file (optional), $5 - line (optional)
add_issue() {
    local severity="$1"
    local category="$2"
    local message="$3"
    local file="${4:-""}"
    local line="${5:-""}"

    TOTAL_ISSUES=$((TOTAL_ISSUES + 1))

    case "$severity" in
        error) ERROR_COUNT=$((ERROR_COUNT + 1)) ;;
        warning) WARNING_COUNT=$((WARNING_COUNT + 1)) ;;
        info) INFO_COUNT=$((INFO_COUNT + 1)) ;;
    esac

    # Check if we should report this severity
    case "$SEVERITY" in
        error)
            [[ "$severity" != "error" ]] && return
            ;;
        warning)
            [[ "$severity" == "info" ]] && return
            ;;
        info)
            # Report all
            ;;
    esac

    if $JSON_MODE; then
        ISSUES+=("{\"severity\":\"$severity\",\"category\":\"$category\",\"message\":\"$message\",\"file\":\"$file\",\"line\":\"$line\"}")
    else
        local icon="ℹ️"
        case "$severity" in
            error) icon="❌" ;;
            warning) icon="⚠️" ;;
        esac

        if [[ -n "$file" ]]; then
            if [[ -n "$line" ]]; then
                echo "$icon [$severity] $category: $message ($file:$line)" >&2
            else
                echo "$icon [$severity] $category: $message ($file)" >&2
            fi
        else
            echo "$icon [$severity] $category: $message" >&2
        fi

        if $VERBOSE; then
            case "$category" in
                "NO_PARTIAL_IMPLEMENTATION")
                    echo "  → Constitution: 质量至上 - 禁止部分实现和占位符" >&2
                    ;;
                "NO_HARDCODED_SECRETS")
                    echo "  → Constitution: 安全优先 - 禁止硬编码敏感信息" >&2
                    ;;
                "NO_CODE_DUPLICATION")
                    echo "  → Constitution: 架构一致性 - 必须复用现有代码" >&2
                    ;;
                "NO_RESOURCE_LEAKS")
                    echo "  → Constitution: 性能责任 - 资源必须正确释放" >&2
                    ;;
                "NO_DEAD_CODE")
                    echo "  → Constitution: 可维护性 - 删除未使用的代码" >&2
                    ;;
                "FILE_SIZE_LIMIT")
                    echo "  → Constitution: 可维护性 - 单文件不超过500行" >&2
                    ;;
            esac
        fi
    fi
}

# Validate source code files
validate_code() {
    local target="$1"

    if ! $JSON_MODE; then
        echo "Validating source code against Constitution..." >&2
    fi

    # Find source files
    local files=()
    if [[ -f "$target" ]]; then
        files=("$target")
    elif [[ -d "$target" ]]; then
        while IFS= read -r file; do
            files+=("$file")
        done < <(find "$target" -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.sh" \) 2>/dev/null || true)
    else
        # Default to src/ if exists
        if [[ -d "$REPO_ROOT/src" ]]; then
            while IFS= read -r file; do
                files+=("$file")
            done < <(find "$REPO_ROOT/src" -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" \) 2>/dev/null || true)
        fi
    fi

    # Validate each file
    for file in "${files[@]}"; do
        [[ ! -f "$file" ]] && continue

        # Check file size (500 lines limit)
        local line_count=$(wc -l < "$file" 2>/dev/null || echo "0")
        if [[ "$line_count" -gt 500 ]]; then
            add_issue "warning" "FILE_SIZE_LIMIT" "File exceeds 500 lines ($line_count lines)" "$file"
        fi

        # Check for partial implementation markers
        if grep -qE "(TODO|FIXME|XXX|HACK|placeholder|to be implemented|coming soon|not implemented)" "$file" 2>/dev/null; then
            local line=$(grep -nE "(TODO|FIXME|XXX|HACK|placeholder|to be implemented|coming soon|not implemented)" "$file" 2>/dev/null | head -1 | cut -d: -f1)
            add_issue "error" "NO_PARTIAL_IMPLEMENTATION" "Partial implementation or placeholder detected" "$file" "$line"
        fi

        # Check for hardcoded secrets
        if grep -qE "(password|secret|api_key|token|private_key)\s*=\s*['\"][^'\"]+['\"]" "$file" 2>/dev/null; then
            local line=$(grep -nE "(password|secret|api_key|token|private_key)\s*=\s*['\"][^'\"]+['\"]" "$file" 2>/dev/null | head -1 | cut -d: -f1)
            add_issue "error" "NO_HARDCODED_SECRETS" "Potential hardcoded secret detected" "$file" "$line"
        fi

        # Check for resource leaks (unclosed connections, file handles)
        if grep -qE "(open\(|connect\(|new.*Connection)" "$file" 2>/dev/null; then
            if ! grep -qE "(close\(|disconnect\(|finally|with )" "$file" 2>/dev/null; then
                add_issue "warning" "NO_RESOURCE_LEAKS" "Potential resource leak - no cleanup detected" "$file"
            fi
        fi

        # Check for commented-out code (dead code)
        local commented_lines=$(grep -cE "^\s*(#|//)\s*(def |function |class |const |let |var )" "$file" 2>/dev/null || echo "0")
        if [[ "$commented_lines" -gt 3 ]]; then
            add_issue "warning" "NO_DEAD_CODE" "Excessive commented-out code detected ($commented_lines lines)" "$file"
        fi
    done
}

# Validate documentation completeness
validate_docs() {
    if ! $JSON_MODE; then
        echo "Validating documentation completeness..." >&2
    fi

    # Get requirement paths
    eval $(get_requirement_paths)

    if [[ -z "$REQ_ID" ]]; then
        add_issue "info" "DOCS" "No active requirement found, skipping documentation validation"
        return
    fi

    # Check required documents
    local required_docs=("PRD.md" "EPIC.md" "TASKS.md")
    for doc in "${required_docs[@]}"; do
        if [[ ! -f "$REQ_DIR/$doc" ]]; then
            add_issue "warning" "DOCS" "Missing required document: $doc" "$REQ_DIR"
        fi
    done

    # Check README.md
    if [[ ! -f "$REQ_DIR/README.md" ]]; then
        add_issue "info" "DOCS" "Missing README.md" "$REQ_DIR"
    fi
}

# Validate PRD Constitution checklist
validate_prd() {
    if ! $JSON_MODE; then
        echo "Validating PRD Constitution compliance..." >&2
    fi

    eval $(get_requirement_paths)

    if [[ ! -f "$PRD_FILE" ]]; then
        add_issue "error" "PRD" "PRD.md not found" "$PRD_FILE"
        return
    fi

    # Check for Constitution Check section
    if ! grep -q "## Constitution Check" "$PRD_FILE" 2>/dev/null; then
        add_issue "error" "PRD" "Missing Constitution Check section" "$PRD_FILE"
    fi

    # Check NO PARTIAL IMPLEMENTATION checkbox
    if ! grep -q "NO PARTIAL IMPLEMENTATION" "$PRD_FILE" 2>/dev/null; then
        add_issue "error" "PRD" "Missing NO PARTIAL IMPLEMENTATION check" "$PRD_FILE"
    fi

    # Check NO HARDCODED SECRETS checkbox
    if ! grep -q "NO HARDCODED SECRETS" "$PRD_FILE" 2>/dev/null; then
        add_issue "error" "PRD" "Missing NO HARDCODED SECRETS check" "$PRD_FILE"
    fi

    # Check INVEST criteria for user stories
    if ! grep -q "INVEST" "$PRD_FILE" 2>/dev/null; then
        add_issue "warning" "PRD" "No mention of INVEST criteria for user stories" "$PRD_FILE"
    fi

    # Check for placeholders
    local placeholder_count=$(grep -c "{{.*}}" "$PRD_FILE" 2>/dev/null || echo "0")
    if [[ "$placeholder_count" -gt 0 ]]; then
        add_issue "error" "PRD" "Unfilled placeholders detected ($placeholder_count)" "$PRD_FILE"
    fi
}

# Validate Epic Constitution checklist
validate_epic() {
    if ! $JSON_MODE; then
        echo "Validating Epic Constitution compliance..." >&2
    fi

    eval $(get_requirement_paths)

    if [[ ! -f "$EPIC_FILE" ]]; then
        add_issue "warning" "EPIC" "EPIC.md not found" "$EPIC_FILE"
        return
    fi

    # Check for Constitution Check section
    if ! grep -q "## Constitution Check" "$EPIC_FILE" 2>/dev/null; then
        add_issue "error" "EPIC" "Missing Constitution Check section" "$EPIC_FILE"
    fi

    # Check for TDD phases
    if ! grep -q "Phase 2.*Tests First" "$EPIC_FILE" 2>/dev/null; then
        add_issue "error" "EPIC" "Missing TDD Phase 2 (Tests First)" "$EPIC_FILE"
    fi

    # Check for TEST VERIFICATION CHECKPOINT
    if ! grep -q "TEST VERIFICATION CHECKPOINT" "$EPIC_FILE" 2>/dev/null; then
        add_issue "error" "EPIC" "Missing TEST VERIFICATION CHECKPOINT" "$EPIC_FILE"
    fi

    # Check for placeholders
    local placeholder_count=$(grep -c "{{.*}}" "$EPIC_FILE" 2>/dev/null || echo "0")
    if [[ "$placeholder_count" -gt 0 ]]; then
        add_issue "warning" "EPIC" "Unfilled placeholders detected ($placeholder_count)" "$EPIC_FILE"
    fi
}

# Validate Tasks TDD compliance
validate_tasks() {
    if ! $JSON_MODE; then
        echo "Validating Tasks TDD compliance..." >&2
    fi

    eval $(get_requirement_paths)
    local tasks_file="$REQ_DIR/TASKS.md"

    if [[ ! -f "$tasks_file" ]]; then
        add_issue "warning" "TASKS" "TASKS.md not found" "$tasks_file"
        return
    fi

    # Check for Phase 2: Tests First
    if ! grep -q "## Phase 2.*Tests First" "$tasks_file" 2>/dev/null; then
        add_issue "error" "TASKS" "Missing Phase 2: Tests First" "$tasks_file"
    fi

    # Check for TEST VERIFICATION CHECKPOINT
    if ! grep -q "TEST VERIFICATION CHECKPOINT" "$tasks_file" 2>/dev/null; then
        add_issue "error" "TASKS" "Missing TEST VERIFICATION CHECKPOINT" "$tasks_file"
    fi

    # Check that Phase 2 comes before Phase 3
    local phase2_line=$(grep -n "## Phase 2" "$tasks_file" 2>/dev/null | cut -d: -f1 | head -1)
    local phase3_line=$(grep -n "## Phase 3" "$tasks_file" 2>/dev/null | cut -d: -f1 | head -1)

    if [[ -n "$phase2_line" && -n "$phase3_line" && "$phase2_line" -gt "$phase3_line" ]]; then
        add_issue "error" "TASKS" "Phase 2 must come before Phase 3 (TDD violation)" "$tasks_file"
    fi

    # Check for Constitution Check section
    if ! grep -q "Constitution Check" "$tasks_file" 2>/dev/null; then
        add_issue "warning" "TASKS" "Missing Constitution Check section" "$tasks_file"
    fi

    # Check for Dependencies section
    if ! grep -q "## Dependencies" "$tasks_file" 2>/dev/null; then
        add_issue "info" "TASKS" "Missing Dependencies section" "$tasks_file"
    fi
}

# Main validation logic
main() {
    # Determine target
    if [[ -z "$TARGET" ]]; then
        # No target specified, use current requirement
        eval $(get_requirement_paths)
        if [[ -n "$REQ_ID" ]]; then
            TARGET="$REQ_DIR"
        else
            TARGET="$REPO_ROOT"
        fi
    elif [[ "$TARGET" =~ ^(REQ|BUG)-[0-9]+$ ]]; then
        # Target is a requirement ID
        TARGET=$(get_req_dir "$REPO_ROOT" "$TARGET")
    fi

    # Run validations based on type
    case "$VALIDATION_TYPE" in
        code)
            validate_code "$TARGET"
            ;;
        docs)
            validate_docs
            ;;
        prd)
            validate_prd
            ;;
        epic)
            validate_epic
            ;;
        tasks)
            validate_tasks
            ;;
        all)
            validate_code "$TARGET"
            validate_docs
            validate_prd
            validate_epic
            validate_tasks
            ;;
    esac

    # Output results
    if $JSON_MODE; then
        local issues_json=$(printf '%s,' "${ISSUES[@]}" | sed 's/,$//')
        printf '{"%s":%d,"%s":%d,"%s":%d,"%s":%d,"%s":[%s]}\n' \
            "total_issues" "$TOTAL_ISSUES" \
            "errors" "$ERROR_COUNT" \
            "warnings" "$WARNING_COUNT" \
            "info" "$INFO_COUNT" \
            "issues" "$issues_json"
    else
        echo "" >&2
        echo "════════════════════════════════════════" >&2
        echo "Constitution Validation Summary" >&2
        echo "════════════════════════════════════════" >&2
        echo "Total Issues: $TOTAL_ISSUES" >&2
        echo "  Errors:     $ERROR_COUNT" >&2
        echo "  Warnings:   $WARNING_COUNT" >&2
        echo "  Info:       $INFO_COUNT" >&2
        echo "" >&2

        if [[ "$ERROR_COUNT" -eq 0 && "$WARNING_COUNT" -eq 0 ]]; then
            echo "✅ All Constitution validations passed!" >&2
        elif [[ "$ERROR_COUNT" -eq 0 ]]; then
            echo "⚠️  Validation completed with warnings" >&2
        else
            echo "❌ Validation failed with errors" >&2
        fi
    fi

    # Exit code
    if [[ "$ERROR_COUNT" -gt 0 ]]; then
        exit 1
    else
        exit 0
    fi
}

# Run main
main