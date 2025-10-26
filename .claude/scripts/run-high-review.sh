#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/bash/run-high-review.sh --input "<text>" [--severity high]

Generates a placeholder high-rigor review report in reviews/high-review-<timestamp>.md.
USAGE
}

INPUT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --input)
      shift
      INPUT="${1:-}"
      ;;
    --severity)
      shift
      # value ignored in placeholder
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
  shift
done

if [[ -z "$INPUT" ]]; then
  echo "Error: --input payload required." >&2
  usage
  exit 1
fi

REVIEW_DIR="reviews"
mkdir -p "$REVIEW_DIR"
timestamp="$(date -u +"%Y%m%d-%H%M%S")"
report="$REVIEW_DIR/high-review-${timestamp}.md"

cat > "$report" <<EOF
# High-Rigor Code Review (Placeholder)

Input:
\`\`\`
$INPUT
\`\`\`

Status: TODO - integrate review engine.

Please replace this placeholder with the actual review pipeline output.
EOF

echo "Review report generated at $report"
