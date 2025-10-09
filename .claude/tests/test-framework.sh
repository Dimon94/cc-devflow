#!/usr/bin/env bash
# test-framework.sh - 测试框架核心功能
# 提供断言、mock、测试隔离和报告功能

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 测试统计
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
CURRENT_TEST_NAME=""

# 测试输出控制
VERBOSE=${VERBOSE:-false}
QUIET=${QUIET:-false}

# 临时目录
TEST_TMP_DIR=""

# ============================================================================
# 测试生命周期管理
# ============================================================================

# 初始化测试环境
init_test_framework() {
    TESTS_RUN=0
    TESTS_PASSED=0
    TESTS_FAILED=0

    # 创建临时测试目录
    TEST_TMP_DIR=$(mktemp -d -t cc-devflow-test.XXXXXX)
    export TEST_ROOT="$TEST_TMP_DIR"

    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${BLUE}Test framework initialized${NC}"
        echo -e "${BLUE}Temporary directory: $TEST_TMP_DIR${NC}"
    fi
}

# 清理测试环境
cleanup_test_framework() {
    if [[ -n "$TEST_TMP_DIR" && -d "$TEST_TMP_DIR" ]]; then
        rm -rf "$TEST_TMP_DIR"
        if [[ "$VERBOSE" == "true" ]]; then
            echo -e "${BLUE}Cleaned up temporary directory${NC}"
        fi
    fi
}

# 测试开始
test_start() {
    local test_name="$1"
    CURRENT_TEST_NAME="$test_name"
    ((TESTS_RUN++))

    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${BLUE}▶ Running: $test_name${NC}"
    fi
}

# 测试成功
test_pass() {
    ((TESTS_PASSED++))

    if [[ "$QUIET" != "true" ]]; then
        echo -e "${GREEN}✓ PASS${NC}: $CURRENT_TEST_NAME"
    fi
}

# 测试失败
test_fail() {
    local message="$1"
    ((TESTS_FAILED++))

    echo -e "${RED}✗ FAIL${NC}: $CURRENT_TEST_NAME"
    echo -e "${RED}  Reason: $message${NC}"
}

# ============================================================================
# 断言函数
# ============================================================================

# 断言相等
assert_equals() {
    local actual="$1"
    local expected="$2"
    local message="${3:-Values should be equal}"

    if [[ "$actual" == "$expected" ]]; then
        return 0
    else
        test_fail "$message"
        echo -e "${RED}    Expected: '$expected'${NC}"
        echo -e "${RED}    Actual:   '$actual'${NC}"
        return 1
    fi
}

# 断言不相等
assert_not_equals() {
    local actual="$1"
    local unexpected="$2"
    local message="${3:-Values should not be equal}"

    if [[ "$actual" != "$unexpected" ]]; then
        return 0
    else
        test_fail "$message"
        echo -e "${RED}    Unexpected value: '$unexpected'${NC}"
        echo -e "${RED}    Actual:           '$actual'${NC}"
        return 1
    fi
}

# 断言包含
assert_contains() {
    local haystack="$1"
    local needle="$2"
    local message="${3:-String should contain substring}"

    if [[ "$haystack" == *"$needle"* ]]; then
        return 0
    else
        test_fail "$message"
        echo -e "${RED}    Looking for: '$needle'${NC}"
        echo -e "${RED}    In string:   '$haystack'${NC}"
        return 1
    fi
}

# 断言不包含
assert_not_contains() {
    local haystack="$1"
    local needle="$2"
    local message="${3:-String should not contain substring}"

    if [[ "$haystack" != *"$needle"* ]]; then
        return 0
    else
        test_fail "$message"
        echo -e "${RED}    Should not contain: '$needle'${NC}"
        echo -e "${RED}    But found in:       '$haystack'${NC}"
        return 1
    fi
}

# 断言文件存在
assert_file_exists() {
    local path="$1"
    local message="${2:-File should exist}"

    if [[ -f "$path" ]]; then
        return 0
    else
        test_fail "$message"
        echo -e "${RED}    File not found: '$path'${NC}"
        return 1
    fi
}

# 断言文件不存在
assert_file_not_exists() {
    local path="$1"
    local message="${2:-File should not exist}"

    if [[ ! -f "$path" ]]; then
        return 0
    else
        test_fail "$message"
        echo -e "${RED}    File exists: '$path'${NC}"
        return 1
    fi
}

# 断言目录存在
assert_dir_exists() {
    local path="$1"
    local message="${2:-Directory should exist}"

    if [[ -d "$path" ]]; then
        return 0
    else
        test_fail "$message"
        echo -e "${RED}    Directory not found: '$path'${NC}"
        return 1
    fi
}

