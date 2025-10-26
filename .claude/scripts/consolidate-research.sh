#!/usr/bin/env bash
# shellcheck disable=SC2312

set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/bash/consolidate-research.sh <requirement-dir>

Aggregates research findings into research/research.md using the standard
Decision/Rationale/Alternatives format. Existing files are overwritten.
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
import sys
from datetime import datetime, timezone
from pathlib import Path

req_dir = Path(sys.argv[1]).resolve()
research_dir = req_dir / "research"
research_dir.mkdir(exist_ok=True, parents=True)
summary_path = research_dir / "research.md"
tasks_path = research_dir / "tasks.json"

def detect_feature_title() -> str:
    readme = req_dir / "README.md"
    if readme.exists():
        for line in readme.read_text(encoding="utf-8").splitlines():
            line = line.strip("# ").strip()
            if line:
                return line
    return req_dir.name

feature_title = detect_feature_title()
generated_at = datetime.now(timezone.utc).isoformat()

tasks_data = {}
if tasks_path.exists():
    try:
        tasks_data = json.loads(tasks_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        tasks_data = {}

tasks = tasks_data.get("tasks", [])

sources = []
for path in research_dir.rglob("*.md"):
    if path.name in {"research.md"}:
        continue
    sources.append(str(path.relative_to(req_dir)))

lines = []
lines.append(f"# Research Summary — {feature_title}")
lines.append("")
lines.append(f"Generated: {generated_at}")
lines.append("")
lines.append("## Decisions")
lines.append("")

if not tasks:
    lines.append("_No research tasks detected. Populate research/tasks.json to track clarifications._")
else:
    for task in tasks:
        task_id = task.get("id", "R???")
        prompt = task.get("prompt", "(unknown prompt)")
        lines.append(f"### {task_id} — {prompt}")
        decision = task.get("decision", "TODO - fill decision outcome")
        rationale = task.get("rationale", "TODO - explain why this decision was chosen")
        alternatives = task.get("alternatives", "TODO - list evaluated alternatives")
        lines.append(f"- Decision: {decision}")
        lines.append(f"- Rationale: {rationale}")
        lines.append(f"- Alternatives considered: {alternatives}")
        source = task.get("source")
        if source:
            lines.append(f"- Source: {source}")
        lines.append("")

lines.append("## Source Library")
lines.append("")
if sources:
    for src in sorted(sources):
        lines.append(f"- {src}")
else:
    lines.append("_No research source files detected yet._")

summary_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Wrote research summary → {summary_path}")
PY
