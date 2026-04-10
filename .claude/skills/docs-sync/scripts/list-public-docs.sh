#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 列出 docs-sync 默认要复核的公开文档集合
# ------------------------------------------------------------

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"

cat <<EOF
$ROOT/README.md
$ROOT/README.zh-CN.md
$ROOT/CONTRIBUTING.md
$ROOT/CONTRIBUTING.zh-CN.md
$ROOT/docs/guides/getting-started.md
$ROOT/docs/guides/getting-started.zh-CN.md
$ROOT/docs/commands/README.md
$ROOT/docs/commands/README.zh-CN.md
$ROOT/docs/v4.3.0-migration-guide.md
$ROOT/CHANGELOG.md
EOF
