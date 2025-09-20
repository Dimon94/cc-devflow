#!/bin/bash

# CC-DevFlow 安装验证脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 CC-DevFlow 安装验证${NC}"
echo "================================"

# 检查项计数
total_checks=0
passed_checks=0

check_item() {
    local description="$1"
    local check_command="$2"
    local required="$3"  # true/false

    total_checks=$((total_checks + 1))

    echo -n "检查 $description... "

    if eval "$check_command" &>/dev/null; then
        echo -e "${GREEN}✓${NC}"
        passed_checks=$((passed_checks + 1))
        return 0
    else
        if [[ "$required" == "true" ]]; then
            echo -e "${RED}✗ (必需)${NC}"
        else
            echo -e "${YELLOW}✗ (可选)${NC}"
        fi
        return 1
    fi
}

echo "基础环境检查:"
echo "─────────────────"

# 基础环境检查
check_item "Python 3" "command -v python3" "true"
check_item "Git 仓库" "git rev-parse --git-dir" "true"
check_item "Node.js" "command -v node" "false"
check_item "npm" "command -v npm" "false"

echo ""
echo "CC-DevFlow 文件结构:"
echo "───────────────────────"

# 文件结构检查
check_item ".claude 目录" "test -d .claude" "true"
check_item "agents 目录" "test -d .claude/agents" "true"
check_item "commands 目录" "test -d .claude/commands" "true"
check_item "hooks 目录" "test -d .claude/hooks" "true"
check_item "scripts 目录" "test -d .claude/scripts" "true"
check_item "设置文件" "test -f .claude/settings.json" "true"

echo ""
echo "核心文件检查:"
echo "─────────────────"

# 核心文件检查
check_item "flow-orchestrator" "test -f .claude/agents/flow-orchestrator.md" "true"
check_item "prd-writer" "test -f .claude/agents/prd-writer.md" "true"
# dev-implementer agent removed - functionality merged into planner
check_item "qa-tester" "test -f .claude/agents/qa-tester.md" "true"

echo ""
echo "命令文件检查:"
echo "─────────────────"

check_item "flow:new" "test -f .claude/commands/flow-new.md" "true"
check_item "flow-status" "test -f .claude/commands/flow-status.md" "true"
check_item "flow-restart" "test -f .claude/commands/flow-restart.md" "true"
check_item "flow-update" "test -f .claude/commands/flow-update.md" "true"

echo ""
echo "钩子和脚本检查:"
echo "─────────────────────"

check_item "自动进度更新钩子" "test -f .claude/hooks/auto-progress-update.py" "true"
check_item "监控启动脚本" "test -f .claude/scripts/start-monitor.sh" "true"
check_item "演示脚本" "test -f .claude/scripts/demo.py" "true"
check_item "脚本可执行权限" "test -x .claude/scripts/start-monitor.sh" "true"

echo ""
echo "Python 依赖检查:"
echo "─────────────────────"

check_item "watchdog (监控)" "python3 -c 'import watchdog'" "false"
check_item "json 模块" "python3 -c 'import json'" "true"
check_item "subprocess 模块" "python3 -c 'import subprocess'" "true"

echo ""
echo "设置文件验证:"
echo "─────────────────────"

# 验证设置文件格式
if check_item "settings.json 格式" "python3 -c 'import json; json.load(open(\".claude/settings.json\"))'" "true"; then
    # 检查关键设置
    if grep -q "progressMonitor" .claude/settings.json 2>/dev/null; then
        echo -e "   ${GREEN}✓${NC} 包含进度监控配置"
    else
        echo -e "   ${YELLOW}⚠${NC} 缺少进度监控配置"
    fi

    if grep -q "PostToolUse" .claude/settings.json 2>/dev/null; then
        echo -e "   ${GREEN}✓${NC} 包含钩子配置"
    else
        echo -e "   ${YELLOW}⚠${NC} 缺少钩子配置"
    fi
fi

echo ""
echo "权限检查:"
echo "─────────"

check_item "Git 操作权限" "git status" "true"
check_item ".claude 目录写权限" "test -w .claude" "true"
check_item "Python 脚本执行" "python3 --version" "true"

echo ""
echo "================== 验证结果 =================="

if [ $passed_checks -eq $total_checks ]; then
    echo -e "${GREEN}🎉 所有检查通过! ($passed_checks/$total_checks)${NC}"
    echo ""
    echo "✅ CC-DevFlow 已正确安装并配置"
    echo "🚀 您可以开始使用以下命令:"
    echo "   • python3 .claude/scripts/demo.py  # 运行演示"
    echo "   • /flow-new \"REQ-001|测试需求\"       # 创建需求"
    echo "   • /flow-status                      # 查看状态"
    echo ""
    exit 0
else
    failed_checks=$((total_checks - passed_checks))
    echo -e "${YELLOW}⚠️  部分检查未通过 ($passed_checks/$total_checks 通过, $failed_checks 失败)${NC}"
    echo ""

    # 必需检查失败的处理
    echo "🔧 建议的修复步骤:"

    if ! command -v python3 &>/dev/null; then
        echo "   • 安装 Python 3: https://python.org/downloads"
    fi

    if ! git rev-parse --git-dir &>/dev/null; then
        echo "   • 初始化 Git 仓库: git init"
    fi

    if [ ! -d .claude ]; then
        echo "   • 重新安装 cc-devflow: npx tiged Dimon94/cc-devflow/.claude .claude"
    fi

    if [ ! -f .claude/settings.json ]; then
        echo "   • 检查安装完整性，可能需要重新下载"
    fi

    echo ""
    echo "📖 更多帮助请查看: https://github.com/Dimon94/cc-devflow"
    exit 1
fi