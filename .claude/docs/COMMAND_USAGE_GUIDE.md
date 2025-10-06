# CC-DevFlow 命令使用指南

## 概述

CC-DevFlow 提供了一套完整的阶段化命令系统，用于管理从需求分析到代码发布的完整开发流程。本指南详细说明每个命令的使用方法、参数选项和最佳实践。

## 目录

- [核心工作流命令](#核心工作流命令)
  - [/flow-init - 初始化需求](#flow-init)
  - [/flow-prd - 生成PRD](#flow-prd)
  - [/flow-epic - Epic规划](#flow-epic)
  - [/flow-dev - 开发执行](#flow-dev)
  - [/flow-qa - 质量保证](#flow-qa)
  - [/flow-release - 发布管理](#flow-release)
- [便捷管理命令](#便捷管理命令)
- [高级功能命令](#高级功能命令)
- [常见使用场景](#常见使用场景)
- [故障排查](#故障排查)

---

## 核心工作流命令

### /flow-init

**功能**: 初始化需求结构和Git分支

#### 基本用法
```bash
# 格式
/flow-init "REQ_ID|TITLE"
/flow-init "REQ_ID|TITLE|PLAN_URL"

# 示例
/flow-init "REQ-123|支持用户下单"
/flow-init "REQ-123|支持用户下单|https://plan.example.com/spec"
```

#### 执行内容
1. 创建需求目录结构 `.claude/docs/requirements/REQ-123/`
2. 创建Git功能分支 `feature/REQ-123-支持用户下单`
3. 初始化状态文件 `orchestration_status.json`
4. 可选: 抓取PLAN_URL的内容到 `research/` 目录

#### 输出产物
- `.claude/docs/requirements/REQ-123/` (目录结构)
- `orchestration_status.json` (状态: `initialized`)
- `EXECUTION_LOG.md` (初始日志)
- `research/*.md` (如果提供了PLAN_URL)

#### 最佳实践
- ✅ 使用描述性的需求标题
- ✅ 提供PLAN_URL以自动抓取需求背景材料
- ✅ 确保REQ_ID格式一致 (建议: `REQ-数字`)
- ❌ 避免使用特殊字符或空格在REQ_ID中

---

### /flow-prd

**功能**: 生成产品需求文档 (PRD)

#### 基本用法
```bash
# 显式指定REQ_ID
/flow-prd "REQ-123"

# 自动检测 (需在feature分支上)
/flow-prd
```

#### 执行内容
1. 调用 **prd-writer** 研究型代理分析需求
2. 读取 `research/` 目录的研究材料
3. 生成结构化PRD文档
4. 执行 Constitution 宪法检查
5. 验证文档完整性 (无占位符、用户故事完整)

#### 输出产物
- `PRD.md` (100+ 行完整需求文档)
  - 背景与目标
  - 用户故事 + Given-When-Then 验收标准
  - 非功能性要求
  - 技术约束
  - Constitution检查结果
- `orchestration_status.json` (更新状态: `prd_complete`)

#### 质量检查
- ✅ 所有用户故事符合 INVEST 原则
- ✅ 验收标准使用 Gherkin 格式
- ✅ 无 `{{PLACEHOLDER}}` 占位符
- ✅ Constitution检查通过 (NO PARTIAL IMPLEMENTATION)

#### 最佳实践
- ✅ 在 `research/` 目录提供充分的需求材料
- ✅ 检查生成的用户故事是否符合预期
- ✅ 确认非功能性要求的具体指标
- ✅ 如需调整，可手动编辑 PRD.md 再继续

---

### /flow-epic

**功能**: 生成Epic规划和任务分解

#### 基本用法
```bash
# 显式指定REQ_ID
/flow-epic "REQ-123"

# 自动检测
/flow-epic
```

#### 执行内容
1. 调用 **planner** 研究型代理分析PRD
2. 识别Epic和原子级任务
3. 定义任务依赖关系和优先级
4. 生成详细的Definition of Done (DoD)
5. 标记逻辑独立任务 [P]

#### 输出产物
- `EPIC.md` (Epic描述和技术方案)
- `TASKS.md` (单文件管理所有任务)
  - 每个任务包含: ID、描述、类型、优先级、依赖、DoD
  - [P] 标记表示逻辑独立任务 (可连续快速执行)
- `orchestration_status.json` (更新状态: `epic_complete`)

#### 任务类型说明
- **FEATURE**: 新功能实现
- **REFACTOR**: 代码重构
- **TEST**: 测试补充
- **DOC**: 文档更新
- **CONFIG**: 配置变更

#### 最佳实践
- ✅ 确认任务粒度合适 (2-8小时完成)
- ✅ 检查依赖关系是否合理
- ✅ 验证DoD是否具体可测试
- ✅ 理解 [P] 标记含义 (逻辑独立，但仍串行执行)

---

### /flow-dev

**功能**: 执行开发任务 (TDD方式)

#### 基本用法
```bash
# 执行所有待办任务
/flow-dev "REQ-123"

# 执行特定任务
/flow-dev "REQ-123" --task="TASK_001"

# 恢复中断的任务
/flow-dev "REQ-123" --resume
```

#### 执行内容

**对每个任务执行5个阶段**:

```text
Phase 1: 分析现有代码
  - 读取相关文件
  - 理解当前实现
  - 识别需要修改的部分

Phase 2: 编写测试 (Tests First)
  - dev-implementer代理生成实现计划
  - 主代理根据计划编写测试
  - 测试必须先失败 (验证测试有效性)

TEST VERIFICATION CHECKPOINT
  - 运行测试，必须失败
  - 如果直接通过 → ERROR (说明测试无效或已实现)

Phase 3: 实现代码
  - 主代理根据实现计划编写代码
  - 遵循现有代码风格和架构模式
  - 确保符合Constitution原则

Phase 4: 测试验证
  - 运行测试，必须全部通过
  - 检查代码覆盖率 (≥80%)
  - TypeScript类型检查

Phase 5: Git提交并标记完成
  - 提交代码和测试
  - 创建 tasks/TASK_ID.completed 标记
  - 更新EXECUTION_LOG.md
```

#### 输出产物
- 实现代码 (新文件或修改现有文件)
- 测试代码 (`*.test.ts` 或 `*.spec.ts`)
- `tasks/TASK_ID.completed` (任务完成标记)
- `tasks/IMPLEMENTATION_PLAN.md` (实现计划)
- Git commits (每个任务一个commit)

#### 关键特性
- **强制TDD**: 测试必须先写且先失败
- **串行执行**: 即使标记 [P]，仍串行执行保持上下文
- **自动提交**: 每个任务完成后自动Git提交
- **可恢复**: 中断后可通过 `--resume` 继续

#### 最佳实践
- ✅ 让代理完整执行TDD流程，不要跳过测试阶段
- ✅ 检查测试是否真正验证了功能 (避免无用测试)
- ✅ 确认代码覆盖率达标
- ✅ 遵循项目的代码风格和命名约定
- ❌ 不要试图并行执行多个任务

---

### /flow-qa

**功能**: 质量保证和测试验证

#### 基本用法
```bash
# 基础QA (测试 + 覆盖率)
/flow-qa "REQ-123"

# 完整QA (测试 + 覆盖率 + 安全扫描)
/flow-qa "REQ-123" --full
```

#### 执行内容

**Phase 1: 测试计划生成**
- 调用 **qa-tester** 研究型代理分析代码覆盖
- 生成 `TEST_PLAN.md`

**Phase 2: 测试执行**
- 运行所有测试套件
- 收集覆盖率报告
- 检查覆盖率 ≥ 80%

**Phase 3: 安全审查** (如果 `--full`)
- 调用 **security-reviewer** 研究型代理
- 执行安全扫描
- 生成 `SECURITY_PLAN.md`

**Phase 4: 报告生成**
- 生成 `TEST_REPORT.md` (测试结果摘要)
- 生成 `SECURITY_REPORT.md` (安全扫描结果)

#### 输出产物
- `TEST_PLAN.md` (测试策略和覆盖分析)
- `TEST_REPORT.md` (测试结果报告)
- `SECURITY_PLAN.md` (安全审查计划)
- `SECURITY_REPORT.md` (安全扫描报告)
- `orchestration_status.json` (更新状态: `qa_complete`)

#### Exit Gate检查
- ✅ 所有测试通过
- ✅ 代码覆盖率 ≥ 80%
- ✅ 无高危安全问题
- ✅ TypeScript类型检查通过
- ✅ 无代码质量警告

#### 最佳实践
- ✅ 优先使用 `--full` 进行完整检查
- ✅ 认真审查安全报告中的任何警告
- ✅ 确保测试覆盖了所有关键路径
- ✅ 修复所有高危和中危安全问题

---

### /flow-release

**功能**: 发布管理和PR创建

#### 基本用法
```bash
# 创建正式PR
/flow-release "REQ-123"

# 创建草稿PR
/flow-release "REQ-123" --draft
```

#### 执行内容

**Phase 1: 发布计划生成**
- 调用 **release-manager** 研究型代理
- 分析变更集和影响范围
- 生成 `RELEASE_PLAN.md`

**Phase 2: 最终构建**
- 运行 `npm run build` (如果适用)
- 验证构建成功
- 检查打包产物

**Phase 3: PR创建**
- 创建GitHub Pull Request
- PR描述包含:
  - 需求摘要 (来自PRD)
  - 变更清单 (来自Git commits)
  - 测试结果 (来自TEST_REPORT)
  - 安全扫描 (来自SECURITY_REPORT)
  - 检查清单

**Phase 4: 状态更新**
- 更新 `orchestration_status.json` (状态: `release_complete`)
- 记录PR URL

#### 输出产物
- `RELEASE_PLAN.md` (发布计划和回滚策略)
- GitHub Pull Request (包含完整描述)
- PR URL (在EXECUTION_LOG.md中记录)

#### PR描述模板
```markdown
## 📋 需求概述
REQ-123: 支持用户下单

## 🎯 变更内容
- Feature: 用户下单接口
- Feature: 支付集成
- Test: 订单创建测试

## ✅ 测试结果
- 测试通过: 45/45
- 代码覆盖率: 87%

## 🔒 安全扫描
- 安全问题: 0 高危, 0 中危, 2 低危

## 📝 检查清单
- [x] 所有测试通过
- [x] 代码覆盖率 ≥ 80%
- [x] TypeScript类型检查通过
- [x] 安全扫描通过
- [x] 文档已更新
```

#### 最佳实践
- ✅ 确保所有质量检查在PR创建前完成
- ✅ 仔细审查PR描述的准确性
- ✅ 使用 `--draft` 进行早期反馈
- ✅ 在合并前进行人工代码审查

---

## 便捷管理命令

### /flow-new

**功能**: 一键完整流程 (自动执行所有6个阶段)

#### 基本用法
```bash
/flow-new "REQ-123|支持用户下单|https://plan.example.com/spec"
```

#### 执行内容
自动依次调用:
1. `/flow-init`
2. `/flow-prd`
3. `/flow-epic`
4. `/flow-dev`
5. `/flow-qa`
6. `/flow-release`

#### 适用场景
- 简单需求，无需分阶段干预
- 演示和快速原型开发
- 新用户学习流程

#### 注意事项
- 未来将重构为便捷包装器
- 建议有经验用户使用分阶段命令
- 如需干预，使用 Ctrl+C 中断后用 `/flow-restart`

---

### /flow-status

**功能**: 查看需求开发状态

#### 基本用法
```bash
# 所有需求概览
/flow-status

# 特定需求详细状态
/flow-status REQ-123
```

#### 输出信息
- 需求ID和标题
- 当前阶段 (init/prd/epic/dev/qa/release)
- 已完成步骤
- 任务进度 (已完成/总数)
- 最后更新时间

#### 示例输出
```text
需求状态概览:

REQ-123: 支持用户下单
  阶段: dev (开发中)
  进度: 3/8 任务完成
  最后更新: 2025-10-01 14:30:00

REQ-124: 数据导出功能
  阶段: qa (质量保证)
  进度: 8/8 任务完成
  最后更新: 2025-10-01 12:15:00
```

---

### /flow-update

**功能**: 手动更新任务进度和状态

#### 基本用法
```bash
# 标记任务完成
/flow-update "REQ-123" "TASK_001"

# 更新到特定阶段
/flow-update "REQ-123" --stage="qa"
```

#### 适用场景
- 手动修复或调整任务状态
- 跳过某些阶段 (不推荐)
- 调试和测试

---

### /flow-restart

**功能**: 恢复中断的开发流程

#### 基本用法
```bash
# 从中断点继续
/flow-restart "REQ-123"

# 从指定阶段重新开始
/flow-restart "REQ-123" --from=dev
```

#### 执行内容
1. 读取 `orchestration_status.json` 获取当前状态
2. 识别中断点或指定的起始阶段
3. 继续执行后续阶段

#### 适用场景
- 流程被意外中断
- 需要重新执行某个阶段
- 修复错误后继续

---

## 高级功能命令

### /flow-ideate

**功能**: Intent-driven需求澄清 (从模糊想法开始)

#### 基本用法
```bash
# 纯自然语言输入
/flow-ideate "我想做一个用户管理系统"

# 半结构化输入
/flow-ideate "REQ-123|我想要一个数据分析的东西"
```

#### 执行流程
1. AI分析输入，识别模糊点
2. 主动提出澄清问题 (4-8个)
3. 用户回答问题
4. AI整合信息，生成结构化需求
5. 自动进入标准流程 (创建PRD)

#### 澄清问题类型
- **核心定位**: 业务域、目标用户、核心价值
- **功能范围**: 核心功能、数据实体、业务流程
- **技术约束**: 性能要求、安全要求、集成要求
- **验收标准**: 成功标准、验收条件

#### 适用场景
- 需求初期，想法不明确
- 探索性项目
- 需要AI辅助细化需求

---

### /flow-upgrade

**功能**: PRD版本管理和升级

#### 基本用法
```bash
# 分析变更，建议版本策略
/flow-upgrade "REQ-123" --analyze

# 执行版本升级
/flow-upgrade "REQ-123" --version="2.0" --reason="添加移动端支持"

# 回滚到指定版本
/flow-upgrade "REQ-123" --rollback="v1.2"

# 兼容性检查
/flow-upgrade "REQ-123" --compatibility --target="v2.0"
```

#### 执行内容
- **analyze**: impact-analyzer代理分析PRD变更影响
- **upgrade**: 创建新版本PRD，记录变更历史
- **rollback**: 恢复到历史版本
- **compatibility**: compatibility-checker代理检查向后兼容性

#### 适用场景
- PRD需要重大变更
- 多版本并行开发
- 需要追踪需求演进历史

---

### /flow-verify

**功能**: 全链路一致性验证

#### 基本用法
```bash
# 基础一致性检查
/flow-verify "REQ-123"

# 详细分析报告
/flow-verify "REQ-123" --detailed

# 自动修复不一致
/flow-verify "REQ-123" --fix-auto

# 批量验证所有需求
/flow-verify --all
```

#### 检查内容
- PRD ↔ Epic 一致性
- Epic ↔ Tasks 一致性
- Tasks ↔ 代码实现 一致性
- 测试覆盖 ↔ 验收标准 一致性

#### 输出产物
- 一致性分析报告
- 冲突和偏离列表
- 修复建议

#### 适用场景
- 长期开发项目定期验证
- 怀疑文档和代码不一致
- 发布前最终检查

---

## 常见使用场景

### 场景1: 标准新需求开发

**新用户 (一键流程)**:
```bash
/flow-new "REQ-123|用户下单功能|https://plan.example.com/spec"
# 等待完成 (15-30分钟，取决于需求复杂度)
```

**有经验用户 (分阶段流程)**:
```bash
# 1. 初始化
/flow-init "REQ-123|用户下单功能|https://plan.example.com/spec"

# 2. 生成PRD并检查
/flow-prd "REQ-123"
# 手动审查 PRD.md，确认需求准确

# 3. 生成Epic和任务分解
/flow-epic "REQ-123"
# 手动审查 TASKS.md，确认任务合理

# 4. 开发执行
/flow-dev "REQ-123"
# 串行执行所有任务 (TDD方式)

# 5. 质量保证
/flow-qa "REQ-123" --full
# 检查测试报告和安全报告

# 6. 发布
/flow-release "REQ-123"
# 创建PR并合并
```

---

### 场景2: 从模糊想法开始

```bash
# 1. Intent-driven澄清
/flow-ideate "我想做一个用户反馈收集系统"
# AI提出澄清问题，用户回答
# 自动生成结构化需求

# 2. 继续标准流程
/flow-prd "REQ-124"  # 自动生成的REQ_ID
/flow-epic "REQ-124"
/flow-dev "REQ-124"
/flow-qa "REQ-124"
/flow-release "REQ-124"
```

---

### 场景3: 流程中断后恢复

```bash
# 场景: 在开发阶段中断
/flow-status REQ-123
# 输出: 阶段=dev, 进度=3/8 任务完成

# 恢复开发
/flow-restart "REQ-123"
# 或: /flow-dev "REQ-123" --resume

# 继续后续阶段
/flow-qa "REQ-123"
/flow-release "REQ-123"
```

---

### 场景4: PRD需要重大变更

```bash
# 1. 分析变更影响
/flow-upgrade "REQ-123" --analyze
# AI分析: 建议 Major 版本升级 (破坏性变更)

# 2. 执行版本升级
/flow-upgrade "REQ-123" --version="2.0" --reason="重构API接口"
# 创建 PRD_v2.0.md

# 3. 重新规划和开发
/flow-epic "REQ-123"     # 基于新PRD重新规划
/flow-dev "REQ-123"      # 重新开发
/flow-qa "REQ-123"
/flow-release "REQ-123"
```

---

### 场景5: 发布前一致性检查

```bash
# 完成开发和QA后
/flow-verify "REQ-123" --detailed
# 检查 PRD ↔ Epic ↔ Tasks ↔ 代码实现 一致性

# 如果发现不一致
/flow-verify "REQ-123" --fix-auto
# 自动修复可修复的问题

# 最终发布
/flow-release "REQ-123"
```

---

## 故障排查

### 问题1: 命令找不到REQ_ID

**症状**:
```
ERROR: No requirement ID found. Provide REQ_ID or run on feature branch.
```

**原因**: 未提供REQ_ID且不在feature分支上

**解决方法**:
```bash
# 方法1: 显式提供REQ_ID
/flow-prd "REQ-123"

# 方法2: 切换到feature分支
git checkout feature/REQ-123-xxx
/flow-prd
```

---

### 问题2: 阶段检查失败

**症状**:
```
ERROR: Requirement not in correct phase for Epic generation
Current phase: dev (expected: epic_planning)
```

**原因**: 流程阶段不匹配

**解决方法**:
```bash
# 检查当前状态
/flow-status REQ-123

# 如果确实需要重新规划，手动更新状态
/flow-update "REQ-123" --stage="epic_planning"

# 或从指定阶段重新开始
/flow-restart "REQ-123" --from=epic
```

---

### 问题3: TDD测试直接通过

**症状**:
```
ERROR: Test passed immediately - invalid test or already implemented
Phase 2 tests must fail before Phase 3 implementation
```

**原因**: 测试先通过，违反TDD原则

**解决方法**:
- 检查测试是否真正验证了新功能
- 确认功能是否已经实现 (如果是，测试有效)
- 修改测试使其更严格或检查不同的方面

---

### 问题4: 代码覆盖率不达标

**症状**:
```
ERROR: Code coverage below threshold
Current: 72%, Required: 80%
```

**解决方法**:
```bash
# 1. 查看覆盖率报告
npm run test -- --coverage

# 2. 识别未覆盖的代码
# 3. 补充测试

# 4. 重新运行QA
/flow-qa "REQ-123"
```

---

### 问题5: 安全扫描发现问题

**症状**:
```
⚠️ Security issues found:
[high] Hardcoded secret in config.ts:45
```

**解决方法**:
```bash
# 1. 修复安全问题
# 2. 重新运行安全扫描
/flow-qa "REQ-123" --full

# 3. 确认问题解决后继续
/flow-release "REQ-123"
```

---

## 最佳实践总结

### 🎯 工作流最佳实践
- ✅ 新手使用 `/flow-new`，熟练后使用分阶段命令
- ✅ 每个阶段完成后手动审查输出文档
- ✅ 发现问题及时修正，不要带病前进
- ✅ 利用 `/flow-status` 定期检查进度

### 📝 文档最佳实践
- ✅ 在 `research/` 提供充分的需求材料
- ✅ PRD生成后仔细审查用户故事
- ✅ 任务分解后确认粒度和依赖关系
- ✅ 使用 `/flow-verify` 定期检查一致性

### 💻 开发最佳实践
- ✅ 严格遵循TDD流程 (测试先失败再实现)
- ✅ 确保测试真正验证功能 (避免无用测试)
- ✅ 代码覆盖率保持 ≥ 80%
- ✅ 遵循项目代码风格和命名约定

### 🔒 安全最佳实践
- ✅ 总是使用 `--full` 进行完整QA检查
- ✅ 认真对待任何安全警告
- ✅ 遵循 Constitution 原则 (NO HARDCODED SECRETS)
- ✅ 定期运行安全扫描

### 🚀 发布最佳实践
- ✅ 发布前运行完整的 `/flow-qa --full`
- ✅ 使用 `/flow-verify` 进行最终一致性检查
- ✅ 创建PR后进行人工代码审查
- ✅ 确保CI/CD全部通过后再合并

---

## 相关文档

- [CLAUDE.md](../CLAUDE.md) - 项目概述和架构说明
- [SPEC_KIT_ANALYSIS_AND_OPTIMIZATION.md](SPEC_KIT_ANALYSIS_AND_OPTIMIZATION.md) - 架构优化分析报告
- [Constitution体系](../constitution/) - 开发原则和约束
- [命令定义目录](../commands/) - 各命令的详细执行流程

---

**最后更新**: 2025-10-01
**文档版本**: 1.0