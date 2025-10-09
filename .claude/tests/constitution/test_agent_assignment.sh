#!/usr/bin/env bash

# test_agent_assignment.sh - 测试代理 Article 分工
#
# 验证每个代理是否明确分配了负责的 Articles

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

test_prd_writer_enforces_article_I() {
    # prd-writer 应该执行 Article I (Quality First)
    local agent="$REPO_ROOT/.claude/agents/prd-writer.md"

    assert_file_exists "$agent" "prd-writer.md should exist"
    assert_file_contains "$agent" "Article I" "prd-writer should reference Article I"
}

test_prd_writer_enforces_article_III() {
    # prd-writer 应该执行 Article III (Security First)
    local agent="$REPO_ROOT/.claude/agents/prd-writer.md"

    assert_file_contains "$agent" "Article III" "prd-writer should reference Article III"
}

test_prd_writer_enforces_article_X() {
    # prd-writer 应该执行 Article X (Requirement Boundary)
    local agent="$REPO_ROOT/.claude/agents/prd-writer.md"

    assert_file_contains "$agent" "Article X" "prd-writer should reference Article X"
}

test_planner_enforces_article_VII() {
    # planner 应该执行 Article VII (Simplicity Gate)
    local agent="$REPO_ROOT/.claude/agents/planner.md"

    assert_file_exists "$agent" "planner.md should exist"
    assert_file_contains "$agent" "Article VII" "planner should reference Article VII (Simplicity Gate)"
}

test_planner_enforces_article_VIII() {
    # planner 应该执行 Article VIII (Anti-Abstraction)
    local agent="$REPO_ROOT/.claude/agents/planner.md"

    assert_file_contains "$agent" "Article VIII" "planner should reference Article VIII (Anti-Abstraction)"
}

test_planner_enforces_article_IX() {
    # planner 应该执行 Article IX (Integration-First)
    local agent="$REPO_ROOT/.claude/agents/planner.md"

    assert_file_contains "$agent" "Article IX" "planner should reference Article IX (Integration-First)"
}

test_qa_tester_enforces_article_I() {
    # qa-tester 应该执行 Article I (Quality First - Testing)
    local agent="$REPO_ROOT/.claude/agents/qa-tester.md"

    assert_file_exists "$agent" "qa-tester.md should exist"
    assert_file_contains "$agent" "Article I" "qa-tester should reference Article I"
}

test_qa_tester_enforces_article_VI() {
    # qa-tester 应该执行 Article VI (Test-First Development)
    local agent="$REPO_ROOT/.claude/agents/qa-tester.md"

    assert_file_contains "$agent" "Article VI" "qa-tester should reference Article VI (Test-First)"
}

test_security_reviewer_enforces_article_III() {
    # security-reviewer 应该执行 Article III (Security First)
    local agent="$REPO_ROOT/.claude/agents/security-reviewer.md"

    assert_file_exists "$agent" "security-reviewer.md should exist"
    assert_file_contains "$agent" "Article III" "security-reviewer should reference Article III"
}

test_security_reviewer_checks_hardcoded_secrets() {
    # security-reviewer 应该明确检查 NO HARDCODED SECRETS (Article III.1)
    local agent="$REPO_ROOT/.claude/agents/security-reviewer.md"

    assert_file_contains "$agent" "NO HARDCODED SECRETS|Article III.1" "security-reviewer should check for hardcoded secrets"
}

test_all_agents_reference_constitution() {
    local agents_dir="$REPO_ROOT/.claude/agents"
    local agents_without_constitution=()

    for agent in "$agents_dir"/*.md; do
        if [[ -f "$agent" ]] && ! grep -q "Constitution" "$agent"; then
            agents_without_constitution+=("$(basename "$agent")")
        fi
    done

    # 允许一些代理不引用 Constitution (如 bug-analyzer, impact-analyzer 等工具型代理)
    local allowed_without=(
        "bug-analyzer.md"
        "impact-analyzer.md"
        "compatibility-checker.md"
        "consistency-checker.md"
        "release-manager.md"
    )

    # 检查数组是否为空（安全处理）
    if [[ ${#agents_without_constitution[@]} -eq 0 ]]; then
        # 所有代理都引用了 Constitution，测试通过
        return 0
    fi

    for agent_name in "${agents_without_constitution[@]}"; do
        local is_allowed=false
        for allowed in "${allowed_without[@]}"; do
            if [[ "$agent_name" == "$allowed" ]]; then
                is_allowed=true
                break
            fi
        done

        if [[ "$is_allowed" == "false" ]]; then
            log_error "Agent $agent_name does not reference Constitution"
            return 1
        fi
    done

    # 所有未引用 Constitution 的代理都在允许列表中
    return 0
}

test_agents_reference_current_version() {
    local constitution_version=$(grep -E '^\*\*Version\*\*:|^> \*\*Version\*\*:' "$REPO_ROOT/.claude/constitution/project-constitution.md" | head -1 | sed 's/.*v\([0-9.]*\).*/\1/')

    local agents=(
        "$REPO_ROOT/.claude/agents/prd-writer.md"
        "$REPO_ROOT/.claude/agents/planner.md"
        "$REPO_ROOT/.claude/agents/qa-tester.md"
        "$REPO_ROOT/.claude/agents/security-reviewer.md"
    )

    for agent in "${agents[@]}"; do
        if grep -q "Constitution.*v" "$agent"; then
            # 使用精确的版本号匹配（v数字.数字.数字）
            local agent_version=$(grep -o "Constitution.*v[0-9]\+\.[0-9]\+\.[0-9]\+" "$agent" | head -1 | grep -o "v[0-9]\+\.[0-9]\+\.[0-9]\+" | sed 's/v//')
            if [[ -n "$agent_version" ]]; then
                assert_equals "$agent_version" "$constitution_version" "$(basename "$agent") should reference v$constitution_version"
            fi
        fi
    done
}

test_agent_article_coverage_complete() {
    # 验证所有 10 个 Articles 都有至少一个代理负责

    local articles_with_agents=()

    for article in I II III IV V VI VII VIII IX X; do
        local has_agent=false

        for agent in "$REPO_ROOT/.claude/agents"/*.md; do
            if [[ -f "$agent" ]] && grep -q "Article $article" "$agent"; then
                has_agent=true
                break
            fi
        done

        if [[ "$has_agent" == "true" ]]; then
            articles_with_agents+=("$article")
        else
            log_warning "Article $article has no dedicated agent enforcement"
        fi
    done

    # 至少要有 7 个 Articles 有代理负责 (允许一些 Articles 只在模板中执行)
    local count=${#articles_with_agents[@]}
    assert_gte "$count" "7" "At least 7 Articles should have agent enforcement (found $count)"
}

# ============================================================================
# 运行测试
# ============================================================================

run_tests \
    test_prd_writer_enforces_article_I \
    test_prd_writer_enforces_article_III \
    test_prd_writer_enforces_article_X \
    test_planner_enforces_article_VII \
    test_planner_enforces_article_VIII \
    test_planner_enforces_article_IX \
    test_qa_tester_enforces_article_I \
    test_qa_tester_enforces_article_VI \
    test_security_reviewer_enforces_article_III \
    test_security_reviewer_checks_hardcoded_secrets \
    test_all_agents_reference_constitution \
    test_agents_reference_current_version \
    test_agent_article_coverage_complete
