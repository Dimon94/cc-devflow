#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

CHANGE_ID="${1:-}"

if [[ -z "$CHANGE_ID" ]]; then
    echo "Usage: archive-change.sh <change-id>" >&2
    exit 1
fi

if ! validate_change_id "$CHANGE_ID" >/dev/null; then
    exit 1
fi

repo_root=$(get_repo_root)
active_change_dir=$(get_change_dir "$repo_root" "$CHANGE_ID")
delta_json="$active_change_dir/delta.json"

if [[ ! -d "$active_change_dir" ]]; then
    echo "ERROR: change directory not found: $active_change_dir" >&2
    exit 1
fi

if [[ ! -f "$delta_json" ]]; then
    echo "ERROR: delta.json not found in $active_change_dir" >&2
    exit 1
fi

capabilities=()
while IFS= read -r cap; do
    [[ -z "$cap" ]] && continue
    capabilities+=("$cap")
done < <(jq -r '.capabilities[]?' "$delta_json" 2>/dev/null)

if [[ "${#capabilities[@]}" -eq 0 ]]; then
    # Fallback: derive from specs directory structure
    while IFS= read -r entry; do
        capabilities+=("$(basename "$entry")")
    done < <(find "$active_change_dir/specs" -mindepth 1 -maxdepth 1 -type d 2>/dev/null || true)
fi

if [[ "${#capabilities[@]}" -eq 0 ]]; then
    echo "ERROR: No capabilities listed in delta.json or specs directory" >&2
    exit 1
fi

specs_root="$repo_root/devflow/specs"
mkdir -p "$specs_root"

overall_summary=()

