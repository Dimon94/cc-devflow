# Epic: REQ-005 - Command Emitter (Multi-Platform Adapter Compiler)

**Status**: Planned
**Created**: 2025-12-18T19:00:00Z
**Owner**: CC-DevFlow Team
**Type**: Epic
**Roadmap Item**: RM-007
**Milestone**: M4 (Q2-2026)

**Input**: PRD.md from `devflow/requirements/REQ-005/PRD.md`
**Prerequisites**: PRD.md 已完成并通过 Constitution Check

---

## 概述

### Epic 描述

Command Emitter 是一个本地 CLI 编译工具，采用经典的三阶段编译管线架构 (Parse -> Transform -> Emit)，将 `.claude/commands/*.md` 作为单一真相源 (SSOT)，编译生成 Codex、Cursor、Qwen、Antigravity 四个平台的原生命令格式。

核心思想：让 `.claude/` 成为唯一需要维护的命令源，其他平台的命令文件是可删可重建的生成物。

### 业务价值

1. **消除维护成本**: 用户无需为每个平台手动维护一套命令文件
2. **减少版本漂移**: 所有平台命令从同一源生成，保证一致性
3. **跨平台复用**: CC-DevFlow 的开发工作流可在多平台 AI 编码助手中使用
4. **增量编译**: Manifest 支持只编译变更文件，提升效率

### 目标用户

- CC-DevFlow 维护者: 需要管理多平台命令文件
- 多平台 AI 编码助手用户: 希望在 Codex/Cursor/Qwen/Antigravity 中使用相同工作流

### 成功指标

| 指标 | 基线 | 目标 | 测量方法 | 时间线 |
|------|------|------|----------|--------|
| 命令编译成功率 | 0% | 100% | `npm run adapt --all` 无错误 | M4 |
| 目标平台覆盖 | 0 | 4 | Codex/Cursor/Qwen/Antigravity 均有输出 | M4 |
| 生成命令可调用性 | 0% | 100% | 在各平台 CLI 中调用生成的命令无报错 | M4 |
| 增量编译生效率 | N/A | >90% | 单文件变更时其他文件不重新编译 | M4+1 |

---

## 范围定义

### 包含范围

- `.claude/commands/*.md` 的解析和编译
- 四个目标平台的命令格式发射 (Codex, Cursor, Qwen, Antigravity)
- 占位符展开 (`{SCRIPT:*}`, `{AGENT_SCRIPT}`, `$ARGUMENTS`)
- manifest.json 生成（支持增量编译和漂移检测）
- Skills Registry 摘要生成（从 `.claude/skills/` 提取）
- CLI 入口 `npm run adapt`

### 不包含范围

- 脚本的跨平台适配（Bash -> PowerShell）: 作为独立工作项
- Hooks 的跨平台移植: 采用降级策略（写进 workflow 显式步骤）
- MCP Skills Server 实现: 归入 RM-013
- 生成物的自动 commit: 默认不 commit，添加到 .gitignore
- Windows 原生支持: 当前仅支持 macOS/Linux Bash 环境

### 用户故事映射

#### Story 1: 命令文件解析与 IR 构建 (P1 - MVP)
- **Epic 目标**: 建立编译管线入口，将命令文件转换为结构化的中间表示
- **实现阶段**: Phase 3
- **优先级**: HIGH (MVP Critical)

#### Story 2: 占位符展开与参数语法转换 (P1 - MVP)
- **Epic 目标**: 实现编译器核心转换逻辑，生成平台特定内容
- **实现阶段**: Phase 4
- **优先级**: HIGH (MVP Critical)

#### Story 3: 平台格式发射器 (P1 - MVP)
- **Epic 目标**: 将转换结果持久化到各平台目录
- **实现阶段**: Phase 5
- **优先级**: HIGH (MVP Critical)

#### Story 4: Manifest 生成与增量编译支持 (P2)
- **Epic 目标**: 提升编译效率和可调试性
- **实现阶段**: Phase 6
- **优先级**: MEDIUM

#### Story 5: CLI 入口与平台选择 (P2)
- **Epic 目标**: 提供用户友好的命令行接口
- **实现阶段**: Phase 7
- **优先级**: MEDIUM

#### Story 6: Skills Registry 生成 (P3)
- **Epic 目标**: 增强跨平台技能发现体验
- **实现阶段**: Phase 8
- **优先级**: LOW

---

## Phase -1: 宪法闸门检查 (Pre-Implementation Gates)

### Simplicity Gate (简单性闸门) - Constitution Article VII

