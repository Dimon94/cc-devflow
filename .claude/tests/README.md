# CC-DevFlow 测试套件

## 目录结构

```text
tests/
├── README.md              # 本文档
├── test-framework.sh      # 测试框架 (断言、mock、报告)
├── run-all-tests.sh       # 运行所有测试
├── scripts/               # 脚本单元测试
│   ├── test_common.sh
│   ├── test_check_prerequisites.sh
│   ├── test_setup_epic.sh
│   ├── test_mark_task_complete.sh
│   ├── test_check_task_status.sh
│   ├── test_validate_constitution.sh
│   └── test_generate_status_report.sh
├── commands/              # 命令集成测试
│   ├── test_flow_init.sh
│   ├── test_flow_prd.sh
│   ├── test_flow_epic.sh
│   ├── test_flow_dev.sh
│   ├── test_flow_qa.sh
│   └── test_flow_release.sh
├── e2e/                   # 端到端测试
│   ├── test_full_workflow.sh
│   ├── test_interruption_recovery.sh
│   └── test_quality_gates.sh
└── fixtures/              # 测试数据和 mock
    ├── mock_requirements/
    ├── mock_git/
    └── test_data/
```

## 测试框架

### 核心功能

- **断言函数**: assert_equals, assert_contains, assert_file_exists, assert_json_valid
- **Mock 系统**: mock_git, mock_file_system, mock_web_fetch
- **测试隔离**: 每个测试使用独立的临时目录
- **报告生成**: 统计通过/失败数量，生成详细报告

### 运行测试

```bash
# 运行所有测试
.claude/tests/run-all-tests.sh

# 运行脚本测试
.claude/tests/run-all-tests.sh --scripts

# 运行命令测试
.claude/tests/run-all-tests.sh --commands

# 运行端到端测试
.claude/tests/run-all-tests.sh --e2e

# 运行特定测试
.claude/tests/scripts/test_common.sh

# 显示详细输出
.claude/tests/run-all-tests.sh --verbose

# 生成覆盖率报告
.claude/tests/run-all-tests.sh --coverage
```

## 测试编写规范

### 测试文件结构

```bash
#!/usr/bin/env bash
# test_example.sh - Example script tests

# 加载测试框架
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../test-framework.sh"

# 设置测试
setup_test() {
    # 创建临时测试环境
    TEST_DIR=$(mktemp -d)
    export TEST_ROOT="$TEST_DIR"
}

# 清理测试
teardown_test() {
    # 清理临时文件
    rm -rf "$TEST_DIR"
}

# 测试函数示例
test_function_name() {
    describe "Function name should work correctly"

    # Arrange
    local input="test_value"

    # Act
    local result=$(function_under_test "$input")

    # Assert
    assert_equals "$result" "expected_value" "Should return expected value"
}

# 运行所有测试
run_tests \
    test_function_name \
    test_another_function
```

### 断言函数

- `assert_equals <actual> <expected> [message]`
- `assert_not_equals <actual> <unexpected> [message]`
- `assert_contains <haystack> <needle> [message]`
- `assert_file_exists <path> [message]`
- `assert_file_not_exists <path> [message]`
- `assert_json_valid <json_string> [message]`
- `assert_exit_code <expected_code> <command> [message]`

### Mock 函数

- `mock_git <command> <output>` - Mock Git 命令
- `mock_file <path> <content>` - 创建 Mock 文件
- `mock_function <function_name> <behavior>` - Mock 函数行为

## 测试覆盖目标

### 脚本测试覆盖率

| 脚本 | 目标覆盖率 | 当前状态 | 测试文件 |
|------|-----------|---------|---------|
| common.sh | ≥ 80% | ⏳ 待实现 | test_common.sh |
| check-prerequisites.sh | ≥ 80% | ⏳ 待实现 | test_check_prerequisites.sh |
| setup-epic.sh | ≥ 80% | ⏳ 待实现 | test_setup_epic.sh |
| mark-task-complete.sh | ≥ 80% | ⏳ 待实现 | test_mark_task_complete.sh |
| check-task-status.sh | ≥ 80% | ⏳ 待实现 | test_check_task_status.sh |
| validate-constitution.sh | ≥ 80% | ⏳ 待实现 | test_validate_constitution.sh |
| generate-status-report.sh | ≥ 80% | ⏳ 待实现 | test_generate_status_report.sh |

