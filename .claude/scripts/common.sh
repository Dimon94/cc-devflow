#!/usr/bin/env bash
# Common functions and variables for cc-devflow scripts
# Based on spec-kit principles with cc-devflow enhancements

# =============================================================================
# Beijing Time Functions (统一北京时间格式)
# =============================================================================

# Get current Beijing time in standard format (YYYY-MM-DD HH:MM:SS)
# Returns: 2025-01-10 14:30:25 (周五)
get_beijing_time() {
    # Convert UTC to Beijing time (UTC+8)
    TZ='Asia/Shanghai' date '+%Y-%m-%d %H:%M:%S (%a)'
}

# Get Beijing time in ISO format (for JSON/log files)
# Returns: 2025-01-10T14:30:25+08:00
get_beijing_time_iso() {
    TZ='Asia/Shanghai' date '+%Y-%m-%dT%H:%M:%S+08:00'
}

# Get Beijing time with Chinese day of week
# Returns: 2025年1月10日 星期五 14:30:25
get_beijing_time_full() {
    TZ='Asia/Shanghai' date '+%Y年%m月%d日 星期%u %H:%M:%S' | sed 's/星期1/星期一/' | sed 's/星期2/星期二/' | sed 's/星期3/星期三/' | sed 's/星期4/星期四/' | sed 's/星期5/星期五/' | sed 's/星期6/星期六/' | sed 's/星期7/星期日/'
}

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

    mkdir -p "$devflow_dir/requirements"
    mkdir -p "$devflow_dir/bugs"
    mkdir -p "$devflow_dir/changes"
    mkdir -p "$devflow_dir/specs"
}

# Convert arbitrary text to a lowercase slug suitable for change identifiers
# Examples:
#   slugify "Add User Login" => "add-user-login"
#   slugify "SAML/OIDC" => "saml-oidc"
slugify() {
    local input="$1"
    if [[ -z "$input" ]]; then
        echo ""
        return
    fi

    # Convert to lowercase and replace non-alphanumeric characters with hyphen
    local slug
    slug=$(printf '%s' "$input" | tr '[:upper:]' '[:lower:]')
    slug=$(printf '%s' "$slug" | sed 's/[^a-z0-9]/-/g')
    # Collapse repeated hyphens and trim edges
    slug=$(echo "$slug" | sed 's/-\{2,\}/-/g; s/^-//; s/-$//')

    echo "$slug"
}

# Ensure change identifier is unique within devflow/changes
ensure_unique_change_id() {
    local changes_dir="$1"
    local base_id="$2"
    local candidate="$base_id"
    local counter=2

    while [[ -d "$changes_dir/$candidate" ]]; do
        candidate="${base_id}-${counter}"
        counter=$((counter + 1))
    done

    echo "$candidate"
}

