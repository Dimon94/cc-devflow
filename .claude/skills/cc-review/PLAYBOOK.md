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
2. 先读上一次 `cc-review` 的 `review-ledger.jsonl` / `review-findings.json` / `review-agent-results.jsonl`，再看当前 git 或 artifact delta；旧 `cc-review-*` 文件只作 fallback。
3. 先用 `cc-devflow review start` 写入 `review-started` 事件，列出 Review 工具、节点、跳过理由和风险 lane。
4. 对适合独立审查的节点，优先派发只读 reviewer subAgent；没有工具时如实降级。
5. 复杂实现 diff 优先使用 intent/regression、security/privacy、performance/reliability、contracts/coverage 四类风险 lane；小 diff 可以合并但必须说明。
6. 按节点逐个 Review：review 一个、check 一个、ledger 记录一个。
7. 主线程必须验证 subAgent findings，不盲信 reviewer。
8. 只读当前需求范围内的坏味道；历史债只在被本次变更放大时进入。
9. `cc-check` 是证据验收，`cc-review` 是深度诊断，两者不要混成一个门。
10. 计划分支按 strategy / design / engineering / DX 选择节点，不把所有方法一次塞进上下文，但不能因为渐进加载而跳过未审节点。
11. 实现分支先读 diff 和意图，再读周边代码；每个 changed surface 都要 checked、skipped 或 blocked。
12. UI 或运行时链路有风险时，必须用 Browser / Computer Use / CLI / logs 做端到端证明或写清阻塞原因。
13. 每个坏味道必须有 evidence、scope、recommendation 和 route。
14. 没有证据就写 unknown，不准把审美判断伪装成缺陷。
15. 不允许固定只列 3 个问题；finding 数量由节点遍历和证据决定。
16. 输出前必须聚合 raw findings：合并重复，降级弱证据，拒收 speculative / out-of-scope / stale findings。
17. 发现计划合同错误，回 `cc-plan`；发现代码错误，回 `cc-do`；只差验收，进 `cc-check`。
18. 输出必须落到 `review/review-ledger.jsonl`，必要时补 `review/review-findings.json` / `review/review-agent-results.jsonl`；Markdown 报告只通过 `cc-devflow review render` 按需生成。

## Required Outputs

- `review/review-ledger.jsonl`
- `review/review-agent-results.jsonl` when subagent reviewers are used
- `review/review-findings.json` when later agents need structured findings

## Local Kit

- `references/review-methods.md`: TOC / logic tree / smells / severity rules
- `references/plan-review-branch.md`: plan-stage deep review
- `references/implementation-review-branch.md`: diff and code-stage deep review
- `references/e2e-and-plugin-verification.md`: Browser / Computer Use / logs evidence
- `scripts/collect-review-context.sh`: git delta and prior-review state helper

## Stateful Review Plan

`review-started` ledger event 必须至少包含：

- review mode：plan / implementation / mixed
- previous review state：上次 report、ledger、findings 是否存在
- delta：本次相对哪个 SHA、哪些文件、哪些 artifacts 变了
- selected tools：CEO/strategy、engineering、design、DX、TOC、code smell、cc-simplify、E2E/plugin/logs
- skipped tools：为什么不需要
- reviewer dispatch：哪些节点交给 subAgent、哪些主线程执行、为什么
- risk lanes：implementation / mixed review 是否覆盖 intent-regression、security-privacy、performance-reliability、contracts-coverage
- node list：`R001`、`R002` ...，每个节点有 target、method、owner、evidence source、status

Review 过程中每完成一个节点，就用 `cc-devflow review record-node` 追加一条 ledger；不要等最后一次性补记。

## SubAgent Review

触发 `cc-review` 本身就授权只读 reviewer subAgent。主线程不要为了“再确认是否能用 subAgent”打断用户。

调度规则：

- 大范围 / 多文件 / 多 facet review：至少尝试两个独立 reviewer。
- 小范围 review：至少尝试一个 combined reviewer，除非 `review-ledger.jsonl` 写明不需要。
- Plan 节点可分配 strategy、engineering、design、DX、TOC reviewer。
- Implementation 节点可分配 contract、smell、test、runtime reviewer。
- 复杂 implementation 节点优先按四类风险 lane 派发 reviewer：intent/regression、security/privacy、performance/reliability、contracts/coverage。
- Codex 环境优先用 `explorer`；ClaudeCode 环境用可用的 `Task` / subAgent。
- reviewer 只读，不编辑文件，不改计划，不直接决定最终 route。
- reviewer 的上下文应独立，只给 review packet，不给完整聊天历史。
- 主线程负责合并、验证、去重和降级 false positive。

如果没有 subAgent 工具，报告必须写：

```text
Agents used: no (subagent tool unavailable)
Fallback: main-thread node-by-node review
```

## Review Standard

`cc-review` 至少回答：

- 这次 Review 的对象是什么？
- 当前 scope 的真实意图是什么？
- 现有代码或计划已经解决了哪些子问题？
- 哪些设计约束会让实现变脆？
- 哪些代码坏味道在当前 blast radius 内？
- 哪些测试、日志、UI 操作或端到端证据缺失？
- 哪些 finding 必须修，哪些可以 defer，哪些只是 advisory？
- 哪些节点已经被审过，哪些因为 delta 需要复审？
- 哪些节点没有审，为什么 skip 或 blocked？
- 哪些 reviewer 被派发，哪些 findings 被接受、合并、降级或拒绝？
- 四类风险 lane 哪些覆盖了，哪些因为 scope 小或工具不可用而跳过？
- 下一步为什么是 `cc-plan` / `cc-do` / `cc-check`？

## Decision Rule

一个 finding 如果会改变范围、架构、用户可见行为、公共 API、测试策略或超过机械局部清理，必须进入用户决策队列或 reroute 到上游 skill。先列完整决策清单，再逐个问题向用户确认；确认前不做非机械修复。机械且低风险的问题可以作为 `cc-do` 的明确修复项，但 `cc-review` 自身不偷偷改代码。
