# CC-DevFlow 项目 - Claude Code 需求开发流

## 项目概述

这是一个基于 Claude Code 官方子代理/钩子/设置机制的完整需求开发流系统。通过一个命令 `/flow:new` 就可以完成从需求分析到代码合并的完整开发流程。

## 核心理念

- **一键启动**: 通过 `/flow:new "REQ-123|需求标题|计划URL"` 启动完整流程
- **文档驱动**: 以 Markdown 文档为一等公民，记录全过程
- **质量闸控**: 严格的 DoD/Security/Quality 检查机制
- **研究型子代理**: 7个专业研究型子代理提供分析和计划
- **主代理执行**: Claude 主代理负责所有实际代码执行
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
- **统一状态文件**: `.claude/docs/requirements/${reqId}/orchestration_status.json`
- **任务完成标记**: `.claude/docs/requirements/${reqId}/tasks/${taskId}.completed`
- **消除文件锁机制**: 不再需要复杂的并发控制

#### 技术优势
1. **消除上下文碎片化**: 主代理拥有完整项目上下文
2. **避免并发冲突**: 单一执行者，无文件竞争
3. **提高代码一致性**: 统一的代码风格和架构决策
4. **简化错误处理**: 集中化的错误管理和恢复
5. **增强调试能力**: 完整的执行轨迹和状态可见性

## 子代理架构

### 研究型子代理 (7个)
1. **flow-orchestrator**: 工作流指导文档，定义标准操作程序
2. **prd-writer**: 研究需求，输出结构化产品需求文档
3. **planner**: 分析PRD，输出Epic和任务分解计划
4. **dev-implementer**: 研究代码库，输出详细实现计划
5. **qa-tester**: 分析代码，输出测试计划和策略
6. **security-reviewer**: 安全分析，输出安全审查报告
7. **release-manager**: 发布分析，输出发布计划和PR策略

### 执行机制
- **主代理**: Claude 本身，拥有完整上下文，执行所有代码操作
- **子代理输出**: 仅生成 Markdown 文档和分析报告
- **工作流程**: 子代理研究 → 输出计划 → 主代理执行 → 循环迭代

### 工具分配原则
- **研究型代理**: 仅 Read, Grep, Glob 工具（只读分析）
- **主代理**: 所有工具，包括 Edit, Write, Bash, Git 等执行工具
- **明确边界**: 子代理负责思考，主代理负责行动

## 工作流程

### 1. 启动流程
```bash
/flow:new "REQ-123|支持用户下单|https://plan.example.com/spec"
```

### 2. 自动执行步骤
1. **研究收集**: MCP 抓取计划文档到 `.claude/docs/research/`
2. **Git 分支**: 创建 `feature/REQ-123-支持用户下单`
3. **PRD 生成**: prd-writer 子代理生成产品需求文档
4. **任务规划**: planner 子代理拆分 Epic 和 Tasks
5. **开发实施**: dev-implementer 逐个实现任务
6. **质量保证**: qa-tester 执行测试和覆盖率检查
7. **安全审查**: security-reviewer 进行安全扫描
8. **发布管理**: release-manager 创建 PR 并合并

### 3. 质量闸控制
- **TypeScript 检查**: 代码必须通过类型检查
- **测试覆盖率**: 覆盖率必须 ≥ 80%
- **安全扫描**: 无高危安全问题
- **代码审查**: 符合团队规范
- **文档完整**: 相关文档必须更新

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
