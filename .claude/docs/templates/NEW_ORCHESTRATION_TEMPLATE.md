# Flow-New Orchestration Template

> Execution flow for `/flow-new` one-shot requirement development

---

## Stage Execution Skeleton

### [1/8] /flow-init
- 创建需求目录 + Git 分支
- MCP 研究材料收集 (mandatory)
- Exit Gate: 5-level quality check (research.md 完整性)

### [2/8] /flow-prd
- 生成 PRD.md (用户故事 + GWT 验收标准)
- Constitution 符合性检查

### [2.3/8] /flow-checklist (可选, 80% 门禁)
- 触发条件: `quality-rules.yml` 中 `checklist_gate_enabled: true`
- 生成 checklists/*.md (5 维度质量验证)
- 闸门: 完成度 ≥ 80%

### [2.5/8] /flow-ui (条件触发)
**UI Detection Logic** (JavaScript):
```javascript
function detectUIRequirement(prdContent, projectRoot) {
  const uiKeywords = ['用户界面', '前端', 'Web页面', 'UI', '界面设计', '交互',
                      '页面', '表单', '按钮', '导航', '布局', '组件'];
  const hasUIKeywords = uiKeywords.some(kw => prdContent.includes(kw));
  const hasFrontendStack = fs.existsSync(`${projectRoot}/package.json`);
  const isBackendOnly = prdContent.includes('纯后端');
  return (hasUIKeywords || hasFrontendStack) && !isBackendOnly;
}
```
- 输出: UI_PROTOTYPE.html + research/ui_design_strategy.md
- 跳过: orchestration_status.json.ui_skipped = true

### [2.7/8] /flow-tech (必需)
- 生成 TECH_DESIGN.md (7 sections: 架构/技术栈/数据模型/API/安全/性能/部署)
- 输出: data-model.md + contracts/openapi.yaml + quickstart.md
- Exit Gate: 所有 Section 1-7 完整

### [3/8] /flow-epic
- Entry Gate: Checklist 完成度 ≥ 80% (如果启用)
- 生成 EPIC.md + TASKS.md
- 验证: TASKS 覆盖 TECH_DESIGN.md 所有技术层

### [4/8] /flow-dev
**TDD 执行模式**:
```
Phase 1: 分析现有代码
Phase 2: 编写测试 (Tests First)
  ↓
TEST VERIFICATION CHECKPOINT → 测试必须先失败
  ↓
Phase 3: 实现代码
Phase 4: 测试验证 → 测试必须通过
Phase 5: Git 提交并标记完成
```
- 输出: 实现代码 + 测试代码 + TASKS.md 更新 (checkbox 标记)

### [5/8] /flow-qa --full
**Exit Gate 检查**:
- ✅ 所有测试通过
- ✅ 代码覆盖率 ≥ 80%
- ✅ 无高危安全问题
- ✅ TypeScript 类型检查通过
- 输出: TEST_REPORT.md + SECURITY_REPORT.md

### [6/8] /flow-release
- 生成 RELEASE_PLAN.md
- 更新 CLAUDE.md (如有架构变更)
- 最终构建
- 创建 GitHub Pull Request

---

## Progress Display Format

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

**状态图标**:
- ✅ 已完成
- 🔄 执行中
- ⏳ 等待执行
- ⚡️ 条件触发已执行
- 🔧 必需步骤已完成

---

## Output Structure

```
devflow/requirements/${REQ_ID}/
├── research/                     # [1/8]
├── PRD.md                        # [2/8]
├── checklists/*.md               # [2.3/8] (可选)
├── UI_PROTOTYPE.html             # [2.5/8] (条件)
├── TECH_DESIGN.md                # [2.7/8]
├── data-model.md
├── contracts/openapi.yaml
├── quickstart.md
├── EPIC.md                       # [3/8]
├── TASKS.md                      # [4/8] (checkbox 标记任务完成状态)
├── TEST_REPORT.md                # [5/8]
├── SECURITY_REPORT.md
└── RELEASE_PLAN.md               # [6/8]
```

---

## Status Tracking

**orchestration_status.json 关键字段**:
```json
{
  "status": "dev_complete",
  "phase": "execution",
  "phase0_complete": true,
  "prd_complete": true,
  "checklist_complete": true,    // 如果启用
  "ui_skipped": false,            // 或 ui_complete: true
  "tech_design_complete": true,
  "epic_complete": true,
  "dev_complete": true,
  "qa_complete": false,
  "release_complete": false
}
```

---

**Last Updated**: 2025-12-19
