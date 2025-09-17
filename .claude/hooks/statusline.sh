#!/usr/bin/env bash

# 状态栏脚本 - 显示项目和 Git 分支信息

set -euo pipefail

# 获取当前目录和 Git 信息
DIR=$(basename "$(pwd)")
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "no-git")

# 获取 Git 状态
GIT_STATUS=""
if git rev-parse --git-dir > /dev/null 2>&1; then
    # 检查是否有未提交的更改
    if ! git diff --quiet 2>/dev/null; then
        GIT_STATUS="*"
    fi

    # 检查是否有已暂存的更改
    if ! git diff --cached --quiet 2>/dev/null; then
        GIT_STATUS="${GIT_STATUS}+"
    fi

    # 检查是否有未跟踪的文件
    if [ -n "$(git ls-files --others --exclude-standard 2>/dev/null)" ]; then
        GIT_STATUS="${GIT_STATUS}?"
    fi

    # 检查是否有提交待推送
    if git rev-parse --verify HEAD >/dev/null 2>&1; then
        UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "")
        if [ -n "$UPSTREAM" ]; then
            AHEAD=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo "0")
            BEHIND=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")

            if [ "$AHEAD" != "0" ] && [ "$BEHIND" != "0" ]; then
                GIT_STATUS="${GIT_STATUS}↕"
            elif [ "$AHEAD" != "0" ]; then
                GIT_STATUS="${GIT_STATUS}↓"
            elif [ "$BEHIND" != "0" ]; then
                GIT_STATUS="${GIT_STATUS}↑"
            fi
        fi
    fi
fi

# 获取当前时间
TIME=$(date "+%H:%M")

# 检查是否在 feature 分支
BRANCH_ICON="🌿"
if [[ "$BRANCH" == feature/* ]]; then
    BRANCH_ICON="🚀"
elif [[ "$BRANCH" == main ]] || [[ "$BRANCH" == master ]]; then
    BRANCH_ICON="🏠"
elif [[ "$BRANCH" == develop ]] || [[ "$BRANCH" == dev ]]; then
    BRANCH_ICON="🔧"
fi

# 检查是否有正在运行的开发服务器
DEV_STATUS=""
if pgrep -f "npm.*run.*dev" >/dev/null 2>&1; then
    DEV_STATUS="🔥dev"
fi

if pgrep -f "npm.*run.*test.*watch" >/dev/null 2>&1; then
    DEV_STATUS="${DEV_STATUS} 👀test"
fi

if [ -n "$DEV_STATUS" ]; then
    DEV_STATUS=" | $DEV_STATUS"
fi

# 检查是否有活跃的需求流程
FLOW_STATUS=""
if [ -d ".claude/docs/requirements" ] && [ "$(find .claude/docs/requirements -name "*.md" -type f 2>/dev/null | wc -l)" -gt 0 ]; then
    ACTIVE_REQS=$(find .claude/docs/requirements -maxdepth 1 -type d -name "REQ-*" | wc -l)
    if [ "$ACTIVE_REQS" -gt 0 ]; then
        FLOW_STATUS=" | 📋${ACTIVE_REQS}req"
    fi
fi

# 输出状态栏
echo "📦 $DIR | $BRANCH_ICON $BRANCH$GIT_STATUS | 🤖 Claude Ready$DEV_STATUS$FLOW_STATUS | ⏰ $TIME"