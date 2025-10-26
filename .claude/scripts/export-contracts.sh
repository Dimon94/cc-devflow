#!/usr/bin/env bash
# shellcheck disable=SC2312

set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/bash/export-contracts.sh <requirement-dir>

Extracts API contract definitions from TECH_DESIGN.md and writes them into
contracts/openapi.yaml (or schema.graphql if GraphQL). Creates placeholders when
structured data is unavailable.
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
contracts_dir = req_dir / "contracts"
contracts_dir.mkdir(exist_ok=True, parents=True)
openapi_path = contracts_dir / "openapi.yaml"
graphql_path = contracts_dir / "schema.graphql"

if not tech_design.exists():
    print(f"Error: {tech_design} not found.", file=sys.stderr)
    sys.exit(1)

content = tech_design.read_text(encoding="utf-8")

api_patterns = [
    r"(^##\s+4\.\s*API.*?)(?=^##\s+\d+\.)",
    r"(^##\s+API Design.*?)(?=^##\s+)",
]

api_section = None
for pattern in api_patterns:
    match = re.search(pattern, content, re.MULTILINE | re.DOTALL)
    if match:
        api_section = match.group(1).strip()
        break

generated_at = datetime.now(timezone.utc).isoformat()

def extract_code_block(section: str, languages: tuple[str, ...]) -> str | None:
    fence_regex = re.compile(
        r"```(?P<lang>[^\n]*)\n(?P<body>.*?)```",
        re.DOTALL | re.IGNORECASE,
    )
    for match in fence_regex.finditer(section):
        lang = match.group("lang").strip().lower()
        body = match.group("body")
        if not languages or lang in languages:
            return body.strip()
    return None

if api_section:
    openapi_block = extract_code_block(api_section, ("yaml", "yml", "openapi", "json"))
    graphql_block = extract_code_block(api_section, ("graphql",))
else:
    openapi_block = graphql_block = None

if graphql_block:
    graphql_path.write_text(graphql_block + "\n", encoding="utf-8")
    print(f"Wrote GraphQL schema → {graphql_path}")
    # If both exist, prefer OpenAPI as well; otherwise create stub below.

if openapi_block:
    if not openapi_block.lstrip().startswith("openapi:"):
        openapi_block = f"# Generated {generated_at}\n{openapi_block}"
    openapi_path.write_text(openapi_block + "\n", encoding="utf-8")
    print(f"Wrote OpenAPI contract → {openapi_path}")
else:
    placeholder = f"""# openapi.yaml generated {generated_at}
openapi: 3.0.3
info:
  title: {req_dir.name} API
  version: 0.1.0
paths:
  /example:
    get:
      summary: TODO - replace with real endpoint
      responses:
        '200':
          description: OK
components:
  schemas:
    TODO:
      type: object
      description: Replace with actual schema
"""
    openapi_path.write_text(placeholder, encoding="utf-8")
    print(f"Warning: No structured OpenAPI block found; wrote placeholder → {openapi_path}", file=sys.stderr)
PY
