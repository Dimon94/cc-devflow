#!/usr/bin/env bash

# test_version_consistency.sh - 测试 Constitution 版本一致性
#
# 验证所有文件引用的 Constitution 版本是否一致

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

test_constitution_version_readable() {
    local constitution_file="$REPO_ROOT/.claude/constitution/project-constitution.md"

    assert_file_exists "$constitution_file" "Constitution file should exist"

    # 提取版本号
    local version=$(grep -E '^\*\*Version\*\*:|^> \*\*Version\*\*:' "$constitution_file" | head -1 | sed 's/.*v\([0-9.]*\).*/\1/')

    assert_not_empty "$version" "Constitution should have a version number"
    assert_matches "$version" '^[0-9]+\.[0-9]+\.[0-9]+$' "Version should be in format X.Y.Z"

    log_success "Constitution version: v$version"
}

test_all_templates_reference_same_version() {
    local constitution_version=$(bash "$REPO_ROOT/.claude/scripts/manage-constitution.sh" verify 2>&1 | grep "Constitution Version:" | sed 's/.*v\([0-9.]*\).*/\1/' || echo "")

    if [[ -z "$constitution_version" ]]; then
        log_error "Could not extract Constitution version"
        return 1
    fi

    local templates_dir="$REPO_ROOT/.claude/docs/templates"
    local inconsistent_count=0

    for template in "$templates_dir"/*.md; do
        if [[ -f "$template" ]] && grep -q "Constitution" "$template"; then
            local template_version=$(grep -o "Constitution.*v[0-9.]*" "$template" | head -1 | sed 's/.*v\([0-9.]*\).*/\1/' || echo "")

            if [[ -n "$template_version" ]] && [[ "$template_version" != "$constitution_version" ]]; then
                log_error "Template $(basename "$template") has version v$template_version, expected v$constitution_version"
                ((inconsistent_count++))
            fi
        fi
    done

    assert_equals "$inconsistent_count" "0" "All templates should reference Constitution v$constitution_version"
}

test_all_agents_reference_same_version() {
    local constitution_version=$(grep -E '^\*\*Version\*\*:|^> \*\*Version\*\*:' "$REPO_ROOT/.claude/constitution/project-constitution.md" | head -1 | sed 's/.*v\([0-9.]*\).*/\1/')

    local agents_dir="$REPO_ROOT/.claude/agents"
    local inconsistent_count=0

    for agent in "$agents_dir"/*.md; do
        if [[ -f "$agent" ]] && grep -q "Constitution" "$agent"; then
            local agent_version=$(grep -o "Constitution.*v[0-9.]*" "$agent" | head -1 | sed 's/.*v\([0-9.]*\).*/\1/' || echo "")

            if [[ -n "$agent_version" ]] && [[ "$agent_version" != "$constitution_version" ]]; then
                log_error "Agent $(basename "$agent") has version v$agent_version, expected v$constitution_version"
                ((inconsistent_count++))
            fi
        fi
    done

    assert_equals "$inconsistent_count" "0" "All agents should reference Constitution v$constitution_version"
}

test_claude_md_references_current_version() {
    local constitution_version=$(grep -E '^\*\*Version\*\*:|^> \*\*Version\*\*:' "$REPO_ROOT/.claude/constitution/project-constitution.md" | head -1 | sed 's/.*v\([0-9.]*\).*/\1/')

    local claude_md="$REPO_ROOT/CLAUDE.md"

    assert_file_exists "$claude_md" "CLAUDE.md should exist"

    if grep -q "Constitution.*v" "$claude_md"; then
        local claude_version=$(grep -o "Constitution.*v[0-9.]*" "$claude_md" | head -1 | sed 's/.*v\([0-9.]*\).*/\1/')

        assert_equals "$claude_version" "$constitution_version" "CLAUDE.md should reference Constitution v$constitution_version"
    else
        log_warning "CLAUDE.md does not reference Constitution version"
    fi
}

test_validate_constitution_script_consistency() {
    local script="$REPO_ROOT/.claude/scripts/validate-constitution.sh"

    assert_file_exists "$script" "validate-constitution.sh should exist"
    assert_file_executable "$script" "validate-constitution.sh should be executable"

    # 运行脚本的 verify 命令（可能会失败，但应该返回有意义的输出）
    local output=$(bash "$script" verify 2>&1 || true)

    assert_contains "$output" "Constitution Version:" "verify command should output Constitution version"
}

# ============================================================================
# 运行测试
# ============================================================================

run_tests \
    test_constitution_version_readable \
    test_all_templates_reference_same_version \
    test_all_agents_reference_same_version \
    test_claude_md_references_current_version \
    test_validate_constitution_script_consistency
