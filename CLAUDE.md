# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CC-DevFlow 项目 - Claude Code 需求开发流

## 项目概述

这是一个基于 Claude Code 官方子代理/钩子/设置机制的完整需求开发流系统。通过一个命令 `/flow-new` 就可以完成从需求分析到代码合并的完整开发流程。

## 核心理念

- **一键启动**: 通过 `/flow-new "REQ-123|需求标题|计划URL"` 启动完整流程
- **阶段化执行**: 6个独立阶段命令 (init/prd/epic/dev/qa/release)，可单独调用或组合
- **文档驱动**: 以 Markdown 文档为一等公民，记录全过程
- **模板驱动**: 自执行模板 (PRD_TEMPLATE, EPIC_TEMPLATE, TASKS_TEMPLATE) 指导文档生成
- **质量闸控**: 严格的 DoD/Security/Quality 检查机制
- **研究型子代理**: 10个专业研究型子代理提供分析和计划
- **主代理执行**: Claude 主代理负责所有实际代码执行
- **统一脚本基础设施**: 所有代理和命令使用统一的 `.claude/scripts/` 脚本
- **Constitution 集成**: 所有阶段强制执行 Constitution 检查
- **MCP 集成**: 支持远程网页抓取和外部工具集成

## 架构优化总结

### 2025-01-09 重大架构重构
基于 Claude Code 最佳实践原则，完成了从"分布式执行"到"集中化执行"的架构转换：

#### 核心原则变更
- **子代理角色重新定位**: 从"执行者"转为"研究者+规划者"
- **主代理职责扩大**: Claude 主代理承担所有实际代码执行
- **消除并行冲突**: 取消多个 dev-implementer 并行执行，避免上下文和文件冲突
- **统一执行上下文**: 主代理拥有完整上下文，确保代码一致性

#### 具体优化内容

##### 1. flow-orchestrator 重新设计
- **前**: 可执行子代理，工具 [Read, Task, Edit, Grep, Glob]
- **后**: 工作流指导文档 (type: workflow-guide)
- **变化**: 从编排执行转为提供标准操作程序 (SOP)
- **效果**: 主代理按文档流程执行，确保流程标准化

##### 2. dev-implementer 角色转换
- **前**: 执行型代理，工具 [Read, Edit, MultiEdit, Write, Grep, Glob, Bash]
- **后**: 研究型代理，工具 [Read, Grep, Glob]
- **变化**: 从直接写代码转为输出 IMPLEMENTATION_PLAN.md
- **效果**: 提供详细技术方案，主代理负责实际实现

##### 3. 状态管理简化
- **统一状态文件**: `devflow/requirements/${reqId}/orchestration_status.json`
- **任务完成标记**: `devflow/requirements/${reqId}/tasks/${taskId}.completed`
- **消除文件锁机制**: 不再需要复杂的并发控制

#### 技术优势
1. **消除上下文碎片化**: 主代理拥有完整项目上下文
2. **避免并发冲突**: 单一执行者，无文件竞争
3. **提高代码一致性**: 统一的代码风格和架构决策
4. **简化错误处理**: 集中化的错误管理和恢复
5. **增强调试能力**: 完整的执行轨迹和状态可见性

## 子代理架构

### 研究型子代理 (10个)
1. **flow-orchestrator**: 工作流指导文档，定义标准操作程序
2. **prd-writer**: 研究需求，输出结构化产品需求文档 (增强版，支持Intent-driven澄清)
3. **planner**: 分析PRD，输出Epic和任务分解计划
4. **dev-implementer**: 研究代码库，输出详细实现计划
5. **qa-tester**: 分析代码，输出测试计划和策略
6. **security-reviewer**: 安全分析，输出安全审查报告
7. **release-manager**: 发布分析，输出发布计划和PR策略
8. **impact-analyzer**: PRD变更影响分析，输出影响评估和迁移策略 (新增)
9. **compatibility-checker**: 版本兼容性分析，输出兼容性报告和风险评估 (新增)
10. **consistency-checker**: 全链路一致性验证，输出一致性分析和冲突检测报告 (新增)

### 执行机制
- **主代理**: Claude 本身，拥有完整上下文，执行所有代码操作
- **子代理输出**: 仅生成 Markdown 文档和分析报告
- **工作流程**: 子代理研究 → 输出计划 → 主代理执行 → 循环迭代

