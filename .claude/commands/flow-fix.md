---
name: flow-fix
description: One-shot BUG fix flow. Usage: /flow-fix "用户登录时出现500错误"
---

# flow-fix - 一键BUG修复流

## 命令格式
```text
/flow-fix "BUG描述"
```

### 参数说明
- **BUG描述**: 简洁明确的BUG现象描述 (例如: 用户登录时出现500错误)

### 示例
```text
/flow-fix "用户登录时出现500错误"
/flow-fix "购物车数量计算错误导致订单金额不正确"
/flow-fix "文件上传功能在Safari浏览器中失败"
```

## Rules Integration

本命令遵循以下规则体系：

1. **Standard Patterns** (.claude/rules/standard-patterns.md):
   - Fail Fast: 前置条件验证失败立即停止
   - Clear Errors: 明确的错误提示和修复建议
   - Minimal Output: 简洁的进度和结果输出
   - Structured Output: 结构化的 BUG 修复文档

2. **Agent Coordination** (.claude/rules/agent-coordination.md):
   - 更新 orchestration_status.json 状态文件
   - 创建 .completed 完成标记
   - 与 bug-analyzer 子代理协调分析工作

3. **DateTime Handling** (.claude/rules/datetime.md):
   - 使用 ISO 8601 UTC 时间戳
   - 记录 BUG 发现时间、修复时间
   - 支持时区感知的时间跟踪

4. **DevFlow Patterns** (.claude/rules/devflow-patterns.md):
   - 强制 BUG-ID 格式验证 (BUG-\d+)
   - 使用标准化 BUG 修复模板
   - 一致的优先级评分方法
   - 可追溯性链接（BUG → Code → Test）

## Constitution Compliance

本命令强制执行 CC-DevFlow Constitution (.claude/constitution/project-constitution.md) 原则：

### 执行前验证
- **Quality First**: BUG 描述必须完整准确
- **Security First**: 识别 BUG 是否涉及安全漏洞

### 修复过程检查
1. **NO PARTIAL IMPLEMENTATION**: 完整修复或明确标记部分修复
2. **NO CODE DUPLICATION**: 修复代码遵循现有模式
3. **NO HARDCODED SECRETS**: 不引入安全风险
4. **NO RESOURCE LEAKS**: 修复不引入新的资源泄漏
5. **NO DEAD CODE**: 清理调试代码和无用注释

### 修复后验证
- **测试覆盖**: 修复代码必须有对应测试
- **回归测试**: 确保修复不破坏现有功能
- **文档更新**: 更新相关文档说明

## Prerequisites Validation

修复开始前，必须验证前置条件（Fail Fast 原则）：

```bash
# 设置 BUG ID 环境变量
export DEVFLOW_BUG_ID="${bugId}"

# 运行前置条件检查
bash .claude/scripts/check-prerequisites.sh --json

# 验证项:
# - BUG-ID 格式验证 (BUG-\d+)
# - BUG 目录结构检查
# - 必需文档存在性验证
# - Git 仓库状态验证 (是否有未提交的更改)
# - 开发工具可用性检查
```

**如果前置检查失败，立即停止（Fail Fast），不进行后续修复。**

## 执行流程

### 1. 参数解析和验证
- 解析命令参数: BUG描述
- 生成唯一BUG ID (BUG-001, BUG-002...)
- 执行前置条件验证（见 Prerequisites Validation 章节）
- 检查当前是否已在 feature 分支上
- 确认 git 状态是否干净

### 2. 按工作流指导执行
根据 bug-fix-orchestrator 工作流指导文档（type: workflow-guide），主代理按以下标准流程操作:

#### 2.1 创建Git分支
```bash
git checkout -b "bugfix/${bugId}-${slug(description)}"
```

#### 2.2 初始化BUG目录
```bash
mkdir -p ".claude/docs/bugs/${bugId}"/{tasks}
```

#### 2.3 分析阶段 - 调用研究型子代理
1. **Task: bug-analyzer "深度分析 BUG 根因和影响范围"**: 深度分析BUG症状和根本原因，生成 ANALYSIS.md
2. **Task: planner "基于分析结果生成修复计划"**: 基于分析结果，生成详细的修复计划 PLAN.md 和 tasks/TASK_*.md

#### 2.4 准备阶段 - 制定质量策略
3. **Task: qa-tester "基于分析和计划生成测试策略"**: 基于分析和计划生成测试策略 TEST_PLAN.md
4. **Task: security-reviewer "基于分析和计划生成安全评估"**: 基于分析和计划生成安全评估 SECURITY_PLAN.md

#### 2.5 实施阶段 - 主代理执行代码修复
- 根据详细的 PLAN.md 和 TASK 文档直接修复代码
- 遵循现有项目模式和约定
- 实施所有 TASK 的修复要求
- 优先保证向后兼容性和最小化变更

#### 2.6 验证阶段 - 质量检查和报告
5. **Task: qa-tester "分析修复的代码并生成测试报告"**: 分析修复的代码，生成 TEST_REPORT.md
6. **Task: security-reviewer "分析修复的代码并生成安全报告"**: 分析修复的代码，生成 SECURITY_REPORT.md
7. **Task: release-manager "基于质量报告生成发布计划"**: 基于质量报告，生成 RELEASE_PLAN.md

#### 2.7 发布阶段 - 主代理执行发布
- 根据质量报告修复发现的问题
- 创建PR并处理合并流程（通常使用快速发布）

