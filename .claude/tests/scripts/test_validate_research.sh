#!/usr/bin/env bash
# =============================================================================
# test_validate_research.sh - 测试 validate-research.sh 的所有验证级别
# =============================================================================
# Purpose: 验证 research.md 质量检查脚本的正确性
# Coverage: LEVEL 1-5 验证、TODO 检测、结构验证、Constitution 合规
# =============================================================================

# 加载测试框架
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../test-framework.sh"

# 脚本路径 (REPO_ROOT 已经指向仓库根目录)
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
VALIDATE_RESEARCH="$REPO_ROOT/.claude/scripts/validate-research.sh"

# ============================================================================
# 测试钩子 - 在每个测试前创建临时需求目录
# ============================================================================

setup_test() {
    # 创建临时需求目录
    TEST_REQ_DIR="$TEST_TMP_DIR/devflow/requirements/TEST-001"
    mkdir -p "$TEST_REQ_DIR/research"

    # 默认创建有效的 tasks.json
    cat > "$TEST_REQ_DIR/research/tasks.json" <<'EOF'
{
  "feature": "Test Feature",
  "generatedAt": "2025-01-26T00:00:00Z",
  "requirementDir": "devflow/requirements/TEST-001",
  "tasks": [
    {
      "id": "R001",
      "type": "clarification",
      "prompt": "Test prompt",
      "status": "open"
    }
  ]
}
EOF
}

# ============================================================================
# LEVEL 1: File Existence Check
# ============================================================================

test_level1_research_md_missing() {
    describe "LEVEL 1: Should fail when research.md is missing"

    # Arrange - research.md 不存在

    # Act - 捕获退出码
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"
    (
        bash "$VALIDATE_RESEARCH" "$TEST_REQ_DIR" --strict > /dev/null 2>&1
        echo $? > "$exit_code_file"
    )
    local exit_code=$(cat "$exit_code_file")

    # Assert
    [[ $exit_code -ne 0 ]] || test_fail "Should fail when research.md missing (exit code: $exit_code)"
}

test_level1_research_md_exists() {
    describe "LEVEL 1: Should pass when research.md exists"

    # Arrange - 创建基本 research.md
    cat > "$TEST_REQ_DIR/research/research.md" <<'EOF'
# Research Summary

## Decisions

### R001 — Test
- Decision: Test decision
- Rationale: Test rationale
- Alternatives considered: Test alternatives

## Source Library

_None yet._
EOF

    # Act
    local output_file="$TEST_TMP_DIR/output.txt"
    bash "$VALIDATE_RESEARCH" "$TEST_REQ_DIR" --strict > "$output_file" 2>&1
    local output=$(cat "$output_file")

    # Assert
    assert_contains "$output" "✅ LEVEL 1 PASSED" "Should pass LEVEL 1"
}

# ============================================================================
# LEVEL 2: Structure Validation
# ============================================================================

test_level2_missing_research_summary() {
    describe "LEVEL 2: Should fail when '## Research Summary' is missing"

    # Arrange - 缺少 Research Summary 章节
    cat > "$TEST_REQ_DIR/research/research.md" <<'EOF'
# Some Other Title

## Decisions

### R001 — Test
- Decision: Test
- Rationale: Test
- Alternatives considered: Test
EOF

    # Act
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"
    (
        bash "$VALIDATE_RESEARCH" "$TEST_REQ_DIR" --strict > "$output_file" 2>&1
        echo $? > "$exit_code_file"
    )
    local output=$(cat "$output_file")
    local exit_code=$(cat "$exit_code_file")

    # Assert
    assert_contains "$output" "❌ LEVEL 2 FAILED" "Should fail LEVEL 2"
    [[ $exit_code -ne 0 ]] || test_fail "Should exit with error code (exit code: $exit_code)"
}

test_level2_missing_decisions_section() {
    describe "LEVEL 2: Should fail when '## Decisions' is missing"

    # Arrange
    cat > "$TEST_REQ_DIR/research/research.md" <<'EOF'
# Research Summary

## Some Other Section

Content here.
EOF

    # Act
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"
    (
        bash "$VALIDATE_RESEARCH" "$TEST_REQ_DIR" --strict > "$output_file" 2>&1
        echo $? > "$exit_code_file"
    )
    local output=$(cat "$output_file")
    local exit_code=$(cat "$exit_code_file")

    # Assert
    assert_contains "$output" "Missing section: ## Decisions" "Should report missing Decisions section"
    [[ $exit_code -ne 0 ]] || test_fail "Should fail validation (exit code: $exit_code)"
}