### 工具分配原则
- **研究型代理**: 仅 Read, Grep, Glob 工具（只读分析）
- **主代理**: 所有工具，包括 Edit, Write, Bash, Git 等执行工具
- **明确边界**: 子代理负责思考，主代理负责行动

### 代理规则集成 (2025-01-10 新增)
所有研究型代理现在都强制集成4大规则体系:

#### 1. 标准模式 (.claude/rules/standard-patterns.md)
- **Fail Fast**: 验证前置条件，尽早失败
- **Clear Errors**: 明确错误消息和修复建议
- **Minimal Output**: 聚焦核心信息，避免冗余
- **Structured Output**: 标准化的文档结构

#### 2. 代理协调 (.claude/rules/agent-coordination.md)
- **状态管理**: 更新 orchestration_status.json
- **完成标记**: 使用 .completed 文件标记任务完成
- **只读原则**: 研究型代理不修改代码，只生成文档
- **错误处理**: 统一的错误报告和恢复机制

#### 3. 日期时间处理 (.claude/rules/datetime.md)
- **ISO 8601 UTC**: 所有时间戳使用标准格式
- **时区感知**: 支持跨时区的时间追踪
- **一致性**: 统一的日期时间格式化

#### 4. DevFlow 模式 (.claude/rules/devflow-patterns.md)
- **REQ-ID 格式**: REQ-\d+ 格式验证
- **模板使用**: 使用 .claude/docs/templates/ 中的标准模板
- **可追溯性**: 维护文档之间的链接关系

### 统一脚本基础设施 (2025-01-10 新增)
所有代理和命令现在必须使用统一的脚本接口:

#### 核心脚本
- **check-prerequisites.sh**: 前置条件验证和路径获取
  ```bash
  .claude/scripts/check-prerequisites.sh --json --paths-only
  # 返回: {"REQ_ID":"REQ-123","REQ_DIR":"/path/to/req","AVAILABLE_DOCS":[...]}
  ```
- **setup-epic.sh**: Epic和Tasks结构初始化
- **check-task-status.sh**: 任务状态查询和进度追踪
- **mark-task-complete.sh**: 任务完成标记
- **generate-status-report.sh**: 状态报告生成
- **validate-constitution.sh**: Constitution 合规性检查
- **common.sh**: 通用函数库 (log_event, get_repo_root, 等)

#### 使用原则
- **路径管理**: 使用脚本获取路径，不硬编码
- **事件日志**: 使用 common.sh 的 log_event 记录所有重要操作
- **错误处理**: 遵循脚本的退出码约定
- **JSON 输出**: 支持 --json 标志用于程序化解析

## Constitution 宪法体系

### 最高行为准则
基于 GitHub spec-kit 理念建立的**不可变约束体系**，确保所有开发活动的质量、安全性和一致性：

#### 五大核心原则
1. **质量至上**: NO PARTIAL IMPLEMENTATION，完整实现或不实现
2. **架构一致性**: NO CODE DUPLICATION，遵循现有模式和约定
3. **安全优先**: NO HARDCODED SECRETS，安全考虑优先于功能
4. **性能责任**: NO RESOURCE LEAKS，主动优化和资源管理
5. **可维护性**: NO DEAD CODE，代码必须便于理解和修改

#### 宪法文档结构
```text
.claude/constitution/
├── project-constitution.md      # 项目总宪法（五大原则）
├── quality-gates.md            # 质量闸原则（5类质量检查）
├── architecture-constraints.md  # 架构约束（6层架构+模块化）
├── security-principles.md      # 安全原则（5个安全维度）
└── README.md                   # 宪法体系说明
```

#### 集成方式
- **0级规则**: Constitution 作为最高优先级规则
- **工作流集成**: 每个 `/flow-new` 开始前进行宪法验证
- **质量闸集成**: 所有质量检查都基于宪法标准
- **代理约束**: 所有代理（主代理+子代理）都必须遵循宪法

## Intent-driven 增强能力

### 核心特性 (基于 GitHub spec-kit 理念)
- **从模糊想法开始**: 支持自然语言描述，如"我想做一个用户管理系统"
- **智能澄清问题**: AI主动询问关键信息，逐步完善需求
- **迭代式细化**: 多轮对话，支持复杂需求的逐步明确
- **无缝集成**: 最终转换为标准化需求，进入现有开发流程

