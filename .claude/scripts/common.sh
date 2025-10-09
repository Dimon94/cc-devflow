#!/usr/bin/env bash
# Common functions and variables for cc-devflow scripts
# Based on spec-kit principles with cc-devflow enhancements

# Get repository root, with fallback for non-git repositories
get_repo_root() {
    if git rev-parse --show-toplevel >/dev/null 2>&1; then
        git rev-parse --show-toplevel
    else
        # Fall back to script location for non-git repos
        local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        (cd "$script_dir/../.." && pwd)
    fi
}

# Get current requirement ID from branch or environment
# Returns: REQ-XXX or BUG-XXX format
get_current_req_id() {
    # First check if DEVFLOW_REQ_ID environment variable is set
    if [[ -n "${DEVFLOW_REQ_ID:-}" ]]; then
        echo "$DEVFLOW_REQ_ID"
        return
    fi

    # Then check git branch if available
    if git rev-parse --abbrev-ref HEAD >/dev/null 2>&1; then
        local branch=$(git rev-parse --abbrev-ref HEAD)
        # Extract REQ-XXX or BUG-XXX from branch name like feature/REQ-123-title or feature/REQ-20251006-001-title
        # Support formats: REQ-123, REQ-20251006-001, BUG-456, etc.
        if [[ "$branch" =~ (REQ-[0-9]+-[0-9]+|REQ-[0-9]+|BUG-[0-9]+-[0-9]+|BUG-[0-9]+) ]]; then
            echo "${BASH_REMATCH[1]}"
            return
        fi
    fi

    # For non-git repos, try to find the latest requirement directory
    local repo_root=$(get_repo_root)
    local req_dir="$repo_root/devflow/requirements"

    if [[ -d "$req_dir" ]]; then
        local latest_req=""
        local highest=0

        for dir in "$req_dir"/REQ-* "$req_dir"/BUG-*; do
            if [[ -d "$dir" ]]; then
                local dirname=$(basename "$dir")
                # Match full requirement ID including extended formats like REQ-20251006-001
                if [[ "$dirname" =~ ^(REQ-[0-9]+-[0-9]+|REQ-[0-9]+|BUG-[0-9]+-[0-9]+|BUG-[0-9]+) ]]; then
                    local full_id="${BASH_REMATCH[1]}"
                    # Extract the first number for comparison
                    if [[ "$full_id" =~ (REQ|BUG)-([0-9]+) ]]; then
                        local prefix="${BASH_REMATCH[1]}"
                        local number="${BASH_REMATCH[2]}"
                        number=$((10#$number))
                        if [[ "$number" -gt "$highest" ]]; then
                            highest=$number
                            latest_req="$full_id"
                        fi
                    fi
                fi
            fi
        done

        if [[ -n "$latest_req" ]]; then
            echo "$latest_req"
            return
        fi
    fi

    echo ""  # No requirement ID found
}

# Check if we have git available
has_git() {
    git rev-parse --show-toplevel >/dev/null 2>&1
}

# Validate requirement ID format
# Args: $1 - requirement ID to validate
# Returns: 0 if valid, 1 if invalid
validate_req_id() {
    local req_id="$1"

    if [[ -z "$req_id" ]]; then
        echo "ERROR: Requirement ID cannot be empty" >&2
        return 1
    fi

    # Support both simple (REQ-123) and extended (REQ-20251006-001) formats
    if [[ ! "$req_id" =~ ^(REQ|BUG)-[0-9]+(-[0-9]+)?$ ]]; then
        echo "ERROR: Invalid requirement ID format: $req_id" >&2
        echo "Expected format: REQ-XXX or REQ-YYYYMMDD-XXX (e.g., REQ-123 or REQ-20251006-001)" >&2
        return 1
    fi

    return 0
}

# Get requirement type from ID
# Args: $1 - requirement ID
# Returns: "requirement" or "bug"
get_req_type() {
    local req_id="$1"
    if [[ "$req_id" =~ ^REQ- ]]; then
        echo "requirement"
    elif [[ "$req_id" =~ ^BUG- ]]; then
        echo "bug"
    else
        echo "unknown"
    fi
}

# Ensure devflow directory structure exists
# Args: $1 - repo root
ensure_devflow_dir() {
    local repo_root="$1"
    local devflow_dir="$repo_root/devflow"

    if [[ ! -d "$devflow_dir" ]]; then
        mkdir -p "$devflow_dir/requirements"
        mkdir -p "$devflow_dir/bugs"
    fi
}

# Get requirement directory path
# Args: $1 - repo root, $2 - requirement ID
get_req_dir() {
    local repo_root="$1"
    local req_id="$2"
    local req_type=$(get_req_type "$req_id")

    # Ensure devflow directory exists
    ensure_devflow_dir "$repo_root"

    if [[ "$req_type" == "bug" ]]; then
        echo "$repo_root/devflow/bugs/$req_id"
    else
        echo "$repo_root/devflow/requirements/$req_id"
    fi
}

# Get all requirement paths for current context
# Outputs shell variables for sourcing with eval
get_requirement_paths() {
    local repo_root=$(get_repo_root)
    local req_id=$(get_current_req_id)
    local has_git_repo="false"

    if has_git; then
        has_git_repo="true"
    fi

    local req_dir=$(get_req_dir "$repo_root" "$req_id")
    local req_type=$(get_req_type "$req_id")

    cat <<EOF
REPO_ROOT='$repo_root'
REQ_ID='$req_id'
REQ_TYPE='$req_type'
HAS_GIT='$has_git_repo'
REQ_DIR='$req_dir'
PRD_FILE='$req_dir/PRD.md'
EPIC_FILE='$req_dir/EPIC.md'
TASKS_DIR='$req_dir/tasks'
TASKS_FILE='$req_dir/TASKS.md'
RESEARCH_DIR='$req_dir/research'
TEST_PLAN_FILE='$req_dir/TEST_PLAN.md'
SECURITY_PLAN_FILE='$req_dir/SECURITY_PLAN.md'
TEST_REPORT_FILE='$req_dir/TEST_REPORT.md'
SECURITY_REPORT_FILE='$req_dir/SECURITY_REPORT.md'
RELEASE_PLAN_FILE='$req_dir/RELEASE_PLAN.md'
LOG_FILE='$req_dir/EXECUTION_LOG.md'
STATUS_FILE='$req_dir/orchestration_status.json'
EOF

    # Add BUG-specific paths if it's a bug
    if [[ "$req_type" == "bug" ]]; then
        cat <<EOF
ANALYSIS_FILE='$req_dir/ANALYSIS.md'
PLAN_FILE='$req_dir/PLAN.md'
BUG_STATUS_FILE='$req_dir/status.json'
EOF
    fi
}

# Check if file exists and display status
# Args: $1 - file path, $2 - display name
check_file() {
    [[ -f "$1" ]] && echo "  ✓ $2" || echo "  ✗ $2"
}

# Check if directory exists and is not empty
# Args: $1 - directory path, $2 - display name
check_dir() {
    [[ -d "$1" && -n $(ls -A "$1" 2>/dev/null) ]] && echo "  ✓ $2" || echo "  ✗ $2"
}

# Parse JSON value from key
# Args: $1 - json string, $2 - key
# Returns: value for the key
json_get() {
    local json="$1"
    local key="$2"
    echo "$json" | grep -o "\"$key\":\"[^\"]*\"" | cut -d'"' -f4
}

# Create requirement directory structure
# Args: $1 - requirement ID
create_req_structure() {
    local req_id="$1"
    local repo_root=$(get_repo_root)
    local req_dir=$(get_req_dir "$repo_root" "$req_id")

    mkdir -p "$req_dir"/{research,tasks}

    # Initialize empty log file
    if [[ ! -f "$req_dir/EXECUTION_LOG.md" ]]; then
        cat > "$req_dir/EXECUTION_LOG.md" <<EOF
# Execution Log: $req_id

## Created
$(date -u +"%Y-%m-%dT%H:%M:%SZ")

## Events
EOF
    fi

    # Initialize status file
    if [[ ! -f "$req_dir/orchestration_status.json" ]]; then
        cat > "$req_dir/orchestration_status.json" <<EOF
{
  "reqId": "$req_id",
  "status": "initialized",
  "phase": "planning",
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "updatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
    fi

    echo "$req_dir"
}

# Log event to execution log
# Args: $1 - requirement ID, $2 - event message
log_event() {
    local req_id="$1"
    local message="$2"
    local repo_root=$(get_repo_root)
    local req_dir=$(get_req_dir "$repo_root" "$req_id")
    local log_file="$req_dir/EXECUTION_LOG.md"

    if [[ -f "$log_file" ]]; then
        echo "" >> "$log_file"
        echo "### $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$log_file"
        echo "$message" >> "$log_file"
    fi
}

# Color output helpers
color_red() { echo -e "\033[0;31m$1\033[0m"; }
color_green() { echo -e "\033[0;32m$1\033[0m"; }
color_yellow() { echo -e "\033[0;33m$1\033[0m"; }
color_blue() { echo -e "\033[0;34m$1\033[0m"; }
color_bold() { echo -e "\033[1m$1\033[0m"; }