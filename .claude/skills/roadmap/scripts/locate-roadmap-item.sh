#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 本地定位器：在 ROADMAP / BACKLOG 里找 RM 或 REQ
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: locate-roadmap-item.sh <ID> [--roadmap ROADMAP.md] [--backlog BACKLOG.md]

ID can be RM-xxx or REQ-xxx.
EOF
}

TARGET="${1:-}"
ROADMAP_FILE="ROADMAP.md"
BACKLOG_FILE="BACKLOG.md"

if [[ -z "$TARGET" ]]; then
  usage
  exit 1
fi
shift || true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --roadmap) ROADMAP_FILE="$2"; shift 2 ;;
    --backlog) BACKLOG_FILE="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

found=false

if [[ -f "$ROADMAP_FILE" ]]; then
  if rg -n --fixed-strings "$TARGET" "$ROADMAP_FILE" >/dev/null 2>&1; then
    echo "[ROADMAP]"
    rg -n --fixed-strings "$TARGET" "$ROADMAP_FILE"
    found=true
  fi
fi

if [[ -f "$BACKLOG_FILE" ]]; then
  if rg -n --fixed-strings "$TARGET" "$BACKLOG_FILE" >/dev/null 2>&1; then
    echo "[BACKLOG]"
    rg -n --fixed-strings "$TARGET" "$BACKLOG_FILE"
    found=true
  fi
fi

if [[ "$found" == false ]]; then
  echo "Not found: $TARGET" >&2
  exit 1
fi
