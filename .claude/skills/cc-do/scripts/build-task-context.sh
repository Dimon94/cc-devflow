#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 组装当前任务的执行上下文，并记录 context_ready 事件
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage:
  build-task-context.sh --dir path/to/change --task T001
EOF
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/cc-do-common.sh"
REQ_DIR=""
TASK_ID=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) REQ_DIR="$2"; shift 2 ;;
    --task) TASK_ID="$(echo "$2" | tr '[:lower:]' '[:upper:]')"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$REQ_DIR" || -z "$TASK_ID" || ! -d "$REQ_DIR" ]]; then
  usage
  exit 1
fi

CHANGE_DIR="$(req_do_resolve_change_dir "$REQ_DIR")"
manifest="$(req_do_manifest_path "$CHANGE_DIR")"
design_file="$(req_do_contract_path "$CHANGE_DIR")"
tasks_file="$(req_do_tasks_path "$CHANGE_DIR")"
change_meta="$(req_do_change_meta_path "$CHANGE_DIR")"
resume_index="$(req_do_resume_index_path "$CHANGE_DIR")"

if [[ ! -f "$manifest" ]]; then
  echo "Missing $manifest" >&2
  exit 1
fi

task_json="$(jq -c --arg task "$TASK_ID" '.tasks[] | select(.id == $task)' "$manifest")"
if [[ -z "$task_json" ]]; then
  echo "$TASK_ID not found in manifest" >&2
  exit 1
fi

change_id="$(jq -r '.changeId // .requirementId // "REQ-UNKNOWN"' "$manifest")"
runtime_task_dir="$(req_do_task_runtime_dir "$CHANGE_DIR" "$TASK_ID")"
output_path="$runtime_task_dir/context.md"
ready_json="$("$SCRIPT_DIR/select-ready-tasks.sh" --manifest "$manifest")"

mkdir -p "$runtime_task_dir"

list_or_none() {
  local value="$1"
  if [[ -z "${value//$'\n'/}" ]]; then
    echo "- None"
  else
    printf '%s\n' "$value" | sed '/^$/d' | awk '!seen[$0]++' | sed 's/^/- /'
  fi
}

task_title="$(jq -r '.title // ""' <<<"$task_json")"
task_phase="$(jq -r '.phase // 0' <<<"$task_json")"
task_status="$(jq -r '.status // "pending"' <<<"$task_json")"
task_parallel="$(jq -r '.parallel // false' <<<"$task_json")"
task_depends="$(jq -r '(.dependsOn // [])[]?' <<<"$task_json")"
task_touches="$(jq -r '((.touches // .files // [])[]?)' <<<"$task_json")"
task_acceptance="$(jq -r '(.acceptance // [])[]?' <<<"$task_json")"
task_verification="$(jq -r '(.verification // [])[]?' <<<"$task_json")"
task_read_files="$(jq -r '(.context.readFiles // [])[]?' <<<"$task_json")"
task_commands="$(jq -r '(.context.commands // [])[]?' <<<"$task_json")"
task_notes="$(jq -r '(.context.notes // [])[]?' <<<"$task_json")"
completed_tasks="$(jq -r '
  .tasks[]
  | select((.status // "pending") == "passed" or (.status // "pending") == "completed" or (.status // "pending") == "done" or (.status // "pending") == "verified")
  | .id
' "$manifest")"
ready_tasks="$(echo "$ready_json" | jq -r '.readyTasks[]?.id')"
running_tasks="$(echo "$ready_json" | jq -r '.runningTasks[]?.id')"
active_phase="$(echo "$ready_json" | jq -r '.activePhase // "unknown"')"
primary_capability="$(jq -r '.spec.primaryCapability // empty' "$manifest" 2>/dev/null || true)"
secondary_capabilities="$(jq -r '(.spec.secondaryCapabilities // [])[]?' "$manifest" 2>/dev/null || true)"
spec_files="$(jq -r '(.spec.specFiles // [])[]?' "$manifest" 2>/dev/null || true)"
expected_delta="$(jq -r '(.spec.expectedDelta // [])[]?' "$manifest" 2>/dev/null || true)"
sync_status="$(jq -r '.spec.syncStatus // "unknown"' "$manifest" 2>/dev/null || true)"

{
  echo "# Task Context"
  echo
  echo "- Change: $change_id"
  echo "- Task: $TASK_ID"
  echo "- Title: $task_title"
  echo "- Phase: $task_phase"
  echo "- Status: $task_status"
  echo "- Parallel eligible: $task_parallel"
  echo "- Active phase: $active_phase"
  echo
  echo "## Current Progress"
  echo
  echo "### Completed Tasks"
  list_or_none "$completed_tasks"
  echo
  echo "### Running Tasks"
  list_or_none "$running_tasks"
  echo
  echo "### Ready Tasks"
  list_or_none "$ready_tasks"
  echo
  echo "## Dependencies"
  echo
  list_or_none "$task_depends"
  echo
  echo "## Touches"
  echo
  list_or_none "$task_touches"
  echo
  echo "## Acceptance"
  echo
  list_or_none "$task_acceptance"
  echo
  echo "## Verification"
  echo
  list_or_none "$task_verification"
  echo
  echo "## Read First"
  echo
  list_or_none "$task_read_files"
  echo
  echo "## Commands To Trust"
  echo
  list_or_none "$task_commands"
  echo
  echo "## Spec Contract"
  echo
  echo "- Primary capability: ${primary_capability:-none}"
  echo "- Spec sync status: ${sync_status:-unknown}"
  echo
  echo "### Secondary Capabilities"
  list_or_none "$secondary_capabilities"
  echo
  echo "### Capability Specs"
  list_or_none "$spec_files"
  echo
  echo "### Expected Spec Delta"
  list_or_none "$expected_delta"
  echo
  echo "## Task Notes"
  echo
  list_or_none "$task_notes"
  echo
  echo "## Canonical Planning Files"
  echo
  [[ -f "$design_file" ]] && echo "- ${design_file#$CHANGE_DIR/}"
  [[ -f "$tasks_file" ]] && echo "- ${tasks_file#$CHANGE_DIR/}"
  [[ -f "$change_meta" ]] && echo "- ${change_meta#$CHANGE_DIR/}"
  echo "- planning/task-manifest.json"
  echo
  echo "## Context Reset"
  echo
  echo "- If chat context drifts, discard conversational memory and reload only the canonical files above plus the latest checkpoint."
  echo "- Do not continue from memory if the current task, active phase, or latest checkpoint summary cannot be restated exactly."
  echo
  if [[ -f "$resume_index" ]]; then
    echo "## Optional Resume Index"
    echo
    cat "$resume_index"
  fi
} > "$output_path"

"$SCRIPT_DIR/write-task-checkpoint.sh" \
  --dir "$CHANGE_DIR" \
  --task "$TASK_ID" \
  --status pending \
  --summary "Task context assembled" \
  --next-action "Write the failing test for $TASK_ID" >/dev/null

cat "$output_path"
