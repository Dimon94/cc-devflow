# 测试执行规则

## 概述

cc-devflow 系统中的所有测试操作都必须遵循统一的执行规则，确保测试结果的可靠性和一致性。

## 核心原则

### 1. 始终使用 qa-tester 子代理
**所有测试相关操作都必须通过 qa-tester 子代理执行**

```bash
# ✅ 正确做法 - 使用 qa-tester 子代理
execute_tests_via_agent() {
    local req_id="$1"
    local test_target="$2"

    echo "🧪 通过 qa-tester 子代理执行测试..."

    # 调用 qa-tester 子代理
    claude_task_call "qa-tester" "Execute tests for: $test_target

Requirements:
- Run with verbose output
- No mock services
- Capture full stack traces
- Analyze test structure if failures occur

Target: $test_target
Requirement ID: $req_id"
}

# ❌ 错误做法 - 直接执行测试
direct_test_execution() {
    npm test  # 绕过了子代理系统
}
```

### 2. 禁用模拟服务
**使用真实服务进行准确的测试结果**

```bash
# 测试环境配置
configure_test_environment() {
    echo "🔧 配置测试环境..."

    # 禁用所有模拟服务
    export DISABLE_MOCKS=true
    export USE_REAL_SERVICES=true
    export TEST_ENV=integration

    # 确保测试数据库可用
    if ! check_test_database_availability; then
        echo "❌ 测试数据库不可用"
        return 1
    fi

    # 确保外部服务可用
    if ! check_external_services; then
        echo "⚠️  外部服务不可用，某些测试可能失败"
    fi

    echo "✅ 测试环境配置完成"
}

# 检查测试数据库
check_test_database_availability() {
    local db_url="${TEST_DATABASE_URL:-postgresql://localhost:5432/test_db}"

    if command -v psql >/dev/null 2>&1; then
        if psql "$db_url" -c "SELECT 1" >/dev/null 2>&1; then
            return 0
        fi
    fi

    # 尝试启动测试数据库
    start_test_database

    return $?
}

# 检查外部服务
check_external_services() {
    local services_ok=true

    # 检查 Redis
    if ! redis-cli ping >/dev/null 2>&1; then
        echo "⚠️  Redis 服务不可用"
        services_ok=false
    fi

    # 检查其他依赖服务
    local required_services=("elasticsearch" "rabbitmq")
    for service in "${required_services[@]}"; do
        if ! check_service_health "$service"; then
            echo "⚠️  服务不可用: $service"
            services_ok=false
        fi
    done

    $services_ok
}
```

### 3. 详细输出捕获
**捕获完整的测试输出用于调试**

