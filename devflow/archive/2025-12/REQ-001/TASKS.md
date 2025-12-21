# Tasks: REQ-001 - /flow-clarify 需求澄清命令

**Status**: In Progress (MVP Phases 1-6 Complete)
**Created**: 2025-12-15
**Type**: Task Breakdown

**Input**: PRD.md, EPIC.md, TECH_DESIGN.md from `devflow/requirements/REQ-001/`
**Prerequisites**: PRD.md (required), EPIC.md (required), TECH_DESIGN.md (required)

---

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5, US6)
- **ID**: T001, T002, T003... (sequential numbering)
- Include exact file paths in task descriptions

---

## Phase 1: Setup (共享基础设施)

**Purpose**: 项目初始化和所有用户故事共用的基础结构
**Estimate**: 0.5 天

### 任务清单

- [ ] **T001** [SETUP] 创建 clarifications 目录结构 `devflow/requirements/REQ-001/research/clarifications/`
- [ ] **T002** [P] [SETUP] 创建空脚本文件 `run-clarify-scan.sh` 并设置执行权限 `.claude/scripts/run-clarify-scan.sh`
- [ ] **T003** [P] [SETUP] 创建空脚本文件 `generate-clarification-questions.sh` 并设置执行权限 `.claude/scripts/generate-clarification-questions.sh`
- [ ] **T004** [P] [SETUP] 创建空脚本文件 `generate-clarification-report.sh` 并设置执行权限 `.claude/scripts/generate-clarification-report.sh`
- [ ] **T005** [P] [SETUP] 创建测试脚本 `test-clarify-scan.sh` 并设置执行权限 `.claude/scripts/test-clarify-scan.sh`
- [ ] **T006** [SETUP] 验证 CLAUDE_API_KEY 环境变量配置（参考 quickstart.md 1.2）

### Constitution Check (Phase 1)
- [ ] **Article VII - Simplicity Gate**: 只创建必需的脚本文件，共 4 个主要脚本
- [ ] **Article VIII - Anti-Abstraction**: 无封装层，直接创建可执行脚本
- [ ] **Article II - Architectural Consistency**: 遵循 `.claude/scripts/` 目录结构

**Checkpoint**: 所有脚本文件存在且可执行，目录结构完整

---

## Phase 2: Foundational (阻塞性前置条件)

**Purpose**: 所有用户故事的必需前置条件，必须完成后才能开始任何用户故事
**Estimate**: 1 天

**CRITICAL**: No user story work can begin until this phase is complete

### 核心基础设施任务

- [ ] **T007** [FOUND] 实现 API Key 验证函数 `check_api_key()` 在 `.claude/scripts/run-clarify-scan.sh`
  - 验证 CLAUDE_API_KEY 存在
  - 验证格式 `sk-ant-*`
  - 错误时输出友好提示

- [ ] **T008** [P] [FOUND] 实现用户答案验证函数 `validate_answer()` 在 `.claude/scripts/run-clarify-scan.sh`
  - 多选题: 验证 `/^[A-Ea-e]$/`
  - 短答题: 验证 `<= 5 words, alphanumeric`
  - 参考 TECH_DESIGN.md Section 5.4

- [ ] **T009** [P] [FOUND] 实现会话状态读取函数 `load_session()` 在 `.claude/scripts/run-clarify-scan.sh`
  - 读取 `.session.json`
  - 验证 JSON 格式
  - 返回 session 对象

- [ ] **T010** [P] [FOUND] 实现会话状态保存函数 `save_session()` 在 `.claude/scripts/run-clarify-scan.sh`
  - 写入 `.session.json`
  - 更新 `updatedAt` 时间戳
  - 原子写入（临时文件 + mv）

- [ ] **T011** [FOUND] 实现 Claude API 调用封装函数 `call_claude_api()` 在 `.claude/scripts/run-clarify-scan.sh`
  - 支持 Haiku 和 Sonnet 模型
  - 超时处理 (20 秒)
  - 重试机制 (3 次)
  - 参考 TECH_DESIGN.md Section 4.2

