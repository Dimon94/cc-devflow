# Tasks: REQ-005 - Command Emitter (Multi-Platform Adapter Compiler)

**Input**: PRD.md, EPIC.md, TECH_DESIGN.md from `devflow/requirements/REQ-005/`
**Prerequisites**: PRD.md (required), EPIC.md (required), TECH_DESIGN.md (required)

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3...)
- **ID**: T001, T002, T003... (sequential numbering)
- Include exact file paths in task descriptions

---

## Phase 1: Setup (共享基础设施)

**Purpose**: 项目初始化和所有用户故事共用的基础结构

### 任务清单

- [x] **T001** [P] 创建编译器目录结构: `lib/compiler/`, `lib/compiler/emitters/`
- [x] **T002** [P] 创建测试目录结构: `__tests__/compiler/`, `__tests__/compiler/emitters/`
- [x] **T003** 安装新依赖 `gray-matter@^4.0.3` 和 `@iarna/toml@^2.2.5` in `package.json`
- [x] **T004** 添加 `adapt` script 到 `package.json`: `"adapt": "node bin/adapt.js"`
- [x] **T005** [P] 创建输出目录占位: `.codex/.gitkeep`, `.cursor/.gitkeep`, `.qwen/.gitkeep`, `.agent/.gitkeep`
- [x] **T006** [P] 创建生成物目录: `devflow/.generated/.gitkeep`
- [x] **T007** 更新 `.gitignore` 添加生成物目录 (`.codex/`, `.cursor/`, `.qwen/`, `.agent/`, `devflow/.generated/`)

### Constitution Check (Phase 1)
- [x] **Article VII - Simplicity Gate**: 只安装必需的依赖 (gray-matter, @iarna/toml)
- [x] **Article VIII - Anti-Abstraction**: 直接使用框架，无封装
- [x] **Article II - Architectural Consistency**: 遵循现有 lib/ 目录结构

### Code Review Checkpoint (Phase 1)
- [ ] **T008** 触发 `/code-reviewer` 子代理生成 `devflow/requirements/REQ-005/reviews/phase-1-setup_code_review.md`

---

## Phase 2: Foundational Tests (阻塞性前置条件 - TDD)

**Purpose**: 所有用户故事的测试，必须完成且失败后才能开始实现

**CRITICAL**: No implementation work can begin until this phase is complete and ALL TESTS FAIL

### Schemas & Errors Tests

- [x] **T009** [P] [US1] 编写 Zod schemas 测试 in `__tests__/compiler/schemas.test.js`
  - Test: CommandIRSchema validation (valid/invalid cases)
  - Test: FrontmatterSchema validation (required fields)
  - Test: ManifestEntrySchema validation
  - Test: ManifestSchema validation
  - **Expected**: Tests fail (schemas not implemented)

- [x] **T010** [P] [US1] 编写 Error types 测试 in `__tests__/compiler/errors.test.js`
  - Test: MissingFrontmatterError instantiation and message
  - Test: InvalidFrontmatterError instantiation and message
  - Test: UnknownAliasError instantiation and message
  - Test: WriteError instantiation and message
  - Test: ContentTooLargeError instantiation and message
  - **Expected**: Tests fail (error classes not implemented)

### Parser Tests (Story 1)

- [x] **T011** [P] [US1] 编写 Parser 单元测试 in `__tests__/compiler/parser.test.js`
  - Test AC1: Parse file with YAML frontmatter -> return IR with name, description, scripts
  - Test AC2: Parse frontmatter with scripts alias-path mapping
  - Test AC3: Detect {SCRIPT:*} placeholders in body
  - Test AC4: Throw MissingFrontmatterError for file without frontmatter
  - Test AC5: Throw UnknownAliasError for undefined script alias in body
  - Test: parseCommand() returns valid CommandIR
  - Test: parseAllCommands() returns array of CommandIR
  - **Expected**: Tests fail (parser not implemented)

### Transformer Tests (Story 2)

- [x] **T012** [P] [US2] 编写 Transformer 单元测试 in `__tests__/compiler/transformer.test.js`
  - Test AC1: {SCRIPT:prereq} expanded to "bash .claude/scripts/check-prerequisites.sh"
  - Test AC2: $ARGUMENTS -> {{args}} for Qwen
  - Test AC3: $ARGUMENTS -> [arguments] for Antigravity
  - Test AC4: $ARGUMENTS unchanged for Codex/Cursor
  - Test AC5: {AGENT_SCRIPT} expansion with __AGENT__ substitution
  - Test: transformForPlatform() for each platform
  - Test: expandScriptPlaceholders() correct expansion
  - Test: expandAgentScript() correct expansion
  - Test: mapArguments() correct mapping per platform
  - **Expected**: Tests fail (transformer not implemented)

