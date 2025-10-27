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

def validate_task_completeness(tasks: list) -> tuple[int, int, list]:
    """Validate tasks have decision/rationale/alternatives fields.

    Returns:
        (total_tasks, completed_tasks, incomplete_task_ids)
    """
    total = len(tasks)
    completed = 0
    incomplete = []

    for task in tasks:
        task_id = task.get("id", "???")
        decision = task.get("decision", "")
        rationale = task.get("rationale", "")
        alternatives = task.get("alternatives", "")

        # 字段完整的条件：非空 + 不是 TODO 占位符
        has_decision = bool(decision and decision.strip() and decision != "TODO - fill decision outcome")
        has_rationale = bool(rationale and rationale.strip() and rationale != "TODO - explain why this decision was chosen")
        has_alternatives = bool(alternatives and alternatives.strip() and alternatives != "TODO - list evaluated alternatives")

        if has_decision and has_rationale and has_alternatives:
            completed += 1
        else:
            incomplete.append(task_id)

    return total, completed, incomplete

feature_title = detect_feature_title()
generated_at = datetime.now(timezone.utc).isoformat()

tasks_data = {}
if tasks_path.exists():
    try:
        tasks_data = json.loads(tasks_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        print(f"ERROR: {tasks_path} is not valid JSON", file=sys.stderr)
        sys.exit(1)

tasks = tasks_data.get("tasks", [])

# Validate task completion
if tasks:
    total, completed, incomplete = validate_task_completeness(tasks)
    completion_rate = completed / total if total > 0 else 0

    print(f"Research Tasks: {completed}/{total} completed ({completion_rate:.0%})", file=sys.stderr)

    if completion_rate < 0.5:
        print(f"WARNING: Research incomplete. Only {completed}/{total} tasks have decisions.", file=sys.stderr)
        print(f"Incomplete tasks: {', '.join(incomplete)}", file=sys.stderr)
        print(f"Generated research.md will contain TODO placeholders.", file=sys.stderr)
        print(f"Fix: Add decision/rationale/alternatives fields to tasks.json", file=sys.stderr)

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

        # 处理空字符串，替换为 TODO 占位符
        decision = task.get("decision", "")
        rationale = task.get("rationale", "")
        alternatives = task.get("alternatives", "")

        decision = decision.strip() if decision.strip() else "TODO - fill decision outcome"
        rationale = rationale.strip() if rationale.strip() else "TODO - explain why this decision was chosen"
        alternatives = alternatives.strip() if alternatives.strip() else "TODO - list evaluated alternatives"

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

# Post-write validation: detect TODO placeholders
content = summary_path.read_text(encoding="utf-8")
todo_count = content.count("TODO")
placeholder_count = content.count("{{") + content.count("}}")

if todo_count > 0 or placeholder_count > 0:
    print(f"⚠️  WARNING: Generated research.md contains quality issues:", file=sys.stderr)
    if todo_count > 0:
        print(f"   - {todo_count} TODO marker(s) found", file=sys.stderr)
    if placeholder_count > 0:
        print(f"   - Placeholder markers {{{{ }}}} found", file=sys.stderr)
    print(f"", file=sys.stderr)
    print(f"This will cause validate-research.sh to FAIL.", file=sys.stderr)
    print(f"", file=sys.stderr)
    print(f"Fix Options:", file=sys.stderr)
    print(f"  1. Update tasks.json with actual decision/rationale/alternatives", file=sys.stderr)
    print(f"  2. Manually edit {summary_path.relative_to(req_dir)}", file=sys.stderr)
    print(f"  3. Use .claude/docs/templates/RESEARCH_TEMPLATE.md as reference", file=sys.stderr)
    print(f"", file=sys.stderr)
    print(f"Wrote research summary → {summary_path} (WITH WARNINGS)", file=sys.stderr)
else:
    print(f"✅ Wrote research summary → {summary_path}", file=sys.stderr)
    print(f"   Quality check: No TODO/PLACEHOLDER markers detected", file=sys.stderr)
PY