- [ ] **T012** [FOUND] 实现 11 维度定义常量 `DIMENSIONS` 数组在 `.claude/scripts/run-clarify-scan.sh`
  - 参考 TECH_DESIGN.md Appendix

- [ ] **T013** [FOUND] 扩展 `orchestration_status.json` schema 添加 clarify_* 字段
  - `clarify_complete`: boolean
  - `clarify_session_id`: string
  - `clarify_skipped`: boolean
  - 参考 data-model.md Section 5

**Checkpoint**: Foundation ready - 所有基础函数可用，user story 实现可以开始

### Constitution Check (Phase 2)
- [ ] **Article III - Security First**: API Key 使用环境变量，输入验证完整
- [ ] **Article IV - Performance**: API 超时和重试机制就绪
- [ ] **Article V - Maintainability**: 函数职责单一，代码可读

---

## Phase 3: User Story 1 - 自动歧义扫描 (Priority: P1) MVP

**Goal**: 运行 /flow-clarify 命令自动扫描 research.md 的 11 维度歧义
**Independent Test**: 给定包含歧义的 research.md，系统识别 >= 80% 歧义

**Reference**:
- PRD Story 1 AC1-AC5
- TECH_DESIGN.md Section 4.1 (run-clarify-scan.sh API)
- contracts/script-api.yaml (run-clarify-scan.sh)
- quickstart.md UT-001 to UT-003

### Tests for User Story 1 (Contract Tests)

- [ ] **T014** [P] [US1] 合约测试: 有效 REQ_ID 输入返回 exit code 0 和 JSON 输出 `.claude/scripts/test-clarify-scan.sh::test_valid_req_id`
  - 参考 quickstart.md UT-001
  - 验证输出符合 contracts/script-api.yaml 定义

- [ ] **T015** [P] [US1] 合约测试: 无效 REQ_ID 输入返回 exit code 2 和错误信息 `.claude/scripts/test-clarify-scan.sh::test_invalid_req_id`
  - 参考 quickstart.md UT-002
  - 验证错误码 INVALID_REQ_ID

- [ ] **T016** [P] [US1] 合约测试: 维度超时返回 exit code 1 和 "timeout" 状态 `.claude/scripts/test-clarify-scan.sh::test_dimension_timeout`
  - 参考 quickstart.md UT-003
  - 设置 --timeout 1 触发超时

- [ ] **T017** [P] [US1] 集成测试: Happy Path 完整扫描流程 `.claude/scripts/test-clarify-scan.sh::test_happy_path_scan`
  - 参考 quickstart.md IT-001
  - 验证 11 维度都有结果

**TEST VERIFICATION CHECKPOINT**: 确保 T014-T017 全部 FAIL 后再进入实现

### Implementation for User Story 1

- [ ] **T018** [US1] 实现单维度扫描函数 `scan_dimension()` 在 `.claude/scripts/run-clarify-scan.sh`
  - 调用 Claude Haiku API
  - 解析 JSON 响应
  - 处理超时（标记 "timeout"）
  - 参考 TECH_DESIGN.md Section 4.2

- [ ] **T019** [US1] 实现并行扫描主函数 `scan_all_dimensions()` 在 `.claude/scripts/run-clarify-scan.sh`
  - 使用 Bash background jobs (&)
  - 收集所有维度结果
  - 聚合为 JSON 输出
  - 参考 TECH_DESIGN.md Section 6.1

- [ ] **T020** [US1] 实现扫描结果格式化函数 `format_scan_result()` 在 `.claude/scripts/run-clarify-scan.sh`
  - 输出符合 contracts/script-api.yaml 定义
  - 包含 sessionId, scanDurationMs, dimensions[]

- [ ] **T021** [US1] 实现脚本主入口 `main()` 在 `.claude/scripts/run-clarify-scan.sh`
  - 解析命令行参数 (REQ_ID, --parallel, --timeout, --dimension)
  - 调用 scan_all_dimensions()
  - 输出 JSON 到 stdout

