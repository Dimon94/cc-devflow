# CC-DevFlow 核心模式

> **类型**: 核心约定 (Core Conventions)
> **适用**: 所有命令、脚本和子代理
> **层级**: Rules Layer (最底层,技术实现细节)
> **前置**: 遵循 Constitution 原则

---

## 📐 四大核心原则

### 1. Fail Fast (快速失败)
**在问题最早发现的地方立即失败，而不是让错误传播**

```bash
# ✅ 立即检查关键前置条件
check_prerequisites() {
    if ! command -v git >/dev/null 2>&1; then
        echo "❌ Git 未安装"
        exit 1
    fi

    if [ ! -d ".git" ]; then
        echo "❌ 不是 Git 仓库"
        exit 1
    fi
}

# ❌ 延迟错误检查 (在大量处理后才发现基础条件不满足)
```

### 2. Trust the System (信任系统)
**相信系统和工具的默认行为，避免过度验证**

```bash
# ✅ 相信工具的默认行为
run_tests() {
    npm test
    if [ $? -ne 0 ]; then
        echo "❌ 测试失败"
        return 1
    fi
}

# ❌ 过度验证 (检查npm/package.json/node_modules是否存在)
```

### 3. Clear Errors (清晰错误)
**提供精确、可操作的错误消息**

```bash
# ✅ 清晰的错误消息
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
```

### 4. Minimal Output (最小输出)
**只显示用户需要知道的信息，避免信息过载**

```bash
# ✅ 简洁的成功输出
create_prd() {
    # 内部处理...
    echo "✅ PRD 已生成: devflow/requirements/${req_id}/PRD.md"
}

# ❌ 冗余输出 (显示每个中间步骤: "开始创建...", "检查模板...", "模板检查通过"...)
```

---

## 🎯 命令设计模式

### 统一命令结构
```bash
command_template() {
    local operation="$1"
    local target="$2"

    # 1. 参数验证
    validate_parameters "$operation" "$target"

    # 2. 前置检查
    check_prerequisites

    # 3. 执行操作
    execute_operation "$operation" "$target"

    # 4. 后置处理
    post_process_results

    # 5. 状态反馈
    report_status
}
```

### 错误处理模式
```bash
handle_error() {
    local error_code="$1"
    local context="$2"

    case "$error_code" in
        1) echo "❌ 参数错误: $context" ;;
        2) echo "❌ 文件不存在: $context" ;;
        3) echo "❌ 权限不足: $context" ;;
        4) echo "❌ 网络错误: $context" ;;
    esac

    suggest_solution "$error_code"
    exit "$error_code"
}
```

### 进度反馈模式
```bash
long_operation_with_feedback() {
    local total_steps="$1"

    echo "🚀 开始执行操作 (共 $total_steps 步)"

    for current_step in $(seq 1 $total_steps); do
        echo "📋 步骤 $current_step/$total_steps: 处理中..."

        perform_step "$current_step" || {
            echo "❌ 步骤 $current_step 失败"
            return 1
        }
    done

    echo "✅ 操作完成"
}
```

---

## 📊 状态指示器标准

### 状态符号常量
```bash
readonly STATUS_SUCCESS="✅"
readonly STATUS_ERROR="❌"
readonly STATUS_WARNING="⚠️"
readonly STATUS_INFO="ℹ️"
readonly STATUS_WORKING="🔄"
readonly STATUS_WAITING="⏳"

readonly OP_CREATE="📝"
readonly OP_UPDATE="📋"
readonly OP_DELETE="🗑️"
readonly OP_SEARCH="🔍"
readonly OP_BUILD="🔨"
readonly OP_TEST="🧪"
readonly OP_DEPLOY="🚀"
```

### 输出格式化
```bash
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
```

---

## 📁 文件操作模式

### 安全文件写入
```bash
safe_write_file() {
    local file_path="$1"
    local content="$2"

    # 检查并创建目录
    local dir_path=$(dirname "$file_path")
    [ ! -d "$dir_path" ] && mkdir -p "$dir_path"

    # 备份现有文件
    [ -f "$file_path" ] && cp "$file_path" "${file_path}.backup"

    # 写入临时文件并原子性移动
    echo "$content" > "${file_path}.tmp"
    mv "${file_path}.tmp" "$file_path"

    echo "✅ 文件已保存: $file_path"
}
```