### Emitter Tests (Story 3)

- [x] **T013** [P] [US3] 编写 BaseEmitter 测试 in `__tests__/compiler/emitters/base-emitter.test.js`
  - Test: BaseEmitter interface methods throw "Not implemented"
  - Test: emit() writes file to correct path
  - **Expected**: Tests fail (base-emitter not implemented)

- [x] **T014** [P] [US3] 编写 CodexEmitter 测试 in `__tests__/compiler/emitters/codex-emitter.test.js`
  - Test AC1: Output to .codex/prompts/{filename}.md
  - Test: YAML frontmatter contains description, argument-hint
  - Test: format() produces correct Markdown + YAML structure
  - **Expected**: Tests fail (codex-emitter not implemented)

- [x] **T015** [P] [US3] 编写 CursorEmitter 测试 in `__tests__/compiler/emitters/cursor-emitter.test.js`
  - Test AC2: Output to .cursor/commands/{filename}.md
  - Test: Pure Markdown format (no frontmatter)
  - Test: format() produces correct Markdown structure
  - **Expected**: Tests fail (cursor-emitter not implemented)

- [x] **T016** [P] [US3] 编写 QwenEmitter 测试 in `__tests__/compiler/emitters/qwen-emitter.test.js`
  - Test AC3: Output to .qwen/commands/{filename}.toml
  - Test: TOML format with description and prompt fields
  - Test: format() produces valid TOML
  - **Expected**: Tests fail (qwen-emitter not implemented)

- [x] **T017** [P] [US3] 编写 AntigravityEmitter 测试 in `__tests__/compiler/emitters/antigravity-emitter.test.js`
  - Test AC4: Output to .agent/workflows/{filename}.md
  - Test: YAML frontmatter contains description (max 250 chars)
  - Test AC5: Content >12K split into multiple files
  - Test: splitContent() works correctly
  - **Expected**: Tests fail (antigravity-emitter not implemented)

### Manifest Tests (Story 4)

- [x] **T018** [P] [US4] 编写 Manifest 单元测试 in `__tests__/compiler/manifest.test.js`
  - Test AC1: manifest.json contains source, target, hash, timestamp, platform
  - Test AC2: Skip unchanged files (hash match)
  - Test AC3: Recompile changed files (hash mismatch)
  - Test AC4: checkDrift() returns drifted files
  - Test: hashContent() generates SHA-256
  - Test: loadManifest() / saveManifest() round-trip
  - Test: needsRecompile() logic
  - **Expected**: Tests fail (manifest not implemented)

### CLI Tests (Story 5)

- [x] **T019** [P] [US5] 编写 CLI 单元测试 in `__tests__/compiler/cli.test.js`
  - Test AC1: --platform codex compiles only .codex/
  - Test AC2: --platform cursor compiles only .cursor/
  - Test AC3: --all compiles all platforms
  - Test AC4: No args = --all (default)
  - Test AC5: --platform unknown returns error
  - Test: Exit codes (0=success, 1=error, 2=drift, 3=invalid args)
  - **Expected**: Tests fail (CLI not implemented)

### Skills Registry Tests (Story 6)

- [x] **T020** [P] [US6] 编写 Skills Registry 测试 in `__tests__/compiler/skills-registry.test.js`
  - Test AC1: Output JSON array with name, description, type, triggers, path
  - Test AC2: Parse SKILL.md frontmatter and skill-rules.json
  - Test AC3: Generate Markdown table for Codex context
  - **Expected**: Tests fail (skills-registry not implemented)

### Integration Tests

- [x] **T021** [P] [US1-US3] 编写端到端集成测试 in `__tests__/compiler/integration.test.js`
  - Test: Full pipeline (parse -> transform -> emit) for Codex
  - Test: Full pipeline for Cursor
  - Test: Full pipeline for Qwen
  - Test: Full pipeline for Antigravity
  - Test: Real .claude/commands/ file processing
  - **Expected**: Tests fail (modules not implemented)

---

## ⚠️ TEST VERIFICATION CHECKPOINT

**CRITICAL GATE**: Before proceeding to Phase 3, verify:

