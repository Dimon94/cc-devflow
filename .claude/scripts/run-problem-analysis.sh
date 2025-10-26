#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/bash/run-problem-analysis.sh --input "<symptom>"

Generates a placeholder problem analysis report in analysis/problem-<timestamp>.md.
USAGE
}

INPUT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --input)
      shift
      INPUT="${1:-}"
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

ANALYSIS_DIR="analysis"
mkdir -p "$ANALYSIS_DIR"
timestamp="$(date -u +"%Y%m%d-%H%M%S")"
report="$ANALYSIS_DIR/problem-${timestamp}.md"

cat > "$report" <<EOF
# Problem Analysis (Placeholder)

Input:
\`\`\`
$INPUT
\`\`\`

- Affected files:
  - TODO
- Root cause:
  - TBD
- Proposed fix:
  - Steps:
  - Tests:
- Documentation gaps:
  - TODO
- Open questions:
  - TODO

Please refine this template with the actual diagnostic results.
EOF

echo "Problem analysis report generated at $report"
