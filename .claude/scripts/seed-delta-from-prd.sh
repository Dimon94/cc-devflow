#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

usage() {
    cat <<'USAGE'
Usage: seed-delta-from-prd.sh <req-id> [--change-id CHANGE_ID]

Read the Delta Mapping table from PRD.md and pre-populate the dual-track
delta specs (devflow/changes/<change-id>/specs/*/spec.md).

Arguments:
  req-id                   Requirement identifier (e.g. REQ-123)

Options:
  --change-id <id>         Explicit change identifier. When omitted the script
                           reads orchestration_status.json to discover it.
  --help                   Display this help message.
USAGE
}

REQ_ID=""
CHANGE_ID=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --change-id)
            CHANGE_ID="$2"
            shift 2
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            if [[ -z "$REQ_ID" ]]; then
                REQ_ID="$1"
            else
                echo "ERROR: unexpected argument: $1" >&2
                usage
                exit 1
            fi
            shift
            ;;
    esac
done

if [[ -z "$REQ_ID" ]]; then
    echo "ERROR: req-id is required" >&2
    usage
    exit 1
fi

if ! validate_req_id "$REQ_ID" >/dev/null; then
    exit 1
fi

repo_root=$(get_repo_root)
req_dir=$(get_req_dir "$repo_root" "$REQ_ID")

if [[ ! -d "$req_dir" ]]; then
    echo "ERROR: requirement directory not found: $req_dir" >&2
    exit 1
fi

prd_file="$req_dir/PRD.md"
if [[ ! -f "$prd_file" ]]; then
    echo "ERROR: PRD.md not found at $prd_file" >&2
    exit 1
fi

status_file="$req_dir/orchestration_status.json"

if [[ -z "$CHANGE_ID" ]]; then
    if [[ ! -f "$status_file" ]]; then
        echo "ERROR: orchestration_status.json missing and --change-id not provided" >&2
        exit 1
    fi
    CHANGE_ID=$(jq -r '.change_id // empty' "$status_file" 2>/dev/null || true)
    if [[ -z "$CHANGE_ID" ]]; then
        echo "ERROR: change_id missing in orchestration_status.json. Provide via --change-id." >&2
        exit 1
    fi
fi

if ! validate_change_id "$CHANGE_ID" >/dev/null; then
    exit 1
fi

change_dir="$repo_root/devflow/changes/$CHANGE_ID"
if [[ ! -d "$change_dir" ]]; then
    echo "ERROR: change directory not found: $change_dir" >&2
    exit 1
fi

delta_json="$change_dir/delta.json"
if [[ ! -f "$delta_json" ]]; then
    echo "ERROR: delta.json not found in $change_dir" >&2
    exit 1
fi

mapping_json=$(python3 - "$prd_file" <<'PY'
import json
import re
import sys
from pathlib import Path

def slugify(value: str) -> str:
    value = value.lower()
    value = re.sub(r'[^a-z0-9]+', '-', value)
    value = re.sub(r'-{2,}', '-', value)
    return value.strip('-')

prd_path = Path(sys.argv[1])
text = prd_path.read_text(encoding="utf-8")

section_match = re.search(r'^##\s+Delta Mapping.*$', text, re.MULTILINE)
if not section_match:
    raise SystemExit("ERROR: PRD.md missing '## Delta Mapping' section.")

start_index = section_match.start()
rest = text[start_index:]
next_header = re.search(r'^\s*##\s+', rest.split('\n', 1)[1], re.MULTILINE) if '\n' in rest else None
if next_header:
    section_text = rest[:next_header.start(0)]
else:
    section_text = rest

rows = []
for line in section_text.splitlines():
    stripped = line.strip()
    if not stripped or not stripped.startswith("|"):
        continue
    cells = [cell.strip() for cell in stripped.strip("|").split("|")]
    if len(cells) < 3:
        continue
    if all(cell.replace('-', '').strip() == '' for cell in cells):
        # separator row like | --- |
        continue
    lower_cells = [cell.lower() for cell in cells]
    if "capability" in lower_cells and "operation" in lower_cells:
        # header row
        continue

    capability_label = cells[0]
    operation = cells[1].upper()
    requirement = cells[2]
    summary = cells[3] if len(cells) > 3 else ""

    if not capability_label or not operation or not requirement:
        continue

    if operation not in {"ADDED", "MODIFIED", "REMOVED", "RENAMED"}:
        raise SystemExit(f"ERROR: Unsupported operation '{operation}' in Delta Mapping table.")

    capability_slug = slugify(capability_label)
    if not capability_slug:
        raise SystemExit(f"ERROR: Capability '{capability_label}' cannot be slugified.")

    if operation == "RENAMED":
        if "->" not in requirement:
            raise SystemExit("ERROR: RENAMED rows must use 'Old Name -> New Name' format.")
        old_name, new_name = [part.strip() for part in requirement.split("->", 1)]
        if not old_name or not new_name:
            raise SystemExit("ERROR: RENAMED row missing old or new requirement name.")
        rows.append({
            "capability": capability_slug,
            "displayCapability": capability_label,
            "operation": operation,
            "old_name": old_name,
            "new_name": new_name,
            "summary": summary.strip()
        })
    else:
        rows.append({
            "capability": capability_slug,
            "displayCapability": capability_label,
            "operation": operation,
            "name": requirement.strip(),
            "summary": summary.strip()
        })

if not rows:
    raise SystemExit("ERROR: Delta Mapping table is empty. Populate it before seeding delta specs.")

print(json.dumps(rows))
PY
)

mapping_status=$?
if [[ $mapping_status -ne 0 ]]; then
    printf '%s\n' "$mapping_json" >&2
    exit $mapping_status
fi

if [[ -z "$mapping_json" ]]; then
    echo "ERROR: Failed to parse Delta Mapping table." >&2
    exit 1
fi

capabilities=()
while IFS= read -r cap; do
    [[ -z "$cap" ]] && continue
    capabilities+=("$cap")
done < <(printf '%s\n' "$mapping_json" | jq -r '.[].capability' | sort -u)

if [[ "${#capabilities[@]}" -eq 0 ]]; then
    echo "ERROR: No capabilities were detected in Delta Mapping table." >&2
    exit 1
fi

ensure_args=()
for cap in "${capabilities[@]}"; do
    ensure_args+=(--cap "$cap")
done

"$SCRIPT_DIR/ensure-change-delta.sh" "$CHANGE_ID" "${ensure_args[@]}" >/dev/null

MAPPING_PAYLOAD="$mapping_json" python3 - "$change_dir" <<'PY'
import json
import os
import sys
from pathlib import Path

payload = os.environ.get("MAPPING_PAYLOAD", "")
if not payload:
    raise SystemExit("ERROR: Missing mapping payload for spec generation.")

mapping = json.loads(payload)
change_dir = Path(sys.argv[1])

DEFAULT_TEMPLATE = """# Capability Delta: {cap}

## ADDED Requirements

## MODIFIED Requirements

## REMOVED Requirements

## RENAMED Requirements
"""

class SpecEditor:
    def __init__(self, capability: str, path: Path):
        self.capability = capability
        self.path = path
        if path.exists():
            raw_text = path.read_text(encoding="utf-8")
            if "<short title>" in raw_text or "<!--" in raw_text:
                cleaned = []
                skip_comment = False
                for line in raw_text.splitlines():
                    if "<!--" in line:
                        skip_comment = True
                        continue
                    if "-->" in line and skip_comment:
                        skip_comment = False
                        continue
                    if skip_comment:
                        continue
                    if "<short title>" in line:
                        continue
                    cleaned.append(line)
                self.lines = cleaned
            else:
                self.lines = raw_text.splitlines()
        else:
            self.lines = [line for line in DEFAULT_TEMPLATE.format(cap=capability).splitlines()]

        normalized = []
        for line in self.lines:
            stripped = line.strip()
            lower = stripped.lower()
            if lower == "## added requirements":
                normalized.append("## ADDED Requirements")
            elif lower == "## modified requirements":
                normalized.append("## MODIFIED Requirements")
            elif lower == "## removed requirements":
                normalized.append("## REMOVED Requirements")
            elif lower == "## renamed requirements":
                normalized.append("## RENAMED Requirements")
            else:
                normalized.append(line)
        self.lines = normalized

    def _ensure_section(self, header: str) -> int:
        for idx, line in enumerate(self.lines):
            if line.strip() == header:
                return idx

        if self.lines and self.lines[-1].strip():
            self.lines.append("")
        self.lines.append(header)
        self.lines.append("")
        return len(self.lines) - 2

    def _section_range(self, header: str):
        start = self._ensure_section(header)
        end = len(self.lines)
        for idx in range(start + 1, len(self.lines)):
            if self.lines[idx].startswith("## ") and idx > start:
                end = idx
                break
        return start, end

    def _ensure_blank_before(self, index: int):
        if index == 0:
            return
        if self.lines[index - 1].strip():
            self.lines.insert(index, "")

    def has_requirement(self, name: str) -> bool:
        header = f"### Requirement: {name}"
        return any(line.strip() == header for line in self.lines)

    def insert_requirement(self, section: str, name: str, summary: str):
        if self.has_requirement(name):
            return
        header = f"## {section} Requirements"
        start, end = self._section_range(header)
        insert_at = end
        while insert_at > start + 1 and not self.lines[insert_at - 1].strip():
            insert_at -= 1
        block = []
        if insert_at > start + 1 and self.lines[insert_at - 1].strip():
            block.append("")
        block.append(f"### Requirement: {name}")
        if summary:
            block.append(f"- **PRD Summary**: {summary}")
        block.append("- TODO: 补充规范细节。")
        block.append("")
        self.lines[insert_at:insert_at] = block

    def insert_removed(self, name: str):
        header = "## REMOVED Requirements"
        start, end = self._section_range(header)
        bullet = f"- {name}"
        if any(line.strip() == bullet for line in self.lines[start+1:end]):
            return
        insert_at = end
        while insert_at > start + 1 and not self.lines[insert_at - 1].strip():
            insert_at -= 1
        if insert_at > start + 1 and self.lines[insert_at - 1].strip():
            self.lines.insert(insert_at, "")
            insert_at += 1
        self.lines.insert(insert_at, bullet)
        self.lines.insert(insert_at + 1, "")

    def insert_renamed(self, old: str, new: str, summary: str):
        header = "## RENAMED Requirements"
        start, end = self._section_range(header)
        from_line = f"- FROM: {old}"
        to_line = f"  TO: {new}"
        section_lines = "\n".join(self.lines[start+1:end])
        if from_line in section_lines and to_line in section_lines:
            return
        insert_at = end
        while insert_at > start + 1 and not self.lines[insert_at - 1].strip():
            insert_at -= 1
        block = []
        if insert_at > start + 1 and self.lines[insert_at - 1].strip():
            block.append("")
        block.append(from_line)
        block.append(to_line)
        if summary:
            block.append(f"  NOTE: {summary}")
        block.append("")
        self.lines[insert_at:insert_at] = block

    def save(self):
        text = "\n".join(self.lines).rstrip() + "\n"
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(text, encoding="utf-8")

editors = {}

for entry in mapping:
    capability = entry["capability"]
    editor = editors.get(capability)
    spec_path = change_dir / "specs" / capability / "spec.md"
    if editor is None:
        editor = SpecEditor(capability, spec_path)
        editors[capability] = editor

    operation = entry["operation"]
    summary = entry.get("summary", "").strip()

    if operation in {"ADDED", "MODIFIED"}:
        editor.insert_requirement(operation, entry["name"], summary)
    elif operation == "REMOVED":
        editor.insert_removed(entry["name"])
    elif operation == "RENAMED":
        editor.insert_renamed(entry["old_name"], entry["new_name"], summary)
    else:
        raise SystemExit(f"ERROR: Unsupported operation {operation}")

for editor in editors.values():
    editor.save()
PY

"$SCRIPT_DIR/parse-delta.sh" "$CHANGE_ID" >/dev/null

conflict_count=$("$SCRIPT_DIR/check-dualtrack-conflicts.sh" "$CHANGE_ID" --count-only 2>/dev/null || echo "")
if [[ -n "$conflict_count" && "$conflict_count" != "0" ]]; then
    echo "⚠️  Detected $conflict_count potential conflict(s). Run check-dualtrack-conflicts.sh \"$CHANGE_ID\" for details."
fi

if [[ -f "$status_file" ]]; then
    log_event "$REQ_ID" "Seeded delta mapping from PRD (change: $CHANGE_ID)"
fi

echo "✅ Delta specs seeded from PRD for change $CHANGE_ID"
