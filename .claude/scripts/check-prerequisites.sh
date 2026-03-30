#!/usr/bin/env bash
# =============================================================================
# [INPUT]: 依赖 common.sh 提供 requirement/intent/harness 路径与文件检测能力。
# [OUTPUT]: 输出当前 requirement 的路径与可用工件清单；默认承认 bootstrap 阶段，不强制要求 PRD。
# [POS]: .claude/scripts 的统一前置检查脚本，被命令层与测试复用。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================

set -euo pipefail

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
            cat <<'EOF'
Usage: check-prerequisites.sh [OPTIONS]

Consolidated prerequisite checking for the current CC-DevFlow mainline.

OPTIONS:
  --json              Output in JSON format
  --require-epic      Require PRD.md and EPIC.md to exist
  --require-tasks     Require executable task input to exist
  --include-tasks     Include task sources in AVAILABLE_DOCS
  --paths-only        Only output canonical path variables
  --help, -h          Show this help message

NOTES:
  - Default mode accepts bootstrap-only requirements.
  - Bootstrap-only means a requirement may exist with only harness-state /
    intent memory and no PRD yet.
  - Task sources can be `task-manifest.json`, `TASKS.md`, or `tasks/`.
EOF
            exit 0
            ;;
        *)
            echo "ERROR: Unknown option '$arg'. Use --help for usage information." >&2
            exit 1
            ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

eval "$(get_requirement_paths)"

if [[ -z "$REQ_ID" ]]; then
    echo "ERROR: No requirement ID found" >&2
    echo "Please ensure you are on a feature branch (feature/REQ-XXX-title)" >&2
    echo "Or set DEVFLOW_REQ_ID environment variable" >&2
    exit 1
fi

validate_req_id "$REQ_ID" || exit 1

if $PATHS_ONLY; then
    if $JSON_MODE; then
        printf '{"REPO_ROOT":"%s","REQ_ID":"%s","REQ_TYPE":"%s","REQ_DIR":"%s","PRD_FILE":"%s","EPIC_FILE":"%s","HARNESS_STATE_FILE":"%s","CONTEXT_PACKAGE_FILE":"%s","TASK_MANIFEST_FILE":"%s","RESUME_INDEX_FILE":"%s"}\n' \
            "$REPO_ROOT" "$REQ_ID" "$REQ_TYPE" "$REQ_DIR" "$PRD_FILE" "$EPIC_FILE" "$HARNESS_STATE_FILE" "$CONTEXT_PACKAGE_FILE" "$TASK_MANIFEST_FILE" "$RESUME_INDEX_FILE"
    else
        echo "REPO_ROOT: $REPO_ROOT"
        echo "REQ_ID: $REQ_ID"
        echo "REQ_TYPE: $REQ_TYPE"
        echo "REQ_DIR: $REQ_DIR"
        echo "PRD_FILE: $PRD_FILE"
        echo "EPIC_FILE: $EPIC_FILE"
        echo "HARNESS_STATE_FILE: $HARNESS_STATE_FILE"
        echo "CONTEXT_PACKAGE_FILE: $CONTEXT_PACKAGE_FILE"
        echo "TASK_MANIFEST_FILE: $TASK_MANIFEST_FILE"
        echo "RESUME_INDEX_FILE: $RESUME_INDEX_FILE"
    fi
    exit 0
fi

if [[ ! -d "$REQ_DIR" ]]; then
    echo "ERROR: Requirement directory not found: $REQ_DIR" >&2
    echo "Run /flow:init first to create the requirement structure." >&2
    exit 1
fi

if { $REQUIRE_EPIC || $REQUIRE_TASKS; } && [[ ! -f "$PRD_FILE" ]]; then
    echo "ERROR: PRD.md not found in $REQ_DIR" >&2
    echo "This phase requires PRD-backed planning artifacts. For bootstrap-only checks, run without --require-epic/--require-tasks." >&2
    exit 1
fi

if $REQUIRE_EPIC && [[ ! -f "$EPIC_FILE" ]]; then
    echo "ERROR: EPIC.md not found in $REQ_DIR" >&2
    echo "Run /flow:spec or generate epic artifacts first." >&2
    exit 1
fi

if $REQUIRE_TASKS; then
    if [[ ! -f "$TASK_MANIFEST_FILE" && ! -f "$TASKS_FILE" ]] && [[ ! -d "$TASKS_DIR" || -z "$(ls -A "$TASKS_DIR" 2>/dev/null)" ]]; then
        echo "ERROR: No executable task input found in $REQ_DIR" >&2
        echo "Expected one of: task-manifest.json, TASKS.md, or non-empty tasks/ directory." >&2
        echo "Run /flow:spec to create the task breakdown." >&2
        exit 1
    fi
fi

docs=()

