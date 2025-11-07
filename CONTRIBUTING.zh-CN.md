# 为 cc-devflow 做贡献

感谢你对 cc-devflow 项目的关注！本文档提供了为本项目做贡献的指南和说明。

[中文版](./CONTRIBUTING.zh-CN.md) | [English](./CONTRIBUTING.md)

---

## 📋 目录

- [行为准则](#行为准则)
- [我可以如何贡献？](#我可以如何贡献)
- [开发环境设置](#开发环境设置)
- [项目结构](#项目结构)
- [编码规范](#编码规范)
- [提交信息规范](#提交信息规范)
- [测试要求](#测试要求)
- [Pull Request 流程](#pull-request-流程)
- [Constitution 合规性](#constitution-合规性)
- [质量闸](#质量闸)
- [文档指南](#文档指南)

---

## 行为准则

参与本项目，即表示你同意遵守我们的行为准则：

- **尊重他人**：以尊重和善意对待每个人
- **建设性反馈**：提供建设性的反馈和批评
- **协作精神**：共同合作改进项目
- **保持耐心**：理解每个人都在学习和成长
- **专业态度**：在所有互动中保持专业

---

## 我可以如何贡献？

### 🐛 报告 Bug

提交 Bug 报告前：
1. **检查现有 Issues** 避免重复提交
2. **使用最新版本** 确保 Bug 仍然存在
3. **提供详细信息**：
   - 复现步骤
   - 预期行为
   - 实际行为
   - 环境详情（操作系统、Node 版本、Claude Code 版本）
   - 截图或错误日志

**提交方式**：[GitHub Issues](https://github.com/Dimon94/cc-devflow/issues)

### ✨ 建议新功能

提交功能请求前：
1. **检查现有 Issues** 和讨论
2. **清晰描述功能**：
   - 使用场景和动机
   - 建议的实现方式（如有）
   - 对现有功能的影响
   - 考虑过的替代方案

### 📝 改进文档

文档改进总是受欢迎的：
- 修复错别字或澄清混淆的部分
- 添加缺失的示例或用例
- 改进命令文档
- 将文档翻译成其他语言

### 💻 贡献代码

请参阅下面的 [Pull Request 流程](#pull-request-流程)。

---

## 开发环境设置

### 前置条件

- 已安装并配置 [Claude Code](https://claude.ai/code)
- Git（版本 2.0+）
- Node.js（版本 16+）- 可选，用于额外的质量检查
- Bash shell（用于脚本测试）

### 安装步骤

1. **Fork 本仓库**
   ```bash
   # 在 GitHub 上点击 "Fork"
   ```

2. **克隆你的 fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/cc-devflow.git
   cd cc-devflow
   ```

3. **创建测试项目**
   ```bash
   # 复制 .claude 到测试项目
   mkdir ~/test-cc-devflow
   cp -r .claude ~/test-cc-devflow/
   cd ~/test-cc-devflow
   git init
   ```

4. **验证安装**
   ```bash
   .claude/scripts/verify-setup.sh
   ```

5. **运行测试**
   ```bash
   # 运行所有测试
   bash .claude/tests/run-all-tests.sh --scripts

   # 运行 Constitution 测试
   bash .claude/tests/constitution/run_all_constitution_tests.sh
   ```

---

## 项目结构

理解项目结构对贡献至关重要：

```
cc-devflow/
├── .claude/                      # Claude Code 配置
│   ├── agents/                   # 子代理定义
│   ├── commands/                 # 斜杠命令 (flow-*)
│   ├── constitution/             # Constitution System v2.0.0
│   ├── docs/                     # 内部文档
│   │   └── templates/            # 文档模板 (PRD, EPIC, TASKS)
│   ├── guides/                   # 工作流和技术指南
│   ├── hooks/                    # Hook 脚本 (PreToolUse, PostToolUse)
│   ├── rules/                    # 核心模式和约定
│   ├── scripts/                  # 实用脚本（统一基础设施）
│   ├── settings.json             # Claude Code 设置
│   ├── skills/                   # Skills 系统
│   └── tests/                    # 测试套件
│       ├── scripts/              # 脚本测试（100% 覆盖率）
│       └── constitution/         # Constitution 测试（38/38 通过）
├── docs/                         # 外部文档（公开）
│   ├── commands/                 # 详细命令文档
│   ├── guides/                   # 用户指南
│   ├── architecture/             # 架构文档
│   └── examples/                 # 示例工作流
├── devflow/                      # 生成的工作空间（gitignored）
│   ├── ROADMAP.md                # 产品路线图
│   ├── ARCHITECTURE.md           # 系统架构
│   ├── BACKLOG.md                # 需求待办列表
│   └── requirements/             # 需求工作空间
├── README.md                     # 英文 README
├── README.zh-CN.md               # 中文 README
├── CHANGELOG.md                  # 版本历史
├── CONTRIBUTING.md               # 本文件（英文）
└── CONTRIBUTING.zh-CN.md         # 中文版本
```

**关键目录**：
- `.claude/agents/` - 在此添加新的专业代理
- `.claude/commands/` - 在此添加新的斜杠命令
- `.claude/scripts/` - 在此添加新的实用脚本
- `.claude/tests/` - 为新脚本添加测试套件
- `docs/` - 在此添加面向用户的文档

---

## 编码规范

### 通用原则

cc-devflow 遵循严格的编码标准，灵感来自 Linus Torvalds 的哲学：

1. **好品味**：消除特殊情况而不是增加 if/else 分支
2. **简洁性**：保持函数简短和专注（< 20 行）
3. **清晰性**：代码应自我文档化
4. **无代码重复**：遵循 DRY 原则
5. **SOLID 原则**：保持干净的架构

### Shell 脚本规范

对于 `.claude/scripts/` 和 `.claude/hooks/`：

```bash
#!/usr/bin/env bash

# ================================================================
# 脚本名称: check-prerequisites.sh
# 描述: 在启动流程前验证前置条件
# 用法: bash check-prerequisites.sh [--json]
# ================================================================

set -euo pipefail  # 出错退出，未定义变量退出，管道失败退出

# -------------------- 配置 --------------------
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# -------------------- 函数 --------------------
log_error() {
    echo "[错误] $*" >&2
}

log_info() {
    echo "[信息] $*" >&2
}

# -------------------- 主逻辑 --------------------
main() {
    # 实现在此
}

main "$@"
```

**要求**：
- 顶部使用 `set -euo pipefail`
- 常量使用 `readonly`
- 添加清晰的章节注释（ASCII art 风格）
- 支持 `--json` 标志用于机器可读输出
- 使用 `common.sh` 中的 `log_error`、`log_info`
- 退出码：0（成功）、1（错误）、2（验证失败）

### Markdown 规范

对于 `.claude/agents/`、`.claude/commands/` 和 `docs/`：

```markdown
# Agent 名称或命令名称

## 📋 概述
代理或命令的简要描述。

## 🎯 语法
```bash
/command-name "参数-1|参数-2"
```

## 📖 参数
| 参数 | 说明 | 必填 | 示例 |
|------|------|------|------|
| 参数-1 | ... | ✅ | ... |

## 🔄 执行流程
```text
阶段 1: ...
  ↓
阶段 2: ...
```

## 💡 示例
[详细示例]

## 🔗 相关
- [相关文档 1]
- [相关文档 2]
```

---

## 提交信息规范

cc-devflow 遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更改
- `test`: 添加或更新测试
- `refactor`: 代码重构（无功能更改）
- `perf`: 性能改进
- `style`: 代码风格更改（格式化、空格）
- `chore`: 维护任务（构建、CI、依赖）

### 示例

```bash
# 功能添加
feat(flow-roadmap): 添加交互式产品路线图生成

实现了 6 阶段交互式对话用于路线图规划：
- 产品愿景和目标
- 目标用户和痛点
- 核心功能规划
- 技术架构
- 里程碑和时间线
- 成功指标

Closes #123

# Bug 修复
fix(flow-init): 恢复 Stage 2.6 的研究任务填充

在 Stage 2.6 中，`populate-research-tasks.sh` 调用被意外移除，
导致研究决策未被集成。

恢复了缺失的脚本调用以维护数据契约一致性。

Fixes #456

# 文档更新
docs(README): 添加项目级与需求级命令区分

v2.1.0 引入了项目级命令（每个项目执行一次）
vs 需求级命令（每个需求执行一次）。

更新了命令参考表以清晰区分这两个类别。
```

### 规则

- 使用现在时（"add" 而非 "added"）
- 使用祈使语气（"move" 而非 "moves"）
- 首行应 ≤ 72 个字符
- 正文应解释"什么"和"为什么"，而非"如何"
- 用 `Closes #123` 或 `Fixes #456` 引用 Issues

---

## 测试要求

### 测试覆盖率要求

cc-devflow 为所有脚本维护 **100% 测试覆盖率**：

- **脚本测试**：所有 `.claude/scripts/*.sh` 必须在 `.claude/tests/scripts/` 中有测试
- **Constitution 测试**：所有 Constitution 更改必须通过 38/38 测试
- **集成测试**：新命令必须有集成测试

### 运行测试

```bash
# 运行所有脚本测试
bash .claude/tests/run-all-tests.sh --scripts

# 运行特定测试套件
bash .claude/tests/scripts/test_check_prerequisites.sh

# 运行 Constitution 测试
bash .claude/tests/constitution/run_all_constitution_tests.sh

# 详细输出运行
VERBOSE=true bash .claude/tests/run-all-tests.sh --scripts
```

### 编写测试

示例测试结构：

```bash
#!/usr/bin/env bash

# check-prerequisites.sh 的测试套件

# 设置
setup() {
    # 创建临时目录
    export TEST_TMP_DIR=$(mktemp -d)

    # Mock 函数
    mock_git "rev-parse --show-toplevel" "$TEST_TMP_DIR"
}

# 清理
teardown() {
    rm -rf "$TEST_TMP_DIR"
}

# 测试：成功场景
test_check_prerequisites_success() {
    # 设置
    setup

    # 执行
    bash check-prerequisites.sh > /dev/null
    local exit_code=$?

    # 断言
    assert_equals "0" "$exit_code"

    # 清理
    teardown
}

# 运行测试
test_check_prerequisites_success
```

**测试要求**：
- 使用 `assert_equals`、`assert_contains`、`assert_json_field`
- Mock 外部依赖（git、网络）
- 使用临时目录进行文件操作
- 在 teardown 中清理资源
- 测试成功和失败场景

---

## Pull Request 流程

### 提交前

1. **更新你的 fork**
   ```bash
   git remote add upstream https://github.com/Dimon94/cc-devflow.git
   git fetch upstream
   git rebase upstream/main
   ```

2. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **进行更改**
   - 遵循[编码规范](#编码规范)
   - 为新功能添加测试
   - 更新文档

4. **运行质量检查**
   ```bash
   # 运行所有测试
   bash .claude/tests/run-all-tests.sh --scripts

   # 运行 Constitution 合规性检查
   bash .claude/scripts/validate-constitution.sh

   # 检查 Hooks 配置
   bash .claude/scripts/validate-hooks.sh
   ```

5. **提交更改**
   ```bash
   git add .
   git commit -m "feat(scope): 你的提交信息"
   ```

### 提交 PR

1. **推送到你的 fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **在 GitHub 上创建 Pull Request**
   - 使用清晰、描述性的标题
   - 用 `Closes #123` 引用相关 Issues
   - 详细描述你的更改
   - 添加截图/演示（如适用）

3. **PR 描述模板**
   ```markdown
   ## 描述
   简要描述你的更改。

   ## 动机
   为什么需要这个更改？

   ## 更改
   - 更改 1
   - 更改 2
   - 更改 3

   ## 测试
   你如何测试你的更改？

   ## 检查清单
   - [ ] 测试已添加/更新
   - [ ] 文档已更新
   - [ ] Constitution 合规性已验证
   - [ ] 所有测试通过
   - [ ] 提交信息遵循约定
   ```

### PR 审查流程

1. **自动检查**
   - 所有测试必须通过
   - Constitution 合规性检查必须通过
   - 无合并冲突

2. **代码审查**
   - 至少需要一位维护者批准
   - 处理所有审查意见
   - 保持讨论建设性

3. **合并**
   - Squash and merge（默认）
   - 维护者将在批准后合并

---

## Constitution 合规性

cc-devflow 由 **Constitution v2.0.0** 管理，包含 10 条条款：

1. **Article I**: 质量优先
2. **Article II**: 安全优先
3. **Article III**: 禁止硬编码机密
4. **Article IV**: 测试驱动开发
5. **Article V**: 部署优先集成
6. **Article VI**: 测试覆盖率要求（>80%）
7. **Article VII**: 禁止代码重复
8. **Article VIII**: 快速失败
9. **Article IX**: 清晰的错误信息
10. **Article X**: 需求边界

### Phase -1 Constitutional Gates

实施前，所有更改必须通过：
- **简洁性闸门**：避免不必要的复杂性
- **反抽象闸门**：避免过早抽象
- **集成优先闸门**：优先设计集成

### 合规性验证

```bash
# 验证 Constitution 合规性
bash .claude/scripts/validate-constitution.sh

# 查看特定条款
bash .claude/scripts/manage-constitution.sh show --article I

# 检查 Constitution 版本一致性
bash .claude/tests/constitution/test_version_consistency.sh
```

**所有贡献必须符合 Constitution**。不合规的更改将被拒绝。

---

## 质量闸

所有代码更改必须通过质量闸：

### Pre-push Guard

```bash
# 在 git push 时自动运行
.claude/hooks/pre-push-guard.sh
```

检查项：
- ✅ TypeScript 类型检查
- ✅ 测试执行和覆盖率（>80%）
- ✅ Lint 检查（ESLint/Prettier）
- ✅ 安全扫描
- ✅ 构建验证

### TDD 强制执行

所有实现任务必须先编写测试：

```markdown
# TASKS.md（正确的 TDD 顺序）
- [ ] T001: 为用户认证编写测试
- [ ] T002: 实现用户认证
```

**TEST VERIFICATION CHECKPOINT** 必须在实施前通过。

### Guardrail Hooks

- **PreToolUse Hook**：阻止不合规操作（例如 TDD 违规）
- **PostToolUse Hook**：自动记录文件更改到 EXECUTION_LOG.md

---

## 文档指南

### 何时添加文档

- **新命令**：在 `docs/commands/{command-name}.md` 添加详细文档
- **新代理**：在 `.claude/agents/{agent-name}.md` 添加文档
- **新脚本**：在脚本头部添加使用注释
- **架构更改**：更新 `docs/architecture/`
- **重大更改**：更新 CHANGELOG.md 和 README

### 文档结构

遵循以下模板：

**命令文档** (`docs/commands/{command}.md`)：
- 📋 概述
- 🎯 语法
- 📖 参数
- 🎬 使用场景
- 🔄 执行流程
- 💡 示例
- 📂 输出
- 🔗 相关命令

**代理文档** (`.claude/agents/{agent}.md`)：
- 描述和目的
- 工具访问权限（仅 Read、Grep、Glob）
- 输入/输出规范
- 执行流程
- 模板使用（如适用）

### 双语文档

- **README**：`README.md` 和 `README.zh-CN.md` 必须同时更新
- **CONTRIBUTING**：`CONTRIBUTING.md` 和 `CONTRIBUTING.zh-CN.md`
- **命令文档**：首选英文，欢迎中文翻译

---

## 获取帮助

- **Issues**：[GitHub Issues](https://github.com/Dimon94/cc-devflow/issues)
- **讨论**：[GitHub Discussions](https://github.com/Dimon94/cc-devflow/discussions)
- **文档**：查看 `.claude/docs/` 获取内部指南

---

## 许可证

通过为 cc-devflow 做贡献，你同意你的贡献将在 [MIT License](./LICENSE) 下许可。

---

## 致谢

感谢你为 cc-devflow 做出贡献！你的努力让这个项目对每个人都更好。

**请记住**：
- 代码质量 > 代码数量
- 简洁性 > 复杂性
- 测试 > 信任
- 文档 > 假设

**"好代码是不需要例外的代码。"** - Linus Torvalds

---

🌟 **如果 cc-devflow 帮助简化了您的开发工作流，请为此仓库点星！**