1. Run `npm test -- --testPathPattern=compiler`
2. **ALL tests must FAIL** (implementation not yet done)
3. Test count should be approximately 60-80 tests
4. If any test passes unexpectedly, investigate before proceeding

```bash
# Expected output:
# Tests: XX failed, 0 passed
# All tests should fail at this point
npm test -- --testPathPattern=compiler
```

**If tests pass**: STOP and review - something is wrong with test isolation

### Code Review Checkpoint (Phase 2)
- [ ] **T022** 触发 `/code-reviewer` 子代理生成 `devflow/requirements/REQ-005/reviews/phase-2-tests_code_review.md`
  - 验证测试覆盖所有 AC
  - 验证测试全部失败
  - 验证无实现代码泄漏

---

## Phase 3: User Story 1 - 命令文件解析与 IR 构建 (Priority: P1) MVP

**Goal**: 解析 `.claude/commands/*.md` 文件的 frontmatter 和正文，构建 Command IR

**Independent Test**:
```bash
node -e "
const { parseCommand } = require('./lib/compiler/parser.js');
const ir = parseCommand('.claude/commands/flow-prd.md');
console.log('name:', ir.frontmatter.name);
console.log('placeholders:', ir.placeholders.length);
"
```

### Implementation for User Story 1

- [x] **T023** [P] [US1] 实现 Zod schemas in `lib/compiler/schemas.js`
  - PlaceholderSchema
  - FrontmatterSchema (name, description required)
  - CommandIRSchema
  - ManifestEntrySchema
  - ManifestSchema
  - **File size**: <100 lines
  - **让 T009 测试通过**

- [x] **T024** [P] [US1] 实现 Error types in `lib/compiler/errors.js`
  - CompilerError (base class)
  - MissingFrontmatterError
  - InvalidFrontmatterError
  - UnknownAliasError
  - WriteError
  - ContentTooLargeError
  - **File size**: <100 lines
  - **让 T010 测试通过**

- [x] **T025** [US1] 实现 Parser 模块 in `lib/compiler/parser.js` (depends on T023, T024)
  - Import: gray-matter, crypto, zod schemas
  - parseCommand(filePath): 解析单个文件
    - 使用 gray-matter 提取 frontmatter 和 body
    - 验证 frontmatter 必需字段 (name, description)
    - 检测占位符 ({SCRIPT:*}, {AGENT_SCRIPT}, $ARGUMENTS)
    - 计算 SHA-256 hash
    - 返回 CommandIR
  - parseAllCommands(dirPath): 批量解析目录
    - 扫描 *.md 文件
    - 对每个文件调用 parseCommand
    - 返回 CommandIR[]
  - Error handling: 抛出具体错误类型
  - **File size**: <200 lines
  - **让 T011 测试通过**

- [ ] **T026** [US1] 验证 Story 1 独立可测
  - 运行 quickstart.md Section 4.1 验证步骤
  - 确认 Parser 测试全部通过

**Checkpoint**: Parser 模块独立可用，Story 1 AC 全部满足

### Constitution Check (Phase 3)
- [ ] **Article I.1 - NO PARTIAL IMPLEMENTATION**: parseCommand 完整实现所有占位符检测
- [ ] **Article II.1 - NO CODE DUPLICATION**: 使用 gray-matter 而非自定义解析
- [ ] **Article III.2 - Input Validation**: Zod schema 验证所有输入

### Code Review Checkpoint (Phase 3)
- [ ] **T027** 触发 `/code-reviewer` 子代理生成 `devflow/requirements/REQ-005/reviews/phase-3-parser_code_review.md`
  - 验证 Story 1 AC 全部满足
  - 验证无需求扩展

---

## Phase 4: User Story 2 - 占位符展开与参数语法转换 (Priority: P1) MVP

**Goal**: 根据目标平台展开占位符，生成平台特定内容

**Independent Test**:
```bash
node -e "
const { parseCommand } = require('./lib/compiler/parser.js');
const { transformForPlatform } = require('./lib/compiler/transformer.js');
const ir = parseCommand('.claude/commands/flow-prd.md');
const qwen = transformForPlatform(ir, 'qwen');
console.log('Has {{args}}:', qwen.body.includes('{{args}}'));
"
```

### Implementation for User Story 2

