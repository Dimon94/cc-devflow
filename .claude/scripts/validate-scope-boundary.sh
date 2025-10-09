#!/usr/bin/env bash
# ============================================================================
# validate-scope-boundary.sh - 验证需求文档的边界合规性 (需求不扩散检查)
# ============================================================================
#
# 用途: 检查 PRD, EPIC, TASKS 文档是否遵循需求不扩散原则
#
# 使用:
#   ./validate-scope-boundary.sh REQ-123
#   ./validate-scope-boundary.sh REQ-123 --strict  # 严格模式 (失败则退出)
#   ./validate-scope-boundary.sh --all             # 验证所有需求
#
# 检查项:
#   1. PRD 需求不扩散验证
#      - [NEEDS CLARIFICATION] 标记是否已解决
#      - 用户故事是否有优先级 (P1, P2, P3)
#      - 用户故事是否有 Independent Test 标准
#      - 是否包含技术实现细节 (API, database, framework)
#
#   2. EPIC Phase -1 闸门验证
#      - Simplicity Gate 是否执行
#      - Anti-Abstraction Gate 是否执行
#      - Integration-First Gate 是否执行
#      - Complexity Tracking 表格是否填写 (如有违规)
#
#   3. TASKS 用户故事组织验证
#      - 任务是否按用户故事组织 (Phase 3+)
#      - 任务是否有 [US#] 标签
#      - 是否有 Foundational Phase
#      - 是否有 Checkpoint 验证点
#
# 输出:
#   - 通过: 退出码 0
#   - 失败: 退出码 1
#   - 警告: 退出码 2
# ============================================================================

set -euo pipefail

# ================================================================
# 颜色定义
# ================================================================
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# ================================================================
# 全局变量
# ================================================================
STRICT_MODE=false
VALIDATE_ALL=false
ERRORS=0
WARNINGS=0
REPO_ROOT=""
REQ_ID=""

# ================================================================
# 辅助函数
# ================================================================

print_error() {
    echo -e "${RED}✗ ERROR${NC}: $*" >&2
    ((ERRORS++))
}

print_warning() {
    echo -e "${YELLOW}⚠ WARNING${NC}: $*"
    ((WARNINGS++))
}

print_success() {
    echo -e "${GREEN}✓ PASS${NC}: $*"
}

print_info() {
    echo -e "${BLUE}ℹ INFO${NC}: $*"
}

get_repo_root() {
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        git rev-parse --show-toplevel
    else
        pwd
    fi
}

# ================================================================
# PRD 验证函数
# ================================================================

