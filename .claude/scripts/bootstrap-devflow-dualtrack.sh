#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

REQ_ID=""
TITLE=""
CHANGE_ID=""
JSON_MODE=false
FORCE_MODE=false
OUTPUT_JSON=""

usage() {
    cat <<'USAGE'
Usage: bootstrap-devflow-dualtrack.sh --req-id REQ-123 [OPTIONS]

Ensure dual-track scaffolding exists for the specified requirement.

Options:
  --req-id ID          Requirement ID (REQ-xxx or BUG-xxx)
  --title TITLE        Requirement title (used for change-id slug)
  --change-id ID       Explicit change identifier (defaults to req-id + slug)
  --json               Emit JSON payload to stdout
  --output-json PATH   Write JSON payload to PATH
  --force              Recreate managed files even if they exist
  --help               Show this message
USAGE
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --req-id)
            REQ_ID="$2"
            shift 2
            ;;
        --title)
            TITLE="$2"
            shift 2
            ;;
        --change-id)
            CHANGE_ID="$2"
            shift 2
            ;;
        --json)
            JSON_MODE=true
            shift
            ;;
        --output-json)
            OUTPUT_JSON="$2"
            shift 2
            ;;
        --force)
            FORCE_MODE=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage
            exit 1
            ;;
    esac
done

if [[ -z "$REQ_ID" ]]; then
    echo "ERROR: --req-id is required" >&2
    usage
    exit 1
fi

if ! validate_req_id "$REQ_ID" >/dev/null; then
    exit 1
fi

repo_root=$(get_repo_root)
ensure_devflow_dir "$repo_root"

devflow_dir="$repo_root/devflow"
agents_file="$devflow_dir/AGENTS.md"
project_file="$devflow_dir/project.md"
changes_dir="$devflow_dir/changes"
specs_dir="$devflow_dir/specs"

read -r -d '' AGENTS_TEMPLATE <<'TEMPLATE' || true
# DevFlow Dual Track Instructions

These instructions govern AI assistants operating within the DevFlow dual-track specification workflow.

Always load the latest system context before planning or coding:
- `@/devflow/specs/` — canonical capabilities and scenarios (system source of truth)
- `@/devflow/changes/<change-id>/` — pending deltas for active work (proposal, tasks, specs, metadata)

When a request involves planning, specs, architecture, or ambiguity:
1. Open `devflow/specs/<capability>/spec.md` for the baseline behavior.
2. Load all pending `devflow/changes/*/delta.json` touching the same capability.
3. Confirm Constitution gates (Articles VII–X) that apply to the change.
4. Update the active change delta instead of editing specs directly.

Required workflow:
1. Draft or update `proposal.md` in `devflow/changes/<change-id>/`.
2. Produce tasks referencing every Requirement/Scenario in the delta.
3. Run `run-dualtrack-validation.sh` before implementation.
4. Record Constitution outcomes in `constitution.json` alongside tasks.
5. Archive via `archive-change.sh` to merge back into `devflow/specs/` once complete.

Keep this managed block so tooling can refresh the instructions automatically.
TEMPLATE

read -r -d '' PROJECT_TEMPLATE <<'TEMPLATE' || true
# Project Context

