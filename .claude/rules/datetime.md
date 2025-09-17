# 日期时间处理规则

## 概述

cc-devflow 系统中的所有日期时间操作都必须遵循统一的处理规则，确保时间信息的准确性和一致性。

## 核心原则

### 1. 始终使用真实系统时间
**必须从系统获取真实的当前日期时间，而不是估算或使用占位符**

```bash
# ✅ 正确做法 - 获取真实系统时间
get_current_timestamp() {
    # 使用 UTC 时间，ISO 8601 格式
    date -u +%Y-%m-%dT%H:%M:%SZ
}

# ❌ 错误做法 - 使用占位符或估算
use_placeholder_time() {
    echo "2024-01-01T00:00:00Z"  # 不要这样做
}

# ❌ 错误做法 - 手动估算时间
manual_estimate() {
    echo "大概是下午3点左右"  # 不要这样做
}
```

### 2. 标准时间格式
**优先使用 ISO 8601 格式: YYYY-MM-DDTHH:MM:SSZ**

```bash
# 标准时间格式函数
format_iso8601_utc() {
    date -u +%Y-%m-%dT%H:%M:%SZ
}

format_iso8601_local() {
    date +%Y-%m-%dT%H:%M:%S%z
}

# 文件名安全的时间格式
format_filename_safe() {
    date -u +%Y%m%d_%H%M%S
}

# 可读的时间格式
format_human_readable() {
    date -u "+%Y-%m-%d %H:%M:%S UTC"
}

# 使用示例
create_timestamped_file() {
    local content="$1"
    local timestamp=$(format_filename_safe)
    local filename="backup_${timestamp}.md"

    echo "$content" > "$filename"
    echo "✅ 文件已创建: $filename"
}
```

### 3. 跨平台兼容性
**支持 Linux、macOS 和 Windows 的时间获取**

```bash
# 跨平台时间获取
get_current_datetime_cross_platform() {
    local format="${1:-%Y-%m-%dT%H:%M:%SZ}"

    # 检测操作系统
    case "$(uname -s)" in
        Darwin)
            # macOS
            date -u +"$format"
            ;;
        Linux)
            # Linux
            date -u +"$format"
            ;;
        CYGWIN*|MINGW*|MSYS*)
            # Windows (Git Bash, MSYS2, etc.)
            date -u +"$format"
            ;;
        *)
            # 未知系统，尝试标准命令
            if command -v date >/dev/null 2>&1; then
                date -u +"$format"
            else
                echo "❌ 无法获取系统时间"
                return 1
            fi
            ;;
    esac
}

# 高精度时间戳（包含毫秒）
get_precise_timestamp() {
    if command -v python3 >/dev/null 2>&1; then
        python3 -c "from datetime import datetime; print(datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%fZ'))"
    elif command -v node >/dev/null 2>&1; then
        node -e "console.log(new Date().toISOString())"
    else
        # 后备方案
        get_current_datetime_cross_platform
    fi
}
```

## 文档前言中的时间处理

### Frontmatter 时间字段
```bash
# 更新文档前言中的时间字段
update_frontmatter_datetime() {
    local file_path="$1"
    local field_name="$2"
    local current_time=$(get_current_datetime_cross_platform)

    if [ ! -f "$file_path" ]; then
        echo "❌ 文件不存在: $file_path"
        return 1
    fi

    # 检查文件是否有 frontmatter
    if ! head -1 "$file_path" | grep -q "^---$"; then
        echo "❌ 文件没有 YAML frontmatter"
        return 1
    fi

    # 使用 yq 更新时间字段
    if command -v yq >/dev/null 2>&1; then
        yq eval ".${field_name} = \"${current_time}\"" -i "$file_path"
        echo "✅ 已更新 $field_name: $current_time"
    else
        # 后备方案：使用 sed 更新
        update_frontmatter_with_sed "$file_path" "$field_name" "$current_time"
    fi
}

# 使用 sed 更新 frontmatter（后备方案）
update_frontmatter_with_sed() {
    local file_path="$1"
    local field_name="$2"
    local new_value="$3"

    # 创建临时文件
    local temp_file=$(mktemp)

    # 检查字段是否存在
    if grep -q "^${field_name}:" "$file_path"; then
        # 更新现有字段
        sed "s/^${field_name}:.*/${field_name}: \"${new_value}\"/" "$file_path" > "$temp_file"
    else
        # 在 frontmatter 结束前添加字段
        awk -v field="$field_name" -v value="$new_value" '
        /^---$/ && NR > 1 { print field ": \"" value "\"" }
        { print }
        ' "$file_path" > "$temp_file"
    fi

    # 替换原文件
    mv "$temp_file" "$file_path"
    echo "✅ 已更新 $field_name: $new_value"
}

# 标准 frontmatter 时间字段
add_standard_timestamps() {
    local file_path="$1"
    local current_time=$(get_current_datetime_cross_platform)

    # 添加创建时间（如果不存在）
    if ! grep -q "^created:" "$file_path"; then
        update_frontmatter_datetime "$file_path" "created" "$current_time"
    fi

    # 总是更新修改时间
    update_frontmatter_datetime "$file_path" "updated" "$current_time"
}
```

