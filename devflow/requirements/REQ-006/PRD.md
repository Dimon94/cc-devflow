# PRD: REQ-006 - Adapter Compiler (RM-008)

**Status**: Final
**Created**: 2025-12-19T14:45:00+08:00
**Owner**: CC-DevFlow Team
**Type**: Requirement
**Milestone**: M4

---

## 技术约束

| 约束类型 | 具体要求 | 优先级 |
| -------- | -------- | ------ |
| 平台兼容 | 必须支持 Cursor, Codex, Antigravity, Qwen 四个目标平台 | HIGH |
| 输出格式 | 各平台使用其官方推荐格式 (MDC, Markdown, TOML) | HIGH |
| 增量编译 | 复用现有 manifest.json 机制，避免全量重编译 | MEDIUM |
| 依赖 | 依赖 RM-006 (Skill System) 和 RM-007 (Command Emitter) 已完成 | HIGH |

---

## 背景与目标

### 业务背景

CC-DevFlow 项目已实现成熟的多平台编译系统（RM-007 Command Emitter），能够将 `.claude/` 目录作为单一事实源（SSOT）编译生成四个目标平台的命令文件。然而，当前系统缺少：

1. **平台规则入口文件** - 各平台目录存在但缺少主规则文件（如 `.cursorrules`, `.codex/skills/SKILL.md`）
2. **技能分发机制** - `skill-rules.json` 已定义触发规则，但缺少编译时技能注册表生成
3. **渐进加载接口** - 缺少 `load_skill()` API 实现运行时按需加载

### 问题陈述

开发者使用非 Claude Code 平台（Cursor/Codex/Qwen/Antigravity）时，无法获得完整的 CC-DevFlow 工作流支持，因为：

1. 平台规则入口文件未自动生成
2. 技能元数据未编译到目标平台格式
3. Hook 机制在其他平台无法直接使用

### 目标

- **主要目标**: 扩展现有编译管线，自动生成四个目标平台的规则入口文件和技能注册表
- **成功指标**: 运行 `npm run adapt` 后，各平台目录包含完整且可用的规则和技能元数据
- **影响范围**: `lib/compiler/`, 目标平台目录 (`.cursor/`, `.codex/`, `.qwen/`, `.agent/`)

---

## 用户故事与验收标准

### Story 1: 平台规则入口文件生成 (Priority: P1) MVP

**As a** CC-DevFlow 用户
**I want** 运行 `npm run adapt` 后自动生成各平台的规则入口文件
**So that** 我可以在 Cursor/Codex/Qwen/Antigravity 中获得完整的 CC-DevFlow 规则支持

**Why this priority**: 规则入口文件是各平台识别和加载 CC-DevFlow 工作流的基础，无此功能则其他平台无法正常工作。

**Independent Test**: 运行编译命令后，验证各平台目录包含正确格式的规则入口文件，且内容符合平台规范。

**Acceptance Criteria**:
```gherkin
AC1: Given 用户运行 `npm run adapt`
     When 编译完成
     Then `.cursor/rules/devflow.mdc` 文件存在且包含有效的 MDC 格式（YAML frontmatter + Markdown body）

AC2: Given 用户运行 `npm run adapt`
     When 编译完成
     Then `.codex/skills/cc-devflow/SKILL.md` 文件存在且包含技能元数据和命令列表

AC3: Given 用户运行 `npm run adapt`
     When 编译完成
     Then `.qwen/commands/devflow.toml` 文件存在且为有效 TOML 格式

AC4: Given 用户运行 `npm run adapt`
     When 编译完成
     Then `.agent/rules/rules.md` 文件存在，且单文件不超过 12,000 字符（Antigravity 限制）

AC5: Given 规则入口文件内容超过平台限制
     When 编译器检测到超限
     Then 自动按 `##` 标题语义分块，生成多个 Part 文件并使用引用链接
```

**Priority**: P1 (Highest - MVP Critical)
**Complexity**: HIGH

---

### Story 2: 技能注册表生成 (Priority: P1) MVP

**As a** CC-DevFlow 用户
**I want** 编译时自动从 `skill-rules.json` 生成技能注册表
**So that** 各平台能够发现和加载可用技能

**Why this priority**: 技能注册表是渐进加载机制的基础，与规则入口文件共同构成 MVP。

**Independent Test**: 编译后验证 `skills-registry.json` 存在且包含所有技能的元数据。

**Acceptance Criteria**:
```gherkin
AC1: Given `skill-rules.json` 定义了 N 个技能
     When 运行 `npm run adapt`
     Then 生成 `devflow/.generated/skills-registry.json`，包含 N 个技能的元数据（name, description, triggers, path）

