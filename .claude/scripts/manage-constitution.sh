#!/usr/bin/env bash

# manage-constitution.sh - Constitution 管理后端脚本
#
# 功能:
# - 查看 Constitution 和特定 Article
# - 提议和应用 Amendment
# - 自动传播版本变更到所有文件
# - 验证版本一致性
# - 显示版本历史
#
# 用法:
#   bash manage-constitution.sh show [ARTICLE]
#   bash manage-constitution.sh amend PROPOSAL_FILE
#   bash manage-constitution.sh apply VERSION_TYPE
#   bash manage-constitution.sh verify
#   bash manage-constitution.sh impact
#   bash manage-constitution.sh history

set -euo pipefail

# ============================================================================
# 配置和常量
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONSTITUTION_FILE="$REPO_ROOT/.claude/constitution/project-constitution.md"
AMENDMENT_DIR="$REPO_ROOT/.claude/constitution/amendments"

# 需要更新版本号的文件模式
declare -a FILES_TO_UPDATE=(
    "$REPO_ROOT/.claude/docs/templates/*.md"
    "$REPO_ROOT/.claude/agents/*.md"
    "$REPO_ROOT/.claude/scripts/validate-constitution.sh"
    "$REPO_ROOT/.claude/scripts/validate-scope-boundary.sh"
    "$REPO_ROOT/.claude/hooks/pre-push-guard.sh"
    "$REPO_ROOT/CLAUDE.md"
)

# 颜色代码
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================================================
# 辅助函数
# ============================================================================

log_info() {
    echo -e "${BLUE}ℹ${NC} $*"
}

log_success() {
    echo -e "${GREEN}✅${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}⚠️${NC} $*"
}

log_error() {
    echo -e "${RED}❌${NC} $*" >&2
}

# 获取当前 Constitution 版本
get_current_version() {
    if [[ ! -f "$CONSTITUTION_FILE" ]]; then
        log_error "Constitution file not found: $CONSTITUTION_FILE"
        exit 1
    fi

    # 从 Constitution 文件提取版本号 (格式: **Version**: v2.0.0)
    local version=$(grep -E '^\*\*Version\*\*:|^> \*\*Version\*\*:' "$CONSTITUTION_FILE" | head -1 | sed 's/.*v\([0-9.]*\).*/\1/')

    if [[ -z "$version" ]]; then
        log_error "Could not extract version from Constitution file"
        exit 1
    fi

    echo "$version"
}

# 版本号增量 (MAJOR.MINOR.PATCH)
bump_version() {
    local current="$1"
    local type="$2"

    # 分解版本号
    local major minor patch
    IFS='.' read -r major minor patch <<< "$current"

    case "$type" in
        MAJOR)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        MINOR)
            minor=$((minor + 1))
            patch=0
            ;;
        PATCH)
            patch=$((patch + 1))
            ;;
        *)
            log_error "Invalid version type: $type (must be MAJOR, MINOR, or PATCH)"
            exit 1
            ;;
    esac

    echo "$major.$minor.$patch"
}

# 提取特定 Article
extract_article() {
    local article_num="$1"

    if [[ ! -f "$CONSTITUTION_FILE" ]]; then
        log_error "Constitution file not found"
        exit 1
    fi

    # 使用 sed 提取指定 Article (从 "## Article X:" 到下一个 "## " 或 "## Article")
    sed -n "/^## Article $article_num:/,/^## \(Article\|[^A]\)/p" "$CONSTITUTION_FILE" | sed '$d'
}

# ============================================================================
# 核心功能
# ============================================================================

# 显示 Constitution 或特定 Article
show_constitution() {
    local article="${1:-}"

    if [[ -z "$article" ]]; then
        # 显示完整 Constitution
        echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
        echo -e "${CYAN}  CC-DevFlow Project Constitution v$(get_current_version)${NC}"
        echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
        echo ""
        cat "$CONSTITUTION_FILE"
    else
        # 显示特定 Article
        echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
        echo -e "${CYAN}  Article $article - Constitution v$(get_current_version)${NC}"
        echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
        echo ""

        local content=$(extract_article "$article")
        if [[ -z "$content" ]]; then
            log_error "Article $article not found"
            exit 1
        fi

        echo "$content"
    fi
}

