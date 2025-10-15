#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

CHANGE_ID=""
STRICT=false

usage() {
    cat <<'USAGE'
Usage: validate-constitution-tracking.sh <change-id> [--strict]

Verify constitution.json for the specified change directory.

Options:
  --strict   Fail if any article remains pending or in_progress
  --help     Show this message
USAGE
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --strict)
            STRICT=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            if [[ -z "$CHANGE_ID" ]]; then
                CHANGE_ID="$1"
            else
                echo "ERROR: unexpected argument: $1" >&2
                usage
                exit 1
            fi
            shift
            ;;
    esac
done

if [[ -z "$CHANGE_ID" ]]; then
    echo "ERROR: change-id is required" >&2
    usage
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
constitution_json="$change_dir/constitution.json"
delta_json="$change_dir/delta.json"

if [[ ! -f "$constitution_json" ]]; then
    echo "ERROR: constitution.json not found in $change_dir" >&2
    exit 1
fi

schema_path="$repo_root/.claude/schemas/constitution.schema.json"
if [[ -f "$schema_path" ]]; then
    # ===== JSON Schema 校验增强 =====
    validate_json_schema "$constitution_json" "$schema_path"
fi

python_report=$(
python3 - "$constitution_json" "$STRICT" <<'PY'
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
strict = sys.argv[2].lower() == "true"

allowed_statuses = {"pending", "in_progress", "approved", "waived", "rejected"}
passing_statuses = {"approved", "waived"}

try:
    data = json.loads(path.read_text(encoding="utf-8"))
except Exception as exc:
    print(f"ERROR: Failed to parse constitution.json: {exc}", file=sys.stderr)
    sys.exit(1)

articles = data.get("articles")
if not isinstance(articles, list) or not articles:
    print("ERROR: constitution.json missing articles array", file=sys.stderr)
    sys.exit(1)

invalid = []
pending = []
rejected = []
missing_articles = []
invalid_notes = []
summary = []

for entry in articles:
    if not isinstance(entry, dict):
        print("ERROR: constitution.json articles must be objects", file=sys.stderr)
        sys.exit(1)

    article = entry.get("article")
    status = (entry.get("status") or "").lower()
    notes = entry.get("notes", "")

    if not isinstance(article, str) or not article.strip():
        missing_articles.append(article if article is not None else "<missing>")
        article = article if isinstance(article, str) else "?"
    else:
        article = article.strip()

    if status not in allowed_statuses:
        invalid.append(article)
    elif status in {"pending", "in_progress"}:
        pending.append(article)
    elif status == "rejected":
        rejected.append(article)

    if notes is None:
        notes = ""
    elif not isinstance(notes, str):
        invalid_notes.append(article)
        notes = str(notes)

    summary.append({"article": article, "status": status, "notes": notes})

if invalid:
    print(f"ERROR: Invalid status values for articles: {', '.join(invalid)}", file=sys.stderr)
    sys.exit(1)

if rejected:
    print(f"ERROR: Rejected constitution gates: {', '.join(sorted(rejected))}", file=sys.stderr)
    sys.exit(1)

if missing_articles:
    print(f"ERROR: constitution.json missing or invalid article identifiers: {', '.join(missing_articles)}", file=sys.stderr)
    sys.exit(1)

if invalid_notes:
    print(f"ERROR: constitution.json notes must be strings for articles: {', '.join(invalid_notes)}", file=sys.stderr)
    sys.exit(1)

if strict and pending:
    print(f"ERROR: Constitution gates pending: {', '.join(sorted(pending))}", file=sys.stderr)
    sys.exit(1)

output = {
    "summary": summary,
    "pending": pending,
    "strictMode": strict
}

print(json.dumps(output, ensure_ascii=False))
PY
)

if [[ $? -ne 0 ]]; then
    exit 1
fi

pending_articles=$(echo "$python_report" | jq -r '.pending[]?' 2>/dev/null || true)

if [[ -n "$pending_articles" ]]; then
    echo "⚠️  Constitution pending articles: $pending_articles"
else
    echo "✅ Constitution tracking complete for $CHANGE_ID"
fi

req_id=""
if [[ -f "$delta_json" ]]; then
    req_id=$(jq -r '(.relatedRequirements[0] // empty)' "$delta_json" 2>/dev/null || true)
fi

if [[ -n "$req_id" ]]; then
    if [[ -n "$pending_articles" ]]; then
        log_event "$req_id" "⚠️ Constitution tracking pending (change: $CHANGE_ID)"
    else
        log_event "$req_id" "✅ Constitution tracking approved (change: $CHANGE_ID)"
    fi
fi

exit 0
