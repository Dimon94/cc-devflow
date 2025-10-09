# Git & GitHub 操作指南

> **类型**: 技术操作指南 (Technical Guide)
> **适用**: 所有Git分支管理和GitHub平台交互操作
> **前置规则**: 遵循 Constitution 和 Core Patterns

---

## 📋 指南概述

本指南整合了Git分支管理和GitHub平台交互的所有操作规范，确保代码管理的一致性、可追踪性和安全性。

---

## 🌿 Git 分支管理

### 分支命名规范

```bash
# 需求功能分支
feature/REQ-{id}-{title-slug}
例如: feature/REQ-123-支持用户下单

# Epic 分支 (大型功能)
epic/REQ-{id}-{epic-name-slug}
例如: epic/REQ-100-用户管理系统

# 修复分支
fix/REQ-{id}-{issue-slug}
例如: fix/REQ-125-修复支付bug

# 热修复分支
hotfix/REQ-{id}-{critical-issue-slug}
例如: hotfix/REQ-130-修复安全漏洞
```

**分支类型定义**:
- `feature/`: 新功能开发
- `epic/`: 大型功能集合
- `fix/`: Bug 修复
- `hotfix/`: 生产环境紧急修复
- `docs/`: 文档更新
- `refactor/`: 代码重构

### 分支创建前检查

```bash
# 分支创建前的必要检查
pre_branch_check() {
    local req_id="$1"
    local title="$2"
    local branch_type="${3:-feature}"

    echo "🔍 执行分支创建前检查..."

    # 1. 检查工作目录状态
    if ! git diff --quiet; then
        echo "❌ 工作目录有未提交的更改，请先提交或暂存"
        git status --porcelain
        return 1
    fi

    # 2. 检查是否在主分支
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$current_branch" != "main" ] && [ "$current_branch" != "master" ]; then
        echo "❌ 当前不在主分支，当前分支: $current_branch"
        return 1
    fi

    # 3. 检查分支是否已存在
    local branch_name="${branch_type}/REQ-${req_id}-$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9\-]//g')"
    if git show-ref --verify --quiet "refs/heads/$branch_name"; then
        echo "❌ 分支已存在: $branch_name"
        return 1
    fi

    # 4. 更新主分支
    git fetch origin
    git merge --ff-only origin/main

    echo "✅ 分支创建前检查通过"
    return 0
}
```

### 标准分支创建流程

```bash
# 创建需求分支
create_requirement_branch() {
    local req_id="$1"
    local title="$2"
    local branch_type="${3:-feature}"

    # 执行前置检查
    if ! pre_branch_check "$req_id" "$title" "$branch_type"; then
        return 1
    fi

    # 生成分支名
    local branch_name="${branch_type}/REQ-${req_id}-$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9\-]//g')"

    echo "🌿 创建分支: $branch_name"

    # 创建并切换到新分支
    if git checkout -b "$branch_name"; then
        echo "✅ 分支创建成功"

        # 创建分支信息文件
        create_branch_info "$req_id" "$title" "$branch_name"

        # 推送到远程
        git push -u origin "$branch_name"
    else
        echo "❌ 分支创建失败"
        return 1
    fi
}
```

### 提交规范

**提交消息格式**:
```bash
{type}({req_id}): {description} - {details}

# 例如:
feat(REQ-123): 实现用户登录接口 - 添加JWT认证和密码加密
fix(REQ-124): 修复订单状态更新bug - 处理并发更新冲突
docs(REQ-125): 更新API文档 - 添加新增接口的说明
```

**提交类型**:
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建、配置等杂务

**标准提交函数**:
```bash
commit_with_standard() {
    local req_id="$1"
    local type="$2"
    local description="$3"
    local details="$4"

    # 验证提交类型
    case "$type" in
        feat|fix|docs|style|refactor|test|chore)
            ;;
        *)
            echo "❌ 无效的提交类型: $type"
            return 1
            ;;
    esac

    # 构建提交消息
    local commit_msg="${type}(${req_id}): ${description}"
    if [ -n "$details" ]; then
        commit_msg="${commit_msg} - ${details}"
    fi

    # 执行提交
    git commit -m "$commit_msg"
}
```