### 文档生成时的时间处理
```bash
# 生成带时间戳的文档
generate_document_with_timestamp() {
    local template_file="$1"
    local output_file="$2"
    local req_id="$3"
    local title="$4"

    local current_time=$(get_current_datetime_cross_platform)
    local creation_date=$(date -u +%Y-%m-%d)

    # 处理模板变量
    sed "s/{{DATE}}/$creation_date/g; s/{{TIMESTAMP}}/$current_time/g; s/{{REQ_ID}}/$req_id/g; s/{{TITLE}}/$title/g" "$template_file" > "$output_file"

    # 添加标准时间戳
    add_standard_timestamps "$output_file"

    echo "✅ 文档已生成: $output_file"
}
```

## 日志记录中的时间处理

### 结构化日志时间
```bash
# 结构化日志记录
log_with_timestamp() {
    local level="$1"
    local component="$2"
    local message="$3"
    local context="$4"

    local timestamp=$(get_precise_timestamp)
    local log_file=".claude/logs/system.log"

    # 确保日志目录存在
    mkdir -p "$(dirname "$log_file")"

    # 创建结构化日志条目
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

    # 写入日志文件
    echo "$log_entry" >> "$log_file"

    # 控制台输出（带时间）
    local readable_time=$(date -d "$timestamp" "+%H:%M:%S" 2>/dev/null || echo "${timestamp: -8:8}")
    echo "[$readable_time] $level - $component: $message"
}

# 性能计时
time_operation() {
    local operation_name="$1"
    shift
    local command=("$@")

    local start_time=$(get_precise_timestamp)
    local start_epoch=$(date +%s.%N)

    echo "⏱️  开始操作: $operation_name ($start_time)"

    # 执行命令
    "${command[@]}"
    local exit_code=$?

    local end_time=$(get_precise_timestamp)
    local end_epoch=$(date +%s.%N)
    local duration=$(echo "$end_epoch - $start_epoch" | bc -l 2>/dev/null || echo "0")

    echo "⏱️  操作完成: $operation_name ($end_time) - 用时 ${duration}s"

    # 记录性能日志
    log_with_timestamp "INFO" "PERF" "Operation '$operation_name' completed in ${duration}s" "exit_code=$exit_code"

    return $exit_code
}
```

### 审计日志时间
```bash
# 审计日志记录
audit_log() {
    local action="$1"
    local resource="$2"
    local user="$3"
    local details="$4"

    local timestamp=$(get_precise_timestamp)
    local audit_file=".claude/logs/audit.log"

    # 确保审计日志目录存在
    mkdir -p "$(dirname "$audit_file")"

    # 创建审计日志条目
    local audit_entry=$(jq -n \
        --arg timestamp "$timestamp" \
        --arg action "$action" \
        --arg resource "$resource" \
        --arg user "$user" \
        --arg details "$details" \
        '{
            timestamp: $timestamp,
            action: $action,
            resource: $resource,
            user: $user,
            details: $details
        }'
    )

    echo "$audit_entry" >> "$audit_file"
    echo "📝 审计日志: $action on $resource by $user"
}
```

## Git 操作中的时间处理

### 提交时间信息
```bash
# Git 提交带时间信息
commit_with_timestamp() {
    local req_id="$1"
    local message="$2"
    local commit_time=$(get_current_datetime_cross_platform)

    # 构建提交消息
    local full_message="$message

Timestamp: $commit_time
Requirement: $req_id"

    git commit -m "$full_message"

    echo "✅ 提交完成 ($commit_time)"
}

# 获取 Git 提交时间
get_commit_timestamp() {
    local commit_hash="${1:-HEAD}"

    # 获取 ISO 8601 格式的提交时间
    git show -s --format="%aI" "$commit_hash"
}

# 分析提交历史时间
analyze_commit_timeline() {
    local req_id="$1"
    local output_file=".claude/docs/requirements/${req_id}/timeline.md"

    cat > "$output_file" << EOF
# 需求开发时间线

## 分析时间
$(get_current_datetime_cross_platform)

## 提交历史
$(git log --grep="$req_id" --oneline --format="%aI %h %s" | head -20)

## 开发统计
- 总提交数: $(git log --grep="$req_id" --oneline | wc -l)
- 开发周期: $(calculate_development_cycle "$req_id")
EOF

    echo "📊 时间线分析已生成: $output_file"
}
```

## 时区处理

