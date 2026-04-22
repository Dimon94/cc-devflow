#!/usr/bin/env bash

# ------------------------------------------------------------
# cc-do: canonical devflow layout 解析
# ------------------------------------------------------------

req_do_resolve_change_dir() {
  local input="$1"
  local normalized

  normalized="${input%/}"
  case "$(basename "$normalized")" in
    planning|execution|review|handoff|meta)
      dirname "$normalized"
      ;;
    *)
      printf '%s\n' "$normalized"
      ;;
  esac
}

req_do_planning_dir() {
  printf '%s/planning\n' "$(req_do_resolve_change_dir "$1")"
}

req_do_execution_dir() {
  printf '%s/execution\n' "$(req_do_resolve_change_dir "$1")"
}

req_do_review_dir() {
  printf '%s/review\n' "$(req_do_resolve_change_dir "$1")"
}

req_do_handoff_dir() {
  printf '%s/handoff\n' "$(req_do_resolve_change_dir "$1")"
}

req_do_manifest_path() {
  printf '%s/task-manifest.json\n' "$(req_do_planning_dir "$1")"
}

req_do_tasks_path() {
  printf '%s/tasks.md\n' "$(req_do_planning_dir "$1")"
}

req_do_change_meta_path() {
  printf '%s/change-meta.json\n' "$(req_do_resolve_change_dir "$1")"
}

req_do_contract_path() {
  local planning_dir
  local design_file
  local analysis_file

  planning_dir="$(req_do_planning_dir "$1")"
  design_file="$planning_dir/design.md"
  analysis_file="$planning_dir/analysis.md"

  if [[ -f "$analysis_file" && ! -f "$design_file" ]]; then
    printf '%s\n' "$analysis_file"
    return 0
  fi

  printf '%s\n' "$design_file"
}

req_do_report_card_path() {
  printf '%s/report-card.json\n' "$(req_do_review_dir "$1")"
}

req_do_resume_index_path() {
  printf '%s/resume-index.md\n' "$(req_do_handoff_dir "$1")"
}

req_do_task_runtime_dir() {
  local change_dir="$1"
  local task_id="$2"
  printf '%s/tasks/%s\n' "$(req_do_execution_dir "$change_dir")" "$task_id"
}

req_do_with_lock() {
  local target="$1"
  shift
  local lock_dir="${target}.lock"
  local attempts=0

  while ! mkdir "$lock_dir" 2>/dev/null; do
    attempts=$((attempts + 1))
    if [[ "$attempts" -ge 200 ]]; then
      echo "Lock timeout: $target" >&2
      return 1
    fi
    sleep 0.05
  done

  (
    trap 'rmdir "$lock_dir"' EXIT
    "$@"
  )
}