### 分支同步

```bash
# 与主分支同步
sync_with_main() {
    echo "🔄 与主分支同步..."

    # 获取最新的主分支
    git fetch origin main

    # 尝试合并
    if git merge origin/main; then
        echo "✅ 同步完成，无冲突"
        return 0
    else
        echo "⚠️  检测到冲突，需要手动解决"
        echo "冲突文件:"
        git diff --name-only --diff-filter=U
        return 1
    fi
}
```

### 分支清理

```bash
# 清理已合并的分支
cleanup_merged_branches() {
    echo "🧹 清理已合并的分支..."

    # 获取已合并的分支列表
    local merged_branches=$(git branch --merged main | grep -E "feature/|fix/|epic/")

    if [ -z "$merged_branches" ]; then
        echo "ℹ️  没有需要清理的分支"
        return 0
    fi

    # 删除本地和远程分支
    echo "$merged_branches" | while read -r branch; do
        if [ -n "$branch" ]; then
            git branch -d "$branch"
            git push origin --delete "$branch" 2>/dev/null || true
        fi
    done

    echo "✅ 分支清理完成"
}
```

---

## 🔗 GitHub 平台交互

### 核心原则

#### 1. 仓库保护检查 (强制执行)

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
    local repo_name=$(echo "$remote_url" | sed -E 's|.*[:/]([^/]+/[^/]+)\.git.*|\1|')

    # 检查是否为模板仓库
    if gh api "repos/$repo_name" --jq '.is_template' 2>/dev/null | grep -q "true"; then
        echo "❌ 禁止在模板仓库上执行写操作: $operation"
        echo "   仓库: $repo_name"
        echo ""
        echo "💡 解决方案:"
        echo "   1. 从模板创建新仓库"
        echo "   2. 在新仓库中执行操作"
        return 1
    fi

    # 检查是否为只读仓库
    if gh api "repos/$repo_name" --jq '.permissions.push' 2>/dev/null | grep -q "false"; then
        echo "❌ 没有推送权限: $repo_name"
        return 1
    fi

    echo "✅ 仓库保护检查通过"
    return 0
}

