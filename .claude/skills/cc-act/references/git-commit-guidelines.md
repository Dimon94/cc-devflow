# Git Commit Guidelines

## Purpose

`cc-act` 在执行 `create-pr` / `update-pr` 时，必须让提交历史满足 3 个目标：

1. 提交信息清楚、可追溯
2. 提交边界干净、不要把不同类型变更揉成一团
3. 分支历史尽量线性，便于 review 和回滚

## Commit Message Format

默认使用 Conventional Commits：

```text
<type>(<scope>): <subject>

<body>

<footer>
```

如果当前仓库已有更严格的提交规范，以仓库规范为准；否则沿用这里的格式。

## Allowed Types

- `feat`: 新功能
- `fix`: 修复缺陷
- `docs`: 文档更新
- `style`: 纯格式调整，不改行为
- `refactor`: 重构，不改外部行为
- `perf`: 性能优化
- `test`: 测试变更
- `chore`: 构建、脚本、依赖、工具链

## Message Rules

1. `subject` 保持简短，优先控制在 50 个字符内。
2. `subject` 使用祈使句，首字母小写，末尾不加句号。
3. `body` 只解释 `why` 和关键 `how`，不要把 diff 逐行复述。
4. `footer` 只在需要时使用，例如 `BREAKING CHANGE:` 或 `Closes #123`。
5. PR 标题应与最终交付的核心 commit 语义一致，不要标题和提交说两套话。

## Commit Boundary Rules

`cc-act` 生成 commit 时，优先消除“一个 commit 混很多事”这种坏味道。

1. 功能、测试、文档、配置属于不同类型时，拆成多个 commit。
2. 多个模块彼此独立时，按模块拆分 commit。
3. 修 bug 与补防御性代码不是同一件事，能拆就拆。
4. 只有当改动天然不可分割时，才允许合并到同一个 commit。
5. 禁止为了省事直接 `git add .` 把无关变更一起提交。

推荐拆分顺序：

- 核心实现
- 测试
- 文档
- 配置或工具链

## History Rules

1. 推送前优先同步 base branch，并尽量使用 `git pull --rebase` 保持线性历史。
2. 已有打开的 PR 时，更新现有 PR，不重复创建第二个。
3. rebase 之后如果必须强推，只允许 `git push --force-with-lease`，不要裸 `--force`。

## Examples

```text
feat(user): add wechat login flow
fix(auth): handle expired token refresh
test(payment): cover callback retry path
docs(readme): document local development setup
refactor(api): simplify request error mapping
```

## CC-Act Enforcement

`cc-act` 在 `create-pr` / `update-pr` 模式下至少要检查：

1. commit message 是否符合本规范或仓库已有规范
2. 是否把明显不同类型的变更拆成了独立 commit
3. push 和 PR 描述是否与最终提交历史表达同一套事实
