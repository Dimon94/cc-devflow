# 标准模式和最佳实践规则

## 概述

cc-devflow 系统中的所有命令、脚本和子代理都应遵循统一的设计原则和最佳实践，确保系统的一致性、可靠性和用户体验。

## 核心设计原则

### 1. 快速失败 (Fail Fast)
**原则**: 在问题最早发现的地方立即失败，而不是让错误传播。

```bash
# ✅ 好的做法 - 立即检查关键前置条件
check_prerequisites() {
    # 检查必要工具
    if ! command -v git >/dev/null 2>&1; then
        echo "❌ Git 未安装"
        exit 1
    fi

    # 检查工作目录
    if [ ! -d ".git" ]; then
        echo "❌ 不是 Git 仓库"
        exit 1
    fi

    # 检查权限
    if [ ! -w "." ]; then
        echo "❌ 没有写入权限"
        exit 1
    fi
}

# ❌ 错误做法 - 延迟错误检查
process_without_check() {
    # 大量处理...
    # 到最后才发现基础条件不满足
    git add .  # 这时才发现 git 不存在
}
```

### 2. 信任系统 (Trust the System)
**原则**: 相信系统和工具的默认行为，避免过度验证。

```bash
# ✅ 好的做法 - 相信工具的默认行为
run_tests() {
    npm test  # 相信 npm 会正确执行测试
    if [ $? -ne 0 ]; then
        echo "❌ 测试失败"
        return 1
    fi
}

# ❌ 错误做法 - 过度验证
over_validate() {
    # 检查 npm 是否存在
    if ! command -v npm; then exit 1; fi
    # 检查 package.json 是否存在
    if [ ! -f package.json ]; then exit 1; fi
    # 检查 test 脚本是否存在
    if ! grep -q '"test"' package.json; then exit 1; fi
    # 检查 node_modules 是否存在
    if [ ! -d node_modules ]; then exit 1; fi
    # 最后才运行测试
    npm test
}
```

### 3. 清晰错误 (Clear Errors)
**原则**: 提供精确、可操作的错误消息。

```bash
# ✅ 好的做法 - 清晰的错误消息
validate_requirement_id() {
    local req_id="$1"

    if [ -z "$req_id" ]; then
        echo "❌ 需求ID不能为空"
        echo "   用法: /flow-new \"REQ-123|标题|URL\""
        return 1
    fi

    if ! echo "$req_id" | grep -q "^REQ-[0-9]\+$"; then
        echo "❌ 需求ID格式错误: $req_id"
        echo "   正确格式: REQ-123 (REQ- 前缀 + 数字)"
        echo "   示例: REQ-001, REQ-999"
        return 1
    fi
}

# ❌ 错误做法 - 模糊的错误消息
bad_validation() {
    local req_id="$1"
    if [ -z "$req_id" ] || ! echo "$req_id" | grep -q "^REQ-"; then
        echo "❌ 输入错误"  # 用户不知道具体哪里错了
        return 1
    fi
}
```

### 4. 最小输出 (Minimal Output)
**原则**: 只显示用户需要知道的信息，避免信息过载。

```bash
# ✅ 好的做法 - 简洁的成功输出
create_prd() {
    local req_id="$1"

    # 内部处理...
    # 生成 PRD
    # 验证格式
    # 保存文件

    echo "✅ PRD 已生成: .claude/docs/requirements/${req_id}/PRD.md"
}

# ❌ 错误做法 - 冗余的输出
verbose_create_prd() {
    echo "开始创建 PRD..."
    echo "检查模板..."
    echo "模板检查通过"
    echo "读取需求信息..."
    echo "需求信息读取完成"
    echo "生成 PRD 内容..."
    echo "PRD 内容生成完成"
    echo "验证 PRD 格式..."
    echo "格式验证通过"
    echo "保存 PRD 文件..."
    echo "PRD 文件保存完成"
    echo "✅ PRD 创建成功"
}
```

## 命令设计模式

### 1. 统一的命令结构
```bash
# 标准命令结构模板
command_template() {
    local operation="$1"
    local target="$2"
    local options="$3"

    # 1. 参数验证
    validate_parameters "$operation" "$target"

    # 2. 前置检查
    check_prerequisites

    # 3. 执行操作
    execute_operation "$operation" "$target" "$options"

    # 4. 后置处理
    post_process_results

    # 5. 状态反馈
    report_status
}
```

