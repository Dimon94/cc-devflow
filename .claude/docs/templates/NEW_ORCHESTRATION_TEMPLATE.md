# Mainline Orchestration Template

> Canonical execution flow for requirement delivery (`/flow:init -> /flow:spec -> /flow:dev -> /flow:verify -> /flow:release`)

---

## Stage Execution Skeleton

### [1/5] /flow:init
- 创建需求目录 + 运行时上下文
- Exit Gate: `status in {initialized, context_packed}`

### [2/5] /flow:spec
- 统一规格阶段（PRD/Tech/UI/Task Manifest）
- Exit Gate: `status = spec_complete` 或 `phase = planning`

### [3/5] /flow:dev
- 按 manifest 执行开发，支持 `--resume`
- Exit Gate: `status in {development_complete, development_in_progress}`

### [4/5] /flow:verify
- 快速/严格质量闸
- 严格模式输出 `report-card.json` 作为发布准入依据

### [5/5] /flow:release
- 读取 verify 结果并完成发布收口
- 生成发布计划并清理运行时噪音

---

## Progress Display Format

```text
🎯 CC-DevFlow 主链交付
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

需求: REQ-123 | 支持用户下单

[1/5] ✅ 初始化完成
[2/5] ✅ 规格完成
[3/5] 🔄 开发执行中... (8/18 已完成)
[4/5] ⏳ 等待质量闸...
[5/5] ⏳ 等待发布...
```

---

## Output Structure

```text
devflow/requirements/${REQ_ID}/
├── PRD.md
├── TECH_DESIGN.md
├── UI_PROTOTYPE.html            # 条件生成
├── EPIC.md
├── TASKS.md
├── report-card.json             # /flow:verify 产物
├── SECURITY_REPORT.md
└── RELEASE_PLAN.md
```

---

## Status Tracking (Suggested)

```json
{
  "status": "development_in_progress",
  "phase": "development",
  "initialized": true,
  "spec_complete": true,
  "development_complete": false,
  "quality_complete": false,
  "release_complete": false
}
```
