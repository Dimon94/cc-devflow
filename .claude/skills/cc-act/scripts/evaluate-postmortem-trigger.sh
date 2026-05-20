#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: evaluate-postmortem-trigger.sh --dir path/to/change [--repo-root path/to/repo] [--date YYYY-MM-DD] [--trigger label]
EOF
}

REQ_DIR=""
REPO_ROOT=""
TODAY=""
SESSION_TRIGGERS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) REQ_DIR="$2"; shift 2 ;;
    --repo-root) REPO_ROOT="$2"; shift 2 ;;
    --date) TODAY="$2"; shift 2 ;;
    --trigger)
      SESSION_TRIGGERS="${SESSION_TRIGGERS}${SESSION_TRIGGERS:+$'\n'}$2"
      shift 2
      ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$REQ_DIR" || ! -d "$REQ_DIR" ]]; then
  usage
  exit 1
fi

if [[ -z "$TODAY" ]]; then
  TODAY="$(date +%F)"
fi

if [[ -z "$REPO_ROOT" ]]; then
  REPO_ROOT="$(git -C "$REQ_DIR" rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$script_dir/cc-act-common.sh"

change_dir="$(req_act_change_dir "$REQ_DIR")"
task_file="$(req_act_tasks_path "$change_dir")"
change_key="$(basename "$change_dir")"
incident_path="devflow/postmortems/incidents/$TODAY-$change_key.md"
index_path="devflow/postmortems/INDEX.md"
triggers=""

add_trigger() {
  local trigger="$1"

  [[ -n "$trigger" ]] || return 0
  triggers="${triggers}${triggers:+$'\n'}$trigger"
}

if [[ "$change_key" == FIX-* ]]; then
  add_trigger "change-key:FIX"
fi

if [[ -f "$task_file" ]]; then
  if rg -i --quiet 'postmortem[ -]?(required|signal|trigger)[: ]+(yes|required|true)' "$task_file"; then
    add_trigger "task:postmortem-required"
  fi
  if rg -i --quiet '(incident|failure|reroute|rework)[ -]?postmortem[: ]+(yes|required|true)' "$task_file"; then
    add_trigger "task:incident-postmortem"
  fi
  if rg -i --quiet 'Keep for postmortem:[[:space:]]*(yes|true|required)' "$task_file"; then
    add_trigger "task:failure-ledger"
  fi
  if rg -i --quiet '\|[^|]*confirmed-lesson[^|]*\|[[:space:]]*(yes|true|required)[[:space:]]*\|' "$task_file"; then
    add_trigger "task:failure-ledger"
  fi
fi

while IFS= read -r trigger; do
  [[ -n "$trigger" ]] || continue
  add_trigger "session:$trigger"
done <<< "$SESSION_TRIGGERS"

if [[ -n "$triggers" ]]; then
  required="yes"
  trigger_text="$(printf '%s\n' "$triggers" | awk 'NF && !seen[$0]++' | paste -sd ',' -)"
else
  required="no"
  trigger_text="none"
fi

cat <<EOF
POSTMORTEM_REQUIRED=$required
CHANGE_KEY=$change_key
TRIGGERS=$trigger_text
INDEX_PATH=$index_path
INCIDENT_PATH=$incident_path
TASK_FILE=$task_file
EOF
