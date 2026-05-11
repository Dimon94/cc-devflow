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
branch_state="$(req_act_ship_field "$ship_context" "BRANCH_STATE")"
branch_rescue="$(req_act_ship_field "$ship_context" "BRANCH_RESCUE")"
rescue_action="$(req_act_ship_field "$ship_context" "RESCUE_ACTION")"
base_branch="$(req_act_ship_field "$ship_context" "BASE_BRANCH")"
ship_mode="$(req_act_ship_field "$ship_context" "DECISION_HINT")"
pr_status="$(req_act_ship_field "$ship_context" "PR_STATUS")"
pr_url="$(req_act_ship_field "$ship_context" "PR_URL")"

requirement_id="$(req_act_requirement_id "$manifest" "$CHANGE_DIR")"
report_summary="$(req_act_report_summary "$report_card")"
report_verdict="$(req_act_report_verdict "$report_card")"
output_language="$(req_act_output_language "$report_card")"
normalized_output_language="$(printf '%s' "$output_language" | tr '[:upper:]' '[:lower:]')"
case "$normalized_output_language" in
  *zh*|*chinese*|*中文*)
    pr_body_locale="zh"
    pr_language_label="中文"
    ;;
  *)
    pr_body_locale="en"
    pr_language_label="English"
    ;;
esac
design_goal="$(req_act_design_goal "$design_file")"
main_risk="$(req_act_main_risk "$design_file")"
review_base_sha="$(jq -r '[.review.taskReviews.reviewPacket.baseSha?, .review.diffReview.reviewPacket.baseSha?] | map(select(. != null and . != "")) | first // "not recorded"' "$report_card")"
review_head_sha="$(jq -r '[.review.taskReviews.reviewPacket.headSha?, .review.diffReview.reviewPacket.headSha?] | map(select(. != null and . != "")) | first // "not recorded"' "$report_card")"
review_packet_summary="$(jq -r '
  [
    .review.taskReviews.reviewPacket.requirements?,
    .review.diffReview.reviewPacket.requirements?
  ]
  | map(select(. != null and . != ""))
  | unique
  | if length == 0 then "not recorded" else join("; ") end
