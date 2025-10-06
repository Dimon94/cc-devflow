---
name: flow-new
description: One-shot requirement flow. Usage: /flow-new "REQ-123|支持用户下单|https://plan.example.com/Q1"
---

# Flow-New - 一键需求开发流

## 命令格式
```text
/flow-new "REQ_ID|TITLE|PLAN_URLS"
```

### 参数说明
- **REQ_ID**: 需求编号 (例如: REQ-123)
- **TITLE**: 需求标题 (例如: 支持用户下单)
- **PLAN_URLS**: 计划文档URL，多个用逗号分隔 (可选)

### 示例
```text
/flow-new "REQ-123|支持用户下单|https://plan.example.com/Q1"
/flow-new "REQ-124|用户权限管理|https://docs.company.com/auth-spec.md,https://confluence.company.com/security-requirements"
/flow-new "REQ-125|数据导出功能"
```

## 架构说明

**重要**: /flow-new 已重构为便捷包装器，实际执行通过调用6个阶段化命令完成。

### 设计理念
- **简化入口**: 为新用户提供一键完整流程体验
- **标准化执行**: 底层调用标准阶段化命令，确保流程一致性
- **透明化**: 清晰显示每个阶段的执行状态
- **可恢复**: 任何阶段失败都可通过对应的阶段命令恢复

### 与阶段化命令的关系
```text
/flow-new
  ├─> /flow-init    (阶段1: 初始化)
  ├─> /flow-prd     (阶段2: PRD生成)
  ├─> /flow-epic    (阶段3: Epic规划)
  ├─> /flow-dev     (阶段4: 开发执行)
  ├─> /flow-qa      (阶段5: 质量保证)
  └─> /flow-release (阶段6: 发布管理)
```

## 执行流程

### 阶段 1: 初始化 (/flow-init)
```text
1. 解析输入参数: REQ_ID|TITLE|PLAN_URLS
2. 调用 /flow-init "REQ_ID|TITLE|PLAN_URLS"
   → 创建需求目录结构
   → 创建Git功能分支
   → 初始化状态文件
   → 抓取研究材料 (如果提供PLAN_URLS)

输出:
  ✅ Git分支: feature/REQ-123-支持用户下单
  ✅ 需求目录: devflow/requirements/REQ-123/
  ✅ 状态文件: orchestration_status.json (status: initialized)
  ✅ 研究材料: research/*.md (如果有)

错误处理:
  - 如果REQ_ID已存在 → 提示用户并终止
  - 如果Git状态不干净 → 提示清理工作区
  - 如果PLAN_URLS抓取失败 → 警告但继续
```

### 阶段 2: PRD生成 (/flow-prd)
```text
3. 调用 /flow-prd "REQ_ID"
   → prd-writer 研究型代理分析需求
   → 生成结构化PRD文档
   → 执行Constitution检查
   → 验证文档完整性

输出:
  ✅ PRD.md (100+ 行完整需求文档)
     - 背景与目标
     - 用户故事 + Given-When-Then验收标准
     - 非功能性要求
     - Constitution检查结果
  ✅ 状态更新: prd_complete

错误处理:
  - 如果Constitution检查失败 → 显示违规项，询问是否继续
  - 如果PRD不完整 → 终止并提示手动修正
```

### 阶段 3: Epic规划 (/flow-epic)
```text
4. 调用 /flow-epic "REQ_ID"
   → planner 研究型代理分析PRD
   → 分解Epic和原子级任务
   → 定义依赖关系和DoD
   → 标记逻辑独立任务 [P]

输出:
  ✅ EPIC.md (Epic描述和技术方案)
  ✅ TASKS.md (单文件管理所有任务)
     - 每个任务: ID、描述、类型、优先级、依赖、DoD
     - [P] 标记逻辑独立任务
  ✅ 状态更新: epic_complete

错误处理:
  - 如果任务依赖有循环 → 终止并提示修正
  - 如果任务粒度过大 → 警告但继续
```

