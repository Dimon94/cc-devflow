# CC-DevFlow v2.x Backlog

**Last Updated:** 2025-12-15 (RM-001 completed)
**Total Items:** 12
**Estimated Effort:** 11.5 weeks

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

**Status:** 🔵 Planned
**Effort:** 2 weeks
**Quarter:** Q1-2026
**Milestone:** M2 (Quality Gates)
**Dependencies:** RM-001

**Description:**
实现需求单元测试命令，在任务分解前对需求完整性和可测试性进行质量门禁检查。

**Acceptance Criteria:**
- [ ] 需求单元测试框架
  - 测试用例自动生成
  - 边界条件覆盖检查
  - 异常场景覆盖检查
- [ ] 质量检查清单引擎
  - 可配置检查规则（YAML）
  - 权重和评分机制
  - 阻断阈值设置
- [ ] 需求覆盖率分析
  - 功能点覆盖率
  - 场景覆盖率
  - 可视化报告
- [ ] 与 `/flow-epic`集成 （检查不通过则阻断）

**Technical Notes:**
- 检查规则存储: `config/quality-rules.yml`
- 覆盖率报告: `docs/coverage/[feature]-coverage.md`
- 最低通过分数: 80/100

**Related Files:**
- `core/checklist.js` (new)
- `config/quality-rules.yml` (new)
- `lib/coverage-analyzer.js` (new)

---

## P1: High Priority

### RM-003: 分支命名优化 (中文转拼音)

**Status:** 🔵 Planned
**Effort:** 0.5 weeks
**Quarter:** Q1-2026
**Milestone:** M3 (v2.0 Release)
**Dependencies:** None

**Description:**
优化 Git 分支命名逻辑，自动将中文特性名转换为拼音，避免 Git 工具兼容性问题。

**Acceptance Criteria:**
- [ ] 集成 pinyin 库（如 `pinyin-pro`）
- [ ] 支持多音字智能选择
- [ ] 保留英文和数字
- [ ] 转换规则：
  - 中文 → 拼音小写
  - 空格 → 连字符
  - 特殊字符 → 移除
- [ ] 示例: "用户登录功能" → "feature/yong-hu-deng-lu-gong-neng"
- [ ] 向后兼容现有分支命名

**Technical Notes:**
- Library: `pinyin-pro` or `pinyin`
- Update: `lib/git-utils.js`
- Add unit tests for edge cases

**Related Files:**
- `lib/git-utils.js`
- `tests/git-utils.test.js`

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

## P2: Medium Priority

### RM-006: Agent 适配层架构

**Status:** 🔵 Planned
**Effort:** 2 weeks
**Quarter:** Q1-2026
**Milestone:** M3 (v2.0 Release)
**Dependencies:** None

**Description:**
设计并实现多平台 Agent 适配层架构，为后续支持 Codex CLI、Antigravity、Cursor、Qwen Code 等平台奠定基础。

**Acceptance Criteria:**
- [ ] 定义 Adapter 接口规范
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
- [ ] 设计插件系统
  - 动态加载机制
  - 配置文件格式
  - 生命周期钩子
- [ ] 创建 Adapter Registry
  - 平台自动检测
  - 优先级排序
  - Fallback 机制
- [ ] 实现默认 Adapter（Claude Code CLI）
- [ ] 编写 Adapter 开发指南

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

### RM-007: 命令模板引擎

**Status:** 🔵 Planned
**Effort:** 1 week
**Quarter:** Q2-2026
**Milestone:** M4 (Multi-Platform)
**Dependencies:** RM-006

**Description:**
实现命令模板引擎，支持根据不同 AI Agent 平台特性生成定制化命令和提示词。

**Acceptance Criteria:**
- [ ] 模板语法设计
  - 变量替换: `{{variable}}`
  - 条件渲染: `{{#if condition}}...{{/if}}`
  - 循环: `{{#each items}}...{{/each}}`
  - 平台检测: `{{#platform codex}}...{{/platform}}`
- [ ] 平台能力检测
  - 支持的工具 API
  - 上下文大小限制
  - 特殊语法要求