- [x] **T028** [US2] 实现 Transformer 模块 in `lib/compiler/transformer.js`
  - transformForPlatform(ir, platform): 主转换函数
    - 调用 expandScriptPlaceholders
    - 调用 expandAgentScript
    - 调用 mapArguments
    - 返回 TransformedContent
  - expandScriptPlaceholders(content, scripts):
    - 正则匹配 {SCRIPT:<alias>}
    - 从 scripts 映射获取路径
    - 替换为 "bash <path>"
    - 验证 alias 存在，否则抛出 UnknownAliasError
  - expandAgentScript(content, agentScripts, platform):
    - 匹配 {AGENT_SCRIPT}
    - 替换 __AGENT__ 为平台标识
    - 嵌入脚本内容
  - mapArguments(content, platform):
    - $ARGUMENTS 映射表:
      - codex/cursor: 保持 $ARGUMENTS
      - qwen: {{args}}
      - antigravity: [arguments]
  - **File size**: <200 lines
  - **让 T012 测试通过**

- [ ] **T029** [US2] 验证 Story 2 独立可测
  - 运行 quickstart.md Section 4.2 验证步骤
  - 确认 Transformer 测试全部通过

**Checkpoint**: Transformer 模块独立可用，Story 2 AC 全部满足

### Constitution Check (Phase 4)
- [ ] **Article I.1 - NO PARTIAL IMPLEMENTATION**: 所有占位符类型完整实现
- [ ] **Article II.3 - Anti-Over-Engineering**: 简单的字符串替换，无复杂 AST
- [ ] **Article V.4 - File Size Limits**: <200 lines

### Code Review Checkpoint (Phase 4)
- [ ] **T030** 触发 `/code-reviewer` 子代理生成 `devflow/requirements/REQ-005/reviews/phase-4-transformer_code_review.md`
  - 验证 Story 2 AC 全部满足
  - 验证占位符展开逻辑正确

---

## Phase 5: User Story 3 - 平台格式发射器 (Priority: P1) MVP

**Goal**: 将展开后的内容按目标平台格式写入对应目录

**Independent Test**:
```bash
npm run adapt -- --platform codex
ls -la .codex/prompts/
head -20 .codex/prompts/flow-prd.md
```

### Implementation for User Story 3

- [ ] **T031** [US3] 实现 BaseEmitter in `lib/compiler/emitters/base-emitter.js`
  - 定义 Emitter 接口:
    - get name(): 平台名称
    - get outputDir(): 输出目录
    - get fileExtension(): 文件扩展名
    - format(ir, transformedContent): 格式化输出
    - emit(filename, content): 写入文件
  - emit() 实现:
    - 确保输出目录存在 (fs.mkdir recursive)
    - 写入文件 (fs.writeFile)
    - 返回 EmitResult
  - **File size**: <80 lines
  - **让 T013 测试通过**

- [ ] **T032** [P] [US3] 实现 CodexEmitter in `lib/compiler/emitters/codex-emitter.js` (depends on T031)
  - extends BaseEmitter
  - name = 'codex'
  - outputDir = '.codex/prompts'
  - fileExtension = '.md'
  - format():
    - 生成 YAML frontmatter (description, argument-hint)
    - 使用 js-yaml.dump()
    - 组合 frontmatter + body
  - **File size**: <60 lines
  - **让 T014 测试通过**

- [ ] **T033** [P] [US3] 实现 CursorEmitter in `lib/compiler/emitters/cursor-emitter.js` (depends on T031)
  - extends BaseEmitter
  - name = 'cursor'
  - outputDir = '.cursor/commands'
  - fileExtension = '.md'
  - format(): 直接返回 body (无 frontmatter)
  - **File size**: <40 lines
  - **让 T015 测试通过**

- [ ] **T034** [P] [US3] 实现 QwenEmitter in `lib/compiler/emitters/qwen-emitter.js` (depends on T031)
  - extends BaseEmitter
  - name = 'qwen'
  - outputDir = '.qwen/commands'
  - fileExtension = '.toml'
  - format():
    - 构造 { description, prompt } 对象
    - 使用 @iarna/toml.stringify()
  - **File size**: <50 lines
  - **让 T016 测试通过**

- [ ] **T035** [P] [US3] 实现 AntigravityEmitter in `lib/compiler/emitters/antigravity-emitter.js` (depends on T031)
  - extends BaseEmitter
  - name = 'antigravity'
  - outputDir = '.agent/workflows'
  - fileExtension = '.md'
  - CONTENT_LIMIT = 12000
  - format():
    - 生成 YAML frontmatter (description, max 250 chars)
    - 检查字符数限制
    - 如超过 12K，调用 splitContent()
  - splitContent(ir, content):
    - 按章节拆分
    - 使用命名约定 (filename-part2.md, filename-part3.md)
  - **File size**: <100 lines
  - **让 T017 测试通过**

