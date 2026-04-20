#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 初始化 capability-centered spec 目录骨架
# ------------------------------------------------------------

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
BASE="$ROOT/devflow/specs"
CAP_DIR="$BASE/capabilities"
SKILL_DIR="$ROOT/.claude/skills/cc-spec-init"

mkdir -p "$CAP_DIR"

copy_if_missing() {
  local src="$1"
  local dest="$2"

  if [[ ! -f "$dest" ]]; then
    cp "$src" "$dest"
    echo "Created ${dest#$ROOT/}"
  else
    echo "Kept ${dest#$ROOT/}"
  fi
}

copy_if_missing "$SKILL_DIR/assets/INDEX_TEMPLATE.md" "$BASE/INDEX.md"
copy_if_missing "$SKILL_DIR/assets/CAPABILITY_TEMPLATE.md" "$CAP_DIR/cap-example.md"

echo "Spec bootstrap complete"
