#!/usr/bin/env bash

# test_article_coverage.sh - 测试 Article 覆盖率
#
# 验证每个 Article 是否都有执行点（enforcement points）

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

test_article_I_has_enforcement_points() {
    # Article I: Quality First
    # 应该在 PRD, EPIC, TASKS 模板和 prd-writer, qa-tester 代理中被引用

    local count=0
    local files=(
        "$REPO_ROOT/.claude/docs/templates/PRD_TEMPLATE.md"
        "$REPO_ROOT/.claude/docs/templates/EPIC_TEMPLATE.md"
        "$REPO_ROOT/.claude/docs/templates/TASKS_TEMPLATE.md"
        "$REPO_ROOT/.claude/agents/prd-writer.md"
        "$REPO_ROOT/.claude/agents/qa-tester.md"
    )

    for file in "${files[@]}"; do
        if [[ -f "$file" ]] && grep -q "Article I" "$file"; then
            ((count++))
        fi
    done

    assert_gte "$count" "4" "Article I should have at least 4 enforcement points (found $count)"
}

test_article_III_has_enforcement_points() {
    # Article III: Security First
    # 应该在模板和 security-reviewer, prd-writer 代理中被引用

    local count=0
    local files=(
        "$REPO_ROOT/.claude/docs/templates/PRD_TEMPLATE.md"
        "$REPO_ROOT/.claude/docs/templates/EPIC_TEMPLATE.md"
        "$REPO_ROOT/.claude/agents/prd-writer.md"
        "$REPO_ROOT/.claude/agents/security-reviewer.md"
    )

    for file in "${files[@]}"; do
        if [[ -f "$file" ]] && grep -q "Article III" "$file"; then
            ((count++))
        fi
    done

    assert_gte "$count" "3" "Article III should have at least 3 enforcement points (found $count)"
}

test_article_VI_has_enforcement_points() {
    # Article VI: Test-First Development
    # 应该在 TASKS 模板和 qa-tester 代理中被引用

    local count=0
    local files=(
        "$REPO_ROOT/.claude/docs/templates/TASKS_TEMPLATE.md"
        "$REPO_ROOT/.claude/agents/qa-tester.md"
    )

    for file in "${files[@]}"; do
        if [[ -f "$file" ]] && grep -q "Article VI" "$file"; then
            ((count++))
        fi
    done

    assert_gte "$count" "2" "Article VI should have at least 2 enforcement points (found $count)"
}

test_article_VII_has_enforcement_points() {
    # Article VII: Simplicity Gate
    # 应该在 EPIC 模板和 planner 代理中被引用

    local count=0
    local files=(
        "$REPO_ROOT/.claude/docs/templates/EPIC_TEMPLATE.md"
        "$REPO_ROOT/.claude/agents/planner.md"
    )

    for file in "${files[@]}"; do
        if [[ -f "$file" ]] && grep -q "Article VII" "$file"; then
            ((count++))
        fi
    done

    assert_gte "$count" "2" "Article VII should have at least 2 enforcement points (found $count)"
}

test_article_VIII_has_enforcement_points() {
    # Article VIII: Anti-Abstraction
    # 应该在 EPIC 模板和 planner 代理中被引用

    local count=0
    local files=(
        "$REPO_ROOT/.claude/docs/templates/EPIC_TEMPLATE.md"
        "$REPO_ROOT/.claude/agents/planner.md"
    )

    for file in "${files[@]}"; do
        if [[ -f "$file" ]] && grep -q "Article VIII" "$file"; then
            ((count++))
        fi
    done

    assert_gte "$count" "2" "Article VIII should have at least 2 enforcement points (found $count)"
}

test_article_IX_has_enforcement_points() {
    # Article IX: Integration-First Testing
    # 应该在 EPIC 模板和 planner 代理中被引用

    local count=0
    local files=(
        "$REPO_ROOT/.claude/docs/templates/EPIC_TEMPLATE.md"
        "$REPO_ROOT/.claude/agents/planner.md"
    )

    for file in "${files[@]}"; do
        if [[ -f "$file" ]] && grep -q "Article IX" "$file"; then
            ((count++))
        fi
    done

    assert_gte "$count" "2" "Article IX should have at least 2 enforcement points (found $count)"
}

test_article_X_has_enforcement_points() {
    # Article X: Requirement Boundary
    # 应该在 PRD 模板和 prd-writer 代理中被引用

    local count=0
    local files=(
        "$REPO_ROOT/.claude/docs/templates/PRD_TEMPLATE.md"
        "$REPO_ROOT/.claude/agents/prd-writer.md"
        "$REPO_ROOT/.claude/scripts/validate-scope-boundary.sh"
    )

    for file in "${files[@]}"; do
        if [[ -f "$file" ]] && grep -q "Article X" "$file"; then
            ((count++))
        fi
    done

    assert_gte "$count" "2" "Article X should have at least 2 enforcement points (found $count)"
}

test_all_articles_documented_in_constitution() {
    local constitution="$REPO_ROOT/.claude/rules/project-constitution.md"

    for article in I II III IV V VI VII VIII IX X; do
        assert_file_contains "$constitution" "## Article $article:" "Constitution should document Article $article"
    done
}

test_all_articles_documented_in_claude_md() {
    local claude_md="$REPO_ROOT/CLAUDE.md"

    for article in I II III IV V VI VII VIII IX X; do
        assert_file_contains "$claude_md" "Article $article" "CLAUDE.md should mention Article $article"
    done
}

test_impact_report_shows_all_articles() {
    local output=$(bash "$REPO_ROOT/.claude/scripts/manage-constitution.sh" impact 2>&1)

    for article in I II III IV V VI VII VIII IX X; do
        assert_contains "$output" "Article $article:" "Impact report should include Article $article"
    done
}

# ============================================================================
# 运行测试
# ============================================================================

run_tests \
    test_article_I_has_enforcement_points \
    test_article_III_has_enforcement_points \
    test_article_VI_has_enforcement_points \
    test_article_VII_has_enforcement_points \
    test_article_VIII_has_enforcement_points \
    test_article_IX_has_enforcement_points \
    test_article_X_has_enforcement_points \
    test_all_articles_documented_in_constitution \
    test_all_articles_documented_in_claude_md \
    test_impact_report_shows_all_articles
