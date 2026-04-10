#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 检查验证产物和 report-card 是否齐全
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: verify-gate.sh --report report-card.json [--require FILE...]
EOF
}

REPORT=""
requires=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --report) REPORT="$2"; shift 2 ;;
    --require) requires+=("$2"); shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$REPORT" || ! -f "$REPORT" ]]; then
  usage
  exit 1
fi

jq -e '.verdict and .summary and .evidence and .gaps and .reroute' "$REPORT" >/dev/null

for file in "${requires[@]}"; do
  [[ -f "$file" ]] || { echo "Missing required file: $file" >&2; exit 1; }
done

echo "Gate report is structurally valid"
