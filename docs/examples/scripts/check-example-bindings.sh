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

REQ_PLAN_VERSION="$(skill_version cc-plan)"
REQ_DO_VERSION="$(skill_version cc-do)"
REQ_CHECK_VERSION="$(skill_version cc-check)"
REQ_ACT_VERSION="$(skill_version cc-act)"

while IFS= read -r pair; do
  skill="${pair%%:*}"
  expected="${pair##*:}"
  version="$(skill_version "$skill")"
  if [[ -z "$version" ]]; then
    echo "Binding references missing or unversioned skill: $skill" >&2
    exit 1
  fi
  if [[ "$expected" != "$version" ]]; then
    echo "Binding mismatch for $skill: bindings=$expected current=$version" >&2
    exit 1
  fi
done < <(jq -r '.skills | to_entries[] | "\(.key):\(.value)"' "$BINDINGS_FILE")

while IFS= read -r encoded; do
  example_id="$(jq -r '.id' <<<"$encoded")"
  readme="$ROOT_DIR/$(jq -r '.readme' <<<"$encoded")"
  root="$ROOT_DIR/$(jq -r '.root' <<<"$encoded")"
  change_dir="$ROOT_DIR/$(jq -r '.changeDir' <<<"$encoded")"
  task_file="$change_dir/task.md"
  handoff_dir="$change_dir/handoff"

  for file in "$readme" "$task_file"; do
    if [[ ! -f "$file" ]]; then
      echo "Example $example_id is missing required file: $file" >&2
      exit 1
    fi
  done

  assert_contains "$task_file" "- CC-Plan skill version: \`$REQ_PLAN_VERSION\`"
  assert_contains "$task_file" "## Execution Protocol"
  assert_contains "$task_file" "task.md"
  assert_contains "$task_file" "mark-task-complete.sh"
  assert_contains "$task_file" "TDD phase:"
  assert_contains "$task_file" "Completion:"
  assert_contains "$task_file" "Public verification path:"

  assert_contains "$readme" "## Example Meta"
  assert_contains "$readme" "\`cc-plan@$REQ_PLAN_VERSION\`"
  assert_contains "$readme" "\`cc-do@$REQ_DO_VERSION\`"
  assert_contains "$readme" "\`cc-check@$REQ_CHECK_VERSION\`"

  if jq -e '.covers | index("cc-act")' <<<"$encoded" >/dev/null; then
    assert_contains "$readme" "\`cc-act@$REQ_ACT_VERSION\`"
    if [[ ! -f "$handoff_dir/pr-brief.md" ]]; then
      echo "Example $example_id is missing PR file: $handoff_dir/pr-brief.md" >&2
      exit 1
    fi
  fi
done < <(jq -c '.examples[]' "$BINDINGS_FILE")

echo "Example bindings are in sync with current skill versions"
