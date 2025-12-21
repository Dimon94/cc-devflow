# PRD: REQ-005 - Command Emitter (Multi-Platform Adapter Compiler)

**Status**: Draft
**Created**: 2025-12-18T16:00:00Z
**Owner**: CC-DevFlow Team
**Type**: Requirement
**Roadmap Item**: RM-007
**Milestone**: M4 (Q2-2026)

**Input**: Research materials from `devflow/requirements/REQ-005/research/`
**Prerequisites**: REQ-005 initialized, research decisions (R001-R007) completed

---

## 技术约束

| 约束类型 | 具体要求 | 优先级 |
| -------- | -------- | ------ |
| 单一真相源 | `.claude/` 目录作为唯一源资产，目标平台目录为生成物 | HIGH |
| 库依赖 | gray-matter, js-yaml, @iarna/toml, Node.js crypto | HIGH |
| 文件格式 | Codex/Cursor/Antigravity 输出 Markdown，Qwen 输出 TOML | HIGH |
| 内容限制 | Antigravity 单文件 <=12,000 字符 | HIGH |
| 生成物策略 | 默认不 commit，添加到 .gitignore | MEDIUM |

---

## 背景与目标

### 业务背景

CC-DevFlow 当前的命令、技能、脚本等资产仅能在 Claude Code 环境中使用。随着多平台 AI 编码助手的兴起（Codex CLI、Cursor、Qwen Code、Antigravity IDE），用户希望能够在不同平台上复用相同的开发工作流。

研究阶段（R001-R007）已确认：采用"编译式适配"策略，将 `.claude/` 作为单一真相源，编译生成各平台原生格式的命令文件。

### 问题陈述

当前 `.claude/commands/*.md` 命令文件使用 Claude Code 专属的占位符语法（`{SCRIPT:*}`、`{AGENT_SCRIPT}`、`$ARGUMENTS`），无法直接被其他 AI 编码助手识别和执行。用户需要手动为每个平台维护一套命令文件，导致维护成本高、版本漂移风险大。

### 目标
- **主要目标**: 实现 Command Emitter 编译器，将 `.claude/commands/*.md` 编译为 Codex、Cursor、Qwen、Antigravity 四个平台的原生命令格式
- **成功指标**: 编译生成的命令文件在目标平台上可被识别和调用
- **影响范围**: `.claude/commands/` 下所有命令文件，输出到 `.codex/`、`.cursor/`、`.qwen/`、`.agent/` 目录

---

## 用户故事与验收标准

### Story 1: 命令文件解析与 IR 构建 (Priority: P1) MVP

**As a** CC-DevFlow 维护者
**I want** 编译器能够解析 `.claude/commands/*.md` 文件的 frontmatter 和正文
**So that** 后续平台适配器能够基于统一的中间表示 (IR) 进行转换

**Why this priority**: 这是编译管线的入口，所有后续功能都依赖于此。没有解析能力，整个编译器无法工作。

**Independent Test**: 仅部署解析模块，输入任意 `.claude/commands/*.md` 文件，输出结构化的 IR 对象（包含 frontmatter 字段和 body 内容），无需其他模块参与。

**Acceptance Criteria**:
```gherkin
AC1: Given 一个包含 YAML frontmatter 的命令文件
     When 编译器解析该文件
     Then 返回包含 name, description, scripts, agent_scripts 等字段的 IR 对象

AC2: Given frontmatter 中 scripts 定义了 alias 到脚本路径的映射
     When 编译器解析该文件
     Then IR 对象的 scripts 字段包含完整的 alias-path 映射

AC3: Given 命令文件的正文包含 {SCRIPT:prereq} 占位符
     When 编译器解析该文件
     Then IR 对象标记正文中存在的占位符类型和位置

AC4: Given 一个没有 frontmatter 的 Markdown 文件
     When 编译器尝试解析
     Then 抛出明确的错误信息 "Missing required YAML frontmatter"

AC5: Given frontmatter 中 scripts 字段引用了不存在的 alias
     When 正文使用 {SCRIPT:unknown_alias}
     Then 编译阶段报错 "Unknown script alias: unknown_alias"
```