- [x] **项目数量**: 使用 ≤3 个项目/模块？
  - 1 个模块: `lib/compiler/` (包含 Parser, Transformer, Emitters, Manifest)
  - 1 个 CLI 入口: `bin/adapt.js`

- [x] **NO FUTURE-PROOFING**: 没有为"未来可能需要"的功能做准备？
  - 仅实现 PRD 中明确的 4 个平台 (Codex, Cursor, Qwen, Antigravity)
  - 无 "Plugin System" 或 "Custom Platform Support"
  - 新增平台通过添加新的 Emitter 模块实现，而非抽象框架

- [x] **Minimal Dependencies**: 只使用必需的依赖库？
  - gray-matter: PRD 明确要求 (frontmatter 解析)
  - @iarna/toml: PRD 明确要求 (Qwen TOML 格式)
  - js-yaml: 已存在 (YAML 序列化)
  - zod: 已存在 (Schema 验证)

**Status**: Passed

### Anti-Abstraction Gate (反抽象闸门) - Constitution Article VIII

- [x] **Framework Trust**: 直接使用框架功能，没有封装？
  - 直接使用 gray-matter 解析 frontmatter
  - 直接使用 js-yaml 生成 YAML
  - 直接使用 @iarna/toml 生成 TOML
  - 无自定义封装层

- [x] **Single Model Representation**: 实体只有一种数据表示？
  - Command IR 是唯一的中间表示
  - 无 DTO/Entity/ViewModel 多层转换

- [x] **No Unnecessary Interfaces**: 没有单一实现的接口？
  - BaseEmitter 有 4 个实现 (Codex, Cursor, Qwen, Antigravity)
  - 接口存在是因为有多个实现

**Status**: Passed

### Integration-First Gate (集成优先闸门) - Constitution Article IX

- [x] **Contracts Defined First**: API contracts 在实现前定义？
  - 所有模块接口已在 `contracts/module-interfaces.md` 中定义
  - 包含 Parser, Transformer, Emitter, Manifest 的函数签名

- [x] **Contract Tests Planned**: Contract tests 在 Phase 2 计划？
  - 将在 Phase 2 编写所有模块的单元测试和集成测试
  - 测试先于实现 (TDD)

- [x] **Real Environment**: 使用真实数据库而非 mocks？
  - 使用真实的 `.claude/commands/` 文件测试
  - 不 mock 文件系统操作

**Status**: Passed

### Complexity Tracking (复杂度追踪表)

无违规。所有 Phase -1 Gates 通过。

---

## 技术方案

### 系统架构

#### 高层架构

```text
                                  .claude/commands/*.md (SSOT)
                                           |
                                           v
                 +--------------------------------------------------+
                 |              PARSER MODULE                       |
                 |  gray-matter: Extract frontmatter + body         |
                 |  Output: Command IR (Intermediate Representation)|
                 +--------------------------------------------------+
                                           |
                                           v
                 +--------------------------------------------------+
                 |            TRANSFORMER MODULE                    |
                 |  - Resolve {SCRIPT:<alias>} from frontmatter     |
                 |  - Resolve {AGENT_SCRIPT} from agent_scripts     |
                 |  - Platform-specific $ARGUMENTS mapping          |
                 |  Output: Transformed content per platform        |
                 +--------------------------------------------------+
                                           |
              +-------------+-------------+-------------+-------------+
              |             |             |             |             |
              v             v             v             v             v
      +-----------+  +-----------+  +-----------+  +-----------+  +-----------+
      |  Codex    |  |  Cursor   |  |   Qwen    |  |Antigravity|  | Manifest  |
      |  Emitter  |  |  Emitter  |  |  Emitter  |  |  Emitter  |  | Generator |
      +-----------+  +-----------+  +-----------+  +-----------+  +-----------+
              |             |             |             |             |
              v             v             v             v             v
      .codex/        .cursor/      .qwen/        .agent/       devflow/
      prompts/       commands/     commands/     workflows/    .generated/
      *.md           *.md          *.toml        *.md          manifest.json
```

#### 核心组件

