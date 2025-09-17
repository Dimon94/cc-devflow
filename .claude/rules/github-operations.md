# GitHub 操作规则

## 概述

cc-devflow 系统与 GitHub 的所有交互都必须遵循统一的操作规则，确保安全性、一致性和可靠性。

## 关键原则

### 1. 仓库保护检查
**在执行任何创建/修改 Issues 或 PRs 的操作之前，必须进行仓库保护检查**

```bash
# 仓库保护检查 - 防止在模板仓库上进行写操作
check_repository_protection() {
    local operation="$1"

    echo "🔍 检查仓库保护状态..."

    # 获取远程仓库信息
    local remote_url=$(git config --get remote.origin.url)
    if [ -z "$remote_url" ]; then
        echo "❌ 未找到远程仓库配置"
        return 1
    fi

    # 提取仓库名称
    local repo_name=$(echo "$remote_url" | sed -E 's|.*[:/]([^/]+/[^/]+)\.git.*|\1|' | sed 's/\.git$//')

    # 检查是否为模板仓库
    if gh api "repos/$repo_name" --jq '.is_template' 2>/dev/null | grep -q "true"; then
        echo "❌ 禁止在模板仓库上执行写操作: $operation"
        echo "   仓库: $repo_name"
        echo "   这是一个模板仓库，不应该直接修改"
        echo ""
        echo "💡 解决方案:"
        echo "   1. 从模板创建新仓库"
        echo "   2. 在新仓库中执行操作"
        return 1
    fi

    # 检查是否为只读仓库
    if gh api "repos/$repo_name" --jq '.permissions.push' 2>/dev/null | grep -q "false"; then
        echo "❌ 没有推送权限: $repo_name"
        echo "   操作: $operation"
        return 1
    fi

    echo "✅ 仓库保护检查通过"
    return 0
}

# 必须在所有写操作前调用
require_repo_protection_check() {
    local operation="$1"

    case "$operation" in
        "gh issue create"|"gh issue edit"|"gh issue comment"|"gh pr create"|"gh pr edit"|"gh pr comment"|"gh pr merge")
            if ! check_repository_protection "$operation"; then
                exit 1
            fi
            ;;
    esac
}
```

### 2. 身份验证处理
**不预先检查认证状态，直接运行命令并处理失败**

```bash
# GitHub 认证检查和处理
handle_github_auth() {
    local command="$1"
    shift
    local args=("$@")

    echo "🔑 执行 GitHub 操作: $command"

    # 直接执行命令
    if gh "$command" "${args[@]}"; then
        return 0
    else
        local exit_code=$?

        # 分析失败原因
        case $exit_code in
            4)
                echo "❌ GitHub 操作失败: 认证问题"
                echo "💡 解决方案: 运行 'gh auth login' 重新认证"
                ;;
            1)
                echo "❌ GitHub 操作失败: 一般错误"
                echo "💡 检查命令参数和网络连接"
                ;;
            *)
                echo "❌ GitHub 操作失败 (退出码: $exit_code)"
                ;;
        esac

        return $exit_code
    fi
}
```

### 3. 标准操作模式

#### 获取 Issue 详情
```bash
# 获取 Issue 详细信息
get_issue_details() {
    local issue_number="$1"

    if [ -z "$issue_number" ]; then
        echo "❌ Issue 编号不能为空"
        return 1
    fi

    echo "📋 获取 Issue #$issue_number 详情..."

    handle_github_auth "issue" "view" "$issue_number" "--json" "title,body,state,assignees,labels,createdAt"
}
```

#### 创建 Issue
```bash
# 创建 Issue
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"
    local assignees="$4"

    require_repo_protection_check "gh issue create"

    if [ -z "$title" ]; then
        echo "❌ Issue 标题不能为空"
        return 1
    fi

    echo "📝 创建 Issue: $title"

    local cmd_args=("--title" "$title")

    if [ -n "$body" ]; then
        cmd_args+=("--body" "$body")
    fi

    if [ -n "$labels" ]; then
        cmd_args+=("--label" "$labels")
    fi

    if [ -n "$assignees" ]; then
        cmd_args+=("--assignee" "$assignees")
    fi

    handle_github_auth "issue" "create" "${cmd_args[@]}"
}
```