- [ ] **T022** [US1] 运行测试验证 T014-T017 全部 PASS

**Checkpoint**: run-clarify-scan.sh 完整可用，11 维度并行扫描 < 30 秒

### Constitution Check (Phase 3)
- [ ] **Article I - Quality First**: 完整实现扫描功能，无 TODO
- [ ] **Article IV - Performance**: 并行扫描 < 30 秒
- [ ] **Article VI - TDD**: 测试先于实现

---

## Phase 4: User Story 2 - 智能问题生成与优先级排序 (Priority: P1) MVP

**Goal**: 系统根据扫描结果生成最高优先级的 <= 5 个问题
**Independent Test**: 给定 15 处歧义，系统生成 5 个问题（优先级由高到低）

**Reference**:
- PRD Story 2 AC1-AC5
- TECH_DESIGN.md Section 4.1 (generate-clarification-questions.sh API)
- contracts/script-api.yaml
- quickstart.md UT-004, UT-005

### Tests for User Story 2 (Contract Tests)

- [ ] **T023** [P] [US2] 合约测试: 15 issues 输入生成 <= 5 questions `.claude/scripts/test-clarify-scan.sh::test_max_5_questions`
  - 参考 quickstart.md UT-004
  - 验证 questions.length <= 5

- [ ] **T024** [P] [US2] 合约测试: 0 issues 输入返回 exit code 1 `.claude/scripts/test-clarify-scan.sh::test_no_issues`
  - 参考 quickstart.md UT-005
  - 验证输出 "no issues" message

- [ ] **T025** [P] [US2] 合约测试: 问题优先级按 Impact x Uncertainty 排序 `.claude/scripts/test-clarify-scan.sh::test_priority_sorting`
  - 验证第一个问题 priority >= 其他问题

**TEST VERIFICATION CHECKPOINT**: 确保 T023-T025 全部 FAIL 后再进入实现

### Implementation for User Story 2

- [ ] **T026** [US2] 实现优先级计算函数 `calculate_priority()` 在 `.claude/scripts/generate-clarification-questions.sh`
  - priority = impact x uncertainty
  - 参考 data-model.md AmbiguityIssue

- [ ] **T027** [US2] 实现问题合并函数 `merge_similar_issues()` 在 `.claude/scripts/generate-clarification-questions.sh`
  - 同维度多个歧义合并为 1 个问题
  - 参考 PRD Story 2 AC3

- [ ] **T028** [US2] 实现问题模板生成函数 `generate_question_template()` 在 `.claude/scripts/generate-clarification-questions.sh`
  - 调用 Claude Sonnet 生成问题文本
  - 生成选项和推荐答案
  - 参考 TECH_DESIGN.md Section 4.1

- [ ] **T029** [US2] 实现脚本主入口 `main()` 在 `.claude/scripts/generate-clarification-questions.sh`
  - 解析 --input 和 --max 参数
  - 排序、合并、生成问题
  - 输出 JSON 到 stdout

- [ ] **T030** [US2] 运行测试验证 T023-T025 全部 PASS

**Checkpoint**: generate-clarification-questions.sh 完整可用，优先级排序正确

### Constitution Check (Phase 4)
- [ ] **Article I - Quality First**: 完整实现问题生成
- [ ] **Article VI - TDD**: 测试先于实现
- [ ] **Article X - Requirement Boundary**: 严格限制 <= 5 个问题

---

## Phase 5: User Story 3 - 交互式澄清对话 (Priority: P1) MVP

**Goal**: 系统逐个呈现问题，并提供 AI 推荐答案
**Independent Test**: 给定 3 个问题，验证每次只显示 1 个问题，回答后进入下一题

**Reference**:
- PRD Story 3 AC1-AC6
- TECH_DESIGN.md Section 1.3 (Data Flow - Interactive Q&A Loop)
- quickstart.md IT-003, IT-004

