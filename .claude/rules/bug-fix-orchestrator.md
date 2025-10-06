---
name: bug-fix-orchestrator-guide
description: Standard Operating Procedure for main agent when executing /flow-fix command. Not an executable agent, but workflow guidance.
type: workflow-guide
---

# BUG修复流程标准作业程序

当用户执行 `/flow-fix "BUG描述"` 时，主 Agent (Claude 本身) 应按以下标准流程操作：

## 核心原则 (遵循 Claude Code 最佳实践)

### 主 Agent 职责
- **完整上下文管理**: 主 Agent 拥有项目全貌，负责所有代码修复
- **Sub-agent 协调**: 调用研究型 sub-agents 收集专业信息和制定计划
- **最终实施**: 基于所有研究报告和计划，主 Agent 直接执行代码修复

### Sub-agent 定位
- **研究员角色**: 仅提供研究报告、分析文档、修复计划
- **无代码执行**: 不直接修改项目文件，只输出 Markdown 文档
- **专业分工**: 各自在专业领域提供深度分析和建议

### 工作流原则
1. **快速响应**: BUG修复优先级高于新功能开发
2. **谨慎操作**: 避免引入新问题和破坏性变更
3. **充分测试**: 重点验证BUG修复和回归测试
4. **安全第一**: 确保修复不引入安全风险

## Rules Integration
遵循与flow-orchestrator相同的规则集成，但适配BUG修复场景

## 标准作业流程

### 阶段1: BUG分析和规划
1. **BUG技术分析**
   ```bash
   Task: bug-analyzer "Analyze BUG symptoms and investigate root cause for ${bugId}: ${description}"
   ```

   - bug-analyzer 深入分析BUG症状和根本原因
   - bug-analyzer 输出: `ANALYSIS.md`
   - 主 Agent 审查分析结果

2. **修复规划**
   ```bash
   Task: planner "Based on BUG analysis, create detailed fix plan for ${bugId}"
   ```

   - planner 基于 ANALYSIS.md 生成详细的修复计划
   - planner 输出: `PLAN.md` 和 `tasks/TASK_*.md`
   - 主 Agent 审查修复计划的可行性

### 阶段2: 修复准备
3. **测试计划**（代码修复前）
   ```bash
   Task: qa-tester "Create comprehensive test plan for BUG fix ${bugId} based on analysis and plan"
   ```

   - qa-tester 输出: `TEST_PLAN.md`
   - 包含: 回归测试策略、BUG复现测试、验证测试
   - **触发词**: 包含 "test plan" 的提示词

4. **安全评估计划**（代码修复前）
   ```bash
   Task: security-reviewer "Create comprehensive security plan for BUG fix ${bugId} based on analysis"
   ```

   - security-reviewer 输出: `SECURITY_PLAN.md`
   - 包含: 安全风险评估、修复安全检查、防护措施
   - **触发词**: 包含 "security plan" 的提示词

### 阶段3: 主 Agent 代码修复
5. **代码修复**
   - 主 Agent 基于详细的 PLAN.md 和 TASK 文档直接修复代码
   - 遵循现有项目模式和约定
   - 实施所有 TASK 的修复要求
   - 优先保证向后兼容性

### 阶段4: 质量验证（代码修复后）
6. **测试执行和报告**
   ```bash
   Task: qa-tester "Analyze BUG fix implementation and generate comprehensive test report for ${bugId}"
   ```

   - 主 Agent 基于 TEST_PLAN.md 编写和执行测试
   - qa-tester 分析测试结果，输出: `TEST_REPORT.md`
   - 包含: BUG验证结果、回归测试结果、质量评估
   - **触发词**: 包含 "test report" 的提示词

7. **安全检查和报告**
   ```bash
   Task: security-reviewer "Analyze BUG fix implementation and generate comprehensive security report for ${bugId}"
   ```

   - security-reviewer 分析修复代码，输出: `SECURITY_REPORT.md`
   - 包含: 安全回归扫描、风险评估、修复验证
   - **触发词**: 包含 "security report" 的提示词

8. **发布准备**
   ```bash
   Task: release-manager "Create release plan for BUG fix ${bugId} based on quality reports"
   ```

   - release-manager 输出: `RELEASE_PLAN.md`
   - 包含: 热修复发布流程、回滚计划、部署策略

### 阶段5: 发布执行
9. **质量闸检查**
   - 主 Agent 确保所有质量要求满足
   - 修复 TEST_REPORT.md 和 SECURITY_REPORT.md 中发现的问题
   - 验证BUG确实已修复且无回归

10. **发布和合并**
   - 主 Agent 基于 RELEASE_PLAN.md 创建 PR
   - 执行最终质量闸检查
   - 处理代码合并流程（通常使用快速发布流程）

### 阶段6: 总结和归档
11. **文档更新**
    - 更新相关文档和说明
    - 记录修复过程和决策
    - 更新 BUG 跟踪状态

12. **执行日志**
    - 在 LOG.md 中记录完整修复过程
    - 包含时间线、决策点、问题解决

## 文档结构

```text
devflow/bugs/${bugId}/
├── ANALYSIS.md           # BUG分析报告
├── PLAN.md               # 修复计划
├── tasks/                # 修复任务分解
│   ├── TASK_001.md
│   ├── TASK_002.md
│   └── ...
├── TEST_PLAN.md          # 测试计划
├── TEST_REPORT.md        # 测试报告
├── SECURITY_PLAN.md      # 安全计划
├── SECURITY_REPORT.md    # 安全报告
├── RELEASE_PLAN.md       # 发布计划
├── status.json           # BUG状态跟踪
└── LOG.md               # 执行日志
```

## 分支策略

- **分支命名**: `bugfix/${bugId}-${kebab-case-描述}`
- **合并策略**:
  - 紧急BUG: 直接合并到 main 分支
  - 一般BUG: squash merge 到 main 分支
- **分支清理**: 合并后自动删除

## BUG修复特殊考虑

### 优先级管理
- Critical: 立即修复，可能需要热修复
- High: 下一个sprint修复
- Medium: 计划修复
- Low: 后续版本修复

### 回归预防
- 必须包含回归测试
- 修复范围最小化
- 充分的代码审查

### 紧急发布流程
- 跳过部分质量闸（但不跳过安全检查）
- 快速发布到生产环境
- 后续补充完整测试

## Agent Coordination Protocol

### BUG Status Management
```json
// devflow/bugs/${bugId}/status.json
{
  "bugId": "${bugId}",
  "description": "${description}",
  "severity": "high",
  "status": "fixing",
  "progress": 60,
  "currentPhase": "implementation",
  "startTime": "2024-01-15T10:30:00Z",
  "phaseStatus": {
    "analysis": "completed",
    "planning": "completed",
    "implementation": "in_progress",
    "testing": "pending",
    "security": "pending",
    "release": "pending"
  },
  "fixFiles": ["src/auth/login.js", "src/api/user.js"],
  "testStatus": {
    "bugReproduced": true,
    "fixVerified": false,
    "regressionPassed": false
  }
}
```

### 错误处理
- 如果BUG无法复现，暂停并要求更多信息
- 如果修复引入新问题，回滚并重新分析
- 如果质量闸失败，阻止发布

## Key Implementation Notes

**REMEMBER**: 这是主 Agent 的工作流指南。主 Agent 应调用研究型 sub-agents 进行分析和规划，然后直接执行所有实际的代码修复、测试和git操作，基于从sub-agents收到的计划。

BUG修复比新功能开发更注重：
- 快速响应和修复
- 最小化变更范围
- 充分的回归测试
- 安全性验证
- 快速发布流程