# 断言目录不存在
assert_dir_not_exists() {
    local path="$1"
    local message="${2:-Directory should not exist}"

    if [[ ! -d "$path" ]]; then
        return 0
    else
        test_fail "$message"
        echo -e "${RED}    Directory exists: '$path'${NC}"
        return 1
    fi
}

# 断言 JSON 有效
assert_json_valid() {
    local json="$1"
    local message="${2:-JSON should be valid}"

    if echo "$json" | jq . >/dev/null 2>&1; then
        return 0
    else
        test_fail "$message"
        echo -e "${RED}    Invalid JSON: '$json'${NC}"
        return 1
    fi
}

# 断言 JSON 字段值
assert_json_field() {
    local json="$1"
    local field="$2"
    local expected="$3"
    local message="${4:-JSON field should match expected value}"

    local actual=$(echo "$json" | jq -r ".$field" 2>/dev/null)

    if [[ "$actual" == "$expected" ]]; then
        return 0
    else
        test_fail "$message"
        echo -e "${RED}    Field: '$field'${NC}"
        echo -e "${RED}    Expected: '$expected'${NC}"
        echo -e "${RED}    Actual:   '$actual'${NC}"
        return 1
    fi
}

# 断言退出码
assert_exit_code() {
    local expected_code="$1"
    shift
    local command="$@"
    local message="Command should exit with code $expected_code"

    # 执行命令并捕获退出码
    local output
    local actual_code
    output=$($command 2>&1) || actual_code=$?
    actual_code=${actual_code:-0}

    if [[ "$actual_code" -eq "$expected_code" ]]; then
        return 0
    else
        test_fail "$message"
        echo -e "${RED}    Command: $command${NC}"
        echo -e "${RED}    Expected exit code: $expected_code${NC}"
        echo -e "${RED}    Actual exit code:   $actual_code${NC}"
        if [[ -n "$output" ]]; then
            echo -e "${RED}    Output: $output${NC}"
        fi
        return 1
    fi
}

# 断言命令成功
assert_success() {
    local command="$@"
    assert_exit_code 0 "$@"
}

# 断言命令失败
assert_failure() {
    local command="$@"
    local message="Command should fail"

    # 执行命令并捕获退出码
    local output
    local actual_code
    output=$($command 2>&1) || actual_code=$?
    actual_code=${actual_code:-0}

    if [[ "$actual_code" -ne 0 ]]; then
        return 0
    else
        test_fail "$message"
        echo -e "${RED}    Command: $command${NC}"
        echo -e "${RED}    Expected: failure (exit code != 0)${NC}"
        echo -e "${RED}    Actual:   success (exit code 0)${NC}"
        return 1
    fi
}

# 断言非空
assert_not_empty() {
    local value="$1"
    local message="${2:-Value should not be empty}"

    if [[ -n "$value" ]]; then
        return 0
    else
        test_fail "$message"
        echo -e "${RED}    Value is empty${NC}"
        return 1
    fi
}

# 断言匹配正则表达式
assert_matches() {
    local value="$1"
    local pattern="$2"
    local message="${3:-Value should match pattern}"

    if [[ "$value" =~ $pattern ]]; then
        return 0
    else
        test_fail "$message"
        echo -e "${RED}    Value: '$value'${NC}"
        echo -e "${RED}    Pattern: '$pattern'${NC}"
        return 1
    fi
}

# 断言大于等于
assert_gte() {
    local actual="$1"
    local expected="$2"
    local message="${3:-Value should be >= expected}"

    if [[ "$actual" -ge "$expected" ]]; then
        return 0
    else
        test_fail "$message"
        echo -e "${RED}    Expected: >= $expected${NC}"
        echo -e "${RED}    Actual:   $actual${NC}"
        return 1
    fi
}

# 断言大于
assert_gt() {
    local actual="$1"
    local expected="$2"
    local message="${3:-Value should be > expected}"

    if [[ "$actual" -gt "$expected" ]]; then
        return 0
    else
        test_fail "$message"
        echo -e "${RED}    Expected: > $expected${NC}"
        echo -e "${RED}    Actual:   $actual${NC}"
        return 1
    fi
}

# 断言文件可执行
assert_file_executable() {
    local file="$1"
    local message="${2:-File should be executable}"

    if [[ -x "$file" ]]; then
        return 0
    else
        test_fail "$message"
        echo -e "${RED}    File: '$file'${NC}"
        echo -e "${RED}    Not executable or does not exist${NC}"
        return 1
    fi
}