# 提议 Amendment
propose_amendment() {
    local proposal_file="$1"

    log_info "Analyzing amendment proposal..."

    # 检查提案文件是否存在
    if [[ ! -f "$proposal_file" ]]; then
        log_error "Proposal file not found: $proposal_file"
        exit 1
    fi

    # 读取提案内容
    log_info "Reading proposal: $proposal_file"
    echo ""
    cat "$proposal_file"
    echo ""

    # 提取版本类型
    local version_type=$(grep -i "Proposed Version" "$proposal_file" | sed 's/.* (\(.*\)).*/\1/' | tr '[:lower:]' '[:upper:]')

    if [[ -z "$version_type" ]] || [[ ! "$version_type" =~ ^(MAJOR|MINOR|PATCH)$ ]]; then
        log_error "Invalid or missing version type in proposal (must be MAJOR, MINOR, or PATCH)"
        exit 1
    fi

    local current_version=$(get_current_version)
    local new_version=$(bump_version "$current_version" "$version_type")

    log_info "Version change: v$current_version → v$new_version ($version_type)"

    # 影响分析
    log_info "Running impact analysis..."
    echo ""
    echo "Files to be updated:"
    for pattern in "${FILES_TO_UPDATE[@]}"; do
        for file in $pattern; do
            if [[ -f "$file" ]]; then
                echo "  - ${file#$REPO_ROOT/}"
            fi
        done
    done
    echo ""

    # 用户确认
    read -p "$(echo -e ${YELLOW}Apply this amendment? [y/N]:${NC} )" -r confirm

    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        log_warning "Amendment cancelled"
        exit 0
    fi

    log_success "Amendment proposal accepted. Use 'apply $version_type' to execute."
}

# 应用 Amendment
apply_amendment() {
    local version_type="$1"

    # 验证版本类型
    if [[ ! "$version_type" =~ ^(MAJOR|MINOR|PATCH)$ ]]; then
        log_error "Invalid version type: $version_type (must be MAJOR, MINOR, or PATCH)"
        exit 1
    fi

    local current_version=$(get_current_version)
    local new_version=$(bump_version "$current_version" "$version_type")

    log_info "Starting amendment application..."
    log_info "Version: v$current_version → v$new_version ($version_type)"

    # 1. 更新 Constitution 文件的版本号
    log_info "Updating Constitution version..."
    update_constitution_version "$current_version" "$new_version"

    # 2. 传播变更到所有文件
    log_info "Propagating changes to all files..."
    propagate_constitution_changes "$current_version" "$new_version"

    # 3. 生成同步报告
    log_info "Generating sync report..."
    generate_sync_report "$current_version" "$new_version"

    # 4. 提示创建 Git commit
    log_success "Amendment v$new_version applied successfully!"
    echo ""
    log_info "Next steps:"
    echo "  1. Review changes: git diff"
    echo "  2. Create commit: git add . && git commit -m 'feat(constitution): Amendment v$new_version'"
    echo "  3. Verify consistency: bash $0 verify"
}

# 更新 Constitution 文件的版本号
update_constitution_version() {
    local old_version="$1"
    local new_version="$2"
    local current_date=$(date -u +"%Y-%m-%d")

    # 更新版本号行
    sed -i.bak "s/\*\*Version\*\*: v$old_version/\*\*Version\*\*: v$new_version/g" "$CONSTITUTION_FILE"

    # 更新最后修订日期
    sed -i.bak "s/\*\*Last Amended\*\*: .*/\*\*Last Amended\*\*: $current_date/g" "$CONSTITUTION_FILE"

    # 清理备份文件
    rm -f "$CONSTITUTION_FILE.bak"

    log_success "Constitution version updated: v$old_version → v$new_version"
}

