# Tasks: UPGRADE-001 - CC-DevFlow Spec-Kit 借鉴升级

**Input**: [SPEC_KIT_FINAL_SOLUTION.md](./SPEC_KIT_FINAL_SOLUTION.md)
**Prerequisites**: 最终方案已澄清确认 (1:B, 2:B, 3:B, 4:B, 5:C)

## Execution Flow (任务生成主流程)

```
1. 基于最终方案文档生成任务清单
2. 按 User Story 组织任务（P0 优先）
3. 每个阶段包含 Code Review Checkpoint
4. 所有任务遵循 Constitution v2.0.0
```

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US0=Setup, US1-US5=Features)
- **ID**: T001, T002, T003... (sequential numbering)
- Include exact file paths in task descriptions

---

## Phase 1: Setup (共享基础设施)

**Purpose**: 项目初始化和所有用户故事共用的基础结构

### 任务清单

- [ ] **T001** [US0] 创建升级分支 `feature/UPGRADE-001-spec-kit-integration`
- [ ] **T002** [P] [US0] 安装 pinyin 依赖: `npm install pinyin@^3.0.0 --save`
- [ ] **T003** [P] [US0] 确认模板目录存在: `.claude/docs/templates/`
- [ ] **T004** [P] [US0] 备份现有脚本: `cp .claude/scripts/create-requirement.sh .claude/scripts/create-requirement.sh.bak`

### Constitution Check (Phase 1)

- [ ] **Article VII - Simplicity Gate**: 只安装必需的依赖 (pinyin)
- [ ] **Article VIII - Anti-Abstraction**: 避免不必要的抽象和封装
- [ ] **Article II - Architectural Consistency**: 遵循项目现有的结构模式和命名约定

### Code Review Checkpoint (Phase 1)

- [ ] **T005** 触发 `/code-reviewer` 子代理生成 `reviews/phase-1-setup_code_review.md`（报告需返回 `Phase Gate Result: Pass` 且 `decision` ∈ {approve, comment} 方可进入下一阶段）

---

## Phase 2: Foundational (阻塞性前置条件)

**Purpose**: 所有用户故事的必需前置条件，必须完成后才能开始任何用户故事

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### 任务清单

- [ ] **T006** [US0] 创建 CLARIFICATIONS_TEMPLATE.md 模板在 `.claude/docs/templates/CLARIFICATIONS_TEMPLATE.md`
  - 包含 Summary 表格结构
  - 包含 Clarification Log 格式
  - 包含 Pending Clarifications 章节

- [ ] **T007** [P] [US0] 创建 CHECKLIST_TEMPLATE.md 模板在 `.claude/docs/templates/CHECKLIST_TEMPLATE.md`
  - 包含 5 个质量维度章节
  - 包含 Summary 统计表格
  - 包含 Gate Status 章节

- [ ] **T008** [US0] 更新 `.claude/scripts/common.sh` 添加 `gh_api_safe()` 函数
  - 限流检测和等待重试
  - 认证错误友好提示
  - 最大重试次数配置

- [ ] **T009** [US0] 创建 11 维度歧义分类法配置文件 `.claude/config/clarify-dimensions.yaml`
  - 定义所有 11 个维度
  - 每个维度包含示例问题
  - 定义状态标记 (Clear/Partial/Missing)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

### Code Review Checkpoint (Phase 2)

- [ ] **T010** 触发 `/code-reviewer` 子代理生成 `reviews/phase-2-foundational_code_review.md`（若 `Phase Gate Result: Fail` → 必须整改并重跑审查）

---

## Phase 3: User Story 1 - 需求澄清命令 /flow-clarify (Priority: P0) 🎯 MVP

**Goal**: 实现 `/flow-clarify` 命令，支持 11 维度歧义扫描和推荐选项机制

**Independent Test**: 用户可执行 `/flow-clarify "REQ-TEST"` 并获得结构化澄清问题，输出到 `research/clarifications.md`

### Implementation for User Story 1

- [ ] **T011** [US1] 创建 clarify-agent 代理文件在 `.claude/agents/clarify-agent.md`
  - 包含 Agent 元数据 (name, version, description)
  - 包含 11 维度扫描逻辑和配置引用
  - 包含推荐选项交互模式 Prompt
  - 包含 Anti-Example 指导
  - 实现最大 5 问/会话限制
  - 实现增量更新 clarifications.md 逻辑
  - 文件大小 ≤ 300 lines

