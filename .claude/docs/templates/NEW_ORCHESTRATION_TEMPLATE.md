# Flow-New Orchestration Template

> Execution flow for `/flow-new` one-shot requirement development (v4.1)

---

## Stage Execution Skeleton

### [1/6] /flow-init
- 创建需求目录 + Git 分支
- 研究材料收集 + `BRAINSTORM.md` 初始化
- Exit Gate: `orchestration_status.status == initialized`

### [2/6] /flow-clarify (可选)
- 触发条件: 需求歧义、边界冲突、验收标准不明确
- 输出: `clarifications/*.md`
- 若跳过: 标记 `clarify_skipped: true`

### [3/6] /flow-spec
- 统一规格阶段: PRD → Tech+UI(并行) → Epic/TASKS
- 支持模式: `--skip-tech` / `--skip-ui`
- Exit Gate: 规格产物完整，`status = spec_complete`

### [4/6] /flow-dev
**TDD 执行模式**:
```
Phase 1: 分析现有代码
Phase 2: 编写测试 (Tests First)
  ↓
TDD CHECKPOINT → 测试必须先失败
  ↓
Phase 3: 实现代码
Phase 4: 测试验证 → 测试必须通过
```
- 输出: 实现代码 + 测试代码 + `TASKS.md` 勾选更新

### [5/6] /flow-quality --full
**统一质量验证**:
- 规格合规审查
- 代码质量审查
- 安全扫描与测试门禁
- 输出: `SPEC_REVIEW.md`, `CODE_QUALITY_REVIEW.md`, `SECURITY_REPORT.md`

### [6/6] /flow-release
- 生成 `RELEASE_PLAN.md`
- 执行发布分支策略（PR/merge/squash 等）
- 必要时更新 `CLAUDE.md`

---

## Progress Display Format

```
🎯 CC-DevFlow 完整需求开发流程
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

需求: REQ-123 | 支持用户下单

[1/6] ✅ 初始化完成
[2/6] ✅ 澄清完成 (可选)
[3/6] ✅ 统一规格完成
[4/6] 🔄 开发执行中... (8/18 已完成)
[5/6] ⏳ 等待质量验证...
[6/6] ⏳ 等待发布管理...
```

---

## Output Structure

```
devflow/requirements/${REQ_ID}/
├── BRAINSTORM.md
├── research/
├── clarifications/                # 可选
├── PRD.md
├── TECH_DESIGN.md                 # 若未跳过 tech
├── UI_PROTOTYPE.html              # 若未跳过 ui 且识别到 UI 需求
├── EPIC.md
├── TASKS.md
├── SPEC_REVIEW.md                 # flow-quality --full
├── CODE_QUALITY_REVIEW.md         # flow-quality --full
├── SECURITY_REPORT.md             # flow-quality --full
└── RELEASE_PLAN.md
```

---

## Status Tracking

**orchestration_status.json 推荐字段**:
```json
{
  "status": "dev_complete",
  "phase": "execution",
  "initialized": true,
  "clarify_complete": true,
  "spec_complete": true,
  "dev_complete": true,
  "quality_complete": false,
  "release_complete": false
}
```

---

**Last Updated**: 2026-02-07