### 三种输入模式
1. **模糊想法模式**: 纯自然语言 → 智能澄清 → 结构化需求
2. **半结构化模式**: 部分明确 + 部分模糊 → 混合处理
3. **精确模式**: 完整结构化输入 → 直接处理 (保持兼容)

### 澄清问题体系
- **核心定位问题**: 业务域、目标用户、核心价值
- **功能范围问题**: 核心功能、数据实体、业务流程
- **技术约束问题**: 性能要求、安全要求、集成要求
- **验收标准问题**: 成功标准、验收条件、时间要求

### 智能特性
- **问题优先级**: 基于置信度和信息完整度动态调整
- **上下文感知**: 结合项目历史和技术栈生成相关问题
- **质量保证**: 确保澄清结果符合Constitution标准

## 模板驱动开发 (2025-01-10 新增)

### 自执行模板系统
CC-DevFlow 采用**自执行模板 (Self-Executable Templates)** 架构，每个模板不仅定义文档结构，还包含完整的生成逻辑。

#### 核心模板
1. **PRD_TEMPLATE.md** - 产品需求文档模板
   - 位置: `.claude/docs/templates/PRD_TEMPLATE.md`
   - 包含: Execution Flow (10步生成流程)
   - 输出: 完整的 PRD.md (用户故事、验收标准、NFR)
   - 用途: prd-writer 代理必须遵循此模板的 Execution Flow

2. **EPIC_TEMPLATE.md** - Epic规划文档模板
   - 位置: `.claude/docs/templates/EPIC_TEMPLATE.md`
   - 包含: Execution Flow (10步生成流程)
   - 输出: EPIC.md (架构设计、技术方案、实施阶段)
   - 用途: planner 代理必须遵循此模板生成Epic

3. **TASKS_TEMPLATE.md** - 任务分解文档模板
   - 位置: `.claude/docs/templates/TASKS_TEMPLATE.md`
   - 包含: Execution Flow (任务生成规则)
   - 输出: TASKS.md (单一文档，包含所有任务)
   - 用途: planner 代理必须遵循此模板生成任务列表

4. **TASK_EXECUTABLE_TEMPLATE.md** - 可执行任务模板
   - 位置: `.claude/docs/templates/TASK_EXECUTABLE_TEMPLATE.md`
   - 包含: 5阶段TDD执行流程
   - 用途: dev-implementer 代理生成实现计划

### 模板使用流程
```text
1. 代理被调用 (如 prd-writer)
   ↓
2. 读取对应模板 (PRD_TEMPLATE.md)
   ↓
3. 解析 Execution Flow (步骤1-10)
   ↓
4. 按步骤执行:
   - 读取输入文档
   - 分析和提取信息
   - 执行 Constitution Check
   - 验证完整性
   ↓
5. 生成完整文档 (PRD.md)
   - 无占位符 {{PLACEHOLDER}}
   - 所有章节完整填充
   - 通过 Validation Checklist
```

### TASKS.md 单文件管理 (重要变更)
**旧架构**: 多个 TASK_*.md 文件，每个任务一个文件
**新架构**: 单一 TASKS.md 文件，所有任务集中管理

#### 优势
- **易于维护**: 一个文件查看所有任务
- **原子操作**: 更新任务列表只需修改一个文件
- **依赖清晰**: 任务依赖关系在同一文档中可见
- **版本控制**: Git diff 更清晰，变更历史完整

#### TASKS.md 结构
```markdown
# Tasks: REQ-123

## Dependencies
- T002 depends on T001
- T004 depends on T002, T003

## Parallel Execution Examples
- T001, T003 可并行 (不同文件)
- T005, T006 可并行 (不同API端点)

## Phase 1: Setup (环境准备)
- [ ] **T001** [P] 初始化项目结构 `project-init.ts`
- [ ] **T002** 安装依赖和配置 `package.json`

## Phase 2: Tests First (TDD 测试优先) ⚠️
⚠️ MUST COMPLETE BEFORE Phase 3
- [ ] **T003** [P] 编写用户创建API的contract test `api/users.test.ts`
- [ ] **T004** [P] 编写用户查询的integration test `integration/users.test.ts`

### Constitution Check
- [ ] NO PARTIAL IMPLEMENTATION - 所有测试完整
- [ ] 测试覆盖所有验收标准

### TEST VERIFICATION CHECKPOINT
所有测试必须先失败，证明测试有效

## Phase 3: Core Implementation (核心实现)
- [ ] **T005** 实现User数据模型 `models/user.ts`
- [ ] **T006** 实现用户创建API `api/users.ts`
...
```

