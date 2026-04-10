#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 把澄清结果写成简明报告
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: generate-clarification-report.sh --req REQ-001 --output CLARIFICATION_REPORT.md [--questions questions.txt]
EOF
}

REQ_ID=""
OUTPUT=""
QUESTIONS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --req) REQ_ID="$2"; shift 2 ;;
    --output) OUTPUT="$2"; shift 2 ;;
    --questions) QUESTIONS="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$REQ_ID" || -z "$OUTPUT" ]]; then
  usage
  exit 1
fi

{
  echo "# Clarification Report"
  echo
  echo "## Summary"
  echo
  echo "- Requirement: $REQ_ID"
  echo "- Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo "- Status: draft"
  echo
  echo "## Open Questions"
  echo
  if [[ -n "$QUESTIONS" && -f "$QUESTIONS" ]]; then
    cat "$QUESTIONS"
  else
    echo "- None captured yet"
  fi
  echo
  echo "## Decisions"
  echo
  echo "- "
  echo
  echo "## Deferred"
  echo
  echo "- "
} > "$OUTPUT"

echo "Wrote $OUTPUT"
