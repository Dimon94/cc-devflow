# Quickstart: REQ-005 - Command Emitter

**Generated from**: TECH_DESIGN.md
**Purpose**: 开发环境设置、测试命令、验证步骤

---

## 1. 环境准备

### 1.1 系统要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- macOS / Linux (Bash 环境)

### 1.2 依赖安装

```bash
# 安装项目依赖
npm install

# 安装新增依赖 (如尚未添加)
npm install gray-matter@^4.0.3 @iarna/toml@^2.2.5
```

### 1.3 目录结构

```
cc-devflow/
├── .claude/
│   └── commands/           # 源命令文件 (SSOT)
│       ├── flow-prd.md
│       ├── flow-tech.md
│       └── ...
├── lib/
│   └── compiler/           # 编译器模块 (新增)
│       ├── parser.js
│       ├── transformer.js
│       ├── manifest.js
│       ├── schemas.js
│       ├── errors.js
│       └── emitters/
│           ├── base-emitter.js
│           ├── codex-emitter.js
│           ├── cursor-emitter.js
│           ├── qwen-emitter.js
│           └── antigravity-emitter.js
├── bin/
│   └── adapt.js            # CLI 入口 (新增)
├── .codex/                 # Codex 输出 (生成)
├── .cursor/                # Cursor 输出 (生成)
├── .qwen/                  # Qwen 输出 (生成)
├── .agent/                 # Antigravity 输出 (生成)
└── devflow/
    └── .generated/         # 编译元数据 (生成)
        └── manifest.json
```

---

## 2. 开发命令

### 2.1 编译命令

```bash
# 编译所有平台
npm run adapt

# 编译指定平台
npm run adapt -- --platform codex
npm run adapt -- --platform cursor
npm run adapt -- --platform qwen
npm run adapt -- --platform antigravity

# 检查漂移 (不执行编译)
npm run adapt -- --check

# 详细输出
npm run adapt -- --verbose
```

### 2.2 package.json 配置

```json
{
  "scripts": {
    "adapt": "node bin/adapt.js",
    "adapt:codex": "node bin/adapt.js --platform codex",
    "adapt:cursor": "node bin/adapt.js --platform cursor",
    "adapt:qwen": "node bin/adapt.js --platform qwen",
    "adapt:antigravity": "node bin/adapt.js --platform antigravity",
    "adapt:check": "node bin/adapt.js --check"
  }
}
```

---

## 3. 测试矩阵

### 3.1 单元测试

| 模块 | 测试文件 | 测试内容 |
|------|----------|----------|
| Parser | `__tests__/compiler/parser.test.js` | frontmatter 解析、占位符检测、错误处理 |
| Transformer | `__tests__/compiler/transformer.test.js` | 占位符展开、参数映射、平台差异 |
| Codex Emitter | `__tests__/compiler/emitters/codex.test.js` | YAML frontmatter 格式、文件输出 |
| Cursor Emitter | `__tests__/compiler/emitters/cursor.test.js` | 纯 Markdown 格式、无 frontmatter |
| Qwen Emitter | `__tests__/compiler/emitters/qwen.test.js` | TOML 格式、{{args}} 占位符 |
| Antigravity Emitter | `__tests__/compiler/emitters/antigravity.test.js` | 12K 限制、自动拆分 |
| Manifest | `__tests__/compiler/manifest.test.js` | 增量编译、漂移检测 |

### 3.2 运行测试

```bash
# 运行所有测试
npm test

# 运行编译器测试
npm test -- --testPathPattern=compiler

# 运行单个模块测试
npm test -- __tests__/compiler/parser.test.js

# 覆盖率报告
npm test -- --coverage
```

### 3.3 集成测试

```bash
# 1. 编译所有平台
npm run adapt -- --all

# 2. 验证输出文件存在
ls -la .codex/prompts/
ls -la .cursor/commands/
ls -la .qwen/commands/
ls -la .agent/workflows/

# 3. 验证 manifest
cat devflow/.generated/manifest.json | jq '.entries | length'

# 4. 检查漂移
npm run adapt -- --check
echo "Exit code: $?"
```

---

## 4. 验证步骤

### 4.1 Story 1 验证 (Parser)

```bash
# 测试 frontmatter 解析
node -e "
const { parseCommand } = require('./lib/compiler/parser.js');
const ir = parseCommand('.claude/commands/flow-prd.md');
console.log('name:', ir.frontmatter.name);
console.log('description:', ir.frontmatter.description);
console.log('scripts:', Object.keys(ir.frontmatter.scripts || {}));
console.log('placeholders:', ir.placeholders.length);
"

# 预期输出:
# name: flow-prd
# description: Generate PRD document
# scripts: ['prereq', 'validate']
# placeholders: 5
```

### 4.2 Story 2 验证 (Transformer)

