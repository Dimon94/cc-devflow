#!/usr/bin/env bash

# ------------------------------------------------------------
# cc-act: task.md + pr-brief path helpers
# ------------------------------------------------------------

req_act_change_dir() {
  local input="$1"
  local normalized="${input%/}"

  case "$(basename "$normalized")" in
    handoff)
      dirname "$normalized"
      ;;
    *)
      printf '%s\n' "$normalized"
      ;;
  esac
}

req_act_handoff_dir() {
  printf '%s/handoff\n' "$(req_act_change_dir "$1")"
}

req_act_tasks_path() {
  printf '%s/task.md\n' "$(req_act_change_dir "$1")"
}

req_act_pr_brief_path() {
  printf '%s/pr-brief.md\n' "$(req_act_handoff_dir "$1")"
}

req_act_repo_root() {
  git rev-parse --show-toplevel 2>/dev/null || pwd
}