# 必须在所有写操作前调用
require_repo_protection_check() {
    local operation="$1"

    case "$operation" in
        "gh issue create"|"gh issue edit"|"gh pr create"|"gh pr merge")
            if ! check_repository_protection "$operation"; then
                exit 1
            fi
            ;;
    esac
}
```

#### 2. 身份验证处理

**不预先检查认证状态，直接运行命令并处理失败**

```bash
# GitHub 认证检查和处理
handle_github_auth() {
    local command="$1"
    shift
    local args=("$@")

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
        esac

        return $exit_code
    fi
}
```

### 标准 Issue 操作

#### 获取 Issue 详情
```bash
get_issue_details() {
    local issue_number="$1"

    if [ -z "$issue_number" ]; then
        echo "❌ Issue 编号不能为空"
        return 1
    fi

    handle_github_auth "issue" "view" "$issue_number" "--json" "title,body,state,labels"
}
```

#### 创建 Issue
```bash
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"

    require_repo_protection_check "gh issue create"

    if [ -z "$title" ]; then
        echo "❌ Issue 标题不能为空"
        return 1
    fi

    local cmd_args=("--title" "$title")
    [ -n "$body" ] && cmd_args+=("--body" "$body")
    [ -n "$labels" ] && cmd_args+=("--label" "$labels")

    handle_github_auth "issue" "create" "${cmd_args[@]}"
}
```

#### 更新 Issue
```bash
update_issue() {
    local issue_number="$1"
    local field="$2"
    local value="$3"

    require_repo_protection_check "gh issue edit"

    case "$field" in
        "title")
            handle_github_auth "issue" "edit" "$issue_number" "--title" "$value"
            ;;
        "state")
            if [ "$value" = "closed" ]; then
                handle_github_auth "issue" "close" "$issue_number"
            else
                handle_github_auth "issue" "reopen" "$issue_number"
            fi
            ;;
        "labels")
            handle_github_auth "issue" "edit" "$issue_number" "--add-label" "$value"
            ;;
    esac
}
```

### 标准 Pull Request 操作

#### 创建 Pull Request
```bash
create_pull_request() {
    local title="$1"
    local body="$2"
    local base_branch="${3:-main}"

    require_repo_protection_check "gh pr create"

    # 获取当前分支
    local head_branch=$(git rev-parse --abbrev-ref HEAD)

    # 确保当前分支已推送
    if ! git ls-remote --heads origin "$head_branch" | grep -q "$head_branch"; then
        git push -u origin "$head_branch"
    fi

    local cmd_args=("--title" "$title" "--base" "$base_branch" "--head" "$head_branch")
    [ -n "$body" ] && cmd_args+=("--body" "$body")

    handle_github_auth "pr" "create" "${cmd_args[@]}"
}
```

#### 合并前检查
```bash
pre_merge_check() {
    local req_id="$1"

    echo "🔍 执行合并前检查..."

    # 1. 检查未提交的更改
    if ! git diff --quiet; then
        echo "❌ 存在未提交的更改"
        return 1
    fi

    # 2. 运行质量闸
    if ! .claude/hooks/pre-push-guard.sh; then
        echo "❌ 质量闸检查失败"
        return 1
    fi

    # 3. 检查必要文件
    local required_files=(
        "devflow/requirements/${req_id}/PRD.md"
        "devflow/requirements/${req_id}/EPIC.md"
    )

    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            echo "❌ 缺少必要文件: $file"
            return 1
        fi
    done

    echo "✅ 合并前检查通过"
    return 0
}
```

#### 合并 Pull Request
```bash
merge_pull_request() {
    local pr_number="$1"
    local merge_method="${2:-squash}"  # squash, merge, rebase

    require_repo_protection_check "gh pr merge"

    # 检查 PR 状态
    local pr_state=$(gh pr view "$pr_number" --json state --jq .state)
    if [ "$pr_state" != "OPEN" ]; then
        echo "❌ PR 状态不是 OPEN: $pr_state"
        return 1
    fi

    # 检查 CI 状态
    local ci_status=$(gh pr checks "$pr_number" --json state --jq '.[].state')
    if echo "$ci_status" | grep -q "FAILURE"; then
        echo "❌ CI 检查失败，无法合并"
        return 1
    fi

    # 执行合并
    case "$merge_method" in
        "squash") handle_github_auth "pr" "merge" "$pr_number" "--squash" "--delete-branch" ;;
        "merge")  handle_github_auth "pr" "merge" "$pr_number" "--merge" "--delete-branch" ;;
        "rebase") handle_github_auth "pr" "merge" "$pr_number" "--rebase" "--delete-branch" ;;
    esac
}
```

### 批量操作

```bash
# 批量处理 Issues
batch_process_issues() {
    local action="$1"
    local filter="$2"
    shift 2
    local args=("$@")

    # 获取匹配的 Issues
    local issues=$(gh issue list --json number,title --jq '.[] | select(.title | contains("'"$filter"'")) | .number')

    if [ -z "$issues" ]; then
        echo "ℹ️  没有找到匹配的 Issues"
        return 0
    fi

    # 显示列表并确认
    echo "找到 $(echo "$issues" | wc -l) 个匹配的 Issues"
    read -p "确认执行批量操作 '$action'? (y/N): " confirm

    if [ "$confirm" != "y" ]; then
        return 0
    fi

    # 执行批量操作
    echo "$issues" | while read -r issue_num; do
        case "$action" in
            "close") handle_github_auth "issue" "close" "$issue_num" ;;
            "label") handle_github_auth "issue" "edit" "$issue_num" "--add-label" "${args[0]}" ;;
        esac
        sleep 1  # 避免 API 限流
    done

    echo "✅ 批量操作完成"
}
```

### 仓库健康检查

```bash
check_repository_health() {
    echo "🏥 检查仓库健康状态..."

    # 获取仓库信息
    local repo_info=$(handle_github_auth "repo" "view" "--json" "name,defaultBranch,visibility")
    echo "$repo_info" | jq -r '"名称: \(.name)\n默认分支: \(.defaultBranch)\n可见性: \(.visibility)"'

    # 检查分支保护
    local default_branch=$(echo "$repo_info" | jq -r '.defaultBranch')
    if gh api "repos/:owner/:repo/branches/$default_branch/protection" >/dev/null 2>&1; then
        echo "✅ 主分支已设置保护规则"
    else
        echo "⚠️  主分支未设置保护规则"
    fi

    # 检查工作流
    local workflow_count=$(find .github/workflows -name "*.yml" 2>/dev/null | wc -l)
    if [ "$workflow_count" -gt 0 ]; then
        echo "✅ 找到 $workflow_count 个工作流文件"
    fi

    echo "✅ 仓库健康检查完成"
}
```

### API 优化

```bash
# 使用 --json 获取结构化输出
get_structured_data() {
    local command="$1"
    local fields="$2"
    shift 2
    local args=("$@")

    handle_github_auth "$command" "${args[@]}" "--json" "$fields"
}