#### 更新 Issue
```bash
# 更新 Issue
update_issue() {
    local issue_number="$1"
    local field="$2"
    local value="$3"

    require_repo_protection_check "gh issue edit"

    if [ -z "$issue_number" ] || [ -z "$field" ]; then
        echo "❌ Issue 编号和字段不能为空"
        return 1
    fi

    echo "📝 更新 Issue #$issue_number: $field"

    case "$field" in
        "title")
            handle_github_auth "issue" "edit" "$issue_number" "--title" "$value"
            ;;
        "body")
            handle_github_auth "issue" "edit" "$issue_number" "--body" "$value"
            ;;
        "state")
            if [ "$value" = "closed" ]; then
                handle_github_auth "issue" "close" "$issue_number"
            elif [ "$value" = "open" ]; then
                handle_github_auth "issue" "reopen" "$issue_number"
            else
                echo "❌ 无效的状态值: $value (支持: open, closed)"
                return 1
            fi
            ;;
        "labels")
            handle_github_auth "issue" "edit" "$issue_number" "--add-label" "$value"
            ;;
        *)
            echo "❌ 不支持的字段: $field"
            return 1
            ;;
    esac
}
```

#### 添加评论
```bash
# 添加评论到 Issue 或 PR
add_comment() {
    local type="$1"        # issue 或 pr
    local number="$2"
    local comment="$3"

    require_repo_protection_check "gh ${type} comment"

    if [ -z "$number" ] || [ -z "$comment" ]; then
        echo "❌ 编号和评论内容不能为空"
        return 1
    fi

    echo "💬 添加评论到 ${type} #$number"

    handle_github_auth "$type" "comment" "$number" "--body" "$comment"
}
```

#### 创建 Pull Request
```bash
# 创建 Pull Request
create_pull_request() {
    local title="$1"
    local body="$2"
    local base_branch="${3:-main}"
    local head_branch="$4"

    require_repo_protection_check "gh pr create"

    if [ -z "$title" ]; then
        echo "❌ PR 标题不能为空"
        return 1
    fi

    # 如果未指定 head 分支，使用当前分支
    if [ -z "$head_branch" ]; then
        head_branch=$(git rev-parse --abbrev-ref HEAD)
    fi

    echo "🔀 创建 Pull Request: $title"
    echo "   从 $head_branch 到 $base_branch"

    # 确保当前分支已推送
    if ! git ls-remote --heads origin "$head_branch" | grep -q "$head_branch"; then
        echo "📤 推送当前分支到远程..."
        git push -u origin "$head_branch"
    fi

    local cmd_args=("--title" "$title" "--base" "$base_branch" "--head" "$head_branch")

    if [ -n "$body" ]; then
        cmd_args+=("--body" "$body")
    fi

    handle_github_auth "pr" "create" "${cmd_args[@]}"
}
```

#### 合并 Pull Request
```bash
# 合并 Pull Request
merge_pull_request() {
    local pr_number="$1"
    local merge_method="${2:-squash}"  # squash, merge, rebase
    local delete_branch="${3:-true}"

    require_repo_protection_check "gh pr merge"

    if [ -z "$pr_number" ]; then
        echo "❌ PR 编号不能为空"
        return 1
    fi

    echo "🔀 合并 Pull Request #$pr_number (方法: $merge_method)"

    # 检查 PR 状态
    local pr_state=$(gh pr view "$pr_number" --json state --jq .state)
    if [ "$pr_state" != "OPEN" ]; then
        echo "❌ PR 状态不是 OPEN: $pr_state"
        return 1
    fi

    # 检查 CI 状态
    local ci_status=$(gh pr checks "$pr_number" --json state --jq '.[].state' | sort -u)
    if echo "$ci_status" | grep -q "FAILURE\|ERROR"; then
        echo "❌ CI 检查失败，无法合并"
        echo "💡 检查 CI 状态: gh pr checks $pr_number"
        return 1
    fi

    local cmd_args=()

    case "$merge_method" in
        "squash")
            cmd_args+=("--squash")
            ;;
        "merge")
            cmd_args+=("--merge")
            ;;
        "rebase")
            cmd_args+=("--rebase")
            ;;
        *)
            echo "❌ 无效的合并方法: $merge_method"
            return 1
            ;;
    esac

    if [ "$delete_branch" = "true" ]; then
        cmd_args+=("--delete-branch")
    fi

    handle_github_auth "pr" "merge" "$pr_number" "${cmd_args[@]}"
}
```

