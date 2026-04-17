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
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
DEFAULT_ROADMAP_FILE="$REPO_ROOT/ROADMAP.md"
LEGACY_ROADMAP_FILE="$REPO_ROOT/devflow/roadmap/roadmap.md"
DEFAULT_BACKLOG_FILE="$REPO_ROOT/BACKLOG.md"
LEGACY_BACKLOG_FILE="$REPO_ROOT/devflow/roadmap/backlog.md"
ROADMAP_FILE="$DEFAULT_ROADMAP_FILE"
BACKLOG_FILE="$DEFAULT_BACKLOG_FILE"

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

if [[ "$ROADMAP_FILE" == "$DEFAULT_ROADMAP_FILE" && ! -f "$ROADMAP_FILE" && -f "$LEGACY_ROADMAP_FILE" ]]; then
  ROADMAP_FILE="$LEGACY_ROADMAP_FILE"
fi

if [[ "$BACKLOG_FILE" == "$DEFAULT_BACKLOG_FILE" && ! -f "$BACKLOG_FILE" && -f "$LEGACY_BACKLOG_FILE" ]]; then
  BACKLOG_FILE="$LEGACY_BACKLOG_FILE"
fi

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