# Generate a default change identifier for a requirement + title pair
generate_change_id() {
    local req_id="$1"
    local title="$2"

    local normalized_req=$(echo "$req_id" | tr '[:upper:]' '[:lower:]')
    normalized_req=${normalized_req//_/-}

    local slug=$(slugify "$title")
    if [[ -z "$slug" ]]; then
        slug=$(date '+%Y%m%d%H%M%S')
    fi

    echo "${normalized_req}-${slug}"
}

# Validate change identifier format (req-123-example)
# Args: $1 - change identifier
validate_change_id() {
    local change_id="$1"

    if [[ -z "$change_id" ]]; then
        echo "ERROR: change-id cannot be empty" >&2
        return 1
    fi

    # Accept req-123-foo, req-20240101-001-bar, bug-123-baz, bug-20240101-001-baz
    if [[ ! "$change_id" =~ ^(req|bug)-[0-9]+(-[0-9]+)?-[a-z0-9-]+$ ]]; then
        echo "ERROR: Invalid change-id format: $change_id" >&2
        echo "Expected format: req-123-description or req-20240101-001-description" >&2
        return 1
    fi

    return 0
}

# =============================================================================
# JSON Schema 校验辅助 (轻量实现 draft-07 子集)
# =============================================================================
validate_json_schema() {
    local json_path="$1"
    local schema_path="$2"

    python3 - "$json_path" "$schema_path" <<'PY'
import json
import sys
from pathlib import Path

def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    sys.exit(1)

def ensure_type(target, expected: str, path: str) -> None:
    mapping = {"object": dict, "array": list, "string": str}
    python_type = mapping.get(expected)
    if python_type is None:
        return
    if not isinstance(target, python_type):
        fail(f"{path} must be {expected}")

def validate_array(node, schema, path):
    if "minItems" in schema and len(node) < schema["minItems"]:
        fail(f"{path} must contain at least {schema['minItems']} items")
    if schema.get("uniqueItems") and len(set(map(json.dumps, node))) != len(node):
        fail(f"{path} must contain unique items")
    item_schema = schema.get("items")
    if item_schema:
        for idx, item in enumerate(node):
            validate_node(item, item_schema, f"{path}[{idx}]")

def validate_object(node, schema, path):
    properties = schema.get("properties", {})
    required = schema.get("required", [])
    additional = schema.get("additionalProperties", True)
    for key in required:
        if key not in node:
            fail(f"{path}.{key} is required")
    for key, value in node.items():
        if key in properties:
            validate_node(value, properties[key], f"{path}.{key}")
        elif additional is False:
            fail(f"{path}.{key} is not allowed")

def validate_node(node, schema, path: str) -> None:
    node_type = schema.get("type")
    if node_type:
        ensure_type(node, node_type, path)
    if "enum" in schema and node not in schema["enum"]:
        fail(f"{path} must be one of {schema['enum']}")
    if isinstance(node, str) and "minLength" in schema and len(node) < schema["minLength"]:
        fail(f"{path} length must be >= {schema['minLength']}")
    if isinstance(node, list):
        validate_array(node, schema, path)
    if isinstance(node, dict):
        validate_object(node, schema, path)

json_path = Path(sys.argv[1])
schema_path = Path(sys.argv[2])

try:
    data = json.loads(json_path.read_text(encoding="utf-8"))
except Exception as exc:
    fail(f"Failed to read {json_path}: {exc}")

try:
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
except Exception as exc:
    fail(f"Failed to read schema {schema_path}: {exc}")

validate_node(data, schema, "$")
PY
}

# Return absolute path to change directory for a given repo + change id
get_change_dir() {
    local repo_root="$1"
    local change_id="$2"
    ensure_devflow_dir "$repo_root"
    echo "$repo_root/devflow/changes/$change_id"
}

# Locate existing change directory (active or archived)
# Args: $1 - repository root, $2 - change identifier
# Output: absolute path if found; returns 1 otherwise
locate_change_dir() {
    local repo_root="$1"
    local change_id="$2"
    local active_dir="$repo_root/devflow/changes/$change_id"
    local archive_dir="$repo_root/devflow/changes/archive/$change_id"

    if [[ -d "$active_dir" ]]; then
        echo "$active_dir"
        return 0
    fi

    if [[ -d "$archive_dir" ]]; then
        echo "$archive_dir"
        return 0
    fi

    return 1
}

# Read change-id from requirement orchestration status file
# Args: $1 - requirement directory path
# Output: change id on stdout
get_change_id() {
    local req_dir="$1"
    local status_file="$req_dir/orchestration_status.json"

    if [[ ! -f "$status_file" ]]; then
        echo "ERROR: orchestration_status.json not found in $req_dir" >&2
        return 1
    fi

    local change_id
    change_id=$(jq -r '.change_id // empty' "$status_file" 2>/dev/null || true)

    if [[ -z "$change_id" || "$change_id" == "null" ]]; then
        echo "ERROR: change_id not set in $status_file" >&2
        return 1
    fi

    echo "$change_id"
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
$(get_beijing_time_full)

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
  "createdAt": "$(get_beijing_time_iso)",
  "updatedAt": "$(get_beijing_time_iso)"
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
        echo "### $(get_beijing_time)" >> "$log_file"
        echo "$message" >> "$log_file"
    fi
}

# Color output helpers
color_red() { echo -e "\033[0;31m$1\033[0m"; }
color_green() { echo -e "\033[0;32m$1\033[0m"; }
color_yellow() { echo -e "\033[0;33m$1\033[0m"; }
color_blue() { echo -e "\033[0;34m$1\033[0m"; }
color_bold() { echo -e "\033[1m$1\033[0m"; }