### Tests for User Story 3 (Integration Tests)

- [ ] **T031** [P] [US3] 集成测试: Sequential 问题呈现验证 `.claude/scripts/test-clarify-scan.sh::test_sequential_questions`
  - 验证第一次只显示 Q1
  - 参考 PRD Story 3 AC1

- [ ] **T032** [P] [US3] 集成测试: 用户输入验证 `.claude/scripts/test-clarify-scan.sh::test_answer_validation`
  - 验证 valid_answer() 函数
  - 参考 quickstart.md UT-006, UT-007, UT-008

- [ ] **T033** [P] [US3] 集成测试: 会话恢复验证 `.claude/scripts/test-clarify-scan.sh::test_session_recovery`
  - 参考 quickstart.md IT-003
  - 验证中断后从断点恢复

- [ ] **T034** [P] [US3] 集成测试: 用户中断处理 `.claude/scripts/test-clarify-scan.sh::test_user_abort`
  - 参考 quickstart.md IT-004
  - 验证 Ctrl+C 后保存进度

**TEST VERIFICATION CHECKPOINT**: 确保 T031-T034 全部 FAIL 后再进入实现

### Implementation for User Story 3

- [ ] **T035** [US3] 实现问题显示函数 `display_question()` 在 `.claude/commands/flow-clarify.md` (Agent 指令)
  - 显示问题文本
  - 显示选项 (A/B/C...)
  - 标记 AI 推荐 (RECOMMENDED)
  - 参考 PRD Story 3 AC2

- [ ] **T036** [US3] 实现答案收集函数 `collect_answer()` 在 `.claude/commands/flow-clarify.md`
  - 读取用户输入
  - 调用 validate_answer() 验证
  - 无效时提示重新输入

- [ ] **T037** [US3] 实现理由生成函数 `generate_rationale()` 调用 `.claude/agents/clarify-analyst.md`
  - 调用 Claude Haiku 生成理由
  - 存储到 question.rationale

- [ ] **T038** [US3] 实现增量保存逻辑 `save_answer()` 在 flow-clarify.md
  - 每回答一题立即保存到 .session.json
  - 更新 currentQuestionIndex
  - 参考 TECH_DESIGN.md Section 6.3

- [ ] **T039** [US3] 实现中断处理 `trap_handler()` 在 flow-clarify.md
  - 捕获 SIGINT (Ctrl+C)
  - 保存当前进度
  - 输出恢复提示

- [ ] **T040** [US3] 创建 clarify-analyst.md agent 定义 `.claude/agents/clarify-analyst.md`
  - 定义 agent 角色和能力
  - 问题生成指令
  - 理由生成指令

- [ ] **T041** [US3] 创建 flow-clarify.md 命令入口 `.claude/commands/flow-clarify.md`
  - Entry Gate 验证
  - 交互循环
  - Exit Gate 验证

- [ ] **T042** [US3] 运行测试验证 T031-T034 全部 PASS

**Checkpoint**: 交互式澄清对话完整可用，Sequential + AI 推荐

### Constitution Check (Phase 5)
- [ ] **Article I - Quality First**: 完整实现交互流程
- [ ] **Article III - Security First**: 输入验证完整
- [ ] **Article V - Maintainability**: command/agent 职责分离

---

## Phase 6: User Story 4 - 增量式集成与澄清报告生成 (Priority: P1) MVP

**Goal**: 每回答 1 个问题后，系统立即保存到 clarifications/[timestamp].md
**Independent Test**: 回答 Q1 后人工模拟中断，重新运行验证 Q1 答案已保存

**Reference**:
- PRD Story 4 AC1-AC5
- TECH_DESIGN.md Section 4.1 (generate-clarification-report.sh API)
- contracts/script-api.yaml
- quickstart.md S4-AC1

### Tests for User Story 4 (Contract Tests)

- [ ] **T043** [P] [US4] 合约测试: 报告文件生成验证 `.claude/scripts/test-clarify-scan.sh::test_report_generation`
  - 验证文件名格式 [timestamp]-flow-clarify.md
  - 验证文件存在

