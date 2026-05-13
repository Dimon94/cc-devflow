#!/usr/bin/env bash

# ------------------------------------------------------------
# cc-do: task.md only path helpers
# ------------------------------------------------------------

req_do_resolve_change_dir() {
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

req_do_tasks_path() {
  printf '%s/task.md\n' "$(req_do_resolve_change_dir "$1")"
}

req_do_handoff_dir() {
  printf '%s/handoff\n' "$(req_do_resolve_change_dir "$1")"
}