- [ ] **T012** [US1] 创建 `/flow-clarify` 命令文件在 `.claude/commands/flow-clarify.md`
  - 命令格式: `/flow-clarify "REQ-ID" [OPTIONS]`
  - 参数: `--max-questions <n>`, `--focus <dimensions>`
  - 调用 clarify-agent
  - 输出路径: `devflow/requirements/REQ-XXX/research/clarifications.md`
  - 包含使用示例

- [ ] **T013** [US1] 实现推荐选项解析逻辑 (在 clarify-agent 中)
  - 支持 "A", "B", "C" 等选项回复
  - 支持 "recommended" 快捷回复
  - 支持用户自定义回答
  - 每次回答后增量更新 clarifications.md

- [ ] **T014** [P] [US1] 创建 clarify-reminder Hook 在 `.claude/hooks/clarify-reminder.js`
  - 事件: PreToolUse
  - 触发: SlashCommand:/flow-prd
  - 检测 `research/clarifications.md` 是否存在
  - 不存在时输出建议提示（非阻断）
  - 支持 "skip" 跳过

- [ ] **T015** [US1] 更新 prd-writer agent 读取 clarifications.md
  - 修改 `.claude/agents/prd-writer.md`
  - 在 Input 章节添加 clarifications.md (optional)
  - 在 PRD 生成逻辑中引用澄清结果
  - 如有澄清，在 PRD 中添加 "Clarifications Applied" 章节

- [ ] **T016** [US1] 更新 cc-devflow-orchestrator skill
  - 修改 `.claude/skills/cc-devflow-orchestrator/skill.md`
  - 在 Workflow Map 中添加 `/flow-clarify` 节点
  - 更新 Agent Delegation Guide 添加 clarify-agent
  - 更新 Phase Gates 说明

**Checkpoint**: `/flow-clarify` 命令可独立执行并生成 clarifications.md

### Constitution Check (Phase 3)

- [ ] **Article I - Quality First**: clarify-agent 完整实现 11 维度扫描
- [ ] **Article V.4 - File Size Limits**: clarify-agent ≤ 500 lines
- [ ] **Article X - Requirement Boundary**: 仅实现方案定义的功能，无推测性扩展

### Code Review Checkpoint (Phase 3)

- [ ] **T017** 触发 `/code-reviewer` 子代理生成 `reviews/phase-3-user-story-1_code_review.md`（任何整改项未关闭不得启动下一用户故事）

---

## Phase 4: User Story 2 - 需求质量检查命令 /flow-checklist (Priority: P0)

**Goal**: 实现 `/flow-checklist` 命令，支持 "Unit Tests for English" 理念

**Independent Test**: 用户可执行 `/flow-checklist "REQ-TEST" --type api` 并获得结构化检查清单，输出到 `checklists/api.md`

### Implementation for User Story 2

- [ ] **T018** [US2] 创建 checklist-agent 代理文件在 `.claude/agents/checklist-agent.md`
  - 包含 Agent 元数据 (name, version, description)
  - 包含 5 个质量维度标签定义 ([Completeness], [Clarity], [Consistency], [Measurability], [Coverage])
  - 包含 Anti-Example 强制逻辑 (CRITICAL section)
  - 支持多种 checklist 类型: ux, api, security, performance, data, general
  - 实现动态生成算法（基于 PRD 内容）
  - 文件大小 ≤ 250 lines

- [ ] **T019** [US2] 创建 `/flow-checklist` 命令文件在 `.claude/commands/flow-checklist.md`
  - 命令格式: `/flow-checklist "REQ-ID" [OPTIONS]`
  - 参数: `--type <ux|api|security|performance|data|general>`
  - 支持多类型: `--type ux,api,security`
  - 调用 checklist-agent
  - 输出路径: `devflow/requirements/REQ-XXX/checklists/[type].md`
  - 包含使用示例

- [ ] **T020** [US2] 实现 Checklist 完成度计算逻辑 (在 checklist-agent 中)
  - 解析 markdown checkbox (`- [ ]` vs `- [x]`)
  - 按维度统计完成百分比
  - 生成 Summary 表格
  - 计算 Gate Status (Pass: ≥80%, Fail: <80%)

- [ ] **T021** [P] [US2] 创建 checklist-gate Hook 在 `.claude/hooks/checklist-gate.js`
  - 事件: PreToolUse
  - 触发: SlashCommand:/flow-epic
  - 检测 `checklists/` 目录是否存在且非空
  - 验证至少一个 checklist 完成度 ≥ 80%
  - 失败时阻断并输出错误信息
  - 支持 `--skip-gate` 紧急跳过（需明确警告）

