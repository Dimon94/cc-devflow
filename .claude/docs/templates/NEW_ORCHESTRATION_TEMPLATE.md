# Mainline Orchestration Template

> Canonical execution flow for requirement delivery (`/flow:init -> /flow:spec -> /flow:dev -> /flow:verify -> /flow:prepare-pr -> /flow:release`)

---

## Stage Execution Skeleton

### [1/6] /flow:init
- 创建需求目录 + 运行时上下文
- Exit Gate: `harness-state.json.status = initialized`

### [2/6] /flow:spec
- 统一规格阶段（PRD/Tech/UI/Task Manifest）
- Exit Gate: `harness-state.json.status = planned`

### [3/6] /flow:dev
- 按 manifest 执行开发，支持 `--resume`
- Exit Gate: `harness-state.json.status in {planned, in_progress}` 且任务状态已写回

### [4/6] /flow:verify
- 快速/严格质量闸
- 严格模式输出 `report-card.json` 作为发布准入依据

### [5/6] /flow:prepare-pr
- 生成 review-ready handoff artifact
- Exit Gate: `devflow/intent/<REQ>/artifacts/pr-brief.md` 存在

### [6/6] /flow:release
- 读取 verify 结果并完成发布收口
- 生成发布计划并清理运行时噪音

---

## Progress Display Format

```text
🎯 CC-DevFlow 主链交付
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

需求: REQ-123 | 支持用户下单

[1/6] ✅ 初始化完成
[2/6] ✅ 规格完成
[3/6] 🔄 开发执行中... (8/18 已完成)
[4/6] ⏳ 等待质量闸...
[5/6] ⏳ 等待提审...
[6/6] ⏳ 等待发布...
```

---

## Output Structure

```text
devflow/requirements/${REQ_ID}/
├── harness-state.json
├── PRD.md
├── TECH_DESIGN.md
├── UI_PROTOTYPE.html            # 条件生成
├── EPIC.md
├── TASKS.md
├── task-manifest.json
├── report-card.json             # /flow:verify 产物
├── SECURITY_REPORT.md
└── RELEASE_PLAN.md

devflow/intent/${REQ_ID}/
├── resume-index.md
└── artifacts/
    └── pr-brief.md
```

---

## Status Tracking (Suggested)

```json
{
  "changeId": "REQ-123",
  "goal": "Deliver safely",
  "status": "in_progress",
  "updatedAt": "2026-03-26T12:00:00Z"
}
```

Compatibility mirror can still project:

```json
{
  "status": "verified",
  "phase": "verify"
}
```
