#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# CC-DevFlow Hooks 依赖检查脚本
# ═══════════════════════════════════════════════════════════════════════════════
#
# 【核心功能】
# 1. 检查 Hooks 系统所需的所有依赖
# 2. 提供安装缺失依赖的指导
# 3. 可选：自动安装缺失的依赖（需要 --install 参数）
#
# 【使用方式】
#   ./check-dependencies.sh           # 仅检查
#   ./check-dependencies.sh --install # 检查并自动安装
#   ./check-dependencies.sh --verbose # 显示详细信息
#
# 【设计哲学】
# "环境应该是可复现的，依赖应该是明确的"
# 新团队成员或 CI 环境应该能快速搭建 hooks 运行环境
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# ───────────────────────────────────────────────────────────────────────────────
# 颜色定义
# ───────────────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ───────────────────────────────────────────────────────────────────────────────
# 工具函数
# ───────────────────────────────────────────────────────────────────────────────

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ───────────────────────────────────────────────────────────────────────────────
# 全局变量
# ───────────────────────────────────────────────────────────────────────────────
MISSING_DEPS=()
INSTALL_MODE=false
VERBOSE=false

# ───────────────────────────────────────────────────────────────────────────────
# 检查函数
# ───────────────────────────────────────────────────────────────────────────────

# ┌───────────────────────────────────────────────────────────────┐
# │ 检查 Node.js                                                   │
# └───────────────────────────────────────────────────────────────┘
check_node() {
    log_section "📦 检查 Node.js"

    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        local major_version=$(echo "$node_version" | cut -d'.' -f1 | sed 's/v//')

        # 要求 Node.js >= 18 (ESM 支持，稳定的 TS 支持)
        if [[ $major_version -ge 18 ]]; then
            log_success "Node.js $node_version 已安装"
            [[ "$VERBOSE" == "true" ]] && log_info "路径: $(which node)"
            return 0
        else
            log_warning "Node.js 版本过低: $node_version (需要 >= 18.x)"
            log_info "当前版本可用，但建议升级"
            return 0
        fi
    else
        log_error "Node.js 未安装"
        MISSING_DEPS+=("node")
        return 1
    fi
}

# ┌───────────────────────────────────────────────────────────────┐
# │ 检查 jq (JSON 处理工具)                                        │
# └───────────────────────────────────────────────────────────────┘
check_jq() {
    log_section "🔧 检查 jq"

    if command -v jq &> /dev/null; then
        local jq_version=$(jq --version)
        log_success "jq $jq_version 已安装"
        [[ "$VERBOSE" == "true" ]] && log_info "路径: $(which jq)"
        return 0
    else
        log_error "jq 未安装"
        log_info "jq 用于 post-tool-use-tracker.sh 和 validate-hooks.sh"
        MISSING_DEPS+=("jq")
        return 1
    fi
}

# ┌───────────────────────────────────────────────────────────────┐
# │ 检查 Bash                                                      │
# └───────────────────────────────────────────────────────────────┘
check_bash() {
    log_section "🐚 检查 Bash"

    if command -v bash &> /dev/null; then
        local bash_version=$(bash --version | head -1)
        log_success "Bash 已安装: $bash_version"
        [[ "$VERBOSE" == "true" ]] && log_info "路径: $(which bash)"

        # 检查版本是否 >= 3.2（macOS 默认版本）
        local version=$(echo "$bash_version" | grep -oE '[0-9]+\.[0-9]+' | head -1)
        local major=$(echo "$version" | cut -d'.' -f1)

        if [[ $major -ge 3 ]]; then
            log_success "Bash 版本满足要求 (>= 3.2)"
        else
            log_warning "Bash 版本较低: $version"
        fi
        return 0
    else
        log_error "Bash 未安装（几乎不可能出现此情况）"
        MISSING_DEPS+=("bash")
        return 1
    fi
}

# ┌───────────────────────────────────────────────────────────────┐
# │ 检查 TypeScript (可选，但推荐)                                 │
# └───────────────────────────────────────────────────────────────┘
check_typescript() {
    log_section "📘 检查 TypeScript (可选)"

    if command -v tsc &> /dev/null; then
        local ts_version=$(tsc --version)
        log_success "TypeScript $ts_version 已安装"
        [[ "$VERBOSE" == "true" ]] && log_info "路径: $(which tsc)"
        return 0
    else
        log_info "TypeScript 未安装（hooks 可以直接运行 .ts 文件，无需编译）"
        log_info "安装 TypeScript 可以获得更好的类型检查体验"
        return 0
    fi
}

# ───────────────────────────────────────────────────────────────────────────────
# 安装函数
# ───────────────────────────────────────────────────────────────────────────────

install_dependencies() {
    if [[ ${#MISSING_DEPS[@]} -eq 0 ]]; then
        log_success "无需安装任何依赖"
        return 0
    fi

    log_section "📥 安装缺失的依赖"

    # 检测操作系统
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        install_macos
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        install_linux
    else
        log_error "不支持的操作系统: $OSTYPE"
        log_info "请手动安装以下依赖: ${MISSING_DEPS[*]}"
        return 1
    fi
}

install_macos() {
    log_info "检测到 macOS 系统"

    # 检查 Homebrew
    if ! command -v brew &> /dev/null; then
        log_error "Homebrew 未安装"
        log_info "请访问 https://brew.sh/ 安装 Homebrew"
        log_info "或运行: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        return 1
    fi

    for dep in "${MISSING_DEPS[@]}"; do
        case $dep in
            node)
                log_info "安装 Node.js..."
                brew install node
                ;;
            jq)
                log_info "安装 jq..."
                brew install jq
                ;;
            bash)
                log_info "安装 Bash (更新版本)..."
                brew install bash
                ;;
            *)
                log_warning "未知依赖: $dep"
                ;;
        esac
    done

    log_success "依赖安装完成"
}