AC2: Given 技能注册表已生成
     When 查看注册表内容
     Then 每个技能条目包含：name, type, enforcement, triggers, skillPath

AC3: Given 新增一个技能到 `.claude/skills/`
     When 运行 `npm run adapt`
     Then 注册表自动更新，包含新技能

AC4: Given 技能的 `skill-rules.json` 条目被删除
     When 运行 `npm run adapt`
     Then 注册表移除对应技能
```

**Priority**: P1 (Highest - MVP Critical)
**Complexity**: MEDIUM

---

### Story 3: 增量编译扩展 (Priority: P2)

**As a** CC-DevFlow 开发者
**I want** 技能和规则入口文件支持增量编译
**So that** 只有变更的文件会被重新生成，提高编译效率

**Why this priority**: 增量编译是用户体验优化，MVP 可用后优先实现。

**Independent Test**: 修改单个技能后运行编译，验证只有该技能相关的输出被更新。

**Acceptance Criteria**:
```gherkin
AC1: Given 上次编译后无文件变更
     When 运行 `npm run adapt`
     Then 输出 "No changes detected, skipping compilation"

AC2: Given 修改了 `.claude/skills/cc-devflow-orchestrator/skill.md`
     When 运行 `npm run adapt`
     Then 只更新相关的规则入口文件和注册表，其他输出保持不变

AC3: Given manifest.json 记录了上次编译状态
     When 查看 manifest.json
     Then 包含 `skills` 和 `rulesEntry` 字段，记录各平台规则文件的 hash
```

**Priority**: P2 (High)
**Complexity**: MEDIUM

---

### Story 4: 漂移检测 (Priority: P2)

**As a** CI/CD 管道
**I want** 使用 `npm run adapt -- --check` 检测生成物漂移
**So that** 确保仓库中的生成物与源文件同步

**Why this priority**: CI 门禁是确保代码质量的重要环节，MVP 后优先实现。

**Independent Test**: 手动修改生成物后运行 `--check`，验证返回非零退出码。

**Acceptance Criteria**:
```gherkin
AC1: Given 生成物与源文件同步
     When 运行 `npm run adapt -- --check`
     Then 输出 "All generated files are up to date" 且 exit code 0

AC2: Given 手动修改了 `.cursor/rules/devflow.mdc`
     When 运行 `npm run adapt -- --check`
     Then 输出 diff 信息且 exit code 1

AC3: Given 漂移检测失败
     When 查看输出
     Then 显示具体哪些文件不一致，便于开发者定位问题
```

**Priority**: P2 (High)
**Complexity**: LOW

---

### Story 5: Hook 降级策略文档 (Priority: P3)

**As a** 非 Claude Code 平台用户
**I want** 了解 CC-DevFlow Hook 在我的平台如何降级
**So that** 我知道哪些功能可用，哪些需要手动操作

**Why this priority**: 文档是用户体验的一部分，但不阻塞核心功能。

**Independent Test**: 查看生成的规则入口文件，验证包含 Hook 降级说明。

**Acceptance Criteria**:
```gherkin
AC1: Given 用户在 Cursor 平台
     When 查看 `.cursor/rules/devflow.mdc`
     Then 包含 "Hook Compatibility" 章节，说明 Hook 功能在 Cursor 中如何替代

AC2: Given Hook 降级说明
     When 查看内容
     Then 列出每个 Hook 的降级策略（静态规则替代/手动脚本调用/不支持）
