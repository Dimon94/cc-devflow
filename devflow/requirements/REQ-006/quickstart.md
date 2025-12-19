# REQ-006 Quickstart Guide

**Purpose**: 开发者快速入门指南，包含环境准备、测试命令、验证步骤

---

## 1. 环境准备

### 1.1 前置要求

```bash
# Node.js 版本检查
node --version  # 要求 >= 18.0.0

# 包管理器
npm --version   # 或 pnpm/yarn
```

### 1.2 依赖安装

```bash
# 安装项目依赖
npm install

# 验证依赖
npm ls gray-matter @iarna/toml js-yaml zod
```

### 1.3 目录结构验证

```bash
# 确认源目录存在
ls -la .claude/commands/    # 命令源文件
ls -la .claude/skills/      # 技能源文件
cat .claude/skills/skill-rules.json  # 触发规则

# 确认输出目录可写
mkdir -p .codex .cursor .qwen .agent
mkdir -p devflow/.generated
```

---

## 2. 快速测试

### 2.1 全量编译

```bash
# 编译所有平台
npm run adapt

# 预期输出
# Compilation complete.
#   Platforms: codex, cursor, qwen, antigravity
#   Files compiled: 29
#   Files skipped: 0
#   Resources copied: 47
#   Resources skipped: 0
#   Rules generated: 4
#   Skills registered: 6
```

### 2.2 单平台编译

```bash
# 仅编译 Cursor 平台
npm run adapt:cursor

# 或
npm run adapt -- --platform cursor
```

### 2.3 漂移检测

```bash
# 检测生成文件是否被手动修改
npm run adapt:check

# 预期输出 (无漂移)
# No drift detected.

# 预期输出 (有漂移)
# Drift detected:
#   - .claude/commands/flow-init.md: target file modified since last compile
```

### 2.4 技能注册表生成

```bash
# 仅生成技能注册表
npm run adapt -- --skills

# 验证输出
cat devflow/.generated/skills-registry.json | jq '.skills | length'
```

---

## 3. 测试命令矩阵

| 测试场景 | 命令 | 预期 Exit Code |
|----------|------|----------------|
| 全量编译 | `npm run adapt` | 0 |
| 单平台编译 | `npm run adapt -- --platform cursor` | 0 |
| 漂移检测 (无漂移) | `npm run adapt -- --check` | 0 |
| 漂移检测 (有漂移) | `npm run adapt -- --check` | 2 |
| 技能注册 | `npm run adapt -- --skills` | 0 |
| 详细输出 | `npm run adapt -- --verbose` | 0 |
| 无效平台 | `npm run adapt -- --platform invalid` | 3 |

---

## 4. 验证步骤

### 4.1 验证规则入口文件

```bash
# Cursor MDC
cat .cursor/rules/devflow.mdc | head -20
# 检查: 有 YAML frontmatter (description, globs, alwaysApply)

# Codex SKILL.md
cat .codex/skills/cc-devflow/SKILL.md | head -20
# 检查: 有 YAML frontmatter (name, description, type)

# Qwen TOML
cat .qwen/commands/devflow.toml | head -20
# 检查: 有 [skill] 和 [commands] 段

# Antigravity
cat .agent/rules/rules.md | head -20
# 检查: 有 YAML frontmatter (description)
wc -c .agent/rules/rules.md
# 检查: 字符数 <= 12000
```

### 4.2 验证技能注册表

```bash
# 检查 JSON 有效性
cat devflow/.generated/skills-registry.json | jq .

# 检查技能数量
cat devflow/.generated/skills-registry.json | jq '.skills | length'

# 检查必填字段
cat devflow/.generated/skills-registry.json | jq '.skills[0] | keys'
# 预期: ["name", "description", "type", "enforcement", "priority", "skillPath", "triggers"]
```

### 4.3 验证 Manifest

```bash
# 检查版本
cat devflow/.generated/manifest.json | jq '.version'
# 预期: "2.0"

# 检查新增字段
cat devflow/.generated/manifest.json | jq 'keys'
# 预期: ["entries", "generatedAt", "rulesEntry", "skills", "version"]

# 检查 rulesEntry
cat devflow/.generated/manifest.json | jq '.rulesEntry | keys'
# 预期: ["antigravity", "codex", "cursor", "qwen"]
```

### 4.4 增量编译验证

```bash
# 首次编译
npm run adapt

# 不做修改，再次编译
npm run adapt -- --verbose
# 预期: 所有文件显示 "Skipped: xxx (unchanged)"

# 修改一个源文件
touch .claude/commands/flow-init.md

# 再次编译
npm run adapt -- --verbose
# 预期: flow-init.md 显示 "Compiled: xxx"
```

---

## 5. 单元测试

### 5.1 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- lib/compiler/skills-registry.test.js

# 运行并显示覆盖率
npm test -- --coverage
```

### 5.2 测试文件位置

```
lib/compiler/
├── __tests__/
│   ├── skills-registry.test.js      # 技能注册表测试
│   ├── platforms.test.js            # 平台配置测试
│   ├── rules-emitters.test.js       # 规则 emitter 测试
│   └── manifest-v2.test.js          # Manifest v2.0 测试
└── emitters/__tests__/
    ├── cursor-rules-emitter.test.js
    ├── codex-rules-emitter.test.js
    ├── qwen-rules-emitter.test.js
    └── antigravity-rules-emitter.test.js
```

---

## 6. 常见问题排查

### 6.1 "Unknown platform: xxx"

```bash
# 原因: 平台名拼写错误
# 解决: 使用正确的平台名
npm run adapt -- --platform codex  # 正确
npm run adapt -- --platform Codex  # 错误 (大小写敏感)
```

### 6.2 "Missing required frontmatter field"

```bash
# 原因: 命令文件缺少必填字段
# 解决: 检查源文件 frontmatter

# 查看问题文件
cat .claude/commands/flow-init.md | head -10

# 必须包含:
# ---
# description: "命令描述"
# ---
```

### 6.3 Antigravity 文件被分割

```bash
# 原因: 内容超过 12000 字符限制
# 解决: 这是预期行为

# 查看分割文件
ls -la .agent/rules/
# 可能显示: rules-part1.md, rules-part2.md
```

### 6.4 漂移检测失败

```bash
# 原因: 生成文件被手动修改
# 解决:

# 方案1: 重新编译覆盖
npm run adapt

# 方案2: 恢复到版本控制
git checkout -- .codex/ .cursor/ .qwen/ .agent/
```

---

## 7. CI/CD 集成

### 7.1 GitHub Actions 示例

```yaml
# .github/workflows/adapt-check.yml
name: Adapt Check

on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run adapt -- --check
```

### 7.2 Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
npm run adapt -- --check
```

---

## 8. 开发调试

### 8.1 Verbose 模式

```bash
# 显示每个文件的编译状态
npm run adapt -- --verbose

# 输出示例
# Found 29 command files
# Compiled: flow-init.md -> codex
# Skipped: flow-prd.md -> codex (unchanged)
# ...
```

### 8.2 单步调试

```bash
# 使用 Node.js 调试器
node --inspect-brk bin/adapt.js

# 或使用 VS Code 调试配置
# .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Adapt",
  "program": "${workspaceFolder}/bin/adapt.js",
  "args": ["--verbose"]
}
```

---

**Generated**: 2025-12-19
**Version**: 1.0.0
