# Git 分支操作规则

## 概述

cc-devflow 系统中的 Git 分支操作需要严格遵循规范，确保代码管理的一致性和可追踪性。

## 分支命名规范

### 功能分支命名
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

### 分支类型定义
- **feature/**: 新功能开发
- **epic/**: 大型功能集合
- **fix/**: Bug 修复
- **hotfix/**: 生产环境紧急修复
- **docs/**: 文档更新
- **refactor/**: 代码重构

## 分支操作流程

### 1. 创建分支前检查

```bash
# 分支创建前的必要检查
pre_branch_check() {
    local req_id="$1"
    local title="$2"
    local branch_type="${3:-feature}"

    echo "🔍 执行分支创建前检查..."

    # 检查当前分支状态
    if ! git diff --quiet; then
        echo "❌ 工作目录有未提交的更改，请先提交或暂存"
        git status --porcelain
        return 1
    fi

    # 检查是否在主分支
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$current_branch" != "main" ] && [ "$current_branch" != "master" ]; then
        echo "❌ 当前不在主分支，当前分支: $current_branch"
        echo "   请先切换到主分支: git checkout main"
        return 1
    fi

    # 检查分支是否已存在
    local branch_name="${branch_type}/REQ-${req_id}-$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9\-]//g' | sed 's/--*/-/g')"
    if git show-ref --verify --quiet "refs/heads/$branch_name"; then
        echo "❌ 分支已存在: $branch_name"
        echo "   请使用不同的需求ID或删除现有分支"
        return 1
    fi

    # 更新主分支
    echo "🔄 更新主分支..."
    git fetch origin
    if ! git merge --ff-only origin/main 2>/dev/null; then
        echo "⚠️  主分支更新失败，可能需要手动解决冲突"
        return 1
    fi

    echo "✅ 分支创建前检查通过"
    echo "   将创建分支: $branch_name"
    return 0
}
```

### 2. 分支创建

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
    local branch_name="${branch_type}/REQ-${req_id}-$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9\-]//g' | sed 's/--*/-/g')"

    echo "🌿 创建分支: $branch_name"

    # 创建并切换到新分支
    if git checkout -b "$branch_name"; then
        echo "✅ 分支创建成功: $branch_name"

        # 创建分支信息文件
        create_branch_info "$req_id" "$title" "$branch_name"

        # 推送到远程
        if git push -u origin "$branch_name"; then
            echo "✅ 分支已推送到远程"
        else
            echo "⚠️  分支推送失败，但本地分支已创建"
        fi
    else
        echo "❌ 分支创建失败"
        return 1
    fi
}

# 创建分支信息文件
create_branch_info() {
    local req_id="$1"
    local title="$2"
    local branch_name="$3"

    local branch_info_file=".claude/docs/requirements/${req_id}/branch-info.yml"
    mkdir -p "$(dirname "$branch_info_file")"

    cat > "$branch_info_file" << EOF
branch_info:
  req_id: "$req_id"
  title: "$title"
  branch_name: "$branch_name"
  created_at: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  created_by: "$(git config user.name)"
  base_branch: "main"
  status: "active"

commits: []
EOF

    echo "📋 分支信息文件已创建: $branch_info_file"
}
```

### 3. 提交规范

#### 提交消息格式
```bash
# 提交消息格式
# {type}({req_id}): {description} - {details}
#
# 例如:
# feat(REQ-123): 实现用户登录接口 - 添加JWT认证和密码加密
# fix(REQ-124): 修复订单状态更新bug - 处理并发更新冲突
# docs(REQ-125): 更新API文档 - 添加新增接口的说明
```

#### 提交类型定义
- **feat**: 新功能
- **fix**: Bug修复
- **docs**: 文档更新
- **style**: 代码格式调整
- **refactor**: 代码重构
- **test**: 测试相关
- **chore**: 构建、配置等杂务

#### 标准提交函数
```bash
# 标准提交函数
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
            echo "   有效类型: feat, fix, docs, style, refactor, test, chore"
            return 1
            ;;
    esac

    # 构建提交消息
    local commit_msg="${type}(${req_id}): ${description}"
    if [ -n "$details" ]; then
        commit_msg="${commit_msg} - ${details}"
    fi

    echo "💾 提交更改: $commit_msg"

    # 执行提交
    if git commit -m "$commit_msg"; then
        echo "✅ 提交成功"

        # 更新分支信息文件
        update_branch_commits "$req_id" "$commit_msg"
    else
        echo "❌ 提交失败"
        return 1
    fi
}

# 更新分支提交记录
update_branch_commits() {
    local req_id="$1"
    local commit_msg="$2"

    local branch_info_file=".claude/docs/requirements/${req_id}/branch-info.yml"

    if [ -f "$branch_info_file" ]; then
        # 获取最新提交信息
        local commit_hash=$(git rev-parse HEAD)
        local commit_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)

        # 添加提交记录
        yq eval ".commits += [{\"hash\": \"$commit_hash\", \"message\": \"$commit_msg\", \"time\": \"$commit_time\"}]" -i "$branch_info_file"

        echo "📊 分支提交记录已更新"
    fi
}
```

