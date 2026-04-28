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
  (.runtime and (.runtime | type == "object")) and
  (.runtime.status | IN("pass", "fail", "blocked", "skipped", "pending")) and
  ((.runtime.failureOwnership? // []) | type == "array") and
  ((.runtime.failureOwnership? // []) | all(.[]; (.classification? // "environment") | IN("in-branch", "pre-existing", "environment", "ambiguous"))) and
  (.specAlignment? // "blocked") and
  ((.specDeltaVerified? // false) | type == "boolean") and
  ((.specSyncReady? // false) | type == "boolean") and
  .reroute and
  .timestamp and
  (.verdict | IN("pass", "fail", "blocked")) and
  (.overall | IN("pass", "fail")) and
  (.reroute | IN("none", "cc-do", "cc-investigate", "cc-plan")) and
  (.review.status | IN("pass", "fail", "blocked", "skipped", "pending")) and
  ((.review.freshness? // {"status":"unknown"}) | type == "object") and
  ((.review.freshness.status? // "unknown") | IN("fresh", "stale", "unknown", "not-applicable")) and
  ((.review.specialistReviews? // []) | type == "array") and
  ((.claimEvidence? // []) | type == "array") and
  ((.claimEvidence? // []) | all(.[];
    (.claim and .requiredProof and .commandOrArtifact and .keyObservation and .status) and
    (.status | IN("pass", "fail", "blocked", "skipped", "pending"))
  )) and
  ((.qa? // {"status":"skipped"}) | type == "object") and
  ((.qa.status? // "skipped") | IN("pass", "fail", "blocked", "skipped", "pending")) and
  ((.qa.coverageAudit? // {"status":"skipped"}) | type == "object") and
  ((.qa.coverageAudit.status? // "skipped") | IN("pass", "fail", "blocked", "skipped", "pending")) and
  ((.qa.browserEvidence? // {"status":"skipped"}) | type == "object") and
  ((.qa.browserEvidence.status? // "skipped") | IN("pass", "fail", "blocked", "skipped", "pending")) and
  ((.qa.feedbackLoop? // {"status":"skipped"}) | type == "object") and
  ((.qa.feedbackLoop.status? // "skipped") | IN("pass", "fail", "blocked", "skipped", "pending")) and
  ((.qa.behaviorEvidence? // {"status":"skipped"}) | type == "object") and
  ((.qa.behaviorEvidence.status? // "skipped") | IN("pass", "fail", "blocked", "skipped", "pending")) and
  ((.qa.architectureFollowUps? // []) | type == "array") and
  ((.review.findings? // []) | all(.[]; ((.confidenceScore? // 7) | type == "number") and ((.displayTier? // "info") | IN("blocking", "warning", "info", "suppressed")))) and
  ((.verdict != "pass") or ((.review.freshness.status? // "unknown") | IN("fresh", "not-applicable"))) and
  ((.verdict != "pass") or ((.qa.feedbackLoop.status? // "skipped") | IN("pass", "skipped"))) and
  ((.verdict != "pass") or ((.qa.behaviorEvidence.status? // "skipped") | IN("pass", "skipped"))) and
  ((.verdict != "pass") or (((.runtime.failureOwnership? // []) | map(select(((.classification? // "") | IN("in-branch", "ambiguous")) and ((.status? // "open") | IN("open", "pending")))) | length) == 0)) and
  ((.verdict == "pass" and .reroute == "none") or (.verdict != "pass" and .reroute != "none"))
' "$REPORT" >/dev/null

if (( ${#requires[@]} > 0 )); then
  for file in "${requires[@]}"; do
    [[ -f "$file" ]] || { echo "Missing required file: $file" >&2; exit 1; }
  done
fi

echo "Gate report is structurally valid"
