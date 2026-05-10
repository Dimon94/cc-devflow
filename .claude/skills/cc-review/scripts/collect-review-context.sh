#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 收集 cc-review 的增量上下文
# ------------------------------------------------------------

change_dir="${1:-}"
base_ref="${2:-origin/main}"

if [[ -z "$change_dir" ]]; then
  echo "Usage: collect-review-context.sh <change-dir> [base-ref]" >&2
  exit 2
fi

review_dir="$change_dir/review"
ledger="$review_dir/cc-review-ledger.jsonl"
report="$review_dir/cc-review-report.md"
plan="$review_dir/cc-review-plan.md"
findings="$review_dir/cc-review-findings.json"

head_sha="$(git rev-parse HEAD)"
base_sha=""
if git rev-parse --verify "$base_ref" >/dev/null 2>&1; then
  base_sha="$(git merge-base "$base_ref" HEAD)"
fi

reviewed_sha=""
if [[ -f "$ledger" ]]; then
  reviewed_sha="$(
    sed -n 's/.*"headSha"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$ledger" |
      tail -n 1
  )"
fi

if [[ -z "$reviewed_sha" && -f "$report" ]]; then
  reviewed_sha="$(
    sed -n 's/.*Reviewed head SHA:[[:space:]]*`\?\([0-9a-f]\{7,40\}\)`\?.*/\1/p' "$report" |
      tail -n 1
  )"
fi

diff_base="$base_sha"
if [[ -n "$reviewed_sha" ]] && git rev-parse --verify "$reviewed_sha^{commit}" >/dev/null 2>&1; then
  diff_base="$reviewed_sha"
fi

echo "CC_REVIEW_CONTEXT"
echo "change_dir=$change_dir"
echo "review_dir=$review_dir"
echo "base_ref=$base_ref"
echo "base_sha=${base_sha:-unknown}"
echo "reviewed_sha=${reviewed_sha:-none}"
echo "head_sha=$head_sha"
echo "diff_base=${diff_base:-unknown}"

echo
echo "PRIOR_REVIEW_FILES"
for file in "$plan" "$report" "$ledger" "$findings"; do
  if [[ -f "$file" ]]; then
    printf 'present %s\n' "$file"
  else
    printf 'missing %s\n' "$file"
  fi
done

echo
echo "CHANGED_FILES"
if [[ -n "$diff_base" ]]; then
  git diff --name-status "$diff_base...HEAD"
else
  git diff --name-status HEAD
fi

if [[ -f "$ledger" ]]; then
  echo
  echo "RECENT_LEDGER"
  tail -n 20 "$ledger"
fi