### TDD 强制执行
所有开发任务必须遵循严格的 TDD 顺序:

#### Phase 2: Tests First (测试优先)
- 所有测试在实现前完成
- 标记为 "⚠️ MUST COMPLETE BEFORE Phase 3"
- 每个API端点、每个用户故事都有对应测试

#### TEST VERIFICATION CHECKPOINT
- 位于 Phase 2 和 Phase 3 之间
- 验证所有测试**先失败** (证明测试有效)
- 如果测试直接通过 → ERROR (测试无效或已实现)

#### Phase 3: Implementation (实现)
- 仅在所有测试失败后开始
- 目标: 让测试通过
- 验证: 测试覆盖率 ≥80%

## 主要命令

### 阶段化工作流命令 (核心)

#### 完整需求开发流程 (6个阶段)
```text
/flow-init    → 初始化需求结构和Git分支
  ↓
/flow-prd     → 生成产品需求文档 (PRD.md)
  ↓
/flow-epic    → 生成Epic规划和任务分解 (EPIC.md, TASKS.md)
  ↓
/flow-dev     → 执行开发任务 (TDD方式)
  ↓
/flow-qa      → 质量保证和测试验证
  ↓
/flow-release → 创建PR并合并到主分支
```

#### 阶段命令详解

##### 1. /flow-init - 初始化需求结构
```bash
/flow-init "REQ-123|支持用户下单"
/flow-init "REQ-123|支持用户下单|https://plan.example.com/spec"
```
**功能**:
- 创建需求目录结构 (`devflow/requirements/REQ-123/`)
- 创建Git功能分支 (`feature/REQ-123-支持用户下单`)
- 初始化状态管理文件 (`orchestration_status.json`)
- 可选：抓取外部需求文档到 `research/` 目录

##### 2. /flow-prd - 生成PRD文档
```bash
/flow-prd "REQ-123"
/flow-prd              # 自动从当前分支检测REQ_ID
```
**功能**:
- 调用 prd-writer 研究型代理分析需求
- 生成结构化PRD文档 (用户故事、验收标准、非功能需求)
- 执行Constitution宪法检查 (NO PARTIAL IMPLEMENTATION)
- 输出: `PRD.md` (100+ 行完整需求文档)

##### 3. /flow-epic - 生成Epic和任务分解
```bash
/flow-epic "REQ-123"
/flow-epic             # 自动检测
```
**功能**:
- 调用 planner 研究型代理分析PRD
- 分解Epic和原子级任务 (符合INVEST原则)
- 定义任务依赖关系和优先级
- 生成详细DoD (Definition of Done)
- 输出: `EPIC.md`, `TASKS.md` (单文件管理所有任务)

##### 4. /flow-dev - 执行开发任务
```bash
/flow-dev "REQ-123"
/flow-dev "REQ-123" --task="TASK_001"    # 执行特定任务
/flow-dev "REQ-123" --resume             # 恢复中断的任务
```
**功能**:
- 主代理串行执行TASKS.md中的任务
- 对每个任务：
  1. 调用 dev-implementer 研究型代理生成实现计划
  2. 主代理根据计划执行 TDD 开发 (测试优先)
  3. 执行测试验证 (TEST VERIFICATION CHECKPOINT)
  4. 标记任务完成并提交Git
- 强制TDD: Phase 2 (Tests First) → Verify → Phase 3 (Implementation)

##### 5. /flow-qa - 质量保证
```bash
/flow-qa "REQ-123"
/flow-qa "REQ-123" --full     # 完整测试 + 覆盖率 + 安全扫描
```
**功能**:
- 调用 qa-tester 研究型代理分析测试覆盖
- 调用 security-reviewer 研究型代理执行安全审查
- 主代理执行: 运行测试、检查覆盖率 (≥80%)、安全扫描
- 输出: `TEST_REPORT.md`, `SECURITY_REPORT.md`
- Exit Gate: 所有检查必须通过才能进入发布阶段