## Purpose
[Describe your project's goals, domains, and success metrics]

## Tech Stack
- [List primary technologies]
- [e.g., TypeScript, React, Node.js]

## Working Agreements
- Source of truth lives in `devflow/specs/`
- Active work must pass through `devflow/changes/<change-id>/`
- Constitution gates (Articles VII–X) are enforced on every change

## Testing Strategy
[Document unit, integration, contract, and regression testing expectations]

## Git & Release Workflow
- Branching model
- CI/CD requirements
- Deployment cadence

## Domain Notes
[Capture domain language, key entities, and business rules for assistants]

## External Integrations
[List external APIs, services, or dependencies with context]
TEMPLATE

write_managed_block() {
    local target_file="$1"
    local content="$2"
    local start_marker="<!-- OPENSPEC:START -->"
    local end_marker="<!-- OPENSPEC:END -->"

    MANAGED_CONTENT="$content" python3 - "$target_file" "$start_marker" "$end_marker" <<'PY'
import os
import sys
from pathlib import Path

path = Path(sys.argv[1])
start = sys.argv[2]
end = sys.argv[3]
content = os.environ.get("MANAGED_CONTENT", "").rstrip("\n") + "\n"

if path.exists():
    text = path.read_text()
else:
    text = ""

if start in text and end in text:
    start_idx = text.index(start)
    end_idx = text.index(end, start_idx) + len(end)
    new_text = text[:start_idx] + start + "\n" + content + end + text[end_idx:]
else:
    if text and not text.endswith("\n"):
        text += "\n"
    new_text = text + f"{start}\n{content}{end}\n"

path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(new_text)
PY
}

write_managed_block "$agents_file" "$AGENTS_TEMPLATE"

if [[ ! -f "$project_file" || "$FORCE_MODE" == true ]]; then
    printf '%s\n' "$PROJECT_TEMPLATE" > "$project_file"
fi

if [[ -z "$CHANGE_ID" ]]; then
    CHANGE_ID=$(generate_change_id "$REQ_ID" "$TITLE")
fi

CHANGE_ID=${CHANGE_ID//[[:space:]]/}
CHANGE_ID=$(printf '%s\n' "$CHANGE_ID" | tr '[:upper:]' '[:lower:]')
if [[ -z "$CHANGE_ID" ]]; then
    CHANGE_ID=$(generate_change_id "$REQ_ID" "change")
fi

final_change_id="$CHANGE_ID"
if [[ "$FORCE_MODE" == false ]]; then
    final_change_id=$(ensure_unique_change_id "$changes_dir" "$CHANGE_ID")
fi

change_dir="$changes_dir/$final_change_id"
mkdir -p "$change_dir/specs"

proposal_file="$change_dir/proposal.md"
tasks_file="$change_dir/tasks.md"
design_file="$change_dir/design.md"
delta_readme="$change_dir/specs/README.md"
delta_json="$change_dir/delta.json"
constitution_json="$change_dir/constitution.json"
task_progress_json="$change_dir/task-progress.json"

timestamp=$(get_beijing_time_iso)
if [[ ! -f "$proposal_file" || "$FORCE_MODE" == true ]]; then
    cat > "$proposal_file" <<EOF
# Proposal: ${TITLE:-$REQ_ID}

## Why
[Describe the problem or opportunity. Reference related requirements such as $REQ_ID and impacted capabilities.]

## What Changes
- Capabilities: [List \`devflow/specs/<capability>\` files affected]
- Related Requirements: [$REQ_ID]
- Constitution Gates: [Article VII | Article VIII | Article IX | Article X]

## Impact
- Upstream systems:
- Downstream consumers:
- Risks / Mitigations:

## Delta Checklist
- [ ] Update \`devflow/changes/$final_change_id/specs/\` with ADDED/MODIFIED/REMOVED/RENAMED sections
- [ ] Map each Requirement to tasks in \`tasks.md\`
- [ ] Run \`run-dualtrack-validation.sh $final_change_id\`
- [ ] Capture Constitution outcomes in \`constitution.json\`
EOF
    fi

    if [[ ! -f "$tasks_file" || "$FORCE_MODE" == true ]]; then
        cat > "$tasks_file" <<EOF
# Tasks: $final_change_id

## Phase 0 · Context Sync
- [ ] **T000** [CTX] Load latest devflow/specs capabilities and pending deltas touching this change.
- [ ] **T001** [CTX] Confirm Constitution gates applicable to this work (Articles VII-X).

## Phase 1 · Planning (Requirement Alignment)
- [ ] **T010** [P] [US?] Update delta specs for impacted capabilities (include Requirement + Scenario names).
- [ ] **T011** [P] [US?] Validate delta against existing specs (no duplicates, SHALL/MUST present).

## Phase 2 · Implementation (per user story)
- [ ] **T020** [US1] [describe implementation task referencing files/tests]
- [ ] **T030** [US1] Add/Update tests ensuring scenarios are covered.

## Phase 3 · Validation & Constitution
- [ ] **T900** [VAL] Run \`run-dualtrack-validation.sh $final_change_id\`
- [ ] **T910** [VAL] Record Constitution outcomes in \`constitution.json\`

## Phase 4 · Archive
- [ ] **T950** [REL] Prepare archive summary (\`summary.md\`)
- [ ] **T960** [REL] Execute \`archive-change.sh $final_change_id\`
- [ ] **T970** [REL] Update downstream documentation / release notes

> Replace placeholders with concrete tasks and ensure every item links back to a Requirement in the delta.
EOF
fi

if [[ ! -f "$design_file" || "$FORCE_MODE" == true ]]; then
    cat > "$design_file" <<EOF
# Design Notes: $final_change_id

- Architecture decisions:
- Data contracts / schema changes:
- Integration considerations:
- Open questions:
EOF
fi

if [[ ! -f "$delta_readme" || "$FORCE_MODE" == true ]]; then
    cat > "$delta_readme" <<'EOF'
# Delta Authoring Guide

Create capability-specific folders under this directory. Each capability must contain a `spec.md` file using the OpenSpec delta format:

```
## ADDED Requirements
### Requirement: <name>
The system SHALL ...

#### Scenario: <name>
- **WHEN** ...
- **THEN** ...

## MODIFIED Requirements
...

## REMOVED Requirements
...

## RENAMED Requirements
- FROM: Old name
- TO: New name
```

Always reference the latest `devflow/specs/<capability>/spec.md` before editing.
EOF
fi

if [[ ! -f "$delta_json" || "$FORCE_MODE" == true ]]; then
    cat > "$delta_json" <<EOF
{
  "changeId": "$final_change_id",
  "generatedAt": "$timestamp",
  "requirements": [],
  "tasks": {},
  "links": [],
  "relatedRequirements": ["$REQ_ID"],
  "capabilities": []
}
EOF
fi

if [[ ! -f "$constitution_json" || "$FORCE_MODE" == true ]]; then
    cat > "$constitution_json" <<EOF
{
  "changeId": "$final_change_id",
  "updatedAt": "$timestamp",
  "articles": [
    {"article": "VII", "status": "pending", "notes": ""},
    {"article": "VIII", "status": "pending", "notes": ""},
    {"article": "IX", "status": "pending", "notes": ""},
    {"article": "X", "status": "pending", "notes": ""}
  ]
}
EOF
fi

if [[ ! -f "$task_progress_json" || "$FORCE_MODE" == true ]]; then
    cat > "$task_progress_json" <<EOF
{
  "changeId": "$final_change_id",
  "generatedAt": "$timestamp",
  "total": 0,
  "completed": 0
}
EOF
fi

log_event "$REQ_ID" "Dual-track scaffolding initialized (change: $final_change_id)"

json_payload=$(FINAL_CHANGE_ID="$final_change_id" \
    CHANGE_DIR="$change_dir" \
    PROPOSAL_FILE="$proposal_file" \
    TASKS_FILE="$tasks_file" \
    DELTA_README="$delta_readme" \
    TIMESTAMP="$timestamp" \
    python3 - <<'PY'
import json
import os

payload = {
    "changeId": os.environ["FINAL_CHANGE_ID"],
    "changeDir": os.environ["CHANGE_DIR"],
    "proposal": os.environ["PROPOSAL_FILE"],
    "tasks": os.environ["TASKS_FILE"],
    "delta": os.environ["DELTA_README"],
    "timestamp": os.environ["TIMESTAMP"]
}

payload["change_id"] = payload["changeId"]
payload["change_dir"] = payload["changeDir"]

print(json.dumps(payload, ensure_ascii=False))
PY
)

if [[ -n "$OUTPUT_JSON" ]]; then
    printf '%s\n' "$json_payload" > "$OUTPUT_JSON"
fi

if $JSON_MODE; then
    printf '%s\n' "$json_payload"
else
    echo "DevFlow dual-track scaffolding ready (change: $final_change_id)"
fi

exit 0
