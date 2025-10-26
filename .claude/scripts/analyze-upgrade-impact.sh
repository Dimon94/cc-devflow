#!/usr/bin/env bash
# shellcheck disable=SC2312

set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/bash/analyze-upgrade-impact.sh --req <requirement-dir|REQ-ID> [--compare version] [--format {text,json}]

Produces PRD change detection and impact assessment reports under
devflow/requirements/<REQ>/analysis/.
USAGE
}

REQ=""
COMPARE=""
FORMAT="text"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --req)
      shift
      REQ="${1:-}"
      ;;
    --compare)
      shift
      COMPARE="${1:-}"
      ;;
    --format)
      shift
      FORMAT="${1:-text}"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
  shift
done

if [[ -z "$REQ" ]]; then
  echo "Error: --req is required." >&2
  usage
  exit 1
fi

if [[ -d "$REQ" ]]; then
  REQ_DIR="$(cd "$REQ" && pwd)"
else
  REQ_DIR="devflow/requirements/$REQ"
fi

if [[ ! -d "$REQ_DIR" ]]; then
  echo "Error: requirement directory '$REQ_DIR' not found." >&2
  exit 1
fi

python3 - "$REQ_DIR" "$COMPARE" "$FORMAT" <<'PY'
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any

req_dir = Path(sys.argv[1]).resolve()
compare_version = sys.argv[2] or ""
fmt = sys.argv[3]

prd_current = req_dir / "PRD.md"
if not prd_current.exists():
    print(f"Error: {prd_current} not found.", file=sys.stderr)
    sys.exit(1)

versions_dir = req_dir / "versions"
compare_path = None
if compare_version:
    compare_path = versions_dir / compare_version / "PRD.md"
    if not compare_path.exists():
        print(f"Warning: compare version {compare_version} not found; skipping diff.", file=sys.stderr)
        compare_path = None

current_lines = prd_current.read_text(encoding="utf-8").splitlines()
previous_lines = compare_path.read_text(encoding="utf-8").splitlines() if compare_path else []

analysis_dir = req_dir / "analysis"
analysis_dir.mkdir(exist_ok=True, parents=True)
timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")

def diff_stats() -> Dict[str, Any]:
    additions = sum(1 for line in current_lines if line.startswith("+") and "User Story" in line)
    removals = sum(1 for line in previous_lines if line.startswith("+") and "User Story" in line)
    breaking = 0
    additive = 0
    for line in current_lines:
        if "[BREAKING]" in line or re.search(r"\bRemoved\b", line, re.IGNORECASE):
            breaking += 1
        if "User Story" in line or "API" in line:
            additive += 1
    return {
        "userStoriesAdded": additions,
        "userStoriesRemoved": removals,
        "breakingMarkers": breaking,
        "featureChanges": additive,
    }

stats = diff_stats()

if stats["breakingMarkers"] > 0 or stats["userStoriesRemoved"] > 0:
    recommendation = "MAJOR"
elif stats["featureChanges"] > 1:
    recommendation = "MINOR"
else:
    recommendation = "PATCH"

change_report = analysis_dir / f"change_detection_{timestamp}.md"
impact_report = analysis_dir / f"impact_assessment_{timestamp}.md"
recommendation_report = analysis_dir / f"upgrade_recommendation_{timestamp}.md"

change_report.write_text(
    "\n".join(
        [
            f"# Change Detection — {req_dir.name}",
            f"Generated: {datetime.now(timezone.utc).isoformat()}",
            "",
            f"- User stories added: {stats['userStoriesAdded']}",
            f"- User stories removed: {stats['userStoriesRemoved']}",
            f"- Breaking markers: {stats['breakingMarkers']}",
            f"- Feature change mentions: {stats['featureChanges']}",
        ]
    )
    + "\n",
    encoding="utf-8",
)

impact_report.write_text(
    "\n".join(
        [
            f"# Impact Assessment — {req_dir.name}",
            "",
            "## Code Areas Impacted",
            "- TODO: map affected services/controllers.",
            "",
            "## Test Plan Impact",
            "- TODO: identify regression suites requiring updates.",
            "",
            "## Deployment Considerations",
            "- TODO: document rollout/rollback implications.",
        ]
    )
    + "\n",
    encoding="utf-8",
)

recommendation_report.write_text(
    "\n".join(
        [
            f"# Upgrade Recommendation — {req_dir.name}",
            "",
            f"- Suggested version bump: **{recommendation}**",
            "- Rationale:",
            f"  * Breaking markers detected: {stats['breakingMarkers']}",
            f"  * User stories added: {stats['userStoriesAdded']}",
            f"  * User stories removed: {stats['userStoriesRemoved']}",
        ]
    )
    + "\n",
    encoding="utf-8",
)

summary = {
    "requirement": req_dir.name,
    "compareVersion": compare_version or None,
    "recommendedBump": recommendation,
    "statistics": stats,
    "reports": {
        "changeDetection": str(change_report.relative_to(req_dir)),
        "impactAssessment": str(impact_report.relative_to(req_dir)),
        "recommendation": str(recommendation_report.relative_to(req_dir)),
    },
}

if fmt.lower() == "json":
    print(json.dumps(summary, indent=2))
else:
    print(
        f"Recommended bump: {recommendation}\n"
        f"Reports:\n"
        f"  - {summary['reports']['changeDetection']}\n"
        f"  - {summary['reports']['impactAssessment']}\n"
        f"  - {summary['reports']['recommendation']}"
    )
PY
