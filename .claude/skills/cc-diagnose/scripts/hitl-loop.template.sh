#!/usr/bin/env bash
# 人类参与的复现循环。
# 复制这个文件，编辑下方步骤，然后运行。
# Agent 运行脚本；用户按终端提示操作。
#
# 用法：
#   bash hitl-loop.template.sh
#
# 两个辅助函数：
#   step "<操作说明>"        -> 显示操作说明，等待用户按 Enter
#   capture VAR "<问题>"     -> 显示问题，把回答读入变量 VAR
#
# 结束时，脚本会用 KEY=VALUE 格式打印捕获值，方便 Agent 解析。

set -euo pipefail

step() {
  printf '\n>>> %s\n' "$1"
  read -r -p "    [完成后按 Enter] " _
}

capture() {
  local var="$1" question="$2" answer
  printf '\n>>> %s\n' "$question"
  read -r -p "    > " answer
  printf -v "$var" '%s' "$answer"
}

# --- 在下面编辑 ---------------------------------------------------------

step "打开 http://localhost:3000 并登录。"

capture ERRORED "点击 Export 按钮。是否报错？(y/n)"

capture ERROR_MSG "粘贴错误信息；如果没有，填 none："

# --- 在上面编辑 ---------------------------------------------------------

printf '\n--- Captured ---\n'
printf 'ERRORED=%s\n' "$ERRORED"
printf 'ERROR_MSG=%s\n' "$ERROR_MSG"