```bash
# 执行测试并捕获详细输出
execute_tests_with_verbose_output() {
    local test_target="$1"
    local req_id="$2"
    local output_file=".claude/docs/requirements/${req_id}/test-output.log"

    echo "🧪 执行测试: $test_target"

    # 创建输出目录
    mkdir -p "$(dirname "$output_file")"

    # 执行测试并捕获输出
    {
        echo "=== 测试执行开始 ==="
        echo "时间: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
        echo "目标: $test_target"
        echo "需求ID: $req_id"
        echo ""

        # 根据项目类型执行相应测试
        case "$test_target" in
            "unit")
                execute_unit_tests
                ;;
            "integration")
                execute_integration_tests
                ;;
            "e2e")
                execute_e2e_tests
                ;;
            "all")
                execute_unit_tests
                execute_integration_tests
                execute_e2e_tests
                ;;
            *)
                echo "❌ 未知的测试目标: $test_target"
                return 1
                ;;
        esac

        echo ""
        echo "=== 测试执行结束 ==="
        echo "时间: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

    } 2>&1 | tee "$output_file"

    # 分析测试结果
    analyze_test_results "$output_file"
}

# 执行单元测试
execute_unit_tests() {
    echo "🔬 执行单元测试..."

    if [ -f "package.json" ]; then
        # Node.js 项目
        if npm run test:unit >/dev/null 2>&1; then
            npm run test:unit -- --verbose --coverage
        elif npm run test >/dev/null 2>&1; then
            npm run test -- --verbose --coverage
        else
            echo "❌ 未找到测试脚本"
            return 1
        fi
    elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
        # Python 项目
        if command -v pytest >/dev/null 2>&1; then
            pytest -v --tb=long --cov=. --cov-report=term-missing
        else
            echo "❌ pytest 未安装"
            return 1
        fi
    else
        echo "❌ 未识别的项目类型"
        return 1
    fi
}

# 执行集成测试
execute_integration_tests() {
    echo "🔗 执行集成测试..."

    # 确保测试环境准备就绪
    if ! prepare_integration_environment; then
        echo "❌ 集成测试环境准备失败"
        return 1
    fi

    if [ -f "package.json" ]; then
        if npm run test:integration >/dev/null 2>&1; then
            npm run test:integration -- --verbose
        else
            echo "⚠️  未找到集成测试脚本"
        fi
    elif command -v pytest >/dev/null 2>&1; then
        pytest tests/integration/ -v --tb=long
    fi
}

# 执行端到端测试
execute_e2e_tests() {
    echo "🌐 执行端到端测试..."

    # 启动应用服务器
    if ! start_test_server; then
        echo "❌ 测试服务器启动失败"
        return 1
    fi

    if [ -f "package.json" ]; then
        if npm run test:e2e >/dev/null 2>&1; then
            npm run test:e2e -- --verbose
        elif command -v cypress >/dev/null 2>&1; then
            cypress run --spec "cypress/integration/**/*"
        else
            echo "⚠️  未找到 E2E 测试配置"
        fi
    fi

    # 清理测试服务器
    cleanup_test_server
}
```

### 4. 测试结构检查优先
**在假设代码问题之前，先检查测试结构**

```bash
# 分析测试失败
analyze_test_failures() {
    local test_output_file="$1"

    echo "🔍 分析测试失败原因..."

    # 检查测试结构问题
    if check_test_structure_issues "$test_output_file"; then
        echo "⚠️  发现测试结构问题，建议先修复测试"
        return 0
    fi

    # 检查环境问题
    if check_environment_issues "$test_output_file"; then
        echo "⚠️  发现环境配置问题"
        return 0
    fi

    # 检查依赖问题
    if check_dependency_issues "$test_output_file"; then
        echo "⚠️  发现依赖问题"
        return 0
    fi

    # 最后才考虑代码问题
    echo "🐛 可能存在代码问题，需要进一步调试"
    extract_code_issues "$test_output_file"
}

# 检查测试结构问题
check_test_structure_issues() {
    local output_file="$1"
    local issues_found=false

    # 检查常见测试结构问题
    if grep -q "Cannot find module" "$output_file"; then
        echo "❌ 测试结构问题: 模块导入错误"
        grep "Cannot find module" "$output_file" | head -5
        issues_found=true
    fi

    if grep -q "ReferenceError" "$output_file"; then
        echo "❌ 测试结构问题: 变量或函数未定义"
        grep "ReferenceError" "$output_file" | head -5
        issues_found=true
    fi

    if grep -q "Test suite failed to run" "$output_file"; then
        echo "❌ 测试结构问题: 测试套件配置错误"
        issues_found=true
    fi

    if grep -q "SyntaxError" "$output_file"; then
        echo "❌ 测试结构问题: 语法错误"
        grep "SyntaxError" "$output_file" | head -3
        issues_found=true
    fi

    $issues_found
}

# 检查环境问题
check_environment_issues() {
    local output_file="$1"
    local issues_found=false

    if grep -q "ECONNREFUSED" "$output_file"; then
        echo "❌ 环境问题: 服务连接被拒绝"
        issues_found=true
    fi

    if grep -q "ENOTFOUND" "$output_file"; then
        echo "❌ 环境问题: 域名解析失败"
        issues_found=true
    fi

    if grep -q "timeout" "$output_file"; then
        echo "❌ 环境问题: 操作超时"
        issues_found=true
    fi

    if grep -q "Permission denied" "$output_file"; then
        echo "❌ 环境问题: 权限不足"
        issues_found=true
    fi

    $issues_found
}
```

