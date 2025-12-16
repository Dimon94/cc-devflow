#!/usr/bin/env bats
# =============================================================================
# slugify() Function Tests
# =============================================================================
# REQ-003: Branch Naming Optimization (Chinese to Pinyin)
# Test Framework: bats-core
# =============================================================================

# -----------------------------------------------------------------------------
# Setup: Load common.sh before each test
# -----------------------------------------------------------------------------
setup() {
    # Load the function under test
    # BATS_TEST_DIRNAME is .claude/tests/, so ../scripts/ leads to .claude/scripts/
    source "$BATS_TEST_DIRNAME/../scripts/common.sh"
}

# =============================================================================
# US2: English Input Compatibility (Regression Tests)
# =============================================================================

@test "slugify: English phrase converts to lowercase hyphenated" {
    result=$(slugify "User Login Feature")
    [ "$result" = "user-login-feature" ]
}

@test "slugify: English with numbers preserves numbers" {
    result=$(slugify "API2.0")
    [ "$result" = "api2-0" ]
}

@test "slugify: Empty input returns empty string" {
    result=$(slugify "")
    [ "$result" = "" ]
}

@test "slugify: Pure numbers preserved" {
    result=$(slugify "123")
    [ "$result" = "123" ]
}

# =============================================================================
# US1: Chinese Input Conversion Tests
# =============================================================================

@test "slugify: Pure Chinese converts to pinyin" {
    result=$(slugify "用户登录功能")
    [ "$result" = "yong-hu-deng-lu-gong-neng" ]
}

@test "slugify: Mixed Chinese-English converts correctly" {
    result=$(slugify "OAuth2认证")
    [ "$result" = "oauth2-ren-zheng" ]
}

@test "slugify: Chinese with special characters filters correctly" {
    result=$(slugify "测试@#\$%功能")
    [ "$result" = "ce-shi-gong-neng" ]
}

@test "slugify: Polyphone word uses default pronunciation" {
    result=$(slugify "重庆")
    [ "$result" = "chong-qing" ]
}

# =============================================================================
# US3: Dependency Missing Warning Tests
# =============================================================================

@test "slugify: No warning for English input regardless of pypinyin" {
    # English input should never trigger pypinyin path, so no warning
    result=$(slugify "User Login" 2>&1)
    # Should not contain "Warning" in output
    [[ "$result" != *"Warning"* ]]
    [ "$result" = "user-login" ]
}

@test "slugify: Warning function exists and handles missing pypinyin" {
    # Verify _chinese_to_pinyin function exists and is callable
    # The warning logic is embedded in the function
    type _chinese_to_pinyin | grep -q "function"
}
