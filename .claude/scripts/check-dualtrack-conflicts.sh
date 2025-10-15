#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

TARGET_CHANGE=""
STRICT=false
ALL_MODE=false
COUNT_ONLY=false
SUMMARY=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --strict)
            STRICT=true
            shift
            ;;
        --all)
            ALL_MODE=true
            shift
            ;;
        --count-only)
            COUNT_ONLY=true
            shift
            ;;
        --summary)
            SUMMARY=true
            shift
            ;;
        --help|-h)
            cat <<'USAGE'
Usage: check-dualtrack-conflicts.sh [change-id] [--strict] [--all] [--count-only] [--summary]

Detect requirement conflicts across devflow/changes based on delta.json content.

  change-id      Only compare other changes against this change (default: scan all pairs)
  --strict       Treat conflicts as fatal (exit 1); default emits warnings only
  --all          Include archived changes (if any) in scan
  --count-only   Print number of conflicts and exit without details
  --summary      Print aggregated statistics by capability and change
  --help         Show this message
USAGE
            exit 0
            ;;
        *)
            if [[ -z "$TARGET_CHANGE" ]]; then
                TARGET_CHANGE="$1"
            else
                echo "ERROR: unexpected argument: $1" >&2
                exit 1
            fi
            shift
            ;;
    esac
done

repo_root=$(get_repo_root)
changes_dir="$repo_root/devflow/changes"

if [[ ! -d "$changes_dir" ]]; then
    echo "No changes directory found: $changes_dir" >&2
    exit 0
fi

all_flag="false"
if $ALL_MODE; then
    all_flag="true"
fi

if ! python_output=$(
    python3 - "$changes_dir" "${TARGET_CHANGE:-}" "$all_flag" <<'PY'
import json
import sys
from collections import defaultdict
from pathlib import Path

changes_dir = Path(sys.argv[1])
target = sys.argv[2] if len(sys.argv) > 2 else ""
all_mode = (len(sys.argv) > 3 and sys.argv[3].lower() == "true")

def dedupe(seq):
    seen = set()
    ordered = []
    for item in seq:
        if item not in seen:
            seen.add(item)
            ordered.append(item)
    return ordered

delta_paths = []
if changes_dir.is_dir():
    delta_paths.extend(sorted(changes_dir.glob("*/delta.json")))
    if all_mode:
        archive_dir = changes_dir / "archive"
        if archive_dir.is_dir():
            delta_paths.extend(sorted(archive_dir.glob("*/delta.json")))

added = defaultdict(list)
modified = defaultdict(list)
removed = defaultdict(list)
renamed_from = defaultdict(list)
renamed_to = defaultdict(list)

for delta_path in delta_paths:
    try:
        data = json.loads(delta_path.read_text(encoding="utf-8"))
    except Exception:
        continue

    requirements = data.get("requirements") or {}
    change_id = delta_path.parent.name

    for entry in requirements.get("added") or []:
        capability = entry.get("capability")
        name = entry.get("name")
        if capability and name:
            added[(capability, name)].append(change_id)

    for entry in requirements.get("modified") or []:
        capability = entry.get("capability")
        name = entry.get("name")
        if capability and name:
            modified[(capability, name)].append(change_id)

    for entry in requirements.get("removed") or []:
        capability = entry.get("capability")
        name = entry.get("name")
        if capability and name:
            removed[(capability, name)].append(change_id)

    for entry in requirements.get("renamed") or []:
        capability = entry.get("capability")
        old = entry.get("from")
        new = entry.get("to")
        if capability and old:
            renamed_from[(capability, old)].append(change_id)
        if capability and new:
            renamed_to[(capability, new)].append(change_id)

def involves_target(*lists):
    if not target or target == "ALL":
        return True
    for seq in lists:
        if target in seq:
            return True
    return False

def format_list(seq):
    return " ".join(dedupe(seq))

conflicts = []

for (cap, name), added_list in added.items():
    added_list = dedupe(added_list)
    if not involves_target(added_list):
        continue

    if len(added_list) > 1:
        conflicts.append({
            "kind": "ADDED_DUPLICATE",
            "capability": cap,
            "requirement": name,
            "details": format_list(added_list),
            "changes": added_list
        })

    removed_list = dedupe(removed.get((cap, name), []))
    if removed_list and involves_target(added_list, removed_list):
        combined = dedupe(added_list + removed_list)
        conflicts.append({
            "kind": "ADDED_VS_REMOVED",
            "capability": cap,
            "requirement": name,
            "details": f"ADD:{format_list(added_list)} | REMOVE:{format_list(removed_list)}",
            "changes": combined
        })

    renamed_from_list = dedupe(renamed_from.get((cap, name), []))
    if renamed_from_list and involves_target(added_list, renamed_from_list):
        combined = dedupe(added_list + renamed_from_list)
        conflicts.append({
            "kind": "ADDED_VS_RENAMED_FROM",
            "capability": cap,
            "requirement": name,
            "details": f"ADD:{format_list(added_list)} | RENAME_FROM:{format_list(renamed_from_list)}",
            "changes": combined
        })

    renamed_to_list = dedupe(renamed_to.get((cap, name), []))
    if renamed_to_list and involves_target(added_list, renamed_to_list):
        combined = dedupe(added_list + renamed_to_list)
        conflicts.append({
            "kind": "ADDED_VS_RENAMED_TO",
            "capability": cap,
            "requirement": name,
            "details": f"ADD:{format_list(added_list)} | RENAME_TO:{format_list(renamed_to_list)}",
            "changes": combined
        })

for (cap, name), modified_list in modified.items():
    modified_list = dedupe(modified_list)
    if not involves_target(modified_list):
        continue

    removed_list = dedupe(removed.get((cap, name), []))
    if removed_list and involves_target(modified_list, removed_list):
        combined = dedupe(modified_list + removed_list)
        conflicts.append({
            "kind": "MODIFIED_VS_REMOVED",
            "capability": cap,
            "requirement": name,
            "details": f"MOD:{format_list(modified_list)} | REMOVE:{format_list(removed_list)}",
            "changes": combined
        })

    renamed_to_list = dedupe(renamed_to.get((cap, name), []))
    if renamed_to_list and involves_target(modified_list, renamed_to_list):
        combined = dedupe(modified_list + renamed_to_list)
        conflicts.append({
            "kind": "MODIFIED_VS_RENAMED_TO",
            "capability": cap,
            "requirement": name,
            "details": f"MOD:{format_list(modified_list)} | RENAME_TO:{format_list(renamed_to_list)}",
            "changes": combined
        })

conflicts.sort(key=lambda item: (item["capability"], item["requirement"], item["kind"]))

print(len(conflicts))
print(json.dumps(conflicts, ensure_ascii=False))
PY
); then
    echo "ERROR: Failed to analyze delta conflicts" >&2
    exit 1