```

**Priority**: P3 (Medium)
**Complexity**: LOW

---

### 边界案例处理

- **错误处理**:
  - 源文件格式错误时，输出清晰的错误信息和行号
  - 平台目录不存在时自动创建
  - 编译中断时保持原有生成物不变

- **权限控制**: N/A（本地编译工具，无权限模型）

- **数据验证**:
  - 验证 YAML/TOML 格式有效性
  - 验证生成的 MDC 符合 Cursor 规范
  - 验证 Antigravity 文件不超过 12K 字符

- **边界条件**:
  - 空 skill-rules.json 时生成空注册表
  - 单个技能内容超过 Antigravity 限制时按段落分块

---

## 非功能性要求

### 性能要求

| 指标 | 目标值 | 关键性 |
|------|--------|--------|
| 全量编译时间 | < 5 秒 (189 源文件) | MEDIUM |
| 增量编译时间 | < 1 秒 (单文件变更) | HIGH |
| 内存占用 | < 100 MB | LOW |

### 安全要求

- [x] **身份验证**: N/A（本地 CLI 工具）
- [x] **授权机制**: N/A
- [x] **数据加密**: N/A
- [x] **输入验证**: 验证所有 YAML/TOML/Markdown 输入格式
- [x] **审计日志**: 编译日志输出到 stdout
- [x] **密钥管理**: N/A（无敏感数据处理）

### 可扩展性要求

- **新平台支持**: 通过 `PLATFORM_CONFIG` 注册表添加新平台，无需修改核心逻辑
- **新技能类型**: 通过扩展 `skill-rules.json` schema 支持

### 可靠性要求

- **可用性目标**: N/A（CLI 工具）
- **数据备份**: N/A
- **灾难恢复**: N/A
- **错误处理**: 编译失败时保持原有生成物不变

### 可观测性要求

- **日志记录**: `--verbose` 模式输出详细编译日志
- **监控指标**: N/A
- **告警设置**: N/A
- **追踪**: N/A

### 可访问性要求

- **无障碍标准**: N/A
- **多语言支持**: 日志和错误信息使用英文
- **设备兼容性**: 支持 macOS, Linux, Windows

---

## 技术约束

### 技术栈

- **语言/框架**: Node.js (ES Modules)
- **数据库**: N/A
- **基础设施**: 本地 CLI
- **第三方服务**: N/A

### 架构约束

- **必须使用**:
  - 现有 `lib/compiler/` 管线架构
  - 现有 `manifest.json` 增量编译机制
  - `gray-matter` 库解析 YAML frontmatter

- **禁止使用**:
  - 外部网络请求
  - 数据库依赖

- **集成要求**:
  - 扩展现有 emitter 接口
  - 复用 `skills-registry.js` 模块

- **数据格式**:
  - 输入: Markdown + YAML frontmatter
  - 输出: MDC (Cursor), Markdown (Codex/Antigravity), TOML (Qwen)

### 平台约束

- **浏览器支持**: N/A
- **移动端支持**: N/A
- **操作系统**: macOS, Linux, Windows

### 资源约束

- **预算限制**: N/A
- **时间限制**: M4 里程碑内完成
- **团队规模**: 1 人

---

## 成功指标

### 主要指标

| 指标 | 基线 | 目标 | 时间线 | 测量方法 |
|------|------|------|--------|----------|
| 平台规则文件生成率 | 0/4 平台 | 4/4 平台 | M4 完成 | 运行 `npm run adapt` 后检查文件存在 |
| 技能注册表完整性 | 0% | 100% 技能覆盖 | M4 完成 | 对比 skill-rules.json 条目数 |
| 增量编译效率 | N/A | 单文件 <1s | M4 完成 | 计时测试 |

### 次要指标

| 指标 | 基线 | 目标 | 时间线 | 测量方法 |
|------|------|------|--------|----------|
| 格式验证通过率 | N/A | 100% | M4 完成 | MDC/TOML lint 测试 |

---

## Constitution Check (宪法符合性检查)

**Reference**: `.claude/rules/project-constitution.md` (v2.0.0)

### Article I: Quality First (质量至上)
- [x] **I.1 - NO PARTIAL IMPLEMENTATION**: 所有用户故事有完整验收标准，无占位符
- [x] **I.3 - No Simplification**: 无"暂时简化"描述
- [x] 用户故事遵循 INVEST 准则

### Article X: Requirement Boundary (需求边界) - CRITICAL
- [x] **X.1 - Forced Clarification**: 所有歧义已通过 /flow-clarify 解决
- [x] **X.2 - No Speculative Features**: 无推测性功能
- [x] **X.3 - User Story Independence**: 每个故事有优先级和独立测试

### Article II: Architectural Consistency (架构一致性)
- [x] **II.1 - NO CODE DUPLICATION**: 复用现有编译管线
- [x] **II.3 - Anti-Over-Engineering**: 解决方案适合问题规模
- [x] **II.4 - Single Responsibility**: 清晰的模块职责

### Article III: Security First (安全优先)
- [x] **III.1 - NO HARDCODED SECRETS**: N/A（无敏感数据）
- [x] **III.2 - Input Validation**: 验证 YAML/TOML 格式

### Constitutional Violations (宪法违规记录)

无违规。

---

## 依赖关系

### 上游依赖

- **RM-006 (Skill System)**: 已完成 - 提供 `skill-rules.json` 和技能目录结构
- **RM-007 (Command Emitter)**: 已完成 - 提供编译管线和 emitter 接口

### 下游依赖

- 无（RM-008 是编译系统的最终交付）

### 外部依赖

- **gray-matter**: YAML frontmatter 解析
- **Node.js >= 18**: ES Modules 支持

---

## 风险评估与缓解

### 技术风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Cursor MDC 格式变更 | M | H | 抽象 emitter 接口，监控 Cursor changelog |
| Antigravity 12K 限制更严 | L | M | 已实现章节拆分，可调整分块算法 |

### 业务风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 用户不采用其他平台 | M | L | 优先保证 Claude Code 体验，其他平台为增值 |

### 进度风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| P1 任务延期 | L | H | 按优先级严格执行，P2/P3 可延后 |

---

## 范围界定

### 包含内容

- 四个目标平台的规则入口文件生成（Cursor, Codex, Antigravity, Qwen）
- 技能注册表 JSON 生成
- 扩展 manifest.json 支持增量编译
- 漂移检测 `--check` 功能
- Hook 降级策略文档

### 明确不包含

- MCP 动态加载机制（超出 RM-008 范围）
- 新平台支持（Windsurf, Auggie 等）
- 运行时技能热加载
- GUI 界面

---

## 假设条件

- `.claude/` 目录结构保持稳定，作为单一事实源
- 目标平台文档格式在开发期间不发生重大变更
- spec-kit 的 AGENT_CONFIG 模式已验证可扩展性

---

## 未决问题

无未决问题。所有歧义已通过 /flow-clarify 解决。

---

## 发布计划

### 里程碑

- **Phase 1**: 核心基础设施 (P1 Stories) - M4 Week 1
- **Phase 2**: 增量编译 + 漂移检测 (P2 Stories) - M4 Week 2
- **Phase 3**: 文档 + 集成测试 (P3 Stories) - M4 Week 3

### 回滚计划

- **回滚触发条件**: 编译系统破坏现有 RM-007 功能
- **回滚步骤**: 恢复 `lib/compiler/` 到 RM-007 版本
- **数据处理**: 删除新增的生成物，保留原有输出

---

## Progress Tracking (进度跟踪)

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
- [x] 未决问题跟踪（无未决问题）

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

- [research.md](research/research.md) - 研究决策汇总
- [clarifications/20251219-flow-clarify.md](research/clarifications/20251219-flow-clarify.md) - 澄清报告
- [internal/codebase-overview.md](research/internal/codebase-overview.md) - 代码库分析

### 参考资料

- [Cursor Rules Spec](https://docs.cursor.com/context/rules)
- [Codex CLI Config](https://github.com/openai/codex/blob/main/docs/config.md)
- [Antigravity Docs](https://codelabs.developers.google.com/getting-started-google-antigravity)
- [spec-kit AGENTS.md](https://github.com/github/spec-kit/blob/main/AGENTS.md)

### 术语表

- **MDC**: Markdown Component - Cursor 的规则文件格式，包含 YAML frontmatter
- **SSOT**: Single Source of Truth - 单一事实源，指 `.claude/` 目录
- **Emitter**: 编译管线中负责输出特定平台格式的模块
- **Registry**: 技能注册表，包含所有技能的元数据
- **Drift Detection**: 漂移检测，检查生成物是否与源文件同步

---

**Generated by**: prd-writer agent
**Based on**: CC-DevFlow Constitution v2.0.0
**Template Version**: 2.0.0 (Self-Executable)
**Next Step**: Run `/flow-tech` to generate technical design

---

## Validation Checklist (验证清单)

### 需求不扩散验证 CRITICAL

- [x] **NO SPECULATION**: 所有功能源自研究决策和用户确认
- [x] **ALL CLARIFIED**: 无 [NEEDS CLARIFICATION] 标记
- [x] **NO TECH DETAILS**: 无 API/数据库实现细节
- [x] **STORY INDEPENDENCE**: 每个故事有 Independent Test
- [x] **PRIORITY ASSIGNED**: P1/P2/P3 优先级已分配
- [x] **MVP IDENTIFIED**: P1 故事可独立交付

### 用户故事质量 (INVEST 原则)

- [x] **Independent**: 每个故事可独立交付
- [x] **Negotiable**: 细节可讨论
- [x] **Valuable**: 有明确用户价值
- [x] **Estimable**: 可估算工作量
- [x] **Small**: 可在一个迭代内完成
- [x] **Testable**: 有明确验收标准

### 验收标准质量

- [x] 使用 Given-When-Then 格式
- [x] 包含正常流程
- [x] 包含边界情况
- [x] 包含错误场景
- [x] 具体且可测试
- [x] 每个故事至少 2 个验收标准

### 完整性检查

- [x] 所有必需章节已填写
- [x] 没有 {{PLACEHOLDER}} 未替换
- [x] 所有依赖已识别
- [x] 所有风险已评估
- [x] 范围明确界定
- [x] 假设条件已列出

### Constitution 符合性

- [x] 通过所有宪法检查
- [x] 无违规记录
- [x] 安全要求符合
- [x] 质量要求符合
- [x] 架构要求符合
