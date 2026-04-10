#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 从 requirement 目录恢复当前工作位置
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: recover-workflow.sh --dir path/to/requirement
EOF
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REQ_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) REQ_DIR="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$REQ_DIR" || ! -d "$REQ_DIR" ]]; then
  usage
  exit 1
fi

manifest="$REQ_DIR/task-manifest.json"
tasks="$REQ_DIR/TASKS.md"
report="$REQ_DIR/report-card.json"
change_id=""
repo_root="$(git -C "$REQ_DIR" rev-parse --show-toplevel 2>/dev/null || (cd "$REQ_DIR" && pwd))"

echo "# Recovery Snapshot"
echo
echo "- Requirement dir: $REQ_DIR"

if [[ -f "$manifest" ]]; then
  current="$(jq -r '.currentTaskId // "unknown"' "$manifest" 2>/dev/null || echo unknown)"
  status="$(jq -r '.status // "unknown"' "$manifest" 2>/dev/null || echo unknown)"
  change_id="$(jq -r '.changeId // .requirementId // "unknown"' "$manifest" 2>/dev/null || echo unknown)"
  echo "- Manifest status: $status"
  echo "- Change ID: $change_id"
  echo "- Current task: $current"

  ready_json="$("$SCRIPT_DIR/select-ready-tasks.sh" --manifest "$manifest" 2>/dev/null || echo '{}')"
  ready_tasks="$(echo "$ready_json" | jq -r '[.readyTasks[]?.id] | if length == 0 then "none" else join(", ") end')"
  active_phase="$(echo "$ready_json" | jq -r '.activePhase // "unknown"')"
  echo "- Active phase: $active_phase"
  echo "- Ready tasks: $ready_tasks"
fi

if [[ -f "$tasks" ]]; then
  next_task="$(grep '^- \[ \]' "$tasks" | head -1 || true)"
  done_count="$(grep -c '^- \[x\]' "$tasks" 2>/dev/null || echo 0)"
  todo_count="$(grep -c '^- \[ \]' "$tasks" 2>/dev/null || echo 0)"
  echo "- TASKS done: $done_count"
  echo "- TASKS todo: $todo_count"
  [[ -n "$next_task" ]] && echo "- Next visible task: $next_task"
fi

if [[ -f "$report" ]]; then
  verdict="$(jq -r '.verdict // .overall // "unknown"' "$report" 2>/dev/null || echo unknown)"
  echo "- Latest check verdict: $verdict"
fi

if [[ -n "$change_id" && -d "$repo_root/.harness/runtime/$change_id" ]]; then
  runtime_dir="$repo_root/.harness/runtime/$change_id"
  echo "- Runtime dir: $runtime_dir"

  while IFS= read -r checkpoint_path; do
    task_id="$(jq -r '.taskId // "unknown"' "$checkpoint_path" 2>/dev/null || echo unknown)"
    checkpoint_status="$(jq -r '.status // "unknown"' "$checkpoint_path" 2>/dev/null || echo unknown)"
    checkpoint_summary="$(jq -r '.summary // ""' "$checkpoint_path" 2>/dev/null || echo "")"
    echo "- Checkpoint $task_id: $checkpoint_status ${checkpoint_summary:+- $checkpoint_summary}"
  done < <(find "$runtime_dir" -name checkpoint.json | sort)
fi
