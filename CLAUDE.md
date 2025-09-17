# CC-DevFlow 项目 - Claude Code 需求开发流

## 项目概述

这是一个基于 Claude Code 官方子代理/钩子/设置机制的完整需求开发流系统。通过一个命令 `/flow:new` 就可以完成从需求分析到代码合并的完整开发流程。

## 核心理念

- **一键启动**: 通过 `/flow:new "REQ-123|需求标题|计划URL"` 启动完整流程
- **文档驱动**: 以 Markdown 文档为一等公民，记录全过程
- **质量闸控**: 严格的 DoD/Security/Quality 检查机制
- **子代理编排**: 7个专业子代理协同工作
- **MCP 集成**: 支持远程网页抓取和外部工具集成

## 子代理使用规范

### 主要工作流子代理
1. **flow-orchestrator**: 总控子代理，编排整个开发流程
2. **prd-writer**: 编写结构化的产品需求文档
3. **planner**: 将 PRD 拆分为可执行的 Epic 和 Tasks
4. **dev-implementer**: 实现单个任务，确保代码质量
5. **qa-tester**: 生成和执行测试，验证覆盖率
6. **security-reviewer**: 安全漏洞扫描和修复
7. **release-manager**: PR 创建、合并和分支清理

### 使用原则
- 每个子代理都有独立的上下文，避免污染主对话
- 通过 Task 工具调用子代理，实现专业化分工
- 子代理输出的文档必须符合模板规范

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
```
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