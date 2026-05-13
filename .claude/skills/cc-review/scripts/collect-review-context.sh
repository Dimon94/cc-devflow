#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 收集 cc-review 的 Git 增量上下文，不读取过程文件
# ------------------------------------------------------------

base_ref="${1:-origin/main}"

head_sha="$(git rev-parse HEAD)"
base_sha=""
if git rev-parse --verify "$base_ref" >/dev/null 2>&1; then
  base_sha="$(git merge-base "$base_ref" HEAD)"
fi

echo "CC_REVIEW_CONTEXT"
echo "base_ref=$base_ref"
echo "base_sha=${base_sha:-unknown}"
echo "head_sha=$head_sha"

echo
echo "CHANGED_FILES"
if [[ -n "$base_sha" ]]; then
  git diff --name-status "$base_sha...HEAD"
else
  git diff --name-status HEAD
fi
