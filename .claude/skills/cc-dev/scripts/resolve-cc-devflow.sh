#!/usr/bin/env bash
set -euo pipefail

# ------------------------------------------------------------
# cc-devflow CLI resolver
# ------------------------------------------------------------
# 只接受能证明自身支持当前 workflow 命令的 CLI。
# 旧全局包、adapter 模拟输出、缺少 task-contract/review/query 的入口必须 fail closed。

usage() {
  cat >&2 <<'USAGE'
Usage:
  resolve-cc-devflow.sh require <capability>...
  resolve-cc-devflow.sh <cc-devflow-command> [args...]

Capabilities:
  query workflow-context task-contract review next-change-key config init adapt
USAGE
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || pwd)"
REQUIRED=()
COMMAND_ARGS=()
REQUIRE_ONLY=0

if [[ $# -eq 0 || "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

if [[ "${1:-}" == "require" ]]; then
  REQUIRE_ONLY=1
  shift
  REQUIRED=("$@")
  if [[ ${#REQUIRED[@]} -eq 0 ]]; then
    usage
    exit 2
  fi
else
  COMMAND_ARGS=("$@")
  case "${COMMAND_ARGS[0]}" in
    query)
      REQUIRED=("query")
      if [[ "${COMMAND_ARGS[1]:-}" == "workflow-context" ]]; then
        REQUIRED+=("workflow-context")
      fi
      ;;
    task-contract|review|next-change-key|config|init|adapt)
      REQUIRED=("${COMMAND_ARGS[0]}")
      ;;
    *)
      REQUIRED=("${COMMAND_ARGS[0]}")
      ;;
  esac
fi

contains_word() {
  local haystack="$1"
  local needle="$2"
  grep -Eq "(^|[[:space:]])${needle}([[:space:]]|$)" <<<"$haystack"
}

candidate_supports() {
  local label="$1"
  shift
  local help_output
  local query_output

  help_output="$("$@" --help 2>&1)" || return 1

  for capability in "${REQUIRED[@]}"; do
    case "$capability" in
      workflow-context)
        query_output="$("$@" query list 2>&1)" || return 1
        grep -Fq 'workflow-context' <<<"$query_output" || return 1
        ;;
      query|task-contract|review|next-change-key|config|init|adapt)
        contains_word "$help_output" "$capability" || return 1
        ;;
      *)
        contains_word "$help_output" "$capability" || return 1
        ;;
    esac
  done

  printf 'Using cc-devflow CLI: %s\n' "$label" >&2
  return 0
}

try_candidate() {
  local label="$1"
  shift

  if candidate_supports "$label" "$@"; then
    if [[ "$REQUIRE_ONLY" -eq 1 ]]; then
      exit 0
    fi
    exec "$@" "${COMMAND_ARGS[@]}"
  fi
}

try_env_candidate() {
  local cli_path="${CC_DEVFLOW_CLI:-}"
  if [[ -z "$cli_path" ]]; then
    return 0
  fi

  if [[ "$cli_path" == *.js ]]; then
    if command -v node >/dev/null 2>&1 && [[ -f "$cli_path" ]]; then
      try_candidate "CC_DEVFLOW_CLI node:$cli_path" node "$cli_path"
    fi
    return 0
  fi

  if [[ -x "$cli_path" ]]; then
    try_candidate "CC_DEVFLOW_CLI:$cli_path" "$cli_path"
  fi
}

try_repo_package_candidate() {
  local cli_js="$REPO_ROOT/bin/cc-devflow-cli.js"
  local package_json="$REPO_ROOT/package.json"

  if [[ -f "$cli_js" && -f "$package_json" ]] \
    && command -v node >/dev/null 2>&1 \
    && grep -Fq '"name": "cc-devflow"' "$package_json"; then
    try_candidate "repo package:$cli_js" node "$cli_js"
  fi
}

try_node_modules_candidates() {
  local package_cli="$REPO_ROOT/node_modules/cc-devflow/bin/cc-devflow-cli.js"
  local bin_cli="$REPO_ROOT/node_modules/.bin/cc-devflow"

  if [[ -f "$package_cli" ]] && command -v node >/dev/null 2>&1; then
    try_candidate "project package:$package_cli" node "$package_cli"
  fi

  if [[ -x "$bin_cli" ]]; then
    try_candidate "project bin:$bin_cli" "$bin_cli"
  fi
}

try_path_candidate() {
  if command -v cc-devflow >/dev/null 2>&1; then
    try_candidate "PATH:$(command -v cc-devflow)" cc-devflow
  fi
}

try_npx_candidate() {
  if command -v npx >/dev/null 2>&1; then
    try_candidate "npx cc-devflow@latest" npx --yes cc-devflow@latest
  fi
}

try_env_candidate
try_repo_package_candidate
try_node_modules_candidates
try_path_candidate
try_npx_candidate

{
  printf 'No supported cc-devflow CLI found.\n'
  printf 'Required capabilities: %s\n' "${REQUIRED[*]}"
  printf 'Install or update cc-devflow, or set CC_DEVFLOW_CLI to a compatible cc-devflow-cli.js.\n'
  printf 'Do not use simulated adapter output. Do not handwrite task-manifest.json, change-meta.json, review-ledger.jsonl, review-findings.json, or report-card.json.\n'
} >&2
exit 1
