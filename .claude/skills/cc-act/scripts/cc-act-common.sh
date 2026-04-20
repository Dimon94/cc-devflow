#!/usr/bin/env bash

# ------------------------------------------------------------
# cc-act: 共享提取与归一化逻辑
# ------------------------------------------------------------

req_act_change_dir() {
  local input="$1"
  local normalized="${input%/}"

  case "$(basename "$normalized")" in
    planning|execution|review|handoff|meta)
      dirname "$normalized"
      ;;
    *)
      printf '%s\n' "$normalized"
      ;;
  esac
}

req_act_planning_dir() {
  printf '%s/planning\n' "$(req_act_change_dir "$1")"
}

req_act_review_dir() {
  printf '%s/review\n' "$(req_act_change_dir "$1")"
}

req_act_handoff_dir() {
  printf '%s/handoff\n' "$(req_act_change_dir "$1")"
}

req_act_manifest_path() {
  printf '%s/task-manifest.json\n' "$(req_act_planning_dir "$1")"
}

req_act_tasks_path() {
  printf '%s/tasks.md\n' "$(req_act_planning_dir "$1")"
}

req_act_contract_path() {
  local planning_dir
  local design_file
  local analysis_file

  planning_dir="$(req_act_planning_dir "$1")"
  design_file="$planning_dir/design.md"
  analysis_file="$planning_dir/analysis.md"

  if [[ -f "$analysis_file" && ! -f "$design_file" ]]; then
    printf '%s\n' "$analysis_file"
    return 0
  fi

  printf '%s\n' "$design_file"
}

req_act_report_path() {
  printf '%s/report-card.json\n' "$(req_act_review_dir "$1")"
}

req_act_release_note_path() {
  printf '%s/release-note.md\n' "$(req_act_handoff_dir "$1")"
}

req_act_resume_index_path() {
  printf '%s/resume-index.md\n' "$(req_act_handoff_dir "$1")"
}

req_act_doc_sync_report_path() {
  printf '%s/doc-sync-report.md\n' "$(req_act_handoff_dir "$1")"
}

req_act_repo_root() {
  git rev-parse --show-toplevel 2>/dev/null || pwd
}

req_act_requirement_id() {
  local manifest="$1"
  local req_dir="$2"
  local requirement_id=""

  requirement_id="$(jq -r '.requirementId // .changeId // empty' "$manifest" 2>/dev/null || true)"
  if [[ -z "$requirement_id" ]]; then
    requirement_id="$(basename "$req_dir")"
  fi

  printf '%s\n' "$requirement_id"
}

req_act_report_summary() {
  local report_card="$1"
  jq -r '.summary // ""' "$report_card" 2>/dev/null || true
}

req_act_report_verdict() {
  local report_card="$1"
  jq -r '.verdict // "unknown"' "$report_card" 2>/dev/null || echo unknown
}

req_act_spec_sync_ready() {
  local report_card="$1"
  jq -r '.specSyncReady // false' "$report_card" 2>/dev/null || echo false
}

req_act_design_goal() {
  local design_file="$1"
  awk -F': ' '/^- Deliver:/{print $2; exit} /^- Change:/{print $2; exit}' "$design_file" 2>/dev/null || true
}

req_act_main_risk() {
  local design_file="$1"
  local risk=""

  risk="$(awk -F': ' '/^- Main risk:/{print $2; exit}' "$design_file" 2>/dev/null || true)"
  if [[ -n "$risk" ]]; then
    printf '%s\n' "$risk"
    return 0
  fi

  awk -F'|' '
    /^\|/ {
      risk=$2
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", risk)
      if (risk != "" && risk != "Risk" && risk !~ /^-+$/) {
        print risk
        exit
      }
    }
  ' "$design_file" 2>/dev/null || true
}

req_act_dedup_file() {
  local file="$1"
  awk 'NF && !seen[$0]++' "$file" > "${file}.dedup"
  mv "${file}.dedup" "$file"
}

req_act_collect_completed_titles() {
  local manifest="$1"
  local tasks_file="$2"
  local out_file="$3"

  : > "$out_file"

  if [[ -f "$manifest" ]]; then
    jq -r '
      (.tasks // [])
      | map(select((.status // "") | test("done|completed"; "i")))
      | .[]
      | .title // empty
    ' "$manifest" 2>/dev/null | sed '/^$/d' > "$out_file" || true
  fi

  if [[ ! -s "$out_file" && -f "$tasks_file" ]]; then
    awk '/^- \[[xX]\] /{sub(/^- \[[xX]\] /, "", $0); print}' "$tasks_file" > "$out_file" || true
  fi
}

req_act_collect_verification_commands() {
  local manifest="$1"
  local out_file="$2"

  : > "$out_file"

  if [[ -f "$manifest" ]]; then
    jq -r '
      (.tasks // [])
      | map(.verification // [])
      | add
      | .[]?
    ' "$manifest" 2>/dev/null | sed '/^$/d' > "$out_file" || true
  fi

  req_act_dedup_file "$out_file"
}

req_act_collect_followups() {
  local report_card="$1"
  local manifest="$2"
  local out_file="$3"

  : > "$out_file"

  if [[ -f "$report_card" ]]; then
    jq -r '(.gaps // [])[]?' "$report_card" 2>/dev/null | sed '/^$/d' > "$out_file" || true
  fi

  if [[ -f "$manifest" ]]; then
    jq -r '(.openQuestions // [])[]?, (.deferredQuestions // [])[]?' "$manifest" 2>/dev/null | sed '/^$/d' >> "$out_file" || true
  fi

  req_act_dedup_file "$out_file"
}

req_act_collect_touched_files() {
  local manifest="$1"
  local out_file="$2"

  : > "$out_file"

  if [[ -f "$manifest" ]]; then
    jq -r '
      (.tasks // [])
      | map((.files // []) + (.touches // []))
      | add
      | .[]?
    ' "$manifest" 2>/dev/null | sed '/^$/d' > "$out_file" || true
  fi

  req_act_dedup_file "$out_file"
}

req_act_collect_spec_files() {
  local manifest="$1"
  local out_file="$2"

  : > "$out_file"

  if [[ -f "$manifest" ]]; then
    jq -r '(.spec.specFiles // [])[]?' "$manifest" 2>/dev/null | sed '/^$/d' > "$out_file" || true
  fi

  req_act_dedup_file "$out_file"
}

req_act_collect_evidence() {
  local report_card="$1"
  local out_file="$2"

  : > "$out_file"
  jq -r '(.evidence // [])[]?' "$report_card" 2>/dev/null | sed '/^$/d' > "$out_file" || true
  req_act_dedup_file "$out_file"
}

req_act_ship_field() {
  local ship_context="$1"
  local key="$2"
  printf '%s\n' "$ship_context" | awk -F= -v key="$key" '$1 == key {print substr($0, index($0, "=") + 1)}'
}
