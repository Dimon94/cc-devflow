---
name: flow-new
description: 'One-shot requirement flow. Usage: /flow-new "REQ-123|支持用户下单|https://plan.example.com/Q1"'
templates:
  orchestration: .claude/docs/templates/NEW_ORCHESTRATION_TEMPLATE.md
guides:
  troubleshoot: .claude/docs/guides/NEW_TROUBLESHOOTING.md
---

<!-- ============================================================
     头文件引用语法规范 (Header File Reference Syntax)
     ============================================================

命令头文件格式:
```yaml
templates:
  orchestration: .claude/docs/templates/NEW_ORCHESTRATION_TEMPLATE.md
guides:
  troubleshoot: .claude/docs/guides/NEW_TROUBLESHOOTING.md
```

引用语法:
- {TEMPLATE:orchestration} → 加载 .claude/docs/templates/NEW_ORCHESTRATION_TEMPLATE.md
- {GUIDE:troubleshoot}     → 参考 .claude/docs/guides/NEW_TROUBLESHOOTING.md

使用案例:
```markdown
# 正文中遇到:
→ 详见 {TEMPLATE:orchestration} Stage 4
# 解释为:
→ 打开并阅读 .claude/docs/templates/NEW_ORCHESTRATION_TEMPLATE.md 中的 Stage 4 章节

# 正文中遇到:
→ 常见错误参见 {GUIDE:troubleshoot} Error 3
# 解释为:
→ 打开并阅读 .claude/docs/guides/NEW_TROUBLESHOOTING.md 中的 Error 3 章节
```

规则: 遇到 {TYPE:key} 占位符时，去头文件 YAML 中找对应类型的 key，获取文件路径并加载。
============================================================ -->

# Flow-New - 一键需求开发流

## User Input
```text
$ARGUMENTS = "REQ_ID|TITLE|PLAN_URLS?"
```

**格式**:
- REQ_ID: 需求编号 (例如: REQ-123)
- TITLE: 需求标题
- PLAN_URLS: 计划文档URL，多个用逗号分隔 (可选)

**示例**:
```
/flow-new "REQ-123|支持用户下单|https://plan.example.com/Q1"
/flow-new "REQ-124|用户权限管理"
```

---

## 执行前加载

**详细编排流程**:
→ 参见 `{TEMPLATE:orchestration}` 获取完整编排逻辑

**故障排查**:
→ 遇到问题参考 `{GUIDE:troubleshoot}`

---

## 架构说明

**设计理念**: flow-new 是**编排器**（Orchestrator），串行调用 7-8 个阶段化命令

**调用链**:
```
/flow-new "REQ-123|Title|URLs"
  ↓
[1/8] /flow-init "REQ-123|Title|URLs"
  ↓
[2/8] /flow-prd "REQ-123"
  ↓
[2.3/8] /flow-checklist "REQ-123" (可选, 80%门禁)
  ↓
[2.5/8] /flow-ui "REQ-123" (条件触发)
  ↓
[2.7/8] /flow-tech "REQ-123" (必需)
  ↓
[3/8] /flow-epic "REQ-123"
  ↓
[4/8] /flow-dev "REQ-123"
  ↓
[5/8] /flow-qa "REQ-123" --full
  ↓
[6/8] /flow-release "REQ-123"
```

---

## 执行流程骨架

### [1/8] 初始化 → /flow-init

```
调用: /flow-init "${REQ_ID}|${TITLE}|${PLAN_URLS}"

检查: orchestration_status.json.status === "initialized"

→ 详见 {TEMPLATE:orchestration} Stage 1
```

**输出**:
- Git分支: `feature/${REQ_ID}-${slug(title)}`
- 需求目录已创建
- 研究材料已抓取

---

### [2/8] PRD生成 → /flow-prd

```
调用: /flow-prd "${REQ_ID}"

检查: PRD.md 存在且完整

→ 详见 {TEMPLATE:orchestration} Stage 2
```

**输出**:
- PRD.md (用户故事 + GWT验收标准)
- Constitution检查通过

---

### [2.3/8] 需求质量检查 → /flow-checklist (可选)

```
触发条件: quality-rules.yml 中 checklist_gate_enabled: true

调用: /flow-checklist "${REQ_ID}"

闸门: 完成度 ≥ 80%

→ 详见 {TEMPLATE:orchestration} Stage 2.3
```

---

### [2.5/8] UI原型生成 → /flow-ui (条件触发)

```
触发条件 (任一满足):
  - PRD包含UI关键词 ("页面"/"表单"/"按钮" etc.)
  - 项目包含 package.json 或 src/components/
  - 用户显式请求

调用: /flow-ui "${REQ_ID}"

→ 详见 {TEMPLATE:orchestration} Stage 2.5 (包含 UI Detection Logic)
```

**输出** (如有UI需求):
- UI_PROTOTYPE.html (响应式单文件原型)
- research/ui_design_strategy.md

**跳过** (无UI需求):
- orchestration_status.json.ui_skipped = true

---

### [2.7/8] 技术方案设计 → /flow-tech (必需)

```
调用: /flow-tech "${REQ_ID}"

检查: TECH_DESIGN.md 完整 (所有 Section 1-7)

→ 详见 {TEMPLATE:orchestration} Stage 2.7
```

**输出**:
- TECH_DESIGN.md (完整技术方案)
- data-model.md (数据模型)
- contracts/openapi.yaml (API契约)
- quickstart.md (快速开始)