### 2. 错误处理模式
```bash
# 统一错误处理
handle_error() {
    local error_code="$1"
    local context="$2"

    case "$error_code" in
        1) echo "❌ 参数错误: $context" ;;
        2) echo "❌ 文件不存在: $context" ;;
        3) echo "❌ 权限不足: $context" ;;
        4) echo "❌ 网络错误: $context" ;;
        *) echo "❌ 未知错误 ($error_code): $context" ;;
    esac

    # 提供解决建议
    suggest_solution "$error_code"

    exit "$error_code"
}

suggest_solution() {
    local error_code="$1"

    case "$error_code" in
        1) echo "💡 检查命令参数格式" ;;
        2) echo "💡 确认文件路径是否正确" ;;
        3) echo "💡 检查文件/目录权限" ;;
        4) echo "💡 检查网络连接" ;;
    esac
}
```

### 3. 进度反馈模式
```bash
# 长时间操作的进度反馈
long_operation_with_feedback() {
    local total_steps="$1"
    local current_step=0

    echo "🚀 开始执行操作 (共 $total_steps 步)"

    while [ $current_step -lt $total_steps ]; do
        current_step=$((current_step + 1))

        case $current_step in
            1) echo "📋 步骤 $current_step/$total_steps: 准备环境..." ;;
            2) echo "🔍 步骤 $current_step/$total_steps: 验证配置..." ;;
            3) echo "⚙️  步骤 $current_step/$total_steps: 执行操作..." ;;
            *) echo "🔄 步骤 $current_step/$total_steps: 处理中..." ;;
        esac

        # 执行实际操作
        perform_step "$current_step"

        # 检查是否需要中断
        if [ $? -ne 0 ]; then
            echo "❌ 步骤 $current_step 失败，操作中断"
            return 1
        fi
    done

    echo "✅ 操作完成"
}
```

## 状态指示器标准

### 状态符号定义
```bash
# 状态符号常量
readonly STATUS_SUCCESS="✅"
readonly STATUS_ERROR="❌"
readonly STATUS_WARNING="⚠️"
readonly STATUS_INFO="ℹ️"
readonly STATUS_WORKING="🔄"
readonly STATUS_WAITING="⏳"
readonly STATUS_LOCKED="🔒"
readonly STATUS_UNLOCKED="🔓"

# 操作符号
readonly OP_CREATE="📝"
readonly OP_UPDATE="📋"
readonly OP_DELETE="🗑️"
readonly OP_SEARCH="🔍"
readonly OP_BUILD="🔨"
readonly OP_TEST="🧪"
readonly OP_DEPLOY="🚀"
readonly OP_SECURITY="🔒"

# 使用示例
show_status() {
    local operation="$1"
    local status="$2"
    local message="$3"

    case "$status" in
        "success") echo "$STATUS_SUCCESS $message" ;;
        "error") echo "$STATUS_ERROR $message" ;;
        "warning") echo "$STATUS_WARNING $message" ;;
        "info") echo "$STATUS_INFO $message" ;;
        "working") echo "$STATUS_WORKING $message" ;;
    esac
}
```

### 输出格式化
```bash
# 格式化输出函数
format_output() {
    local type="$1"
    local title="$2"
    local content="$3"

    case "$type" in
        "section")
            echo ""
            echo "## $title"
            echo "$content"
            ;;
        "list")
            echo "$title:"
            echo "$content" | sed 's/^/  - /'
            ;;
        "code")
            echo "$title:"
            echo '```'
            echo "$content"
            echo '```'
            ;;
    esac
}