- [ ] **T044** [P] [US4] 合约测试: 报告内容完整性验证 `.claude/scripts/test-clarify-scan.sh::test_report_completeness`
  - 验证包含所有必需章节
  - 无 {{PLACEHOLDER}} 标记
  - 参考 PRD Story 4 AC5

- [ ] **T045** [P] [US4] 合约测试: orchestration_status.json 更新验证 `.claude/scripts/test-clarify-scan.sh::test_status_update`
  - 验证 clarify_complete = true
  - 验证 clarify_session_id 设置

**TEST VERIFICATION CHECKPOINT**: 确保 T043-T045 全部 FAIL 后再进入实现

### Implementation for User Story 4

- [ ] **T046** [US4] 实现报告模板定义 `REPORT_TEMPLATE` 在 `.claude/scripts/generate-clarification-report.sh`
  - Metadata 章节
  - Scan Summary 章节
  - Clarification Session 章节
  - Coverage Summary 章节
  - Next Command 章节

- [ ] **T047** [US4] 实现模板渲染函数 `render_report()` 在 `.claude/scripts/generate-clarification-report.sh`
  - 读取 .session.json
  - 替换模板变量
  - 生成 Markdown 内容

- [ ] **T048** [US4] 实现报告写入函数 `write_report()` 在 `.claude/scripts/generate-clarification-report.sh`
  - 生成时间戳文件名
  - 写入 clarifications/ 目录
  - 验证写入成功

- [ ] **T049** [US4] 实现脚本主入口 `main()` 在 `.claude/scripts/generate-clarification-report.sh`
  - 解析 --session 和 --output 参数
  - 调用 render_report() 和 write_report()

- [ ] **T050** [US4] 实现 orchestration_status.json 更新逻辑在 flow-clarify.md Exit Gate
  - 设置 clarify_complete = true
  - 设置 clarify_session_id
  - 删除 .session.json

- [ ] **T051** [US4] 运行测试验证 T043-T045 全部 PASS

**Checkpoint**: 报告生成完整可用，状态正确更新

### Constitution Check (Phase 6)
- [ ] **Article I - Quality First**: 报告无 {{PLACEHOLDER}}
- [ ] **Article V - Maintainability**: 报告模板易于维护

---

## Phase 7: User Story 5 - 自动更新 research.md (Priority: P2) Post-MVP

**Goal**: 系统自动将澄清结论集成到 research.md 的相关章节
**Independent Test**: Q1 澄清了数据模型，检查 research.md 的 Decisions 章节新增决策点

**Reference**:
- PRD Story 5 AC1-AC4
- TECH_DESIGN.md Section 4.1 (integrate-clarifications.sh API)
- contracts/script-api.yaml

**NOTE**: This is P2 (Post-MVP), implement only after P1 stories are complete

### Tests for User Story 5

- [ ] **T052** [P] [US5] 合约测试: Decisions 章节更新验证 `.claude/scripts/test-clarify-scan.sh::test_decisions_update`
  - 验证新增 R0XX 决策点
  - 包含 Decision/Rationale/Alternatives

- [ ] **T053** [P] [US5] 合约测试: --dry-run 模式验证 `.claude/scripts/test-clarify-scan.sh::test_dry_run`
  - 验证不修改文件
  - 输出预览内容

- [ ] **T054** [P] [US5] 合约测试: 冲突检测验证 `.claude/scripts/test-clarify-scan.sh::test_conflict_detection`
  - 验证冲突时输出警告
  - 不自动覆盖

### Implementation for User Story 5

- [ ] **T055** [US5] 创建 integrate-clarifications.sh 脚本框架 `.claude/scripts/integrate-clarifications.sh`

- [ ] **T056** [US5] 实现 Decisions 章节定位函数 `find_decisions_section()` 在 integrate-clarifications.sh