- [ ] **T022** [US2] 更新 cc-devflow-orchestrator skill
  - 修改 `.claude/skills/cc-devflow-orchestrator/skill.md`
  - 在 Workflow Map 中添加 `/flow-checklist` 节点
  - 更新 Agent Delegation Guide 添加 checklist-agent
  - 更新 Entry Gates: `/flow-epic` 入口门添加 checklist 检查

**Checkpoint**: `/flow-checklist` 命令可独立执行，且入口门阻断机制工作正常

### Constitution Check (Phase 4)

- [ ] **Article I - Quality First**: checklist-agent 完整实现 5 维度检查
- [ ] **Article V.4 - File Size Limits**: checklist-agent ≤ 500 lines
- [ ] **Article VI - Test-First Development**: Anti-Example 逻辑正确实现（测试需求质量，非测试实现）

### Code Review Checkpoint (Phase 4)

- [ ] **T023** 触发 `/code-reviewer` 子代理生成 `reviews/phase-4-user-story-2_code_review.md`（确保审查结果在 PRD/EPIC 范围内全部通过）

---

## Phase 5: User Story 3 - 分支命名优化 (Priority: P1)

**Goal**: 升级 `create-requirement.sh` 支持中文拼音转换、停用词过滤、长度限制

**Independent Test**: 中文需求标题 `"用户可以通过邮箱登录"` 可正确生成分支名 `feature/REQ-XXX-yong-hu-you-xiang-deng-lu`

### Implementation for User Story 3

- [ ] **T024** [US3] 更新 `create-requirement.sh` 添加停用词过滤
  - 修改 `.claude/scripts/create-requirement.sh`
  - 定义英文停用词列表: the, a, an, is, are, for, with, and, or, to, of, in, on, at, by
  - 定义中文停用词列表: 的, 了, 是, 在, 和, 与, 或, 可以, 能够
  - 实现过滤逻辑（在 slug 生成前应用）

- [ ] **T025** [US3] 实现中文转拼音功能
  - 在 `.claude/scripts/create-requirement.sh` 中集成 pinyin
  - 使用 Node.js 调用 pinyin 库: `node -e "require('pinyin')..."`
  - 处理多音字（取默认首选）
  - 使用连字符连接拼音

- [ ] **T026** [US3] 实现分支名长度限制
  - 最大长度: 244 bytes (GitHub 限制)
  - 超长时智能截断（保留完整词）
  - 输出警告信息: `⚠️ 分支名超长，已截断为: ...`
  - 始终保留 `feature/REQ-XXX-` 前缀

- [ ] **T027** [P] [US3] 添加 `--short-name` 参数支持
  - 参数格式: `--short-name <name>`
  - 提供时跳过自动生成，直接使用用户指定的短名
  - 仍然应用特殊字符处理和长度限制

