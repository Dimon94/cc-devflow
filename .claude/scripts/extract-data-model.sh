#!/usr/bin/env bash
# shellcheck disable=SC2312

set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/bash/extract-data-model.sh <requirement-dir>

Extracts the "Data Model" section from TECH_DESIGN.md into data-model.md.
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 ]]; then
  echo "Error: requirement directory is required." >&2
  usage
  exit 1
fi

REQ_DIR="$1"
if [[ ! -d "$REQ_DIR" ]]; then
  echo "Error: requirement directory '$REQ_DIR' does not exist." >&2
  exit 1
fi

python3 - "$REQ_DIR" <<'PY'
from __future__ import annotations

import re
import sys
from datetime import datetime, timezone
from pathlib import Path

req_dir = Path(sys.argv[1]).resolve()
tech_design = req_dir / "TECH_DESIGN.md"
output_path = req_dir / "data-model.md"

if not tech_design.exists():
    print(f"Error: {tech_design} not found.", file=sys.stderr)
    sys.exit(1)

content = tech_design.read_text(encoding="utf-8")

section_regexes = [
    r"(^##\s+3\.\s*Data Model.*?)(?=^##\s+\d+\.)",
    r"(^##\s+Data Model.*?)(?=^##\s+)",
]

section = None
for pattern in section_regexes:
    match = re.search(pattern, content, re.MULTILINE | re.DOTALL)
    if match:
        section = match.group(1).strip()
        break

if section is None:
    print("Warning: Data Model section not found; creating placeholder.", file=sys.stderr)
    section = "## Data Model\n\n_TODO: populate data model details in TECH_DESIGN.md_"

generated_at = datetime.now(timezone.utc).isoformat()

lines = [
    f"# Data Model — {req_dir.name}",
    "",
    f"_Generated from TECH_DESIGN.md on {generated_at}_",
    "",
    section,
    "",
]

output_path.write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote data model extract → {output_path}")
PY