##### 6. /flow-release - 发布管理
```bash
/flow-release "REQ-123"
/flow-release "REQ-123" --draft          # 创建草稿PR
```
**功能**:
- 调用 release-manager 研究型代理生成发布计划
- 主代理执行: 最终构建、创建PR、代码审查
- 输出: `RELEASE_PLAN.md`, GitHub PR链接
- PR描述包含: 需求摘要、测试结果、安全扫描、变更清单

#### 便捷命令

##### /flow-new - 一键完整流程 (将被重构)
```bash
/flow-new "REQ-123|支持用户下单|https://plan.example.com/spec"
```
**功能**: 自动依次调用所有6个阶段命令，完成端到端开发流程
**注意**: 未来将重构为便捷包装器，实际执行阶段化命令

##### /flow-status - 查看需求状态
```bash
/flow-status                    # 所有需求概览
/flow-status REQ-123            # 特定需求详细状态
```

##### /flow-update - 更新任务进度
```bash
/flow-update "REQ-123" "TASK_001"         # 标记任务完成
/flow-update "REQ-123" --stage="qa"       # 更新到QA阶段
```

##### /flow-restart - 恢复中断流程
```bash
/flow-restart "REQ-123"                   # 从中断点继续
/flow-restart "REQ-123" --from=dev        # 从指定阶段重新开始
```

### 高级功能命令

#### Intent-driven 需求澄清 (新增)
```bash
/flow-ideate "我想做一个用户管理系统"
/flow-ideate "需要一个数据分析功能来帮助业务决策"
/flow-ideate "REQ-123|我想要一个数据分析的东西"  # 半结构化
```
**功能**: 从模糊想法开始，AI主动澄清关键问题，最终生成结构化需求

#### PRD版本管理 (新增)
```bash
/flow-upgrade "REQ-123" --analyze                          # 分析变更建议版本
/flow-upgrade "REQ-123" --version="2.0" --reason="添加移动端"
/flow-upgrade "REQ-123" --rollback="v1.2"                  # 回滚版本
/flow-upgrade "REQ-123" --compatibility --target="v2.0"    # 兼容性检查
```
**功能**: PRD版本控制、影响分析、向后兼容性检查、变更追踪

#### 一致性验证 (新增)
```bash
/flow-verify "REQ-123"                    # 全链路一致性检查
/flow-verify "REQ-123" --detailed         # 详细分析报告
/flow-verify "REQ-123" --fix-auto         # 自动修复不一致
/flow-verify --all                        # 批量验证所有需求
```
**功能**: 检查PRD→Epic→Tasks→代码实现的一致性，检测冲突和偏离

### 开发工具命令
- `npm run dev` - 启动开发服务器（如果是 Node.js 项目）
- `npm run test` - 运行测试套件
- `npm run test:watch` - 启动测试监控
- `npm run typecheck` - 运行 TypeScript 类型检查
- `npm run lint` - 运行代码质量检查
- `npm run build` - 构建项目

### 质量检查命令
- `.claude/hooks/pre-push-guard.sh` - 预推送质量闸检查
- `.claude/scripts/verify-setup.sh` - 验证 cc-devflow 安装和配置
- `python3 .claude/scripts/demo.py` - 运行交互式演示

### 测试命令
- `bash .claude/tests/run-all-tests.sh --scripts` - 运行所有脚本测试套件
- `bash .claude/tests/scripts/test_*.sh` - 运行单个测试套件
- **测试套件列表**:
  - `test_check_prerequisites.sh` - 前置条件检查 (18个测试)
  - `test_check_task_status.sh` - 任务状态检查 (18个测试)
  - `test_common.sh` - 通用函数库 (15个测试)
  - `test_generate_status_report.sh` - 状态报告生成
  - `test_mark_task_complete.sh` - 任务完成标记 (15个测试)
  - `test_recover_workflow.sh` - 工作流恢复
  - `test_setup_epic.sh` - Epic设置 (13个测试)
  - `test_validate_constitution.sh` - Constitution验证 (4个测试)