- [ ] **T057** [US5] 实现决策点插入函数 `insert_decision()` 在 integrate-clarifications.sh
  - 生成 R0XX 编号
  - 格式化 Decision/Rationale/Alternatives

- [ ] **T058** [US5] 实现冲突检测函数 `detect_conflicts()` 在 integrate-clarifications.sh

- [ ] **T059** [US5] 实现备份函数 `backup_research()` 在 integrate-clarifications.sh
  - 创建 research.md.backup

- [ ] **T060** [US5] 实现脚本主入口 `main()` 在 integrate-clarifications.sh

- [ ] **T061** [US5] 运行测试验证 T052-T054 全部 PASS

**Checkpoint**: integrate-clarifications.sh 完整可用（P2 功能）

---

## Phase 8: User Story 6 - 澄清历史查询与可视化 (Priority: P3) Future

**Goal**: 运行 /flow-clarify --history 查看过往澄清记录
**Independent Test**: 给定 3 个历史报告，显示摘要表格

**Reference**:
- PRD Story 6 AC1-AC3

**NOTE**: This is P3 (Future), implement only after P2 stories are complete

### Tests for User Story 6

- [ ] **T062** [P] [US6] 测试: 历史记录表格显示 `.claude/scripts/test-clarify-scan.sh::test_history_display`
- [ ] **T063** [P] [US6] 测试: 空历史处理 `.claude/scripts/test-clarify-scan.sh::test_empty_history`
- [ ] **T064** [P] [US6] 测试: --detail 模式 `.claude/scripts/test-clarify-scan.sh::test_history_detail`

### Implementation for User Story 6

- [ ] **T065** [US6] 实现历史记录读取函数 `read_history()` 在 flow-clarify.md
- [ ] **T066** [US6] 实现表格格式化函数 `format_history_table()` 在 flow-clarify.md
- [ ] **T067** [US6] 实现 --history 命令行参数处理在 flow-clarify.md
- [ ] **T068** [US6] 运行测试验证 T062-T064 全部 PASS

**Checkpoint**: --history 功能完整可用（P3 功能）

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: 跨用户故事的改进和最终完善
**Estimate**: 0.5 天

### 任务清单

- [ ] **T069** [P] [POLISH] 更新 CLAUDE.md 添加 /flow-clarify 命令描述 `.claude/CLAUDE.md`
- [ ] **T070** [P] [POLISH] 更新 .claude/commands/ 目录 CLAUDE.md `.claude/commands/CLAUDE.md`
- [ ] **T071** [P] [POLISH] 更新 .claude/agents/ 目录 CLAUDE.md `.claude/agents/CLAUDE.md`
- [ ] **T072** [P] [POLISH] 更新 .claude/scripts/ 目录 CLAUDE.md `.claude/scripts/CLAUDE.md`
- [ ] **T073** [POLISH] 运行 quickstart.md 完整验证流程
- [ ] **T074** [POLISH] 运行 shellcheck 代码质量检查
- [ ] **T075** [POLISH] 更新 EXECUTION_LOG.md 记录开发完成

### Constitution Check (Final)
- [ ] **Article I - Quality First**: 所有功能完整实现，无 TODO
- [ ] **Article II - Architectural Consistency**: 代码复用 common.sh
- [ ] **Article III - Security First**: 无硬编码密钥
- [ ] **Article V - Maintainability**: 文档完整更新

---

## Dependencies & Execution Order (依赖关系与执行顺序)

### Phase Dependencies

