#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 生成根因分析骨架
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: run-problem-analysis.sh --dir path/to/req --input "symptom"
EOF
}

REQ_DIR=""
INPUT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) REQ_DIR="$2"; shift 2 ;;
    --input) INPUT="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$REQ_DIR" || -z "$INPUT" || ! -d "$REQ_DIR" ]]; then
  usage
  exit 1
fi

cat > "$REQ_DIR/ANALYSIS.md" <<EOF
# ANALYSIS

## Symptom

$INPUT

## Failing Test To Add First

- 

## Reproduction

- 

## Evidence

- 

## Root Cause Hypothesis

- 

## Fix Direction

- 

## Guardrail Test After Fix

- 
EOF

echo "Wrote $REQ_DIR/ANALYSIS.md"
