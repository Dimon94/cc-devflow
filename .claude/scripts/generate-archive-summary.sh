#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

CHANGE_ID="${1:-}"

if [[ -z "$CHANGE_ID" ]]; then
    echo "Usage: generate-archive-summary.sh <change-id>" >&2
    exit 1
fi

if ! validate_change_id "$CHANGE_ID" >/dev/null; then
    exit 1
fi

repo_root=$(get_repo_root)
if ! change_dir=$(locate_change_dir "$repo_root" "$CHANGE_ID"); then
    echo "ERROR: change directory not found (active or archived) for $CHANGE_ID" >&2
    exit 1
fi
delta_json="$change_dir/delta.json"
tasks_json="$change_dir/task-progress.json"
constitution_json="$change_dir/constitution.json"
summary_md="$change_dir/summary.md"

if [[ ! -f "$delta_json" ]]; then
    echo "ERROR: delta.json not found in $change_dir" >&2
    exit 1
fi

python3 - <<'PY' "$delta_json" "$tasks_json" "$constitution_json" "$summary_md" "$change_dir" "$repo_root"
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

delta_path = Path(sys.argv[1])
tasks_path = Path(sys.argv[2])
constitution_path = Path(sys.argv[3])
summary_path = Path(sys.argv[4])
change_dir = Path(sys.argv[5])
repo_root = Path(sys.argv[6])

timestamp = datetime.now(timezone.utc).isoformat()

delta = json.loads(delta_path.read_text(encoding="utf-8"))
requirements = delta.get("requirements") or {}

added = requirements.get("added") or []
modified = requirements.get("modified") or []
removed = requirements.get("removed") or []
renamed = requirements.get("renamed") or []

related_requirements = delta.get("relatedRequirements") or []
capabilities = delta.get("capabilities") or sorted(
    {
        entry.get("capability")
        for entry in added + modified + removed + renamed
        if entry.get("capability")
    }
)

tasks = {}
if tasks_path.exists():
    try:
        tasks = json.loads(tasks_path.read_text(encoding="utf-8"))
    except Exception:
        tasks = {}

constitution = {}
if constitution_path.exists():
    try:
        constitution = json.loads(constitution_path.read_text(encoding="utf-8"))
    except Exception:
        constitution = {}

def render_requirement_list(items):
    lines = []
    for entry in items:
        capability = entry.get("capability", "unknown")
        name = entry.get("name", "Unnamed")
        lines.append(f"- **{capability}** — {name}")
    return lines or ["_None_"]

def render_renamed_list(items):
    lines = []
    for entry in items:
        capability = entry.get("capability", "unknown")
        old = entry.get("from", "Unknown")
        new = entry.get("to", "Unknown")
        lines.append(f"- **{capability}** — `{old}` → `{new}`")
    return lines or ["_None_"]

def escape_table_cell(text):
    base = "" if text is None else str(text)
    value = base.replace("|", "\\|").replace("\n", " ").strip()
    return value or "&nbsp;"

def render_constitution_table(data):
    articles = data.get("articles")
    if not isinstance(articles, list) or not articles:
        return ["_No constitution tracking_"]

    lines = ["| Article | Status | Notes |", "|---------|--------|-------|"]
    for entry in articles:
        article = entry.get("article", "?")
        status = entry.get("status", "pending")
        notes = escape_table_cell(entry.get("notes", ""))
        lines.append(f"| {article} | {status} | {notes} |")
    return lines

task_completed = tasks.get("completed")
task_total = tasks.get("total")
task_section = "_Not available_"
if isinstance(task_completed, int) and isinstance(task_total, int) and task_total >= 0:
    task_section = f"{task_completed} / {task_total} ({(task_completed / task_total * 100) if task_total else 0:.1f}%)" if task_total else "0 / 0 (0.0%)"

lines = []
change_id = delta.get("changeId") or delta_path.parent.name
lines.append(f"# Change Summary: {delta.get('changeId', 'unknown')}")
lines.append("")
lines.append(f"- Generated: {timestamp}")
lines.append(f"- Capabilities: {', '.join(sorted(capabilities)) if capabilities else 'N/A'}")
lines.append(f"- Related Requirements: {', '.join(related_requirements) if related_requirements else 'N/A'}")
lines.append("")
lines.append("## Requirements Delta")
lines.append("")
lines.append(f"### Added ({len(added)})")
lines.extend(render_requirement_list(added))
lines.append("")
lines.append(f"### Modified ({len(modified)})")
lines.extend(render_requirement_list(modified))
lines.append("")
lines.append(f"### Removed ({len(removed)})")
lines.extend(render_requirement_list(removed))
lines.append("")
lines.append(f"### Renamed ({len(renamed)})")
lines.extend(render_renamed_list(renamed))
lines.append("")
lines.append("## Task Progress")
lines.append("")
lines.append(f"- Progress: {task_section}")
if tasks.get("updatedAt"):
    lines.append(f"- Last Synced: {tasks.get('updatedAt')}")
lines.append("")
lines.append("## Constitution Gates")
lines.append("")
lines.extend(render_constitution_table(constitution))
lines.append("")
lines.append("## Files")
lines.append("")
for cap in sorted(capabilities):
    lines.append(f"- `devflow/specs/{cap}/spec.md`")
try:
    change_rel = change_dir.relative_to(repo_root)
    lines.append(f"- `{change_rel}/specs/`")
except ValueError:
    lines.append(f"- `{change_dir}/specs/`")

summary_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
PY

echo "✅ Summary generated at $summary_md"

exit 0