- **测试覆盖率**: 8/8 测试套件 100% 通过，超过80个测试用例

## 工作流程

### 标准开发流程 (阶段化)

#### 快速启动 (推荐新用户)
```bash
# 一键完整流程 (自动执行所有6个阶段)
/flow-new "REQ-123|支持用户下单|https://plan.example.com/spec"
```

#### 分阶段执行 (推荐有经验用户)
```bash
# 阶段 1: 初始化
/flow-init "REQ-123|支持用户下单|https://plan.example.com/spec"
# → 创建目录结构、Git分支、状态文件、抓取研究材料

# 阶段 2: PRD生成
/flow-prd "REQ-123"
# → 生成 PRD.md (用户故事、验收标准、非功能需求)
# → 执行 Constitution 检查

# 阶段 3: Epic规划
/flow-epic "REQ-123"
# → 生成 EPIC.md + TASKS.md (任务分解、依赖关系、DoD)

# 阶段 4: 开发执行
/flow-dev "REQ-123"
# → 串行执行任务 (TDD方式: 测试优先 → 实现 → 验证)
# → 每个任务自动提交Git

# 阶段 5: 质量保证
/flow-qa "REQ-123"
# → 运行测试、检查覆盖率、安全扫描
# → 生成 TEST_REPORT.md + SECURITY_REPORT.md

# 阶段 6: 发布管理
/flow-release "REQ-123"
# → 创建PR、代码审查、合并到主分支
```

### 执行机制详解

#### 研究型代理 + 主代理协作模式
```text
每个阶段的执行模式:

1. 研究型代理 (只读分析)
   ↓ 输出 Markdown 计划文档
2. 主代理 (Claude) 审查计划
   ↓ 执行所有代码操作
3. 完成后更新状态
   ↓ 进入下一阶段
```

**关键特性**:
- **研究型代理**: 仅使用 Read/Grep/Glob 工具，只读分析
- **主代理执行**: 所有 Edit/Write/Bash/Git 操作由主代理完成
- **串行执行**: 即使任务标记为 [P] (逻辑独立)，仍串行执行以保持上下文完整
- **完整上下文**: 主代理拥有完整项目上下文，确保代码一致性

#### TDD强制执行机制
```text
/flow-dev 执行每个任务时:

Phase 1: 分析现有代码
  ↓
Phase 2: 编写测试 (Tests First)
  ↓
TEST VERIFICATION CHECKPOINT
  → 测试必须先失败 (证明测试有效)
  → 如果测试直接通过 → ERROR (说明测试无效或已实现)
  ↓
Phase 3: 实现代码
  ↓
Phase 4: 测试验证
  → 测试必须全部通过
  → 覆盖率必须符合要求
  ↓
Phase 5: Git提交并标记任务完成
```

### 质量闸控制体系

#### Entry Gate (入口闸)
每个阶段开始前验证前置条件:
- **PRD阶段**: 需求结构已初始化
- **Epic阶段**: PRD.md存在且完整
- **Dev阶段**: TASKS.md存在且有待执行任务
- **QA阶段**: 所有开发任务已完成
- **Release阶段**: 测试和安全检查已通过

#### Exit Gate (出口闸)
每个阶段结束时验证输出质量:
- **PRD阶段**: Constitution检查、无占位符、用户故事完整
- **Epic阶段**: 任务符合INVEST原则、依赖关系清晰、DoD明确
- **Dev阶段**: 测试通过、代码覆盖率≥80%、无TypeScript错误
- **QA阶段**: 测试报告完整、无高危安全问题、性能指标达标
- **Release阶段**: PR创建成功、CI/CD通过、代码审查完成

#### Constitution检查 (贯穿全流程)
- **NO PARTIAL IMPLEMENTATION**: 完整实现或不实现
- **NO CODE DUPLICATION**: 检查现有代码，复用函数和常量
- **NO HARDCODED SECRETS**: 安全考虑优先于功能
- **NO RESOURCE LEAKS**: 主动优化和资源管理
- **NO DEAD CODE**: 代码必须便于理解和修改

## 项目结构

