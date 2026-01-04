# CC-DevFlow v2.x Backlog

**Last Updated:** 2025-12-26 (Google ecosystem: Antigravity IDE only)
**Total Items:** 14
**Estimated Effort:** 13.0 weeks

## Priority Legend

| Priority | Description | Delivery Target |
|----------|-------------|-----------------|
| **P0** | Critical - Core quality shift-left features | Q4-2025 ~ Q1-2026 |
| **P1** | High - Important enhancements and fixes | Q1-2026 |
| **P2** | Medium - Multi-platform support | Q1-2026 ~ Q2-2026 |

---

## P0: Critical Priority

### RM-001: /flow-clarify 需求澄清命令

**Status:** 🟢 Completed
**Effort:** 2 weeks
**Quarter:** Q4-2025
**Milestone:** M1 (MVP)
**Dependencies:** None
**Merged:** 2025-12-15 (PR #4)

**Description:**
实现需求澄清命令，通过 11 维度歧义扫描引擎在 PRD 生成前消除需求模糊性。

**Acceptance Criteria:**
- [x] 实现 11 维度歧义检测算法
  - 业务目标模糊
  - 用户角色不明确
  - 功能边界不清
  - 非功能需求缺失
  - 数据定义模糊
  - 流程步骤不完整
  - 异常场景未覆盖
  - 依赖关系不明
  - 验收标准缺失
  - 技术约束未知
  - 优先级冲突
- [x] 构建交互式澄清对话流程
- [x] 生成结构化澄清报告（Markdown 格式）
- [x] 与 `/flow-prd` 命令集成
- [ ] 支持澄清历史记录查询 (P3, deferred to future release)

**Technical Notes:**
- 基于 LLM 的语义分析
- 规则引擎 + 机器学习混合模式
- 输出格式: `docs/clarifications/[timestamp]-[feature].md`

**Related Files:**
- `core/clarify.js` (new)
- `prompts/clarify-prompt.md` (new)
- `templates/clarification-report.md` (new)

---

### RM-002: /flow-checklist 需求质量检查命令

**Status:** 🟢 Completed
**Effort:** 2 weeks
**Quarter:** Q1-2026
**Milestone:** M2 (Quality Gates)
**Dependencies:** RM-001
**Merged:** 2025-12-16 (PR #5)

**Description:**
实现需求单元测试命令，在任务分解前对需求完整性和可测试性进行质量门禁检查。

**Acceptance Criteria:**
- [x] 需求单元测试框架
  - 6 种 Checklist 类型 (ux, api, security, performance, data, general)
  - 5 质量维度 (Completeness, Clarity, Consistency, Measurability, Coverage)
  - Anti-Example 规则防止生成实现测试
- [x] 质量检查清单引擎
  - 可配置检查规则（YAML）: `.claude/config/quality-rules.yml`
  - 权重和评分机制: 80% 门禁阈值
  - 阻断阈值设置: 支持 `--skip-gate --reason` 跳过
- [x] 需求覆盖率分析
  - 完成度计算脚本: `calculate-checklist-completion.sh`
  - 可视化报告: `--status` 表格输出
  - JSON 格式输出: `--json` 参数
- [x] 与 `/flow-epic` 集成 （检查不通过则阻断）
  - Entry Gate 集成: `checklist-gate.js` Hook
  - 审计日志: Gate 跳过记录到 EXECUTION_LOG.md

**Technical Notes:**
- 检查规则存储: `.claude/config/quality-rules.yml`
- Checklist 输出: `devflow/requirements/{REQ}/checklists/*.md`
- 最低通过分数: 80% (可配置)

**Related Files:**
- `.claude/commands/flow-checklist.md` (new, 255 lines)
- `.claude/agents/checklist-agent.md` (new, 175 lines)
- `.claude/hooks/checklist-gate.js` (new, 397 lines)
- `.claude/scripts/calculate-checklist-completion.sh` (new, 243 lines)
- `.claude/config/quality-rules.yml` (new, 161 lines)
- `.claude/docs/templates/CHECKLIST_TEMPLATE.md` (new, 52 lines)
- `.claude/commands/flow-epic.md` (modified, Entry Gate)

---

## P1: High Priority

### RM-003: 分支命名优化 (中文转拼音)

**Status:** 🟢 Completed
**Effort:** 0.5 weeks
**Quarter:** Q1-2026
**Milestone:** M3 (v2.0 Release)
**Dependencies:** None
**Merged:** 2025-12-16 (PR #6)

**Description:**
优化 Git 分支命名逻辑，自动将中文特性名转换为拼音，避免 Git 工具兼容性问题。

**Acceptance Criteria:**
- [x] 集成 pinyin 库（使用 `pypinyin`）
- [x] 支持多音字智能选择（使用 lazy_pinyin 进行词组识别）
- [x] 保留英文和数字
- [x] 转换规则：
  - 中文 → 拼音小写（通过 pypinyin）
  - 空格 → 连字符（slugify 函数处理）
  - 特殊字符 → 移除
- [x] 示例: "用户登录功能" → "yong-hu-deng-lu-gong-neng"
- [x] 向后兼容现有分支命名（英文输入行为不变）

**Technical Notes:**
- Library: `pypinyin` (Python 库，通过 python3 调用)
- Update: `.claude/scripts/common.sh` (slugify 函数增强)
- 添加了完整的单元测试套件: `.claude/tests/slugify.bats` (10 个测试用例)

**Related Files:**
- `.claude/scripts/common.sh` (modified, +71 lines)
- `.claude/tests/slugify.bats` (new, 82 lines)
- `README.md` (modified, 添加 pypinyin 可选依赖说明)

---

### RM-004: GitHub API 限流处理

**Status:** 🔵 Planned
**Effort:** 0.5 weeks
**Quarter:** Q1-2026
**Milestone:** M3 (v2.0 Release)
**Dependencies:** None

**Description:**
实现 GitHub API 限流检测和自动重试机制，提升工具在高频使用场景下的稳定性。

**Acceptance Criteria:**
- [ ] 检测 GitHub API rate limit headers
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
  - X-RateLimit-Reset
- [ ] 实现指数退避重试策略
  - 初始延迟: 1s
  - 最大重试: 3 次
  - 退避因子: 2x
- [ ] 友好的用户提示
  - 显示剩余配额
  - 预计恢复时间
- [ ] 可选的 token 轮换机制（多 token 支持）

**Technical Notes:**
- Update: `lib/github-api.js`
- Add retry logic with `axios-retry` or custom implementation
- Log rate limit events for monitoring

**Related Files:**
- `lib/github-api.js`
- `config/github-tokens.yml` (optional, for token rotation)

---

### RM-005: Coverage Summary Table 增强

**Status:** 🔵 Planned
**Effort:** 1 week
**Quarter:** Q1-2026
**Milestone:** M3 (v2.0 Release)
**Dependencies:** None

**Description:**
增强测试覆盖率汇总表功能，提供更丰富的可视化和趋势分析能力。

**Acceptance Criteria:**
- [ ] 增强可视化
  - ASCII 图表（趋势线）
  - 颜色编码（红/黄/绿）
  - 覆盖率热力图
- [ ] 趋势分析
  - 历史对比（最近 5 次提交）
  - 覆盖率变化百分比
  - 新增/减少代码的覆盖情况
- [ ] 导出能力
  - Markdown 格式（默认）
  - JSON 格式（API 集成）
  - HTML 格式（可选）
- [ ] 集成到 `/flow-test` 命令

**Technical Notes:**
- Use `cli-table3` for enhanced tables
- Store historical data in `.devflow/coverage-history.json`
- Generate visualizations with `asciichart`

**Related Files:**
- `core/test.js`
- `lib/coverage-reporter.js` (new)
- `.devflow/coverage-history.json` (data)

---

### RM-014: Context Contract & Slimming（Context Pack）

**Status:** 🔵 Planned
**Effort:** 1 week
**Quarter:** Q1-2026
**Milestone:** M3 (v2.0 Release)
**Dependencies:** RM-001, RM-002

**Description:**
为上下文工程加上“最小契约 + 轻量护栏”，避免上下文膨胀成新规格系统，确保上下文仅记录被消费的信息。

**Acceptance Criteria:**
- [ ] 定义 Context Pack schema（Intent/Constraints/Assumptions/Non-goals/Decision log/Open questions）
- [ ] 每一项字段必须声明消费点（/flow-clarify, /flow-prd, /flow-dev, /flow-test）
- [ ] Context Budget：每段限额（条目/字数）+ 超限精简提示
- [ ] TTL：假设/约束过期提示，要求确认或删除
- [ ] SSOT：requirements/orchestration_status.json 作为唯一事实源
- [ ] flow-audit：schema 校验 + 对齐审计（requirements vs ROADMAP/BACKLOG 差异报告）
- [ ] flow-generate：从 SSOT 生成 ROADMAP/BACKLOG（禁止手改）
- [ ] PR gate：触达 requirements 或 ROADMAP/BACKLOG 时强制 strict audit
- [ ] 规范化状态字段：补齐 roadmap_item/milestone/quarter；completedSteps 词汇统一
- [ ] 增量迁移：仅对变更触达的 REQ 严格校验，legacy 仅告警
- [ ] CONTEXT.md + DECISIONS.md 模板并挂载到 PRD 输出
- [ ] `context-refresh` 触发：需求变更时更新上下文并记录原因

**Technical Notes:**
- Config: `.claude/config/context-contract.yml`, `config/orchestration-schema.yml`
- Validator: `lib/context/validator.js`
- Templates: `.claude/docs/templates/CONTEXT.md`, `.claude/docs/templates/DECISIONS.md`
- Hook: `.claude/hooks/context-budget-gate.js`, `.claude/hooks/flow-audit-gate.js`
- Audit: `bin/flow-audit.js`
- Generate: `bin/flow-generate.js`
- Report: `devflow/.generated/audit-report.json`

**Related Files:**
- `.claude/commands/flow-prd.md` (modified)
- `.claude/commands/flow-dev.md` (modified)
- `lib/context/validator.js` (new)
- `.claude/config/context-contract.yml` (new)
- `.claude/docs/templates/CONTEXT.md` (new)
- `.claude/docs/templates/DECISIONS.md` (new)
- `bin/flow-audit.js` (new)
- `bin/flow-generate.js` (new)
- `config/orchestration-schema.yml` (new)
- `.claude/hooks/flow-audit-gate.js` (new)

---

## P2: Medium Priority

### RM-006: Agent 适配层架构

**Status:** 🟢 Completed
**Effort:** 2 weeks
**Quarter:** Q1-2026
**Milestone:** M3 (v2.0 Release)
**Dependencies:** None
**Merged:** 2025-12-17 (PR #7)

**Description:**
设计并实现多平台 Agent 适配层架构，为后续支持 Codex CLI、Antigravity、Cursor、Qwen Code 等平台奠定基础。

**Acceptance Criteria:**
- [x] 定义 Adapter 接口规范
  ```typescript
  interface AgentAdapter {
    name: string;
    version: string;
    detect(): boolean;
    executeCommand(cmd: string, args: object): Promise<Result>;
    getContext(): Promise<Context>;
    setContext(ctx: Context): Promise<void>;
  }
  ```
- [x] 设计插件系统
  - 动态加载机制
  - 配置文件格式
  - 生命周期钩子
- [x] 创建 Adapter Registry
  - 平台自动检测
  - 优先级排序
  - Fallback 机制
- [x] 实现默认 Adapter（Claude Code CLI）
- [x] 编写 Adapter 开发指南

**Technical Notes:**
- Architecture: Strategy Pattern
- Config: `config/adapters.yml`
- Documentation: `docs/ADAPTER_GUIDE.md`

**Related Files:**
- `lib/adapters/adapter-interface.js` (new)
- `lib/adapters/registry.js` (new)
- `lib/adapters/claude-adapter.js` (new, default)
- `docs/ADAPTER_GUIDE.md` (new)

---

### RM-007: 命令转译器（Command Emitter）

**Status:** 🟢 Completed
**Effort:** 1 week
**Quarter:** Q2-2026
**Milestone:** M4 (Multi-Platform)
**Dependencies:** RM-006

**Description:**
实现命令转译/发射器：以 `.claude/commands/*.md` 为单一事实源（SSOT），生成各平台可消费的命令/工作流文件，并对 `{SCRIPT:*}` / `{AGENT_SCRIPT}` / `$ARGUMENTS` 等占位符做确定性展开。

**Acceptance Criteria:**
- [x] 以 `.claude/commands/*.md` 为输入生成平台命令/工作流
  - Codex: `.codex/prompts/{core-*,flow-*}.md`
  - Cursor: `.cursor/commands/{core-*,flow-*}.md`
  - Qwen: `.qwen/commands/{core-*,flow-*}.toml`
  - Antigravity: `.agent/workflows/{core-*,flow-*}.md`
- [x] 统一 args 占位符策略
  - Markdown targets: `$ARGUMENTS`
  - TOML targets: `{{args}}`
- [x] 展开 cc-devflow 占位符（frontmatter 驱动）
  - `{SCRIPT:<alias>}` → `scripts.<alias>`
  - `{AGENT_SCRIPT}` → `agent_scripts`（并替换 `__AGENT__`）
  - 兼容过渡：`{SCRIPT:<path-with-slash>}` 视为脚本路径直跑（并在输出中提示迁移为 alias）
- [x] 生成命令清单与来源映射（manifest）
  - 记录：source path、target path、hash、生成时间
- [x] 文件名保持原名
  - 不强制增加 `devflow.*` 前缀（cc-devflow 已通过 `core-*` / `flow-*` 自带命名空间）

**Technical Notes:**
- Prefer deterministic transforms over complex templating
- Optional: Handlebars helpers only if needed for placeholders

**Related Files:**
- `lib/compiler/command-emitter.js` (new)
- `lib/compiler/platform-spec.js` (new)
- `devflow/.generated/manifest.json` (new)

---

### RM-008: Adapter Compiler（Dynamic Context Compiler）

**Status:** 🟢 Completed
**Effort:** 1 week
**Quarter:** Q2-2026
**Milestone:** M4 (Multi-Platform)
**Dependencies:** RM-006, RM-007
**Merged:** 2025-12-19 (PR #10)

**Description:**
实现编译式多平台适配入口：扫描 `.claude/`（commands/agents/hooks/scripts/skills/rules/constitution/guides），生成目标平台目录产物（`.codex/.cursor/.qwen/.agent` 等），并以 Skills Registry + Loader 实现渐进加载。

**Acceptance Criteria:**
- [x] CLI 入口
  - `npm run adapt -- --platform <name>` / `--all` / `--check`
- [x] 生成平台规则入口文件（Context/Roles）
  - Cursor: `.cursorrules`
  - Codex: `.codex/prompts/devflow.context.md`
  - Antigravity: `.agent/rules/rules.md`
  - Qwen: 平台约定入口文件（TBD）
- [x] Skills 渐进加载
  - 生成 `Skill Registry`（name/description/triggers/path）并注入到入口文件
  - 提供 `load_skill <name>` 脚本工具（按需输出对应 `SKILL.md`）
- [x] Cursor 脚本入口
  - 生成 `.vscode/tasks.json`，将关键 `/flow-*` 与校验脚本暴露为 tasks
- [x] 增量更新
  - 基于 manifest hash，避免无意义重写
- [x] Antigravity 文件限制处理
  - Rules/Workflows 单文件 ≤ 12,000 chars（超过则拆分并用 `@` 引用）
  - Rules 支持 trigger（Manual / Always On / Model Decision / Glob）
  - Rules 支持 `@filename` 引用（相对路径按 rules 文件位置解析）
- [x] 通过一种方式打包，让用户快捷使用，并且后续的版本的更新，也可以提示用户更新，与快速使用并且在 README 和 READM.zh-CN 里更新快捷使用的操作指引

**Technical Notes:**
- Script: `scripts/adapt.js` (or `scripts/update-agent-context.js` as entrypoint)
- Generated outputs treated as build artifacts (rebuildable)

**Implementation Notes:**
- Runtime entry currently lives in `.claude/scripts/update-agent-context.sh`; it can be invoked with an optional agent argument and no longer relies on `.specify` or spec-kit helpers.
- Plan metadata is best-effort: supply `DEVFLOW_CONTEXT_SOURCE` or `DEVFLOW_PLAN_PATH` to point to a plan, otherwise the script falls back to `devflow/ROADMAP.md`. Missing plan data only logs warnings, never aborts.
- Branch detection honors `DEVFLOW_BRANCH` or live Git state, so feature context still surfaces even outside spec-kit workflows.
- Use `DEVFLOW_AGENT_CONTEXT_TEMPLATE` to override the embedded placeholder template; otherwise the script writes a built-in context outline that matches the placeholder replacements used elsewhere.

**Related Files:**
- `scripts/adapt.js` (new)
- `lib/compiler/index.js` (new)
- `lib/compiler/skill-registry.js` (new)
- `.claude/scripts/update-agent-context.sh` (existing)

---

### RM-009: Codex CLI 适配

**Status:** 🔵 Planned
**Effort:** 0.5 weeks
**Quarter:** Q2-2026
**Milestone:** M4 (Multi-Platform)
**Dependencies:** RM-006, RM-008
**Platform Priority:** #1

**Description:**
实现 Codex CLI 平台适配器，作为多平台支持的首个外部平台。

**Acceptance Criteria:**
- [ ] Codex 平台产物生成
  - `.codex/prompts/devflow.context.md` + `.codex/prompts/{core-*,flow-*}.md`
- [ ] 核心工作流验证
  - `/flow-prd`
  - `/flow-epic`
  - `/flow-dev`
  - `/flow-pr`
- [ ] Codex 特性适配
  - 工具调用格式
  - 上下文管理
  - 错误处理
- [ ] 集成测试套件

**Technical Notes:**
- Target folder aligns with spec-kit: `.codex/prompts/`

**Related Files:**
- `lib/adapters/codex-adapter.js` (new)
- `templates/adapters/codex/` (new)
- `tests/adapters/codex.test.js` (new)

---

### RM-010: Antigravity IDE 适配

**Status:** 🔵 Planned
**Effort:** 1 week
**Quarter:** Q2-2026
**Milestone:** M4 (Multi-Platform)
**Dependencies:** RM-006, RM-008
**Platform Priority:** #2

**Description:**
实现 Antigravity IDE 平台适配：生成 `.agent/rules/rules.md` 与 `.agent/workflows/*.md`，让非 Claude 平台也能消费 cc-devflow 的 workflow/skills/hooks。

**Acceptance Criteria:**
- [ ] 生成 Antigravity 目录结构
  - `.agent/rules/rules.md`
  - `.agent/workflows/{core-*,flow-*}.md`
- [ ] Skills Registry + load_skill 用法注入到 `.agent/rules/rules.md`
- [ ] 核心工作流验证（同 RM-009）

**Technical Notes:**
- Antigravity 与 Gemini CLI 分离；谷歌体系只适配 Antigravity IDE

**Related Files:**
- `lib/adapters/antigravity-adapter.js` (new)
- `templates/adapters/antigravity/` (new)
- `tests/adapters/antigravity.test.js` (new)

---

### RM-011: Cursor 适配

**Status:** 🔵 Planned
**Effort:** 0.5 weeks
**Quarter:** Q2-2026
**Milestone:** M4 (Multi-Platform)
**Dependencies:** RM-006, RM-008
**Platform Priority:** #3

**Description:**
实现 Cursor IDE 平台适配器，支持在 IDE 环境中使用 CC-DevFlow 工作流。

**Acceptance Criteria:**
- [ ] 生成 `.cursorrules`（硬规则 + Skills Registry + Loader 用法）
- [ ] 生成 `.vscode/tasks.json`（暴露关键脚本/flow 入口）
- [ ] 可选生成 `.cursor/commands/{core-*,flow-*}.md`
- [ ] 核心工作流验证（同 RM-009）

**Technical Notes:**
- Cursor API: Extension API
- Context file: `.cursor/commands.json`
- IDE considerations: File watchers, workspace state

**Related Files:**
- `lib/adapters/cursor-adapter.js` (new)
- `templates/adapters/cursor/` (new)
- `tests/adapters/cursor.test.js` (new)

---

### RM-012: Qwen Code 适配

**Status:** 🔵 Planned
**Effort:** 0.5 weeks
**Quarter:** Q2-2026
**Milestone:** M4 (Multi-Platform)
**Dependencies:** RM-006, RM-008
**Platform Priority:** #4

**Description:**
实现通义千问 Qwen Code 平台适配器，优化对中文开发场景的支持。

**Acceptance Criteria:**
- [ ] 生成 `.qwen/commands/{core-*,flow-*}.toml`
- [ ] 生成 Qwen 入口规则文件（以 Qwen CLI 实际约定为准）
- [ ] 核心工作流验证（同 RM-009）
- [ ] 中文提示词优化（可选）

**Technical Notes:**
- Qwen API: [link TBD]
- Context file: `.qwen/config.toml`
- Chinese language optimizations in prompts

**Related Files:**
- `lib/adapters/qwen-adapter.js` (new)
- `templates/adapters/qwen/` (new)
- `tests/adapters/qwen.test.js` (new)

---

### RM-013: Skills Bridge（Registry + Loader + MCP 可选）

**Status:** 🔵 Planned
**Effort:** 0.5 weeks
**Quarter:** Q2-2026
**Milestone:** M4 (Multi-Platform)
**Dependencies:** RM-008

**Description:**
让 `.claude/skills` 在非 Claude 平台可用：通过 Skills Registry（摘要）+ Loader（按需加载）实现渐进披露；对支持 MCP 的平台可选提供本地 Skills MCP Server。

**Acceptance Criteria:**
- [ ] `list_skills` 输出：name + description + triggers
- [ ] `load_skill <name>` 输出：对应 `SKILL.md` 原文
- [ ] 编译器能把 Registry 注入到各平台规则入口文件
- [ ] （可选）MCP server：提供 `list_skills/get_skill` 两个 tools

**Technical Notes:**
- Default path: `.claude/skills/*/SKILL.md`
- Local-only server, no network exposure by default

**Related Files:**
- `scripts/load-skill.sh` or `bin/load-skill.js` (new)
- `lib/mcp/skills-server.js` (new)

---

## Progress Tracking

### Overall Progress

| Priority | Completed | In Progress | Planned | Total | Completion % |
|----------|-----------|-------------|---------|-------|--------------|
| P0       | 2         | 0           | 0       | 2     | 100%         |
| P1       | 1         | 0           | 3       | 4     | 25.0%        |
| P2       | 2         | 0           | 6       | 8     | 25.0%        |
| **Total**| **5**     | **0**       | **9**   | **14**| **35.7%**    |

### Milestone Progress

| Milestone | Target       | Items | Completed | Status |
|-----------|--------------|-------|-----------|--------|
| M1        | Q4-2025 End  | 1     | 1/1       | 🟢 Completed |
| M2        | Q1-2026 Mid  | 1     | 1/1       | 🟢 Completed |
| M3        | Q1-2026 End  | 5     | 2/5       | 🟡 In Progress |
| M4        | Q2-2026 End  | 7     | 2/7       | � In Progress |

### Effort Distribution

| Quarter   | Planned Effort | Items | Focus Area              |
|-----------|----------------|-------|-------------------------|
| Q4-2025   | 2.0 weeks      | 1     | /flow-clarify           |
| Q1-2026   | 7.0 weeks      | 6     | Quality + P1 + Arch     |
| Q2-2026   | 4.0 weeks      | 7     | Multi-platform adapters |
| **Total** | **13.0 weeks** | **14**|                         |

### Dependency Status

| Item    | Depends On | Blocker Status | Ready to Start |
|---------|------------|----------------|----------------|
| RM-001  | -          | N/A            | ✅ Yes (🟢 Completed) |
| RM-002  | RM-001     | 🟢 Completed   | ✅ Yes         |
| RM-003  | -          | N/A            | ✅ Yes         |
| RM-004  | -          | N/A            | ✅ Yes         |
| RM-005  | -          | N/A            | ✅ Yes         |
| RM-014  | RM-001, RM-002 | 🟢 Completed | ✅ Yes         |
| RM-006  | -          | N/A            | ✅ Yes (🟢 Completed) |
| RM-007  | RM-006     | 🟢 Completed   | ✅ Yes (🟢 Completed) |
| RM-008  | RM-006, RM-007 | � Completed | ✅ Yes (🟢 Completed) |
| RM-009  | RM-006, RM-008 | � Completed | ✅ Yes         |
| RM-010  | RM-006, RM-008 | � Completed | ✅ Yes         |
| RM-011  | RM-006, RM-008 | � Completed | ✅ Yes         |
| RM-012  | RM-006, RM-008 | � Completed | ✅ Yes         |
| RM-013  | RM-008     | � Completed   | ✅ Yes         |

---

## Status Legend

- 🔵 **Planned** - Defined, not yet started
- 🟡 **In Progress** - Actively being worked on
- 🟢 **Completed** - Done and verified
- 🔴 **Blocked** - Waiting on dependencies or decisions
- ⚪ **On Hold** - Deprioritized temporarily

---

**Document Status:** Living Document
**Owner:** CC-DevFlow Team
**Next Review:** Weekly during active development