' "$report_card")"
finding_triage_summary="$(jq -r '
  [
    (.review.taskReviews.findings? // []),
    (.review.diffReview.findings? // []),
    (.review.findings? // [])
  ]
  | flatten
  | map(.triageStatus? // .status? // "untriaged")
  | if length == 0 then "no findings" else group_by(.) | map("\(.[0])=\(length)") | join(", ") end
' "$report_card")"
qa_claim_summary="$(jq -r '
  "qa=\(.qa.status? // "not recorded"), claims=" +
  (((.claimEvidence? // []) | map((.claim // "unknown") + ":" + (.status // "unknown")) | join(", ")) // "not recorded")
' "$report_card")"

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

review_freshness_summary="$(jq -r '
  .review.freshness as $fresh |
  if $fresh == null then
    "not recorded"
  else
    "status=\($fresh.status // "unknown"), reviewed=\($fresh.reviewedCommit // "not recorded"), current=\($fresh.currentCommit // "not recorded"), commitsSinceReview=\($fresh.commitsSinceReview // "unknown")" +
    (if (($fresh.staleReason // "") != "") then ", reason=\($fresh.staleReason)" else "" end)
  end
' "$report_card")"
review_quality_summary="$(jq -r '
  "qualityScore=\(.review.qualityScore // "not recorded")"
' "$report_card")"
specialist_review_summary="$(jq -r '
  (.review.specialistReviews? // [])
  | if length == 0 then
      "no specialist facets recorded"
    else
      map((.name // "unknown") + ":" + (.status // "unknown")) | join(", ")
    end
' "$report_card")"
qa_coverage_summary="$(jq -r '
  .qa.coverageAudit as $coverage |
  if $coverage == null then
    "not recorded"
  else
    "status=\($coverage.status // "unknown"), coverage=\($coverage.coveragePct // "n/a"), gaps=\((($coverage.gaps // []) | length)), e2eRequired=\($coverage.e2eRequired // false), evalRequired=\($coverage.evalRequired // false)"
  end
' "$report_card")"
browser_qa_summary="$(jq -r '
  .qa.browserEvidence as $browser |
  if $browser == null then
    "not recorded"
  else
    "status=\($browser.status // "unknown"), mode=\($browser.mode // "unknown"), routes=\((($browser.affectedRoutes // []) | length)), issues=\((($browser.issues // []) | length)), consoleErrors=\((($browser.consoleErrors // []) | length))" +
    (if (($browser.skipReason // "") != "") then ", skip=\($browser.skipReason)" else "" end)
  end
' "$report_card")"
feedback_loop_summary="$(jq -r '
  .qa.feedbackLoop as $loop |
  if $loop == null then
    "not recorded"
  else
    "status=\($loop.status // "unknown"), mode=\($loop.mode // "unknown"), determinism=\($loop.determinism // "not recorded"), reproductionRate=\($loop.reproductionRate // "not recorded")" +
    (if (($loop.blockedReason // "") != "") then ", blocked=\($loop.blockedReason)" else "" end)
  end
' "$report_card")"
behavior_evidence_summary="$(jq -r '
  .qa.behaviorEvidence as $behavior |
  if $behavior == null then
    "not recorded"
  else
    "status=\($behavior.status // "unknown"), boundary=\($behavior.userFacingBoundary // "not recorded"), expected=\($behavior.expectedBehavior // "not recorded"), actual=\($behavior.actualBehavior // "not recorded"), steps=\((($behavior.reproductionSteps // []) | length))"
  end
' "$report_card")"
failure_ownership_summary="$(jq -r '
  (.runtime.failureOwnership? // [])
  | if length == 0 then
      "no open failures recorded"
    else
      group_by(.classification // "unknown")
      | map("\(.[0].classification // "unknown")=\(length)")
      | join(", ")
    end
' "$report_card")"
documentation_release_summary="CLAUDE=${claude_status}; README=${readme_status}"
pr_body_accuracy_summary="body must be regenerated from this pr-brief, current report-card, and current diff before PR create/update"
roadmap_sync_summary="$(req_act_roadmap_sync_summary "$manifest" "$REPO_ROOT")"

{
  echo "# PR Brief"
  echo
  echo "## Document Meta"
  echo
  echo "- Output language: $output_language"
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
  [[ -n "$branch_state" ]] && echo "- Branch state: $branch_state"
  echo "- Base branch: ${base_branch:-unknown}"
  [[ -n "$branch_rescue" && "$branch_rescue" != "none" ]] && echo "- Branch rescue: $branch_rescue"
  [[ -n "$rescue_action" ]] && echo "- Rescue action: $rescue_action"
  if [[ -n "$pr_url" ]]; then
    echo "- PR / MR: $pr_url ($pr_status)"
  else
    echo "- PR / MR: none"
  fi
  echo
  echo "## Review Range"
  echo
  echo "- Reviewed base SHA: $review_base_sha"
  echo "- Reviewed head SHA: $review_head_sha"
  echo "- Review packet: $review_packet_summary"
  echo "- Finding triage: $finding_triage_summary"
  echo "- QA / claim evidence: $qa_claim_summary"
  echo
  echo "## Readiness Dashboard"
  echo
  echo "- Review freshness: $review_freshness_summary"
  echo "- Review quality: $review_quality_summary"
  echo "- Specialist review facets: $specialist_review_summary"
  echo "- QA coverage: $qa_coverage_summary"
  echo "- Browser QA: $browser_qa_summary"
  echo "- Feedback loop: $feedback_loop_summary"
  echo "- Behavior evidence: $behavior_evidence_summary"
  echo "- Failure ownership: $failure_ownership_summary"
  echo "- Documentation release: $documentation_release_summary"
  echo "- Roadmap progress: $roadmap_sync_summary"
  echo "- PR body accuracy: $pr_body_accuracy_summary"
  echo
  echo "## Pull Request Body Contract"
  echo
  echo "- Language source: \`Output language: $output_language\`"
  echo "- PR body language: $pr_language_label"
  echo "- Title rule: use the same language as the PR body after the Conventional Commits \`type(scope)\` prefix; keep identifiers, paths, commands, and issue keys unchanged."
  echo "- Body source: rebuild from this \`pr-brief.md\`, current diff, current \`review/report-card.json\`, doc sync output, and roadmap/backlog writeback; do not reuse a stale PR body."
  echo "- Required sections: summary, problem, changes, validation, review/gate evidence, risk/rollback, docs/writeback, and follow-ups."
  echo "- Completeness gate: no empty headings, no generic \"tests passed\" claim without commands or evidence, and no \`<placeholder>\` text may remain before \`gh pr create\` or \`gh pr edit\`."
  echo
  echo "## Pull Request Body Draft"
  echo
  echo '```markdown'
  if [[ "$pr_body_locale" == "zh" ]]; then
    echo "## 摘要"
    if [[ -n "$report_summary" ]]; then
      echo "- $report_summary"
    fi
    if [[ -n "$design_goal" && "$design_goal" != "$report_summary" ]]; then
      echo "- $design_goal"
    fi
    if [[ -z "$report_summary" && -z "$design_goal" ]]; then
      echo "- 未记录顶层摘要；创建或更新 PR 前必须补齐。"
    fi
    echo
    echo "## 问题"
    echo "- 需求：$requirement_id"
    echo "- 用户可见缺口：${design_goal:-需要从 planning 产物补齐}"
    echo
    echo "## 变更"
    if [[ -s "$tmp_changed" ]]; then
      while IFS= read -r line; do
        echo "- $line"
      done < "$tmp_changed"
    else
      echo "- 未捕获完成任务列表；创建或更新 PR 前必须补齐。"
    fi
    echo
    echo "## 验证"
    echo "- \`report-card.json\` 结论：$report_verdict"
    if [[ -s "$tmp_evidence" ]]; then
      while IFS= read -r line; do
        echo "- $line"
      done < "$tmp_evidence"
    else
      echo "- 未记录证据行；必须补充命令、退出码或关键观察。"
    fi
    if [[ -s "$tmp_verify" ]]; then
      while IFS= read -r cmd; do
        echo "- \`$cmd\`"
      done < "$tmp_verify"
    fi
    echo
    echo "## Review / Gate 证据"
    echo "- Reviewed base SHA: $review_base_sha"
    echo "- Reviewed head SHA: $review_head_sha"
    echo "- Review packet: $review_packet_summary"
    echo "- Finding triage: $finding_triage_summary"
    echo "- QA / claim evidence: $qa_claim_summary"
    echo "- Readiness: review freshness=[$review_freshness_summary]; qa coverage=[$qa_coverage_summary]; browser QA=[$browser_qa_summary]"
    echo
    echo "## 风险与回滚"
    if [[ -n "$main_risk" ]]; then
      echo "- 主要风险：$main_risk"
    else
      echo "- 主要风险：planning/design.md 未记录新增风险。"
    fi
    echo "- 回滚边界：按 \`Rollback Guard\` 的 safe state、side effects 和 owner 执行；如未补齐，不得合并。"
    echo
    echo "## 文档与回写"
    echo "- \`CLAUDE.md\`: $claude_status"
    echo "- \`README.md\`: $readme_status"
    echo "- Roadmap progress: $roadmap_sync_summary"
    echo
    echo "## 后续事项"
    if [[ -s "$tmp_followups" ]]; then
      while IFS= read -r line; do
        echo "- $line"
      done < "$tmp_followups"
    else
      echo "- 无已记录后续事项。"
    fi
  else
    echo "## Summary"
    if [[ -n "$report_summary" ]]; then
      echo "- $report_summary"
    fi
    if [[ -n "$design_goal" && "$design_goal" != "$report_summary" ]]; then
      echo "- $design_goal"
    fi
    if [[ -z "$report_summary" && -z "$design_goal" ]]; then
      echo "- No top-line summary recorded; fill this before creating or updating the PR."
    fi
    echo
    echo "## Problem"
    echo "- Requirement: $requirement_id"
    echo "- User-visible gap: ${design_goal:-fill from planning artifacts before PR update}"
    echo
    echo "## Changes"
    if [[ -s "$tmp_changed" ]]; then
      while IFS= read -r line; do
        echo "- $line"
      done < "$tmp_changed"
    else
      echo "- No completed task list captured; fill this before creating or updating the PR."
    fi
    echo
    echo "## Validation"
    echo "- \`report-card.json\` verdict: $report_verdict"
    if [[ -s "$tmp_evidence" ]]; then
      while IFS= read -r line; do
        echo "- $line"
      done < "$tmp_evidence"
    else
      echo "- No evidence lines recorded; add command, exit status, or key observation evidence."
    fi
    if [[ -s "$tmp_verify" ]]; then
      while IFS= read -r cmd; do
        echo "- \`$cmd\`"
      done < "$tmp_verify"
    fi
    echo
    echo "## Review / Gate Evidence"
    echo "- Reviewed base SHA: $review_base_sha"
    echo "- Reviewed head SHA: $review_head_sha"
    echo "- Review packet: $review_packet_summary"
    echo "- Finding triage: $finding_triage_summary"
    echo "- QA / claim evidence: $qa_claim_summary"
    echo "- Readiness: review freshness=[$review_freshness_summary]; qa coverage=[$qa_coverage_summary]; browser QA=[$browser_qa_summary]"
    echo
    echo "## Risk And Rollback"
    if [[ -n "$main_risk" ]]; then
      echo "- Main risk: $main_risk"
    else
      echo "- Main risk: no additional risk captured in planning/design.md."
    fi
    echo "- Rollback boundary: follow the \`Rollback Guard\` safe state, side effects, and owner; do not merge if this is incomplete."
    echo
    echo "## Docs And Writeback"
    echo "- \`CLAUDE.md\`: $claude_status"
    echo "- \`README.md\`: $readme_status"
    echo "- Roadmap progress: $roadmap_sync_summary"
    echo
    echo "## Follow-ups"
    if [[ -s "$tmp_followups" ]]; then
      while IFS= read -r line; do
        echo "- $line"
      done < "$tmp_followups"
    else
      echo "- None recorded."
    fi
  fi
  echo '```'
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
  if [[ "$ship_mode" == "post-merge-closeout" ]]; then
    echo "- Merged-result verification: required before closeout; record command, exit status, and key observation"
  else
    echo "- Merged-result verification: not applicable before merge"
  fi
  if [[ -s "$tmp_evidence" ]]; then
    while IFS= read -r line; do
      echo "- $line"
    done < "$tmp_evidence"
  else
    echo "- No evidence lines captured yet."
  fi
  echo
  echo "## QA Behavior Evidence"
  echo
  echo "- Feedback loop: $feedback_loop_summary"
  echo "- Behavior evidence: $behavior_evidence_summary"
  jq -r '
    .qa.behaviorEvidence as $behavior |
    if $behavior == null then empty else
      (($behavior.reproductionSteps // [])[]? | "- Reproduction step: " + .),
      (($behavior.domainLanguage // [])[]? | "- Domain language: " + .)
    end
  ' "$report_card" 2>/dev/null | sed '/^$/d' || true
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
  echo "## Roadmap Progress Sync"
  echo
  echo "- $roadmap_sync_summary"
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