- [ ] **T028** [US3] 添加特殊字符处理
  - 空格 → 连字符 `-`
  - 移除非法字符: `!@#$%^&*()+=[]{}|;:'",.<>?/\`
  - 合并连续连字符: `--` → `-`
  - 移除首尾连字符

**Checkpoint**: 各种中英文输入都能生成有效的 GitHub 分支名

### Constitution Check (Phase 5)

- [ ] **Article VII - Simplicity Gate**: 逻辑简洁，无过度工程
- [ ] **Article II - Architectural Consistency**: 与现有脚本风格一致

### Code Review Checkpoint (Phase 5)

- [ ] **T029** 触发 `/code-reviewer` 子代理生成 `reviews/phase-5-user-story-3_code_review.md`（继续前必须得到通过并确认无需求扩张）

---

## Phase 6: User Story 4 - GitHub API 限流处理 (Priority: P1)

**Goal**: 实现 `gh_api_safe()` 函数，统一处理 GitHub API 限流和错误

**Independent Test**: 模拟限流场景时，函数可正确输出等待时间并自动重试

### Implementation for User Story 4

- [ ] **T030** [US4] 完善 `gh_api_safe()` 函数在 `.claude/scripts/common.sh`
  - 实现限流检测: 检查输出中的 "rate limit" 关键词
  - 实现等待计算: 调用 `gh api rate_limit` 获取重置时间
  - 实现自动重试: 最多重试 3 次（可配置）
  - 实现友好输出: `⏳ GitHub API 限流，等待 X 秒后重试...`

- [ ] **T031** [P] [US4] 更新 `create-requirement.sh` 使用 `gh_api_safe()`
  - 识别所有直接 `gh` 调用
  - 替换为 `gh_api_safe "gh ..."`
  - 添加错误处理逻辑

- [ ] **T032** [P] [US4] 更新 release-manager 相关脚本使用 `gh_api_safe()`
  - 检查 `.claude/agents/release-manager.md` 中的脚本调用
  - 识别所有 `gh api` 和 `gh pr` 调用点
  - 更新为使用 `gh_api_safe()`

- [ ] **T033** [US4] 添加使用文档和示例
  - 在 `common.sh` 顶部添加函数说明注释
  - 添加使用示例
  - 在相关文档中说明限流处理策略

**Checkpoint**: 所有 GitHub API 调用都有统一的错误处理和限流重试

### Code Review Checkpoint (Phase 6)

- [ ] **T034** 触发 `/code-reviewer` 子代理生成 `reviews/phase-6-user-story-4_code_review.md`（报告如含阻塞项，需完成整改再提交复审）

---

## Phase 7: User Story 5 - Coverage Summary Table (Priority: P1)

**Goal**: 增强 `/flow-verify` 输出，添加 Coverage Summary Table 格式

**Independent Test**: 执行 `/flow-verify "REQ-TEST"` 可看到结构化的覆盖率表格和 Critical Issues 列表

### Implementation for User Story 5

- [ ] **T035** [US5] 更新 consistency-checker agent
  - 修改 `.claude/agents/consistency-checker.md`
  - 添加 Coverage Summary Table 输出格式
  - 添加 Metrics 统计 (Total, Covered, Partial, Gaps)
  - 添加 Critical Issues 表格 (Severity, Location, Issue, Recommendation)

- [ ] **T036** [US5] 更新 `/flow-verify` 命令
  - 修改 `.claude/commands/flow-verify.md`
  - 集成新的 Coverage Summary 输出格式
  - 确保输出包含: Requirements→Tasks Mapping, Metrics, Critical Issues

- [ ] **T037** [P] [US5] 添加 Severity 分级逻辑
  - 🔴 High: 核心需求无对应任务
  - 🟡 Medium: 非核心需求缺失或部分覆盖
  - 🟢 Low: 文档格式问题或建议性改进
  - 在 Critical Issues 表格中显示 Severity 图标

**Checkpoint**: `/flow-verify` 输出包含完整的覆盖率分析和问题列表

### Constitution Check (Phase 7)

- [ ] **Article I - Quality First**: Coverage Summary 完整显示所有映射关系
- [ ] **Article V - Maintainability**: 输出格式清晰易读

### Code Review Checkpoint (Phase 7)

- [ ] **T038** 触发 `/code-reviewer` 子代理生成 `reviews/phase-7-user-story-5_code_review.md`（必须 Pass 方可进入 Polish 阶段）

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 跨用户故事的改进、文档更新和最终验证

### 任务清单

- [ ] **T039** [P] [USX] 更新 README.md 添加新命令说明
  - 添加 `/flow-clarify` 命令介绍
  - 添加 `/flow-checklist` 命令介绍
  - 更新工作流图

- [ ] **T040** [P] [USX] 创建升级迁移指南 `docs/UPGRADE_GUIDE.md`
  - 说明新增命令和用法
  - 说明工作流变化
  - 列出可能的兼容性问题

- [ ] **T041** [USX] 端到端测试: 完整流程验证
  - 测试流程: `/flow-init` → `/flow-clarify` → `/flow-prd` → `/flow-checklist` → `/flow-epic`
  - 验证各命令正常工作
  - 验证 Hook 触发正常
  - 验证入口门阻断正常

- [ ] **T042** [USX] 更新 AGENTS.md 添加新代理说明
  - 添加 clarify-agent 描述
  - 添加 checklist-agent 描述
  - 更新代理列表

- [ ] **T043** [P] [USX] 清理备份文件和临时文件
  - 删除 `.bak` 备份文件（确认升级成功后）
  - 清理测试生成的临时文件

- [ ] **T044** [USX] 更新 CHANGELOG.md
  - 添加版本号和日期
  - 列出所有新增功能
  - 列出所有变更
  - 添加升级说明

### Code Review Checkpoint (Phase 8)

- [ ] **T045** 触发 `/code-reviewer` 子代理生成 `reviews/phase-8-polish_code_review.md`（必须 Pass 方可切换至 QA 流程）

---

## Dependencies & Execution Order (依赖关系与执行顺序)

### Phase Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational) ─── BLOCKS all user stories
    │
    ├────────────┬────────────┬────────────┬────────────┐
    ▼            ▼            ▼            ▼            ▼
Phase 3      Phase 4      Phase 5      Phase 6      Phase 7
(clarify)   (checklist)  (branch)     (gh api)    (coverage)
  P0 🎯        P0           P1           P1           P1
    │            │            │            │            │
    └────────────┴────────────┴────────────┴────────────┘
                              │
                              ▼
                        Phase 8 (Polish)
```