**Priority**: P1 (Highest - MVP Critical)
**Complexity**: MEDIUM

---

### Story 2: 占位符展开与参数语法转换 (Priority: P1) MVP

**As a** CC-DevFlow 维护者
**I want** 编译器能够根据目标平台展开 `{SCRIPT:*}`、`{AGENT_SCRIPT}`、`$ARGUMENTS` 占位符
**So that** 生成的命令文件使用目标平台的原生语法

**Why this priority**: 占位符展开是编译器的核心转换逻辑，决定生成物是否能被目标平台正确解析。与 Story 1 共同构成 MVP 核心。

**Independent Test**: 给定一个已解析的 IR 对象和目标平台标识，输出展开后的文本内容，无需实际写入文件系统。

**Acceptance Criteria**:
```gherkin
AC1: Given IR 对象的 scripts 定义 prereq: ".claude/scripts/check-prerequisites.sh"
     And 正文包含 {SCRIPT:prereq}
     When 展开为 Codex/Cursor/Antigravity 格式
     Then {SCRIPT:prereq} 被替换为 "bash .claude/scripts/check-prerequisites.sh"

AC2: Given 正文包含 $ARGUMENTS
     When 展开为 Qwen TOML 格式
     Then $ARGUMENTS 被替换为 {{args}}

AC3: Given 正文包含 $ARGUMENTS
     When 展开为 Antigravity 格式
     Then $ARGUMENTS 被替换为 [arguments]

AC4: Given 正文包含 $ARGUMENTS
     When 展开为 Codex 或 Cursor 格式
     Then $ARGUMENTS 保持不变

AC5: Given frontmatter 包含 agent_scripts 且正文包含 {AGENT_SCRIPT}
     And agent_scripts 内容包含 __AGENT__ 占位符
     When 展开为目标平台
     Then __AGENT__ 被替换为目标平台标识符
```

**Priority**: P1 (Highest - MVP Critical)
**Complexity**: MEDIUM

---

### Story 3: 平台格式发射器 (Priority: P1) MVP

**As a** CC-DevFlow 维护者
**I want** 编译器能够将展开后的内容按目标平台格式写入对应目录
**So that** 生成的文件能被目标平台自动发现和加载

**Why this priority**: 发射器是编译管线的出口，将转换结果持久化到正确位置。与 Story 1、2 共同构成可交付的 MVP。

**Independent Test**: 给定展开后的内容和平台标识，在文件系统中生成正确格式和路径的文件，可独立验证文件存在性和格式正确性。

**Acceptance Criteria**:
```gherkin
AC1: Given 一个展开后的 Codex 命令内容
     When 发射器执行
     Then 文件被写入 .codex/prompts/{filename}.md
     And 文件包含 YAML frontmatter (description, argument-hint)

AC2: Given 一个展开后的 Cursor 命令内容
     When 发射器执行
     Then 文件被写入 .cursor/commands/{filename}.md
     And 文件为纯 Markdown 格式（无 frontmatter）

AC3: Given 一个展开后的 Qwen 命令内容
     When 发射器执行
     Then 文件被写入 .qwen/commands/{filename}.toml
     And 文件包含 TOML 格式的 description 和 prompt 字段

AC4: Given 一个展开后的 Antigravity 命令内容
     When 发射器执行
     Then 文件被写入 .agent/workflows/{filename}.md
     And 文件包含必需的 YAML frontmatter (description)

AC5: Given 展开后内容超过 12,000 字符
     And 目标平台为 Antigravity
     When 发射器执行
     Then 内容被拆分为多个文件，通过命名约定关联
```

**Priority**: P1 (Highest - MVP Critical)
**Complexity**: HIGH

---

### Story 4: Manifest 生成与增量编译支持 (Priority: P2)

**As a** CC-DevFlow 维护者
**I want** 编译器生成 manifest.json 记录源文件、目标文件、内容哈希和时间戳
**So that** 支持增量编译和漂移检测

**Why this priority**: Manifest 提升编译效率和可调试性，但 MVP 阶段可以使用全量编译。

