#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 本地回写器：更新路线图跟踪表中的状态/REQ/进度
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: sync-roadmap-progress.sh --rm RM-001 [--status Planned] [--req REQ-001] [--progress 50%] [--file ROADMAP.md]
EOF
}

RM_ID=""
STATUS=""
REQ_ID=""
PROGRESS=""
FILE="ROADMAP.md"

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

if [[ -z "$RM_ID" || ! -f "$FILE" ]]; then
  usage
  exit 1
fi

tmp="$(mktemp)"
awk -F'|' -v OFS='|' -v rm="$RM_ID" -v status="$STATUS" -v req="$REQ_ID" -v progress="$PROGRESS" '
  {
    if ($0 ~ "\\|[[:space:]]*" rm "[[:space:]]*\\|") {
      if (status != "") { $6 = " " status " " }
      if (req != "") { $7 = " " req " " }
      if (progress != "") { $8 = " " progress " " }
    }
    print
  }
' "$FILE" > "$tmp"
mv "$tmp" "$FILE"
echo "Updated $RM_ID in $FILE"
