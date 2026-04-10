#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 把澄清结果写成简明报告
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: generate-clarification-report.sh --req REQ-001 --output CLARIFICATION_REPORT.md [--questions questions.txt]
       [--req-version REQ-001.v1] [--skill-version 2.0.0]
       [--roadmap-item RM-001] [--roadmap-version 1.0]
EOF
}

REQ_ID=""
OUTPUT=""
QUESTIONS=""
REQ_VERSION=""
SKILL_VERSION=""
ROADMAP_ITEM=""
ROADMAP_VERSION=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --req) REQ_ID="$2"; shift 2 ;;
    --output) OUTPUT="$2"; shift 2 ;;
    --questions) QUESTIONS="$2"; shift 2 ;;
    --req-version) REQ_VERSION="$2"; shift 2 ;;
    --skill-version) SKILL_VERSION="$2"; shift 2 ;;
    --roadmap-item) ROADMAP_ITEM="$2"; shift 2 ;;
    --roadmap-version) ROADMAP_VERSION="$2"; shift 2 ;;
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
  echo "## Document Meta"
  echo
  echo "- Requirement version: ${REQ_VERSION}"
  echo "- Req-Plan skill version: ${SKILL_VERSION}"
  echo "- Source roadmap item: ${ROADMAP_ITEM}"
  echo "- Source roadmap version: ${ROADMAP_VERSION}"
  echo "- Date: $(date '+%Y-%m-%d')"
  echo
  echo "## Summary"
  echo
  echo "- Requirement: $REQ_ID"
  echo "- Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo "- Status: draft"
  echo "- Track: discovery"
  echo "- Next question: "
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
  echo
  echo "## Gate Check"
  echo
  echo "- Enough to recommend an option: no"
  echo "- Enough to write DESIGN.md: no"
  echo "- Version trace updated: no"
} > "$OUTPUT"

echo "Wrote $OUTPUT"
