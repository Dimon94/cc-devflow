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

- reviewPacket
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
- triageStatus

## Review Packet

Review 不能依赖聊天记忆。每个 task-level review 和 requirement-level diff review 至少记录：

- `baseSha`：被审查范围的起点
- `headSha`：被审查范围的终点
- `requirements`：对应的 plan、task、analysis 或 spec 路径
- `implemented`：实现者声称完成的内容
- `reviewerContext`：reviewer 实际拿到的上下文摘要

缺 `baseSha` / `headSha` 时，review 只能算 `blocked` 或 `skipped`，不能支撑 `pass`。

## Finding Triage

Review finding 不只是“发现过”，必须有处置结果：

| triageStatus | 什么时候用 |
| --- | --- |
| `accepted-fixed` | finding 正确，已修复，并有验证证据 |
| `rejected-with-evidence` | finding 不适用，已有代码 / 测试 / 契约证据支撑 |
| `deferred-minor` | minor，不阻塞本次交付，已写入 follow-up |
| `clarification-needed` | finding 不清楚，需要用户或 reviewer 澄清 |

`critical` / `important` finding 不能用 `deferred-minor`。任何 `clarification-needed` 都会阻塞 `pass`。

## QA Test Review Facts

Review 必须判断测试是否证明行为：

- 回归测试是否有 red/green 证据
- red 是否因为目标行为缺失而失败
- green 是否包含 targeted test 和必要的 broader gate
- mock 是否必要，且没有断言 mock 本身
- 生产代码是否新增 test-only API
- integration / contract test 是否比复杂 mock 更直接

## Gate Rules

- 任务级 review 缺证据，不能绿灯
- 需求级 diff review 在 strict 模式下缺失，至少是 `blocked`
- `important` / `critical` finding 未处理前，不算通过
- `important` / `critical` finding 缺 triageStatus，不算通过
- QA test quality 缺失且本次涉及行为变化，至少是 `blocked`
- plan item 是 `PARTIAL` / `NOT_DONE` 且影响成功标准时，不能通过
- scope drift 没有解释清楚时，不能通过
- 文档漂移如果影响 reviewer / maintainer 接手，必须阻塞到 `cc-act` doc sync 或 reroute
