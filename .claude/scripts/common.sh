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

# Get current requirement ID from environment, workspace, or directory scan
# Priority: 1. $DEVFLOW_REQ_ID  2. .current-req file  3. latest requirement dir
# Returns: REQ-XXX or BUG-XXX format
get_current_req_id() {
    # Priority 1: Environment variable
    if [[ -n "${DEVFLOW_REQ_ID:-}" ]]; then
        echo "$DEVFLOW_REQ_ID"
        return
    fi

    # Priority 2: Workspace .current-req file
    local repo_root=$(get_repo_root)
    local current_req_file="$repo_root/devflow/workspace/.current-req"
    if [[ -f "$current_req_file" ]]; then
        local req_from_file
        req_from_file=$(cat "$current_req_file" 2>/dev/null | tr -d '[:space:]')
        if [[ "$req_from_file" =~ ^(REQ|BUG)-[0-9]+(-[0-9]+)?$ ]]; then
            echo "$req_from_file"
            return
        fi
    fi

    # Priority 3: Latest requirement directory scan
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

next_available_req_id() {
    local repo_root="${1:-$(get_repo_root)}"
    ensure_devflow_dir "$repo_root"
    local requirements_dir="$repo_root/devflow/requirements"
    local used_numbers="" width=3 candidate=1
    local nullglob_state
    nullglob_state=$(shopt -p nullglob)
    shopt -s nullglob
    for path in "$requirements_dir"/REQ-*; do
        [[ -d "$path" ]] || continue
        local name=$(basename "$path")
        [[ "$name" =~ ^REQ-([0-9]+)$ ]] || continue
        local value=$((10#${BASH_REMATCH[1]}))
        used_numbers+=" $value"
    done
    eval "$nullglob_state"
    while [[ " $used_numbers " == *" $candidate "* ]]; do
        candidate=$((candidate + 1))
    done
    printf "REQ-%0*d\n" "$width" "$candidate"
}

req_id_in_use() {
    local repo_root="$1"
    local req_id="$2"
    local req_dir
    req_dir=$(get_req_dir "$repo_root" "$req_id")
    [[ -d "$req_dir" ]]
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
}

# =============================================================================
# Chinese to Pinyin Conversion (REQ-003)
# =============================================================================

# Internal helper: Convert Chinese characters to pinyin using pypinyin
# Args: $1 - input string containing Chinese characters
# Returns: string with Chinese replaced by pinyin, other chars unchanged
# Side effects: Outputs warning to stderr if pypinyin not installed
_chinese_to_pinyin() {
    local input="$1"

    # Check pypinyin availability
    if ! python3 -c "import pypinyin" 2>/dev/null; then
        echo "Warning: pypinyin not installed. Chinese characters cannot be converted." >&2
        echo "Install: pip install pypinyin" >&2
        echo "$input"
        return
    fi

    # Convert Chinese to pinyin, preserve other characters
    # Use lazy_pinyin on full text for better polyphone handling (phrase-aware)
    python3 -c "
from pypinyin import lazy_pinyin
import sys
import re

text = sys.argv[1]

# Extract consecutive Chinese chunks and convert them together
# This allows pypinyin to use phrase dictionary for polyphones
result = []
chinese_buffer = ''
non_chinese_buffer = ''

for char in text:
    if re.match(r'[\u4e00-\u9fff]', char):
        if non_chinese_buffer:
            result.append(non_chinese_buffer)
            non_chinese_buffer = ''
        chinese_buffer += char
    else:
        if chinese_buffer:
            # Convert accumulated Chinese as a phrase, space-separated
            pinyin_list = lazy_pinyin(chinese_buffer)
            result.append(' '.join(pinyin_list))
            chinese_buffer = ''
        non_chinese_buffer += char

# Flush remaining buffers
if chinese_buffer:
    pinyin_list = lazy_pinyin(chinese_buffer)
    result.append(' '.join(pinyin_list))
if non_chinese_buffer:
    result.append(non_chinese_buffer)

# Join with space only between Chinese pinyin blocks and other content
print(' '.join(result))
" "$input"
}

# Convert arbitrary text to a lowercase slug (branch/task naming helper)
# Examples:
#   slugify "Add User Login" => "add-user-login"
#   slugify "SAML/OIDC" => "saml-oidc"
#   slugify "用户登录" => "yong-hu-deng-lu" (REQ-003: Chinese to pinyin)
slugify() {
    local input="$1"
    if [[ -z "$input" ]]; then
        echo ""
        return
    fi

    local result="$input"

    # REQ-003: Check for Chinese characters (Unicode range \u4e00-\u9fff)
    # Use Python for cross-platform compatibility (macOS grep lacks -P)
    if python3 -c "import sys,re; sys.exit(0 if re.search(r'[\u4e00-\u9fff]', sys.argv[1]) else 1)" "$input" 2>/dev/null; then
        result=$(_chinese_to_pinyin "$input")
    fi

    # Convert to lowercase and replace non-alphanumeric characters with hyphen
    local slug
    slug=$(printf '%s' "$result" | tr '[:upper:]' '[:lower:]')
    slug=$(printf '%s' "$slug" | sed 's/[^a-z0-9]/-/g')
    # Collapse repeated hyphens and trim edges
    slug=$(echo "$slug" | sed 's/-\{2,\}/-/g; s/^-//; s/-$//')

    echo "$slug"
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

# =============================================================================
# Archive Functions (归档功能)
# =============================================================================

# Get archive directory path (按年月组织)
# Args: $1 - repo root, $2 - year-month (YYYY-MM, optional, defaults to current)
# Returns: archive directory path
get_archive_dir() {
    local repo_root="$1"
    local year_month="${2:-$(TZ='Asia/Shanghai' date '+%Y-%m')}"
    echo "$repo_root/devflow/archive/$year_month"
}

# Check if requirement is archived
# Args: $1 - repo root, $2 - requirement ID
# Returns: 0 if archived, 1 if not
is_archived() {
    local repo_root="$1"
    local req_id="$2"
    local archive_base="$repo_root/devflow/archive"

    # 搜索所有归档月份目录
    if [[ -d "$archive_base" ]]; then
        for month_dir in "$archive_base"/*/; do
            if [[ -d "${month_dir}${req_id}" ]]; then
                return 0
            fi
        done
    fi
    return 1
}

# Find archived requirement location
# Args: $1 - repo root, $2 - requirement ID
# Returns: full path to archived requirement, or empty if not found
find_archived_req() {
    local repo_root="$1"
    local req_id="$2"
    local archive_base="$repo_root/devflow/archive"

    if [[ -d "$archive_base" ]]; then
        for month_dir in "$archive_base"/*/; do
            if [[ -d "${month_dir}${req_id}" ]]; then
                echo "${month_dir}${req_id}"
                return 0
            fi
        done
    fi
    echo ""
    return 1
}

# List all archived requirements
# Args: $1 - repo root
# Returns: list of archived requirement IDs with their archive dates
list_archived_reqs() {
    local repo_root="$1"
    local archive_base="$repo_root/devflow/archive"

    if [[ ! -d "$archive_base" ]]; then
        echo "No archived requirements found."
        return
    fi

    local found=false
    for month_dir in "$archive_base"/*/; do
        [[ -d "$month_dir" ]] || continue
        local month=$(basename "$month_dir")
        for req_dir in "$month_dir"*/; do
            [[ -d "$req_dir" ]] || continue
            local req_id=$(basename "$req_dir")
            # 读取归档原因
            local status_file="$req_dir/orchestration_status.json"
            local reason="unknown"
            if [[ -f "$status_file" ]]; then
                reason=$(jq -r '.archivedReason // "completed"' "$status_file" 2>/dev/null)
            fi
            echo "$month | $req_id | $reason"
            found=true
        done
    done

    if [[ "$found" == "false" ]]; then
        echo "No archived requirements found."
    fi
}

# Get archive summary for a requirement
# Args: $1 - repo root, $2 - requirement ID
# Returns: JSON summary of archived requirement
get_archive_summary() {
    local repo_root="$1"
    local req_id="$2"
    local archived_path=$(find_archived_req "$repo_root" "$req_id")

    if [[ -z "$archived_path" ]]; then
        echo "{\"error\": \"not_found\"}"
        return 1
    fi

    local status_file="$archived_path/orchestration_status.json"
    if [[ -f "$status_file" ]]; then
        jq '{
            reqId: .reqId,
            title: .title,
            status: .status,
            archivedReason: .archivedReason,
            archivedAt: .archivedAt,
            archiveLocation: .archiveLocation,
            statusBeforeArchive: .statusBeforeArchive
        }' "$status_file"
    else
        echo "{\"reqId\": \"$req_id\", \"archiveLocation\": \"$archived_path\"}"
    fi
}

# Check if requirement has deltas to archive
# Args: $1 - requirement directory
# Returns: 0 if has deltas, 1 if not
has_deltas_to_archive() {
    local req_dir="$1"
    local deltas_dir="$req_dir/deltas"

    if [[ -d "$deltas_dir" ]]; then
        local count=$(find "$deltas_dir" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
        [[ $count -gt 0 ]] && return 0
    fi
    return 1
}

# Get delta count for a requirement
# Args: $1 - requirement directory
# Returns: number of deltas
get_delta_count() {
    local req_dir="$1"
    local deltas_dir="$req_dir/deltas"

    if [[ -d "$deltas_dir" ]]; then
        find "$deltas_dir" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' '
    else
        echo "0"
    fi
}

# Color output helpers
color_red() { echo -e "\033[0;31m$1\033[0m"; }
color_green() { echo -e "\033[0;32m$1\033[0m"; }
color_yellow() { echo -e "\033[0;33m$1\033[0m"; }
color_blue() { echo -e "\033[0;34m$1\033[0m"; }
color_bold() { echo -e "\033[1m$1\033[0m"; }

# =============================================================================
# Claude Team Functions (v4.7)
# =============================================================================

# Check if Team mode is enabled for a requirement
# Args: $1 - repo root, $2 - requirement ID
# Returns: 0 if Team mode enabled, 1 if not
is_team_mode_enabled() {
    local repo_root="$1"
    local req_id="$2"
    local status_file
    status_file=$(get_req_dir "$repo_root" "$req_id")/orchestration_status.json

    if [[ -f "$status_file" ]]; then
        local team_mode
        team_mode=$(jq -r '.team.mode // empty' "$status_file" 2>/dev/null)
        [[ -n "$team_mode" ]] && return 0
    fi
    return 1
}

# Initialize Team state in orchestration_status.json
# Args: $1 - repo root, $2 - requirement ID, $3 - team mode (sequential|parallel), $4 - lead ID
init_team_state() {
    local repo_root="$1"
    local req_id="$2"
    local mode="${3:-parallel}"
    local lead="${4:-team-lead}"
    local status_file
    status_file=$(get_req_dir "$repo_root" "$req_id")/orchestration_status.json

    if [[ ! -f "$status_file" ]]; then
        echo "ERROR: orchestration_status.json not found" >&2
        return 1
    fi

    local now
    now=$(get_beijing_time_iso)

    # Add team state using jq
    jq --arg mode "$mode" --arg lead "$lead" --arg now "$now" '
        .team = {
            mode: $mode,
            lead: $lead,
            teammates: [],
            taskAssignments: {},
            createdAt: $now,
            updatedAt: $now
        } |
        .ralphLoop = {
            enabled: true,
            teammates: {},
            globalIteration: 0,
            maxIterations: 10,
            startedAt: $now
        }
    ' "$status_file" > "${status_file}.tmp" && mv "${status_file}.tmp" "$status_file"
}

# Add a teammate to Team state
# Args: $1 - repo root, $2 - requirement ID, $3 - teammate ID, $4 - role
add_teammate() {
    local repo_root="$1"
    local req_id="$2"
    local teammate_id="$3"
    local role="${4:-developer}"
    local status_file
    status_file=$(get_req_dir "$repo_root" "$req_id")/orchestration_status.json

    if [[ ! -f "$status_file" ]]; then
        echo "ERROR: orchestration_status.json not found" >&2
        return 1
    fi

    local now
    now=$(get_beijing_time_iso)

    jq --arg id "$teammate_id" --arg role "$role" --arg now "$now" '
        .team.teammates += [{
            id: $id,
            role: $role,
            status: "idle",
            currentTask: null,
            completedTasks: [],
            lastActiveAt: $now
        }] |
        .team.updatedAt = $now |
        .ralphLoop.teammates[$id] = {
            iteration: 0,
            lastVerifyResult: "skipped"
        }
    ' "$status_file" > "${status_file}.tmp" && mv "${status_file}.tmp" "$status_file"
}

# Update teammate status
# Args: $1 - repo root, $2 - requirement ID, $3 - teammate ID, $4 - status, $5 - current task (optional)
update_teammate_status() {
    local repo_root="$1"
    local req_id="$2"
    local teammate_id="$3"
    local status="$4"
    local current_task="${5:-null}"
    local status_file
    status_file=$(get_req_dir "$repo_root" "$req_id")/orchestration_status.json

    if [[ ! -f "$status_file" ]]; then
        echo "ERROR: orchestration_status.json not found" >&2
        return 1
    fi

    local now
    now=$(get_beijing_time_iso)

    # Handle null vs string for current_task
    if [[ "$current_task" == "null" ]]; then
        jq --arg id "$teammate_id" --arg status "$status" --arg now "$now" '
            (.team.teammates[] | select(.id == $id)) |= (
                .status = $status |
                .currentTask = null |
                .lastActiveAt = $now
            ) |
            .team.updatedAt = $now
        ' "$status_file" > "${status_file}.tmp" && mv "${status_file}.tmp" "$status_file"
    else
        jq --arg id "$teammate_id" --arg status "$status" --arg task "$current_task" --arg now "$now" '
            (.team.teammates[] | select(.id == $id)) |= (
                .status = $status |
                .currentTask = $task |
                .lastActiveAt = $now
            ) |
            .team.updatedAt = $now
        ' "$status_file" > "${status_file}.tmp" && mv "${status_file}.tmp" "$status_file"
    fi
}

# Mark task as completed by teammate
# Args: $1 - repo root, $2 - requirement ID, $3 - teammate ID, $4 - task ID
mark_teammate_task_complete() {
    local repo_root="$1"
    local req_id="$2"
    local teammate_id="$3"
    local task_id="$4"
    local status_file
    status_file=$(get_req_dir "$repo_root" "$req_id")/orchestration_status.json

    if [[ ! -f "$status_file" ]]; then
        echo "ERROR: orchestration_status.json not found" >&2
        return 1
    fi

    local now
    now=$(get_beijing_time_iso)

    jq --arg id "$teammate_id" --arg task "$task_id" --arg now "$now" '
        (.team.teammates[] | select(.id == $id)) |= (
            .completedTasks += [$task] |
            .currentTask = null |
            .status = "idle" |
            .lastActiveAt = $now
        ) |
        .team.updatedAt = $now
    ' "$status_file" > "${status_file}.tmp" && mv "${status_file}.tmp" "$status_file"
}

# Assign task to teammate
# Args: $1 - repo root, $2 - requirement ID, $3 - task ID, $4 - teammate ID
assign_task_to_teammate() {
    local repo_root="$1"
    local req_id="$2"
    local task_id="$3"
    local teammate_id="$4"
    local status_file
    status_file=$(get_req_dir "$repo_root" "$req_id")/orchestration_status.json

    if [[ ! -f "$status_file" ]]; then
        echo "ERROR: orchestration_status.json not found" >&2
        return 1
    fi

    local now
    now=$(get_beijing_time_iso)

    jq --arg task "$task_id" --arg id "$teammate_id" --arg now "$now" '
        .team.taskAssignments[$task] = $id |
        (.team.teammates[] | select(.id == $id)) |= (
            .currentTask = $task |
            .status = "working" |
            .lastActiveAt = $now
        ) |
        .team.updatedAt = $now
    ' "$status_file" > "${status_file}.tmp" && mv "${status_file}.tmp" "$status_file"
}

# Get teammate by ID
# Args: $1 - repo root, $2 - requirement ID, $3 - teammate ID
# Returns: JSON object of teammate state
get_teammate() {
    local repo_root="$1"
    local req_id="$2"
    local teammate_id="$3"
    local status_file
    status_file=$(get_req_dir "$repo_root" "$req_id")/orchestration_status.json

    if [[ ! -f "$status_file" ]]; then
        echo "{}"
        return 1
    fi

    jq --arg id "$teammate_id" '.team.teammates[] | select(.id == $id)' "$status_file" 2>/dev/null
}

# List all teammates
# Args: $1 - repo root, $2 - requirement ID
# Returns: JSON array of teammates
list_teammates() {
    local repo_root="$1"
    local req_id="$2"
    local status_file
    status_file=$(get_req_dir "$repo_root" "$req_id")/orchestration_status.json

    if [[ ! -f "$status_file" ]]; then
        echo "[]"
        return 1
    fi

    jq '.team.teammates // []' "$status_file" 2>/dev/null
}

# Get unassigned tasks (tasks not in taskAssignments)
# Args: $1 - repo root, $2 - requirement ID
# Returns: List of unassigned task IDs
get_unassigned_tasks() {
    local repo_root="$1"
    local req_id="$2"
    local req_dir
    req_dir=$(get_req_dir "$repo_root" "$req_id")
    local tasks_file="$req_dir/TASKS.md"
    local status_file="$req_dir/orchestration_status.json"

    if [[ ! -f "$tasks_file" ]] || [[ ! -f "$status_file" ]]; then
        echo ""
        return 1
    fi

    # Extract task IDs from TASKS.md (format: - [ ] **T001** ...)
    local all_tasks
    all_tasks=$(grep -oE '\*\*T[0-9]+\*\*' "$tasks_file" | sed 's/\*\*//g' | sort -u)

    # Get assigned tasks from status file
    local assigned_tasks
    assigned_tasks=$(jq -r '.team.taskAssignments | keys[]' "$status_file" 2>/dev/null)

    # Find unassigned tasks
    for task in $all_tasks; do
        if ! echo "$assigned_tasks" | grep -q "^${task}$"; then
            echo "$task"
        fi
    done
}

# Update Ralph Loop state for teammate
# Args: $1 - repo root, $2 - requirement ID, $3 - teammate ID, $4 - verify result (passed|failed)
update_teammate_ralph_state() {
    local repo_root="$1"
    local req_id="$2"
    local teammate_id="$3"
    local verify_result="$4"
    local status_file
    status_file=$(get_req_dir "$repo_root" "$req_id")/orchestration_status.json

    if [[ ! -f "$status_file" ]]; then
        echo "ERROR: orchestration_status.json not found" >&2
        return 1
    fi

    local now
    now=$(get_beijing_time_iso)

    jq --arg id "$teammate_id" --arg result "$verify_result" --arg now "$now" '
        .ralphLoop.teammates[$id].iteration += 1 |
        .ralphLoop.teammates[$id].lastVerifyResult = $result |
        .ralphLoop.teammates[$id].lastVerifyAt = $now |
        .ralphLoop.globalIteration += 1
    ' "$status_file" > "${status_file}.tmp" && mv "${status_file}.tmp" "$status_file"
}

# Check if all teammates are idle or completed
# Args: $1 - repo root, $2 - requirement ID
# Returns: 0 if all idle/completed, 1 if any working
all_teammates_idle() {
    local repo_root="$1"
    local req_id="$2"
    local status_file
    status_file=$(get_req_dir "$repo_root" "$req_id")/orchestration_status.json

    if [[ ! -f "$status_file" ]]; then
        return 1
    fi

    local working_count
    working_count=$(jq '[.team.teammates[] | select(.status == "working")] | length' "$status_file" 2>/dev/null)

    [[ "$working_count" == "0" ]] && return 0
    return 1
}

# Clean up Team state
# Args: $1 - repo root, $2 - requirement ID
cleanup_team_state() {
    local repo_root="$1"
    local req_id="$2"
    local status_file
    status_file=$(get_req_dir "$repo_root" "$req_id")/orchestration_status.json

    if [[ ! -f "$status_file" ]]; then
        return 0
    fi

    local now
    now=$(get_beijing_time_iso)

    jq --arg now "$now" '
        del(.team) |
        del(.ralphLoop) |
        .updatedAt = $now
    ' "$status_file" > "${status_file}.tmp" && mv "${status_file}.tmp" "$status_file"
}

# =============================================================================
# Team Monitoring Functions (v4.7)
# =============================================================================

# Get Team status summary
# Args: $1 - repo root, $2 - requirement ID
# Returns: JSON summary of Team status
get_team_status_summary() {
    local repo_root="$1"
    local req_id="$2"
    local status_file
    status_file=$(get_req_dir "$repo_root" "$req_id")/orchestration_status.json

    if [[ ! -f "$status_file" ]]; then
        echo '{"error": "Status file not found"}'
        return 1
    fi

    jq '{
        mode: .team.mode,
        lead: .team.lead,
        teammateCount: (.team.teammates | length),
        workingCount: ([.team.teammates[] | select(.status == "working")] | length),
        idleCount: ([.team.teammates[] | select(.status == "idle")] | length),
        completedTaskCount: ([.team.teammates[].completedTasks | length] | add),
        assignedTaskCount: (.team.taskAssignments | keys | length),
        ralphLoop: {
            globalIteration: .ralphLoop.globalIteration,
            maxIterations: .ralphLoop.maxIterations
        },
        lastUpdated: .team.updatedAt
    }' "$status_file" 2>/dev/null
}

# Check for timed out teammates
# Args: $1 - repo root, $2 - requirement ID, $3 - timeout seconds (default 300)
# Returns: JSON array of timed out teammates
get_timed_out_teammates() {
    local repo_root="$1"
    local req_id="$2"
    local timeout_seconds="${3:-300}"
    local status_file
    status_file=$(get_req_dir "$repo_root" "$req_id")/orchestration_status.json

    if [[ ! -f "$status_file" ]]; then
        echo '[]'
        return 1
    fi

    local now_epoch
    now_epoch=$(date +%s)

    jq --argjson now "$now_epoch" --argjson timeout "$timeout_seconds" '
        [.team.teammates[] |
            select(.status == "working") |
            select(
                ($now - ((.lastActiveAt | sub("\\.[0-9]+"; "") | sub("Z$"; "+00:00") | fromdateiso8601) // 0)) > $timeout
            )
        ]
    ' "$status_file" 2>/dev/null
}

# Log Team event to EXECUTION_LOG.md
# Args: $1 - repo root, $2 - requirement ID, $3 - event type, $4 - message
log_team_event() {
    local repo_root="$1"
    local req_id="$2"
    local event_type="$3"
    local message="$4"
    local log_file
    log_file=$(get_req_dir "$repo_root" "$req_id")/EXECUTION_LOG.md

    local timestamp
    timestamp=$(get_beijing_time_iso)

    local icon
    case "$event_type" in
        info) icon="ℹ️" ;;
        warning) icon="⚠️" ;;
        error) icon="❌" ;;
        success) icon="✅" ;;
        *) icon="📝" ;;
    esac

    local entry="
## [$timestamp] $icon Team Event: $event_type

$message

---
"

    if [[ -f "$log_file" ]]; then
        echo "$entry" >> "$log_file"
    else
        echo "# Execution Log

$entry" > "$log_file"
    fi
}