install_linux() {
    log_info "检测到 Linux 系统"

    # 检测包管理器
    if command -v apt-get &> /dev/null; then
        PKG_MANAGER="apt-get"
        UPDATE_CMD="sudo apt-get update"
    elif command -v yum &> /dev/null; then
        PKG_MANAGER="yum"
        UPDATE_CMD="sudo yum update"
    elif command -v dnf &> /dev/null; then
        PKG_MANAGER="dnf"
        UPDATE_CMD="sudo dnf update"
    else
        log_error "未检测到支持的包管理器 (apt-get/yum/dnf)"
        log_info "请手动安装以下依赖: ${MISSING_DEPS[*]}"
        return 1
    fi

    log_info "使用包管理器: $PKG_MANAGER"

    for dep in "${MISSING_DEPS[@]}"; do
        case $dep in
            node)
                log_info "安装 Node.js..."
                if [[ "$PKG_MANAGER" == "apt-get" ]]; then
                    # 使用 NodeSource 仓库获取最新版本
                    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
                    sudo apt-get install -y nodejs
                else
                    sudo $PKG_MANAGER install -y nodejs
                fi
                ;;
            jq)
                log_info "安装 jq..."
                sudo $PKG_MANAGER install -y jq
                ;;
            bash)
                log_info "安装 Bash..."
                sudo $PKG_MANAGER install -y bash
                ;;
            *)
                log_warning "未知依赖: $dep"
                ;;
        esac
    done

    log_success "依赖安装完成"
}

# ───────────────────────────────────────────────────────────────────────────────
# 显示安装指导
# ───────────────────────────────────────────────────────────────────────────────

show_install_guide() {
    if [[ ${#MISSING_DEPS[@]} -eq 0 ]]; then
        return 0
    fi

    log_section "📚 安装指导"

    echo "缺失的依赖: ${MISSING_DEPS[*]}"
    echo ""

    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macOS 安装命令:"
        for dep in "${MISSING_DEPS[@]}"; do
            case $dep in
                node)
                    echo "  brew install node"
                    ;;
                jq)
                    echo "  brew install jq"
                    ;;
                bash)
                    echo "  brew install bash"
                    ;;
            esac
        done
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Linux 安装命令:"
        for dep in "${MISSING_DEPS[@]}"; do
            case $dep in
                node)
                    echo "  # Ubuntu/Debian:"
                    echo "  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -"
                    echo "  sudo apt-get install -y nodejs"
                    echo ""
                    echo "  # RHEL/CentOS:"
                    echo "  sudo yum install -y nodejs"
                    ;;
                jq)
                    echo "  sudo apt-get install -y jq  # Ubuntu/Debian"
                    echo "  sudo yum install -y jq      # RHEL/CentOS"
                    ;;
                bash)
                    echo "  sudo apt-get install -y bash  # Ubuntu/Debian"
                    echo "  sudo yum install -y bash      # RHEL/CentOS"
                    ;;
            esac
        done
    fi

    echo ""
    log_info "或者运行: $0 --install (自动安装)"
}

# ───────────────────────────────────────────────────────────────────────────────
# 主函数
# ───────────────────────────────────────────────────────────────────────────────

main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║   CC-DevFlow Hooks 依赖检查工具                             ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""

    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --install)
                INSTALL_MODE=true
                shift
                ;;
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --help|-h)
                echo "使用方式:"
                echo "  $0                检查依赖"
                echo "  $0 --install      检查并自动安装缺失的依赖"
                echo "  $0 --verbose      显示详细信息"
                echo ""
                echo "必需依赖:"
                echo "  - Node.js >= 18  (运行 TypeScript hooks)"
                echo "  - jq             (JSON 处理)"
                echo "  - bash >= 3.2    (运行 shell hooks)"
                echo ""
                echo "可选依赖:"
                echo "  - TypeScript     (类型检查，非必需)"
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                exit 1
                ;;
        esac
    done

    # 执行检查
    check_node
    check_jq
    check_bash
    check_typescript

    # 总结
    echo ""
    log_section "📊 检查总结"

    if [[ ${#MISSING_DEPS[@]} -eq 0 ]]; then
        log_success "所有必需依赖已安装！Hooks 系统可以正常运行。"
        echo ""
        log_info "下一步: 运行 ./.claude/scripts/validate-hooks.sh 验证 hooks 配置"
        exit 0
    else
        log_error "发现 ${#MISSING_DEPS[@]} 个缺失的依赖: ${MISSING_DEPS[*]}"
        echo ""

        if [[ "$INSTALL_MODE" == "true" ]]; then
            install_dependencies
            echo ""
            log_info "重新检查依赖..."
            exec "$0" --verbose
        else
            show_install_guide
            exit 1
        fi
    fi
}

# ───────────────────────────────────────────────────────────────────────────────
# 入口
# ───────────────────────────────────────────────────────────────────────────────
main "$@"
