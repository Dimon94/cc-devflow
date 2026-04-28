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
- confidenceScore
- source
- summary
- evidence
- action
- triageStatus
- fingerprint
- displayTier
- suppressionReason

## Review Packet

Review 不能依赖聊天记忆。每个 task-level review 和 requirement-level diff review 至少记录：

- `baseSha`：被审查范围的起点
- `headSha`：被审查范围的终点
- `requirements`：对应的 plan、task、analysis 或 spec 路径
- `implemented`：实现者声称完成的内容
- `reviewerContext`：reviewer 实际拿到的上下文摘要

缺 `baseSha` / `headSha` 时，review 只能算 `blocked` 或 `skipped`，不能支撑 `pass`。

## Review Freshness

Review 必须绑定当前被交付的 commit，而不是绑定聊天记忆。

每份 requirement-level review 至少记录：

- `review.freshness.status`：`fresh` / `stale` / `unknown` / `not-applicable`
- `review.freshness.reviewedCommit`
- `review.freshness.currentCommit`
- `review.freshness.commitsSinceReview`
- `review.freshness.staleReason`
- `review.qualityScore`：0-10，可空但空值不能支撑高置信 pass

`status=stale`、`status=unknown` 且没有解释，或 `commitsSinceReview > 0` 且未重审，都会阻塞 `pass`。

## Specialist Facets

`review.specialistReviews[]` 用来记录按风险覆盖的审查面，不要求每次都派发独立 reviewer，但要求边界说清：

- `testing`：负路径、边界条件、隔离性、flaky 风险、回归测试质量
- `security`：trust boundary、shell / SQL / secret / auth 风险
- `performance`：热路径、批量、缓存、N+1、资源泄漏
- `api-contract`：输入输出、状态枚举、兼容面、错误语义
- `data-migration`：schema、回滚、幂等、历史数据
- `design`：UI / UX / visual consistency 和可用性

没有相关风险时写 `status=skipped` 和 `skipReason`；有风险却缺 facet 时，至少是 review gap。

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

- 反馈环是否可信：速度、确定性、信号锋利度、复现率是否足够支撑结论
- bugfix 是否复现并覆盖了用户描述的原始症状，而不是附近的另一个失败
- expected / actual / reproduction steps 是否能让 reviewer 独立复现或判断缺件
- 回归测试是否有 red/green 证据
- red 是否因为目标行为缺失而失败
- green 是否包含 targeted test 和必要的 broader gate
- 测试是否通过公共接口覆盖行为
- mock 是否只停在系统边界，且没有断言 mock 本身或内部调用顺序
- 生产代码是否新增 test-only API
- integration / contract test 是否比复杂 mock 更直接
- 如果没有正确测试 seam，是否记录了架构 follow-up，而不是造易碎测试
- coverage audit 是否映射真实 codepath / user flow / error state / edge case
- UI 或用户路径变更是否有 browser evidence、截图、console 结果，或明确 skip reason

## Durable Follow-Up Facts

Review 产生的 QA issue 或 follow-up 必须可长期执行：

- 用领域语言描述用户或系统行为，不把当前文件路径 / 行号当成唯一真相
- 写清 current behavior、desired behavior、key interfaces、acceptance criteria、out of scope
- 独立行为拆成独立条目；有依赖关系时写明顺序
- `deferred-minor` 只能用于不阻塞本次交付的 minor 项，并且必须进入 `cc-act` follow-up writeback

## Failure Ownership

失败归属必须结构化写入 `runtime.failureOwnership[]`：

- `classification=in-branch`：当前分支引入
- `classification=pre-existing`：base branch 也能复现，必须有证据
- `classification=environment`：缺依赖、权限、服务、密钥或平台条件
- `classification=ambiguous`：归属不明，默认不能支撑 `pass`

不要把 pre-existing failure 当成当前分支失败，也不要把 ambiguous failure 当成环境问题。

## Gate Rules

- 任务级 review 缺证据，不能绿灯
- 需求级 diff review 在 strict 模式下缺失，至少是 `blocked`
- `important` / `critical` finding 未处理前，不算通过
- `important` / `critical` finding 缺 triageStatus，不算通过
- QA test quality 缺失且本次涉及行为变化，至少是 `blocked`
- 行为变更缺 `qa.feedbackLoop` / `qa.behaviorEvidence` 且没有明确例外，至少是 `blocked`
- bugfix 没有复现原始症状，也没有解释不可复现原因，不能通过
- review freshness 缺失、过期或与当前 head 不一致，不能绿灯
- UI / 用户路径变更缺 browser evidence 且无 skip reason，不能绿灯
- `runtime.failureOwnership` 仍有 `in-branch` 或 `ambiguous` 未解释失败，不能绿灯
- plan item 是 `PARTIAL` / `NOT_DONE` 且影响成功标准时，不能通过
- scope drift 没有解释清楚时，不能通过
- 文档漂移如果影响 reviewer / maintainer 接手，必须阻塞到 `cc-act` doc sync 或 reroute
