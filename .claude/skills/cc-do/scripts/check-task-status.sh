#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 查询 manifest / TASKS 的任务状态
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage:
  check-task-status.sh --manifest task-manifest.json [--task T001]
  check-task-status.sh --tasks tasks.md [--task T001]
EOF
}

TASKS=""
MANIFEST=""
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

if [[ -n "$MANIFEST" ]]; then
  if [[ ! -f "$MANIFEST" ]]; then
    usage
    exit 1
  fi

  if [[ -n "$TASK_ID" ]]; then
    output="$(jq -r --arg task "$TASK_ID" '
      def normalized_status:
        .status // (if (.completed // false) then "passed" else "pending" end);
      def review_status($gate):
        (.reviews[$gate].status // .reviews[$gate] // "pending");
      [.tasks[] | select(.id == $task) | "id=\(.id) status=\(normalized_status) phase=\(.phase // 0) dependsOn=\((.dependsOn // []) | join(",")) parallel=\(.parallel // false) spec=\(review_status("spec")) code=\(review_status("code"))"] | .[0] // empty
    ' "$MANIFEST")"

    if [[ -z "$output" ]]; then
      echo "$TASK_ID not_found"
      exit 1
    fi

    echo "$output"
    exit 0
  fi

  jq -r '
    def normalized_status:
      .status // (if (.completed // false) then "passed" else "pending" end);
    {
      currentTaskId: (.currentTaskId // "none"),
      passed: ([.tasks[] | select((normalized_status == "passed") or (normalized_status == "completed") or (normalized_status == "done") or (normalized_status == "verified"))] | length),
      running: ([.tasks[] | select(normalized_status == "running")] | length),
      pending: ([.tasks[] | select(normalized_status == "pending")] | length),
      blocked: ([.tasks[] | select((normalized_status == "blocked") or (normalized_status == "failed") or (normalized_status == "skipped"))] | length),
      total: (.tasks | length)
    }
    | "current=\(.currentTaskId) passed=\(.passed) running=\(.running) pending=\(.pending) blocked=\(.blocked) total=\(.total)"
  ' "$MANIFEST"
  exit 0
fi

if [[ -z "$TASKS" || ! -f "$TASKS" ]]; then
  usage
  exit 1
fi

if [[ -n "$TASK_ID" ]]; then
  if rg -n "^- \\[x\\].*$TASK_ID" "$TASKS" >/dev/null 2>&1; then
    echo "$TASK_ID complete"
    exit 0
  fi
  if rg -n "^- \\[ \\].*$TASK_ID" "$TASKS" >/dev/null 2>&1; then
    echo "$TASK_ID pending"
    exit 0
  fi
  echo "$TASK_ID not_found"
  exit 1
fi

done_count="$(grep -c '^- \[x\]' "$TASKS" 2>/dev/null || echo 0)"
todo_count="$(grep -c '^- \[ \]' "$TASKS" 2>/dev/null || echo 0)"
total=$((done_count + todo_count))
echo "done=$done_count todo=$todo_count total=$total"