### 4. 分支同步

```bash
# 与主分支同步
sync_with_main() {
    local req_id="$1"

    echo "🔄 与主分支同步..."

    # 获取最新的主分支
    git fetch origin main

    # 检查是否有冲突
    if git merge --no-commit --no-ff origin/main 2>/dev/null; then
        # 无冲突，完成合并
        git merge --abort  # 先取消，然后重新合并
        git merge origin/main

        echo "✅ 同步完成，无冲突"
        return 0
    else
        echo "⚠️  检测到冲突，需要手动解决"

        # 显示冲突文件
        echo "冲突文件:"
        git diff --name-only --diff-filter=U

        # 生成冲突报告
        generate_conflict_report "$req_id"

        return 1
    fi
}

# 生成冲突报告
generate_conflict_report() {
    local req_id="$1"
    local report_file=".claude/docs/requirements/${req_id}/conflict-report.md"

    cat > "$report_file" << EOF
# Git 冲突报告

## 基本信息
- 需求ID: $req_id
- 冲突时间: $(date -u +%Y-%m-%dT%H:%M:%SZ)
- 当前分支: $(git rev-parse --abbrev-ref HEAD)
- 目标分支: origin/main

## 冲突文件
$(git diff --name-only --diff-filter=U | sed 's/^/- /')

## 解决步骤
1. 手动编辑冲突文件，解决标记的冲突部分
2. 添加解决后的文件: git add <file>
3. 完成合并: git commit
4. 更新分支: git push origin $(git rev-parse --abbrev-ref HEAD)

## 冲突内容预览
$(git diff --diff-filter=U | head -50)
EOF

    echo "📋 冲突报告已生成: $report_file"
}
```

### 5. 分支合并

```bash
# 合并到主分支前的检查
pre_merge_check() {
    local req_id="$1"

    echo "🔍 执行合并前检查..."

    # 检查是否所有文件都已提交
    if ! git diff --quiet && ! git diff --cached --quiet; then
        echo "❌ 存在未提交的更改"
        git status --porcelain
        return 1
    fi

    # 检查质量闸
    if ! .claude/hooks/pre-push-guard.sh; then
        echo "❌ 质量闸检查失败"
        return 1
    fi

    # 检查必要文件是否存在
    local required_files=(
        ".claude/docs/requirements/${req_id}/PRD.md"
        ".claude/docs/requirements/${req_id}/EPIC.md"
        ".claude/docs/requirements/${req_id}/LOG.md"
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

# 创建Pull Request
create_pull_request() {
    local req_id="$1"
    local title="$2"

    echo "🔀 创建Pull Request..."

    # 检查GitHub CLI
    if ! command -v gh >/dev/null 2>&1; then
        echo "❌ GitHub CLI (gh) 未安装"
        echo "   请安装 GitHub CLI 或手动创建 PR"
        return 1
    fi

    # 检查认证
    if ! gh auth status >/dev/null 2>&1; then
        echo "❌ GitHub CLI 未认证"
        echo "   请运行: gh auth login"
        return 1
    fi

    # 推送当前分支
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    git push origin "$current_branch"

    # 生成PR描述
    local pr_body=$(generate_pr_body "$req_id")

    # 创建PR
    if gh pr create --title "REQ-${req_id}: ${title}" --body "$pr_body" --base main --head "$current_branch"; then
        echo "✅ Pull Request 创建成功"

        # 获取PR URL
        local pr_url=$(gh pr view --json url --jq .url)
        echo "🔗 PR 链接: $pr_url"

        # 更新分支信息
        update_branch_pr_info "$req_id" "$pr_url"
    else
        echo "❌ Pull Request 创建失败"
        return 1
    fi
}

# 生成PR描述
generate_pr_body() {
    local req_id="$1"

    cat << EOF
## 需求概述
需求ID: REQ-${req_id}

## 相关文档
- [PRD](.claude/docs/requirements/${req_id}/PRD.md)
- [Epic](.claude/docs/requirements/${req_id}/EPIC.md)
- [执行日志](.claude/docs/requirements/${req_id}/LOG.md)

## 变更内容
$(git log --oneline main..HEAD | sed 's/^/- /')

## 质量检查
- [x] 类型检查通过
- [x] 单元测试通过
- [x] 安全扫描通过
- [x] 代码审查完成

## 测试说明
详见 [测试报告](.claude/docs/requirements/${req_id}/TEST_REPORT.md)

---
🤖 此PR由 cc-devflow 系统自动生成
EOF
}
```

