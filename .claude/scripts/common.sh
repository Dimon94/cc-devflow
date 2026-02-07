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

# Get current requirement ID from worktree path, branch, or environment
# Returns: REQ-XXX or BUG-XXX format
get_current_req_id() {
    # First check if DEVFLOW_REQ_ID environment variable is set
    if [[ -n "${DEVFLOW_REQ_ID:-}" ]]; then
        echo "$DEVFLOW_REQ_ID"
        return
    fi

    # Check if in git repo
    if git rev-parse --show-toplevel >/dev/null 2>&1; then
        # Try to extract from worktree directory name first (e.g., cc-devflow-REQ-123)
        local git_root
        git_root=$(git rev-parse --show-toplevel)
        local dir_name
        dir_name=$(basename "$git_root")
        if [[ "$dir_name" =~ -([A-Z]+-[0-9]+(-[0-9]+)?)$ ]]; then
            echo "${BASH_REMATCH[1]}"
            return
        fi

        # Then check git branch
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

# =============================================================================
# Git Worktree Functions (v4.3)
# =============================================================================

# Check if currently in a git worktree (not main repo)
# Returns: 0 if in worktree, 1 if in main repo or not in git
is_in_worktree() {
    local git_dir
    git_dir=$(git rev-parse --git-dir 2>/dev/null) || return 1

    # If .git is a file (not directory), we're in a worktree
    if [[ -f "$(git rev-parse --show-toplevel 2>/dev/null)/.git" ]]; then
        return 0
    fi
    return 1
}

# Get the main repository path (works from any worktree)
# Returns: absolute path to main repository
get_main_repo_path() {
    local git_root
    git_root=$(git rev-parse --show-toplevel 2>/dev/null) || return 1

    if is_in_worktree; then
        # Read gitdir from .git file and extract main repo path
        local gitdir_content
        gitdir_content=$(cat "$git_root/.git" 2>/dev/null)
        if [[ "$gitdir_content" =~ ^gitdir:\ (.+)$ ]]; then
            local gitdir="${BASH_REMATCH[1]}"
            # gitdir format: /path/to/main/.git/worktrees/name
            echo "$gitdir" | sed 's|/.git/worktrees/.*||'
        fi
    else
        echo "$git_root"
    fi
}

# Get current worktree path
# Returns: absolute path to current worktree (or main repo if not in worktree)
get_worktree_path() {
    git rev-parse --show-toplevel 2>/dev/null
}

# Get worktree directory for a specific REQ_ID
# Args: $1 - REQ_ID
# Returns: expected worktree path (may not exist)
get_worktree_dir_for_req() {
    local req_id="$1"
    local main_repo
    main_repo=$(get_main_repo_path) || return 1

    local repo_name
    repo_name=$(basename "$main_repo")

    echo "$(dirname "$main_repo")/${repo_name}-${req_id}"
}

# Check if a worktree exists for a specific REQ_ID
# Args: $1 - REQ_ID
# Returns: 0 if exists, 1 if not
worktree_exists_for_req() {
    local req_id="$1"
    local worktree_dir
    worktree_dir=$(get_worktree_dir_for_req "$req_id")

    [[ -d "$worktree_dir" ]]
}

# Extract REQ_ID from current worktree path or branch
# Returns: REQ_ID or empty string
get_req_id_from_worktree() {
    local git_root
    git_root=$(git rev-parse --show-toplevel 2>/dev/null) || return 1

    # Try to extract from directory name first (e.g., cc-devflow-REQ-123)
    local dir_name
    dir_name=$(basename "$git_root")
    if [[ "$dir_name" =~ -([A-Z]+-[0-9]+(-[0-9]+)?)$ ]]; then
        echo "${BASH_REMATCH[1]}"
        return 0
    fi

    # Fall back to branch name
    local branch
    branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
    if [[ "$branch" =~ (REQ-[0-9]+(-[0-9]+)?|BUG-[0-9]+(-[0-9]+)?) ]]; then
        echo "${BASH_REMATCH[1]}"
        return 0
    fi

    echo ""
}

# List all worktrees with their REQ_IDs
# Output format: path|branch|req_id (one per line)
list_worktrees_with_req() {
    local main_repo
    main_repo=$(get_main_repo_path) || return 1

    git -C "$main_repo" worktree list --porcelain | while IFS= read -r line; do
        if [[ "$line" =~ ^worktree ]]; then
            local path="${line#worktree }"
        elif [[ "$line" =~ ^branch ]]; then
            local branch="${line#branch refs/heads/}"
            local req_id=""
            local dir_name
            dir_name=$(basename "$path")
            if [[ "$dir_name" =~ -([A-Z]+-[0-9]+(-[0-9]+)?)$ ]]; then
                req_id="${BASH_REMATCH[1]}"
            elif [[ "$branch" =~ (REQ-[0-9]+(-[0-9]+)?|BUG-[0-9]+(-[0-9]+)?) ]]; then
                req_id="${BASH_REMATCH[1]}"
            fi
            echo "${path}|${branch}|${req_id}"
        elif [[ "$line" =~ ^detached ]]; then
            local req_id=""
            local dir_name
            dir_name=$(basename "$path")
            if [[ "$dir_name" =~ -([A-Z]+-[0-9]+(-[0-9]+)?)$ ]]; then
                req_id="${BASH_REMATCH[1]}"
            fi
            echo "${path}|(detached)|${req_id}"
        fi
    done
}

# Color output helpers
color_red() { echo -e "\033[0;31m$1\033[0m"; }
color_green() { echo -e "\033[0;32m$1\033[0m"; }
color_yellow() { echo -e "\033[0;33m$1\033[0m"; }
color_blue() { echo -e "\033[0;34m$1\033[0m"; }
color_bold() { echo -e "\033[1m$1\033[0m"; }