validate_prd_anti_expansion() {
    local prd_file="$1"
    local req_id="$2"

    print_info "验证 PRD 需求不扩散: $req_id"

    if [[ ! -f "$prd_file" ]]; then
        print_error "PRD 文件不存在: $prd_file"
        return 1
    fi

    local prd_content
    prd_content=$(cat "$prd_file")

    # 检查1: 未解决的 [NEEDS CLARIFICATION] 标记
    local clarifications
    clarifications=$(echo "$prd_content" | grep -c "\[NEEDS CLARIFICATION" || true)

    if [[ $clarifications -gt 0 ]]; then
        print_warning "PRD 包含 $clarifications 个未解决的 [NEEDS CLARIFICATION] 标记"
        echo "$prd_content" | grep -n "\[NEEDS CLARIFICATION" | head -5
    else
        print_success "PRD 无未解决的澄清标记"
    fi

    # 检查2: 用户故事优先级
    local stories_without_priority
    stories_without_priority=$(echo "$prd_content" | \
        grep "^### Story" | \
        grep -v "Priority: P[0-9]" | \
        wc -l | tr -d ' ')

    if [[ $stories_without_priority -gt 0 ]]; then
        print_error "PRD 有 $stories_without_priority 个用户故事缺少优先级标记"
    else
        print_success "PRD 所有用户故事都有优先级"
    fi

    # 检查3: Independent Test 标准
    local stories_without_independent_test
    stories_without_independent_test=$(echo "$prd_content" | \
        grep "^### Story" -A 10 | \
        grep -c "^### Story" || true)

    local independent_test_count
    independent_test_count=$(echo "$prd_content" | \
        grep -c "\*\*Independent Test\*\*" || true)

    if [[ $independent_test_count -lt $stories_without_independent_test ]]; then
        print_error "PRD 有用户故事缺少 Independent Test 标准"
    else
        print_success "PRD 所有用户故事都有 Independent Test 标准"
    fi

    # 检查4: 技术实现细节 (不应出现在 PRD)
    local tech_keywords=("API endpoint" "database schema" "REST API" "GraphQL" "PostgreSQL" "MongoDB" "React component" "Vue component")
    local found_tech_details=false

    for keyword in "${tech_keywords[@]}"; do
        if echo "$prd_content" | grep -iq "$keyword"; then
            print_warning "PRD 包含技术实现细节: '$keyword' (应该只描述 WHAT 和 WHY，不是 HOW)"
            found_tech_details=true
        fi
    done

    if [[ "$found_tech_details" == "false" ]]; then
        print_success "PRD 未包含技术实现细节"
    fi

    # 检查5: 需求不扩散验证清单
    if echo "$prd_content" | grep -q "### 需求不扩散验证"; then
        print_success "PRD 包含需求不扩散验证清单"
    else
        print_warning "PRD 缺少需求不扩散验证清单"
    fi
}

# ================================================================
# EPIC 验证函数
# ================================================================

validate_epic_phase_minus_one() {
    local epic_file="$1"
    local req_id="$2"

    print_info "验证 EPIC Phase -1 闸门: $req_id"

    if [[ ! -f "$epic_file" ]]; then
        print_error "EPIC 文件不存在: $epic_file"
        return 1
    fi

    local epic_content
    epic_content=$(cat "$epic_file")

    # 检查1: Phase -1 章节是否存在
    if echo "$epic_content" | grep -q "## Phase -1.*Pre-Implementation Gates"; then
        print_success "EPIC 包含 Phase -1 宪法闸门章节"
    else
        print_error "EPIC 缺少 Phase -1 宪法闸门章节"
        return 1
    fi

    # 检查2: Simplicity Gate
    if echo "$epic_content" | grep -q "### Simplicity Gate"; then
        print_success "EPIC 包含 Simplicity Gate"

        # 检查项目数量限制
        if echo "$epic_content" | grep -q "≤3 个项目"; then
            print_success "Simplicity Gate: 检查项目数量限制"
        else
            print_warning "Simplicity Gate: 缺少项目数量限制检查"
        fi

        # 检查 NO FUTURE-PROOFING
        if echo "$epic_content" | grep -q "NO FUTURE-PROOFING"; then
            print_success "Simplicity Gate: 检查未来优化预留"
        else
            print_warning "Simplicity Gate: 缺少未来优化检查"
        fi
    else
        print_error "EPIC 缺少 Simplicity Gate"
    fi

    # 检查3: Anti-Abstraction Gate
    if echo "$epic_content" | grep -q "### Anti-Abstraction Gate"; then
        print_success "EPIC 包含 Anti-Abstraction Gate"

        # 检查 Framework Trust
        if echo "$epic_content" | grep -q "Framework Trust"; then
            print_success "Anti-Abstraction Gate: 检查框架直接使用"
        else
            print_warning "Anti-Abstraction Gate: 缺少框架使用检查"
        fi
    else
        print_error "EPIC 缺少 Anti-Abstraction Gate"
    fi

    # 检查4: Integration-First Gate
    if echo "$epic_content" | grep -q "### Integration-First Gate"; then
        print_success "EPIC 包含 Integration-First Gate"

        # 检查 Contracts Defined First
        if echo "$epic_content" | grep -q "Contracts Defined First"; then
            print_success "Integration-First Gate: 检查契约优先定义"
        else
            print_warning "Integration-First Gate: 缺少契约定义检查"
        fi
    else
        print_error "EPIC 缺少 Integration-First Gate"
    fi

    # 检查5: Complexity Tracking 表格
    if echo "$epic_content" | grep -q "### Complexity Tracking"; then
        print_success "EPIC 包含 Complexity Tracking 表格"

        # 检查是否有违规记录
        local violations
        violations=$(echo "$epic_content" | \
            sed -n '/### Complexity Tracking/,/^---/p' | \
            grep "^|" | \
            grep -v "违规项" | \
            grep -v "^| --" | \
            wc -l | tr -d ' ')

        if [[ $violations -gt 1 ]]; then
            print_warning "EPIC 记录了 $((violations - 1)) 个宪法违规项"
        fi
    else
        print_warning "EPIC 缺少 Complexity Tracking 表格"
    fi
}

