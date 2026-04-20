#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 本地回写器：更新路线图跟踪表中的状态/REQ/进度
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: sync-roadmap-progress.sh --rm RM-001 [--status Planned] [--req REQ-001] [--progress 50%] [--file devflow/ROADMAP.md]
       [--item "Add copy action"] [--stage "Stage 1"] [--priority P1] [--depends-on "RM-000"]
       [--primary-capability cap-example] [--secondary-capabilities "cap-a,cap-b"] [--spec-delta "tighten truth"]
       [--tracking-file devflow/roadmap-tracking.json] [--backlog-file devflow/BACKLOG.md]
EOF
}

RM_ID=""
ITEM=""
STAGE=""
PRIORITY=""
STATUS=""
REQ_ID=""
PROGRESS=""
DEPENDS_ON=""
PRIMARY_CAPABILITY=""
SECONDARY_CAPABILITIES=""
SPEC_DELTA=""
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
DEFAULT_FILE="$REPO_ROOT/devflow/ROADMAP.md"
ROOT_FILE="$REPO_ROOT/ROADMAP.md"
LEGACY_FILE="$REPO_ROOT/devflow/roadmap/roadmap.md"
FILE="$DEFAULT_FILE"
TRACKING_FILE=""
BACKLOG_FILE=""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --rm) RM_ID="$2"; shift 2 ;;
    --item) ITEM="$2"; shift 2 ;;
    --stage) STAGE="$2"; shift 2 ;;
    --priority) PRIORITY="$2"; shift 2 ;;
    --status) STATUS="$2"; shift 2 ;;
    --req) REQ_ID="$2"; shift 2 ;;
    --progress) PROGRESS="$2"; shift 2 ;;
    --depends-on) DEPENDS_ON="$2"; shift 2 ;;
    --primary-capability) PRIMARY_CAPABILITY="$2"; shift 2 ;;
    --secondary-capabilities) SECONDARY_CAPABILITIES="$2"; shift 2 ;;
    --spec-delta) SPEC_DELTA="$2"; shift 2 ;;
    --file) FILE="$2"; shift 2 ;;
    --tracking-file) TRACKING_FILE="$2"; shift 2 ;;
    --backlog-file) BACKLOG_FILE="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ "$FILE" == "$DEFAULT_FILE" && ! -f "$FILE" ]]; then
  if [[ -f "$ROOT_FILE" ]]; then
    FILE="$ROOT_FILE"
  elif [[ -f "$LEGACY_FILE" ]]; then
    FILE="$LEGACY_FILE"
  fi
fi

if [[ -z "$RM_ID" || ! -f "$FILE" ]]; then
  usage
  exit 1
fi

if [[ -z "$TRACKING_FILE" ]]; then
  TRACKING_FILE="$(cd "$(dirname "$FILE")" && pwd)/roadmap-tracking.json"
fi

if [[ -z "$BACKLOG_FILE" ]]; then
  BACKLOG_FILE="$(cd "$(dirname "$FILE")" && pwd)/BACKLOG.md"
fi

args=(
  sync
  --roadmap "$FILE"
  --backlog "$BACKLOG_FILE"
  --tracking "$TRACKING_FILE"
  --rm "$RM_ID"
)

[[ -n "$ITEM" ]] && args+=(--item "$ITEM")
[[ -n "$STAGE" ]] && args+=(--stage "$STAGE")
[[ -n "$PRIORITY" ]] && args+=(--priority "$PRIORITY")
[[ -n "$STATUS" ]] && args+=(--status "$STATUS")
[[ -n "$REQ_ID" ]] && args+=(--req "$REQ_ID")
[[ -n "$PROGRESS" ]] && args+=(--progress "$PROGRESS")
[[ -n "$DEPENDS_ON" ]] && args+=(--depends-on "$DEPENDS_ON")
[[ -n "$PRIMARY_CAPABILITY" ]] && args+=(--primary-capability "$PRIMARY_CAPABILITY")
[[ -n "$SECONDARY_CAPABILITIES" ]] && args+=(--secondary-capabilities "$SECONDARY_CAPABILITIES")
[[ -n "$SPEC_DELTA" ]] && args+=(--spec-delta "$SPEC_DELTA")

node "$SCRIPT_DIR/roadmap-tracking.js" "${args[@]}"
echo "Updated $RM_ID in $FILE and $BACKLOG_FILE via $TRACKING_FILE"
