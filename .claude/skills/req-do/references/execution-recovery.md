# Execution And Recovery

## Minimum Runtime Truth

- 当前 requirement / change ID
- 当前 task ID
- 当前 task status
- 当前 active phase
- 当前 ready tasks
- 当前 review gates（spec / code）
- 已完成证据
- 阻塞点
- 下一步唯一动作

## Recovery Rule

恢复时只回答 3 件事：

1. 现在停在哪
2. 为什么停在这
3. 下一步必须先做什么

## Runtime Layout

运行态证据按任务落在：

- `.harness/runtime/<REQ>/<TASK>/events.jsonl`
- `.harness/runtime/<REQ>/<TASK>/checkpoint.json`
- `.harness/runtime/<REQ>/<TASK>/checkpoint.md`
- `.harness/runtime/<REQ>/<TASK>/review-spec.md`
- `.harness/runtime/<REQ>/<TASK>/review-code.md`

## Required Event Spine

一个健康任务最少要看见这些事件：

1. `context_ready`
2. `red_failed`
3. `green_passed`
4. `refactor_done` 或 `refactor_not_needed`
5. `spec_review_pass`
6. `code_review_pass`

没有这条骨架，说明执行闭环是断的。

## Bug Rule

- 先复现
- 再收证据
- 再下根因判断
- 最后改代码

## Subagent Rule

给 subagent 的上下文至少包含：

- 当前任务全文
- 当前进度与最近 checkpoint
- 已满足 / 未满足的依赖
- 必读文件
- 验收标准
- 验证命令
- 不做项 / 边界