# ================================================================
# TASKS 验证函数
# ================================================================

validate_tasks_story_organization() {
    local tasks_file="$1"
    local req_id="$2"

    print_info "验证 TASKS 用户故事组织: $req_id"

    if [[ ! -f "$tasks_file" ]]; then
        print_error "TASKS 文件不存在: $tasks_file"
        return 1
    fi

    local tasks_content
    tasks_content=$(cat "$tasks_file")

    # 检查1: Foundational Phase 是否存在
    if echo "$tasks_content" | grep -q "## Phase 2.*Foundational"; then
        print_success "TASKS 包含 Foundational Phase (阻塞性前置条件)"
    else
        print_error "TASKS 缺少 Foundational Phase"
    fi

    # 检查2: 用户故事阶段 (Phase 3+)
    local user_story_phases
    user_story_phases=$(echo "$tasks_content" | \
        grep "^## Phase [3-9].*User Story" | \
        wc -l | tr -d ' ')

    if [[ $user_story_phases -gt 0 ]]; then
        print_success "TASKS 包含 $user_story_phases 个用户故事阶段"
    else
        print_error "TASKS 缺少用户故事组织结构 (应该从 Phase 3 开始)"
    fi

    # 检查3: [US#] 标签
    local tasks_with_us_label
    tasks_with_us_label=$(echo "$tasks_content" | \
        grep "^\- \[ \].*\[US[0-9]\]" | \
        wc -l | tr -d ' ')

    if [[ $tasks_with_us_label -gt 0 ]]; then
        print_success "TASKS 包含 $tasks_with_us_label 个带 [US#] 标签的任务"
    else
        print_warning "TASKS 缺少 [US#] 标签 (建议所有任务都标记所属用户故事)"
    fi

    # 检查4: Independent Test 标准
    local independent_test_count
    independent_test_count=$(echo "$tasks_content" | \
        grep -c "\*\*Independent Test\*\*" || true)

    if [[ $independent_test_count -ge $user_story_phases ]]; then
        print_success "TASKS 每个用户故事都有 Independent Test 标准"
    else
        print_warning "TASKS 有用户故事缺少 Independent Test 标准"
    fi

    # 检查5: Checkpoint 验证点
    local checkpoint_count
    checkpoint_count=$(echo "$tasks_content" | \
        grep -c "\*\*Checkpoint\*\*" || true)

    if [[ $checkpoint_count -ge $user_story_phases ]]; then
        print_success "TASKS 每个用户故事都有 Checkpoint 验证点"
    else
        print_warning "TASKS 有用户故事缺少 Checkpoint 验证点"
    fi

    # 检查6: Implementation Strategy
    if echo "$tasks_content" | grep -q "## Implementation Strategy"; then
        print_success "TASKS 包含 Implementation Strategy (MVP First, Incremental Delivery)"
    else
        print_warning "TASKS 缺少 Implementation Strategy 章节"
    fi
}

# ================================================================
# 主验证函数
# ================================================================