### 模板处理
```bash
process_template() {
    local template_file="$1"
    local output_file="$2"
    shift 2
    local variables=("$@")

    [ ! -f "$template_file" ] && {
        echo "❌ 模板文件不存在: $template_file"
        return 1
    }

    local content=$(cat "$template_file")

    # 替换变量 {{KEY}}
    for var in "${variables[@]}"; do
        local key=$(echo "$var" | cut -d'=' -f1)
        local value=$(echo "$var" | cut -d'=' -f2-)
        content="${content//\{\{${key}\}\}/$value}"
    done

    safe_write_file "$output_file" "$content"
}
```

---

## 🔒 并发处理模式

### 文件锁机制
```bash
acquire_lock() {
    local lock_file="$1"
    local timeout="${2:-30}"
    local wait_time=0

    while [ $wait_time -lt $timeout ]; do
        if (set -C; echo $$ > "$lock_file") 2>/dev/null; then
            return 0
        fi
        sleep 1
        wait_time=$((wait_time + 1))
    done

    echo "❌ 获取锁超时: $lock_file"
    return 1
}

release_lock() {
    rm -f "$1"
}

# 使用锁保护关键操作
critical_operation() {
    local lock_file="/tmp/ccdevflow_$1.lock"

    if acquire_lock "$lock_file"; then
        trap "release_lock '$lock_file'" EXIT
        perform_operation "$1"
        release_lock "$lock_file"
        trap - EXIT
    fi
}
```

---

## 🧪 参数验证模式

### 必需参数检查
```bash
require_parameter() {
    local param_name="$1"
    local param_value="$2"

    if [ -z "$param_value" ]; then
        echo "❌ 缺少必需参数: $param_name"
        return 1
    fi
}

# 使用示例
validate_flow_new_params() {
    require_parameter "REQ_ID" "$1" || return 1
    require_parameter "TITLE" "$2" || return 1
}
```

### 类型验证
```bash
validate_integer() {
    local value="$1"
    if ! echo "$value" | grep -qE '^[0-9]+$'; then
        echo "❌ 不是有效整数: $value"
        return 1
    fi
}

validate_url() {
    local url="$1"
    if ! echo "$url" | grep -qE '^https?://'; then
        echo "❌ 不是有效URL: $url"
        return 1
    fi
}
```

---

## 🔍 日志和调试模式

### 结构化日志
```bash
log_event() {
    local level="$1"    # INFO, WARN, ERROR
    local message="$2"
    local context="$3"

    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"

    if [ -n "$context" ]; then
        echo "  Context: $context" | tee -a "$LOG_FILE"
    fi
}

# 使用示例
log_event "INFO" "PRD生成完成" "REQ-123"
log_event "ERROR" "文件写入失败" "path=/tmp/test.md"
```

### 调试模式
```bash
# 启用调试输出
if [ "${DEBUG:-false}" = "true" ]; then
    set -x  # 显示命令执行
fi

debug_log() {
    [ "${DEBUG:-false}" = "true" ] && echo "🐛 DEBUG: $*"
}
```

---

## ⚙️ 配置管理模式

### 环境变量读取
```bash
get_config() {
    local key="$1"
    local default="$2"

    # 优先级: 环境变量 > 配置文件 > 默认值
    local value="${!key}"  # 读取环境变量

    if [ -z "$value" ] && [ -f ".claude/config.env" ]; then
        value=$(grep "^${key}=" .claude/config.env | cut -d'=' -f2-)
    fi

    echo "${value:-$default}"
}

# 使用示例
TIMEOUT=$(get_config "FLOW_TIMEOUT" "300")
```

---

## 📋 最佳实践清单

### 编写新命令时
- [ ] 遵循统一命令结构 (5步: 验证、检查、执行、处理、反馈)
- [ ] 使用四大核心原则 (Fail Fast, Trust System, Clear Errors, Minimal Output)
- [ ] 使用标准状态符号 (✅❌⚠️ℹ️)
- [ ] 提供可操作的错误消息
- [ ] 避免信息过载

### 编写脚本时
- [ ] 使用 `safe_write_file` 进行文件操作
- [ ] 关键操作使用文件锁保护
- [ ] 参数验证使用 `require_parameter`
- [ ] 结构化日志使用 `log_event`

### 处理并发时
- [ ] 使用文件锁避免竞态条件
- [ ] 设置合理的超时时间
- [ ] 正确清理锁文件 (使用 trap)

---

**注意**: 这些模式是 CC-DevFlow 特有的技术实现细节。所有质量标准、安全原则、架构约束已在 Constitution 中定义,不在此重复。