## 执行模式

### 标准执行流程
```bash
# 标准测试执行流程
standard_test_execution() {
    local req_id="$1"
    local test_target="${2:-all}"

    echo "🚀 开始标准测试执行流程"

    # 1. 环境准备
    if ! configure_test_environment; then
        echo "❌ 环境配置失败"
        return 1
    fi

    # 2. 清理之前的测试进程
    cleanup_previous_tests

    # 3. 执行测试
    local start_time=$(date +%s)
    execute_tests_with_verbose_output "$test_target" "$req_id"
    local test_exit_code=$?
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # 4. 生成测试报告
    generate_test_report "$req_id" "$test_target" "$test_exit_code" "$duration"

    # 5. 清理测试环境
    cleanup_test_environment

    return $test_exit_code
}

# 清理之前的测试进程
cleanup_previous_tests() {
    echo "🧹 清理之前的测试进程..."

    # 杀死可能残留的测试进程
    pkill -f "jest\|mocha\|pytest\|cypress" 2>/dev/null || true

    # 清理测试端口
    local test_ports=(3001 3002 3003 8080 8081)
    for port in "${test_ports[@]}"; do
        local pid=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$pid" ]; then
            echo "🔌 终止占用端口 $port 的进程: $pid"
            kill -TERM "$pid" 2>/dev/null || true
        fi
    done

    sleep 2  # 等待进程完全终止
}

# 生成测试报告
generate_test_report() {
    local req_id="$1"
    local test_target="$2"
    local exit_code="$3"
    local duration="$4"

    local report_file=".claude/docs/requirements/${req_id}/TEST_REPORT.md"

    cat > "$report_file" << EOF
# 测试报告

## 基本信息
- 需求ID: $req_id
- 测试目标: $test_target
- 执行时间: $(date -u +%Y-%m-%dT%H:%M:%SZ)
- 执行时长: ${duration}s
- 退出码: $exit_code

## 测试结果
$(format_test_results "$exit_code")

## 覆盖率报告
$(extract_coverage_info)

## 失败测试分析
$(analyze_failed_tests)

## 建议操作
$(generate_test_recommendations "$exit_code")
EOF

    echo "📋 测试报告已生成: $report_file"
}
```

### 输出焦点

#### 成功输出
```bash
# 简洁的成功输出
report_test_success() {
    local test_count="$1"
    local duration="$2"
    local coverage="$3"

    echo "✅ 所有测试通过 ($test_count 个测试，用时 ${duration}s)"

    if [ -n "$coverage" ]; then
        echo "📊 测试覆盖率: $coverage"
    fi
}
```

#### 失败输出
```bash
# 聚焦失败信息的输出
report_test_failures() {
    local failures_file="$1"

    echo "❌ 测试失败:"
    echo ""

    # 解析失败信息
    while IFS= read -r failure_line; do
        if echo "$failure_line" | grep -q "FAIL\|ERROR"; then
            local test_name=$(echo "$failure_line" | sed -E 's/.*FAIL.*//; s/.*ERROR.*//')
            local file_location=$(echo "$failure_line" | grep -oE "[^/]*\.spec\.[jt]s:[0-9]+")
            local error_message=$(extract_error_message "$failure_line")

            echo "$test_name - $file_location"
            echo "  错误: $error_message"
            echo "  修复建议: $(suggest_fix "$error_message")"
            echo ""
        fi
    done < "$failures_file"
}

# 建议修复方案
suggest_fix() {
    local error_message="$1"

    case "$error_message" in
        *"Cannot find module"*)
            echo "检查模块导入路径和依赖安装"
            ;;
        *"ReferenceError"*)
            echo "检查变量定义和作用域"
            ;;
        *"TypeError"*)
            echo "检查数据类型和函数调用"
            ;;
        *"timeout"*)
            echo "增加超时时间或优化异步操作"
            ;;
        *)
            echo "查看完整错误信息和堆栈跟踪"
            ;;
    esac
}
```