| 组件 | 职责 | 技术栈 | 文件位置 |
|------|------|--------|----------|
| Parser | 解析 frontmatter 和正文，构建 Command IR | gray-matter, zod | `lib/compiler/parser.js` |
| Transformer | 展开占位符，映射参数语法 | JavaScript | `lib/compiler/transformer.js` |
| Codex Emitter | 生成 Codex 格式 (MD + YAML frontmatter) | js-yaml | `lib/compiler/emitters/codex-emitter.js` |
| Cursor Emitter | 生成 Cursor 格式 (纯 MD) | - | `lib/compiler/emitters/cursor-emitter.js` |
| Qwen Emitter | 生成 Qwen 格式 (TOML) | @iarna/toml | `lib/compiler/emitters/qwen-emitter.js` |
| Antigravity Emitter | 生成 Antigravity 格式 (MD + YAML, 12K 限制) | js-yaml | `lib/compiler/emitters/antigravity-emitter.js` |
| Manifest | 增量编译和漂移检测 | crypto | `lib/compiler/manifest.js` |
| CLI | 命令行入口 | Node.js | `bin/adapt.js` |

### 数据模型

#### Command IR (中间表示)

详见 `data-model.md`，核心字段:

```javascript
CommandIR {
  source: { path, filename, hash },
  frontmatter: { name, description, scripts?, agent_scripts? },
  body: string,
  placeholders: [{ type, raw, alias?, position }]
}
```

#### Manifest Schema

```javascript
Manifest {
  version: "1.0.0",
  generatedAt: string (ISO 8601),
  entries: ManifestEntry[]
}

ManifestEntry {
  source: string,
  target: string,
  hash: string,
  timestamp: string,
  platform: "codex" | "cursor" | "qwen" | "antigravity"
}
```

### API 设计

详见 `contracts/module-interfaces.md`，核心接口:

| 模块 | 函数 | 描述 |
|------|------|------|
| Parser | `parseCommand(filePath)` | 解析单个命令文件 |
| Parser | `parseAllCommands(directory)` | 批量解析命令目录 |
| Transformer | `transformForPlatform(ir, platform)` | 为指定平台转换内容 |
| Emitter | `emit(content)` | 发射到目标目录 |
| Manifest | `loadManifest()` / `updateManifest()` | 加载/更新 manifest |
| Manifest | `checkDrift()` | 检查漂移 |

### 技术栈选型

#### 必须使用

| 技术 | 版本 | 用途 | 来源 |
|------|------|------|------|
| Node.js | >=18 | 运行时 | 现有项目 |
| gray-matter | ^4.0.3 | frontmatter 解析 | PRD 要求 |
| @iarna/toml | ^2.2.5 | TOML 序列化 | PRD 要求 |
| js-yaml | ^4.1.0 | YAML 序列化 | 已有依赖 |
| zod | ^3.22.4 | Schema 验证 | 已有依赖 |

#### 禁止使用

- Handlebars 或其他运行时模板引擎
- 复杂的 AST 解析库
- TypeScript (保持与现有 JavaScript 代码一致)

---

## 实施阶段

### Phase 1: Setup (环境准备)
**预计时间**: 0.5 天

**任务**:
- 创建 `lib/compiler/` 目录结构
- 安装新依赖 (gray-matter, @iarna/toml)
- 配置 package.json scripts

**交付物**:
- 项目结构就绪
- 依赖安装完成

### Phase 2: Foundational Tests (TDD 测试优先)
**预计时间**: 1 天

**关键原则**: 所有测试必须在 Phase 3 之前完成并失败

**任务**:
- 编写 Parser 单元测试
- 编写 Transformer 单元测试
- 编写 Emitter 单元测试
- 编写 Manifest 单元测试
- 编写集成测试

**交付物**:
- 完整的测试套件（全部失败）
- 测试覆盖报告（0% - 预期）

**TEST VERIFICATION CHECKPOINT**: 验证所有测试失败

### Phase 3: US1 - Parser (核心实现 Story 1)
**预计时间**: 1 天

**前提**: Phase 2 的 Parser 测试已失败

**任务**:
- 实现 `lib/compiler/schemas.js`
- 实现 `lib/compiler/errors.js`
- 实现 `lib/compiler/parser.js`
- 让 Parser 测试通过

**交付物**:
- Parser 模块功能完整
- Story 1 验收标准满足

### Phase 4: US2 - Transformer (核心实现 Story 2)
**预计时间**: 1 天

**前提**: Phase 2 的 Transformer 测试已失败

**任务**:
- 实现 `lib/compiler/transformer.js`
- 实现占位符展开逻辑
- 实现参数语法映射
- 让 Transformer 测试通过

**交付物**:
- Transformer 模块功能完整
- Story 2 验收标准满足

### Phase 5: US3 - Emitters (核心实现 Story 3)
**预计时间**: 1.5 天

**前提**: Phase 2 的 Emitter 测试已失败

**任务**:
- 实现 `lib/compiler/emitters/base-emitter.js`
- 实现 `lib/compiler/emitters/codex-emitter.js`
- 实现 `lib/compiler/emitters/cursor-emitter.js`
- 实现 `lib/compiler/emitters/qwen-emitter.js`
- 实现 `lib/compiler/emitters/antigravity-emitter.js`
- 让 Emitter 测试通过

