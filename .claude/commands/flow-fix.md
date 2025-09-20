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

## 执行流程

### 1. 参数解析和验证
- 解析命令参数: BUG描述
- 生成唯一BUG ID (BUG-001, BUG-002...)
- 检查当前是否已在 feature 分支上
- 确认 git 状态是否干净

### 2. 按工作流指导执行
根据 bug-fix-orchestrator 工作流指导文档，主代理按以下标准流程操作:

#### 2.1 创建Git分支
```bash
git checkout -b "bugfix/${bugId}-${slug(description)}"
```

#### 2.2 初始化BUG目录
```bash
mkdir -p ".claude/docs/bugs/${bugId}"/{tasks}
```

#### 2.3 分析阶段 - 调用研究型子代理
1. **bug-analyzer**: 深度分析BUG症状和根本原因，生成 ANALYSIS.md
2. **planner**: 基于分析结果，生成详细的修复计划 PLAN.md 和 tasks/TASK_*.md

#### 2.4 准备阶段 - 制定质量策略
3. **qa-tester**: 基于分析和计划生成测试策略 TEST_PLAN.md
4. **security-reviewer**: 基于分析和计划生成安全评估 SECURITY_PLAN.md

#### 2.5 实施阶段 - 主代理执行代码修复
- 根据详细的 PLAN.md 和 TASK 文档直接修复代码
- 遵循现有项目模式和约定
- 实施所有 TASK 的修复要求
- 优先保证向后兼容性和最小化变更

#### 2.6 验证阶段 - 质量检查和报告
5. **qa-tester**: 分析修复的代码，生成 TEST_REPORT.md
6. **security-reviewer**: 分析修复的代码，生成 SECURITY_REPORT.md
7. **release-manager**: 基于质量报告，生成 RELEASE_PLAN.md

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
├── status.json          # BUG状态跟踪
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
