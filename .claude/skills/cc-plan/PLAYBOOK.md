# CC-Plan Playbook

## Visible State Machine

`roadmap -> cc-plan -> cc-do`

- Enter from: an approved roadmap item, requirement, or bug that still needs design.
- Stay in: `cc-plan` until the approved design and executable task breakdown are both frozen.
- Exit to: `cc-do` only after `planning/design.md` is approved and `planning/tasks.md` plus `planning/task-manifest.json` are generated.
- Reroute to: `roadmap` if the conversation expands back into project strategy.

## Core Rules

1. 先读上游 handoff，再写 planning 结论。
2. 没有证据时写 assumption，不准冒充事实。
3. 一次只推进一个关键未知点。
4. `planning/design.md` 和 `planning/tasks.md` 必须足够让执行者脱离当前会话继续工作。
5. 版本、来源、冻结决策必须可追踪。
6. 机械决策自动落盘；taste decision 和 user challenge 必须显式交给用户拍板。
7. 同 blast radius 内的完整边界优先做完，跨系统或无证据扩张才 defer。
8. 具体执行计划默认测试先行；没有 Red/Green/Refactor 链或 TDD exception，不准交给 `cc-do`。

## Required Outputs

- `planning/design.md`
- `planning/tasks.md`
- `planning/task-manifest.json`

## Local Kit

- 模板全部在 `assets/`
- 任务结构解析在 `scripts/parse-task-dependencies.js`
- 计划边界和 placeholder 红线见 `references/planning-contract.md`
- 变更版本时同步 `CHANGELOG.md`，必要时用 `scripts/bump-skill-version.sh`

## Planning Standard

1. 一份 `planning/design.md` 讲清 clarification、方案、review 和 final gate。
2. 一份 `planning/tasks.md` 讲清执行任务和 handoff。
3. `planning/task-manifest.json` 只做机器真相源，不再重复人类叙事。
4. 推荐方案获批前，不得生成 `planning/tasks.md`。
5. `planning/tasks.md` 之前，`planning/design.md` 内的 review gate 必须闭合。
6. 每个任务都要写清：
   - 目标
   - TDD phase：`red` / `green` / `refactor` / `exception`
   - dependsOn / 是否允许并行
   - 涉及文件
   - 必读上下文
   - 验证方式
   - 完成证据
7. `planning/tasks.md` 顶部必须写清 frozen decisions、commands to trust、do-not-re-decide。
8. `planning/task-manifest.json` 必须是 `cc-do` 的真相源，而不是装饰文件。
9. `planning/design.md` 必须包含 `Existing Leverage`、`NOT in scope`、`Failure Modes`、`Test Diagram`，除非明确说明为什么不适用。
10. 新 artifact、CLI、包、容器、文档入口必须在计划阶段写清分发和 discoverability，不准到 `cc-act` 才发现没人能用。
11. 行为变更任务必须拆成 `[TEST] -> [IMPL] -> [REFACTOR]` 或写明 TDD exception；不能用“实现并测试”混成一个任务。

## Approval Flow

1. 先写 `Source Handoff` 和 requirement framing。
2. 在 `planning/design.md` 里记录备选方案和推荐。
3. 用户批准推荐方案后，再冻结正式设计。
4. 在 `planning/design.md` 里完成 review loop 与 final gate。
5. gate 通过后，再拆 `planning/tasks.md` 与 `planning/task-manifest.json`。

## Review Shape

计划内的工程审查至少回答：

- 现有代码已经解决了哪些子问题？
- 最小完整方案触达哪些文件，为什么没有更小边界？
- 数据流、状态流或执行流怎么走？
- 每条新增 code path / user flow / error path 的第一条失败测试是什么？
- 哪些生产失败模式已经处理，哪些 defer 到 backlog？

## Design Mode Switch

满足以下条件时，优先用 `tiny-design`：

1. 单一功能点，小范围修改
2. 通常只触达 1-3 个文件
3. 不涉及 migration、复杂状态流、权限/安全、高代价回滚
4. 执行者看完冻结卡片就能准确落地

否则用 `full-design`。

## Placeholder Ban

这些词一出现，说明计划失败：

- TODO later
- implement later
- add validation
- handle edge cases
- write tests for the above
- similar to task N
- TBD
- 之后再补

## Exit Rule

只有当 `cc-do` 不需要临场补脑也能直接执行时，计划才算合格。
如果执行者还得自己猜“这次到底碰哪些文件、为什么这么改”，说明 `planning/design.md` 仍然不够。
如果执行者还看不出哪些决策已经冻结，说明 `planning/tasks.md` 仍然不够。
如果执行者还要自己决定先写什么失败测试，说明 `planning/tasks.md` 仍然不够。
