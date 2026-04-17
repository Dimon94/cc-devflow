#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# cc-act: 汇总 requirement 当前 gate 与 ship 状态
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: generate-status-report.sh --dir path/to/change
EOF
}

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

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$script_dir/cc-act-common.sh"
CHANGE_DIR="$(req_act_change_dir "$REQ_DIR")"
report_card="$(req_act_report_path "$CHANGE_DIR")"
tasks_file="$(req_act_tasks_path "$CHANGE_DIR")"
handoff_dir="$(req_act_handoff_dir "$CHANGE_DIR")"

verdict="unknown"
reroute="unknown"
evidence_count="0"
gap_count="0"

if [[ -f "$report_card" ]]; then
  verdict="$(jq -r '.verdict // "unknown"' "$report_card" 2>/dev/null || echo unknown)"
  reroute="$(jq -r '.reroute // "unknown"' "$report_card" 2>/dev/null || echo unknown)"
  evidence_count="$(jq -r '(.evidence // []) | length' "$report_card" 2>/dev/null || echo 0)"
  gap_count="$(jq -r '(.gaps // []) | length' "$report_card" 2>/dev/null || echo 0)"
fi

remaining_tasks="0"
done_tasks="0"
if [[ -f "$tasks_file" ]]; then
  remaining_tasks="$(awk '/^- \[ \]/{c++} END{print c+0}' "$tasks_file" 2>/dev/null || echo 0)"
  done_tasks="$(awk '/^- \[[xX]\]/{c++} END{print c+0}' "$tasks_file" 2>/dev/null || echo 0)"
fi

ship_context="$("$script_dir/detect-ship-target.sh" 2>/dev/null || true)"
current_branch="$(printf '%s\n' "$ship_context" | awk -F= '/^CURRENT_BRANCH=/{print $2}')"
base_branch="$(printf '%s\n' "$ship_context" | awk -F= '/^BASE_BRANCH=/{print $2}')"
platform="$(printf '%s\n' "$ship_context" | awk -F= '/^PLATFORM=/{print $2}')"
decision_hint="$(printf '%s\n' "$ship_context" | awk -F= '/^DECISION_HINT=/{print $2}')"
pr_status="$(printf '%s\n' "$ship_context" | awk -F= '/^PR_STATUS=/{print $2}')"
pr_url="$(printf '%s\n' "$ship_context" | awk -F= '/^PR_URL=/{print $2}')"

{
  echo "# Status Report"
  echo
  echo "- Change dir: $CHANGE_DIR"
  echo "- Check result: $verdict"
  echo "- Gate reroute: $reroute"
  echo "- Evidence items: $evidence_count"
  echo "- Open gaps: $gap_count"
  echo "- Completed tasks: $done_tasks"
  echo "- Remaining tasks: $remaining_tasks"
  [[ -n "$current_branch" ]] && echo "- Current branch: $current_branch"
  [[ -n "$base_branch" ]] && echo "- Base branch: $base_branch"
  [[ -n "$platform" ]] && echo "- Platform: $platform"
  [[ -n "$decision_hint" ]] && echo "- Ship mode hint: $decision_hint"
  [[ -n "$pr_status" ]] && echo "- PR status: $pr_status"
  [[ -n "$pr_url" ]] && echo "- PR url: $pr_url"
  [[ -f "$handoff_dir/pr-brief.md" ]] && echo "- PR brief: ready"
  [[ -f "$handoff_dir/release-note.md" ]] && echo "- Release note: ready"
  [[ -f "$handoff_dir/resume-index.md" ]] && echo "- Resume index: ready"
  [[ -f "$handoff_dir/doc-sync-report.md" ]] && echo "- Doc sync report: ready"
}