- [ ] 模板存储和管理
  - 路径: `templates/adapters/[platform]/[command].hbs`
  - 版本控制
  - 继承和覆盖
- [ ] 集成到命令执行流程

**Technical Notes:**
- Template engine: Handlebars.js
- Platform detection: Runtime capability probing
- Fallback to generic template if platform-specific not found

**Related Files:**
- `lib/template-engine.js` (new)
- `templates/adapters/codex/` (new)
- `templates/adapters/antigravity/` (new)
- `templates/adapters/cursor/` (new)
- `templates/adapters/qwen/` (new)

---

### RM-008: update-agent-context 脚本

**Status:** 🔵 Planned
**Effort:** 1 week
**Quarter:** Q2-2026
**Milestone:** M4 (Multi-Platform)
**Dependencies:** RM-006, RM-007

**Description:**
实现自动更新 Agent 上下文的脚本，确保各平台 Agent 始终使用最新的项目配置和命令定义。

**Acceptance Criteria:**
- [ ] 上下文同步机制
  - 读取项目配置（`devflow.config.yml`）
  - 生成平台特定上下文文件
  - 触发 Agent 重载
- [ ] 平台特定上下文生成
  - Codex: `.codex/context.json`
  - Antigravity: `.antigravity/agent.yml`
  - Cursor: `.cursor/commands.json`
  - Qwen: `.qwen/config.toml`
- [ ] 增量更新优化
  - 仅同步变更部分
  - 哈希校验避免重复
- [ ] 集成到 `/flow-init` 和配置更新流程

**Technical Notes:**
- Script: `scripts/update-agent-context.js`
- Run on: config changes, post-install, manual trigger
- Support both CLI and programmatic API

**Related Files:**
- `scripts/update-agent-context.js` (new)
- `lib/context-generator.js` (new)

---

### RM-009: Codex CLI 适配

**Status:** 🔵 Planned
**Effort:** 0.5 weeks
**Quarter:** Q2-2026
**Milestone:** M4 (Multi-Platform)
**Dependencies:** RM-006, RM-007
**Platform Priority:** #1

**Description:**
实现 Codex CLI 平台适配器，作为多平台支持的首个外部平台。

**Acceptance Criteria:**
- [ ] 实现 CodexAdapter
  - 继承 AdapterInterface
  - 平台检测逻辑
  - 命令执行映射
- [ ] 核心工作流验证
  - `/flow-prd`
  - `/flow-tasks`
  - `/flow-dev`
  - `/flow-test`
  - `/flow-pr`
- [ ] Codex 特性适配
  - 工具调用格式
  - 上下文管理
  - 错误处理
- [ ] 集成测试套件

**Technical Notes:**
- Codex API documentation: [link TBD]
- Context file: `.codex/context.json`
- Special considerations: Token limits, streaming support

**Related Files:**
- `lib/adapters/codex-adapter.js` (new)
- `templates/adapters/codex/` (new)
- `tests/adapters/codex.test.js` (new)

---

### RM-010: Antigravity 适配

**Status:** 🔵 Planned
**Effort:** 1 week
**Quarter:** Q2-2026
**Milestone:** M4 (Multi-Platform)
**Dependencies:** RM-006, RM-007
**Platform Priority:** #2

**Description:**
实现 Google Antigravity 平台适配器，支持 Google 生态系统的 AI Agent。

**Acceptance Criteria:**
- [ ] 实现 AntigravityAdapter
  - 继承 AdapterInterface
  - 平台检测逻辑
  - 命令执行映射
- [ ] 核心工作流验证（同 RM-009）
- [ ] Antigravity 特性适配
  - Google Cloud 集成
  - 工具调用格式
  - 多模态支持
- [ ] Google 特定优化
  - Workspace 集成
  - Cloud Storage 支持
- [ ] 集成测试套件

**Technical Notes:**
- Antigravity API: [link TBD]
- Context file: `.antigravity/agent.yml`
- Consider Gemini model optimizations

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
**Dependencies:** RM-006, RM-007
**Platform Priority:** #3

