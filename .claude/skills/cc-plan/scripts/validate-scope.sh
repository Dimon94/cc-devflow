#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 检查计划文档是否越界或仍有 placeholder
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: validate-scope.sh --source FILE [--source FILE...]
EOF
}

sources=()
bad_terms=(
  "TODO later"
  "implement later"
  "handle edge cases"
  "write tests later"
  "{{"
  "[NEEDS CLARIFICATION"
  "TBD"
  "待定"
  "之后再补"
  "后面再想"
)

required_markers=(
  "Requirement version:"
  "CC-Plan skill version:"
)

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source) sources+=("$2"); shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ ${#sources[@]} -eq 0 ]]; then
  usage
  exit 1
fi

fail=0
for file in "${sources[@]}"; do
  [[ -f "$file" ]] || continue
  for term in "${bad_terms[@]}"; do
    if rg -n --fixed-strings "$term" "$file" >/dev/null 2>&1; then
      echo "[FAIL] $file contains: $term"
      fail=1
    fi
  done
  if rg -n '^\|  \|  \|  \|$' "$file" >/dev/null 2>&1; then
    echo "[FAIL] $file contains an empty markdown table row"
    fail=1
  fi
  if rg -n '^[[:space:]]*(- )?[A-Za-z][A-Za-z /_-]*:\s*$' "$file" >/dev/null 2>&1; then
    echo "[FAIL] $file contains an empty field bullet"
    fail=1
  fi
  if [[ "$file" != *"TASK_MANIFEST_TEMPLATE.json" ]]; then
    for marker in "${required_markers[@]}"; do
      if ! rg -n --fixed-strings "$marker" "$file" >/dev/null 2>&1; then
        echo "[FAIL] $file is missing marker: $marker"
        fail=1
      fi
    done
  fi
done

if [[ "$fail" -eq 1 ]]; then
  exit 1
fi

echo "Scope validation passed"
