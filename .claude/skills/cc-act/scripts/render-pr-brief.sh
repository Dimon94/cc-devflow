#!/usr/bin/env bash

set -euo pipefail

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
  REPO_ROOT="$(git -C "$REQ_DIR" rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$script_dir/cc-act-common.sh"

change_dir="$(req_act_change_dir "$REQ_DIR")"
task_file="$(req_act_tasks_path "$change_dir")"
if [[ -z "$OUT_FILE" ]]; then
  OUT_FILE="$(req_act_pr_brief_path "$change_dir")"
fi

"$script_dir/verify-act-gate.sh" --dir "$change_dir" >/dev/null

mkdir -p "$(dirname "$OUT_FILE")"

branch="$(git -C "$REPO_ROOT" branch --show-current 2>/dev/null || true)"
head_sha="$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || true)"
status="$(git -C "$REPO_ROOT" status --short 2>/dev/null || true)"
commits="$(git -C "$REPO_ROOT" log --oneline -10 2>/dev/null || true)"
changed="$(git -C "$REPO_ROOT" diff --stat HEAD 2>/dev/null || true)"
postmortem_context="$("$script_dir/evaluate-postmortem-trigger.sh" --dir "$change_dir" --repo-root "$REPO_ROOT")"

postmortem_field() {
  local key="$1"
  printf '%s\n' "$postmortem_context" | awk -F= -v key="$key" '$1 == key { sub("^[^=]*=", ""); print; exit }'
}

postmortem_required="$(postmortem_field POSTMORTEM_REQUIRED)"
postmortem_triggers="$(postmortem_field TRIGGERS)"
postmortem_incident="$(postmortem_field INCIDENT_PATH)"

trim() {
  sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

resolve_output_language() {
  local language=""
  if [[ -f "$task_file" ]]; then
    language="$(
      awk -F': *' '/Output language:/ { print $2; exit }' "$task_file" \
        | tr -d '\r`' \
        | trim
    )"
  fi

  if [[ -n "$language" ]]; then
    printf '%s\n' "$language"
    return
  fi

  local devflow="$script_dir/../../cc-dev/scripts/resolve-cc-devflow.sh"
  if [[ -f "$devflow" ]]; then
    language="$(
      bash "$devflow" config resolve --cwd "$REPO_ROOT" --format policy 2>/dev/null \
        | awk -F': *' '/^- Output language:/ { print $2; exit }' \
        | tr -d '\r`' \
        | trim
    )"
  fi

  printf '%s\n' "${language:-en}"
}

output_language="$(resolve_output_language)"

if [[ "$output_language" == "zh-CN" ]]; then
  title="PR 交接简报"
  change_heading="变更"
  change_key_label="变更编号"
  branch_label="分支"
  head_label="当前提交"
  task_heading="任务摘要"
  done_prefix="已完成"
  missing_task="缺少 task.md"
  commits_heading="最近提交"
  no_commits="未找到提交"
  diff_heading="当前差异"
  no_diff="没有未提交差异"
  status_heading="工作树状态"
  clean_status="干净"
  postmortem_heading="尸检触发"
  postmortem_required_label="是否需要尸检"
  postmortem_triggers_label="触发原因"
  postmortem_incident_label="尸检路径"
  body_heading="PR 正文草稿"
  summary_label="摘要"
  summary_placeholder="<根据 task.md 和提交记录总结用户可见变化>"
  validation_label="验证"
  validation_placeholder="<填写最新 cc-check 命令和结果>"
  risk_label="风险 / 回滚"
  risk_placeholder="<总结残余风险和回滚路径>"
else
  title="PR Brief"
  change_heading="Change"
  change_key_label="Change key"
  branch_label="Branch"
  head_label="Head"
  task_heading="Task Summary"
  done_prefix="Done"
  missing_task="Missing task.md"
  commits_heading="Recent Commits"
  no_commits="No commits found"
  diff_heading="Current Diff"
  no_diff="No uncommitted diff"
  status_heading="Worktree Status"
  clean_status="Clean"
  postmortem_heading="Postmortem Trigger"
  postmortem_required_label="Postmortem required"
  postmortem_triggers_label="Triggers"
  postmortem_incident_label="Incident path"
  body_heading="PR Body Draft"
  summary_label="Summary"
  summary_placeholder="<summarize user-visible change from task.md and commits>"
  validation_label="Validation"
  validation_placeholder="<copy fresh cc-check commands and results>"
  risk_label="Risk / rollback"
  risk_placeholder="<summarize residual risk and rollback path>"
fi

render_prefixed_lines() {
  local content="$1"
  local empty_text="$2"

  if [[ -n "$content" ]]; then
    printf '%s\n' "$content" | sed 's/^/- /'
  else
    printf -- '- %s\n' "$empty_text"
  fi
}

{
  echo "# $title"
  echo
  echo "## $change_heading"
  echo
  echo "- $change_key_label: $(basename "$change_dir")"
  echo "- $branch_label: ${branch:-unknown}"
  echo "- $head_label: ${head_sha:-unknown}"
  echo "- Output language: $output_language"
  echo
  echo "## $task_heading"
  echo
  if [[ -f "$task_file" ]]; then
    awk -v prefix="$done_prefix" '/^- \[[xX]\] /{print "- " prefix ": " substr($0, 7)}' "$task_file"
  else
    printf -- '- %s\n' "$missing_task"
  fi
  echo
  echo "## $commits_heading"
  echo
  render_prefixed_lines "$commits" "$no_commits"
  echo
  echo "## $diff_heading"
  echo
  render_prefixed_lines "$changed" "$no_diff"
  echo
  echo "## $status_heading"
  echo
  render_prefixed_lines "$status" "$clean_status"
  echo
  echo "## $postmortem_heading"
  echo
  echo "- $postmortem_required_label: ${postmortem_required:-unknown}"
  echo "- $postmortem_triggers_label: ${postmortem_triggers:-none}"
  if [[ "${postmortem_required:-no}" == "yes" ]]; then
    echo "- $postmortem_incident_label: ${postmortem_incident:-unknown}"
  fi
  echo
  echo "## $body_heading"
  echo
  echo "$summary_label:"
  printf -- '- %s\n' "$summary_placeholder"
  echo
  echo "$validation_label:"
  printf -- '- %s\n' "$validation_placeholder"
  echo
  echo "$risk_label:"
  printf -- '- %s\n' "$risk_placeholder"
} > "$OUT_FILE"

echo "Rendered $OUT_FILE"