### UTC 时间优先
```bash
# UTC 时间处理
convert_to_utc() {
    local local_time="$1"

    if command -v date >/dev/null 2>&1; then
        # 尝试转换为 UTC
        date -u -d "$local_time" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "$local_time"
    else
        echo "$local_time"
    fi
}

# 本地时间转换
convert_utc_to_local() {
    local utc_time="$1"
    local timezone="${2:-$(date +%Z)}"

    if command -v date >/dev/null 2>&1; then
        # 转换为本地时间
        date -d "$utc_time" "+%Y-%m-%d %H:%M:%S $timezone" 2>/dev/null || echo "$utc_time"
    else
        echo "$utc_time"
    fi
}

# 时区感知的时间显示
display_time_with_timezone() {
    local utc_time="$1"

    echo "UTC: $utc_time"

    # 显示常见时区
    local timezones=("America/New_York" "Europe/London" "Asia/Shanghai" "Asia/Tokyo")

    for tz in "${timezones[@]}"; do
        if command -v python3 >/dev/null 2>&1; then
            local local_time=$(python3 -c "
from datetime import datetime
import pytz
utc_dt = datetime.fromisoformat('$utc_time'.replace('Z', '+00:00'))
local_dt = utc_dt.astimezone(pytz.timezone('$tz'))
print(f'$tz: {local_dt.strftime(\"%Y-%m-%d %H:%M:%S\")}')
" 2>/dev/null)
            echo "$local_time"
        fi
    done
}
```

## 时间验证和解析

### 时间格式验证
```bash
# 验证 ISO 8601 格式
validate_iso8601() {
    local timestamp="$1"

    # 基本格式检查
    if echo "$timestamp" | grep -qE "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z?$"; then
        # 尝试解析验证
        if date -d "$timestamp" >/dev/null 2>&1; then
            return 0
        fi
    fi

    echo "❌ 时间格式无效: $timestamp"
    echo "   期望格式: YYYY-MM-DDTHH:MM:SSZ"
    return 1
}

# 解析相对时间
parse_relative_time() {
    local relative_time="$1"

    case "$relative_time" in
        "now")
            get_current_datetime_cross_platform
            ;;
        "1h ago"|"1 hour ago")
            date -u -d "1 hour ago" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null ||
            date -u -v-1H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null
            ;;
        "1d ago"|"1 day ago")
            date -u -d "1 day ago" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null ||
            date -u -v-1d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null
            ;;
        *)
            echo "❌ 不支持的相对时间: $relative_time"
            return 1
            ;;
    esac
}
```

### 时间计算
```bash
# 计算时间差
calculate_time_difference() {
    local start_time="$1"
    local end_time="$2"

    if command -v python3 >/dev/null 2>&1; then
        python3 -c "
from datetime import datetime
start = datetime.fromisoformat('$start_time'.replace('Z', '+00:00'))
end = datetime.fromisoformat('$end_time'.replace('Z', '+00:00'))
diff = end - start
print(f'{diff.total_seconds():.2f} seconds')
print(f'{diff.total_seconds()/60:.2f} minutes')
print(f'{diff.total_seconds()/3600:.2f} hours')
"
    else
        # 后备计算方案
        echo "需要 Python 3 来计算精确时间差"
    fi
}

# 时间范围检查
is_within_time_range() {
    local check_time="$1"
    local start_time="$2"
    local end_time="$3"

    if command -v python3 >/dev/null 2>&1; then
        python3 -c "
from datetime import datetime
check = datetime.fromisoformat('$check_time'.replace('Z', '+00:00'))
start = datetime.fromisoformat('$start_time'.replace('Z', '+00:00'))
end = datetime.fromisoformat('$end_time'.replace('Z', '+00:00'))
print('true' if start <= check <= end else 'false')
" 2>/dev/null | grep -q "true"
    else
        # 简单的字符串比较
        [[ "$check_time" > "$start_time" && "$check_time" < "$end_time" ]]
    fi
}
```

## 最佳实践

### ✅ 时间处理清单
- [ ] 始终使用系统真实时间
- [ ] 优先使用 UTC 时间
- [ ] 使用 ISO 8601 格式
- [ ] 考虑跨平台兼容性
- [ ] 验证时间格式正确性
- [ ] 记录时区信息（如需要）

### 🔧 工具函数库
```bash
# 时间工具函数集合
datetime_utils() {
    case "$1" in
        "now")
            get_current_datetime_cross_platform
            ;;
        "precise")
            get_precise_timestamp
            ;;
        "filename")
            format_filename_safe
            ;;
        "readable")
            format_human_readable
            ;;
        "validate")
            validate_iso8601 "$2"
            ;;
        *)
            echo "时间工具函数用法:"
            echo "  datetime_utils now      - 获取当前 UTC 时间"
            echo "  datetime_utils precise  - 获取高精度时间戳"
            echo "  datetime_utils filename - 获取文件名安全格式"
            echo "  datetime_utils readable - 获取可读格式"
            echo "  datetime_utils validate <time> - 验证时间格式"
            ;;
    esac
}
```

### 📋 常用时间格式
```bash
# 常用时间格式示例
show_time_formats() {
    local current_time=$(get_current_datetime_cross_platform)

    echo "时间格式示例 (当前时间):"
    echo "  ISO 8601 UTC: $current_time"
    echo "  文件名安全:   $(format_filename_safe)"
    echo "  可读格式:     $(format_human_readable)"
    echo "  Unix 时间戳:  $(date +%s)"
    echo "  毫秒时间戳:   $(date +%s%3N 2>/dev/null || echo $(date +%s)000)"
}
```

---

**关键原则**: 任何需要当前日期时间的命令都必须从系统获取真实时间，而不是估算或使用占位符。时间信息必须准确、一致且可跨平台使用。
