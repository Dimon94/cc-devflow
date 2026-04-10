#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# req-act: 同步 requirement 级文档，并产出 doc sync 报告
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: sync-act-docs.sh --dir path/to/req [--repo-root path/to/repo]
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
source "$script_dir/req-act-common.sh"
report_card="$REQ_DIR/report-card.json"
manifest="$REQ_DIR/task-manifest.json"
tasks_file="$REQ_DIR/TASKS.md"
design_file="$REQ_DIR/DESIGN.md"
resume_index="$REQ_DIR/resume-index.md"
release_note="$REQ_DIR/RELEASE_NOTE.md"
doc_sync_report="$REQ_DIR/doc-sync-report.md"

"$script_dir/verify-act-gate.sh" --dir "$REQ_DIR" >/dev/null
"$script_dir/generate-status-report.sh" --dir "$REQ_DIR" >/dev/null

ship_context="$("$script_dir/detect-ship-target.sh" 2>/dev/null || true)"
current_branch="$(req_act_ship_field "$ship_context" "CURRENT_BRANCH")"
base_branch="$(req_act_ship_field "$ship_context" "BASE_BRANCH")"
ship_mode="$(req_act_ship_field "$ship_context" "DECISION_HINT")"
pr_status="$(req_act_ship_field "$ship_context" "PR_STATUS")"
pr_url="$(req_act_ship_field "$ship_context" "PR_URL")"

timestamp="$(date '+%Y-%m-%d %H:%M:%S %z')"
requirement_id="$(req_act_requirement_id "$manifest" "$REQ_DIR")"
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
  echo "- Req-Check verdict: $report_verdict"
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
  local-handoff) next_action="Hand off with pr-brief.md, status-report.md, and this resume index." ;;
  post-merge-closeout) next_action="Finish release note, backlog writeback, and archive the requirement." ;;
esac

{
  echo "# Resume Index"
  echo
  echo "- Requirement: $requirement_id"
  echo "- Current stage: req-act"
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
    echo "- Req-Check passed; see report-card.json for evidence."
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
  echo "- Must stay sequential: req-check pass -> doc sync -> pr brief render -> ship action."
} > "$resume_index"

# ------------------------------------------------------------
# 生成 doc sync 报告：要求人工关注的项目级文档目标
# ------------------------------------------------------------
{
  echo "# Doc Sync Report"
  echo
  echo "- Requirement: $requirement_id"
  echo "- Ship mode: $ship_mode"
  echo "- Req-Check verdict: $report_verdict"
  echo "- Updated at: $timestamp"
  echo
  echo "## Synced Requirement Artifacts"
  echo
  echo "- \`status-report.md\`: refreshed"
  echo "- \`RELEASE_NOTE.md\`: refreshed"
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