- [ ] **T036** [US3] 创建 Emitter 索引 in `lib/compiler/emitters/index.js`
  - 导出所有 Emitter 类
  - 提供 getEmitter(platform) 工厂函数
  - **File size**: <30 lines

- [ ] **T037** [US3] 验证 Story 3 独立可测
  - 运行 quickstart.md Section 4.3 验证步骤
  - 检查四个平台输出目录
  - 确认 Emitter 测试全部通过

**Checkpoint**: 四个 Emitter 独立可用，Story 3 AC 全部满足

### MVP COMPLETE

**At this point**: P1 用户故事 (Story 1-3) 交付完成
- Parser 可解析命令文件
- Transformer 可展开占位符
- Emitter 可输出到四个平台

### Constitution Check (Phase 5)
- [ ] **Article I.1 - NO PARTIAL IMPLEMENTATION**: 四个 Emitter 完整实现
- [ ] **Article II.1 - NO CODE DUPLICATION**: BaseEmitter 复用
- [ ] **Article V.4 - File Size Limits**: 每个 Emitter <100 lines

### Code Review Checkpoint (Phase 5)
- [ ] **T038** 触发 `/code-reviewer` 子代理生成 `devflow/requirements/REQ-005/reviews/phase-5-emitters_code_review.md`
  - 验证 Story 3 AC 全部满足
  - 验证 MVP 完整性
  - 验证四个平台输出格式正确

---

## Phase 6: User Story 4 - Manifest 生成与增量编译支持 (Priority: P2)

**Goal**: 生成 manifest.json 记录编译元数据，支持增量编译和漂移检测

**Independent Test**:
```bash
npm run adapt
cat devflow/.generated/manifest.json | jq '.entries | length'
npm run adapt -- --check
```

### Implementation for User Story 4

- [ ] **T039** [US4] 实现 Manifest 模块 in `lib/compiler/manifest.js`
  - MANIFEST_PATH = 'devflow/.generated/manifest.json'
  - hashContent(content):
    - 使用 crypto.createHash('sha256')
    - 返回 hex 字符串
  - loadManifest():
    - 读取 manifest.json
    - 如不存在返回 null
    - 验证 schema
  - saveManifest(manifest):
    - 写入 manifest.json
    - 创建目录如不存在
  - needsRecompile(sourcePath, sourceHash, manifest):
    - 查找 manifest 中对应条目
    - 比较 hash
    - 返回 boolean
  - addEntry(manifest, entry):
    - 更新或添加条目
  - checkDrift(manifest):
    - 读取所有目标文件
    - 比较 hash 与 manifest
    - 返回 DriftReport
  - **File size**: <150 lines
  - **让 T018 测试通过**

- [ ] **T040** [US4] 验证 Story 4 独立可测
  - 运行 quickstart.md Section 4.4 验证步骤
  - 确认增量编译和漂移检测工作

**Checkpoint**: Manifest 模块独立可用，Story 4 AC 全部满足

### Constitution Check (Phase 6)
- [ ] **Article IV.4 - Caching Strategy**: Manifest 支持增量编译
- [ ] **Article V.4 - File Size Limits**: <150 lines

### Code Review Checkpoint (Phase 6)
- [ ] **T041** 触发 `/code-reviewer` 子代理生成 `devflow/requirements/REQ-005/reviews/phase-6-manifest_code_review.md`
  - 验证 Story 4 AC 全部满足
  - 验证增量编译逻辑正确

---

## Phase 7: User Story 5 - CLI 入口与平台选择 (Priority: P2)

**Goal**: 提供 `npm run adapt` 命令行接口

**Independent Test**:
```bash
npm run adapt -- --help
npm run adapt -- --platform codex
npm run adapt -- --platform unknown  # Should error
```

### Implementation for User Story 5

- [ ] **T042** [US5] 实现 CLI 入口 in `bin/adapt.js`
  - 使用 process.argv 解析参数
  - 支持参数:
    - --platform <name>: 指定平台
    - --all: 所有平台 (default)
    - --check: 漂移检测
    - --verbose: 详细输出
    - --help: 帮助信息
  - Main 流程:
    1. 解析参数
    2. 验证平台参数
    3. 加载 manifest
    4. 解析命令文件 (parseAllCommands)
    5. 对每个文件:
       - 检查是否需要重新编译
       - 转换 (transformForPlatform)
       - 发射 (emitter.emit)
       - 更新 manifest
    6. 保存 manifest
    7. 输出摘要
  - Exit codes:
    - 0: Success
    - 1: Compilation error
    - 2: Drift detected (--check)
    - 3: Invalid arguments
  - **File size**: <200 lines
  - **让 T019 测试通过**