```
Phase 1: Setup
    │
    ▼
Phase 2: Foundational (BLOCKS all user stories)
    │
    ├────────────────────────────────────────┐
    │                                        │
    ▼                                        ▼
Phase 3: US1 (Scan)                    [Can parallelize if staffed]
    │
    ▼
Phase 4: US2 (Questions) ─────────────────┐
    │                                      │
    ▼                                      │
Phase 5: US3 (Interactive) ───────────────┤
    │                                      │
    ▼                                      │
Phase 6: US4 (Report) ────────────────────┘
    │
    ├──────────── MVP COMPLETE ────────────
    │
    ▼
Phase 7: US5 (Auto-update) [P2]
    │
    ▼
Phase 8: US6 (History) [P3]
    │
    ▼
Phase 9: Polish
```

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 Foundational - No dependencies on other stories
- **US2 (P1)**: Depends on US1 (needs scan results)
- **US3 (P1)**: Depends on US2 (needs questions)
- **US4 (P1)**: Depends on US3 (needs answers)
- **US5 (P2)**: Depends on US4 (needs report) - Post-MVP
- **US6 (P3)**: Depends on US4 (needs clarifications/) - Future

### Within Each User Story

1. Tests MUST be written and FAIL before implementation
2. Foundation functions before main logic
3. Script implementation before command/agent integration
4. Story complete before moving to next priority

---

## Parallel Execution Examples

### Phase 1 (Setup) - All Parallel
```bash
# 可同时执行:
T002: run-clarify-scan.sh 创建
T003: generate-clarification-questions.sh 创建
T004: generate-clarification-report.sh 创建
T005: test-clarify-scan.sh 创建
```

### Phase 2 (Foundational) - Partial Parallel
```bash
# 可同时执行:
T008: validate_answer() 实现
T009: load_session() 实现
T010: save_session() 实现

# 必须顺序执行:
T007: check_api_key() 先于 T011: call_claude_api()
T011: call_claude_api() 先于 T012: DIMENSIONS 定义
```

### Phase 3 (US1) - Tests Parallel, Implementation Sequential
```bash
# 测试可同时执行:
T014: test_valid_req_id
T015: test_invalid_req_id
T016: test_dimension_timeout
T017: test_happy_path_scan

# 实现必须顺序:
T018: scan_dimension() 先于 T019: scan_all_dimensions()
T019: scan_all_dimensions() 先于 T020: format_scan_result()
T020: format_scan_result() 先于 T021: main()
```

---

## Implementation Strategy (实施策略)

### MVP First (User Story 1-4 Only)

1. Complete Phase 1: Setup (0.5 天)
2. Complete Phase 2: Foundational (1 天)
3. Complete Phase 3: User Story 1 - Scan (2 天)
4. Complete Phase 4: User Story 2 - Questions (1.5 天)
5. Complete Phase 5: User Story 3 - Interactive (1.5 天)
6. Complete Phase 6: User Story 4 - Report (1 天)
7. **STOP and VALIDATE**: Test complete flow
8. Skip Phase 7-8 (P2/P3)
9. Complete Phase 9: Polish (0.5 天)

**Total MVP Estimate**: 8 天

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Test: run-clarify-scan.sh works independently
3. US2 → Test: generate-clarification-questions.sh works with scan output
4. US3 → Test: Interactive flow works end-to-end
5. US4 → Test: Report generation and status update
6. **MVP Demo!**
7. (Optional) US5 → Auto-update research.md
8. (Optional) US6 → History query

---

## Validation Checklist (验证清单)