[[ -f "$HARNESS_STATE_FILE" ]] && docs+=("harness-state.json")
[[ -f "$CONTEXT_PACKAGE_FILE" ]] && docs+=("context-package.md")
[[ -f "$PRD_FILE" ]] && docs+=("PRD.md")
[[ -f "$EPIC_FILE" ]] && docs+=("EPIC.md")
[[ -f "$TASK_MANIFEST_FILE" ]] && docs+=("task-manifest.json")
[[ -f "$REPORT_CARD_FILE" ]] && docs+=("report-card.json")
[[ -f "$RESUME_INDEX_FILE" ]] && docs+=("resume-index.md")
[[ -f "$PR_BRIEF_FILE" ]] && docs+=("pr-brief.md")
[[ -d "$RESEARCH_DIR" && -n "$(ls -A "$RESEARCH_DIR" 2>/dev/null)" ]] && docs+=("research/")
[[ -f "$TEST_PLAN_FILE" ]] && docs+=("TEST_PLAN.md")
[[ -f "$SECURITY_PLAN_FILE" ]] && docs+=("SECURITY_PLAN.md")
[[ -f "$TEST_REPORT_FILE" ]] && docs+=("TEST_REPORT.md")
[[ -f "$SECURITY_REPORT_FILE" ]] && docs+=("SECURITY_REPORT.md")
[[ -f "$RELEASE_PLAN_FILE" ]] && docs+=("RELEASE_PLAN.md")
[[ -f "$LOG_FILE" ]] && docs+=("EXECUTION_LOG.md")
[[ -f "$STATUS_FILE" ]] && docs+=("orchestration_status.json")

if $INCLUDE_TASKS; then
    if [[ -f "$TASK_MANIFEST_FILE" ]]; then
        docs+=("task-manifest.json")
    fi
    if [[ -f "$TASKS_FILE" ]]; then
        docs+=("TASKS.md")
    elif [[ -d "$TASKS_DIR" && -n "$(ls -A "$TASKS_DIR" 2>/dev/null)" ]]; then
        docs+=("tasks/")
    fi
fi

if [[ "$REQ_TYPE" == "bug" ]]; then
    [[ -f "$ANALYSIS_FILE" ]] && docs+=("ANALYSIS.md")
    [[ -f "$PLAN_FILE" ]] && docs+=("PLAN.md")
fi

if $JSON_MODE; then
    if [[ ${#docs[@]} -eq 0 ]]; then
        json_docs="[]"
    else
        json_docs=$(printf '"%s",' "${docs[@]}")
        json_docs="[${json_docs%,}]"
    fi

    printf '{"REQ_ID":"%s","REQ_TYPE":"%s","REQ_DIR":"%s","AVAILABLE_DOCS":%s}\n' \
        "$REQ_ID" "$REQ_TYPE" "$REQ_DIR" "$json_docs"
else
    echo "REQ_ID: $REQ_ID"
    echo "REQ_TYPE: $REQ_TYPE"
    echo "REQ_DIR: $REQ_DIR"
    echo "AVAILABLE_DOCS:"

    check_file "$HARNESS_STATE_FILE" "harness-state.json"
    check_file "$CONTEXT_PACKAGE_FILE" "context-package.md"
    check_file "$PRD_FILE" "PRD.md"
    check_file "$EPIC_FILE" "EPIC.md"
    check_file "$TASK_MANIFEST_FILE" "task-manifest.json"
    check_file "$REPORT_CARD_FILE" "report-card.json"
    check_file "$RESUME_INDEX_FILE" "resume-index.md"
    check_file "$PR_BRIEF_FILE" "pr-brief.md"
    check_dir "$RESEARCH_DIR" "research/"
    check_file "$TEST_PLAN_FILE" "TEST_PLAN.md"
    check_file "$SECURITY_PLAN_FILE" "SECURITY_PLAN.md"
    check_file "$TEST_REPORT_FILE" "TEST_REPORT.md"
    check_file "$SECURITY_REPORT_FILE" "SECURITY_REPORT.md"
    check_file "$RELEASE_PLAN_FILE" "RELEASE_PLAN.md"
    check_file "$LOG_FILE" "EXECUTION_LOG.md"
    check_file "$STATUS_FILE" "orchestration_status.json"

    if $INCLUDE_TASKS; then
        if [[ -f "$TASK_MANIFEST_FILE" ]]; then
            check_file "$TASK_MANIFEST_FILE" "task-manifest.json"
        fi
        if [[ -d "$TASKS_DIR" && -n "$(ls -A "$TASKS_DIR" 2>/dev/null)" ]]; then
            check_dir "$TASKS_DIR" "tasks/"
        else
            check_file "$TASKS_FILE" "TASKS.md"
        fi
    fi

    if [[ "$REQ_TYPE" == "bug" ]]; then
        check_file "$ANALYSIS_FILE" "ANALYSIS.md"
        check_file "$PLAN_FILE" "PLAN.md"
    fi
fi
