#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 检查验证产物和 report-card 是否齐全
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: verify-gate.sh --report report-card.json [--require FILE...]
EOF
}

REPORT=""
requires=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --report) REPORT="$2"; shift 2 ;;
    --require) requires+=("$2"); shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$REPORT" || ! -f "$REPORT" ]]; then
  usage
  exit 1
fi

jq -e '
  .changeId and
  .overall and
  .verdict and
  .summary and
  .review and
  .blockingFindings and
  (.specAlignment? // "blocked") and
  ((.specDeltaVerified? // false) | type == "boolean") and
  ((.specSyncReady? // false) | type == "boolean") and
  .reroute and
  .timestamp and
  (.verdict | IN("pass", "fail", "blocked")) and
  (.overall | IN("pass", "fail")) and
  (.reroute | IN("none", "cc-do", "cc-investigate", "cc-plan")) and
  (.review.status | IN("pass", "fail", "blocked", "skipped", "pending")) and
  ((.verdict == "pass" and .reroute == "none") or (.verdict != "pass" and .reroute != "none"))
' "$REPORT" >/dev/null

if (( ${#requires[@]} > 0 )); then
  for file in "${requires[@]}"; do
    [[ -f "$file" ]] || { echo "Missing required file: $file" >&2; exit 1; }
  done
fi

echo "Gate report is structurally valid"