### 命令测试覆盖率

| 命令 | 目标覆盖率 | 当前状态 | 测试文件 |
|------|-----------|---------|---------|
| /flow-init | ≥ 80% | ⏳ 待实现 | test_flow_init.sh |
| /flow-prd | ≥ 80% | ⏳ 待实现 | test_flow_prd.sh |
| /flow-epic | ≥ 80% | ⏳ 待实现 | test_flow_epic.sh |
| /flow-dev | ≥ 80% | ⏳ 待实现 | test_flow_dev.sh |
| /flow-qa | ≥ 80% | ⏳ 待实现 | test_flow_qa.sh |
| /flow-release | ≥ 80% | ⏳ 待实现 | test_flow_release.sh |

### 端到端测试

| 场景 | 当前状态 | 测试文件 |
|------|---------|---------|
| 完整工作流 | ⏳ 待实现 | test_full_workflow.sh |
| 中断恢复 | ⏳ 待实现 | test_interruption_recovery.sh |
| 质量闸验证 | ⏳ 待实现 | test_quality_gates.sh |

## 测试策略

### 单元测试 (scripts/)

**目标**: 测试每个脚本的独立功能

**策略**:
- 测试正常流程和边界情况
- 测试错误处理和恢复
- Mock 外部依赖 (Git, 文件系统)
- 每个函数至少一个测试用例

**示例**:
```bash
# 测试 get_repo_root 函数
test_get_repo_root_in_git_repo() {
    mock_git "rev-parse --show-toplevel" "/fake/repo"
    result=$(get_repo_root)
    assert_equals "$result" "/fake/repo"
}

test_get_repo_root_no_git() {
    mock_git "rev-parse --show-toplevel" "" "exit 1"
    result=$(get_repo_root)
    assert_contains "$result" ".claude"
}
```

### 集成测试 (commands/)

**目标**: 测试命令的完整执行流程

**策略**:
- 测试 Entry Gate 和 Exit Gate
- 测试命令之间的状态传递
- 测试错误场景和恢复
- 使用真实的脚本，Mock Git 和外部依赖

**示例**:
```bash
test_flow_init_creates_structure() {
    # Act
    /flow-init "REQ-123|Test Requirement"

    # Assert
    assert_file_exists "$REQ_DIR/orchestration_status.json"
    assert_file_exists "$REQ_DIR/EXECUTION_LOG.md"
    assert_json_valid "$(cat $REQ_DIR/orchestration_status.json)"
}
```

### 端到端测试 (e2e/)

**目标**: 测试完整的工作流场景

**策略**:
- 模拟真实的需求开发流程
- 测试多个命令的协作
- 验证最终产物的正确性
- 测试中断和恢复机制

**示例**:
```bash
test_full_workflow_simple_requirement() {
    # Arrange
    setup_mock_git_repo

    # Act - 执行完整流程
    /flow-init "REQ-123|Simple Feature"
    /flow-prd "REQ-123"
    /flow-epic "REQ-123"
    # ... (简化，实际测试会 mock 子代理输出)

    # Assert
    assert_file_exists "$REQ_DIR/PRD.md"
    assert_file_exists "$REQ_DIR/EPIC.md"
    assert_file_exists "$REQ_DIR/TASKS.md"
}
```

## CI/CD 集成

### GitHub Actions 配置

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: .claude/tests/run-all-tests.sh
      - name: Generate coverage report
        run: .claude/tests/run-all-tests.sh --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## 最佳实践

### 1. 测试隔离

- 每个测试使用独立的临时目录
- 不依赖外部状态或全局变量
- 清理所有临时文件

### 2. Mock 外部依赖

- Mock Git 命令避免修改真实仓库
- Mock 文件系统操作避免副作用
- Mock 网络请求避免依赖外部服务

### 3. 清晰的测试命名

- 使用 `test_<function>_<scenario>` 格式
- 描述测试的意图，而不是实现
- 使用 `describe` 添加人类可读的描述

### 4. 快速反馈

- 单元测试应该快速执行 (< 1秒/测试)
- 集成测试可以稍慢 (< 5秒/测试)
- 端到端测试可以更慢 (< 30秒/测试)

### 5. 可维护性

- 避免重复的测试代码
- 使用 fixture 和 helper 函数
- 保持测试简单和可读

---

**最后更新**: 2025-10-01
**状态**: ⏳ 测试框架开发中