### 阶段 4: 开发执行 (/flow-dev)
```text
5. 调用 /flow-dev "REQ_ID"
   → 串行执行TASKS.md中的所有任务
   → 对每个任务:
     • dev-implementer代理生成实现计划
     • 主代理执行TDD开发 (测试优先)
     • 测试验证 (TEST VERIFICATION CHECKPOINT)
     • Git提交并标记完成

执行模式:
  Phase 1: 分析现有代码
  Phase 2: 编写测试 (Tests First)
  TEST VERIFICATION CHECKPOINT (测试必须先失败)
  Phase 3: 实现代码
  Phase 4: 测试验证 (测试必须通过)
  Phase 5: Git提交并标记完成

输出:
  ✅ 实现代码 (新文件或修改现有文件)
  ✅ 测试代码 (*.test.ts 或 *.spec.ts)
  ✅ tasks/TASK_*.completed 标记文件
  ✅ tasks/IMPLEMENTATION_PLAN.md (实现计划)
  ✅ Git commits (每个任务一个)
  ✅ 状态更新: dev_complete

错误处理:
  - 如果测试直接通过 → 错误，测试无效
  - 如果实现后测试失败 → 终止，提示修复
  - 如果类型检查失败 → 终止，提示修复
  - 任何阶段失败 → 保存状态，可通过 /flow-dev --resume 恢复
```

### 阶段 5: 质量保证 (/flow-qa)
```text
6. 调用 /flow-qa "REQ_ID" --full
   → qa-tester代理分析测试覆盖
   → 运行完整测试套件
   → 检查代码覆盖率 (≥80%)
   → security-reviewer代理执行安全审查
   → 生成测试和安全报告

输出:
  ✅ TEST_PLAN.md (测试策略和覆盖分析)
  ✅ TEST_REPORT.md (测试结果报告)
  ✅ SECURITY_PLAN.md (安全审查计划)
  ✅ SECURITY_REPORT.md (安全扫描报告)
  ✅ 状态更新: qa_complete

Exit Gate检查:
  - ✅ 所有测试通过
  - ✅ 代码覆盖率 ≥ 80%
  - ✅ 无高危安全问题
  - ✅ TypeScript类型检查通过

错误处理:
  - 如果测试失败 → 显示失败详情，终止
  - 如果覆盖率不足 → 显示未覆盖代码，终止
  - 如果发现高危安全问题 → 显示详情，终止
  - 所有问题修复后 → 重新运行 /flow-qa
```

### 阶段 6: 发布管理 (/flow-release)
```text
7. 调用 /flow-release "REQ_ID"
   → release-manager代理生成发布计划
   → 执行最终构建
   → 创建GitHub Pull Request
   → 记录PR URL

输出:
  ✅ RELEASE_PLAN.md (发布计划和回滚策略)
  ✅ GitHub Pull Request (包含完整描述)
     - 需求摘要 (来自PRD)
     - 变更清单 (来自Git commits)
     - 测试结果 (来自TEST_REPORT)
     - 安全扫描 (来自SECURITY_REPORT)
     - 检查清单
  ✅ 状态更新: release_complete

错误处理:
  - 如果构建失败 → 显示构建错误，终止
  - 如果PR创建失败 → 显示GitHub错误，提供手动创建指引
```

### 进度展示
实时显示每个阶段的执行状态:
```text
🎯 CC-DevFlow 完整需求开发流程
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

需求: REQ-123 | 支持用户下单

[1/6] ✅ 初始化完成
      → Git分支: feature/REQ-123-支持用户下单
      → 需求目录已创建
      → 研究材料已抓取: 2 个文件

[2/6] ✅ PRD生成完成
      → PRD.md: 145 行
      → 用户故事: 5 个
      → Constitution检查: 通过

[3/6] ✅ Epic规划完成
      → EPIC.md 已生成
      → TASKS.md: 8 个任务
      → 逻辑独立任务: 3 个 [P]

[4/6] 🔄 开发执行中...
      → 任务进度: 3/8 已完成
      → 当前任务: TASK_004 - 实现订单创建API
      → Phase 2: 编写测试中...

[5/6] ⏳ 等待质量保证...

[6/6] ⏳ 等待发布管理...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 中断与恢复
任何阶段失败或中断:
```bash
# 查看当前状态
/flow-status REQ-123

# 从中断点恢复
/flow-restart "REQ-123"

