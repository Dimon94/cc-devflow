#!/usr/bin/env bash
set -euo pipefail

# 计算下一个 REQ/FIX change key，输出两行：changeId 和 changeKey

usage() {
  echo 'Usage: next-change-key.sh --prefix REQ|FIX --description "short description" [--cwd path]'
}

PREFIX=""
DESCRIPTION=""
CWD=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prefix) PREFIX="$2"; shift 2 ;;
    --description) DESCRIPTION="$2"; shift 2 ;;
    --cwd) CWD="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$PREFIX" || -z "$DESCRIPTION" ]]; then
  usage
  exit 1
fi

REPO_ROOT="${CWD:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"

# 优先用本仓库 node CLI（最可靠），再用全局 cc-devflow，最后纯 bash 兜底
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_JS="$SCRIPT_DIR/../../../../bin/cc-devflow-cli.js"

if [[ -f "$CLI_JS" ]] && command -v node >/dev/null 2>&1; then
  node "$CLI_JS" next-change-key --prefix "$PREFIX" --description "$DESCRIPTION" --cwd "$REPO_ROOT"
  exit $?
fi

if command -v cc-devflow >/dev/null 2>&1; then
  cc-devflow next-change-key --prefix "$PREFIX" --description "$DESCRIPTION" --cwd "$REPO_ROOT"
  exit $?
fi

# 纯 bash 兜底：扫描 devflow/changes/ 取 max+1
CHANGES_DIR="$REPO_ROOT/devflow/changes"
PREFIX_UPPER="$(echo "$PREFIX" | tr '[:lower:]' '[:upper:]')"

MAX_NUM=0
PAD_WIDTH=3

if [[ -d "$CHANGES_DIR" ]]; then
  for dir in "$CHANGES_DIR/${PREFIX_UPPER}-"*; do
    [[ -d "$dir" ]] || continue
    basename="$(basename "$dir")"
    num_part="$(echo "$basename" | sed -E "s/^${PREFIX_UPPER}-([0-9]+).*/\1/")"
    if [[ "$num_part" =~ ^[0-9]+$ ]]; then
      num=$((10#$num_part))
      if (( num > MAX_NUM )); then
        MAX_NUM=$num
      fi
      if (( ${#num_part} > PAD_WIDTH )); then
        PAD_WIDTH=${#num_part}
      fi
    fi
  done
fi

NEXT_NUM=$((MAX_NUM + 1))
PADDED_NUM="$(printf "%0${PAD_WIDTH}d" "$NEXT_NUM")"
CHANGE_ID="${PREFIX_UPPER}-${PADDED_NUM}"

SLUG="$(echo "$DESCRIPTION" | tr '[:upper:]' '[:lower:]' | sed -E 's/[[:space:]_]+/-/g; s/^-+|-+$//g')"
[[ -z "$SLUG" ]] && SLUG="change"

CHANGE_KEY="${CHANGE_ID}-${SLUG}"
echo "$CHANGE_ID"
echo "$CHANGE_KEY"
