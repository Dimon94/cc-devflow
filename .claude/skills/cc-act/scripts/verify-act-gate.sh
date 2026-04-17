#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# cc-act: 校验 Check 阶段是否真的闭合
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: verify-act-gate.sh --dir path/to/change
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

[[ -f "$report_card" ]] || { echo "Gate open: missing report-card.json" >&2; exit 1; }

verdict="$(jq -r '.verdict // "unknown"' "$report_card" 2>/dev/null || echo unknown)"
reroute="$(jq -r '.reroute // "unknown"' "$report_card" 2>/dev/null || echo unknown)"
evidence_count="$(jq -r '(.evidence // []) | length' "$report_card" 2>/dev/null || echo 0)"
gap_count="$(jq -r '(.gaps // []) | length' "$report_card" 2>/dev/null || echo 0)"

remaining_tasks="0"
if [[ -f "$tasks_file" ]]; then
  remaining_tasks="$(awk '/^- \[ \]/{c++} END{print c+0}' "$tasks_file" 2>/dev/null || echo 0)"
fi

[[ "$verdict" == "pass" ]] || { echo "Gate open: verdict=$verdict" >&2; exit 1; }
[[ "$reroute" == "none" ]] || { echo "Gate open: reroute=$reroute" >&2; exit 1; }
[[ "$evidence_count" -gt 0 ]] || { echo "Gate open: evidence is empty" >&2; exit 1; }
[[ "$gap_count" -eq 0 ]] || { echo "Gate open: gaps=$gap_count" >&2; exit 1; }
[[ "$remaining_tasks" -eq 0 ]] || { echo "Gate open: remaining_tasks=$remaining_tasks" >&2; exit 1; }

cat <<EOF
GATE=closed
VERDICT=$verdict
REROUTE=$reroute
EVIDENCE_COUNT=$evidence_count
GAP_COUNT=$gap_count
REMAINING_TASKS=$remaining_tasks
EOF