### 核心目录结构
```text
.claude/
├── agents/              # 子代理定义
│   ├── prd-writer.md
│   ├── planner.md
│   ├── qa-tester.md
│   ├── security-reviewer.md
│   └── release-manager.md
├── commands/            # 命令定义 (10个)
│   ├── flow-init.md         # 初始化需求结构
│   ├── flow-prd.md          # 生成PRD文档
│   ├── flow-epic.md         # 生成Epic和任务分解
│   ├── flow-dev.md          # 执行开发任务
│   ├── flow-qa.md           # 质量保证
│   ├── flow-release.md      # 发布管理
│   ├── flow-new.md          # 一键完整流程 (便捷包装器)
│   ├── flow-status.md       # 查看需求状态
│   ├── flow-update.md       # 更新任务进度
│   └── flow-restart.md      # 恢复中断流程
├── hooks/               # 生命周期钩子
│   ├── pre-push-guard.sh
│   ├── auto-progress-update.py
│   └── markdown_formatter.py
├── scripts/             # 工具脚本
│   ├── demo.py
│   ├── verify-setup.sh
│   └── start-monitor.sh
├── docs/               # 文档和模板
│   ├── templates/
│   └── requirements/   # 需求文档存储
├── rules/              # 开发规则
│   ├── standard-patterns.md
│   ├── devflow-patterns.md
│   └── agent-coordination.md
└── settings.json       # Claude Code 配置
```

### 需求文档结构
```text
devflow/requirements/${reqId}/
├── research/                    # 外部研究材料 (MCP抓取或手动添加)
├── orchestration_status.json   # 状态管理文件 (阶段、进度、时间戳)
├── EXECUTION_LOG.md            # 执行日志 (所有操作的时间序列记录)
│
├── PRD.md                      # 产品需求文档 (100+ 行)
│                               # - 用户故事 + 验收标准
│                               # - 非功能需求
│                               # - Constitution检查结果
│
├── EPIC.md                     # Epic规划文档
│                               # - Epic描述和目标
│                               # - 技术方案概览
│                               # - 验收标准和DoD
│
├── TASKS.md                    # 任务分解文档 (单文件管理)
│                               # - 所有任务列表
│                               # - 依赖关系和优先级
│                               # - 每个任务的详细DoD
│                               # - [P] 标记独立任务
│
├── tasks/                      # 任务完成标记目录
│   ├── TASK_001.completed      # 空文件，表示任务完成
│   ├── TASK_002.completed
│   └── IMPLEMENTATION_PLAN.md  # dev-implementer输出的实现计划
│
├── TEST_PLAN.md                # 测试计划 (qa-tester输出)
├── TEST_REPORT.md              # 测试报告 (实际测试结果)
│
├── SECURITY_PLAN.md            # 安全计划 (security-reviewer输出)
├── SECURITY_REPORT.md          # 安全报告 (实际扫描结果)
│
└── RELEASE_PLAN.md             # 发布计划 (release-manager输出)
                                # - PR描述模板
                                # - 发布检查清单
                                # - 回滚计划
```