# 断言文件包含内容
assert_file_contains() {
    local file="$1"
    local pattern="$2"
    local message="${3:-File should contain pattern}"

    if [[ ! -f "$file" ]]; then
        test_fail "$message"
        echo -e "${RED}    File not found: '$file'${NC}"
        return 1
    fi

    if grep -qE "$pattern" "$file"; then
        return 0
    else
        test_fail "$message"
        echo -e "${RED}    File: '$file'${NC}"
        echo -e "${RED}    Pattern not found: '$pattern'${NC}"
        return 1
    fi
}

# ============================================================================
# Mock 系统
# ============================================================================

# Mock Git 命令 (增强版)
mock_git() {
    local git_command="$1"
    local mock_output="$2"
    local mock_exit_code="${3:-0}"

    # 确保 TEST_TMP_DIR 存在
    if [[ -z "$TEST_TMP_DIR" ]]; then
        echo "ERROR: TEST_TMP_DIR is not set. Call run_tests first." >&2
        return 1
    fi

    # 创建或追加到 mock git 脚本 - 文件名必须是 "git" 才能被 PATH 找到
    local mock_git_path="$TEST_TMP_DIR/git"

    if [[ ! -f "$mock_git_path" ]]; then
        # 创建新的 mock git 脚本
        cat > "$mock_git_path" << 'HEADER'
#!/usr/bin/env bash
# Mock git script - supports multiple command mocks

HEADER
        chmod +x "$mock_git_path"
    fi

    # 追加新的命令匹配逻辑
    cat >> "$mock_git_path" << EOF
if [[ "\$*" == "$git_command" ]]; then
    echo "$mock_output"
    exit $mock_exit_code
fi

EOF

    # 如果还没有默认处理，添加它
    if ! grep -q "/usr/bin/git" "$mock_git_path" 2>/dev/null; then
        cat >> "$mock_git_path" << 'FOOTER'
# 传递给真实的 git (使用绝对路径避免递归)
/usr/bin/git "$@"
FOOTER
    fi

    # 添加到 PATH 开头
    export PATH="$TEST_TMP_DIR:$PATH"
}

# 清除所有 Git mocks
clear_git_mocks() {
    local mock_git_path="$TEST_TMP_DIR/git"
    [[ -f "$mock_git_path" ]] && rm "$mock_git_path"
}

# Mock 文件
mock_file() {
    local path="$1"
    local content="$2"

    # 确保目录存在
    mkdir -p "$(dirname "$path")"

    # 创建文件
    echo "$content" > "$path"
}

# Mock JSON 文件
mock_json_file() {
    local path="$1"
    local json_content="$2"

    # 确保目录存在
    mkdir -p "$(dirname "$path")"

    # 创建 JSON 文件
    echo "$json_content" > "$path"
}

# Mock 函数
mock_function() {
    local function_name="$1"
    local mock_behavior="$2"

    eval "$function_name() { $mock_behavior; }"
}

# 恢复函数 (从 mock 恢复)
restore_function() {
    local function_name="$1"
    unset -f "$function_name"
}

# Mock 目录结构 - 创建完整的目录树
mock_directory_tree() {
    local base_dir="$1"
    shift
    local paths=("$@")

    for path in "${paths[@]}"; do
        if [[ "$path" == */ ]]; then
            # 目录
            mkdir -p "$base_dir/$path"
        else
            # 文件
            mkdir -p "$(dirname "$base_dir/$path")"
            touch "$base_dir/$path"
        fi
    done
}

# Mock 命令 - 创建假的命令脚本
mock_command() {
    local command_name="$1"
    local mock_output="$2"
    local mock_exit_code="${3:-0}"

    local mock_cmd_path="$TEST_TMP_DIR/mock_$command_name"
    cat > "$mock_cmd_path" << EOF
#!/usr/bin/env bash
echo "$mock_output"
exit $mock_exit_code
EOF
    chmod +x "$mock_cmd_path"
    export PATH="$TEST_TMP_DIR:$PATH"
}

# Mock 时间戳 - 为测试创建一致的时间戳
mock_timestamp() {
    local timestamp="${1:-2025-10-01T00:00:00Z}"
    export MOCK_TIMESTAMP="$timestamp"

    # Mock date 命令
    mock_command "date" "$timestamp"
}

# 恢复所有 mocks
restore_all_mocks() {
    # 移除 mock 目录中的所有 mock 脚本
    find "$TEST_TMP_DIR" -name "mock_*" -type f -delete 2>/dev/null || true

    # 清理环境变量
    unset MOCK_TIMESTAMP
}

# ============================================================================
# 测试辅助函数
# ============================================================================