validate_requirement() {
    local req_id="$1"
    local req_dir="$REPO_ROOT/devflow/requirements/$req_id"

    echo ""
    echo "========================================================================"
    echo "验证需求: $req_id"
    echo "========================================================================"

    if [[ ! -d "$req_dir" ]]; then
        print_error "需求目录不存在: $req_dir"
        return 1
    fi

    local local_errors=0
    local local_warnings=0

    # 验证 PRD
    if [[ -f "$req_dir/PRD.md" ]]; then
        validate_prd_anti_expansion "$req_dir/PRD.md" "$req_id" || ((local_errors++))
    else
        print_warning "PRD.md 不存在，跳过 PRD 验证"
    fi

    echo ""

    # 验证 EPIC
    if [[ -f "$req_dir/EPIC.md" ]]; then
        validate_epic_phase_minus_one "$req_dir/EPIC.md" "$req_id" || ((local_errors++))
    else
        print_warning "EPIC.md 不存在，跳过 EPIC 验证"
    fi

    echo ""

    # 验证 TASKS
    if [[ -f "$req_dir/TASKS.md" ]]; then
        validate_tasks_story_organization "$req_dir/TASKS.md" "$req_id" || ((local_errors++))
    else
        print_warning "TASKS.md 不存在，跳过 TASKS 验证"
    fi

    echo ""
    echo "------------------------------------------------------------------------"
    echo "验证结果: $req_id"
    echo "------------------------------------------------------------------------"

    if [[ $local_errors -eq 0 && $WARNINGS -eq 0 ]]; then
        print_success "需求 $req_id 完全符合需求不扩散原则"
    elif [[ $local_errors -eq 0 ]]; then
        print_warning "需求 $req_id 有 $WARNINGS 个警告，但总体符合需求不扩散原则"
    else
        print_error "需求 $req_id 有 $local_errors 个错误，不符合需求不扩散原则"
    fi

    return $local_errors
}

# ================================================================
# 主函数
# ================================================================

main() {
    REPO_ROOT=$(get_repo_root)

    # 解析参数
    if [[ $# -eq 0 ]]; then
        echo "用法: $0 <REQ-ID> [--strict]"
        echo "      $0 --all [--strict]"
        echo ""
        echo "示例:"
        echo "  $0 REQ-123"
        echo "  $0 REQ-123 --strict"
        echo "  $0 --all"
        exit 1
    fi

    # 检查参数
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --strict)
                STRICT_MODE=true
                shift
                ;;
            --all)
                VALIDATE_ALL=true
                shift
                ;;
            REQ-*)
                REQ_ID="$1"
                shift
                ;;
            *)
                echo "未知参数: $1"
                exit 1
                ;;
        esac
    done

    # 执行验证
    if [[ "$VALIDATE_ALL" == "true" ]]; then
        print_info "验证所有需求文档..."

        local req_dirs
        req_dirs=$(find "$REPO_ROOT/devflow/requirements" -maxdepth 1 -type d -name "REQ-*" 2>/dev/null || true)

        if [[ -z "$req_dirs" ]]; then
            print_warning "未找到任何需求目录"
            exit 0
        fi

        for req_dir in $req_dirs; do
            local req_id
            req_id=$(basename "$req_dir")
            validate_requirement "$req_id" || true
        done
    else
        validate_requirement "$REQ_ID"
    fi

    # 输出总结
    echo ""
    echo "========================================================================"
    echo "验证总结"
    echo "========================================================================"
    echo "错误: $ERRORS"
    echo "警告: $WARNINGS"

    if [[ $ERRORS -eq 0 && $WARNINGS -eq 0 ]]; then
        print_success "所有检查通过 ✓"
        exit 0
    elif [[ $ERRORS -eq 0 ]]; then
        print_warning "有 $WARNINGS 个警告，但整体符合要求"
        exit 0
    else
        print_error "有 $ERRORS 个错误，不符合需求不扩散原则"
        if [[ "$STRICT_MODE" == "true" ]]; then
            exit 1
        else
            exit 2
        fi
    fi
}

main "$@"
