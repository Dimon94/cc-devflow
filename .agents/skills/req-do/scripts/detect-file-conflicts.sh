#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 读取 JSON 任务列表，检查并行文件冲突
# ------------------------------------------------------------

input="$(cat)"
if ! echo "$input" | jq empty >/dev/null 2>&1; then
  echo '{"hasConflicts":false,"error":"invalid json"}'
  exit 1
fi

echo "$input" | jq '
  .tasks
  | map(select(.parallel == true))
  | group_by(.files[0] // "")
  | map(select((.[0].files[0] // "") != ""))
  | {
      hasConflicts: any(length > 1),
      conflicts: map(select(length > 1) | {
        file: (.[0].files[0]),
        tasks: map(.id)
      })
    }
'
