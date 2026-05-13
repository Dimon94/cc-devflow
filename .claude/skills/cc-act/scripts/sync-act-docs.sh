#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# cc-act: 同步 requirement 级文档，并产出 doc sync 报告
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: sync-act-docs.sh --dir path/to/change [--repo-root path/to/repo]
EOF
}

REQ_DIR=""
REPO_ROOT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) REQ_DIR="$2"; shift 2 ;;
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
report_card="$(req_act_report_path "$CHANGE_DIR")"
manifest="$(req_act_manifest_path "$CHANGE_DIR")"
tasks_file="$(req_act_tasks_path "$CHANGE_DIR")"
design_file="$(req_act_contract_path "$CHANGE_DIR")"
resume_index="$(req_act_resume_index_path "$CHANGE_DIR")"
release_note="$(req_act_release_note_path "$CHANGE_DIR")"
doc_sync_report="$(req_act_doc_sync_report_path "$CHANGE_DIR")"

"$script_dir/verify-act-gate.sh" --dir "$CHANGE_DIR" >/dev/null
mkdir -p "$(dirname "$resume_index")"

ship_context="$("$script_dir/detect-ship-target.sh" 2>/dev/null || true)"
current_branch="$(req_act_ship_field "$ship_context" "CURRENT_BRANCH")"
branch_state="$(req_act_ship_field "$ship_context" "BRANCH_STATE")"
branch_rescue="$(req_act_ship_field "$ship_context" "BRANCH_RESCUE")"
rescue_action="$(req_act_ship_field "$ship_context" "RESCUE_ACTION")"
base_branch="$(req_act_ship_field "$ship_context" "BASE_BRANCH")"
ship_mode="$(req_act_ship_field "$ship_context" "DECISION_HINT")"
pr_status="$(req_act_ship_field "$ship_context" "PR_STATUS")"
pr_url="$(req_act_ship_field "$ship_context" "PR_URL")"

timestamp="$(date '+%Y-%m-%d %H:%M:%S %z')"
requirement_id="$(req_act_requirement_id "$manifest" "$CHANGE_DIR")"
report_summary="$(req_act_report_summary "$report_card")"
report_verdict="$(req_act_report_verdict "$report_card")"
spec_sync_ready="$(req_act_spec_sync_ready "$report_card")"
output_language="$(req_act_output_language "$report_card")"
design_goal="$(req_act_design_goal "$design_file")"
main_risk="$(req_act_main_risk "$design_file")"
roadmap_sync_summary="$(req_act_roadmap_sync_summary "$manifest" "$REPO_ROOT")"

tmp_changed="$(mktemp)"
tmp_verify="$(mktemp)"
tmp_followups="$(mktemp)"
tmp_touched="$(mktemp)"
tmp_specs="$(mktemp)"
tmp_claude="$(mktemp)"
tmp_readme="$(mktemp)"
cleanup() {
  rm -f "$tmp_changed" "$tmp_verify" "$tmp_followups" "$tmp_touched" "$tmp_specs" "$tmp_claude" "$tmp_readme"
}
trap cleanup EXIT

# ------------------------------------------------------------
# 共享提取：变更 / 验证 / follow-up / touched
# ------------------------------------------------------------
req_act_collect_completed_titles "$manifest" "$tasks_file" "$tmp_changed"
req_act_collect_verification_commands "$manifest" "$tmp_verify"
req_act_collect_followups "$report_card" "$manifest" "$tmp_followups"
req_act_collect_touched_files "$manifest" "$tmp_touched"
req_act_collect_spec_files "$manifest" "$tmp_specs"

nearest_claude() {
  local rel="$1"
  local dir candidate

  if [[ -z "$rel" ]]; then
    return 0
  fi

  dir="$(dirname "$rel")"
  while :; do
    if [[ "$dir" == "." ]]; then
      candidate="$REPO_ROOT/CLAUDE.md"
    else
      candidate="$REPO_ROOT/$dir/CLAUDE.md"
    fi
    if [[ -f "$candidate" ]]; then
      printf '%s\n' "${candidate#$REPO_ROOT/}"
      return 0
    fi
    if [[ "$dir" == "." || "$dir" == "/" ]]; then
      break
    fi
    dir="$(dirname "$dir")"
  done

  if [[ -f "$REPO_ROOT/CLAUDE.md" ]]; then
    printf '%s\n' "CLAUDE.md"
  fi
}

while IFS= read -r touched; do
  nearest_claude "$touched" >> "$tmp_claude" || true
done < "$tmp_touched"
awk 'NF && !seen[$0]++' "$tmp_claude" > "${tmp_claude}.dedup"
mv "${tmp_claude}.dedup" "$tmp_claude"

find "$REPO_ROOT" -maxdepth 2 -type f \( -iname 'README.md' -o -iname 'README*.md' \) \
  -print 2>/dev/null | sed "s|^$REPO_ROOT/||" | awk '!seen[$0]++' > "$tmp_readme" || true

# ------------------------------------------------------------
# 单文件交付：release / resume / doc sync 都进入 pr-brief.md
# ------------------------------------------------------------
next_action="Refresh handoff and close the requirement."
case "$ship_mode" in
  create-pr) next_action="Push current branch and create PR / MR from pr-brief.md." ;;
  update-pr) next_action="Refresh the open PR / MR body and resolve outstanding review feedback." ;;
  local-handoff) next_action="Hand off with pr-brief.md as the single resume entry." ;;
  post-merge-closeout) next_action="Update pr-brief.md release notes/backlog writeback, then run resolved CLI archive-change $requirement_id and verify the archive path." ;;
esac
if [[ "$branch_rescue" == "create-branch-before-pr" ]]; then
  next_action="Run ensure-ship-branch.sh, rerun final verification, then push the named branch and create PR / MR from pr-brief.md."
elif [[ "$branch_rescue" == "create-local-branch-or-handoff" ]]; then
  next_action="Run ensure-ship-branch.sh before local closeout, or keep local-handoff only if no branch should be created."
fi

echo "Doc sync inputs collected for $requirement_id"
echo "Ship mode: $ship_mode"
echo "Next action: $next_action"
echo "No separate release-note.md, resume-index.md, or doc-sync-report.md was written; render-pr-brief.sh owns the single handoff file."
