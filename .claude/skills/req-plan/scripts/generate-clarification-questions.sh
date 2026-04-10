#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 从草案中提取高优先级待澄清点
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: generate-clarification-questions.sh --input FILE [--max 5]
EOF
}

INPUT=""
MAX=5

while [[ $# -gt 0 ]]; do
  case "$1" in
    --input) INPUT="$2"; shift 2 ;;
    --max) MAX="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$INPUT" || ! -f "$INPUT" ]]; then
  usage
  exit 1
fi

patterns=(
  "\\[NEEDS CLARIFICATION"
  "\\{\\{[^}]+\\}\\}"
  "TODO"
  "待定"
  "暂不明确"
  "later"
)

tmp="$(mktemp)"
for pattern in "${patterns[@]}"; do
  rg -n "$pattern" "$INPUT" >> "$tmp" || true
done

awk -F: '!seen[$1 ":" $2]++ {print}' "$tmp" | head -n "$MAX" | \
awk -F: '{printf "- Q%02d: 第 %s 行仍不明确 -> %s\n", NR, $2, substr($0, index($0, $3))}'

rm -f "$tmp"
