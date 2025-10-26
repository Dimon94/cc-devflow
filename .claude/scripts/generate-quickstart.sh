#!/usr/bin/env bash
# shellcheck disable=SC2312

set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/bash/generate-quickstart.sh <requirement-dir>

Generates a quickstart.md file summarizing environment setup, commands, and
test execution instructions derived from TECH_DESIGN.md and existing project
scripts.
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

python3 - "$REQ_DIR" <<'PY'
from __future__ import annotations

import json
import os
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

req_dir = Path(sys.argv[1]).resolve()
tech_design = req_dir / "TECH_DESIGN.md"
output_path = req_dir / "quickstart.md"

if not tech_design.exists():
    print(f"Error: {tech_design} not found.", file=sys.stderr)
    sys.exit(1)

content = tech_design.read_text(encoding="utf-8", errors="ignore")

def extract_section(title: str) -> str | None:
    pattern = re.compile(rf"(^##\s+{re.escape(title)}.*?)(?=^##\s+|\Z)", re.MULTILINE | re.DOTALL)
    match = pattern.search(content)
    return match.group(1).strip() if match else None

env_section = extract_section("2. Technology Stack")
tests_section = extract_section("6. Performance Design")
security_section = extract_section("5. Security Design")

setup_commands = []
test_commands = []

def search_upwards(filename: str) -> Path | None:
    for parent in [req_dir] + list(req_dir.parents):
        candidate = parent / filename
        if candidate.exists():
            return candidate
    return None

package_json = search_upwards("package.json")
if package_json:
    data = json.loads(package_json.read_text(encoding="utf-8"))
    scripts = data.get("scripts", {})
    for key in ("dev", "start", "lint", "build", "test", "test:integration"):
        if key in scripts:
            command = f"npm run {key}"
            (test_commands if "test" in key else setup_commands).append(command)
    # Also surface underlying script command values for clarity (e.g., pytest)
    for key, val in scripts.items():
        if re.search(r"\bpytest\b", val):
            test_commands.append(val)

makefile = search_upwards("Makefile")
if makefile:
    content = makefile.read_text(encoding="utf-8", errors="ignore")
    for target in ("setup", "serve", "dev", "test", "test-integration"):
        if re.search(rf"^{target}:", content, re.MULTILINE):
            command = f"make {target}"
            (test_commands if "test" in target else setup_commands).append(command)

generated_at = datetime.now(timezone.utc).isoformat()

lines = [
    f"# Quickstart — {req_dir.name}",
    "",
    f"_Generated {generated_at}_",
    "",
    "## 环境准备",
    "",
]

if env_section:
    lines.append(env_section)
else:
    lines.append("- 参考 TECH_DESIGN.md 中的技术栈章节配置环境。")
lines.append("")
lines.append("## 初始化步骤")
lines.append("")

if setup_commands:
    for cmd in dict.fromkeys(setup_commands):
        lines.append(f"- `{cmd}`")
else:
    lines.append("- TODO: 填写项目初始化命令（例如安装依赖、启动服务）。")

lines.append("")
lines.append("## 测试命令")
lines.append("")
if test_commands:
    for cmd in dict.fromkeys(test_commands):
        lines.append(f"- `{cmd}`")
else:
    lines.append("- TODO: 填写单元/集成测试命令。")

lines.append("")
lines.append("## 安全验证提示")
lines.append("")
if security_section:
    lines.append(security_section)
else:
    lines.append("- TODO: 补充安全配置与验证步骤。")

lines.append("")
lines.append("## 性能基线 (可选)")
lines.append("")
if tests_section:
    lines.append(tests_section)
else:
    lines.append("- TODO: 如有性能要求，补充压测或指标监控步骤。")

output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Wrote quickstart guide → {output_path}")
PY