**Independent Test**: 执行编译后检查 `devflow/.generated/manifest.json` 存在且包含正确的元数据结构，无需其他模块参与验证。

**Acceptance Criteria**:
```gherkin
AC1: Given 编译器完成一次完整编译
     When 检查 devflow/.generated/manifest.json
     Then 文件存在且包含 source, target, hash, timestamp, platform 字段

AC2: Given manifest.json 已存在
     And 源文件未发生变化（hash 相同）
     When 执行编译
     Then 跳过该文件的编译，日志提示 "Skipped: {filename} (unchanged)"

AC3: Given manifest.json 已存在
     And 源文件发生变化（hash 不同）
     When 执行编译
     Then 重新编译该文件并更新 manifest 中对应条目

AC4: Given 用户执行 npm run adapt -- --check
     When manifest 中的目标文件与实际文件 hash 不一致
     Then 返回非零退出码并列出漂移的文件
```

**Priority**: P2 (High)
**Complexity**: MEDIUM

---

### Story 5: CLI 入口与平台选择 (Priority: P2)

**As a** CC-DevFlow 用户
**I want** 通过 `npm run adapt` 命令选择编译的目标平台
**So that** 可以按需生成特定平台或全部平台的命令文件

**Why this priority**: CLI 入口提升用户体验，但核心编译逻辑可以通过编程方式调用测试。

**Independent Test**: 执行 `npm run adapt -- --platform codex`，验证仅 `.codex/` 目录有输出，其他平台目录不受影响。

**Acceptance Criteria**:
```gherkin
AC1: Given 用户执行 npm run adapt -- --platform codex
     When 编译器运行
     Then 仅生成 .codex/prompts/ 下的文件

AC2: Given 用户执行 npm run adapt -- --platform cursor
     When 编译器运行
     Then 仅生成 .cursor/commands/ 下的文件

AC3: Given 用户执行 npm run adapt -- --all
     When 编译器运行
     Then 生成所有四个平台的命令文件

AC4: Given 用户执行 npm run adapt（无参数）
     When 编译器运行
     Then 默认行为等同于 --all

AC5: Given 用户执行 npm run adapt -- --platform unknown
     When 编译器运行
     Then 返回错误 "Unknown platform: unknown. Supported: codex, cursor, qwen, antigravity"
```

**Priority**: P2 (High)
**Complexity**: LOW

---

### Story 6: Skills Registry 生成 (Priority: P3)

**As a** CC-DevFlow 用户
**I want** 编译器从 `.claude/skills/` 生成 Skills Registry 摘要
**So that** 目标平台的规则文件能够包含技能索引信息

**Why this priority**: Skills Registry 增强跨平台体验，但核心命令编译不依赖此功能。

**Independent Test**: 执行 Skills Registry 生成，输出 JSON 格式的技能摘要列表，验证包含 name、description、triggers、path 字段。

**Acceptance Criteria**:
```gherkin
AC1: Given .claude/skills/ 下存在多个技能目录
     When 生成 Skills Registry
     Then 输出 JSON 数组，每个元素包含 name, description, type, triggers, path

AC2: Given 某技能目录包含 SKILL.md 和 skill-rules.json
     When 解析该技能
     Then 从 SKILL.md frontmatter 提取 name/description
     And 从 skill-rules.json 提取 triggers 和 enforcement

AC3: Given 生成了 Skills Registry
     When 注入到 Codex 的 devflow.context.md
     Then Registry 以 Markdown 表格格式呈现
```

**Priority**: P3 (Medium)
**Complexity**: MEDIUM

---

### 边界案例处理

- **错误处理**:
  - 缺失 frontmatter 时抛出明确错误
  - 未知 script alias 引用时编译失败
  - 文件读写失败时返回详细错误信息
- **权限控制**: 不涉及（本地编译工具）
- **数据验证**:
  - frontmatter 必须包含 name 和 description
  - scripts 中的路径必须存在
- **边界条件**:
  - Antigravity 12K 字符限制的自动拆分
  - 空目录或无命令文件时的处理

