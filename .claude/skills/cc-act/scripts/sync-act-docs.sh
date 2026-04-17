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
base_branch="$(req_act_ship_field "$ship_context" "BASE_BRANCH")"
ship_mode="$(req_act_ship_field "$ship_context" "DECISION_HINT")"
pr_status="$(req_act_ship_field "$ship_context" "PR_STATUS")"
pr_url="$(req_act_ship_field "$ship_context" "PR_URL")"

timestamp="$(date '+%Y-%m-%d %H:%M:%S %z')"
requirement_id="$(req_act_requirement_id "$manifest" "$CHANGE_DIR")"
report_summary="$(req_act_report_summary "$report_card")"
report_verdict="$(req_act_report_verdict "$report_card")"
design_goal="$(req_act_design_goal "$design_file")"
main_risk="$(req_act_main_risk "$design_file")"

tmp_changed="$(mktemp)"
tmp_verify="$(mktemp)"
tmp_followups="$(mktemp)"
tmp_touched="$(mktemp)"
tmp_claude="$(mktemp)"
tmp_readme="$(mktemp)"
cleanup() {
  rm -f "$tmp_changed" "$tmp_verify" "$tmp_followups" "$tmp_touched" "$tmp_claude" "$tmp_readme"
}
trap cleanup EXIT

# ------------------------------------------------------------
# 共享提取：变更 / 验证 / follow-up / touched
# ------------------------------------------------------------
req_act_collect_completed_titles "$manifest" "$tasks_file" "$tmp_changed"
req_act_collect_verification_commands "$manifest" "$tmp_verify"
req_act_collect_followups "$report_card" "$manifest" "$tmp_followups"
req_act_collect_touched_files "$manifest" "$tmp_touched"

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
# 生成 release note
# ------------------------------------------------------------
{
  echo "# Release Note"
  echo
  echo "## User Impact"
  if [[ -n "$report_summary" ]]; then
    echo
    echo "- $report_summary"
  fi
  if [[ -n "$design_goal" && "$design_goal" != "$report_summary" ]]; then
    echo "- $design_goal"
  fi
  if [[ ! -s "$tmp_changed" && -z "$report_summary" && -z "$design_goal" ]]; then
    echo
    echo "- No user-facing summary captured yet."
  fi
  echo
  echo "## What Is New"
  if [[ -s "$tmp_changed" ]]; then
    while IFS= read -r line; do
      echo "- $line"
    done < "$tmp_changed"
  else
    echo
    echo "- No completed task list captured yet."
  fi
  echo
  echo "## Verification"
  echo
  echo "- CC-Check verdict: $report_verdict"
  jq -r '(.evidence // [])[]?' "$report_card" 2>/dev/null | sed '/^$/d' | while IFS= read -r line; do
    echo "- $line"
  done
  if [[ -s "$tmp_verify" ]]; then
    while IFS= read -r cmd; do
      echo "- Verify with: \`$cmd\`"
    done < "$tmp_verify"
  fi
  echo
  echo "## Ops Notes"
  echo
  echo "- Ship mode: $ship_mode"
  echo "- Current branch: ${current_branch:-unknown}"
  echo "- Base branch: ${base_branch:-unknown}"
  [[ -n "$pr_status" ]] && echo "- PR status: $pr_status"
  [[ -n "$pr_url" ]] && echo "- PR url: $pr_url"
  echo
  echo "## Follow-Ups"
  if [[ -s "$tmp_followups" ]]; then
    echo
    while IFS= read -r line; do
      echo "- $line"
    done < "$tmp_followups"
  else
    echo
    echo "- None recorded."
  fi
} > "$release_note"

# ------------------------------------------------------------
# 生成 resume index
# ------------------------------------------------------------
next_action="Refresh handoff and close the requirement."
case "$ship_mode" in
  create-pr) next_action="Push current branch and create PR / MR from pr-brief.md." ;;
  update-pr) next_action="Refresh the open PR / MR body and resolve outstanding review feedback." ;;
  local-handoff) next_action="Hand off with pr-brief.md and this resume index." ;;
  post-merge-closeout) next_action="Finish release note, backlog writeback, and archive the requirement." ;;
esac

{
  echo "# Resume Index"
  echo
  echo "- Requirement: $requirement_id"
  echo "- Current stage: cc-act"
  echo "- Current task: ship:$ship_mode"
  if [[ -s "$tmp_followups" ]]; then
    echo "- Ready tasks: follow-up review"
  else
    echo "- Ready tasks: none"
  fi
  echo "- Updated at: $timestamp"
  echo
  echo "## Last Good Checkpoint"
  echo
  if [[ -n "$report_summary" ]]; then
    echo "- $report_summary"
  else
    echo "- Req-Check passed; see review/report-card.json for evidence."
  fi
  echo "- Ship mode decided as \`$ship_mode\`."
  [[ -n "$pr_url" ]] && echo "- Active PR / MR: $pr_url"
  echo
  echo "## Blockers"
  echo
  if [[ -s "$tmp_followups" ]]; then
    while IFS= read -r line; do
      echo "- $line"
    done < "$tmp_followups"
  else
    echo "- None."
  fi
  echo
  echo "## Next Action"
  echo
  echo "- $next_action"
  echo
  echo "## Parallel Notes"
  echo
  echo "- Safe to parallelize: documentation review, backlog wording, release note polish."
  echo "- Must stay sequential: cc-check pass -> doc sync -> pr brief render -> ship action."
} > "$resume_index"

# ------------------------------------------------------------
# 生成 doc sync 报告：要求人工关注的项目级文档目标
# ------------------------------------------------------------
{
  echo "# Doc Sync Report"
  echo
  echo "- Requirement: $requirement_id"
  echo "- Ship mode: $ship_mode"
  echo "- CC-Check verdict: $report_verdict"
  echo "- Updated at: $timestamp"
  echo
  echo "## Synced Requirement Artifacts"
  echo
  echo "- \`handoff/release-note.md\`: refreshed"
  echo "- \`resume-index.md\`: refreshed"
  echo
  echo "## Touched Files"
  echo
  if [[ -s "$tmp_touched" ]]; then
    while IFS= read -r line; do
      echo "- \`$line\`"
    done < "$tmp_touched"
  else
    echo "- No touched files recorded in task-manifest.json."
  fi
  echo
  echo "## Project Doc Targets"
  echo
  echo "### CLAUDE Targets"
  if [[ -s "$tmp_claude" ]]; then
    echo
    while IFS= read -r line; do
      echo "- \`$line\`"
    done < "$tmp_claude"
  else
    echo
    echo "- No scoped \`CLAUDE.md\` target detected from touched files."
  fi
  echo
  echo "### README Candidates"
  if [[ -s "$tmp_readme" ]]; then
    echo
    while IFS= read -r line; do
      echo "- \`$line\`"
    done < "$tmp_readme"
  else
    echo
    echo "- No README candidate found under repo root."
  fi
  echo
  echo "## Manual Follow-Ups"
  echo
  echo "- Update the listed \`CLAUDE.md\` files if structure, workflow, or operational truth changed."
  echo "- Update README candidates if user-visible behavior or setup flow changed."
  echo "- Re-render \`pr-brief.md\` after any manual doc edits so the PR body stays in sync."
  if [[ -n "$main_risk" ]]; then
    echo "- Main risk to reflect in docs: $main_risk"
  fi
} > "$doc_sync_report"

echo "Synced $release_note"
echo "Synced $resume_index"
echo "Wrote $doc_sync_report"
