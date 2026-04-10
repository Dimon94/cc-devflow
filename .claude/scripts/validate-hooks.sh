#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# CC-DevFlow Hooks 健康检查脚本
# ═══════════════════════════════════════════════════════════════════════════════
#
# 【核心功能】
# 1. 检查 hooks 文件的执行权限
# 2. 验证数据文件格式的正确性
# 3. 检查依赖组件的存在性
# 4. 清理过期的 session 数据
#
# 【使用方式】
#   ./validate-hooks.sh                  # 完整健康检查
#   ./validate-hooks.sh --check-all      # 同上
#   ./validate-hooks.sh --session <id>   # 检查特定 session
#   ./validate-hooks.sh --cleanup        # 清理过期数据
#   ./validate-hooks.sh --fix            # 自动修复权限问题
#
# 【设计哲学】
# "检查要严格，修复要保守"
# 发现所有问题，但只自动修复确定安全的问题（如权限）
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# ───────────────────────────────────────────────────────────────────────────────
# 颜色定义（用于输出美化）
# ───────────────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ───────────────────────────────────────────────────────────────────────────────
# 工具函数：输出格式化消息
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
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
HOOKS_DIR="$PROJECT_ROOT/.claude/hooks"
SKILLS_DIR="$PROJECT_ROOT/.claude/skills"
TSC_CACHE_DIR="$PROJECT_ROOT/.claude/tsc-cache"
HOOKS_STATE_DIR="$HOOKS_DIR/state"

ERROR_COUNT=0
WARNING_COUNT=0

# ───────────────────────────────────────────────────────────────────────────────
# 检查 1: Hooks 文件执行权限
# ───────────────────────────────────────────────────────────────────────────────
check_hook_permissions() {
    log_section "📋 检查 Hooks 执行权限"

    local hooks=(
        "skill-activation-prompt.sh"
        "pre-tool-use-guardrail.sh"
        "post-tool-use-tracker.sh"
        "error-handling-reminder.sh"
        "ralph-loop.ts"
    )

    for hook in "${hooks[@]}"; do
        local hook_path="$HOOKS_DIR/$hook"

        if [[ ! -f "$hook_path" ]]; then
            log_error "Hook 文件不存在: $hook"
            ((ERROR_COUNT++))
            continue
        fi

        if [[ -x "$hook_path" ]]; then
            log_success "$hook 有执行权限"
        else
            log_error "$hook 缺少执行权限"
            ((ERROR_COUNT++))

            if [[ "$FIX_MODE" == "true" ]]; then
                chmod +x "$hook_path"
                log_success "已自动修复: $hook"
            fi
        fi
    done
}

# ───────────────────────────────────────────────────────────────────────────────
# 检查 2: Hooks 配置（settings.json）
# ───────────────────────────────────────────────────────────────────────────────
check_hooks_config() {
    log_section "⚙️  检查 Hooks 配置"

    local settings_file="$PROJECT_ROOT/.claude/settings.json"

    if [[ ! -f "$settings_file" ]]; then
        log_error "settings.json 不存在"
        ((ERROR_COUNT++))
        return
    fi

    # 检查 JSON 格式
    if ! jq empty "$settings_file" 2>/dev/null; then
        log_error "settings.json 格式无效（不是有效的 JSON）"
        ((ERROR_COUNT++))
        return
    fi

    log_success "settings.json 格式正确"

    # 检查是否有 hooks 配置
    if jq -e '.hooks' "$settings_file" > /dev/null 2>&1; then
        log_success "hooks 配置存在"

        # 检查各个事件类型
        local events=("UserPromptSubmit" "PreToolUse" "PostToolUse" "Stop" "SubagentStop")
        for event in "${events[@]}"; do
            if jq -e ".hooks[\"$event\"]" "$settings_file" > /dev/null 2>&1; then
                local hook_count=$(jq ".hooks[\"$event\"] | length" "$settings_file")
                log_success "$event: $hook_count 个 hook(s) 已配置"
            else
                log_info "$event: 未配置（可选）"
            fi
        done
    else
        log_error "settings.json 缺少 hooks 配置"
        log_info "Hooks 必须在 settings.json 中显式配置才能自动触发"
        log_info "参考: .claude/hooks/CLAUDE.md"
        ((ERROR_COUNT++))
    fi
}

