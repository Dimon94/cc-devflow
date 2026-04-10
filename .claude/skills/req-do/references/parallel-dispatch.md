# Parallel Dispatch Guide

## Golden Law

并行的是独立事实，不是因果链。

如果一个任务的输出会改变另一个任务的实现选择，那它们就不是并行任务，而是顺序任务。

## Can Run In Parallel

只有全部满足，才算可并行：

1. 两个任务都在当前 active phase
2. `dependsOn` 已满足，且互不依赖
3. `touches` / `files` 没有交集
4. 不共享同一个可变资源，例如同一 schema、同一公共接口、同一全局状态
5. 验证命令可以各自独立运行
6. 每个任务都有完整上下文包，不需要靠别人的临场解释补脑

## Must Run Sequentially

命中任一条，就必须串行：

1. 一个任务依赖另一个任务的输出
2. 两个任务会改同一个文件或同一抽象边界
3. 上游任务在定义契约，下游任务在消费契约
4. 一个任务先改 schema / API，另一个任务基于它写实现
5. 你还不能清楚说出每个任务各自的验收标准
6. 你打算让第二个 subagent 先看第一个 subagent 的结果再决定怎么写

## Dispatch Packet

每个 subagent 在开工前必须拿到：

- 当前任务全文
- 当前 requirement 摘要
- 当前进度摘要
- 当前任务依赖状态
- 必读文件列表
- 允许修改的触点
- 验收标准
- 可信命令
- 非目标

少任何一项，都不是“已准备好的并行任务”。

## Scheduling Heuristics

优先级从高到低：

1. 先选当前 active phase 的 ready tasks
2. 在 ready tasks 里优先选 `touches` 不重叠的任务
3. 在不重叠任务里优先选验证面最小的任务
4. 如果仍然不确定，退回串行

## Good Example

- `T010 [TEST]` 为支付折扣补失败测试，触点只在 `tests/payment-discount.test.ts`
- `T011 [TEST]` 为通知重试补失败测试，触点只在 `tests/notify-retry.test.ts`
- `T012 [IMPL]` 修支付折扣实现，`dependsOn:T010`
- `T013 [IMPL]` 修通知重试实现，`dependsOn:T011`

可以并行的是 `T010` 和 `T011`，也可以在它们各自通过后并行 `T012` 和 `T013`。

## Bad Example

- `T020` 重命名鉴权中间件导出
- `T021` 基于新导出接入路由

这不是并行，它们是显式因果链。

## Taste Check

并行调度前问自己三件事：

1. 如果 A 任务晚 30 分钟完成，B 还能独立写完吗？
2. 如果两个任务同时改完，我能不用人工大合并就直接集成吗？
3. 如果把两个任务交给两个完全不共享记忆的 subagent，他们还能各自成功吗？

有一个答案是否，就别并行。