### 4. 批量操作

```bash
# 批量处理 Issues
batch_process_issues() {
    local action="$1"
    local filter="$2"
    shift 2
    local args=("$@")

    echo "📊 批量处理 Issues: $action"

    # 获取 Issues 列表
    local issues=$(gh issue list --json number,title --jq '.[] | select(.title | contains("'"$filter"'")) | .number')

    if [ -z "$issues" ]; then
        echo "ℹ️  没有找到匹配的 Issues"
        return 0
    fi

    echo "找到 $(echo "$issues" | wc -l) 个匹配的 Issues"

    # 确认操作
    echo "Issues 列表:"
    echo "$issues" | while read -r issue_num; do
        local title=$(gh issue view "$issue_num" --json title --jq .title)
        echo "  - #$issue_num: $title"
    done

    read -p "确认执行批量操作 '$action'? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "ℹ️  操作已取消"
        return 0
    fi

    # 执行批量操作
    echo "$issues" | while read -r issue_num; do
        case "$action" in
            "close")
                echo "🔒 关闭 Issue #$issue_num"
                handle_github_auth "issue" "close" "$issue_num"
                ;;
            "label")
                echo "🏷️  添加标签到 Issue #$issue_num"
                handle_github_auth "issue" "edit" "$issue_num" "--add-label" "${args[0]}"
                ;;
            "assign")
                echo "👤 分配 Issue #$issue_num"
                handle_github_auth "issue" "edit" "$issue_num" "--add-assignee" "${args[0]}"
                ;;
            *)
                echo "❌ 不支持的批量操作: $action"
                return 1
                ;;
        esac

        sleep 1  # 避免 API 限流
    done

    echo "✅ 批量操作完成"
}
```

### 5. 状态检查和监控

```bash
# 检查仓库健康状态
check_repository_health() {
    echo "🏥 检查仓库健康状态..."

    # 检查基本信息
    local repo_info=$(handle_github_auth "repo" "view" "--json" "name,description,defaultBranch,visibility,isPrivate")

    if [ $? -ne 0 ]; then
        echo "❌ 无法获取仓库信息"
        return 1
    fi

    echo "📊 仓库信息:"
    echo "$repo_info" | jq -r '"名称: \(.name)\n描述: \(.description // "无")\n默认分支: \(.defaultBranch)\n可见性: \(.visibility)"'

    # 检查分支保护规则
    echo ""
    echo "🛡️  检查分支保护规则..."
    local default_branch=$(echo "$repo_info" | jq -r '.defaultBranch')

    if gh api "repos/:owner/:repo/branches/$default_branch/protection" >/dev/null 2>&1; then
        echo "✅ 主分支已设置保护规则"
    else
        echo "⚠️  主分支未设置保护规则"
    fi

    # 检查 PR 和 Issue 模板
    echo ""
    echo "📝 检查模板文件..."

    local templates_found=0
    for template in ".github/PULL_REQUEST_TEMPLATE.md" ".github/ISSUE_TEMPLATE.md" ".github/issue_template.md"; do
        if [ -f "$template" ]; then
            echo "✅ 找到模板: $template"
            templates_found=$((templates_found + 1))
        fi
    done

    if [ $templates_found -eq 0 ]; then
        echo "⚠️  未找到 PR 或 Issue 模板"
    fi

    # 检查 Actions 工作流
    echo ""
    echo "🔄 检查 GitHub Actions..."
    local workflow_count=$(find .github/workflows -name "*.yml" -o -name "*.yaml" 2>/dev/null | wc -l)

    if [ "$workflow_count" -gt 0 ]; then
        echo "✅ 找到 $workflow_count 个工作流文件"
    else
        echo "ℹ️  未设置 GitHub Actions 工作流"
    fi

    echo ""
    echo "✅ 仓库健康检查完成"
}
```

### 6. 错误处理和恢复