# 或手动执行特定阶段
/flow-dev "REQ-123" --resume
/flow-qa "REQ-123"
/flow-release "REQ-123"
```

## 输出产物

### 文档结构
```text
devflow/requirements/${reqId}/
├── research/                    # 研究资料 (MCP抓取或手动添加)
│   ├── ${reqId}_1.md
│   └── ${reqId}_2.md
├── orchestration_status.json   # 状态管理文件 (阶段、进度、时间戳)
├── EXECUTION_LOG.md            # 执行日志 (所有操作的时间序列记录)
│
├── PRD.md                      # 产品需求文档 (/flow-prd 输出)
│                               # - 用户故事 + 验收标准
│                               # - 非功能需求
│                               # - Constitution检查结果
│
├── EPIC.md                     # Epic规划文档 (/flow-epic 输出)
│                               # - Epic描述和目标
│                               # - 技术方案概览
│
├── TASKS.md                    # 任务分解文档 (/flow-epic 输出)
│                               # - 所有任务列表 (单文件管理)
│                               # - 依赖关系和优先级
│                               # - 每个任务的详细DoD
│                               # - [P] 标记逻辑独立任务
│
├── tasks/                      # 任务执行产物 (/flow-dev 输出)
│   ├── TASK_001.completed      # 空文件，表示任务完成
│   ├── TASK_002.completed
│   └── IMPLEMENTATION_PLAN.md  # dev-implementer输出的实现计划
│
├── TEST_PLAN.md                # 测试计划 (/flow-qa 输出，qa-tester代理)
├── TEST_REPORT.md              # 测试报告 (/flow-qa 输出，实际测试结果)
│
├── SECURITY_PLAN.md            # 安全计划 (/flow-qa 输出，security-reviewer代理)
├── SECURITY_REPORT.md          # 安全报告 (/flow-qa 输出，实际扫描结果)
│
└── RELEASE_PLAN.md             # 发布计划 (/flow-release 输出，release-manager代理)
                                # - PR描述模板
                                # - 发布检查清单
                                # - 回滚计划
```

**关键变化**:
- **orchestration_status.json**: 替代分散的状态文件，统一管理阶段和进度
- **TASKS.md**: 单文件管理所有任务，替代多个 TASK_*.md
- **tasks/*.completed**: 简单的完成标记，避免复杂的任务状态管理
- **IMPLEMENTATION_PLAN.md**: dev-implementer代理为当前任务生成的详细技术方案

### Git 分支
- 分支命名: `feature/${reqId}-${slug(title)}`
- 提交格式: `feat(${reqId}): ${taskTitle} - ${summary}`

### PR 创建
自动生成包含以下信息的 PR:
- 标题: `${reqId} ${title}`
- 描述: 链接到 PRD、Epic、Tasks、Test Reports
- 标签: 根据需求类型自动添加

## 实现说明

### 实际执行逻辑
当用户调用 `/flow-new "REQ-123|标题|URL"` 时，主代理 (Claude) 执行以下操作:

```text
1. 解析参数: REQ_ID, TITLE, PLAN_URLS
2. 依次调用阶段化命令:

   /flow-init "REQ-123|标题|URL"
   → 等待完成，检查状态

   /flow-prd "REQ-123"
   → 等待完成，检查状态

   /flow-epic "REQ-123"
   → 等待完成，检查状态

   /flow-dev "REQ-123"
   → 等待完成，检查状态

   /flow-qa "REQ-123" --full
   → 等待完成，检查状态

   /flow-release "REQ-123"
   → 等待完成，显示PR链接

3. 每个阶段完成后:
   - 检查 orchestration_status.json 状态
   - 如果失败，显示错误并终止
   - 如果成功，显示进度并继续下一阶段

4. 所有阶段完成后:
   - 显示完整的成功摘要
   - 提供PR链接和后续操作建议
```

### 错误处理策略
```text
如果任何阶段失败:
1. 立即终止后续阶段
2. 显示详细错误信息
3. 提示用户修复方法:
   - 手动修复问题
   - 使用对应的阶段命令重试
   - 或使用 /flow-restart 从失败点继续

示例:
  ❌ 阶段 4 失败: 开发执行
  错误: 测试验证失败 - TASK_003 的测试未通过

  修复建议:
  1. 检查测试失败原因: npm test
  2. 修复代码或测试
  3. 继续执行: /flow-dev "REQ-123" --resume
