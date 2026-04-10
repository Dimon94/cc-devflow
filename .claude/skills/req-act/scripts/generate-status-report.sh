#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# req-act: 汇总 requirement 当前 gate 与 ship 状态
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: generate-status-report.sh --dir path/to/req
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

report="$REQ_DIR/status-report.md"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

verdict="unknown"
reroute="unknown"
evidence_count="0"
gap_count="0"

if [[ -f "$REQ_DIR/report-card.json" ]]; then
  verdict="$(jq -r '.verdict // "unknown"' "$REQ_DIR/report-card.json" 2>/dev/null || echo unknown)"
  reroute="$(jq -r '.reroute // "unknown"' "$REQ_DIR/report-card.json" 2>/dev/null || echo unknown)"
  evidence_count="$(jq -r '(.evidence // []) | length' "$REQ_DIR/report-card.json" 2>/dev/null || echo 0)"
  gap_count="$(jq -r '(.gaps // []) | length' "$REQ_DIR/report-card.json" 2>/dev/null || echo 0)"
fi

remaining_tasks="0"
done_tasks="0"
if [[ -f "$REQ_DIR/TASKS.md" ]]; then
  remaining_tasks="$(awk '/^- \[ \]/{c++} END{print c+0}' "$REQ_DIR/TASKS.md" 2>/dev/null || echo 0)"
  done_tasks="$(awk '/^- \[[xX]\]/{c++} END{print c+0}' "$REQ_DIR/TASKS.md" 2>/dev/null || echo 0)"
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
  echo "- Requirement dir: $REQ_DIR"
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
  [[ -f "$REQ_DIR/pr-brief.md" ]] && echo "- PR brief: ready"
  [[ -f "$REQ_DIR/RELEASE_NOTE.md" ]] && echo "- Release note: ready"
  [[ -f "$REQ_DIR/resume-index.md" ]] && echo "- Resume index: ready"
  [[ -f "$REQ_DIR/doc-sync-report.md" ]] && echo "- Doc sync report: ready"
  [[ -f "$REQ_DIR/BACKLOG.md" ]] && echo "- Requirement backlog file: present"
  [[ -f "$REQ_DIR/ROADMAP.md" ]] && echo "- Requirement roadmap file: present"
} > "$report"

echo "Wrote $report"
