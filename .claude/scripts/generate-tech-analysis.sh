#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: .claude/scripts/generate-tech-analysis.sh <requirement-dir>

Generates a placeholder codebase tech analysis report at
research/codebase-tech-analysis.md.
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 ]]; then
  echo "Error: requirement directory is required." >&2
  usage
  exit 1
fi

REQ_DIR="$1"
if [[ ! -d "$REQ_DIR" ]]; then
  echo "Error: requirement directory '$REQ_DIR' does not exist." >&2
  exit 1
fi

REPORT="${REQ_DIR}/research/codebase-tech-analysis.md"
mkdir -p "${REQ_DIR}/research"

cat >"$REPORT" <<'REPORT'
# Codebase Technical Analysis (Placeholder)

_TODO: Replace with automated analysis output._

- Data model patterns: TBD
- API implementation patterns: TBD
- Auth/security patterns: TBD
- Database interactions: TBD
- Reusable components: TBD
- Testing strategy: TBD
REPORT

echo "Wrote placeholder tech analysis → $REPORT"