# ───────────────────────────────────────────────────────────────────────────────
# 检查 3: Skill Rules 配置
# ───────────────────────────────────────────────────────────────────────────────
check_skill_rules() {
    log_section "📚 检查 Skill Rules 配置"

    local rules_file="$SKILLS_DIR/skill-rules.json"

    if [[ ! -f "$rules_file" ]]; then
        log_error "skill-rules.json 不存在"
        ((ERROR_COUNT++))
        return
    fi

    # 检查 JSON 格式是否有效
    if ! jq empty "$rules_file" 2>/dev/null; then
        log_error "skill-rules.json 格式无效（不是有效的 JSON）"
        ((ERROR_COUNT++))
        return
    fi

    log_success "skill-rules.json 格式正确"

    # 检查必需的 skills
    local required_skills=("roadmap" "req-plan" "req-do" "req-check" "req-act" "task-order-guard" "artifact-guard")

    for skill in "${required_skills[@]}"; do
        if jq -e ".skills[\"$skill\"]" "$rules_file" > /dev/null 2>&1; then
            log_success "Skill '$skill' 已配置"
        else
            log_warning "Skill '$skill' 未在 skill-rules.json 中找到"
            ((WARNING_COUNT++))
        fi
    done
}

# ───────────────────────────────────────────────────────────────────────────────
# 检查 3: 数据文件格式
# ───────────────────────────────────────────────────────────────────────────────
check_data_files() {
    log_section "📂 检查数据文件格式"

    if [[ ! -d "$TSC_CACHE_DIR" ]]; then
        log_info "TSC cache 目录不存在（正常，首次运行时会创建）"
        return
    fi

    local session_count=0
    local invalid_count=0

    # 遍历所有 session 目录
    for session_dir in "$TSC_CACHE_DIR"/*; do
        if [[ ! -d "$session_dir" ]]; then
            continue
        fi

        ((session_count++))
        local session_id=$(basename "$session_dir")

        # 检查 edited-files.log
        local log_file="$session_dir/edited-files.log"
        if [[ -f "$log_file" ]]; then
            # 验证格式：每行应该有 4 个 tab 分隔的字段
            while IFS= read -r line; do
                local field_count=$(echo "$line" | awk -F'\t' '{print NF}')
                if [[ $field_count -ne 4 ]]; then
                    log_warning "Session $session_id: edited-files.log 格式错误（期望 4 个字段，实际 $field_count）"
                    log_info "  行内容: $line"
                    ((invalid_count++))
                    break
                fi
            done < "$log_file"
        fi
    done

    if [[ $session_count -eq 0 ]]; then
        log_info "未找到任何 session 数据"
    elif [[ $invalid_count -eq 0 ]]; then
        log_success "检查了 $session_count 个 session，数据格式全部正确"
    else
        log_error "发现 $invalid_count 个格式错误"
        ((ERROR_COUNT += invalid_count))
    fi
}

# ───────────────────────────────────────────────────────────────────────────────
# 检查 4: Session 状态文件
# ───────────────────────────────────────────────────────────────────────────────
check_session_state() {
    log_section "🔐 检查 Session 状态文件"

    if [[ ! -d "$HOOKS_STATE_DIR" ]]; then
        log_info "Hooks state 目录不存在，将在首次触发时创建"
        return
    fi

    local state_count=0
    local invalid_count=0

    for state_file in "$HOOKS_STATE_DIR"/skills-used-*.json; do
        if [[ ! -f "$state_file" ]]; then
            continue
        fi

        ((state_count++))
        local filename=$(basename "$state_file")

        # 检查 JSON 格式
        if ! jq empty "$state_file" 2>/dev/null; then
            log_error "$filename 格式无效（不是有效的 JSON）"
            ((invalid_count++))
            ((ERROR_COUNT++))
            continue
        fi

        # 检查是否是字符串数组
        if ! jq -e 'type == "array"' "$state_file" > /dev/null 2>&1; then
            log_error "$filename 格式错误（应该是数组）"
            ((invalid_count++))
            ((ERROR_COUNT++))
            continue
        fi

        log_success "$filename 格式正确"
    done

    if [[ $state_count -eq 0 ]]; then
        log_info "未找到任何 session 状态文件"
    elif [[ $invalid_count -eq 0 ]]; then
        log_success "检查了 $state_count 个状态文件，格式全部正确"
    fi
}

# ───────────────────────────────────────────────────────────────────────────────
# 功能：清理过期 session 数据
# ───────────────────────────────────────────────────────────────────────────────
cleanup_sessions() {
    log_section "🧹 清理过期 Session 数据"

    local cutoff_days=${1:-7}  # 默认清理 7 天前的数据
    local cutoff_seconds=$((cutoff_days * 86400))
    local now=$(date +%s)
    local deleted_count=0

    # 清理 tsc-cache
    if [[ -d "$TSC_CACHE_DIR" ]]; then
        for session_dir in "$TSC_CACHE_DIR"/*; do
            if [[ ! -d "$session_dir" ]]; then
                continue
            fi

            local mtime=$(stat -f %m "$session_dir" 2>/dev/null || stat -c %Y "$session_dir" 2>/dev/null)
            local age=$((now - mtime))

            if [[ $age -gt $cutoff_seconds ]]; then
                local session_id=$(basename "$session_dir")
                log_info "删除过期 session: $session_id (${age}秒前)"
                rm -rf "$session_dir"
                ((deleted_count++))
            fi
        done
    fi

    # 清理 hooks state
    if [[ -d "$HOOKS_STATE_DIR" ]]; then
        for state_file in "$HOOKS_STATE_DIR"/skills-used-*.json; do
            if [[ ! -f "$state_file" ]]; then
                continue
            fi

            local mtime=$(stat -f %m "$state_file" 2>/dev/null || stat -c %Y "$state_file" 2>/dev/null)
            local age=$((now - mtime))

            if [[ $age -gt $cutoff_seconds ]]; then
                local filename=$(basename "$state_file")
                log_info "删除过期状态: $filename (${age}秒前)"
                rm -f "$state_file"
                ((deleted_count++))
            fi
        done
    fi

    if [[ $deleted_count -eq 0 ]]; then
        log_success "无需清理（所有数据都在 $cutoff_days 天内）"
    else
        log_success "已清理 $deleted_count 个过期文件/目录"
    fi
}

# ───────────────────────────────────────────────────────────────────────────────
# 功能：检查特定 session
# ───────────────────────────────────────────────────────────────────────────────
check_specific_session() {
    local session_id="$1"

    log_section "🔍 检查 Session: $session_id"

    local session_dir="$TSC_CACHE_DIR/$session_id"

    if [[ ! -d "$session_dir" ]]; then
        log_error "Session 目录不存在: $session_id"
        return 1
    fi

    # 检查 edited-files.log
    if [[ -f "$session_dir/edited-files.log" ]]; then
        local line_count=$(wc -l < "$session_dir/edited-files.log")
        log_success "edited-files.log: $line_count 条记录"
    else
        log_warning "edited-files.log 不存在"
    fi

    # 检查 affected-repos.txt
    if [[ -f "$session_dir/affected-repos.txt" ]]; then
        local repo_count=$(wc -l < "$session_dir/affected-repos.txt")
        log_success "affected-repos.txt: $repo_count 个仓库"
        echo "  受影响的仓库:"
        while IFS= read -r repo; do
            echo "    - $repo"
        done < "$session_dir/affected-repos.txt"
    else
        log_warning "affected-repos.txt 不存在"
    fi

    # 检查 session 状态
    local state_file="$HOOKS_STATE_DIR/skills-used-$session_id.json"
    if [[ -f "$state_file" ]]; then
        local skills=$(jq -r '.[]' "$state_file" | paste -sd ',' -)
        log_success "已触发的 skills: $skills"
    else
        log_info "无 skill 状态记录"
    fi
}

# ───────────────────────────────────────────────────────────────────────────────
# 主函数
# ───────────────────────────────────────────────────────────────────────────────
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║   CC-DevFlow Hooks 健康检查工具                             ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""

    # 解析参数
    local mode="check-all"
    local session_id=""
    FIX_MODE="false"

    while [[ $# -gt 0 ]]; do
        case $1 in
            --check-all)
                mode="check-all"
                shift
                ;;
            --session)
                mode="check-session"
                session_id="$2"
                shift 2
                ;;
            --cleanup)
                mode="cleanup"
                shift
                ;;
            --fix)
                FIX_MODE="true"
                shift
                ;;
            --help)
                echo "使用方式:"
                echo "  $0                    完整健康检查"
                echo "  $0 --check-all        同上"
                echo "  $0 --session <id>     检查特定 session"
                echo "  $0 --cleanup          清理过期数据（默认 7 天）"
                echo "  $0 --fix              自动修复权限问题"
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                exit 1
                ;;
        esac
    done

    # 执行对应模式
    case $mode in
        check-all)
            check_hook_permissions
            check_hooks_config
            check_skill_rules
            check_data_files
            check_session_state
            ;;
        check-session)
            if [[ -z "$session_id" ]]; then
                log_error "请提供 session ID: --session <id>"
                exit 1
            fi
            check_specific_session "$session_id"
            ;;
        cleanup)
            cleanup_sessions 7
            ;;
    esac

    # 总结
    echo ""
    log_section "📊 检查总结"

    if [[ $ERROR_COUNT -eq 0 ]] && [[ $WARNING_COUNT -eq 0 ]]; then
        log_success "所有检查通过！Hooks 系统运行正常。"
        exit 0
    elif [[ $ERROR_COUNT -eq 0 ]]; then
        log_warning "发现 $WARNING_COUNT 个警告"
        echo ""
        log_info "警告不会影响系统运行，但建议关注"
        exit 0
    else
        log_error "发现 $ERROR_COUNT 个错误，$WARNING_COUNT 个警告"
        echo ""
        if [[ "$FIX_MODE" != "true" ]]; then
            log_info "提示: 使用 --fix 参数自动修复权限问题"
        fi
        exit 1
    fi
}

# ───────────────────────────────────────────────────────────────────────────────
# 入口
# ───────────────────────────────────────────────────────────────────────────────
main "$@"