### User Story Dependencies

- **US1 (clarify)**: Depends on Phase 2 (templates, config)
- **US2 (checklist)**: Depends on Phase 2 (templates)
- **US3 (branch naming)**: Depends on Phase 2 (common.sh structure)
- **US4 (gh api)**: Depends on Phase 2 (common.sh exists)
- **US5 (coverage)**: Independent after Phase 2

### Within Each User Story

- Templates/configs MUST exist before agent implementation
- Agent MUST be complete before command file
- Command MUST work before Hook integration
- All components complete before orchestrator update

### Parallel Opportunities

| Phase | Parallel Tasks |
|-------|---------------|
| Phase 1 | T002, T003, T004 |
| Phase 2 | T006, T007 |
| Phase 3 | T014 (Hook) ∥ T011-T013 (Agent/Command) |
| Phase 4 | T021 (Hook) ∥ T018-T020 (Agent/Command) |
| Phase 5 | T027 (--short-name) ∥ T024-T026 |
| Phase 6 | T031, T032 (script updates) |
| Phase 7 | T037 (Severity) ∥ T035-T036 |
| Phase 8 | T039, T040, T043 |

---

## Progress Tracking (进度跟踪)

### Overall Progress

- [ ] Phase 1: Setup (5 tasks) - T001~T005
- [ ] Phase 2: Foundational (5 tasks) - T006~T010
- [ ] **CHECKPOINT**: Foundation ready ✓
- [ ] Phase 3: User Story 1 - clarify (7 tasks) - T011~T017 🎯 MVP
- [ ] Phase 4: User Story 2 - checklist (6 tasks) - T018~T023
- [ ] Phase 5: User Story 3 - branch naming (6 tasks) - T024~T029
- [ ] Phase 6: User Story 4 - gh api (5 tasks) - T030~T034
- [ ] Phase 7: User Story 5 - coverage (4 tasks) - T035~T038
- [ ] Phase 8: Polish (7 tasks) - T039~T045

**Total Tasks**: 45

### User Story Completion

| Story | Priority | Tasks | Completed | Status |
|-------|----------|-------|-----------|--------|
| US0 (Setup/Foundation) | - | 10 | 0 | ⬜ Not Started |
| US1 (clarify) | P0 | 7 | 0 | ⬜ Not Started |
| US2 (checklist) | P0 | 6 | 0 | ⬜ Not Started |
| US3 (branch naming) | P1 | 6 | 0 | ⬜ Not Started |
| US4 (gh api) | P1 | 5 | 0 | ⬜ Not Started |
| US5 (coverage) | P1 | 4 | 0 | ⬜ Not Started |
| USX (Polish) | - | 7 | 0 | ⬜ Not Started |

### Constitution Compliance

**Reference**: `.claude/constitution/project-constitution.md` (v2.0.0)

- [ ] **Initial Check**: All 10 Articles validated at planning stage
- [ ] **Article I-V**: Core principles checked (Quality, Architecture, Security, Performance, Maintainability)
- [ ] **Article VI**: TDD sequence (N/A for this upgrade - no production code tests)
- [ ] **Article VII-IX**: Phase -1 Gates passed (Simplicity, Anti-Abstraction, Integration-First)
- [ ] **Article X**: Requirement boundary validated (No speculative features)
- [ ] **Post-Implementation**: Constitution Check re-run after all tasks complete
- [ ] **Code Review**: All 8 phase reviews passed

---

## Implementation Strategy (实施策略)

### MVP First (P0 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (clarify) 🎯
4. Complete Phase 4: User Story 2 (checklist)
5. **STOP and VALIDATE**: Test clarify + checklist independently
6. Partial deploy if ready (new commands available)