for capability in "${capabilities[@]}"; do
    source_spec="$active_change_dir/specs/$capability/spec.md"
    target_dir="$specs_root/$capability"
    target_spec="$target_dir/spec.md"
    history_dir="$target_dir/history"

    if [[ ! -f "$source_spec" ]]; then
        echo "⚠️  Skipping capability '$capability' (spec.md missing in change directory)"
        continue
    fi

    mkdir -p "$history_dir"

    if [[ -f "$target_spec" ]]; then
        timestamp=$(TZ='Asia/Shanghai' date '+%Y%m%dT%H%M%S')
        backup_file="$history_dir/${timestamp}-${CHANGE_ID}.md"
        cp "$target_spec" "$backup_file"
        echo "  Saved snapshot: $backup_file"
    fi

    python_output=$(
    python3 - "$delta_json" "$capability" "$source_spec" "$target_spec" <<'PY'
import json
import sys
from pathlib import Path

delta_path = Path(sys.argv[1])
capability = sys.argv[2]
source_spec = Path(sys.argv[3])
target_spec = Path(sys.argv[4])

def parse_blocks(text):
    lines = text.splitlines()
    header = []
    blocks = []
    current = None

    for line in lines:
        if line.startswith("### Requirement:"):
            if current:
                blocks.append(current)
            name = line.split(":", 1)[1].strip()
            current = {"name": name, "lines": [line]}
        else:
            if current:
                current["lines"].append(line)
            else:
                header.append(line)

    if current:
        blocks.append(current)

    return header, blocks

def block_lookup(blocks):
    lookup = {}
    for block in blocks:
        lookup[block["name"]] = [line for line in block["lines"]]
    return lookup

def load_existing(path, capability_name):
    if path.exists():
        header, blocks = parse_blocks(path.read_text(encoding="utf-8"))
        return header, blocks
    return [f"# Capability: {capability_name}", ""], []

def ensure_header_spacing(header_lines):
    if header_lines and header_lines[-1].strip():
        header_lines.append("")
    if not header_lines:
        header_lines.extend([f"# Capability: {capability}", ""])
    return header_lines

def write_spec(path, header_lines, blocks):
    lines = []
    lines.extend(ensure_header_spacing(header_lines))

    for index, block in enumerate(blocks):
        block_lines = block["lines"]
        if not block_lines or not block_lines[0].startswith("### Requirement:"):
            block_lines.insert(0, f"### Requirement: {block['name']}")
        lines.extend(block_lines)
        if index != len(blocks) - 1:
            if block_lines and block_lines[-1].strip():
                lines.append("")
            lines.append("")
        else:
            if lines and lines[-1] != "":
                lines.append("")

    text = "\n".join(lines).rstrip() + "\n"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")

try:
    delta = json.loads(delta_path.read_text(encoding="utf-8"))
except Exception as exc:
    print(f"ERROR: Failed to parse delta.json: {exc}", file=sys.stderr)
    sys.exit(1)

requirements = delta.get("requirements") or {}

added = [entry["name"] for entry in requirements.get("added") or [] if entry.get("capability") == capability]
modified = [entry["name"] for entry in requirements.get("modified") or [] if entry.get("capability") == capability]
removed = [entry["name"] for entry in requirements.get("removed") or [] if entry.get("capability") == capability]
renamed_pairs = [
    (entry.get("from"), entry.get("to"))
    for entry in requirements.get("renamed") or []
    if entry.get("capability") == capability
]

delta_header, delta_blocks = parse_blocks(source_spec.read_text(encoding="utf-8"))
delta_lookup = block_lookup(delta_blocks)

header, existing_blocks = load_existing(target_spec, capability)

def find_index(blocks_list, name):
    for idx, block in enumerate(blocks_list):
        if block["name"] == name:
            return idx
    return None

# Phase 1: Rename
for old, new in renamed_pairs:
    if not old or not new:
        continue
    idx = find_index(existing_blocks, old)
    if idx is None:
        continue
    block = existing_blocks[idx]
    block["name"] = new
    if block["lines"]:
        block["lines"][0] = f"### Requirement: {new}"
    existing_blocks[idx] = block

# Phase 2: Remove
for name in removed:
    idx = find_index(existing_blocks, name)
    if idx is not None:
        existing_blocks.pop(idx)

# Phase 3: Modified
for name in modified:
    idx = find_index(existing_blocks, name)
    if idx is None:
        print(f"ERROR: Cannot modify missing requirement '{name}' in capability '{capability}'", file=sys.stderr)
        sys.exit(1)
    block_lines = delta_lookup.get(name)
    if not block_lines:
        print(f"ERROR: Delta spec missing block for modified requirement '{name}'", file=sys.stderr)
        sys.exit(1)
    existing_blocks[idx] = {"name": name, "lines": [line for line in block_lines]}

# Phase 4: Added
for name in added:
    if find_index(existing_blocks, name) is not None:
        print(f"ERROR: Requirement '{name}' already exists in capability '{capability}'", file=sys.stderr)
        sys.exit(1)
    block_lines = delta_lookup.get(name)
    if not block_lines:
        print(f"ERROR: Delta spec missing block for added requirement '{name}'", file=sys.stderr)
        sys.exit(1)
    existing_blocks.append({"name": name, "lines": [line for line in block_lines]})

write_spec(target_spec, header, existing_blocks)

result = {
    "capability": capability,
    "added": added,
    "modified": modified,
    "removed": removed,
    "renamed": [
        {"from": old, "to": new}
        for old, new in renamed_pairs
        if old and new
    ]
}

print(json.dumps(result, ensure_ascii=False))
PY
    )

    if [[ $? -ne 0 ]]; then
        echo "ERROR: Failed to archive capability '$capability'" >&2
        exit 1
    fi

    overall_summary+=("$python_output")

    echo "✅ Archived capability: $capability"
done

archive_root="$repo_root/devflow/changes/archive"
mkdir -p "$archive_root"
destination_dir="$archive_root/$CHANGE_ID"

if [[ -d "$destination_dir" ]]; then
    rm -rf "$destination_dir"
fi

mv "$active_change_dir" "$destination_dir"
echo "📦 Change directory moved to: $destination_dir"

req_id=""
if [[ -f "$destination_dir/delta.json" ]]; then
    req_id=$(jq -r '(.relatedRequirements[0] // empty)' "$destination_dir/delta.json" 2>/dev/null || true)
fi

# Emit summary as JSON array for downstream tooling
if [[ "${#overall_summary[@]}" -gt 0 ]]; then
    printf '%s\n' "${overall_summary[@]}" | jq -s '.'
else
    echo "[]" | jq '.'
fi

if [[ -n "$req_id" ]]; then
    log_event "$req_id" "Change $CHANGE_ID archived to devflow/specs/ (moved to archive/)"
fi

echo "✅ Archive completed for $CHANGE_ID"

exit 0