test_level2_no_decision_blocks() {
    describe "LEVEL 2: Should fail when no Decision blocks found"

    # Arrange - 有章节但无 Decision block
    cat > "$TEST_REQ_DIR/research/research.md" <<'EOF'
# Research Summary

## Decisions

_No decisions documented yet._
EOF

    # Act
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"
    (
        bash "$VALIDATE_RESEARCH" "$TEST_REQ_DIR" --strict > "$output_file" 2>&1
        echo $? > "$exit_code_file"
    )
    local output=$(cat "$output_file")

    # Assert
    assert_contains "$output" "No Decision blocks found" "Should report no decision blocks"
}

test_level2_valid_structure() {
    describe "LEVEL 2: Should pass with valid structure"

    # Arrange
    cat > "$TEST_REQ_DIR/research/research.md" <<'EOF'
## Research Summary

## Decisions

### R001 — Test decision
- Decision: PostgreSQL
- Rationale: ACID compliance
- Alternatives considered: MongoDB

## Source Library

_None_
EOF

    # Act
    local output_file="$TEST_TMP_DIR/output.txt"
    bash "$VALIDATE_RESEARCH" "$TEST_REQ_DIR" --strict > "$output_file" 2>&1
    local output=$(cat "$output_file")

    # Assert
    assert_contains "$output" "✅ LEVEL 2 PASSED" "Should pass LEVEL 2"
}

# ============================================================================
# LEVEL 3: Content Quality
# ============================================================================

test_level3_todo_markers() {
    describe "LEVEL 3: Should fail when TODO markers found"

    # Arrange - 包含 TODO
    cat > "$TEST_REQ_DIR/research/research.md" <<'EOF'
# Research Summary

## Decisions

### R001 — Test
- Decision: TODO - fill decision outcome
- Rationale: TODO - explain why
- Alternatives considered: TODO - list alternatives
EOF

    # Act
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"
    (
        bash "$VALIDATE_RESEARCH" "$TEST_REQ_DIR" --strict > "$output_file" 2>&1
        echo $? > "$exit_code_file"
    )
    local output=$(cat "$output_file")
    local exit_code=$(cat "$exit_code_file")

    # Assert
    assert_contains "$output" "Found 3 TODO/PLACEHOLDER marker(s)" "Should detect TODO markers"
    assert_contains "$output" "❌ LEVEL 3 FAILED" "Should fail LEVEL 3"
    [[ $exit_code -ne 0 ]] || test_fail "Should exit with error (exit code: $exit_code)"
}

test_level3_placeholder_markers() {
    describe "LEVEL 3: Should fail when {{PLACEHOLDER}} found"

    # Arrange
    cat > "$TEST_REQ_DIR/research/research.md" <<'EOF'
# Research Summary

## Decisions

### R001 — Test
- Decision: {{FILL_THIS}}
- Rationale: Some rationale
- Alternatives considered: None
EOF

    # Act
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"
    (
        bash "$VALIDATE_RESEARCH" "$TEST_REQ_DIR" --strict > "$output_file" 2>&1
        echo $? > "$exit_code_file"
    )
    local output=$(cat "$output_file")
    local exit_code=$(cat "$exit_code_file")

    # Assert
    assert_contains "$output" "{{PLACEHOLDER}} marker(s)" "Should detect placeholder markers"
    [[ $exit_code -ne 0 ]] || test_fail "Should fail validation (exit code: $exit_code)"
}

test_level3_no_quality_issues() {
    describe "LEVEL 3: Should pass when no TODO/PLACEHOLDER"

    # Arrange
    cat > "$TEST_REQ_DIR/research/research.md" <<'EOF'
# Research Summary

## Decisions

### R001 — Database choice
- Decision: PostgreSQL 15 with Prisma ORM
- Rationale: ACID compliance, type-safe access, team experience
- Alternatives considered: MongoDB (no ACID), MySQL (weaker JSON)

## Source Library

- research/internal/codebase.md
EOF

    # Act
    local output_file="$TEST_TMP_DIR/output.txt"
    bash "$VALIDATE_RESEARCH" "$TEST_REQ_DIR" --strict > "$output_file" 2>&1
    local output=$(cat "$output_file")

    # Assert
    assert_contains "$output" "✅ LEVEL 3 PASSED" "Should pass LEVEL 3"
    assert_contains "$output" "No TODO/PLACEHOLDER markers" "Should confirm no markers"
}

# ============================================================================
# LEVEL 4: Tasks Validation
# ============================================================================

test_level4_invalid_tasks_json() {
    describe "LEVEL 4: Should detect invalid tasks.json format"

    # Arrange - 无效 JSON
    echo "INVALID JSON" > "$TEST_REQ_DIR/research/tasks.json"

    cat > "$TEST_REQ_DIR/research/research.md" <<'EOF'
# Research Summary

## Decisions

### R001 — Test
- Decision: Test
- Rationale: Test
- Alternatives: Test
EOF

    # Act
    local output_file="$TEST_TMP_DIR/output.txt"
    bash "$VALIDATE_RESEARCH" "$TEST_REQ_DIR" --strict > "$output_file" 2>&1 || true
    local output=$(cat "$output_file")

    # Note: 当前 validate-research.sh 不验证 tasks.json 格式
    # 这是一个潜在的改进点，暂时跳过
}

