#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# cc-act: 从 requirement 真相源渲染 pr-brief.md
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: render-pr-brief.sh --dir path/to/change [--out path/to/pr-brief.md] [--repo-root path/to/repo]
EOF
}

REQ_DIR=""
OUT_FILE=""
REPO_ROOT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) REQ_DIR="$2"; shift 2 ;;
    --out) OUT_FILE="$2"; shift 2 ;;
    --repo-root) REPO_ROOT="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$REQ_DIR" || ! -d "$REQ_DIR" ]]; then
  usage
  exit 1
fi

if [[ -z "$REPO_ROOT" ]]; then
  REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$script_dir/cc-act-common.sh"
CHANGE_DIR="$(req_act_change_dir "$REQ_DIR")"
if [[ -z "$OUT_FILE" ]]; then
  OUT_FILE="$(req_act_handoff_dir "$CHANGE_DIR")/pr-brief.md"
fi
report_card="$(req_act_report_path "$CHANGE_DIR")"
manifest="$(req_act_manifest_path "$CHANGE_DIR")"
tasks_file="$(req_act_tasks_path "$CHANGE_DIR")"
design_file="$(req_act_contract_path "$CHANGE_DIR")"
release_note="$(req_act_release_note_path "$CHANGE_DIR")"
resume_index="$(req_act_resume_index_path "$CHANGE_DIR")"
doc_sync_report="$(req_act_doc_sync_report_path "$CHANGE_DIR")"

"$script_dir/verify-act-gate.sh" --dir "$CHANGE_DIR" >/dev/null
"$script_dir/sync-act-docs.sh" --dir "$CHANGE_DIR" --repo-root "$REPO_ROOT" >/dev/null

ship_context="$("$script_dir/detect-ship-target.sh" 2>/dev/null || true)"
current_branch="$(req_act_ship_field "$ship_context" "CURRENT_BRANCH")"
base_branch="$(req_act_ship_field "$ship_context" "BASE_BRANCH")"
ship_mode="$(req_act_ship_field "$ship_context" "DECISION_HINT")"
pr_status="$(req_act_ship_field "$ship_context" "PR_STATUS")"
pr_url="$(req_act_ship_field "$ship_context" "PR_URL")"

requirement_id="$(req_act_requirement_id "$manifest" "$CHANGE_DIR")"
report_summary="$(req_act_report_summary "$report_card")"
report_verdict="$(req_act_report_verdict "$report_card")"
design_goal="$(req_act_design_goal "$design_file")"
main_risk="$(req_act_main_risk "$design_file")"

tmp_changed="$(mktemp)"
tmp_verify="$(mktemp)"
tmp_followups="$(mktemp)"
tmp_evidence="$(mktemp)"
cleanup() {
  rm -f "$tmp_changed" "$tmp_verify" "$tmp_followups" "$tmp_evidence"
}
trap cleanup EXIT

req_act_collect_completed_titles "$manifest" "$tasks_file" "$tmp_changed"
req_act_collect_verification_commands "$manifest" "$tmp_verify"
req_act_collect_evidence "$report_card" "$tmp_evidence"
req_act_collect_followups "$report_card" "$manifest" "$tmp_followups"

claude_status="manual check required"
readme_status="manual check required"
if [[ -f "$doc_sync_report" ]]; then
  if grep -q 'No scoped `CLAUDE.md` target detected' "$doc_sync_report"; then
    claude_status="no scoped CLAUDE target detected"
  else
    claude_status="see doc-sync-report.md"
  fi
  if grep -q 'No README candidate found' "$doc_sync_report"; then
    readme_status="no README candidate found"
  else
    readme_status="see doc-sync-report.md"
  fi
fi

{
  echo "# PR Brief"
  echo
  echo "## Requirement"
  echo
  echo "- $requirement_id"
  echo
  echo "## Ship Mode"
  echo
  echo "- \`$ship_mode\`"
  echo
  echo "## Branch Context"
  echo
  echo "- Current branch: ${current_branch:-unknown}"
  echo "- Base branch: ${base_branch:-unknown}"
  if [[ -n "$pr_url" ]]; then
    echo "- PR / MR: $pr_url ($pr_status)"
  else
    echo "- PR / MR: none"
  fi
  echo
  echo "## Summary"
  echo
  if [[ -n "$report_summary" ]]; then
    echo "- $report_summary"
  fi
  if [[ -n "$design_goal" && "$design_goal" != "$report_summary" ]]; then
    echo "- $design_goal"
  fi
  if [[ -z "$report_summary" && -z "$design_goal" ]]; then
    echo "- No top-line summary recorded yet."
  fi
  echo
  echo "## What Changed"
  echo
  if [[ -s "$tmp_changed" ]]; then
    while IFS= read -r line; do
      echo "- $line"
    done < "$tmp_changed"
  else
    echo "- No completed task list captured yet."
  fi
  echo
  echo "## Verification Evidence"
  echo
  echo "- \`report-card.json\` verdict: $report_verdict"
  if [[ -s "$tmp_evidence" ]]; then
    while IFS= read -r line; do
      echo "- $line"
    done < "$tmp_evidence"
  else
    echo "- No evidence lines captured yet."
  fi
  echo
  echo "## Documentation Sync"
  echo
  echo "- \`CLAUDE.md\`: $claude_status"
  echo "- \`README.md\`: $readme_status"
  if [[ -f "$release_note" ]]; then
    echo "- \`release-note.md\`: refreshed"
  else
    echo "- \`release-note.md\`: missing"
  fi
  if [[ -f "$resume_index" ]]; then
    echo "- \`resume-index.md\`: refreshed"
  else
    echo "- \`resume-index.md\`: missing"
  fi
  echo
  echo "## How To Verify"
  echo
  if [[ -s "$tmp_verify" ]]; then
    while IFS= read -r cmd; do
      echo "- \`$cmd\`"
    done < "$tmp_verify"
  else
    echo "- See \`review/report-card.json\` evidence."
  fi
  echo
  echo "## Follow-Ups"
  echo
  if [[ -s "$tmp_followups" ]]; then
    while IFS= read -r line; do
      echo "- $line"
    done < "$tmp_followups"
  else
    echo "- None recorded."
  fi
  echo
  echo "## Risks"
  echo
  if [[ -n "$main_risk" ]]; then
    echo "- $main_risk"
  else
    echo "- No additional risk captured in planning/design.md."
  fi
} > "$OUT_FILE"

echo "Wrote $OUT_FILE"
