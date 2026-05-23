# CC-Review Playbook

## State Machine

`cc-plan / cc-investigate / cc-do / PR -> cc-review -> cc-plan | cc-do | cc-check | cc-act | stop`

## Core Rules

1. 先判断 review 对象是计划、实现、PR，还是混合。
2. 只读当前范围需要的 `task.md`、PR 文本、diff、代码、测试、日志和运行证据。
3. 不读取、不生成、不维护过程文件。
4. Git history 是唯一持久 review 记忆；重复 review 时用 `git diff <old>...HEAD` 缩小范围。
5. 可用 subagent 时可以派发只读 reviewer；raw output 留在会话里，主线程验证后再进入最终 findings。
6. 复杂实现或 mixed review 考虑 intent/regression、security/privacy、performance/reliability、complexity/hotspots、contracts/coverage、productization-surface、structural-quality/code-judo 七类风险 lane；命中 shared action layer、API/agent surface、audit trail、admin/manageability、feature flag、idempotency 或 operator path 时加载 productization surface 清单；命中 prototype cleanup、large files、vague utils、entrypoint god file、global CSS sprawl、persisted-state compatibility 或 real viewport QA 风险时加载 structural-quality 清单；命中 auth、secret、telemetry、deploy、test-suite trust 等生产控制面时加载 hardening specialist 清单。
7. 按 selected facet 或 changed surface 逐节点检查；每个节点 checked、skipped 或 blocked。
8. 不固定 finding 数量。证据决定输出。
9. 每条 finding 必须有 evidence、impact、recommendation 和 route。
10. 复杂度 report-only 请求默认输出完整报告并明确没有改文件；只有用户明确要求 fix / optimize / apply / refactor 时才进入修复选择。
11. 复杂度修复前必须确认数据规模、热路径、排序、重复键、identity、cache invalidation、权限、分页和错误语义；修复后先 narrow test，再 broad relevant test/build，必要时补 measurement。
12. 输出前聚合 raw findings：合并重复，降级弱证据，拒收 speculative / out-of-scope / stale findings。
13. 计划 review 的结果直接写回 `task.md`；执行 review 的结果通过共享 choice protocol 询问用户选择修复方案；只有流程、测试、设计或模型写法逃逸类 finding 追加到 `task.md#Failure Ledger`；只差验收，进 `cc-check`。

## Review Standard

`cc-review` 至少回答：

- 这次 Review 的对象是什么？
- 当前 scope 的真实意图是什么？
- 现有代码或计划解决了哪些子问题？
- 哪些设计约束会让实现变脆？
- 哪些代码坏味道在当前 blast radius 内？
- 哪些复杂度热点是当前 diff 放大或引入的？
- 本次复杂度 review 的 scope、技术栈、测试/build 命令和 hot path 是什么？
- scanner lead 哪些被回读代码证实，哪些只是 false positive 或低价值 constant-factor 清理？
- report-only 请求是否明确写了 files modified: no？
- 如果建议优化，排序、重复键、identity、cache invalidation、权限、分页和错误行为如何保持？
- 哪些 hardening specialist 被选中：security、observability、release-readiness、test-strategy？哪些 skipped / blocked，原因是什么？
- hardening surface map 是什么？每个 finding 是 `must-fix-before-release`、`should-fix-soon` 还是 `accepted/deferred-risk`？证明路径和 residual risk 是什么？
- 如果选中 test-strategy，哪些 suite 真正提高 confidence per minute？哪些 broad snapshot、重复 happy path、overmocked test、no-op smoke 或慢测试应该 keep / rewrite / delete / quarantine？
- 安全 finding 是否说明了具体边界、actor、绕过路径、缺失控制、验证和 residual risk？
- 可观测性 finding 是否说明了无法回答的事故问题、缺失信号、关联字段、redaction 和失败路径验证？
- 发布就绪 finding 是否说明了缺失 gate、部署/迁移/配置失败模式、rollback 或 smoke 证据？
- 测试策略 finding 是否说明了现有测试为什么抓不住该行为、最小高信号测试形状、fixture/mock 边界和 suite 成本？
- 哪些结构质量问题让分支、抽象、类型边界、文件规模或 ownership boundary 变差？
- 是否存在行为不变但能删除整类特殊情况、helper、mode 或层级的 code-judo move？
- 哪些测试、日志、UI 操作或端到端证据缺失？
- 哪些 finding 必须修，哪些可以 defer，哪些只是 advisory？
- 哪些节点已经审过，哪些 skipped / blocked，原因是什么？
- 风险 lane 哪些覆盖了，哪些因为 scope 小或工具不可用跳过？
- subagent findings 哪些被接受、合并、降级或拒收？
- 下一步为什么是 `cc-plan` / `cc-do` / `cc-check` / `cc-act` / `stop`？

## Decision Rule

计划 review 发现的范围、架构、用户可见行为、公共 API、测试策略问题，必须直接写进 `task.md` 的合同、任务或开放问题里。执行 review 发现的问题必须给出修复选项，并按 `../cc-dev/references/user-choice-output-protocol.md` 询问用户是否修复以及选择哪种方案；用户选择后再直接修改代码并验证。review 证明流程、测试、设计或模型写法逃逸时，额外写入 `task.md#Failure Ledger`，默认 `Status=unreviewed`、`Keep for postmortem=no`。