```

## 质量保证

### Constitution 检查贯穿全流程
- **阶段2 (PRD)**: 检查需求完整性，NO PARTIAL IMPLEMENTATION
- **阶段3 (Epic)**: 检查任务分解合理性
- **阶段4 (Dev)**: 检查代码质量，NO CODE DUPLICATION, NO HARDCODED SECRETS
- **阶段5 (QA)**: 检查测试覆盖率和安全性

### Exit Gate 强制检查
每个阶段的输出必须通过质量检查才能进入下一阶段:
- PRD必须完整且通过Constitution检查
- Epic和Tasks必须符合INVEST原则
- 开发必须通过TDD验证
- QA必须达到覆盖率和安全标准

### 不可跳过的检查点
- TEST VERIFICATION CHECKPOINT (测试必须先失败)
- Code Coverage Gate (覆盖率 ≥ 80%)
- Security Gate (无高危安全问题)
- Build Gate (构建必须成功)

## 使用建议

### 适合使用 /flow-new 的场景
✅ 简单明确的需求，不需要中间干预
✅ 演示和学习cc-devflow工作流程
✅ 快速原型开发
✅ 熟悉的需求类型和技术栈

### 建议使用阶段化命令的场景
✅ 复杂需求，需要每个阶段审查
✅ 需要在PRD阶段与需求方确认
✅ 需要在Epic阶段调整任务分解
✅ 开发过程中可能需要暂停和调整
✅ 有经验的开发者，希望更精细控制

### 最佳实践
1. **新用户**: 先用 `/flow-new` 体验完整流程
2. **有经验用户**: 使用阶段化命令，每阶段审查输出
3. **复杂项目**: 始终使用阶段化命令，保持灵活性
4. **关键需求**: 每个阶段都进行人工审查和确认

## 配置选项

### 环境变量
- `DEVFLOW_BASE_BRANCH`: 默认基础分支 (默认: main)
- `DEVFLOW_REQ_ID`: 显式指定需求ID，覆盖分支检测

### 设置文件
在 `.claude/settings.json` 中可配置:
```json
{
  "flow": {
    "baseBranch": "main",
    "requireManualApproval": true,
    "mcpServer": "docs-web"
  }
}
```

## 故障排查

### 问题1: 阶段命令未找到
**症状**: `ERROR: Command /flow-init not found`
**原因**: 阶段化命令文件缺失或未在settings.json中注册
**解决**: 检查 `.claude/commands/` 目录是否包含所有6个命令文件

### 问题2: 状态文件损坏
**症状**: `ERROR: Invalid orchestration_status.json`
**原因**: JSON格式错误或必需字段缺失
**解决**:
```bash
# 手动修复或重新初始化
/flow-init "REQ-123|标题" --force
```

### 问题3: 中途中断后无法恢复
**症状**: 再次运行报错或重复执行已完成的阶段
**解决**:
```bash
# 检查当前状态
/flow-status REQ-123

# 使用恢复命令
/flow-restart "REQ-123"

# 或手动从特定阶段继续
/flow-dev "REQ-123" --resume
```

### 调试信息
设置环境变量启用详细日志:
```bash
export FLOW_DEBUG=1
/flow-new "REQ-123|测试需求"
```

### 日志位置
- 执行日志: `devflow/requirements/${reqId}/LOG.md`
- 错误日志: `.claude/logs/flow-${reqId}.log`
- 调试信息: 控制台输出

### 恢复机制
如果流程中断，可以从特定步骤继续:
```text
/flow:continue "REQ-123" --from=prd
/flow:continue "REQ-123" --from=development
```

## 最佳实践

### 命令使用
1. 确保当前在 main 分支且状态干净
2. 提供准确的需求标题
3. 包含详细的计划文档 URL
4. 在关键节点仔细检查输出

### 需求准备
1. 需求 ID 使用统一格式
2. 计划文档结构化且可访问
3. 提前准备相关背景资料
4. 明确验收标准

### 质量控制
1. 不跳过质量闸检查
2. 仔细审查生成的文档
3. 确保测试覆盖率达标
4. 验证安全扫描结果

---

**注意**: 这是一个存储的提示命令，执行时会调用 flow-orchestrator 子代理来完成整个流程。确保已正确配置所有必需的子代理和权限。
