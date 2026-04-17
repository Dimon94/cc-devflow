#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="$ROOT_DIR/assets/ANALYSIS_TEMPLATE.md"
REQ_DIR=""

usage() {
  cat <<'EOF'
Usage: bootstrap-analysis.sh --dir <change-dir>
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) REQ_DIR="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$REQ_DIR" ]]; then
  usage
  exit 1
fi

CHANGE_DIR="${REQ_DIR%/}"
case "$(basename "$CHANGE_DIR")" in
  planning|execution|review|handoff|meta)
    CHANGE_DIR="$(dirname "$CHANGE_DIR")"
    ;;
esac

PLANNING_DIR="$CHANGE_DIR/planning"
mkdir -p "$PLANNING_DIR"
cp "$TEMPLATE" "$PLANNING_DIR/analysis.md"
echo "Wrote $PLANNING_DIR/analysis.md"
