# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CC-DevFlow 项目 - Claude Code 需求开发流

## 项目概述

这是一个基于 Claude Code 官方子代理/钩子/设置机制的完整需求开发流系统。通过一个命令 `/flow-new` 就可以完成从需求分析到代码合并的完整开发流程。

## 核心理念

- **一键启动**: 通过 `/flow-new "REQ-123|需求标题|计划URL"` 启动完整流程
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

### 研究型子代理 (9个)
1. **flow-orchestrator**: 工作流指导文档，定义标准操作程序
2. **prd-writer**: 研究需求，输出结构化产品需求文档 (增强版，支持Intent-driven澄清)
3. **planner**: 分析PRD，输出Epic和任务分解计划
4. **dev-implementer**: 研究代码库，输出详细实现计划
5. **qa-tester**: 分析代码，输出测试计划和策略
6. **security-reviewer**: 安全分析，输出安全审查报告
7. **release-manager**: 发布分析，输出发布计划和PR策略
8. **impact-analyzer**: PRD变更影响分析，输出影响评估和迁移策略 (新增)
9. **compatibility-checker**: 版本兼容性分析，输出兼容性报告和风险评估 (新增)

### 执行机制
- **主代理**: Claude 本身，拥有完整上下文，执行所有代码操作
- **子代理输出**: 仅生成 Markdown 文档和分析报告
- **工作流程**: 子代理研究 → 输出计划 → 主代理执行 → 循环迭代

### 工具分配原则
- **研究型代理**: 仅 Read, Grep, Glob 工具（只读分析）
- **主代理**: 所有工具，包括 Edit, Write, Bash, Git 等执行工具
- **明确边界**: 子代理负责思考，主代理负责行动

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

## 主要命令

### 开发流程命令

#### Intent-driven 命令 (新增)
- `/flow-ideate "我想做一个用户管理系统"` - 从模糊想法开始的需求开发
- `/flow-ideate "需要一个数据分析功能来帮助业务决策"` - 支持自然语言描述
- `/flow-ideate "REQ-123|我想要一个数据分析的东西"` - 半结构化输入支持

#### 版本管理命令 (新增)
- `/flow-upgrade "REQ-123" --analyze` - 分析 PRD 变更并建议版本策略
- `/flow-upgrade "REQ-123" --version="2.0" --reason="添加移动端支持"` - 执行版本升级
- `/flow-upgrade "REQ-123" --rollback="v1.2"` - 回滚到指定版本
- `/flow-upgrade "REQ-123" --compatibility --target="v2.0"` - 兼容性检查

#### 传统精确命令
- `/flow-new "REQ-123|支持用户下单|https://plan.example.com/spec"` - 启动完整需求开发流程
- `/flow-status` - 查看所有需求的开发状态
- `/flow-status REQ-123` - 查看特定需求的详细状态
- `/flow-restart "REQ-123"` - 恢复中断的开发流程
- `/flow-update "REQ-123"` - 更新需求状态和进度

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

## 工作流程

### 1. 启动流程
```bash
/flow-new "REQ-123|支持用户下单|https://plan.example.com/spec"
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
├── commands/            # 命令定义
│   ├── flow-new.md
│   ├── flow-status.md
│   └── flow-restart.md
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
.claude/docs/requirements/${reqId}/
├── research/            # 外部研究材料
├── PRD.md              # 产品需求文档
├── EPIC.md             # Epic 规划
├── tasks/              # 任务分解
│   ├── TASK_001.md
│   └── TASK_002.md
├── TEST_PLAN.md        # 测试计划
├── SECURITY_PLAN.md    # 安全计划
├── TEST_REPORT.md      # 测试报告
├── SECURITY_REPORT.md  # 安全报告
├── RELEASE_PLAN.md     # 发布计划
└── EXECUTION_LOG.md    # 执行日志
```

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