fi

conflict_count=$(printf '%s' "$python_output" | head -n1)
json_output="${python_output#*$'\n'}"

if [[ -z "$json_output" ]]; then
    json_output="[]"
fi

if $COUNT_ONLY; then
    echo "$conflict_count"
    exit 0
fi

if [[ "$conflict_count" -eq 0 ]]; then
    if $SUMMARY; then
        echo "No conflicts detected"
    elif [[ -n "$TARGET_CHANGE" && "$TARGET_CHANGE" != "ALL" ]]; then
        echo "No conflicts found for $TARGET_CHANGE"
    fi
    exit 0
fi

if $SUMMARY; then
    echo "Total conflicts: $conflict_count"
    echo "By capability:"
    capability_summary=$(printf '%s\n' "$json_output" | jq -r '
        group_by(.capability)
        | sort_by(.[0].capability)
        | map("\(.[0].capability): \(length)")
        | .[]
    ' 2>/dev/null || true)
    if [[ -z "$capability_summary" ]]; then
        echo "  (none)"
    else
        printf '%s\n' "$capability_summary" | sed 's/^/  /'
    fi

    echo "By change:"
    change_summary=$(printf '%s\n' "$json_output" | jq -r '
        map(.changes[]?) 
        | group_by(.) 
        | sort_by(.[0]) 
        | map("\(.[0]): \(length)") 
        | .[]
    ' 2>/dev/null || true)
    if [[ -z "$change_summary" ]]; then
        echo "  (none)"
    else
        printf '%s\n' "$change_summary" | sed 's/^/  /'
    fi
    echo ""
fi

printf '%s\n' "$json_output" | jq '.'

if $STRICT; then
    exit 1
fi

exit 0
    if [[ -n "$TARGET_CHANGE" && "$TARGET_CHANGE" != "ALL" ]]; then
        echo "No conflicts found for $TARGET_CHANGE"
    fi
    exit 0
fi

printf '%s\n' "$json_output" | jq '.'

if $STRICT; then
    exit 1
fi

exit 0
