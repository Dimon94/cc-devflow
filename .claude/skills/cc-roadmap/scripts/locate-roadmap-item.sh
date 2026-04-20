#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 本地定位器：优先从 tracking 真相源定位 RM / REQ
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: locate-roadmap-item.sh <ID> [--roadmap devflow/ROADMAP.md] [--backlog devflow/BACKLOG.md] [--tracking-file devflow/roadmap-tracking.json]

ID can be RM-xxx or REQ-xxx.
EOF
}

TARGET="${1:-}"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
DEFAULT_ROADMAP_FILE="$REPO_ROOT/devflow/ROADMAP.md"
ROOT_ROADMAP_FILE="$REPO_ROOT/ROADMAP.md"
LEGACY_ROADMAP_FILE="$REPO_ROOT/devflow/roadmap/roadmap.md"
DEFAULT_BACKLOG_FILE="$REPO_ROOT/devflow/BACKLOG.md"
ROOT_BACKLOG_FILE="$REPO_ROOT/BACKLOG.md"
LEGACY_BACKLOG_FILE="$REPO_ROOT/devflow/roadmap/backlog.md"
DEFAULT_TRACKING_FILE="$REPO_ROOT/devflow/roadmap-tracking.json"
ROOT_TRACKING_FILE="$REPO_ROOT/roadmap-tracking.json"
LEGACY_TRACKING_FILE="$REPO_ROOT/devflow/roadmap/roadmap-tracking.json"
ROADMAP_FILE="$DEFAULT_ROADMAP_FILE"
BACKLOG_FILE="$DEFAULT_BACKLOG_FILE"
TRACKING_FILE="$DEFAULT_TRACKING_FILE"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -z "$TARGET" ]]; then
  usage
  exit 1
fi
shift || true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --roadmap) ROADMAP_FILE="$2"; shift 2 ;;
    --backlog) BACKLOG_FILE="$2"; shift 2 ;;
    --tracking-file) TRACKING_FILE="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ "$ROADMAP_FILE" == "$DEFAULT_ROADMAP_FILE" && ! -f "$ROADMAP_FILE" ]]; then
  if [[ -f "$ROOT_ROADMAP_FILE" ]]; then
    ROADMAP_FILE="$ROOT_ROADMAP_FILE"
  elif [[ -f "$LEGACY_ROADMAP_FILE" ]]; then
    ROADMAP_FILE="$LEGACY_ROADMAP_FILE"
  fi
fi

if [[ "$BACKLOG_FILE" == "$DEFAULT_BACKLOG_FILE" && ! -f "$BACKLOG_FILE" ]]; then
  if [[ -f "$ROOT_BACKLOG_FILE" ]]; then
    BACKLOG_FILE="$ROOT_BACKLOG_FILE"
  elif [[ -f "$LEGACY_BACKLOG_FILE" ]]; then
    BACKLOG_FILE="$LEGACY_BACKLOG_FILE"
  fi
fi

if [[ "$TRACKING_FILE" == "$DEFAULT_TRACKING_FILE" && ! -f "$TRACKING_FILE" ]]; then
  roadmap_dir="$(cd "$(dirname "$ROADMAP_FILE")" 2>/dev/null && pwd || true)"
  if [[ -n "$roadmap_dir" && -f "$roadmap_dir/roadmap-tracking.json" ]]; then
    TRACKING_FILE="$roadmap_dir/roadmap-tracking.json"
  elif [[ -f "$ROOT_TRACKING_FILE" ]]; then
    TRACKING_FILE="$ROOT_TRACKING_FILE"
  elif [[ -f "$LEGACY_TRACKING_FILE" ]]; then
    TRACKING_FILE="$LEGACY_TRACKING_FILE"
  fi
fi

found=false

print_tracking_matches() {
  local tracking_file="$1"
  local target="$2"
  node "$SCRIPT_DIR/roadmap-tracking.js" find --tracking "$tracking_file" --id "$target"
}

if [[ -f "$TRACKING_FILE" ]]; then
  if print_tracking_matches "$TRACKING_FILE" "$TARGET"; then
    found=true
  fi
fi

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