---

## 非功能性要求

### 性能要求
| 指标 | 目标值 | 关键性 |
|------|--------|--------|
| 单文件编译时间 | <100ms | MEDIUM |
| 全量编译时间（~50 个命令） | <5s | MEDIUM |
| 增量编译时间（1 个变更文件） | <200ms | LOW |
| 内存占用 | <100MB | LOW |

### 安全要求
- [x] **身份验证**: 不涉及（本地 CLI 工具）
- [x] **授权机制**: 不涉及
- [x] **数据加密**: 不涉及
- [x] **输入验证**: 验证 frontmatter 格式和 script 路径存在性
- [x] **审计日志**: 编译日志输出到 stdout/stderr
- [x] **密钥管理**: NO HARDCODED SECRETS - 编译器不涉及密钥

### 可扩展性要求
- **水平扩展**: 不涉及（单机 CLI 工具）
- **垂直扩展**: 不涉及
- **平台扩展**: 新增平台只需添加对应的 Emitter 模块

### 可靠性要求
- **可用性目标**: 不涉及（CLI 工具）
- **数据备份**: 不涉及（源文件在 `.claude/`，生成物可重建）
- **灾难恢复**: 删除生成目录后重新执行 `npm run adapt`
- **错误处理**: 编译错误时输出详细错误信息并返回非零退出码

### 可观测性要求
- **日志记录**: 编译进度、跳过文件、错误信息输出到 stdout/stderr
- **监控指标**: 不涉及
- **告警设置**: 不涉及
- **追踪**: manifest.json 记录编译历史

### 可访问性要求
- **无障碍标准**: 不涉及（CLI 工具）
- **多语言支持**: 不涉及
- **设备兼容性**: macOS, Linux (Bash 环境)

---

## 技术约束

### 技术栈
- **语言/框架**: Node.js (JavaScript/ESM)
- **数据库**: 不涉及
- **基础设施**: 本地文件系统
- **第三方服务**: 不涉及

### 架构约束
- **必须使用**:
  - gray-matter (frontmatter 解析)
  - js-yaml (YAML 序列化)
  - @iarna/toml (TOML 序列化)
  - Node.js crypto (哈希生成)
- **禁止使用**:
  - Handlebars 或其他运行时模板引擎
  - 复杂的 AST 解析库
- **集成要求**: 复用 `lib/adapters/adapter-interface.js` 的 `AgentAdapter.detect()` 机制
- **数据格式**: Markdown (Codex/Cursor/Antigravity), TOML (Qwen)

### 平台约束
- **浏览器支持**: 不涉及
- **移动端支持**: 不涉及
- **操作系统**: macOS, Linux (优先)；Windows PowerShell 作为后续工作项

### 资源约束
- **预算限制**: 不涉及
- **时间限制**: M4 (Q2-2026) 里程碑
- **团队规模**: 1-2 人

---

## 成功指标

### 主要指标
| 指标 | 基线 | 目标 | 时间线 | 测量方法 |
|------|------|------|--------|----------|
| 命令编译成功率 | 0% | 100% | M4 | 执行 `npm run adapt --all` 无错误 |
| 目标平台覆盖 | 0 | 4 | M4 | Codex, Cursor, Qwen, Antigravity 均有输出 |
| 生成命令可调用性 | 0% | 100% | M4 | 在各平台 CLI 中调用生成的命令无报错 |

### 次要指标
| 指标 | 基线 | 目标 | 时间线 | 测量方法 |
|------|------|------|--------|----------|
| 增量编译生效率 | N/A | >90% | M4+1 | 单文件变更时其他文件不重新编译 |

---

## Constitution Check (宪法符合性检查)

*GATE: 必须在 Epic 规划前通过*

**Reference**: `.claude/rules/project-constitution.md` (v2.0.0)

### Article I: Quality First (质量至上)
- [x] **I.1 - NO PARTIAL IMPLEMENTATION**: 需求定义完整且明确？无占位符和模糊表述？
- [x] **I.3 - No Simplification**: 避免"暂时简化，后续完善"的描述？
- [x] 用户故事遵循 INVEST 准则（Independent, Negotiable, Valuable, Estimable, Small, Testable）？
- [x] 验收标准具体、可测试、可衡量？

