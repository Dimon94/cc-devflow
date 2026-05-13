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

# 通过共享 resolver 找到可证明支持 next-change-key 的真实 CLI。
# 不再用 PATH 裸命令或 bash 扫目录兜底；缺 CLI 时必须 fail closed。
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESOLVER="$SCRIPT_DIR/../../cc-dev/scripts/resolve-cc-devflow.sh"

if [[ ! -f "$RESOLVER" ]]; then
  echo "Missing cc-devflow CLI resolver: $RESOLVER" >&2
  echo "Do not compute change keys manually; install/update cc-devflow skills." >&2
  exit 1
fi

bash "$RESOLVER" next-change-key --prefix "$PREFIX" --description "$DESCRIPTION" --cwd "$REPO_ROOT"
