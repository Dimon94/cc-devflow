# CC-Review Playbook

## State Machine

`cc-plan / cc-investigate / cc-do / PR -> cc-review -> cc-plan | cc-do | cc-check | cc-act | stop`

## Core Rules

1. 先判断 review 对象是计划、实现、PR，还是混合。
2. 只读当前范围需要的 `task.md`、PR 文本、diff、代码、测试、日志和运行证据。
3. 不读取、不生成、不维护过程文件。
4. Git history 是唯一持久 review 记忆；重复 review 时用 `git diff <old>...HEAD` 缩小范围。
5. 可用 subagent 时可以派发只读 reviewer；raw output 留在会话里，主线程验证后再进入最终 findings。
6. 不固定 finding 数量。证据决定输出。
7. 每条 finding 必须有 evidence、impact、recommendation 和 route。
8. 发现计划合同错误，回 `cc-plan`；发现代码错误，回 `cc-do`；只差验收，进 `cc-check`。

## Review Standard

`cc-review` 至少回答：

- 这次 Review 的对象是什么？
- 当前 scope 的真实意图是什么？
- 现有代码或计划解决了哪些子问题？
- 哪些设计约束会让实现变脆？
- 哪些代码坏味道在当前 blast radius 内？
- 哪些测试、日志、UI 操作或端到端证据缺失？
- 哪些 finding 必须修，哪些可以 defer，哪些只是 advisory？
- 下一步为什么是 `cc-plan` / `cc-do` / `cc-check` / `cc-act` / `stop`？

## Decision Rule

一个 finding 如果会改变范围、架构、用户可见行为、公共 API、测试策略或超过机械局部清理，必须进入用户决策队列或 reroute 到上游 skill。机械且低风险的问题可以作为 `cc-do` 的明确修复项，但 `cc-review` 自身不偷偷改代码。