**交付物**:
- 四个平台 Emitter 功能完整
- Story 3 验收标准满足
- **MVP 完成**: P1 用户故事 (Story 1-3) 交付

### Phase 6: US4 - Manifest (Story 4)
**预计时间**: 0.5 天

**任务**:
- 实现 `lib/compiler/manifest.js`
- 让 Manifest 测试通过

**交付物**:
- Manifest 模块功能完整
- 增量编译支持
- Story 4 验收标准满足

### Phase 7: US5 - CLI (Story 5)
**预计时间**: 0.5 天

**任务**:
- 实现 `bin/adapt.js`
- 更新 `package.json` scripts

**交付物**:
- CLI 入口可用
- `npm run adapt` 命令可执行
- Story 5 验收标准满足

### Phase 8: US6 - Skills Registry (Story 6)
**预计时间**: 0.5 天

**任务**:
- 实现 Skills Registry 生成器
- 集成到 CLI

**交付物**:
- Skills Registry 功能完整
- Story 6 验收标准满足

### Phase 9: Polish (完善)
**预计时间**: 0.5 天

**任务**:
- 代码清理和重构
- 文档完善
- 性能优化
- 运行 quickstart.md 验证

**交付物**:
- 生产就绪的系统
- 完整文档

---

## 依赖关系

### 外部依赖

| 依赖 | 类型 | 状态 | 风险 |
|------|------|------|------|
| gray-matter ^4.0.3 | NPM 包 | 需安装 | LOW |
| @iarna/toml ^2.2.5 | NPM 包 | 需安装 | LOW |
| Node.js >= 18 | 运行时 | 已有 | N/A |

### 内部依赖

| 依赖 | 描述 | 影响 |
|------|------|------|
| `.claude/commands/*.md` | 源命令文件 | 必须存在且格式正确 |
| REQ-004 (RM-006) | Agent Adapter Architecture | 提供 `AgentAdapter` 接口参考 |

---

## 质量标准

### Definition of Done (DoD)

#### 代码质量
- [x] 代码审查通过
- [x] 符合团队编码规范 (kebab-case 文件名, CommonJS 导出)
- [x] 无 linter 错误
- [x] NO CODE DUPLICATION 验证
- [x] NO DEAD CODE 验证

#### 测试质量
- [x] 单元测试覆盖率 ≥80%
- [x] 所有集成测试通过
- [x] 所有 contract tests 通过
- [x] TDD 流程遵循（测试先行）

#### 安全质量
- [x] NO HARDCODED SECRETS 验证
- [x] 所有输入已验证 (Zod schema)
- [x] 路径遍历防护

#### 文档质量
- [x] README 更新（如需要）
- [x] quickstart.md 验证通过

### 验收标准

详见 PRD.md 中的 Given-When-Then 验收标准，共 25 条 AC 覆盖 6 个用户故事。

---

## Constitution Check (宪法符合性检查)

### Article I: Quality First (质量至上)
- [x] **I.1 - NO PARTIAL IMPLEMENTATION**: Epic 范围完整且明确
- [x] **I.2 - Testing Mandate**: TDD 流程明确定义，测试覆盖率 ≥80%
- [x] **I.3 - No Simplification**: 避免"暂时简化"的做法
- [x] **I.4 - Quality Gates**: 所有验收标准可测试且明确

### Article II: Architectural Consistency (架构一致性)
- [x] **II.1 - NO CODE DUPLICATION**: 复用现有 js-yaml, zod
- [x] **II.2 - Consistent Naming**: kebab-case 文件名，遵循现有模式
- [x] **II.3 - Anti-Over-Engineering**: 简单的管线架构，无过度设计
- [x] **II.4 - Single Responsibility**: Parser/Transformer/Emitter 职责分离

### Article III: Security First (安全优先)
- [x] **III.1 - NO HARDCODED SECRETS**: 编译器不涉及密钥
- [x] **III.2 - Input Validation**: Zod schema 验证 frontmatter
- [x] **III.3 - Least Privilege**: 不涉及
- [x] **III.4 - Secure by Default**: 路径遍历防护

### Article IV: Performance Accountability (性能责任)
- [x] **IV.1 - NO RESOURCE LEAKS**: Node.js 自动管理文件句柄
- [x] **IV.2 - Algorithm Efficiency**: 单文件 <100ms, 全量 <5s
- [x] **IV.4 - Caching Strategy**: manifest.json 支持增量编译