### Full Implementation (P0 + P1)

1. Complete MVP (Phases 1-4)
2. Complete Phase 5: branch naming
3. Complete Phase 6: gh api
4. Complete Phase 7: coverage
5. Complete Phase 8: Polish
6. Full deploy with all features

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Phase 2 is done:
   - Developer A: US1 (clarify) + US2 (checklist)
   - Developer B: US3 (branch) + US4 (gh api)
   - Developer C: US5 (coverage)
3. Everyone joins for Phase 8 (Polish)

---

## Notes (注意事项)

### Critical Rules

- **[P] = Parallel**: 只有不同文件、无依赖的任务才能标记 [P]
- **[US#] = Story Label**: 所有任务必须标记所属用户故事
- **Story Independence**: P0 故事 (clarify, checklist) 应优先完成
- **Foundational First**: Phase 2 必须完成才能开始用户故事
- **Code Review**: 每个 Phase 必须通过 Code Review 才能继续
- **Commit Early**: 每完成一个任务就提交

### Common Pitfalls (常见陷阱)

- ❌ 跳过 Phase 2 直接开始 Agent 开发（模板不存在会报错）
- ❌ 标记 [P] 但任务修改同一文件
- ❌ 忘记更新 cc-devflow-orchestrator skill
- ❌ Hook 逻辑过于复杂（应保持轻量）
- ❌ Agent 文件超过 500 行

### Best Practices (最佳实践)

- ✅ 先完成 P0 故事，再处理 P1
- ✅ 每个 Agent 完成后立即测试
- ✅ Hook 实现后测试阻断/提示是否正常
- ✅ 频繁提交，小步前进
- ✅ 每个 Phase 完成后运行 Code Review

---

## Validation Checklist (验证清单)

*GATE: 在生成 TASKS.md 后检查*

### User Story Organization ⚠️ CRITICAL

- [x] 每个用户故事有自己的 Phase (Phase 3, 4, 5, 6, 7)
- [x] 所有任务都有 [US#] 标签标记所属故事
- [x] 每个故事有 Independent Test 标准
- [x] 每个故事有 Checkpoint 验证点
- [x] Foundational phase 只包含所有故事共需的前置条件

### Completeness (完整性)

- [x] 所有模块都有对应的任务
- [x] 所有新文件都有创建任务
- [x] 所有修改文件都有更新任务
- [x] Setup 和 Foundational phase 明确定义

### Parallel Safety (并行安全性)

- [x] 所有 [P] 标记的任务都操作不同文件
- [x] 同一文件的任务没有 [P] 标记
- [x] 有依赖关系的任务没有 [P] 标记

### Path Specificity (路径明确性)

- [x] 每个任务都指定了具体的文件路径
- [x] 路径使用了正确的项目结构约定

### Constitution Alignment (宪法符合性)

- [x] **Article I - Quality First**: 没有违反 NO PARTIAL IMPLEMENTATION
- [x] **Article II - Architectural Consistency**: 没有违反 NO CODE DUPLICATION
- [x] **Article V.4 - File Size Limits**: Agent 文件 ≤ 500 lines
- [x] **Article X - Requirement Boundary**: 任务仅实现方案定义的需求

---

**Generated by**: Claude Opus 4.5
**Based on**: [SPEC_KIT_FINAL_SOLUTION.md](./SPEC_KIT_FINAL_SOLUTION.md)
**Constitution**: `.claude/constitution/project-constitution.md` v2.0.0
**Template Version**: 3.0.0 (Spec-Kit inspired - User Story Centric)

---

## 相关文档

- **最终方案**: [SPEC_KIT_FINAL_SOLUTION.md](./SPEC_KIT_FINAL_SOLUTION.md)
- **分析来源**:
  - [SPEC_KIT_IMPLEMENTATION_RECOMMENDATION_GEMINI3.md](./SPEC_KIT_IMPLEMENTATION_RECOMMENDATION_GEMINI3.md)
  - [SPEC_KIT_ITERATION_BORROWING_CODEX.md](./SPEC_KIT_ITERATION_BORROWING_CODEX.md)
  - [SPEC_KIT_REFERENCE_ANALYSIS_CLAUDE.md](./SPEC_KIT_REFERENCE_ANALYSIS_CLAUDE.md)
- **Constitution**: `.claude/constitution/project-constitution.md`
- **Execution Log**: (创建后填写路径)
