#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 校验 examples 与当前 skill 版本链是否仍然对齐
# ------------------------------------------------------------

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
BINDINGS_FILE="${EXAMPLE_BINDINGS_FILE:-$ROOT_DIR/docs/examples/example-bindings.json}"

if [[ ! -f "$BINDINGS_FILE" ]]; then
  echo "Missing bindings file: $BINDINGS_FILE" >&2
  exit 1
fi

skill_version() {
  local skill="$1"
  local file="$ROOT_DIR/.claude/skills/$skill/SKILL.md"
  if [[ ! -f "$file" ]]; then
    echo "Missing skill file: $file" >&2
    exit 1
  fi

  sed -n 's/^version: //p' "$file" | head -n 1
}

assert_contains() {
  local file="$1"
  local needle="$2"
  if ! rg -F --quiet -- "$needle" "$file"; then
    echo "Expected '$needle' in $file" >&2
    exit 1
  fi
}

ROADMAP_VERSION="$(skill_version cc-roadmap)"
REQ_PLAN_VERSION="$(skill_version cc-plan)"
INVESTIGATE_VERSION="$(skill_version cc-investigate)"
REQ_DO_VERSION="$(skill_version cc-do)"
REQ_CHECK_VERSION="$(skill_version cc-check)"
REQ_ACT_VERSION="$(skill_version cc-act)"

for pair in \
  "cc-roadmap:$ROADMAP_VERSION" \
  "cc-plan:$REQ_PLAN_VERSION" \
  "cc-investigate:$INVESTIGATE_VERSION" \
  "cc-do:$REQ_DO_VERSION" \
  "cc-check:$REQ_CHECK_VERSION" \
  "cc-act:$REQ_ACT_VERSION"
do
  skill="${pair%%:*}"
  version="${pair##*:}"
  expected="$(jq -r --arg skill "$skill" '.skills[$skill]' "$BINDINGS_FILE")"
  if [[ "$expected" != "$version" ]]; then
    echo "Binding mismatch for $skill: bindings=$expected current=$version" >&2
    exit 1
  fi
done

while IFS= read -r encoded; do
  example_id="$(jq -r '.id' <<<"$encoded")"
  readme="$ROOT_DIR/$(jq -r '.readme' <<<"$encoded")"
  root="$ROOT_DIR/$(jq -r '.root' <<<"$encoded")"
  change_dir="$ROOT_DIR/$(jq -r '.changeDir' <<<"$encoded")"
  planning_dir="$change_dir/planning"
  review_dir="$change_dir/review"
  handoff_dir="$change_dir/handoff"

  for file in "$readme" "$root/ROADMAP.md" "$root/BACKLOG.md" "$root/roadmap-tracking.json" "$planning_dir/design.md" "$planning_dir/tasks.md" "$planning_dir/task-manifest.json"; do
    if [[ ! -f "$file" ]]; then
      echo "Example $example_id is missing required file: $file" >&2
      exit 1
    fi
  done

  assert_contains "$root/ROADMAP.md" "- Skill version: \`$ROADMAP_VERSION\`"
  assert_contains "$root/ROADMAP.md" "- Tracking source: \`roadmap-tracking.json\`"
  assert_contains "$root/BACKLOG.md" "- Skill version: \`$ROADMAP_VERSION\`"
  assert_contains "$root/BACKLOG.md" "- Tracking source: \`roadmap-tracking.json\`"
  assert_contains "$root/BACKLOG.md" "| RM-ID | Title | Source Stage | Priority | Primary Capability | Secondary Capabilities | Capability Gap | Expected Spec Delta | Evidence | Depends On | Parallel With | Unknowns | Next Decision | Ready |"
  assert_contains "$root/BACKLOG.md" "## Ready For Req-Plan"
  assert_contains "$root/BACKLOG.md" "  - Primary Capability:"
  assert_contains "$root/BACKLOG.md" "  - Expected spec delta:"
  jq -er '.version == 2 and (.items | length) > 0 and (.backlogMeta | type == "object") and (.dependencyHandoff | type == "object") and any(.items[]; .backlog != null)' "$root/roadmap-tracking.json" >/dev/null
  assert_contains "$planning_dir/design.md" "- CC-Plan skill version: \`$REQ_PLAN_VERSION\`"
  assert_contains "$planning_dir/tasks.md" "- CC-Plan skill version: \`$REQ_PLAN_VERSION\`"

  jq -er --arg roadmap "$ROADMAP_VERSION" --arg reqplan "$REQ_PLAN_VERSION" '
    (.sourceRoadmap.roadmapSkillVersion // $roadmap) == $roadmap and
    (.planningMeta.reqPlanSkillVersion // $reqplan) == $reqplan
  ' "$planning_dir/task-manifest.json" >/dev/null

  assert_contains "$readme" "## Example Meta"
  assert_contains "$readme" "\`cc-roadmap@$ROADMAP_VERSION\`"
  assert_contains "$readme" "\`cc-plan@$REQ_PLAN_VERSION\`"
  assert_contains "$readme" "\`cc-do@$REQ_DO_VERSION\`"
  assert_contains "$readme" "\`cc-check@$REQ_CHECK_VERSION\`"

  if jq -e '.covers | index("cc-act")' <<<"$encoded" >/dev/null; then
    assert_contains "$readme" "\`cc-act@$REQ_ACT_VERSION\`"
  fi

  if [[ -f "$review_dir/report-card.json" ]]; then
    "$ROOT_DIR/.claude/skills/cc-check/scripts/verify-gate.sh" --report "$review_dir/report-card.json" >/dev/null
  fi

  if jq -e '.covers | index("cc-act")' <<<"$encoded" >/dev/null; then
    if [[ ! -f "$handoff_dir/pr-brief.md" && ! -f "$handoff_dir/resume-index.md" && ! -f "$handoff_dir/release-note.md" && ! -f "$handoff_dir/status.md" ]]; then
      echo "Example $example_id is missing a final handoff file under $handoff_dir" >&2
      exit 1
    fi
  fi
done < <(jq -c '.examples[]' "$BINDINGS_FILE")

echo "Example bindings are in sync with current skill versions"
