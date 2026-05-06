# Execution And Recovery

## Minimum Runtime Truth

- 当前 requirement / change ID
- 当前 task ID
- 当前 task status
- 当前 active phase
- 当前 ready tasks
- 当前 wave / parallel candidates / touch conflict verdict
- submoduleTouches（如适用）
- 当前 review gates（spec / code）
- 已完成证据
- 阻塞点
- 下一步唯一动作

## Recovery Rule

恢复时只回答 3 件事：

1. 现在停在哪
2. 为什么停在这
3. 下一步必须先做什么

如果这三件事不能只靠规范产物和最新 checkpoint 回答，就先做 context reset，不准继续依赖聊天记忆。

## Runtime Layout

运行态证据按任务落在：

- `devflow/changes/<change-key>/execution/tasks/<task-id>/checkpoint.json`
- `devflow/changes/<change-key>/execution/tasks/<task-id>/events.jsonl`（仅 debug / failed 默认保留）
- `planning/task-manifest.json` 里的 `tasks[*].reviews`

## Required Event Spine

一个健康任务最少要看见这些事件：

1. `context_ready`
2. `red_failed`
3. `red_reason_verified`
4. `red_seam_verified`
5. `red_behavior_verified`
6. `mock_boundary_verified`
7. `green_passed`
8. `refactor_done` 或 `refactor_not_needed`
9. `refactor_green`
10. `spec_review_pass`
11. `code_review_pass`

如果 `events.jsonl` 没开启，至少仍要有最新 `checkpoint.json` 和 manifest review verdict。

## Checkpoint TDD Fields

最新 checkpoint 至少能回答：

- `red.command`
- `red.exitStatus`
- `red.expectedFailure`
- `red.testSeam`
- `red.behaviorAsserted`
- `red.specStyleTestName`
- `red.oneLogicalBehavior`
- `red.publicVerificationPath`
- `red.allowedMocks`
- `red.implementationDetailRisk`
- `green.command`
- `green.exitStatus`
- `green.minimalityGuard`
- `refactor.status`
- `refactor.candidates`
- `refactor.greenCommand`
- `testQuality.usesPublicInterface`
- `testQuality.describesBehavior`
- `testQuality.specStyleName`
- `testQuality.verifiesThroughPublicPath`
- `testQuality.noBulkRed`
- `testQuality.survivesInternalRefactor`
- `testQuality.mocksOnlySystemBoundaries`
- `review.spec.status`
- `review.code.status`

如果跳过 TDD，必须有 `tddException`，并写清替代验证。没有这些字段时，恢复执行先补证据，不准直接继续实现。

## Bug Rule

- 先复现
- 再收证据
- 再下根因判断
- 最后改代码

## Local Recovery Ladder

1. 先重试当前命令或当前 task，而不是重跑整条 requirement
2. 两次失败后回看证据链和 task context
3. 三次失败后默认怀疑上游合同：根因漂移回 `cc-investigate`，范围 / 设计漂移回 `cc-plan`

## Subagent Rule

给 subagent 的上下文至少包含：

- 当前任务全文
- 当前进度与最近 checkpoint
- 已满足 / 未满足的依赖
- 必读文件
- 验收标准
- 验证命令
- 不做项 / 边界
- quick lane 是否仍有 mini manifest、checkpoint、verification 和唯一 next action