# 传播 Constitution 变更到所有文件
propagate_constitution_changes() {
    local old_version="$1"
    local new_version="$2"
    local updated_count=0

    for pattern in "${FILES_TO_UPDATE[@]}"; do
        for file in $pattern; do
            if [[ -f "$file" ]]; then
                # 替换所有 "Constitution v2.0.0" 或 "Constitution.*v2.0.0" 为新版本
                # 支持多种格式:
                # - "Constitution v2.0.0"
                # - "Constitution: v2.0.0"
                # - "Constitution (v2.0.0)"
                # - "project-constitution.md v2.0.0"
                # - "project-constitution.md (v2.0.0)"

                if grep -q "Constitution.*v$old_version\|project-constitution.md.*v$old_version" "$file"; then
                    sed -i.bak "s/Constitution\(.*\)v$old_version/Constitution\1v$new_version/g" "$file"
                    sed -i.bak "s/project-constitution.md\(.*\)v$old_version/project-constitution.md\1v$new_version/g" "$file"
                    rm -f "$file.bak"

                    echo "  ✅ ${file#$REPO_ROOT/}"
                    ((updated_count++))
                fi
            fi
        done
    done

    log_success "Updated $updated_count files"
}

# 生成同步报告
generate_sync_report() {
    local old_version="$1"
    local new_version="$2"
    local report_file="$AMENDMENT_DIR/sync-report-v$new_version.md"
    local current_date=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

    # 创建 amendments 目录（如果不存在）
    mkdir -p "$AMENDMENT_DIR"

    cat > "$report_file" << EOF
# Constitution Amendment Sync Report

**Amendment Version**: v$old_version → v$new_version
**Date**: $current_date
**Status**: Applied

---

## Files Updated (Auto-sync)

EOF

    # 列出所有更新的文件
    for pattern in "${FILES_TO_UPDATE[@]}"; do
        for file in $pattern; do
            if [[ -f "$file" ]] && grep -q "Constitution.*v$new_version\|project-constitution.md.*v$new_version" "$file"; then
                echo "- ✅ \`${file#$REPO_ROOT/}\`" >> "$report_file"
            fi
        done
    done

    cat >> "$report_file" << EOF

---

## Verification

Run the following command to verify consistency:

\`\`\`bash
bash .claude/scripts/manage-constitution.sh verify
\`\`\`

## Next Steps

1. **Review Changes**: \`git diff\`
2. **Run Tests**: \`bash .claude/tests/constitution/run_all_constitution_tests.sh\`
3. **Create Commit**:
   \`\`\`bash
   git add .
   git commit -m "feat(constitution): Amendment v$new_version

   - Updated Constitution to v$new_version
   - Propagated changes to all templates, agents, and scripts
   - Generated sync report

   🤖 Generated with Claude Code

   Co-Authored-By: Claude <noreply@anthropic.com>"
   \`\`\`

---

*Report generated by manage-constitution.sh*
EOF

    log_success "Sync report generated: ${report_file#$REPO_ROOT/}"

    # 显示报告内容
    echo ""
    cat "$report_file"
}

# 验证版本一致性
verify_consistency() {
    log_info "Verifying Constitution consistency..."
    echo ""

    local constitution_version=$(get_current_version)
    local inconsistent_files=()
    local total_files=0
    local consistent_files=0

    echo "Constitution Version: v$constitution_version"
    echo ""
    echo "Checking files..."
    echo ""

    for pattern in "${FILES_TO_UPDATE[@]}"; do
        for file in $pattern; do
            if [[ -f "$file" ]]; then
                ((total_files++))

                # 检查文件是否包含 Constitution 版本引用
                if grep -q "Constitution\|project-constitution.md" "$file"; then
                    # 提取文件中的版本号
                    local file_version=$(grep -o "Constitution.*v[0-9.]*\|project-constitution.md.*v[0-9.]*" "$file" | head -1 | grep -o "v[0-9.]*" | sed 's/v//')

                    if [[ -n "$file_version" ]]; then
                        if [[ "$file_version" == "$constitution_version" ]]; then
                            echo "  ✅ ${file#$REPO_ROOT/} (v$file_version)"
                            ((consistent_files++))
                        else
                            echo "  ❌ ${file#$REPO_ROOT/} (v$file_version, expected v$constitution_version)"
                            inconsistent_files+=("${file#$REPO_ROOT/}: v$file_version (expected v$constitution_version)")
                        fi
                    fi
                fi
            fi
        done
    done

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Summary:"
    echo "  Total files checked: $total_files"
    echo "  Consistent files: $consistent_files"
    echo "  Inconsistent files: ${#inconsistent_files[@]}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    if [[ ${#inconsistent_files[@]} -eq 0 ]]; then
        log_success "All files consistent with Constitution v$constitution_version"
        return 0
    else
        log_error "Inconsistent version references found:"
        printf '%s\n' "${inconsistent_files[@]}" | sed 's/^/  /'
        echo ""
        log_info "Fix: Run 'bash $0 apply PATCH' to sync all files"
        exit 1
    fi
}

# 生成影响报告
generate_impact_report() {
    log_info "Generating Constitution impact report..."
    echo ""

    local current_version=$(get_current_version)
    local current_date=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Constitution Impact Report"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Current Version: v$current_version"
    echo "Generated: $current_date"
    echo ""

    # Article 引用统计
    echo "Article References:"
    echo ""

    for article in I II III IV V VI VII VIII IX X; do
        local count=0
        local files=()

        for pattern in "${FILES_TO_UPDATE[@]}"; do
            for file in $pattern; do
                if [[ -f "$file" ]] && grep -q "Article $article" "$file"; then
                    ((count++))
                    files+=("${file#$REPO_ROOT/}")
                fi
            done
        done

        echo "  Article $article: $count enforcement points"
        if [[ $count -gt 0 ]]; then
            for f in "${files[@]}"; do
                echo "    - $f"
            done
        fi
        echo ""
    done

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 显示版本历史
show_version_history() {
    log_info "Constitution Version History"
    echo ""

    if [[ ! -f "$CONSTITUTION_FILE" ]]; then
        log_error "Constitution file not found"
        exit 1
    fi

    # 提取 Version History 部分
    sed -n '/^## Version History/,/^##[^#]/p' "$CONSTITUTION_FILE" | sed '$d'

    # 如果没有 Version History 部分，显示当前版本
    if ! grep -q "^## Version History" "$CONSTITUTION_FILE"; then
        echo "Current Version: v$(get_current_version)"
        echo ""
        echo "No version history available yet."
        echo "Version history will be maintained in the Constitution file."
    fi
}

# ============================================================================
# 主函数
# ============================================================================

main() {
    local action="${1:-}"

    case "$action" in
        show)
            show_constitution "${2:-}"
            ;;
        amend)
            if [[ -z "${2:-}" ]]; then
                log_error "Missing proposal file argument"
                echo "Usage: $0 amend PROPOSAL_FILE"
                exit 1
            fi
            propose_amendment "$2"
            ;;
        apply)
            if [[ -z "${2:-}" ]]; then
                log_error "Missing version type argument"
                echo "Usage: $0 apply [MAJOR|MINOR|PATCH]"
                exit 1
            fi
            apply_amendment "${2^^}"  # 转为大写
            ;;
        verify)
            verify_consistency
            ;;
        impact)
            generate_impact_report
            ;;
        history)
            show_version_history
            ;;
        ""|--help|-h)
            cat << 'EOF'
Constitution Management Script

USAGE:
    manage-constitution.sh COMMAND [OPTIONS]

COMMANDS:
    show [ARTICLE]          显示完整 Constitution 或特定 Article
                            例: show I (显示 Article I)

    amend PROPOSAL_FILE     提议 Amendment
                            例: amend amendments/add-article-xi.md

    apply VERSION_TYPE      应用 Amendment 并传播变更
                            VERSION_TYPE: MAJOR, MINOR, PATCH
                            例: apply MINOR

    verify                  验证所有文件的版本一致性

    impact                  生成影响报告 (Article 引用统计)

    history                 显示版本历史

    --help, -h              显示此帮助信息

EXAMPLES:
    # 查看 Constitution
    bash manage-constitution.sh show

    # 查看 Article I
    bash manage-constitution.sh show I

    # 提议修正案
    bash manage-constitution.sh amend amendments/add-observability.md

    # 应用 MINOR 版本修正案 (v2.0.0 → v2.1.0)
    bash manage-constitution.sh apply MINOR

    # 验证一致性
    bash manage-constitution.sh verify

    # 生成影响报告
    bash manage-constitution.sh impact

    # 查看版本历史
    bash manage-constitution.sh history

EOF
            ;;
        *)
            log_error "Unknown command: $action"
            echo "Use '$0 --help' for usage information"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
