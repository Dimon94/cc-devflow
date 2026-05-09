# CC-Review Playbook

## Visible State Machine

`cc-plan / cc-investigate -> cc-review -> cc-plan | cc-do`

`cc-do -> cc-review -> cc-do | cc-check`

- Enter from: a complex plan, investigated bug, implementation diff, review comment, or user request for deep review.
- Stay in: `cc-review` until the branch type, scope, findings, plugin/E2E evidence needs, and next route are explicit.
- Exit to: `cc-plan` for broken plan contracts, `cc-do` for implementation fixes, or `cc-check` for fresh verification.
- Reroute to: `cc-act` only if `cc-check` is already fresh and clean.

## Core Rules

1. 先判断 review 对象是计划、实现，还是混合。
2. 只读当前需求范围内的坏味道；历史债只在被本次变更放大时进入。
3. `cc-check` 是证据验收，`cc-review` 是深度诊断，两者不要混成一个门。
4. 计划分支按 strategy / design / engineering / DX 渐进加载，不把所有方法一次塞进上下文。
5. 实现分支先读 diff 和意图，再读周边代码，最后才给 finding。
6. UI 或运行时链路有风险时，必须用 Browser / Computer Use / CLI / logs 做端到端证明或写清阻塞原因。
7. 每个坏味道必须有 evidence、scope、recommendation 和 route。
8. 没有证据就写 unknown，不准把审美判断伪装成缺陷。
9. 发现计划合同错误，回 `cc-plan`；发现代码错误，回 `cc-do`；只差验收，进 `cc-check`。
10. 输出必须落到 `review/cc-review-report.md`，不能只留在聊天里。

## Required Outputs

- `review/cc-review-report.md`
- `review/cc-review-findings.json` when later agents need structured findings

## Local Kit

- `references/review-methods.md`: TOC / logic tree / smells / severity rules
- `references/plan-review-branch.md`: plan-stage deep review
- `references/implementation-review-branch.md`: diff and code-stage deep review
- `references/e2e-and-plugin-verification.md`: Browser / Computer Use / logs evidence

## Review Standard

`cc-review` 至少回答：

- 这次 Review 的对象是什么？
- 当前 scope 的真实意图是什么？
- 现有代码或计划已经解决了哪些子问题？
- 哪些设计约束会让实现变脆？
- 哪些代码坏味道在当前 blast radius 内？
- 哪些测试、日志、UI 操作或端到端证据缺失？
- 哪些 finding 必须修，哪些可以 defer，哪些只是 advisory？
- 下一步为什么是 `cc-plan` / `cc-do` / `cc-check`？

## Decision Rule

一个 finding 如果会改变范围、架构、用户可见行为、公共 API、测试策略或超过机械局部清理，必须交给用户决策或 reroute 到上游 skill。机械且低风险的问题可以作为 `cc-do` 的明确修复项，但 `cc-review` 自身不偷偷改代码。