### 6. 分支清理

```bash
# 清理已合并的分支
cleanup_merged_branches() {
    echo "🧹 清理已合并的分支..."

    # 获取已合并的分支列表
    local merged_branches=$(git branch --merged main | grep -E "feature/|fix/|epic/" | sed 's/^[ *]*//')

    if [ -z "$merged_branches" ]; then
        echo "ℹ️  没有需要清理的分支"
        return 0
    fi

    echo "发现已合并的分支:"
    echo "$merged_branches" | sed 's/^/  - /'

    # 删除本地分支
    echo "$merged_branches" | while read -r branch; do
        if [ -n "$branch" ]; then
            echo "🗑️  删除本地分支: $branch"
            git branch -d "$branch"

            # 删除远程分支
            if git ls-remote --heads origin "$branch" | grep -q "$branch"; then
                echo "🗑️  删除远程分支: $branch"
                git push origin --delete "$branch"
            fi
        fi
    done

    echo "✅ 分支清理完成"
}

# 清理特定需求的分支
cleanup_requirement_branch() {
    local req_id="$1"

    echo "🧹 清理需求 ${req_id} 的分支..."

    # 查找相关分支
    local branches=$(git branch -a | grep -E "(feature|fix|epic)/REQ-${req_id}-" | sed 's/^[ *]*//' | sed 's|remotes/origin/||')

    if [ -z "$branches" ]; then
        echo "ℹ️  没有找到相关分支"
        return 0
    fi

    echo "找到相关分支:"
    echo "$branches" | sed 's/^/  - /'

    # 确认删除
    read -p "是否删除这些分支? (y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        echo "$branches" | while read -r branch; do
            if [ -n "$branch" ]; then
                # 删除本地分支
                if git show-ref --verify --quiet "refs/heads/$branch"; then
                    git branch -D "$branch"
                    echo "✅ 已删除本地分支: $branch"
                fi

                # 删除远程分支
                if git ls-remote --heads origin "$branch" | grep -q "$branch"; then
                    git push origin --delete "$branch"
                    echo "✅ 已删除远程分支: $branch"
                fi
            fi
        done

        # 更新分支状态
        update_branch_status "$req_id" "deleted"
    else
        echo "ℹ️  取消分支删除"
    fi
}

# 更新分支状态
update_branch_status() {
    local req_id="$1"
    local status="$2"

    local branch_info_file=".claude/docs/requirements/${req_id}/branch-info.yml"

    if [ -f "$branch_info_file" ]; then
        yq eval ".branch_info.status = \"$status\"" -i "$branch_info_file"
        yq eval ".branch_info.closed_at = \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"" -i "$branch_info_file"

        echo "📊 分支状态已更新: $status"
    fi
}
```

## 分支状态管理

### 状态文件格式
```yaml
# .claude/docs/requirements/REQ-123/branch-info.yml
branch_info:
  req_id: "REQ-123"
  title: "支持用户下单"
  branch_name: "feature/REQ-123-支持用户下单"
  created_at: "2024-01-24T10:30:00Z"
  created_by: "开发者名称"
  base_branch: "main"
  status: "active"  # active, merged, closed, deleted
  pr_url: "https://github.com/owner/repo/pull/123"
  merged_at: "2024-01-26T15:45:00Z"

commits:
  - hash: "abc123def"
    message: "feat(REQ-123): 实现用户下单接口"
    time: "2024-01-24T14:20:00Z"
  - hash: "def456ghi"
    message: "test(REQ-123): 添加订单接口测试"
    time: "2024-01-24T16:30:00Z"
```

## 最佳实践

### 1. 分支生命周期管理
- 及时创建功能分支
- 定期同步主分支
- 小而频繁的提交
- 及时清理已合并分支

### 2. 冲突预防
- 每日同步主分支
- 避免修改共享文件
- 使用原子性提交
- 及时沟通变更计划

### 3. 提交质量
- 描述性的提交消息
- 逻辑相关的更改组合
- 避免大型提交
- 包含适当的测试

### 4. 协作约定
- 统一的分支命名
- 标准化的提交格式
- 定期状态更新
- 透明的进度跟踪

---

**重要提醒**: 严格遵循分支操作规则是确保代码质量和团队协作效率的基础。