### Article X: Requirement Boundary (需求边界) - CRITICAL
- [x] **X.1 - Forced Clarification**: 所有不明确之处标记 `[NEEDS CLARIFICATION: 具体问题]`？
- [x] **X.2 - No Speculative Features**: 无"可能需要"、"未来会"、"建议添加"的功能？
- [x] **X.3 - User Story Independence**: 每个故事有明确优先级（P1, P2, P3...）？
- [x] **X.3 - Independent Test**: 每个故事有独立测试标准？

### Article II: Architectural Consistency (架构一致性)
- [x] **II.1 - NO CODE DUPLICATION**: 识别可复用的现有系统和组件？
  - 复用 `lib/adapters/adapter-interface.js` 的 `AgentAdapter` 接口
  - 复用 `config/adapters.yml` 的平台配置结构
- [x] **II.3 - Anti-Over-Engineering**: 解决方案适合问题规模？无过度设计？
  - 采用简单的管线模式（Parse -> Transform -> Emit）
  - 不引入运行时模板引擎
- [x] **II.4 - Single Responsibility**: 清晰的边界和职责划分？
  - Parser 负责解析，Transformer 负责占位符展开，Emitter 负责格式输出
- [x] 模块化和可扩展性考虑合理？
  - 新增平台只需添加对应的 Emitter 模块

### Article III: Security First (安全优先)
- [x] **III.1 - NO HARDCODED SECRETS**: 定义了密钥管理策略（环境变量/密钥服务）？
  - 不涉及密钥，编译器为纯本地工具
- [x] **III.2 - Input Validation**: 输入验证需求明确？
  - frontmatter 格式验证，script 路径存在性验证
- [x] **III.3 - Least Privilege**: 身份验证/授权机制清晰？
  - 不涉及
- [x] **III.4 - Secure by Default**: 数据加密策略定义？
  - 不涉及

### Article IV: Performance Accountability (性能责任)
- [x] **IV.1 - NO RESOURCE LEAKS**: 考虑了资源管理（连接、文件句柄等）？
  - 使用 Node.js 流式读写，自动管理文件句柄
- [x] **IV.2 - Algorithm Efficiency**: 性能目标现实且可测量？
  - 单文件 <100ms，全量 <5s
- [x] **IV.4 - Caching Strategy**: 规划了监控和告警？
  - manifest.json 支持增量编译

### Article V: Maintainability (可维护性)
- [x] **V.1 - NO DEAD CODE**: 避免不必要的功能？仅实现明确需求？
  - 仅实现 R001-R007 决策中确认的功能
- [x] **V.2 - Separation of Concerns**: 代码易于理解和修改？
  - Parser/Transformer/Emitter 职责分离
- [x] **V.4 - File Size Limits**: 遵循单一职责原则？
  - 每个 Emitter 为独立模块

### Constitutional Violations (宪法违规记录)

无违规。

---

## 依赖关系

### 上游依赖
*此需求实现前必须完成的依赖*
- RM-006 (REQ-004): Agent Adapter Architecture - 提供 `AgentAdapter` 接口和 `detect()` 机制
- `.claude/commands/*.md` 文件必须存在且格式正确

### 下游依赖
*依赖此需求的其他需求*
- RM-008: 运行时编译入口 `update-agent-context.sh` 将调用 Command Emitter
- RM-013 (可选): Local MCP Skills Server 可基于 Skills Registry 实现

### 外部依赖
*第三方或外部系统依赖*
- NPM 包: gray-matter, js-yaml, @iarna/toml
- Node.js >= 18 (ESM 支持)

---

## 风险评估与缓解

### 技术风险
| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Antigravity 12K 限制导致大型命令无法编译 | M | M | 实现自动拆分策略，超过 10K 时拆分为多个 workflow |
| Qwen TOML 格式规范变更 | L | M | 使用 @iarna/toml 标准库，关注官方文档更新 |
| 目标平台目录结构变更 | L | H | 将平台配置抽取到 config，便于快速调整 |

