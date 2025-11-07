#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# 技能自动激活 Hook - Bash 包装器
# ═══════════════════════════════════════════════════════════════════════════════
#
# 【核心功能】
# Bash 脚本包装器，调用 TypeScript 实现的技能激活逻辑
#
# 【工作原理】
# 1. 切换到 hooks 目录
# 2. 通过管道传递 stdin 到 TypeScript 脚本
# 3. 使用 npx tsx 运行 TypeScript（无需编译）
#
# 【为什么需要这个包装器？】
# - Claude Code hooks 必须是可执行的 shell 脚本
# - 此脚本负责设置环境并调用实际的 TypeScript 实现
#
# 【设计原则】
# KISS - Keep It Simple, Stupid
# 包装器只做一件事：调用 TypeScript 实现
#
# ═══════════════════════════════════════════════════════════════════════════════

# 错误时立即退出
set -e

# 切换到 hooks 目录（确保能找到 TypeScript 文件）
cd "$CLAUDE_PROJECT_DIR/.claude/hooks"

# 通过管道传递 stdin 到 TypeScript 脚本
# - cat: 读取 stdin
# - |: 管道传递
# - npx tsx: 直接运行 TypeScript（无需 tsc 编译）
# - skill-activation-prompt.ts: TypeScript 实现
cat | npx tsx skill-activation-prompt.ts