## 常见问题处理

### 问题诊断
```bash
# 常见测试问题诊断
diagnose_common_issues() {
    local output_file="$1"

    echo "🔍 诊断常见测试问题..."

    # 测试未找到
    if grep -q "No tests found" "$output_file"; then
        echo "❌ 问题: 未找到测试文件"
        echo "💡 解决方案: 检查测试文件路径和命名规范"
        return 1
    fi

    # 超时问题
    if grep -q "Timeout" "$output_file"; then
        echo "❌ 问题: 测试超时"
        echo "💡 解决方案: 增加超时设置或优化测试逻辑"
        cleanup_test_processes
        return 1
    fi

    # 框架缺失
    if grep -q "command not found" "$output_file"; then
        echo "❌ 问题: 测试框架未安装"
        echo "💡 解决方案: 安装依赖 - npm install 或 pip install -r requirements.txt"
        return 1
    fi

    return 0
}

# 清理测试进程
cleanup_test_processes() {
    echo "🧹 清理测试进程..."

    # 强制终止可能卡住的测试进程
    pkill -f "jest\|mocha\|pytest" 2>/dev/null || true

    # 清理可能的文件锁
    find . -name "*.lock" -delete 2>/dev/null || true

    echo "✅ 测试进程清理完成"
}
```

### 恢复策略
```bash
# 测试失败恢复策略
recover_from_test_failure() {
    local req_id="$1"
    local failure_type="$2"

    echo "🔧 执行测试失败恢复..."

    case "$failure_type" in
        "environment")
            echo "重新配置测试环境..."
            cleanup_test_environment
            configure_test_environment
            ;;
        "dependency")
            echo "重新安装依赖..."
            reinstall_dependencies
            ;;
        "process")
            echo "清理进程和重启..."
            cleanup_test_processes
            sleep 5
            ;;
        "structure")
            echo "需要手动修复测试结构"
            generate_structure_fix_guide "$req_id"
            return 1
            ;;
    esac

    echo "✅ 恢复完成，建议重新运行测试"
}
```

## 重要注意事项

### ✅ 必须遵循
- 所有测试都通过 qa-tester 子代理执行
- 不使用模拟服务，使用真实环境
- 每个测试必须完全执行完毕
- 失败时优先检查测试结构
- 捕获详细输出用于调试

### ❌ 禁止行为
- 不要并行化测试（避免冲突）
- 不要跳过失败的测试
- 不要忽略环境问题
- 不要使用过时的测试框架

### 🧹 清理要求
测试执行后必须清理：
```bash
# 标准清理流程
cleanup_after_tests() {
    echo "🧹 执行测试后清理..."

    # 终止测试相关进程
    pkill -f "jest|mocha|pytest" 2>/dev/null || true

    # 清理临时文件
    rm -rf /tmp/test-* 2>/dev/null || true

    # 重置测试数据库
    if [ -n "$TEST_DATABASE_URL" ]; then
        reset_test_database
    fi

    # 清理测试服务器
    cleanup_test_server

    echo "✅ 清理完成"
}
```

### 📊 报告要求
- 专注于失败信息，不要过度报告成功
- 提供可操作的修复建议
- 包含性能和覆盖率数据
- 记录环境和配置信息

---

**核心理念**: 每个测试都应该完全执行并产生可靠的结果，失败时提供清晰的指导。