```bash
# 测试占位符展开
node -e "
const { parseCommand } = require('./lib/compiler/parser.js');
const { transformForPlatform } = require('./lib/compiler/transformer.js');
const ir = parseCommand('.claude/commands/flow-prd.md');
const codex = transformForPlatform(ir, 'codex');
const qwen = transformForPlatform(ir, 'qwen');
console.log('Codex body contains {SCRIPT}:', codex.body.includes('{SCRIPT'));
console.log('Qwen body contains {{args}}:', qwen.body.includes('{{args}}'));
"

# 预期输出:
# Codex body contains {SCRIPT}: false (已展开)
# Qwen body contains {{args}}: true
```

### 4.3 Story 3 验证 (Emitters)

```bash
# 编译并检查输出
npm run adapt -- --all --verbose

# 检查 Codex 输出
head -20 .codex/prompts/flow-prd.md
# 预期: 包含 YAML frontmatter (description, argument-hint)

# 检查 Cursor 输出
head -5 .cursor/commands/flow-prd.md
# 预期: 以 # 开头 (无 frontmatter)

# 检查 Qwen 输出
cat .qwen/commands/flow-prd.toml
# 预期: TOML 格式 (description = "...", prompt = "...")

# 检查 Antigravity 输出
head -10 .agent/workflows/flow-prd.md
# 预期: 包含 YAML frontmatter (description)
```

### 4.4 Story 4 验证 (Manifest)

```bash
# 检查 manifest 生成
cat devflow/.generated/manifest.json | jq '.'

# 验证增量编译
# 1. 首次编译
npm run adapt

# 2. 修改一个源文件
touch .claude/commands/flow-prd.md

# 3. 再次编译，观察日志
npm run adapt -- --verbose
# 预期: 仅 flow-prd 被重新编译

# 验证漂移检测
# 1. 手动修改一个输出文件
echo "modified" >> .codex/prompts/flow-prd.md

# 2. 检查漂移
npm run adapt -- --check
# 预期: 返回非零退出码，列出漂移文件
```

### 4.5 Story 5 验证 (CLI)

```bash
# 测试帮助
npm run adapt -- --help

# 测试未知平台
npm run adapt -- --platform unknown
# 预期: 错误 "Unknown platform: unknown"

# 测试成功编译
npm run adapt -- --platform codex
echo "Exit code: $?"
# 预期: 0
```

---

## 5. 常见问题

### Q1: gray-matter 解析失败

**症状**: `MissingFrontmatterError`

**原因**: 文件没有以 `---` 开头的 YAML frontmatter

**解决**: 确保命令文件格式正确:
```markdown
---
name: command-name
description: Command description
---
# Command Body
```

### Q2: 未知 script alias

**症状**: `UnknownAliasError: Unknown script alias: xxx`

**原因**: 正文中引用了 frontmatter.scripts 中未定义的 alias

**解决**: 在 frontmatter 中添加对应的 script alias:
```yaml
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  xxx: .claude/scripts/xxx.sh
```

### Q3: Antigravity 内容过大

**症状**: `ContentTooLargeError`

**原因**: 单个命令文件超过 12,000 字符

**解决**: 编译器会自动拆分，或手动精简命令内容

### Q4: 漂移检测失败

**症状**: `npm run adapt -- --check` 返回非零退出码

**原因**: 生成的文件被手动修改，与源文件不一致

**解决**:
```bash
# 重新编译覆盖
npm run adapt -- --all

# 或删除生成目录后重新编译
rm -rf .codex .cursor .qwen .agent devflow/.generated
npm run adapt
```

---

## 6. 开发清单

### 实现顺序 (TDD)

1. **Phase 2-1**: Parser 模块
   - [ ] 编写 parser.test.js
   - [ ] 实现 parser.js
   - [ ] 验证 Story 1 AC

2. **Phase 2-2**: Transformer 模块
   - [ ] 编写 transformer.test.js
   - [ ] 实现 transformer.js
   - [ ] 验证 Story 2 AC

3. **Phase 2-3**: Emitter 模块
   - [ ] 编写 emitters/*.test.js
   - [ ] 实现 emitters/*.js
   - [ ] 验证 Story 3 AC

4. **Phase 2-4**: Manifest 模块
   - [ ] 编写 manifest.test.js
   - [ ] 实现 manifest.js
   - [ ] 验证 Story 4 AC

5. **Phase 2-5**: CLI 入口
   - [ ] 编写 cli.test.js
   - [ ] 实现 bin/adapt.js
   - [ ] 验证 Story 5 AC

6. **Phase 2-6**: Skills Registry (P3)
   - [ ] 编写 skills-registry.test.js
   - [ ] 实现 skills-registry.js
   - [ ] 验证 Story 6 AC

---

**Generated by**: /flow-tech
**Template Version**: 1.0.0
