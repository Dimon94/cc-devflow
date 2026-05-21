# CC-Review Playbook

## State Machine

`cc-plan / cc-investigate / cc-do / PR -> cc-review -> cc-plan | cc-do | cc-check | cc-act | stop`

## Core Rules

1. 先判断 review 对象是计划、实现、PR，还是混合。
2. 只读当前范围需要的 `task.md`、PR 文本、diff、代码、测试、日志和运行证据。
3. 不读取、不生成、不维护过程文件。
4. Git history 是唯一持久 review 记忆；重复 review 时用 `git diff <old>...HEAD` 缩小范围。
5. 可用 subagent 时可以派发只读 reviewer；raw output 留在会话里，主线程验证后再进入最终 findings。
6. 复杂实现或 mixed review 考虑 intent/regression、security/privacy、performance/reliability、complexity/hotspots、contracts/coverage 五类风险 lane。
7. 按 selected facet 或 changed surface 逐节点检查；每个节点 checked、skipped 或 blocked。
8. 不固定 finding 数量。证据决定输出。
9. 每条 finding 必须有 evidence、impact、recommendation 和 route。
10. 输出前聚合 raw findings：合并重复，降级弱证据，拒收 speculative / out-of-scope / stale findings。
11. 计划 review 的结果直接写回 `task.md`；执行 review 的结果通过共享 choice protocol 询问用户选择修复方案；只差验收，进 `cc-check`。

## Review Standard

`cc-review` 至少回答：

- 这次 Review 的对象是什么？
- 当前 scope 的真实意图是什么？
- 现有代码或计划解决了哪些子问题？
- 哪些设计约束会让实现变脆？
- 哪些代码坏味道在当前 blast radius 内？
- 哪些复杂度热点是当前 diff 放大或引入的？
- 哪些测试、日志、UI 操作或端到端证据缺失？
- 哪些 finding 必须修，哪些可以 defer，哪些只是 advisory？
- 哪些节点已经审过，哪些 skipped / blocked，原因是什么？
- 风险 lane 哪些覆盖了，哪些因为 scope 小或工具不可用跳过？
- subagent findings 哪些被接受、合并、降级或拒收？
- 下一步为什么是 `cc-plan` / `cc-do` / `cc-check` / `cc-act` / `stop`？

## Decision Rule

计划 review 发现的范围、架构、用户可见行为、公共 API、测试策略问题，必须直接写进 `task.md` 的合同、任务或开放问题里。执行 review 发现的问题必须给出修复选项，并按 `../cc-dev/references/user-choice-output-protocol.md` 询问用户是否修复以及选择哪种方案；用户选择后再直接修改代码并验证。