### 3. 进度展示
实时显示流程进度:
- ✅ Git 分支创建: bugfix/BUG-001-用户登录错误
- ✅ bug-analyzer 完成: ANALYSIS.md 已生成
- ✅ planner 完成: PLAN.md 和 tasks/ 已生成
- ✅ qa-tester 完成: TEST_PLAN.md 已生成
- ✅ security-reviewer 完成: SECURITY_PLAN.md 已生成
- 🔄 主代理执行代码修复中...
- 🔄 qa-tester 分析代码，生成 TEST_REPORT.md 中...
- 🔄 security-reviewer 分析代码，生成 SECURITY_REPORT.md 中...
- ⏳ 主代理执行质量修复和发布流程...

### 4. 质量闸控制
在关键节点要求用户确认:
- 提交代码前确认
- 创建 PR 前确认
- 合并代码前确认

## 输出产物

### 文档结构
```text
.claude/docs/bugs/${bugId}/
├── ANALYSIS.md          # BUG分析报告 (bug-analyzer 输出)
├── PLAN.md              # 修复计划 (planner 输出)
├── tasks/               # 修复任务分解 (planner 输出)
│   ├── TASK_001.md
│   ├── TASK_002.md
│   └── ...
├── TEST_PLAN.md         # 测试计划 (qa-tester 修复前输出)
├── SECURITY_PLAN.md     # 安全计划 (security-reviewer 修复前输出)
├── TEST_REPORT.md       # 测试报告 (qa-tester 修复后输出)
├── SECURITY_REPORT.md   # 安全报告 (security-reviewer 修复后输出)
├── RELEASE_PLAN.md      # 发布计划 (release-manager 输出)
├── orchestration_status.json  # 工作流状态跟踪（标准化状态文件）
└── LOG.md              # 执行日志 (主代理维护)
```

### Git 分支
- 分支命名: `bugfix/${bugId}-${slug(description)}`
- 提交格式: `fix(${bugId}): ${taskTitle} - ${summary}`

### PR 创建
自动生成包含以下信息的 PR:
- 标题: `${bugId} 修复${description}`
- 描述: 链接到 ANALYSIS、PLAN、Tasks、Test Reports
- 标签: bug, hotfix (根据严重程度)

## 错误处理

### 常见错误场景
1. **BUG描述不清晰**
   - 提示提供更具体的错误现象
   - 要求包含重现步骤

2. **BUG无法复现**
   - 要求提供更详细的环境信息
   - 建议先调研后再修复

3. **修复引入新问题**
   - 自动回滚有问题的修复
   - 重新分析和规划

4. **质量闸失败**
   - 详细显示失败原因
   - 提供修复建议
   - 阻止发布直到问题解决

5. **权限问题**
   - 检查 git/gh 权限
   - 提供手动操作指引

## 配置选项

### 环境变量
- `DEFAULT_BASE_BRANCH`: 默认基础分支 (默认: main)
- `BUG_AUTO_APPROVE`: 自动通过所有确认 (默认: false)
- `BUG_SEVERITY_AUTO`: 自动判断BUG严重程度 (默认: true)

### 设置文件
在 `.claude/settings.json` 中可配置:
```json
{
  "bugfix": {
    "baseBranch": "main",
    "autoApprove": false,
    "defaultSeverity": "medium",
    "fastTrack": false
  }
}
```

## BUG严重程度分类

### Critical (紧急)
- 系统宕机、数据丢失、安全漏洞
- 立即修复，可能需要热修复部署

### High (高)
- 主要功能损坏，显著用户影响
- 下一个sprint修复，可能需要临时解决方案

### Medium (中)
- 次要功能问题，有限用户影响
- 计划修复，可等待常规发布

### Low (低)
- 美观问题、边缘情况
- 未来增强，低优先级

## 依赖检查

### 必需依赖
- Git 仓库已初始化
- 具有提交权限
- 项目根目录包含必要配置

### 可选依赖
- GitHub CLI (gh) - 用于自动 PR 创建
- 错误监控工具 - 用于BUG追踪
- 测试框架 - 用于回归测试

## 故障排除

### 调试信息
设置环境变量启用详细日志:
```bash
export BUG_DEBUG=1
/flow-fix "测试BUG"
```

### 日志位置
- 执行日志: `.claude/docs/bugs/${bugId}/LOG.md`
- 错误日志: `.claude/logs/bugfix-${bugId}.log`
- 调试信息: 控制台输出

### 恢复机制
如果流程中断，可以从特定步骤继续:
```text
/flow:continue "BUG-001" --from=analysis
/flow:continue "BUG-001" --from=fixing
```

## 最佳实践

### 命令使用
1. 确保当前在 main 分支且状态干净
2. 提供准确的BUG现象描述
3. 包含重现步骤和环境信息
4. 在关键节点仔细检查输出

### BUG报告准备
1. 描述要具体明确
2. 包含错误消息和堆栈跟踪
3. 提供重现步骤
4. 说明预期行为和实际行为

### 质量控制
1. 不跳过质量闸检查
2. 确保修复不引入新问题
3. 验证回归测试通过
4. 检查安全扫描结果

---

**注意**: 这是一个存储的提示命令，执行时会调用 bug-fix-orchestrator 指导来完成整个流程。确保已正确配置所有必需的子代理和权限。