# 检查 API 速率限制
check_rate_limit() {
    local rate_limit_info=$(gh api rate_limit --jq '.rate')
    local remaining=$(echo "$rate_limit_info" | jq -r '.remaining')
    local limit=$(echo "$rate_limit_info" | jq -r '.limit')

    echo "📊 GitHub API 使用情况: $remaining/$limit"

    if [ "$remaining" -lt 100 ]; then
        echo "⚠️  API 速率限制即将达到"
        return 1
    fi

    return 0
}
```

---

## 📊 分支状态管理

### 状态文件格式
```yaml
# devflow/requirements/REQ-123/branch-info.yml
branch_info:
  req_id: "REQ-123"
  title: "支持用户下单"
  branch_name: "feature/REQ-123-支持用户下单"
  created_at: "2024-01-24T10:30:00Z"
  base_branch: "main"
  status: "active"  # active, merged, closed, deleted
  pr_url: "https://github.com/owner/repo/pull/123"

commits:
  - hash: "abc123def"
    message: "feat(REQ-123): 实现用户下单接口"
    time: "2024-01-24T14:20:00Z"
```

---

## ⚠️ 重要注意事项

### 安全要求
- **始终**在写操作前检查远程仓库来源
- 使用 `--json` 获取结构化输出用于解析
- 保持操作原子性 - 一个命令完成一个动作
- 不要预检查速率限制

### 操作清单
在执行 GitHub 写操作前必须确认：
- [ ] 已执行仓库保护检查
- [ ] 确认操作权限
- [ ] 验证目标分支/Issue/PR 存在
- [ ] 检查 CI 状态（PR 合并时）

### 禁止操作
- ❌ 在模板仓库上创建 Issues 或 PRs
- ❌ 在没有推送权限的仓库上执行写操作
- ❌ 自动重试失败的认证操作
- ❌ 忽略 CI 失败强制合并 PR

---

## 🎯 最佳实践

### 分支生命周期管理
- 及时创建功能分支
- 定期同步主分支
- 小而频繁的提交
- 及时清理已合并分支

### 冲突预防
- 每日同步主分支
- 避免修改共享文件
- 使用原子性提交
- 及时沟通变更计划

### 提交质量
- 描述性的提交消息
- 逻辑相关的更改组合
- 避免大型提交
- 包含适当的测试

---

**重要提醒**: 严格遵循 Git 和 GitHub 操作规范是确保代码质量和团队协作效率的基础。