- [ ] **T043** [US5] 实现编译器入口 in `lib/compiler/index.js`
  - compile(options): 编译主函数
    - options: { platforms, verbose, check }
    - 协调 parser, transformer, emitters, manifest
  - 返回 CompileResult
  - **File size**: <100 lines

- [ ] **T044** [US5] 验证 Story 5 独立可测
  - 运行 quickstart.md Section 4.5 验证步骤
  - 确认 CLI 各参数工作正常

**Checkpoint**: CLI 完整可用，Story 5 AC 全部满足

### Constitution Check (Phase 7)
- [ ] **Article I.4 - Quality Gates**: 明确的退出码和错误信息
- [ ] **Article V.3 - Documentation**: --help 提供使用说明

### Code Review Checkpoint (Phase 7)
- [ ] **T045** 触发 `/code-reviewer` 子代理生成 `devflow/requirements/REQ-005/reviews/phase-7-cli_code_review.md`
  - 验证 Story 5 AC 全部满足
  - 验证 CLI 参数处理正确

---

## Phase 8: User Story 6 - Skills Registry 生成 (Priority: P3)

**Goal**: 从 `.claude/skills/` 生成 Skills Registry 摘要

**Independent Test**:
```bash
node -e "
const { generateSkillsRegistry } = require('./lib/compiler/skills-registry.js');
const registry = generateSkillsRegistry('.claude/skills/');
console.log(JSON.stringify(registry, null, 2));
"
```

### Implementation for User Story 6

- [ ] **T046** [US6] 实现 Skills Registry 生成器 in `lib/compiler/skills-registry.js`
  - generateSkillsRegistry(skillsDir):
    - 扫描 .claude/skills/ 子目录
    - 对每个技能目录:
      - 解析 SKILL.md frontmatter (name, description)
      - 解析 skill-rules.json (triggers, enforcement)
    - 返回 JSON 数组
  - formatAsMarkdownTable(registry):
    - 转换为 Markdown 表格格式
    - 用于注入 Codex context
  - **File size**: <100 lines
  - **让 T020 测试通过**

- [ ] **T047** [US6] 集成 Skills Registry 到 CLI
  - 在 bin/adapt.js 添加 --skills 选项
  - 生成 skills-registry.json

- [ ] **T048** [US6] 验证 Story 6 独立可测
  - 确认 Skills Registry 生成正确

**Checkpoint**: Skills Registry 完整可用，Story 6 AC 全部满足

### Constitution Check (Phase 8)
- [ ] **Article I.1 - NO PARTIAL IMPLEMENTATION**: Skills 解析完整
- [ ] **Article V.4 - File Size Limits**: <100 lines

### Code Review Checkpoint (Phase 8)
- [ ] **T049** 触发 `/code-reviewer` 子代理生成 `devflow/requirements/REQ-005/reviews/phase-8-skills_code_review.md`
  - 验证 Story 6 AC 全部满足

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: 跨用户故事的改进和最终验证

### 任务清单

- [ ] **T050** [P] 运行全量测试，确保覆盖率 ≥80%: `npm test -- --coverage`
- [ ] **T051** [P] 运行 linter 并修复问题: `npm run lint`
- [ ] **T052** 运行 quickstart.md 完整验证流程
- [ ] **T053** [P] 更新 `lib/compiler/CLAUDE.md` 架构文档
- [ ] **T054** [P] 更新项目根 `CHANGELOG.md` 添加 REQ-005 变更记录
- [ ] **T055** 代码清理: 删除 console.log, 优化错误信息
- [ ] **T056** 性能验证: 确保单文件 <100ms, 全量 <5s
- [ ] **T057** 集成测试通过确认: `npm test -- --testPathPattern=integration`

### Constitution Check (Phase 9)
- [ ] **Article I.2 - Testing Mandate**: 覆盖率 ≥80%
- [ ] **Article V.1 - NO DEAD CODE**: 无冗余代码
- [ ] **Article V.3 - Documentation**: CLAUDE.md 更新

