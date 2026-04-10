#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 归档或恢复 requirement 目录
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage:
  archive-requirement.sh --req-dir path/to/REQ-001 --archive-root devflow/archive
  archive-requirement.sh --restore path/to/archive/2026-04/REQ-001 --active-root devflow/requirements
EOF
}

REQ_DIR=""
ARCHIVE_ROOT=""
RESTORE=""
ACTIVE_ROOT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --req-dir) REQ_DIR="$2"; shift 2 ;;
    --archive-root) ARCHIVE_ROOT="$2"; shift 2 ;;
    --restore) RESTORE="$2"; shift 2 ;;
    --active-root) ACTIVE_ROOT="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -n "$RESTORE" ]]; then
  [[ -n "$ACTIVE_ROOT" ]] || { usage; exit 1; }
  mkdir -p "$ACTIVE_ROOT"
  mv "$RESTORE" "$ACTIVE_ROOT/"
  echo "Restored to $ACTIVE_ROOT"
  exit 0
fi

if [[ -z "$REQ_DIR" || -z "$ARCHIVE_ROOT" || ! -d "$REQ_DIR" ]]; then
  usage
  exit 1
fi

month="$(date '+%Y-%m')"
mkdir -p "$ARCHIVE_ROOT/$month"
mv "$REQ_DIR" "$ARCHIVE_ROOT/$month/"
echo "Archived to $ARCHIVE_ROOT/$month"
