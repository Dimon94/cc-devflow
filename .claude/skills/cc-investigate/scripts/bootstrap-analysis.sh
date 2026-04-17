#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="$ROOT_DIR/assets/ANALYSIS_TEMPLATE.md"
REQ_DIR=""

usage() {
  cat <<'EOF'
Usage: bootstrap-analysis.sh --dir <requirement-dir>
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

mkdir -p "$REQ_DIR"
cp "$TEMPLATE" "$REQ_DIR/ANALYSIS.md"
echo "Wrote $REQ_DIR/ANALYSIS.md"