# 使用示例
show_requirement_summary() {
    local req_id="$1"

    format_output "section" "需求概览" "需求ID: $req_id"
    format_output "list" "生成的文件" "PRD.md
EPIC.md
TASK_001.md"
    format_output "code" "Git 分支" "feature/REQ-${req_id}-用户登录"
}
```

## 文件操作模式

### 1. 安全文件操作
```bash
# 安全的文件写入
safe_write_file() {
    local file_path="$1"
    local content="$2"

    # 检查目录
    local dir_path=$(dirname "$file_path")
    if [ ! -d "$dir_path" ]; then
        mkdir -p "$dir_path" || {
            echo "❌ 无法创建目录: $dir_path"
            return 1
        }
    fi

    # 备份现有文件
    if [ -f "$file_path" ]; then
        cp "$file_path" "${file_path}.backup" || {
            echo "❌ 无法创建备份"
            return 1
        }
    fi

    # 写入临时文件
    echo "$content" > "${file_path}.tmp" || {
        echo "❌ 无法写入临时文件"
        return 1
    }

    # 原子性移动
    mv "${file_path}.tmp" "$file_path" || {
        echo "❌ 文件写入失败"
        return 1
    fi

    echo "✅ 文件已保存: $file_path"
}
```

### 2. 模板处理模式
```bash
# 模板处理
process_template() {
    local template_file="$1"
    local output_file="$2"
    shift 2
    local variables=("$@")  # 变量数组

    if [ ! -f "$template_file" ]; then
        echo "❌ 模板文件不存在: $template_file"
        return 1
    fi

    local content=$(cat "$template_file")

    # 替换变量
    for var in "${variables[@]}"; do
        local key=$(echo "$var" | cut -d'=' -f1)
        local value=$(echo "$var" | cut -d'=' -f2-)
        content="${content//\{\{${key}\}\}/$value}"
    done

    # 保存结果
    safe_write_file "$output_file" "$content"
}

# 使用示例
generate_prd_from_template() {
    local req_id="$1"
    local title="$2"
    local owner="$3"

    process_template \
        ".claude/docs/templates/PRD_TEMPLATE.md" \
        ".claude/docs/requirements/${req_id}/PRD.md" \
        "REQ_ID=${req_id}" \
        "TITLE=${title}" \
        "OWNER=${owner}" \
        "DATE=$(date -u +%Y-%m-%d)"
}
```

## 并发处理模式

### 1. 文件锁机制
```bash
# 文件锁实现
acquire_lock() {
    local lock_file="$1"
    local timeout="${2:-30}"  # 默认30秒超时
    local wait_time=0

    while [ $wait_time -lt $timeout ]; do
        if (set -C; echo $$ > "$lock_file") 2>/dev/null; then
            return 0  # 成功获取锁
        fi

        sleep 1
        wait_time=$((wait_time + 1))
    done

    echo "❌ 获取锁超时: $lock_file"
    return 1
}

release_lock() {
    local lock_file="$1"
    rm -f "$lock_file"
}

# 使用锁保护关键操作
critical_operation() {
    local operation="$1"
    local lock_file="/tmp/ccdevflow_${operation}.lock"

    if acquire_lock "$lock_file"; then
        trap "release_lock '$lock_file'" EXIT

        # 执行关键操作
        perform_operation "$operation"

        release_lock "$lock_file"
        trap - EXIT
    else
        echo "❌ 操作被锁定，请稍后重试"
        return 1
    fi
}
```

### 2. 原子性操作
```bash
# 原子性事务模式
atomic_transaction() {
    local transaction_name="$1"
    local transaction_dir="/tmp/ccdevflow_${transaction_name}_$$"

    # 创建事务目录
    mkdir -p "$transaction_dir"

    # 记录回滚信息
    local rollback_file="${transaction_dir}/rollback.sh"
    echo "#!/bin/bash" > "$rollback_file"
    chmod +x "$rollback_file"

    # 执行事务操作
    if perform_transaction_steps "$transaction_dir" "$rollback_file"; then
        # 提交事务
        commit_transaction "$transaction_dir"
        echo "✅ 事务提交成功: $transaction_name"
    else
        # 回滚事务
        echo "❌ 事务失败，执行回滚: $transaction_name"
        "$rollback_file"
        cleanup_transaction "$transaction_dir"
        return 1
    fi

    cleanup_transaction "$transaction_dir"
}
```

## 配置管理模式

### 1. 配置读取
```bash
# 配置读取优先级：命令行 > 环境变量 > 配置文件 > 默认值
get_config_value() {
    local key="$1"
    local default_value="$2"
    local cli_value="$3"

    # 1. 命令行参数优先级最高
    if [ -n "$cli_value" ]; then
        echo "$cli_value"
        return
    fi

    # 2. 环境变量
    local env_value=$(eval "echo \$CCDEVFLOW_$(echo $key | tr '[:lower:]' '[:upper:]')")
    if [ -n "$env_value" ]; then
        echo "$env_value"
        return
    fi

    # 3. 配置文件
    if [ -f ".claude/settings.json" ]; then
        local config_value=$(jq -r ".${key} // empty" .claude/settings.json)
        if [ -n "$config_value" ] && [ "$config_value" != "null" ]; then
            echo "$config_value"
            return
        fi
    fi

    # 4. 默认值
    echo "$default_value"
}
```

### 2. 环境检测
```bash
# 智能环境检测
detect_environment() {
    local env_info=""

    # 检测 Git 仓库
    if git rev-parse --git-dir >/dev/null 2>&1; then
        local branch=$(git rev-parse --abbrev-ref HEAD)
        env_info="${env_info}Git分支: $branch\n"
    fi

    # 检测 Node.js 项目
    if [ -f "package.json" ]; then
        local project_name=$(jq -r '.name // "unknown"' package.json)
        env_info="${env_info}Node.js项目: $project_name\n"
    fi

    # 检测 Python 项目
    if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
        env_info="${env_info}Python项目检测\n"
    fi

    echo -e "$env_info"
}
```

## 日志记录模式

### 1. 结构化日志
```bash
# 结构化日志记录
log_event() {
    local level="$1"
    local component="$2"
    local message="$3"
    local context="$4"

    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local log_entry=$(jq -n \
        --arg timestamp "$timestamp" \
        --arg level "$level" \
        --arg component "$component" \
        --arg message "$message" \
        --arg context "$context" \
        '{
            timestamp: $timestamp,
            level: $level,
            component: $component,
            message: $message,
            context: $context
        }'
    )

    echo "$log_entry" >> ".claude/logs/system.log"

    # 同时输出到控制台
    case "$level" in
        "ERROR") echo "❌ [$component] $message" ;;
        "WARN")  echo "⚠️  [$component] $message" ;;
        "INFO")  echo "ℹ️  [$component] $message" ;;
        "DEBUG") [ "$DEBUG" = "1" ] && echo "🔍 [$component] $message" ;;
    esac
}
```

### 2. 性能监控
```bash
# 性能计时
time_operation() {
    local operation_name="$1"
    shift
    local command=("$@")

    local start_time=$(date +%s.%N)

    "${command[@]}"
    local exit_code=$?

    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc)

    log_event "INFO" "PERF" "Operation $operation_name completed in ${duration}s" "exit_code=$exit_code"

    return $exit_code
}
```

## 质量保证模式

### 1. 输入验证
```bash
# 全面的输入验证
validate_input() {
    local input_type="$1"
    local input_value="$2"

    case "$input_type" in
        "req_id")
            if ! echo "$input_value" | grep -qE "^REQ-[0-9]+$"; then
                echo "❌ 需求ID格式错误: $input_value"
                echo "   格式: REQ-数字 (例: REQ-123)"
                return 1
            fi
            ;;
        "branch_name")
            if ! echo "$input_value" | grep -qE "^[a-zA-Z0-9/_-]+$"; then
                echo "❌ 分支名包含非法字符: $input_value"
                return 1
            fi
            ;;
        "url")
            if ! echo "$input_value" | grep -qE "^https?://"; then
                echo "❌ URL格式错误: $input_value"
                return 1
            fi
            ;;
        "file_path")
            if echo "$input_value" | grep -q "\.\."; then
                echo "❌ 路径包含危险字符: $input_value"
                return 1
            fi
            ;;
    esac

    return 0
}
```

### 2. 输出验证
```bash
# 输出验证
validate_output() {
    local output_type="$1"
    local output_file="$2"

    case "$output_type" in
        "markdown")
            if ! grep -q "^#" "$output_file"; then
                echo "❌ Markdown文件缺少标题: $output_file"
                return 1
            fi
            ;;
        "yaml")
            if ! yq eval . "$output_file" >/dev/null 2>&1; then
                echo "❌ YAML文件格式错误: $output_file"
                return 1
            fi
            ;;
        "json")
            if ! jq empty "$output_file" 2>/dev/null; then
                echo "❌ JSON文件格式错误: $output_file"
                return 1
            fi
            ;;
    esac

    echo "✅ 输出验证通过: $output_file"
    return 0
}
```

## 最佳实践清单

### ✅ 命令设计清单
- [ ] 实现快速失败机制
- [ ] 提供清晰的错误消息
- [ ] 使用一致的状态指示器
- [ ] 最小化输出信息
- [ ] 支持详细模式 (--verbose)
- [ ] 包含帮助文档 (--help)
- [ ] 处理信号中断 (Ctrl+C)
- [ ] 记录操作日志

### ✅ 错误处理清单
- [ ] 定义明确的错误码
- [ ] 提供问题解决建议
- [ ] 记录错误上下文
- [ ] 支持错误恢复
- [ ] 避免错误传播

### ✅ 文件操作清单
- [ ] 使用原子性写入
- [ ] 创建备份文件
- [ ] 验证文件权限
- [ ] 处理并发访问
- [ ] 清理临时文件

### ✅ 性能优化清单
- [ ] 避免不必要的操作
- [ ] 使用缓存机制
- [ ] 并行化无关操作
- [ ] 监控操作时间
- [ ] 优化文件I/O

---

**指导原则**: 简单不是简单主义 - 有效处理核心场景，同时保持简洁性和用户信任。