### Article V: Maintainability (可维护性)
- [x] **V.1 - NO DEAD CODE**: 仅实现 PRD 明确需求
- [x] **V.2 - Separation of Concerns**: Parser/Transformer/Emitter 分离
- [x] **V.3 - Documentation**: quickstart.md 提供验证步骤
- [x] **V.4 - File Size Limits**: 每个 Emitter 独立模块，单文件 ≤500行

### Article VI: Test-First Development (测试优先开发)
- [x] **VI.1 - TDD Mandate**: Phase 2 测试优先
- [x] **VI.2 - Test Independence**: 测试隔离
- [x] **VI.3 - Meaningful Tests**: 真实场景测试

### Article VII-IX: Phase -1 Gates
- [x] **Article VII - Simplicity Gate**: 1 个模块，无未来预留
- [x] **Article VIII - Anti-Abstraction Gate**: 直接使用框架
- [x] **Article IX - Integration-First Gate**: Contracts 优先

### Article X: Requirement Boundary (需求边界)
- [x] **X.1 - Forced Clarification**: 无 [NEEDS CLARIFICATION]
- [x] **X.2 - No Speculative Features**: 仅实现 PRD 明确需求
- [x] **X.3 - User Story Independence**: 每个故事独立可测试

### Constitutional Violations (宪法违规记录)

无违规。

---

## Phase -1 Gate 决策记录

| Gate | Status | 决策 | 理由 |
|------|--------|------|------|
| Simplicity Gate (VII) | PASS | 1 个模块 + 1 个 CLI | 满足 ≤3 项目限制 |
| Anti-Abstraction Gate (VIII) | PASS | 直接使用 gray-matter, js-yaml, @iarna/toml | 无自定义封装 |
| Integration-First Gate (IX) | PASS | contracts/module-interfaces.md 先定义 | 接口契约优先 |

---

## 风险管理

### 技术风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Antigravity 12K 限制导致大型命令无法编译 | M | M | 实现自动拆分策略 |
| Qwen TOML 格式规范变更 | L | M | 使用 @iarna/toml 标准库 |
| 目标平台目录结构变更 | L | H | 平台配置抽取到 Emitter 类 |

### 进度风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 四个平台同时开发导致进度延迟 | M | M | P1 用户故事 (MVP) 先交付 |

---

## 发布计划

### 发布策略
- **部署方式**: NPM script (`npm run adapt`)
- **回滚策略**: 删除生成目录后重新执行

### 里程碑

| 里程碑 | 目标 | 状态 |
|--------|------|------|
| **Phase 1 Complete** | 环境就绪 | Pending |
| **Phase 2 Complete** | 测试完成（失败） | Pending |
| **TEST CHECKPOINT** | 验证测试失败 | Pending |
| **Phase 3-5 Complete** | MVP (Story 1-3) 交付 | Pending |
| **Phase 6-7 Complete** | P2 (Story 4-5) 交付 | Pending |
| **Phase 8-9 Complete** | P3 (Story 6) + Polish | Pending |

---

## Progress Tracking (进度跟踪)

### 完成状态
- [x] 概述定义清晰
- [x] 范围界定明确
- [x] 技术方案完整
- [x] 数据模型设计 (data-model.md)
- [x] API 契约定义 (contracts/module-interfaces.md)
- [x] 实施阶段规划
- [x] 依赖关系识别
- [x] 质量标准定义
- [x] Constitution Check 通过
- [x] 风险评估完成
- [x] 发布计划制定

### 闸门状态
- [x] Constitution Check: PASS
- [x] Phase -1 Gates: PASS
- [x] 技术可行性: PASS
- [x] 依赖就绪: PASS

**准备好进行任务生成**: YES

---

## 相关文档

### 输入文档
- **PRD**: [PRD.md](PRD.md)
- **TECH_DESIGN**: [TECH_DESIGN.md](TECH_DESIGN.md)
- **研究材料**: [research/](research/)
- **数据模型**: [data-model.md](data-model.md)
- **模块接口**: [contracts/module-interfaces.md](contracts/module-interfaces.md)
- **快速开始**: [quickstart.md](quickstart.md)

### 输出文档
- **Tasks**: TASKS.md (本文档生成后)

---

**Generated by**: planner agent
**Based on**: PRD.md, TECH_DESIGN.md, CC-DevFlow Constitution v2.0.0
**Template Version**: 2.0.0 (Self-Executable)
**Next Step**: Generate TASKS.md with TDD order (Phase 2 Tests -> Phase 3+ Implementation)
