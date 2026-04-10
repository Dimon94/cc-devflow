#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 从 requirement 目录生成交付摘要
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: generate-status-report.sh --dir path/to/req
EOF
}

REQ_DIR=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) REQ_DIR="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$REQ_DIR" || ! -d "$REQ_DIR" ]]; then
  usage
  exit 1
fi

report="$REQ_DIR/status-report.md"
{
  echo "# Status Report"
  echo
  echo "- Requirement dir: $REQ_DIR"
  [[ -f "$REQ_DIR/report-card.json" ]] && echo "- Check result: $(jq -r '.verdict // "unknown"' "$REQ_DIR/report-card.json" 2>/dev/null || echo unknown)"
  [[ -f "$REQ_DIR/TASKS.md" ]] && echo "- Remaining tasks: $(grep -c '^- \\[ \\]' "$REQ_DIR/TASKS.md" 2>/dev/null || echo 0)"
  [[ -f "$REQ_DIR/RELEASE_NOTE.md" ]] && echo "- Release note: ready"
} > "$report"

echo "Wrote $report"
