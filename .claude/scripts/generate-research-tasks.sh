#!/usr/bin/env bash
# shellcheck disable=SC2312

set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: .claude/scripts/generate-research-tasks.sh <requirement-dir>

Scans the requirement directory for "NEEDS CLARIFICATION" markers and technology
choices, then writes research/tasks.json with structured tasks ready for agents.
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
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict

req_dir = Path(sys.argv[1]).resolve()
research_dir = req_dir / "research"
research_dir.mkdir(exist_ok=True, parents=True)
tasks_path = research_dir / "tasks.json"

def to_relative(p: Path) -> str:
    try:
        return str(p.relative_to(req_dir))
    except ValueError:
        return str(p)

def detect_feature_name() -> str:
    readme = req_dir / "README.md"
    if readme.exists():
        for line in readme.read_text(encoding="utf-8").splitlines():
            line = line.strip("# ").strip()
            if line:
                return line
    return req_dir.name

def collect_unknowns() -> List[Dict[str, str]]:
    pattern = re.compile(r"NEEDS CLARIFICATION", re.IGNORECASE)
    unknowns = []
    for path in req_dir.rglob("*.md"):
        if path.name in {"research.md", "ui_design_strategy.md"}:
            continue
        rel = to_relative(path)
        for idx, line in enumerate(path.read_text(encoding="utf-8", errors="ignore").splitlines(), start=1):
            if pattern.search(line):
                topic = line.split("NEEDS CLARIFICATION", 1)[0]
                topic = topic.replace("-", " ").replace("*", " ").replace("•", " ")
                topic = topic.split(":")[-1].strip()
                if not topic:
                    topic = "unspecified topic"
                payload = {
                    "topic": re.sub(r"\s+", " ", topic).strip(),
                    "source": f"{rel}:{idx}",
                }
                if payload not in unknowns:
                    unknowns.append(payload)
    return unknowns

def collect_technologies() -> List[Dict[str, str]]:
    tech_entries = []
    bold_line = re.compile(r"^\s*[-*]\s*\*\*(?P<label>[^*]+)\*\*:\s*(?P<value>.+)$")
    for filename in ("plan.md", "PLAN.md", "TECH_DESIGN.md"):
        file_path = req_dir / filename
        if not file_path.exists():
            continue
        for line in file_path.read_text(encoding="utf-8", errors="ignore").splitlines():
            match = bold_line.match(line)
            if match:
                label = match.group("label").strip()
                value = match.group("value").strip()
                entry = {"label": label, "value": value}
                if entry not in tech_entries:
                    tech_entries.append(entry)
    return tech_entries

feature_name = detect_feature_name()
unknowns = collect_unknowns()
technologies = collect_technologies()

tasks: List[Dict[str, object]] = []

counter = 1
def next_id() -> str:
    global counter
    ident = f"R{counter:03}"
    counter += 1
    return ident

for unknown in unknowns:
    tasks.append(
        {
            "id": next_id(),
            "type": "clarification",
            "prompt": f"Research {unknown['topic']} for {feature_name}",
            "source": unknown["source"],
            "status": "open",
        }
    )

for tech in technologies:
    label = tech["label"]
    value = tech["value"]
    # strip trailing notes after parentheses to keep prompt concise
    prompt_value = value.split(";")[0].strip()
    tasks.append(
        {
            "id": next_id(),
            "type": "best_practices",
            "prompt": f"Find best practices for {prompt_value} in the context of {feature_name}",
            "source": f"Tech-Choice:{label}",
            "status": "open",
        }
    )

data = {
    "feature": feature_name,
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "requirementDir": str(req_dir),
    "tasks": tasks,
}

tasks_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

print(f"Generated {len(tasks)} research task(s) for {feature_name} → {tasks_path}")
PY
