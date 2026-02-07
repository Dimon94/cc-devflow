---
name: git-commit
description: Git Commit 工作流最佳实践 - Conventional Commits 规范、分支策略、PR 管理
version: 3.0.0
author: CC-DevFlow
updated_at: 2026-01-04
scripts:
  review: .claude/scripts/git-commit-review.sh
  pr_check: .claude/scripts/check-remote.sh
---

> **哲学核心**：Commit 是代码历史的节点，每个节点都应该清晰、独立、可追溯。
> **Rebase 信仰**：优先使用 `git rebase` 保持线性历史，让提交历史像链表一样优雅。
> **协作原则**：本地项目直接合并，远程项目走 PR 流程，代码审查是质量保障的自然环节。

---

## 📋 Commit Message 规范

### 格式标准（Conventional Commits）

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(user): 添加登录功能` |
| `fix` | 修复 Bug | `fix(auth): 修复 token 过期问题` |
| `docs` | 文档更新 | `docs(readme): 更新安装说明` |
| `style` | 代码格式 | `style(utils): 统一代码缩进` |
| `refactor` | 重构 | `refactor(api): 简化请求处理逻辑` |
| `perf` | 性能优化 | `perf(render): 优化列表渲染性能` |
| `test` | 测试 | `test(utils): 添加工具函数单元测试` |
| `chore` | 构建/工具 | `chore(deps): 更新依赖版本` |

### 编写规则

- **Subject**：50 字以内，祈使句，首字母小写，结尾不加句号
- **Body**：72 字换行，说明为什么和如何，而非做了什么
- **Footer**：`BREAKING CHANGE: <描述>` 或 `Closes #123`

### ✅ 好示例

```
feat(user): 添加微信登录功能

支持通过微信授权码快速登录，提升用户体验。
登录成功后自动同步用户信息到本地存储。

Closes #123
```

---

## 🔄 工作流程

### 远程项目 PR 流程（团队协作）

```bash
# 1. 创建功能分支
git checkout main
git pull --rebase
git checkout -b feature/my-feature

# 2. 开发并提交（多次小提交）
git add <file1>
git commit -m "feat(module): 实现核心功能"
git add <file2>
git commit -m "test(module): 添加单元测试"

# 3. 推送前 rebase 主分支（保持线性历史）
git checkout main
git pull --rebase
git checkout feature/my-feature
git rebase main

# 4. 推送到远程
git push -u origin feature/my-feature
# rebase 后需要 force push
git push --force-with-lease

# 5. 创建 Pull Request
gh pr create --title "feat: 添加新功能" --body "$(cat <<'EOF'
## Summary
- 实现核心功能模块
- 添加完整测试覆盖

## Test plan
- [x] 单元测试通过
- [x] 集成测试通过

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

# 6. 合并 PR 后清理
git checkout main
git pull --rebase
git branch -d feature/my-feature
```

---

### 本地项目直接合并（个人项目）

```bash
# 1. 创建功能分支
git checkout main
git checkout -b feature/my-feature

# 2. 开发并提交
git add .
git commit -m "feat(module): 实现核心功能"

# 3. Rebase 主分支并快进合并
git checkout main
git pull --rebase  # 如果有远程仓库
git checkout feature/my-feature
git rebase main
git checkout main
git merge --ff-only feature/my-feature

# 4. 清理分支
git branch -d feature/my-feature
```

---

### 🚨 紧急修复流程（Hotfix）

```bash
# 1. 从 main 创建热修复分支
git checkout main
git pull --rebase
git checkout -b hotfix/critical-issue

# 2. 修复并提交
git add .
git commit -m "fix(critical): 修复紧急问题"

# 3. 合并到 main 和 develop
git checkout main
git merge hotfix/critical-issue
git push

git checkout develop
git merge hotfix/critical-issue
git push

# 4. 清理分支
git branch -d hotfix/critical-issue
```

---

## 📦 多文件拆分提交工作流（NEW）

> **原则**：涉及多文件时，必须按同类变更拆分提交，每个 commit 只包含一类变更。

### 场景 1：功能 + 测试 + 文档

```bash
# ❌ 错误：一次性提交所有文件
git add .
git commit -m "feat: 添加用户管理功能"

# ✅ 正确：按类型拆分提交
# 第一次提交：核心功能实现
git add src/services/user.ts src/routes/user.ts
git commit -m "feat(user): 实现用户管理核心功能"

# 第二次提交：测试文件
git add tests/user.test.ts
git commit -m "test(user): 添加用户管理单元测试"

# 第三次提交：文档更新
git add docs/api/user.md README.md
git commit -m "docs(user): 添加用户管理 API 文档"

# 第四次提交：配置变更
git add .env.example config/user.yml
git commit -m "chore(user): 添加用户管理配置文件"
```

### 场景 2：重构多个模块

```bash
# ✅ 按模块拆分提交
# 第一次提交：auth 模块重构
git add src/services/auth.ts src/middlewares/auth.ts
git commit -m "refactor(auth): 简化认证逻辑"

# 第二次提交：user 模块重构
git add src/services/user.ts src/models/user.ts
git commit -m "refactor(user): 优化用户服务层"

# 第三次提交：api 模块重构
git add src/routes/api.ts src/controllers/api.ts
git commit -m "refactor(api): 统一 API 错误处理"
```

### 场景 3：跨层修改（数据库 + 服务 + API）