### Code Review Checkpoint (Phase 9)
- [ ] **T058** 触发 `/code-reviewer` 子代理生成 `devflow/requirements/REQ-005/reviews/phase-9-polish_code_review.md`
  - 验证所有 Story AC 满足
  - 验证无需求扩展
  - 验证代码质量
  - **必须 Pass 方可切换至 QA 流程**

---

## Dependencies & Execution Order (依赖关系与执行顺序)

### Phase Dependencies

```
Phase 1 (Setup)
    |
    v
Phase 2 (Tests) ─── ⚠️ TEST CHECKPOINT (all tests FAIL)
    |
    v
Phase 3 (US1: Parser) ─── Story 1 complete
    |
    v
Phase 4 (US2: Transformer) ─── Story 2 complete
    |
    v
Phase 5 (US3: Emitters) ─── Story 3 complete ─── 🎯 MVP COMPLETE
    |
    v
Phase 6 (US4: Manifest) ─── Story 4 complete
    |
    v
Phase 7 (US5: CLI) ─── Story 5 complete ─── P2 COMPLETE
    |
    v
Phase 8 (US6: Skills Registry) ─── Story 6 complete ─── P3 COMPLETE
    |
    v
Phase 9 (Polish) ─── RELEASE READY
```

### User Story Dependencies

- **US1 (Parser)**: No dependencies - can start after Phase 2
- **US2 (Transformer)**: Depends on US1 (needs CommandIR)
- **US3 (Emitters)**: Depends on US2 (needs TransformedContent)
- **US4 (Manifest)**: Depends on US3 (needs emit results)
- **US5 (CLI)**: Depends on US1-US4 (orchestrates all)
- **US6 (Skills Registry)**: Independent, can run after Phase 2

### Within Each Story

- Tests written in Phase 2 (all FAIL)
- Implementation in Phase 3+ (make tests PASS)
- Code Review after each phase

### Parallel Opportunities

**Phase 1 (all [P] tasks)**:
```bash
# Can run in parallel:
T001: Create lib/compiler/ directory
T002: Create __tests__/compiler/ directory
T005: Create .codex/.gitkeep
T006: Create devflow/.generated/.gitkeep
```

**Phase 2 (all test tasks [P])**:
```bash
# Can run in parallel:
T009: schemas.test.js
T010: errors.test.js
T011: parser.test.js
T012: transformer.test.js
T013-T017: emitter tests
T018: manifest.test.js
T019: cli.test.js
T020: skills-registry.test.js
T021: integration.test.js
```

**Phase 3 (partial)**:
```bash
# Can run in parallel:
T023: schemas.js
T024: errors.js
# Then sequential:
T025: parser.js (depends on T023, T024)
```

**Phase 5 (Emitters)**:
```bash
# T031 first, then parallel:
T032: codex-emitter.js
T033: cursor-emitter.js
T034: qwen-emitter.js
T035: antigravity-emitter.js
```

---

## Implementation Strategy (实施策略)

### MVP First (Story 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: All tests written (all FAIL)
3. **TEST CHECKPOINT**: Verify all tests fail
4. Complete Phase 3: Parser (US1) - tests pass
5. Complete Phase 4: Transformer (US2) - tests pass
6. Complete Phase 5: Emitters (US3) - tests pass
7. **MVP READY**: Can compile to 4 platforms

### Incremental Delivery

1. MVP (Phase 1-5) → Core compilation works
2. Add Manifest (Phase 6) → Incremental compilation
3. Add CLI (Phase 7) → User-friendly interface
4. Add Skills Registry (Phase 8) → Enhanced features
5. Polish (Phase 9) → Production ready

### Single Developer Strategy

Sequential execution in priority order:
1. Phase 1 → Phase 2 → **CHECKPOINT** → Phase 3 → Phase 4 → Phase 5 (MVP)
2. If time: Phase 6 → Phase 7 → Phase 8 → Phase 9

---

## Validation Checklist (验证清单)