**Description:**
实现 Cursor IDE 平台适配器，支持在 IDE 环境中使用 CC-DevFlow 工作流。

**Acceptance Criteria:**
- [ ] 实现 CursorAdapter
  - 继承 AdapterInterface
  - 平台检测逻辑（检测 Cursor IDE）
  - 命令执行映射
- [ ] 核心工作流验证（同 RM-009）
- [ ] Cursor 特性适配
  - IDE 集成点
  - 编辑器交互
  - 文件浏览器联动
- [ ] UI 增强
  - 侧边栏集成
  - 快捷键支持
- [ ] 集成测试套件

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
**Dependencies:** RM-006, RM-007
**Platform Priority:** #4

**Description:**
实现通义千问 Qwen Code 平台适配器，优化对中文开发场景的支持。

**Acceptance Criteria:**
- [ ] 实现 QwenAdapter
  - 继承 AdapterInterface
  - 平台检测逻辑
  - 命令执行映射
- [ ] 核心工作流验证（同 RM-009）
- [ ] Qwen 特性适配
  - 中文优化提示词
  - 本地化错误消息
  - 中文文档生成
- [ ] Qwen 特定优化
  - 中文分词优化
  - 国内网络环境适配
- [ ] 集成测试套件

**Technical Notes:**
- Qwen API: [link TBD]
- Context file: `.qwen/config.toml`
- Chinese language optimizations in prompts

**Related Files:**
- `lib/adapters/qwen-adapter.js` (new)
- `templates/adapters/qwen/` (new)
- `tests/adapters/qwen.test.js` (new)

---

## Progress Tracking

### Overall Progress

| Priority | Completed | In Progress | Planned | Total | Completion % |
|----------|-----------|-------------|---------|-------|--------------|
| P0       | 1         | 0           | 1       | 2     | 50%          |
| P1       | 0         | 0           | 3       | 3     | 0%           |
| P2       | 0         | 0           | 7       | 7     | 0%           |
| **Total**| **1**     | **0**       | **11**  | **12**| **8.3%**     |

### Milestone Progress

| Milestone | Target       | Items | Completed | Status |
|-----------|--------------|-------|-----------|--------|
| M1        | Q4-2025 End  | 1     | 1/1       | 🟢 Completed |
| M2        | Q1-2026 Mid  | 1     | 0/1       | 🔵 Not Started |
| M3        | Q1-2026 End  | 4     | 0/4       | 🔵 Not Started |
| M4        | Q2-2026 End  | 6     | 0/6       | 🔵 Not Started |

### Effort Distribution

| Quarter   | Planned Effort | Items | Focus Area              |
|-----------|----------------|-------|-------------------------|
| Q4-2025   | 2.0 weeks      | 1     | /flow-clarify           |
| Q1-2026   | 6.0 weeks      | 5     | Quality + P1 + Arch     |
| Q2-2026   | 3.5 weeks      | 6     | Multi-platform adapters |
| **Total** | **11.5 weeks** | **12**|                         |

### Dependency Status

| Item    | Depends On | Blocker Status | Ready to Start |
|---------|------------|----------------|----------------|
| RM-001  | -          | N/A            | ✅ Yes (🟢 Completed) |
| RM-002  | RM-001     | 🟢 Completed   | ✅ Yes         |
| RM-003  | -          | N/A            | ✅ Yes         |
| RM-004  | -          | N/A            | ✅ Yes         |
| RM-005  | -          | N/A            | ✅ Yes         |
| RM-006  | -          | N/A            | ✅ Yes         |
| RM-007  | RM-006     | 🔵 Planned     | ❌ No          |
| RM-008  | RM-006, RM-007 | 🔵 Planned | ❌ No          |
| RM-009  | RM-006, RM-007 | 🔵 Planned | ❌ No          |
| RM-010  | RM-006, RM-007 | 🔵 Planned | ❌ No          |
| RM-011  | RM-006, RM-007 | 🔵 Planned | ❌ No          |
| RM-012  | RM-006, RM-007 | 🔵 Planned | ❌ No          |

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
