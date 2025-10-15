#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

CHANGE_ID="${1:-}"

if [[ -z "$CHANGE_ID" ]]; then
    echo "Usage: parse-delta.sh <change-id>" >&2
    exit 1
fi

repo_root=$(get_repo_root)
change_dir="$repo_root/devflow/changes/$CHANGE_ID"
specs_dir="$change_dir/specs"
delta_json="$change_dir/delta.json"

if [[ ! -d "$change_dir" ]]; then
    echo "ERROR: change directory not found: $change_dir" >&2
    exit 1
fi

if [[ ! -d "$specs_dir" ]]; then
    echo "ERROR: specs directory not found in $change_dir" >&2
    exit 1
fi

python3 - "$CHANGE_ID" "$change_dir" "$delta_json" <<'PY'
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

change_id = sys.argv[1]
change_dir = Path(sys.argv[2])
delta_file = Path(sys.argv[3])
specs_dir = change_dir / "specs"

section_pattern = re.compile(r'^##\s+(ADDED|MODIFIED|REMOVED|RENAMED) Requirements\s*$', re.MULTILINE)
requirement_pattern = re.compile(r'^###\s+Requirement:\s*(.+)$', re.MULTILINE)
removed_pattern = re.compile(r'^-\s+(.+)$', re.MULTILINE)
renamed_from_pattern = re.compile(r'^-\s+FROM:\s*(.+)$', re.MULTILINE)
renamed_to_pattern = re.compile(r'^\s+TO:\s*(.+)$', re.MULTILINE)

added = []
modified = []
removed = []
renamed = []
capabilities = set()

for capability_dir in sorted(specs_dir.iterdir()):
    if not capability_dir.is_dir():
        continue
    spec_file = capability_dir / "spec.md"
    if not spec_file.exists():
        continue

    capability = capability_dir.name
    text = spec_file.read_text()

    matches = list(section_pattern.finditer(text))
    sections = {}
    for idx, match in enumerate(matches):
        start = match.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        sections[match.group(1)] = text[start:end]

    def collect_requirements(section_key, target):
        content = sections.get(section_key, "")
        for m in requirement_pattern.finditer(content):
            name = m.group(1).strip()
            if name:
                target.append({"capability": capability, "name": name})

    collect_requirements("ADDED", added)
    collect_requirements("MODIFIED", modified)

    removed_content = sections.get("REMOVED", "")
    for m in removed_pattern.finditer(removed_content):
        name = m.group(1).strip()
        if name:
            removed.append({"capability": capability, "name": name})

    renamed_content = sections.get("RENAMED", "")
    from_to_pairs = []
    current_from = None
    for line in renamed_content.splitlines():
        from_match = renamed_from_pattern.match(line)
        if from_match:
            current_from = from_match.group(1).strip()
            continue
        to_match = renamed_to_pattern.match(line)
        if to_match and current_from:
            to_name = to_match.group(1).strip()
            if to_name:
                from_to_pairs.append((current_from, to_name))
            current_from = None
    for old, new in from_to_pairs:
        renamed.append({"capability": capability, "from": old, "to": new})

    if sections:
        capabilities.add(capability)

if delta_file.exists():
    existing = json.loads(delta_file.read_text())
else:
    existing = {"changeId": change_id}

existing.setdefault("changeId", change_id)
existing["requirements"] = {
    "added": added,
    "modified": modified,
    "removed": removed,
    "renamed": renamed
}
existing["capabilities"] = sorted(capabilities)
existing["updatedAt"] = datetime.now(timezone.utc).isoformat()

if "relatedRequirements" not in existing:
    existing["relatedRequirements"] = []

if "tasks" not in existing or not isinstance(existing["tasks"], dict):
    existing["tasks"] = {}
existing.setdefault("links", [])

with delta_file.open('w', encoding='utf-8') as fh:
    json.dump(existing, fh, indent=2, ensure_ascii=False)
PY

req_id=""
if [[ -f "$delta_json" ]]; then
    req_id=$(jq -r '(.relatedRequirements[0] // empty)' "$delta_json" 2>/dev/null || true)
    # ===== JSON Schema 校验增强 =====
    schema_path="$repo_root/.claude/schemas/delta.schema.json"
    if [[ -f "$schema_path" ]]; then
        validate_json_schema "$delta_json" "$schema_path"
    fi
fi

if [[ -n "$req_id" ]]; then
    log_event "$req_id" "Delta parsed for change $CHANGE_ID"
fi

echo "✅ Delta parsed successfully: $delta_json"
