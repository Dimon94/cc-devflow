#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 把任务标记为完成，并同步 manifest / TASKS
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage:
  mark-task-complete.sh --manifest task-manifest.json [--tasks tasks.md] --task T001
EOF
}

mark_first_task_complete() {
  local tasks_path="$1"
  local task_id="$2"

  awk -v task="$task_id" '
    function task_matches(rest, prefix, next_char) {
      prefix = task
      if (substr(rest, 1, length(prefix)) == prefix) {
        next_char = substr(rest, length(prefix) + 1, 1)
        return next_char == "" || next_char ~ /[^[:alnum:]_-]/
      }

      prefix = "**" task "**"
      if (substr(rest, 1, length(prefix)) == prefix) {
        next_char = substr(rest, length(prefix) + 1, 1)
        return next_char == "" || next_char ~ /[^[:alnum:]_-]/
      }

      return 0
    }

    {
      rest = $0
      if (!replaced && sub(/^- \[ \] /, "", rest) && task_matches(rest)) {
        sub(/^- \[ \] /, "- [x] ")
        replaced = 1
      }

      print
    }
  ' "$tasks_path"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/cc-do-common.sh"
MANIFEST=""
TASKS=""
TASK_ID=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --manifest) MANIFEST="$2"; shift 2 ;;
    --tasks) TASKS="$2"; shift 2 ;;
    --task) TASK_ID="$(echo "$2" | tr '[:lower:]' '[:upper:]')"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$TASK_ID" || (-z "$MANIFEST" && -z "$TASKS") ]]; then
  usage
  exit 1
fi

if [[ -n "$MANIFEST" ]]; then
  if [[ ! -f "$MANIFEST" ]]; then
    usage
    exit 1
  fi

  req_dir="$(req_do_resolve_change_dir "$(cd "$(dirname "$MANIFEST")" && pwd)")"
  "$SCRIPT_DIR/verify-task-gates.sh" --dir "$req_dir" --task "$TASK_ID" >/dev/null

  update_manifest_complete() {
    local tmp_manifest
    local next_task

    tmp_manifest="$(mktemp)"
    jq --arg task "$TASK_ID" '
      .tasks |= map(
        if .id == $task then
          . + {
            status: "passed",
            reviews: ((.reviews // {}) + {spec: ((.reviews.spec // "pass") | tostring), code: ((.reviews.code // "pass") | tostring)})
          }
        else
          .
        end
      )
    ' "$MANIFEST" > "$tmp_manifest"
    mv "$tmp_manifest" "$MANIFEST"

    next_task="$("$SCRIPT_DIR/select-ready-tasks.sh" --manifest "$MANIFEST" | jq -r '.readyTasks[0].id // empty')"

    tmp_manifest="$(mktemp)"
    jq --arg next "$next_task" '
      .currentTaskId = (if $next == "" then null else $next end)
      | .status = (
          if ([.tasks[] | select((.status // "pending") != "passed" and (.status // "pending") != "completed" and (.status // "pending") != "done" and (.status // "pending") != "verified")] | length) == 0
          then "implemented"
          else "in_progress"
          end
        )
    ' "$MANIFEST" > "$tmp_manifest"
    mv "$tmp_manifest" "$MANIFEST"
  }
  req_do_with_lock "$MANIFEST" update_manifest_complete
fi

if [[ -n "$TASKS" ]]; then
  if [[ ! -f "$TASKS" ]]; then
    usage
    exit 1
  fi

  update_tasks_file() {
    local tmp_tasks
    tmp_tasks="$(mktemp)"
    mark_first_task_complete "$TASKS" "$TASK_ID" > "$tmp_tasks"
    mv "$tmp_tasks" "$TASKS"
  }
  req_do_with_lock "$TASKS" update_tasks_file
fi

echo "Marked $TASK_ID complete"