# Check Team health and log warnings
# Args: $1 - repo root, $2 - requirement ID
# Returns: 0 if healthy, 1 if issues found
check_team_health() {
    local repo_root="$1"
    local req_id="$2"
    local status_file
    status_file=$(get_req_dir "$repo_root" "$req_id")/orchestration_status.json

    if [[ ! -f "$status_file" ]]; then
        return 1
    fi

    local issues=0

    # Check for timed out teammates
    local timed_out
    timed_out=$(get_timed_out_teammates "$repo_root" "$req_id")
    local timed_out_count
    timed_out_count=$(echo "$timed_out" | jq 'length')

    if [[ "$timed_out_count" -gt 0 ]]; then
        local teammate_ids
        teammate_ids=$(echo "$timed_out" | jq -r '.[].id' | tr '\n' ', ' | sed 's/,$//')
        log_team_event "$repo_root" "$req_id" "warning" "Timed out teammates: $teammate_ids"
        issues=$((issues + 1))
    fi

    # Check Ralph Loop iteration limit
    local global_iter max_iter
    global_iter=$(jq '.ralphLoop.globalIteration // 0' "$status_file")
    max_iter=$(jq '.ralphLoop.maxIterations // 10' "$status_file")

    if [[ "$global_iter" -ge "$max_iter" ]]; then
        log_team_event "$repo_root" "$req_id" "error" "Ralph Loop reached max iterations ($global_iter/$max_iter)"
        issues=$((issues + 1))
    elif [[ "$global_iter" -ge $((max_iter * 80 / 100)) ]]; then
        log_team_event "$repo_root" "$req_id" "warning" "Ralph Loop approaching limit ($global_iter/$max_iter)"
    fi

    [[ "$issues" -eq 0 ]] && return 0
    return 1
}