### User Story Organization
- [x] 每个用户故事有自己的 Phase (Phase 3-8)
- [x] 所有任务都有 [US#] 标签标记所属故事
- [x] 每个故事有 Independent Test 标准
- [x] 每个故事有 Checkpoint 验证点
- [x] Foundational phase 只包含所有故事共需的前置条件

### Completeness (完整性)
- [x] 所有 API contracts (contracts/script-api.yaml) 都映射到用户故事
- [x] 所有 data entities (data-model.md) 都映射到用户故事
- [x] 所有用户故事 (PRD Story 1-6) 都有对应的任务集合
- [x] Setup 和 Foundational phase 明确定义

### Story Independence (故事独立性)
- [x] US1 可以独立实现和测试 (scan only)
- [x] US2 依赖 US1 输出，但测试可独立 (mock scan result)
- [x] US3 依赖 US2 输出，但测试可独立 (mock questions)
- [x] US4 依赖 US3 输出，但测试可独立 (mock session)
- [x] 故事间依赖已明确标注

### Parallel Safety (并行安全性)
- [x] 所有 [P] 标记的任务都操作不同文件
- [x] 同一文件的任务没有 [P] 标记
- [x] 有依赖关系的任务没有 [P] 标记

### Path Specificity (路径明确性)
- [x] 每个任务都指定了具体的文件路径
- [x] 路径使用了正确的项目结构约定 (.claude/scripts/, .claude/commands/, .claude/agents/)
- [x] 测试文件路径遵循 test-*.sh 命名

### Constitution Alignment (宪法符合性)
- [x] **Article I - Quality First**: 没有违反 NO PARTIAL IMPLEMENTATION
- [x] **Article II - Architectural Consistency**: 复用 common.sh
- [x] **Article II - Anti-Over-Engineering**: Bash 脚本直接实现
- [x] **Article III - Security First**: API Key 环境变量，输入验证
- [x] **Article VI - Test-First Development**: TDD 顺序正确
- [x] **Article X - Requirement Boundary**: 仅实现 PRD 明确需求

---

## Progress Tracking (进度跟踪)

### Overall Progress
- [ ] Phase 1: Setup (6 tasks)
- [ ] Phase 2: Foundational (7 tasks)
- [ ] **CHECKPOINT**: Foundation ready
- [ ] Phase 3: User Story 1 - Scan (9 tasks) - MVP
- [ ] Phase 4: User Story 2 - Questions (8 tasks) - MVP
- [ ] Phase 5: User Story 3 - Interactive (12 tasks) - MVP
- [ ] Phase 6: User Story 4 - Report (9 tasks) - MVP
- [ ] **MVP COMPLETE**
- [ ] Phase 7: User Story 5 - Auto-update (10 tasks) - P2
- [ ] Phase 8: User Story 6 - History (7 tasks) - P3
- [ ] Phase 9: Polish (7 tasks)

### Test Coverage Status
- Contract Tests (US1): 0 / 4
- Contract Tests (US2): 0 / 3
- Integration Tests (US3): 0 / 4
- Contract Tests (US4): 0 / 3
- Total: 0 / 14 tests

### User Story Completion
- [ ] US1 (P1): 0 / 9 tasks - Independent Test: PENDING
- [ ] US2 (P1): 0 / 8 tasks - Independent Test: PENDING
- [ ] US3 (P1): 0 / 12 tasks - Independent Test: PENDING
- [ ] US4 (P1): 0 / 9 tasks - Independent Test: PENDING
- [ ] US5 (P2): 0 / 10 tasks - Independent Test: PENDING
- [ ] US6 (P3): 0 / 7 tasks - Independent Test: PENDING

### Constitution Compliance
- [x] **Initial Check**: All 10 Articles validated at planning stage
- [ ] **Post-Implementation**: Constitution Check re-run after all tasks complete
- [ ] **Security Scan**: No high-severity issues
- [ ] **Code Review**: Architectural consistency verified

---

## 相关文档

- **PRD**: `devflow/requirements/REQ-001/PRD.md`
- **EPIC**: `devflow/requirements/REQ-001/EPIC.md`
- **TECH_DESIGN**: `devflow/requirements/REQ-001/TECH_DESIGN.md`
- **Data Model**: `devflow/requirements/REQ-001/data-model.md`
- **API Contracts**: `devflow/requirements/REQ-001/contracts/script-api.yaml`
- **Quickstart**: `devflow/requirements/REQ-001/quickstart.md`
- **Constitution**: `.claude/rules/project-constitution.md`
- **Execution Log**: `devflow/requirements/REQ-001/EXECUTION_LOG.md`

---

**Generated by**: planner agent
**Based on**: PRD.md, EPIC.md, TECH_DESIGN.md, data-model.md, contracts/script-api.yaml, quickstart.md
**Constitution**: `.claude/rules/project-constitution.md` v2.0.0
**Template Version**: 3.0.0 (Spec-Kit inspired - User Story Centric)