### 业务风险
| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 用户对生成物不熟悉，不知如何使用 | M | M | 在 manifest.json 旁生成 README.md 说明各平台使用方式 |

### 进度风险
| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 四个平台同时开发导致进度延迟 | M | M | P1 用户故事作为 MVP 先交付，P2/P3 迭代完成 |

---

## 范围界定

### 包含内容
- `.claude/commands/*.md` 的解析和编译
- 四个目标平台的命令格式发射 (Codex, Cursor, Qwen, Antigravity)
- 占位符展开 (`{SCRIPT:*}`, `{AGENT_SCRIPT}`, `$ARGUMENTS`)
- manifest.json 生成（支持增量编译和漂移检测）
- Skills Registry 摘要生成（从 `.claude/skills/` 提取）
- CLI 入口 `npm run adapt`

### 明确不包含
*明确列出不在此需求范围内的内容*
- 脚本的跨平台适配（Bash -> PowerShell）：作为独立工作项
- Hooks 的跨平台移植：采用降级策略（写进 workflow 显式步骤）
- MCP Skills Server 实现：归入 RM-013
- 生成物的自动 commit：默认不 commit，添加到 .gitignore
- Windows 原生支持：当前仅支持 macOS/Linux Bash 环境

---

## 假设条件

*创建 PRD 时的关键假设*
- `.claude/commands/*.md` 文件结构保持稳定，frontmatter 包含 name, description, scripts 等字段
- 目标平台的命令目录和格式规范不会发生重大变更
- 用户已安装 Node.js >= 18
- 用户的项目根目录存在 `.claude/` 目录

---

## 未决问题

*Epic 规划前需要回答的问题*

无未决问题。研究阶段 (R001-R007) 和澄清阶段已解决所有关键决策点：
- R001: SSOT + 编译器策略 (已确认)
- R002: 每平台输出目录 (已确认)
- R003-R004: 占位符展开规则 (已确认)
- R005: Manifest 生成 (已确认)
- R006: 文件名保持原名 (已确认)
- R007: 库选择 (已确认)
- 生成物不 commit (已确认)
- Antigravity 拆分策略：超过 10K 自动拆分 (已确认)

---

## 发布计划

### 里程碑
- **Phase 1 (MVP)**: P1 用户故事 (Story 1-3) - 核心编译管线 - M4 Week 1-2
- **Phase 2**: P2 用户故事 (Story 4-5) - Manifest 和 CLI 入口 - M4 Week 3
- **Phase 3**: P3 用户故事 (Story 6) - Skills Registry - M4 Week 4

### 回滚计划
- **回滚触发条件**: 编译生成的命令在目标平台无法被识别或执行
- **回滚步骤**:
  1. 删除生成的目标平台目录 (`.codex/`, `.cursor/`, `.qwen/`, `.agent/`)
  2. 用户恢复手动维护的命令文件（如有）
- **数据处理**: 无持久化数据，生成物可删除重建

---

## Progress Tracking (进度跟踪)

*在 PRD 创建过程中更新*

### 完成状态
- [x] 背景与目标明确
- [x] 用户故事定义（INVEST 合规）
- [x] 验收标准编写（Given-When-Then）
- [x] 功能需求文档化
- [x] 非功能需求规定
- [x] 技术约束识别
- [x] 成功指标定义
- [x] Constitution Check 通过
- [x] 依赖关系映射
- [x] 风险评估完成
- [x] 范围明确界定
- [x] 未决问题跟踪

### 质量检查
- [x] 所有用户故事有验收标准
- [x] 所有 NFR 有量化目标
- [x] 性能目标可测量
- [x] 安全要求完整
- [x] 无模糊需求
- [x] 所有缩写已定义

### 闸门状态
- [x] Constitution Check: PASS
- [x] 完整性验证: PASS
- [x] 质量检查: PASS

**准备好进行 Epic 规划**: YES

---

## 附录