### User Story Organization
- [x] 每个用户故事有自己的 Phase (Phase 3-8)
- [x] 所有任务都有 [US#] 标签
- [x] 每个故事有 Independent Test 标准
- [x] 每个故事有 Checkpoint 验证点
- [x] Foundational phase (Phase 2) 只包含测试

### Completeness
- [x] 所有 API contracts 映射到任务 (Parser, Transformer, Emitter, Manifest)
- [x] 所有 data entities 映射到任务 (CommandIR, Manifest)
- [x] 所有用户故事 (6个) 都有对应任务集合
- [x] Setup 和 Foundational phase 明确定义

### Story Independence
- [x] US1 可以独立测试 (Parser 输出 IR)
- [x] US2 可以独立测试 (Transformer 输出 content)
- [x] US3 可以独立测试 (Emitters 输出文件)
- [x] US4 可以独立测试 (Manifest 管理)
- [x] US5 可以独立测试 (CLI 参数处理)
- [x] US6 可以独立测试 (Skills Registry 生成)

### Parallel Safety
- [x] 所有 [P] 标记的任务操作不同文件
- [x] 同一文件的任务没有 [P] 标记
- [x] 有依赖关系的任务没有 [P] 标记

### Path Specificity
- [x] 每个任务指定具体文件路径
- [x] 路径使用 lib/compiler/, bin/, __tests__/compiler/ 结构
- [x] 测试文件路径遵循 __tests__/ 目录结构

### Constitution Alignment
- [x] **Article I - Quality First**: 所有任务完整定义
- [x] **Article II - Architectural Consistency**: 复用现有组件 (zod, js-yaml)
- [x] **Article II - Anti-Over-Engineering**: 简单管线架构
- [x] **Article III - Security First**: 输入验证任务 (Zod schemas)
- [x] **Article VI - Test-First Development**: TDD 顺序正确 (Phase 2 → Phase 3+)
- [x] **Article X - Requirement Boundary**: 仅实现 PRD 明确需求

---

## Progress Tracking (进度跟踪)

### Overall Progress
- [ ] Phase 1: Setup (8 tasks)
- [ ] Phase 2: Foundational Tests (14 tasks)
- [ ] **TEST CHECKPOINT**: All tests fail
- [ ] Phase 3: User Story 1 - Parser (5 tasks) [US1]
- [ ] Phase 4: User Story 2 - Transformer (3 tasks) [US2]
- [ ] Phase 5: User Story 3 - Emitters (8 tasks) [US3] **MVP**
- [ ] Phase 6: User Story 4 - Manifest (3 tasks) [US4]
- [ ] Phase 7: User Story 5 - CLI (4 tasks) [US5]
- [ ] Phase 8: User Story 6 - Skills Registry (4 tasks) [US6]
- [ ] Phase 9: Polish (9 tasks)

### Test Coverage Status
- Contract Tests: 0 / ~20
- Integration Tests: 0 / ~5
- Unit Tests: 0 / ~50
- Coverage: 0% (target: ≥80%)

### User Story Completion
- [ ] US1 (P1): 0 / 5 tasks - Independent Test: PENDING
- [ ] US2 (P1): 0 / 3 tasks - Independent Test: PENDING
- [ ] US3 (P1): 0 / 8 tasks - Independent Test: PENDING
- [ ] US4 (P2): 0 / 3 tasks - Independent Test: PENDING
- [ ] US5 (P2): 0 / 4 tasks - Independent Test: PENDING
- [ ] US6 (P3): 0 / 4 tasks - Independent Test: PENDING

### Constitution Compliance
- [ ] **Initial Check**: All 10 Articles validated
- [ ] **Article I-V**: Core principles checked
- [ ] **Article VI**: TDD sequence enforced
- [ ] **Article VII-IX**: Phase -1 Gates passed
- [ ] **Article X**: Requirement boundary validated
- [ ] **Post-Implementation**: Constitution Check re-run
- [ ] **Security Scan**: No high-severity issues
- [ ] **Code Review**: Architectural consistency verified

---

## 相关文档

- **PRD**: `devflow/requirements/REQ-005/PRD.md`
- **EPIC**: `devflow/requirements/REQ-005/EPIC.md`
- **TECH_DESIGN**: `devflow/requirements/REQ-005/TECH_DESIGN.md`
- **Data Model**: `devflow/requirements/REQ-005/data-model.md`
- **Module Interfaces**: `devflow/requirements/REQ-005/contracts/module-interfaces.md`
- **Quickstart**: `devflow/requirements/REQ-005/quickstart.md`
- **Constitution**: `.claude/constitution/project-constitution.md`
- **Execution Log**: `devflow/requirements/REQ-005/EXECUTION_LOG.md`

---

**Generated by**: planner agent
**Based on**: PRD.md, EPIC.md, TECH_DESIGN.md
**Constitution**: `.claude/constitution/project-constitution.md` v2.0.0
**Template Version**: 3.0.0 (Spec-Kit inspired - User Story Centric + Article-based Constitution)
**Total Tasks**: 58 tasks across 9 phases
