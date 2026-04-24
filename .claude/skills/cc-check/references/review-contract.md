# Review Contract

## Native Review Layers

`cc-check` 不是只跑 shell gate。

它至少校验两层审查现实：

1. **Task Review Layer**
   - 每个已完成任务都必须有 `spec review`
   - 每个已完成任务都必须有 `code review`
   - review 真相源默认落在 `planning/task-manifest.json` 的 `tasks[*].reviews`

2. **Requirement Diff Layer**
   - 需求级 diff 必须有独立 review 结论
   - 默认核对 plan completion、scope drift、critical categories、documentation staleness
   - 严格模式下默认要求独立 diff review；`Codex review` / adversarial review 是可用时的增强视角
   - adversarial review 属于补充视角，重点暴露 failure mode、silent data corruption、trust boundary drift

## Minimum Review Facts

每个 reviewer 结果至少说明：

- status
- summary
- evidence
- findings

每个 finding 至少说明：

- severity
- confidence
- source
- summary
- evidence
- action

## Gate Rules

- 任务级 review 缺证据，不能绿灯
- 需求级 diff review 在 strict 模式下缺失，至少是 `blocked`
- `important` / `critical` finding 未处理前，不算通过
- plan item 是 `PARTIAL` / `NOT_DONE` 且影响成功标准时，不能通过
- scope drift 没有解释清楚时，不能通过
- 文档漂移如果影响 reviewer / maintainer 接手，必须阻塞到 `cc-act` doc sync 或 reroute