```bash
# GitHub 操作错误处理
handle_github_error() {
    local operation="$1"
    local error_code="$2"
    local error_message="$3"

    echo "❌ GitHub 操作失败: $operation"

    case "$error_code" in
        1)
            echo "💡 常见解决方案:"
            echo "   - 检查网络连接"
            echo "   - 验证仓库权限"
            echo "   - 确认参数格式正确"
            ;;
        4)
            echo "💡 认证解决方案:"
            echo "   - 运行: gh auth login"
            echo "   - 检查 Personal Access Token"
            echo "   - 验证仓库访问权限"
            ;;
        22)
            echo "💡 HTTP 422 错误:"
            echo "   - 检查请求参数"
            echo "   - 可能是重复操作"
            echo "   - 验证数据格式"
            ;;
        *)
            echo "💡 通用解决方案:"
            echo "   - 检查 GitHub CLI 版本: gh version"
            echo "   - 查看详细错误: gh <command> --help"
            echo "   - 检查 GitHub 服务状态"
            ;;
    esac

    # 记录错误
    log_github_error "$operation" "$error_code" "$error_message"
}

# 记录 GitHub 错误
log_github_error() {
    local operation="$1"
    local error_code="$2"
    local error_message="$3"
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    local log_entry=$(jq -n \
        --arg timestamp "$timestamp" \
        --arg operation "$operation" \
        --arg error_code "$error_code" \
        --arg error_message "$error_message" \
        '{
            timestamp: $timestamp,
            type: "github_error",
            operation: $operation,
            error_code: $error_code,
            error_message: $error_message
        }'
    )

    echo "$log_entry" >> ".claude/logs/github-errors.log"
}
```

### 7. 最佳实践

#### API 使用优化
```bash
# 使用 --json 获取结构化输出
get_structured_data() {
    local command="$1"
    local fields="$2"
    shift 2
    local args=("$@")

    handle_github_auth "$command" "${args[@]}" "--json" "$fields"
}

# 缓存常用数据
cache_repo_info() {
    local cache_file=".claude/cache/repo-info.json"
    local cache_ttl=3600  # 1小时

    # 检查缓存是否有效
    if [ -f "$cache_file" ]; then
        local cache_time=$(stat -f %m "$cache_file" 2>/dev/null || stat -c %Y "$cache_file" 2>/dev/null)
        local current_time=$(date +%s)

        if [ $((current_time - cache_time)) -lt $cache_ttl ]; then
            cat "$cache_file"
            return
        fi
    fi

    # 获取新数据并缓存
    mkdir -p "$(dirname "$cache_file")"
    if handle_github_auth "repo" "view" "--json" "name,owner,defaultBranch,visibility" > "$cache_file"; then
        cat "$cache_file"
    fi
}
```

#### 速率限制处理
```bash
# 检查 API 速率限制
check_rate_limit() {
    local rate_limit_info=$(gh api rate_limit --jq '.rate')

    local remaining=$(echo "$rate_limit_info" | jq -r '.remaining')
    local limit=$(echo "$rate_limit_info" | jq -r '.limit')
    local reset_time=$(echo "$rate_limit_info" | jq -r '.reset')

    echo "📊 GitHub API 使用情况: $remaining/$limit"

    if [ "$remaining" -lt 100 ]; then
        local reset_date=$(date -r "$reset_time" "+%H:%M:%S")
        echo "⚠️  API 速率限制即将达到，将在 $reset_date 重置"

        if [ "$remaining" -lt 10 ]; then
            echo "❌ API 速率限制不足，请稍后重试"
            return 1
        fi
    fi

    return 0
}
```

## 重要注意事项

### 🔒 安全要求
- **始终**在写操作前检查远程仓库来源
- 相信 gh CLI 已安装和认证
- 使用 `--json` 获取结构化输出用于解析
- 保持操作原子性 - 一个 gh 命令完成一个动作
- 不要预检查速率限制

### 📋 操作清单
在执行 GitHub 写操作前必须确认：
- [ ] 已执行仓库保护检查
- [ ] 确认操作权限
- [ ] 验证目标分支/Issue/PR 存在
- [ ] 检查 CI 状态（PR 合并时）

### 🚫 禁止操作
- 在模板仓库上创建 Issues 或 PRs
- 在没有推送权限的仓库上执行写操作
- 自动重试失败的认证操作
- 忽略 CI 失败强制合并 PR

---

**重要提醒**: GitHub 操作规则是保护代码仓库安全的重要防线，必须严格遵循。
