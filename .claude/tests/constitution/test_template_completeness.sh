#!/usr/bin/env bash

# test_template_completeness.sh - 测试模板完整性
#
# 验证所有模板是否包含必需的 Constitution Check 部分

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# 加载测试框架
if [[ -f "$REPO_ROOT/.claude/tests/test-framework.sh" ]]; then
    source "$REPO_ROOT/.claude/tests/test-framework.sh"
else
    echo "❌ Test framework not found"
    exit 1
fi

# ============================================================================
# 测试用例
# ============================================================================

test_prd_template_has_constitution_check() {
    local template="$REPO_ROOT/.claude/docs/templates/PRD_TEMPLATE.md"

    assert_file_exists "$template" "PRD_TEMPLATE.md should exist"
    assert_file_contains "$template" "## Constitution Check" "PRD template should have Constitution Check section"
    assert_file_contains "$template" ".claude/constitution/project-constitution.md" "PRD template should reference Constitution file"
}

test_epic_template_has_constitution_check() {
    local template="$REPO_ROOT/.claude/docs/templates/EPIC_TEMPLATE.md"

    assert_file_exists "$template" "EPIC_TEMPLATE.md should exist"
    assert_file_contains "$template" "## Constitution Check" "EPIC template should have Constitution Check section"
    assert_file_contains "$template" ".claude/constitution/project-constitution.md" "EPIC template should reference Constitution file"
}

test_tasks_template_has_constitution_alignment() {
    local template="$REPO_ROOT/.claude/docs/templates/TASKS_TEMPLATE.md"

    assert_file_exists "$template" "TASKS_TEMPLATE.md should exist"
    assert_file_contains "$template" "Constitution Alignment|Constitution Compliance" "TASKS template should have Constitution section"
    assert_file_contains "$template" ".claude/constitution/project-constitution.md" "TASKS template should reference Constitution file"
}

test_prd_template_has_article_references() {
    local template="$REPO_ROOT/.claude/docs/templates/PRD_TEMPLATE.md"

    # PRD 应该引用 Article I, III, X
    assert_file_contains "$template" "Article I" "PRD template should reference Article I (Quality)"
    assert_file_contains "$template" "Article III" "PRD template should reference Article III (Security)"
    assert_file_contains "$template" "Article X" "PRD template should reference Article X (Requirement Boundary)"
}

test_epic_template_has_phase_minus_one_gates() {
    local template="$REPO_ROOT/.claude/docs/templates/EPIC_TEMPLATE.md"

    # EPIC 应该有 Phase -1 Gates
    assert_file_contains "$template" "Phase -1.*Gate|Phase -1.*Constitutional" "EPIC template should have Phase -1 Gates"
    assert_file_contains "$template" "Article VII" "EPIC template should reference Article VII (Simplicity Gate)"
    assert_file_contains "$template" "Article VIII" "EPIC template should reference Article VIII (Anti-Abstraction)"
    assert_file_contains "$template" "Article IX" "EPIC template should reference Article IX (Integration-First)"
}

test_tasks_template_has_tdd_enforcement() {
    local template="$REPO_ROOT/.claude/docs/templates/TASKS_TEMPLATE.md"

    # TASKS 应该强制执行 TDD (Article VI)
    assert_file_contains "$template" "Article VI" "TASKS template should reference Article VI (TDD)"
    assert_file_contains "$template" "Test.*First|TDD" "TASKS template should mention Test-First or TDD"
}

test_epic_template_has_complexity_tracking() {
    local template="$REPO_ROOT/.claude/docs/templates/EPIC_TEMPLATE.md"

    # EPIC 应该有 Complexity Tracking 表格
    assert_file_contains "$template" "Complexity Tracking" "EPIC template should have Complexity Tracking section"
    assert_file_contains "$template" "Constitutional Violations|违规" "EPIC template should have violations table"
}

test_all_templates_reference_current_version() {
    local constitution_version=$(grep -E '^\*\*Version\*\*:|^> \*\*Version\*\*:' "$REPO_ROOT/.claude/constitution/project-constitution.md" | head -1 | sed 's/.*v\([0-9.]*\).*/\1/')

    local templates=(
        "$REPO_ROOT/.claude/docs/templates/PRD_TEMPLATE.md"
        "$REPO_ROOT/.claude/docs/templates/EPIC_TEMPLATE.md"
        "$REPO_ROOT/.claude/docs/templates/TASKS_TEMPLATE.md"
    )

    for template in "${templates[@]}"; do
        if grep -q "Constitution.*v" "$template"; then
            # 使用精确的版本号匹配（v数字.数字.数字）
            local template_version=$(grep -o "Constitution.*v[0-9]\+\.[0-9]\+\.[0-9]\+" "$template" | head -1 | grep -o "v[0-9]\+\.[0-9]\+\.[0-9]\+" | sed 's/v//')
            if [[ -n "$template_version" ]]; then
                assert_equals "$template_version" "$constitution_version" "$(basename "$template") should reference v$constitution_version"
            fi
        fi
    done
}

test_templates_have_validation_checklists() {
    local templates=(
        "$REPO_ROOT/.claude/docs/templates/PRD_TEMPLATE.md"
        "$REPO_ROOT/.claude/docs/templates/EPIC_TEMPLATE.md"
    )

    for template in "${templates[@]}"; do
        # 检查是否有 checklist 格式的 Constitution checks
        if grep -qE "Constitution Check|Constitution Compliance" "$template"; then
            # 检查是否有 Article 相关的 checklist（罗马数字格式: I., II., III. 等）
            local checklist_count=$(grep -cE "^- \[ \] \*\*(I{1,3}|IV|V|VI{0,3}|IX|X)\." "$template" 2>/dev/null || echo "0")
            # 去除可能的空白字符和换行
            checklist_count=$(echo "$checklist_count" | tr -d ' \n\r')
            assert_gt "$checklist_count" "0" "$(basename "$template") should have Article checklist items"
        fi
    done
}

test_no_orphaned_old_templates() {
    # 检查是否有旧版模板文件（如 v2.1.1 的 TASKS_TEMPLATE_OLD.md）
    local templates_dir="$REPO_ROOT/.claude/docs/templates"
    local old_templates=$(find "$templates_dir" -name "*_OLD.md" -o -name "*_old.md" -o -name "*.backup.md" 2>/dev/null || echo "")

    if [[ -n "$old_templates" ]]; then
        log_warning "Found old template files: $old_templates"
        log_warning "Consider cleaning up old templates to avoid version confusion"
        return 1
    fi

    # 如果没有旧模板，测试通过
    return 0
}

# ============================================================================
# 运行测试
# ============================================================================

run_tests \
    test_prd_template_has_constitution_check \
    test_epic_template_has_constitution_check \
    test_tasks_template_has_constitution_alignment \
    test_prd_template_has_article_references \
    test_epic_template_has_phase_minus_one_gates \
    test_tasks_template_has_tdd_enforcement \
    test_epic_template_has_complexity_tracking \
    test_all_templates_reference_current_version \
    test_templates_have_validation_checklists \
    test_no_orphaned_old_templates