```bash
# ✅ 按层次拆分提交
# 第一次提交：数据模型层
git add prisma/schema.prisma prisma/migrations/*
git commit -m "feat(db): 添加 order 表及关联字段"

# 第二次提交：服务层
git add src/services/order.ts src/lib/prisma/order.ts
git commit -m "feat(order): 实现订单服务逻辑"

# 第三次提交：API 路由层
git add src/routes/order.ts src/controllers/order.ts
git commit -m "feat(order): 添加订单 API 接口"

# 第四次提交：前端集成
git add miniprogram/pages/order/* miniprogram/utils/order-api.js
git commit -m "feat(order): 小程序订单页面集成"
```

### 场景 4：Bug 修复 + 防御性代码

```bash
# ✅ 先修复 bug，再添加防御
# 第一次提交：核心 bug 修复
git add src/services/payment.ts
git commit -m "fix(payment): 修复支付回调处理逻辑"

# 第二次提交：添加测试
git add tests/payment.test.ts
git commit -m "test(payment): 添加支付回调场景测试"

# 第三次提交：防御性代码
git add src/middlewares/validator.ts
git commit -m "feat(payment): 添加支付参数校验中间件"
```

### 拆分提交的技巧

```bash
# 技巧 1：交互式添加（部分文件添加）
git add -p <file>  # 逐块选择要提交的代码

# 技巧 2：查看未提交变更
git status -s
git diff --stat

# 技巧 3：临时保存其他变更
git stash push -m "临时保存其他模块变更" -- <files>

# 技巧 4：整理已提交历史
git rebase -i HEAD~5  # 交互式整理最近 5 个 commit
```

### 拆分原则

| 维度 | 拆分规则 | 示例 |
|------|----------|------|
| **功能维度** | 实现 → 测试 → 文档 | `feat → test → docs` |
| **模块维度** | 按模块边界拆分 | `auth → user → order` |
| **层次维度** | 按架构分层拆分 | `model → service → route → UI` |
| **类型维度** | 按文件类型拆分 | `.ts → .test.ts → .md → .yml` |
| **影响范围** | 核心 → 边缘 | `核心逻辑 → 配置 → 文档` |

---

## 🔄 Rebase 最佳实践

### 日常 Rebase

```bash
# 功能分支定期 rebase 主分支
git checkout feature/my-feature
git fetch origin
git rebase origin/main

# 解决冲突后继续
git add .
git rebase --continue

# 中止 rebase
git rebase --abort
```

### 交互式 Rebase 整理历史

```bash
# 整理最近 3 个 commit
git rebase -i HEAD~3

# 操作选项：
# pick:   保留 commit
# reword: 修改 message
# squash: 合并到上一个 commit（保留 message）
# fixup:  合并到上一个 commit（丢弃 message）
# drop:   删除 commit
```

### Rebase 黄金法则

```yaml
核心原则: "永远不要 rebase 公共分支的历史"

✅ 安全场景：
  - 个人功能分支 rebase 主分支
  - 本地未推送的提交整理

❌ 危险场景：
  - 主分支（main/master/develop）
  - 多人协作的长期分支
  - 已推送到公共仓库的提交
```

### Force Push 安全使用

```bash
# ❌ 危险：无脑覆盖
git push --force

# ✅ 安全：仅当远程无新提交时才覆盖
git push --force-with-lease
```

---

## 📤 Pull Request 管理

### 创建 PR

```bash
# 使用 gh 命令创建 PR
gh pr create \
  --title "feat(module): 添加新功能" \
  --body "$(cat <<'EOF'
## Summary
- 实现了 XXX 核心功能
- 添加了完整的测试覆盖

## Test Plan
- [x] 单元测试通过
- [x] 集成测试通过

## Related Issues
Closes #123

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### PR 合并策略

```bash
# 1. Squash merge（推荐，合并为单个 commit）
gh pr merge 123 --squash --delete-branch

# 2. Rebase merge（线性历史）
gh pr merge 123 --rebase --delete-branch

# 3. Merge commit（保留完整历史）
gh pr merge 123 --merge
```

### PR 最佳实践

- ✅ 每个 PR ≤ 400 行代码变更
- ✅ 专注单一功能或修复
- ✅ 推送前 `git rebase main`
- ✅ 所有讨论解决后再合并

---

## 🛠️ 常用命令速查

```bash
# 查看状态
git status -s
git diff --staged

# 提交
git add -p                # 交互式添加
git commit -m "message"   # 快速提交
git commit --amend        # 修改最后一次提交

# 撤销
git restore <file>                # 撤销工作区变更
git restore --staged <file>       # 撤销暂存区变更
git reset --soft HEAD~1           # 撤销提交（保留变更）

# 分支
git switch -c <branch>    # 创建并切换分支
git branch -d <branch>    # 删除分支

# 暂存
git stash push -m "desc" -- <files>
git stash pop

# 历史
git log --oneline --graph
git show <commit-hash>
```

---

## 🎯 核心原则

1. **原子性提交**：每个 commit 只做一件事，功能完整、可独立测试
2. **清晰的 Message**：遵循 Conventional Commits，让历史可读可追溯
3. **频繁提交**：小步快跑，不积累大量变更
4. **保持线性历史**：优先 rebase，让历史像链表一样优雅
5. **同类变更分组**：多文件按类型/模块/层次拆分提交
6. **安全的 Force Push**：仅在个人分支使用 `--force-with-lease`

---

**记住**：好的 commit 历史是项目最好的文档。代码是写给人看的，只是顺便让机器运行。