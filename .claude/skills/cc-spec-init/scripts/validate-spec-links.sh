#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 校验 spec / roadmap / change 链路是否断裂
# ------------------------------------------------------------

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
INDEX_FILE="$ROOT/devflow/specs/INDEX.md"
CAP_DIR="$ROOT/devflow/specs/capabilities"
FAILED=0

if [[ ! -f "$INDEX_FILE" ]]; then
  echo "Missing devflow/specs/INDEX.md" >&2
  exit 1
fi

if [[ ! -d "$CAP_DIR" ]]; then
  echo "Missing devflow/specs/capabilities/" >&2
  exit 1
fi

while IFS= read -r capability; do
  [[ -z "$capability" ]] && continue
  if [[ ! -f "$CAP_DIR/$capability.md" ]]; then
    echo "Dangling capability in INDEX.md: $capability" >&2
    FAILED=1
  fi
done < <(awk -F'|' '/^\|/ {id=$2; gsub(/^[[:space:]]+|[[:space:]]+$/, "", id); if (id != "" && id != "Capability ID" && id !~ /^-+$/) print id}' "$INDEX_FILE")

while IFS= read -r meta; do
  primary="$(jq -r '.spec.primaryCapability // empty' "$meta" 2>/dev/null || true)"
  [[ -z "$primary" ]] && continue
  if [[ ! -f "$CAP_DIR/$primary.md" ]]; then
    echo "Dangling primary capability in ${meta#$ROOT/}: $primary" >&2
    FAILED=1
  fi
done < <(find "$ROOT/devflow/changes" -maxdepth 2 -name change-meta.json -type f 2>/dev/null | sort)

if [[ "$FAILED" -ne 0 ]]; then
  exit 1
fi

echo "Spec links are valid"
