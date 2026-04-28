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
spec_sync_ready="$(jq -r '.specSyncReady // false' "$report_card" 2>/dev/null || echo false)"
evidence_count="$(jq -r '((.evidence // []) + (.claimEvidence // []) + (.quickGates // []) + (.strictGates // [])) | length' "$report_card" 2>/dev/null || echo 0)"
gap_count="$(jq -r '(.gaps // []) | length' "$report_card" 2>/dev/null || echo 0)"
review_freshness="$(jq -r '.review.freshness.status // "unknown"' "$report_card" 2>/dev/null || echo unknown)"
failure_ownership_open="$(jq -r '
  (.runtime.failureOwnership? // [])
  | map(select(((.classification? // "") | IN("in-branch", "ambiguous")) and ((.status? // "open") | IN("open", "pending"))))
  | length
' "$report_card" 2>/dev/null || echo 0)"
coverage_status="$(jq -r '.qa.coverageAudit.status // "unknown"' "$report_card" 2>/dev/null || echo unknown)"
browser_status="$(jq -r '.qa.browserEvidence.status // "unknown"' "$report_card" 2>/dev/null || echo unknown)"
feedback_loop_status="$(jq -r '.qa.feedbackLoop.status // "skipped"' "$report_card" 2>/dev/null || echo skipped)"
behavior_evidence_status="$(jq -r '.qa.behaviorEvidence.status // "skipped"' "$report_card" 2>/dev/null || echo skipped)"

remaining_tasks="0"
if [[ -f "$tasks_file" ]]; then
  remaining_tasks="$(awk '/^- \[ \]/{c++} END{print c+0}' "$tasks_file" 2>/dev/null || echo 0)"
fi

[[ "$verdict" == "pass" ]] || { echo "Gate open: verdict=$verdict" >&2; exit 1; }
[[ "$reroute" == "none" ]] || { echo "Gate open: reroute=$reroute" >&2; exit 1; }
[[ "$spec_sync_ready" == "true" ]] || { echo "Gate open: spec_sync_ready=$spec_sync_ready" >&2; exit 1; }
[[ "$evidence_count" -gt 0 ]] || { echo "Gate open: evidence is empty" >&2; exit 1; }
[[ "$gap_count" -eq 0 ]] || { echo "Gate open: gaps=$gap_count" >&2; exit 1; }
[[ "$review_freshness" == "fresh" || "$review_freshness" == "not-applicable" ]] || { echo "Gate open: review_freshness=$review_freshness" >&2; exit 1; }
[[ "$failure_ownership_open" -eq 0 ]] || { echo "Gate open: failure_ownership_open=$failure_ownership_open" >&2; exit 1; }
[[ "$coverage_status" != "blocked" && "$coverage_status" != "fail" && "$coverage_status" != "pending" ]] || { echo "Gate open: coverage_status=$coverage_status" >&2; exit 1; }
[[ "$browser_status" != "blocked" && "$browser_status" != "fail" && "$browser_status" != "pending" ]] || { echo "Gate open: browser_status=$browser_status" >&2; exit 1; }
[[ "$feedback_loop_status" != "blocked" && "$feedback_loop_status" != "fail" && "$feedback_loop_status" != "pending" ]] || { echo "Gate open: feedback_loop_status=$feedback_loop_status" >&2; exit 1; }
[[ "$behavior_evidence_status" != "blocked" && "$behavior_evidence_status" != "fail" && "$behavior_evidence_status" != "pending" ]] || { echo "Gate open: behavior_evidence_status=$behavior_evidence_status" >&2; exit 1; }
[[ "$remaining_tasks" -eq 0 ]] || { echo "Gate open: remaining_tasks=$remaining_tasks" >&2; exit 1; }

cat <<EOF
GATE=closed
VERDICT=$verdict
REROUTE=$reroute
SPEC_SYNC_READY=$spec_sync_ready
EVIDENCE_COUNT=$evidence_count
GAP_COUNT=$gap_count
REVIEW_FRESHNESS=$review_freshness
FAILURE_OWNERSHIP_OPEN=$failure_ownership_open
COVERAGE_STATUS=$coverage_status
BROWSER_STATUS=$browser_status
FEEDBACK_LOOP_STATUS=$feedback_loop_status
BEHAVIOR_EVIDENCE_STATUS=$behavior_evidence_status
REMAINING_TASKS=$remaining_tasks
EOF