### 研究材料
*链接到研究文档*
- [research.md](research/research.md) - 研究决策记录 (R001-R007)
- [research-summary.md](research/research-summary.md) - 研究摘要
- [platform-format-comparison.md](research/mcp/platform-format-comparison.md) - 平台格式对比
- [codebase-overview.md](research/internal/codebase-overview.md) - 代码库概述
- [SOLUTION.md](SOLUTION.md) - 技术方案

### 参考资料
*外部参考和文档*
- [Codex CLI Documentation](https://developers.openai.com/codex/cli/)
- [Codex Slash Commands Guide](https://developers.openai.com/codex/guides/slash-commands/)
- [Cursor Features](https://cursor.com/features)
- [Qwen Code CLI Commands](https://www.zdoc.app/en/QwenLM/qwen-code/blob/main/docs/cli/commands.md)
- [Antigravity Workflows Guide](https://antigravity.codes/blog/workflows)
- [gray-matter GitHub](https://github.com/jonschlinkert/gray-matter)

### 术语表
*定义领域特定术语*
- **Command Emitter**: 编译器组件，将 `.claude/commands/*.md` 转换为目标平台格式
- **SSOT (Single Source of Truth)**: 单一真相源，`.claude/` 目录作为唯一维护的源资产
- **IR (Intermediate Representation)**: 中间表示，解析后的结构化命令数据
- **Frontmatter**: Markdown 文件顶部的 YAML 元数据块
- **Placeholder Expansion**: 占位符展开，将 `{SCRIPT:*}` 等占位符替换为实际内容
- **Manifest**: 编译清单文件，记录源文件、目标文件、哈希和时间戳

---

**Generated by**: prd-writer agent
**Based on**: CC-DevFlow Constitution v2.0.0
**Template Version**: 2.0.0 (Self-Executable)
**Next Step**: Run planner agent to generate EPIC.md and TASKS.md

---

## Validation Checklist (验证清单)

*GATE: PRD 标记为完成前检查*

### 需求不扩散验证 CRITICAL
- [x] **NO SPECULATION**: 所有功能都由用户明确提出或必需
  - 仅实现 R001-R007 研究决策中确认的功能
- [x] **ALL CLARIFIED**: 没有未解决的 [NEEDS CLARIFICATION] 标记
- [x] **NO TECH DETAILS**: 没有技术实现细节（API, 数据库, 框架等）
  - 仅指定必须使用的库（gray-matter 等），不指定具体实现
- [x] **STORY INDEPENDENCE**: 每个故事都有 Independent Test 标准
- [x] **PRIORITY ASSIGNED**: 所有故事都有明确优先级 (P1, P2, P3...)
- [x] **MVP IDENTIFIED**: P1 故事（Story 1-3）能够作为独立 MVP 交付

### 用户故事质量 (INVEST 原则)
- [x] **Independent**: 每个故事可独立交付和测试
- [x] **Negotiable**: 细节可以讨论，实现方式灵活
- [x] **Valuable**: 有明确的用户/业务价值
- [x] **Estimable**: 可以估算工作量（不太大不太小）
- [x] **Small**: 可在一个迭代内完成
- [x] **Testable**: 有明确的验收标准和测试方法

### 验收标准质量
- [x] 使用 Given-When-Then 格式
- [x] 包含正常流程（Happy Path）
- [x] 包含边界情况（Edge Cases）
- [x] 包含错误场景（Error Handling）
- [x] 具体且可测试（非模糊描述）
- [x] 每个故事至少 2 个验收标准

### 完整性检查
- [x] 所有必需章节已填写
- [x] 没有 {{PLACEHOLDER}} 未替换
- [x] 所有依赖已识别（上游、下游、外部）
- [x] 所有风险已评估（技术、业务、进度）
- [x] 范围明确界定（包含 + 不包含）
- [x] 假设条件已列出

### Constitution 符合性
- [x] 通过所有宪法检查
- [x] 违规已文档化并说明理由（无违规）
- [x] 安全要求符合 NO HARDCODED SECRETS
- [x] 质量要求符合 NO PARTIAL IMPLEMENTATION
- [x] 架构要求符合 NO OVER-ENGINEERING
