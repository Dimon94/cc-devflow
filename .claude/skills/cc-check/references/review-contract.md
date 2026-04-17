# Review Contract

## Native Review Layers

`cc-check` 不是只跑 shell gate。

它至少校验两层审查现实：

1. **Task Review Layer**
   - 每个已完成任务都必须有 `spec review`
   - 每个已完成任务都必须有 `code review`
   - review 证据默认落在 `.harness/runtime/<REQ>/<TASK>/review-spec.md` / `review-code.md`

2. **Requirement Diff Layer**
   - 需求级 diff 必须有独立 review 结论
   - 严格模式下默认要求 `Codex review`
   - adversarial review 属于补充视角，重点暴露 failure mode

## Minimum Review Facts

每个 reviewer 结果至少说明：

- status
- summary
- evidence
- findings

每个 finding 至少说明：

- severity
- source
- summary
- action

## Gate Rules

- 任务级 review 缺证据，不能绿灯
- 需求级 diff review 在 strict 模式下缺失，至少是 `blocked`
- `important` / `critical` finding 未处理前，不算通过