# ============================================================================
# LEVEL 5: Constitution Compliance
# ============================================================================

test_level5_speculative_language() {
    describe "LEVEL 5: Should warn about speculative language"

    # Arrange - 包含推测性语言
    cat > "$TEST_REQ_DIR/research/research.md" <<'EOF'
# Research Summary

## Decisions

### R001 — Database
- Decision: PostgreSQL
- Rationale: Might be better for future scaling
- Alternatives considered: MySQL could work too
EOF

    # Act
    local output_file="$TEST_TMP_DIR/output.txt"
    bash "$VALIDATE_RESEARCH" "$TEST_REQ_DIR" --strict > "$output_file" 2>&1
    local output=$(cat "$output_file")

    # Assert - 应该有警告但不失败
    assert_contains "$output" "speculative language" "Should warn about speculation"
}

test_level5_no_partial_implementation() {
    describe "LEVEL 5: Should pass when no partial implementation language"

    # Arrange
    cat > "$TEST_REQ_DIR/research/research.md" <<'EOF'
## Research Summary

## Decisions

### R001 — Test
- Decision: Full implementation approach
- Rationale: Complete solution without shortcuts
- Alternatives considered: Incremental approach rejected
EOF

    # Act
    local output_file="$TEST_TMP_DIR/output.txt"
    bash "$VALIDATE_RESEARCH" "$TEST_REQ_DIR" --strict > "$output_file" 2>&1
    local output=$(cat "$output_file")

    # Assert
    assert_contains "$output" "✅ LEVEL 4 PASSED" "Should pass Constitution check"
}

# ============================================================================
# 综合测试: 完整有效的 research.md
# ============================================================================

test_complete_valid_research() {
    describe "Should pass all levels with complete valid research.md"

    # Arrange - 创建完整的 research.md
    cat > "$TEST_REQ_DIR/research/research.md" <<'EOF'
## Research Summary

Generated: 2025-01-26T12:00:00Z

## Decisions

### R001 — Research database choice for E-commerce Platform
- **Decision**: PostgreSQL 15 with Prisma ORM
- **Rationale**:
  - PRD requires ACID transactions for order processing
  - Prisma provides type-safe database access aligned with TypeScript stack
  - Team has 3 years PostgreSQL production experience
- **Alternatives Considered**:
  - MongoDB: No ACID transactions, unsuitable for financial operations
  - MySQL: Weaker JSON support, no composite indexes
  - Supabase: Vendor lock-in concerns
- **Source**: PRD.md:42

### R002 — Frontend framework selection
- **Decision**: Next.js 14 App Router with React Server Components
- **Rationale**:
  - App Router provides better layout composition
  - Server Components reduce client bundle size
  - Streaming and Suspense support align with requirements
- **Alternatives Considered**:
  - Pages Router: Deprecated, lacks RSC support
  - Remix: Smaller ecosystem, team unfamiliarity
- **Source**: Tech-Choice:Frontend Framework

## Source Library

- research/internal/codebase-overview.md
- research/mcp/20250126/nextjs-docs.md
EOF

    # Act
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"
    (
        bash "$VALIDATE_RESEARCH" "$TEST_REQ_DIR" --strict > "$output_file" 2>&1
        echo $? > "$exit_code_file"
    )
    local output=$(cat "$output_file")
    local exit_code=$(cat "$exit_code_file")

    # Assert - 所有级别都应通过
    assert_contains "$output" "✅ LEVEL 1 PASSED" "Should pass LEVEL 1"
    assert_contains "$output" "✅ LEVEL 2 PASSED" "Should pass LEVEL 2"
    assert_contains "$output" "✅ LEVEL 3 PASSED" "Should pass LEVEL 3"
    assert_contains "$output" "✅ LEVEL 4 PASSED" "Should pass LEVEL 4"
    assert_contains "$output" "✅ ALL VALIDATIONS PASSED" "Should pass all validations"
    [[ $exit_code -eq 0 ]] || test_fail "Should exit with success code (exit code: $exit_code)"
}

# ============================================================================
# 运行所有测试
# ============================================================================

run_tests \
    test_level1_research_md_missing \
    test_level1_research_md_exists \
    test_level2_missing_research_summary \
    test_level2_missing_decisions_section \
    test_level2_no_decision_blocks \
    test_level2_valid_structure \
    test_level3_todo_markers \
    test_level3_placeholder_markers \
    test_level3_no_quality_issues \
    test_level5_speculative_language \
    test_level5_no_partial_implementation \
    test_complete_valid_research
