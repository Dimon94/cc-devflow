#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 本地回写器：更新路线图跟踪表中的状态/REQ/进度
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: sync-roadmap-progress.sh --rm RM-001 [--status Planned] [--req REQ-001] [--progress 50%] [--file devflow/ROADMAP.md]
EOF
}

RM_ID=""
STATUS=""
REQ_ID=""
PROGRESS=""
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
DEFAULT_FILE="$REPO_ROOT/devflow/ROADMAP.md"
ROOT_FILE="$REPO_ROOT/ROADMAP.md"
LEGACY_FILE="$REPO_ROOT/devflow/roadmap/roadmap.md"
FILE="$DEFAULT_FILE"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --rm) RM_ID="$2"; shift 2 ;;
    --status) STATUS="$2"; shift 2 ;;
    --req) REQ_ID="$2"; shift 2 ;;
    --progress) PROGRESS="$2"; shift 2 ;;
    --file) FILE="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ "$FILE" == "$DEFAULT_FILE" && ! -f "$FILE" ]]; then
  if [[ -f "$ROOT_FILE" ]]; then
    FILE="$ROOT_FILE"
  elif [[ -f "$LEGACY_FILE" ]]; then
    FILE="$LEGACY_FILE"
  fi
fi

if [[ -z "$RM_ID" || ! -f "$FILE" ]]; then
  usage
  exit 1
fi

tmp="$(mktemp)"
awk -F'|' -v OFS='|' -v rm="$RM_ID" -v status="$STATUS" -v req="$REQ_ID" -v progress="$PROGRESS" '
  {
    if ($0 ~ "\\|[[:space:]]*" rm "[[:space:]]*\\|") {
      if (status != "") { $7 = " " status " " }
      if (req != "") { $8 = " " req " " }
      if (progress != "") { $9 = " " progress " " }
    }
    print
  }
' "$FILE" > "$tmp"
mv "$tmp" "$FILE"
echo "Updated $RM_ID in $FILE"