---

### [3/8] Epic规划 → /flow-epic

```
调用: /flow-epic "${REQ_ID}"

检查:
  - EPIC.md + TASKS.md 存在
  - TASKS 覆盖 TECH_DESIGN.md 所有技术层

→ 详见 {TEMPLATE:orchestration} Stage 3
```

**输出**:
- EPIC.md (Epic描述)
- TASKS.md (单文件管理所有任务)

---

### [4/8] 开发执行 → /flow-dev

```
调用: /flow-dev "${REQ_ID}"

执行模式: TDD (Tests First)
  Phase 1: 分析现有代码
  Phase 2: 编写测试 (Tests First)
  TEST VERIFICATION CHECKPOINT (测试必须先失败)
  Phase 3: 实现代码
  Phase 4: 测试验证 (测试必须通过)
  Phase 5: Git提交并标记完成

→ 详见 {TEMPLATE:orchestration} Stage 4
```

**输出**:
- 实现代码
- 测试代码
- tasks/*.completed 标记
- Git commits (每个任务一个)

---

### [5/8] 质量保证 → /flow-qa

```
调用: /flow-qa "${REQ_ID}" --full

Exit Gate检查:
  - ✅ 所有测试通过
  - ✅ 代码覆盖率 ≥ 80%
  - ✅ 无高危安全问题
  - ✅ TypeScript类型检查通过

→ 详见 {TEMPLATE:orchestration} Stage 5
```

**输出**:
- TEST_PLAN.md
- TEST_REPORT.md
- SECURITY_PLAN.md
- SECURITY_REPORT.md

---

### [6/8] 发布管理 → /flow-release

```
调用: /flow-release "${REQ_ID}"

执行:
  - 生成发布计划
  - 更新 CLAUDE.md (如有重要架构变更)
  - 最终构建
  - 创建 GitHub Pull Request

→ 详见 {TEMPLATE:orchestration} Stage 6
```

**输出**:
- RELEASE_PLAN.md
- CLAUDE.md (更新技术架构，如有)
- GitHub Pull Request

---

## 进度展示

**实时进度** (详见 `{TEMPLATE:orchestration}` Progress Display Format):

```
🎯 CC-DevFlow 完整需求开发流程
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

需求: REQ-123 | 支持用户下单

[1/8] ✅ 初始化完成
[2/8] ✅ PRD生成完成
[2.5/8] ✅ UI原型生成完成 ⚡️
[2.7/8] ✅ 技术方案设计完成 🔧
[3/8] ✅ Epic规划完成
[4/8] 🔄 开发执行中... (8/18 已完成)
[5/8] ⏳ 等待质量保证...
[6/8] ⏳ 等待发布管理...
```

---

## 输出产物

**完整目录结构** (详见 `{TEMPLATE:orchestration}` Output Structure):

```
devflow/requirements/${REQ_ID}/
├── research/ (初始化时生成)
├── PRD.md
├── UI_PROTOTYPE.html (条件)
├── TECH_DESIGN.md
├── data-model.md
├── contracts/openapi.yaml
├── quickstart.md
├── EPIC.md
├── TASKS.md
├── tasks/*.completed
├── TEST_PLAN.md + TEST_REPORT.md
├── SECURITY_PLAN.md + SECURITY_REPORT.md
└── RELEASE_PLAN.md
```

---

## 中断与恢复

```bash
# 查看当前状态
/flow-status REQ-123

# 从中断点恢复
/flow-restart "REQ-123"

# 或手动执行特定阶段
/flow-tech "REQ-123"
/flow-epic "REQ-123"
/flow-dev "REQ-123" --resume
```

---

## 错误处理

**常见错误**:
→ 详见 `{GUIDE:troubleshoot}`

**主要错误场景**:
1. Stage command not found → 检查命令文件
2. Status file corrupted → 重建或修复
3. 中途中断无法恢复 → 使用 /flow-restart
4. UI detection false positive → 在PRD明确标注
5. Epic 未覆盖所有技术层 → 重新生成或手动补充
6. QA gate failure → 补充测试/修复安全问题
7. Build failure → 修复类型错误
8. PR creation failed → 认证 gh CLI 或手动创建

**恢复步骤**:
→ 详见 `{GUIDE:troubleshoot}` Recovery Procedures

---

## 使用建议

### ✅ 适合使用 flow-new

- 简单明确的需求
- 演示和学习工作流程
- 快速原型开发
- 熟悉的需求类型

### ❌ 建议使用阶段化命令

- 复杂需求，需要每个阶段审查
- 需要在PRD阶段与需求方确认
- 需要在Epic阶段调整任务分解
- 开发过程中可能需要暂停调整

---

## Next Step

```
# 查看PR状态
cat devflow/requirements/${REQ_ID}/RELEASE_PLAN.md | grep "PR URL"

# 审查PR
gh pr view <PR_NUMBER>

# 合并PR
gh pr merge <PR_NUMBER>
```

---

**Related Documentation**:
- [NEW_ORCHESTRATION_TEMPLATE.md](../.claude/docs/templates/NEW_ORCHESTRATION_TEMPLATE.md) - 详细编排流程
- [NEW_TROUBLESHOOTING.md](../.claude/docs/guides/NEW_TROUBLESHOOTING.md) - 故障排查指南
- [flow-init.md](./flow-init.md) - 初始化阶段
- [flow-dev.md](./flow-dev.md) - 开发阶段