# 描述测试
describe() {
    local description="$1"
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${BLUE}  $description${NC}"
    fi
}

# 创建测试目录
create_test_dir() {
    local dir_path="$1"
    mkdir -p "$TEST_TMP_DIR/$dir_path"
}

# 创建测试文件
create_test_file() {
    local file_path="$1"
    local content="$2"

    mkdir -p "$TEST_TMP_DIR/$(dirname "$file_path")"
    echo "$content" > "$TEST_TMP_DIR/$file_path"
}

# 读取测试文件
read_test_file() {
    local file_path="$1"
    cat "$TEST_TMP_DIR/$file_path"
}

# 设置环境变量
set_test_env() {
    local var_name="$1"
    local var_value="$2"
    export "$var_name=$var_value"
}

# 清理环境变量
unset_test_env() {
    local var_name="$1"
    unset "$var_name"
}

# ============================================================================
# 测试运行器
# ============================================================================

# 运行测试函数列表
run_tests() {
    local test_functions=("$@")

    # 初始化测试框架
    init_test_framework

    # 打印测试开始标题
    if [[ "$QUIET" != "true" ]]; then
        echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
        echo -e "${BOLD}${BLUE}  Running Test Suite${NC}"
        echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
        echo ""
    fi

    # 运行每个测试
    for test_func in "${test_functions[@]}"; do
        test_start "$test_func"

        # 设置每个测试的独立环境
        if type setup_test &>/dev/null; then
            setup_test
        fi

        # 运行测试函数
        if $test_func; then
            test_pass
        fi

        # 清理测试环境
        if type teardown_test &>/dev/null; then
            teardown_test
        fi
    done

    # 清理测试框架
    cleanup_test_framework

    # 打印测试结果摘要
    print_test_summary

    # 返回失败数量
    return $TESTS_FAILED
}

# 打印测试摘要
print_test_summary() {
    echo ""
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${BLUE}  Test Results${NC}"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
    echo ""
    echo -e "Total:   ${BOLD}$TESTS_RUN${NC}"
    echo -e "Passed:  ${GREEN}${BOLD}$TESTS_PASSED${NC}"
    echo -e "Failed:  ${RED}${BOLD}$TESTS_FAILED${NC}"
    echo ""

    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}${BOLD}✓ ALL TESTS PASSED${NC}"
    else
        echo -e "${RED}${BOLD}✗ SOME TESTS FAILED${NC}"
    fi
    echo ""
}

# ============================================================================
# 覆盖率跟踪 (简单实现)
# ============================================================================

# 开始覆盖率跟踪
start_coverage() {
    export COVERAGE_ENABLED=true
    export COVERAGE_DIR="$TEST_TMP_DIR/coverage"
    mkdir -p "$COVERAGE_DIR"
}

# 结束覆盖率跟踪
end_coverage() {
    if [[ "$COVERAGE_ENABLED" == "true" ]]; then
        # 生成覆盖率报告
        generate_coverage_report
    fi
}

# 生成覆盖率报告 (占位符 - 完整实现需要 bash 代码覆盖率工具)
generate_coverage_report() {
    echo "Coverage reporting not yet implemented"
    echo "TODO: Integrate bash coverage tool (e.g., kcov, bashcov)"
}

# ============================================================================
# 日志函数 (用于测试输出)
# ============================================================================

# 成功日志
log_success() {
    local message="$1"
    if [[ "$QUIET" != "true" ]]; then
        echo -e "${GREEN}✓${NC} $message"
    fi
}

# 错误日志
log_error() {
    local message="$1"
    echo -e "${RED}✗${NC} $message" >&2
}

# 警告日志
log_warning() {
    local message="$1"
    if [[ "$QUIET" != "true" ]]; then
        echo -e "${YELLOW}⚠${NC} $message"
    fi
}

# 信息日志
log_info() {
    local message="$1"
    if [[ "$QUIET" != "true" ]]; then
        echo -e "${BLUE}ℹ${NC} $message"
    fi
}

# ============================================================================
# 导出函数
# ============================================================================

# 使函数可用于调用此框架的脚本
export -f test_start test_pass test_fail
export -f log_success log_error log_warning log_info
export -f assert_equals assert_not_equals assert_contains assert_not_contains
export -f assert_file_exists assert_file_not_exists
export -f assert_dir_exists assert_dir_not_exists
export -f assert_json_valid assert_json_field
export -f assert_exit_code assert_success assert_failure
export -f mock_git mock_file mock_json_file mock_function restore_function
export -f describe create_test_dir create_test_file read_test_file
export -f set_test_env unset_test_env
export -f run_tests print_test_summary