**关键文件说明**:
- **orchestration_status.json**: 记录当前阶段、已完成步骤、时间戳
- **TASKS.md**: 单文件管理所有任务 (替代旧版的多个 TASK_*.md)
- **tasks/*.completed**: 空文件标记任务完成，避免重复执行
- **IMPLEMENTATION_PLAN.md**: dev-implementer代理为当前任务生成的详细实现方案

## 开发规范

### Git 提交规范
```text
feat(REQ-123): 实现用户下单接口 - 添加订单创建和支付集成
fix(REQ-124): 修复用户权限检查逻辑 - 处理空角色场景
docs(REQ-125): 更新API文档 - 添加新的数据导出接口
```

### 测试要求
- 使用 qa-tester 子代理执行所有测试
- 单元测试覆盖率必须 ≥ 80%
- 集成测试必须覆盖关键业务流程
- 测试失败时必须修复后才能继续

### 测试框架架构

#### 测试框架核心 (.claude/tests/test-framework.sh)
提供完整的测试基础设施和断言库：

**核心功能**:
- **生命周期管理**: `run_tests()`, `setup_test()`, `teardown_test()`
- **断言库**: `assert_equals`, `assert_contains`, `assert_json_valid`, `assert_dir_exists`, `assert_success`, `assert_failure`
- **Mock系统**: `mock_git()`, `mock_file()`, `mock_function()`, `clear_git_mocks()`
- **测试隔离**: 每个测试在独立的临时目录中运行 (`$TEST_TMP_DIR`)
- **结果报告**: 彩色输出、测试计数、失败详情

**关键设计模式**:
```bash
# Exit code 捕获（Temp File 模式）
local output_file="$TEST_TMP_DIR/output.txt"
local exit_code_file="$TEST_TMP_DIR/exitcode.txt"

(
    command_to_test > "$output_file" 2>&1
    echo $? > "$exit_code_file"
)

local output=$(cat "$output_file")
local exit_code=$(cat "$exit_code_file")
```

**Mock Git 系统**:
- 创建可执行的 `$TEST_TMP_DIR/git` 脚本
- 通过 `PATH` 优先级劫持 git 命令
- 支持多命令 mock 和默认 fallback

**测试隔离技术**:
- 使用 `awk` 替换 `sed` 进行变量替换（`create_test_common()`）
- 每个测试前调用 `setup_test()` 清理 mock
- 独立的 `$TEST_TMP_DIR` 避免测试间污染

#### 测试覆盖范围
- **脚本功能测试**: 所有 `.claude/scripts/*.sh` 脚本
- **错误处理测试**: 参数验证、文件缺失、格式错误
- **集成测试**: 跨脚本协作、Git操作、文件系统操作
- **边界条件测试**: 空输入、特殊字符、并发场景

## 权限和安全

### 自动允许的操作
- Git 基础操作 (status, diff, add, commit, push)
- 开发相关 npm 脚本 (dev, test, typecheck)
- 目录创建和基础文件操作

### 需要确认的操作
- Git 合并操作
- GitHub PR 创建和合并
- 危险的系统操作

### 禁止的操作
- 读取敏感文件 (.env, secrets/)
- 危险的删除操作 (rm -rf)

## 质量保证钩子

### 预推送钩子 (.claude/hooks/pre-push-guard.sh)
自动执行以下检查：
- Git 状态验证
- TypeScript 类型检查
- 测试运行
- 代码质量检查 (lint)
- 构建验证
- 安全扫描
- 敏感文件检测

### 自动进度更新 (.claude/hooks/auto-progress-update.py)
监控文件变化和Git提交，自动更新需求进度状态。

## Tone and Behavior

- Criticism is welcome. Please tell me when I am wrong or mistaken, or even when you think I might be wrong or mistaken.
- Please tell me if there is a better approach than the one I am taking.
- Please tell me if there is a relevant standard or convention that I appear to be unaware of.
- Be skeptical.
- Be concise.
- Short summaries are OK, but don't give an extended breakdown unless we are working through the details of a plan.
- Do not flatter, and do not give compliments unless I am specifically asking for your judgement.
- Occasional pleasantries are fine.
- Feel free to ask many questions. If you are in doubt of my intent, don't guess. Ask.

## ABSOLUTE RULES:

- NO PARTIAL IMPLEMENTATION
- NO SIMPLIFICATION : no "//This is simplified stuff for now, complete implementation would blablabla"
- NO CODE DUPLICATION : check existing codebase to reuse functions and constants Read files before writing new functions. Use common sense function name to find them easily.
- NO DEAD CODE : either use or delete from codebase completely
- IMPLEMENT TEST FOR EVERY FUNCTIONS
- NO CHEATER TESTS : test must be accurate, reflect real usage and be designed to reveal flaws. No useless tests! Design tests to be verbose so we can use them for debuging.
- NO INCONSISTENT NAMING - read existing codebase naming patterns.
- NO OVER-ENGINEERING - Don't add unnecessary abstractions, factory patterns, or middleware when simple functions would work. Don't think "enterprise" when you need "working"
- NO MIXED CONCERNS - Don't put validation logic inside API handlers, database queries inside UI components, etc. instead of proper separation
- NO RESOURCE LEAKS - Don't forget to close database connections, clear timeouts, remove event listeners, or clean up file handles

输出的文档为中文，沟通也是用中文
- 每个文件不能大于 500 行，如果大于 500 行其实证明整个封装有问题，需要优化。
- 代码必须具备可复用性、鲁棒性、可测试性、内聚性。
- 代码时刻确保保持KISS 原则、YAGNI 原则、SOLID 原则、单一职责原则、依赖倒置原则。

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
