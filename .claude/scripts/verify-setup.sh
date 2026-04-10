#!/usr/bin/env bash
set -e

# ============================================================
# 安装验证 | Verify Setup
# ============================================================
# 目标:
# - 确认 .claude 结构完整
# - 给出最小可用性检查
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

require_dir() {
  local target="$1"
  if [[ ! -d "$target" ]]; then
    echo "ERROR: Missing directory: $target" >&2
    exit 1
  fi
}

require_file() {
  local target="$1"
  if [[ ! -f "$target" ]]; then
    echo "ERROR: Missing file: $target" >&2
    exit 1
  fi
}

require_dir "$CLAUDE_DIR/skills"
require_dir "$CLAUDE_DIR/scripts"
require_file "$CLAUDE_DIR/skills/roadmap/SKILL.md"
require_file "$CLAUDE_DIR/skills/req-plan/SKILL.md"
require_file "$CLAUDE_DIR/skills/req-do/SKILL.md"
require_file "$CLAUDE_DIR/skills/req-check/SKILL.md"
require_file "$CLAUDE_DIR/skills/req-act/SKILL.md"

echo "cc-devflow setup OK."
