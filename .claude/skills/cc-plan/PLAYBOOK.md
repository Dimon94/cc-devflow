# CC-Plan Playbook

## Visible State Machine

`roadmap -> cc-plan -> cc-do`

- Enter from: an approved roadmap item, requirement, or bug that still needs design.
- Stay in: `cc-plan` until the approved design and executable task breakdown are both frozen.
- Exit to: `cc-do` only after `DESIGN.md` is approved and `TASKS.md` plus `task-manifest.json` are generated.
- Reroute to: `roadmap` if the conversation expands back into project strategy.

## Core Rules

1. 先读上游 handoff，再写 planning 结论。
2. 没有证据时写 assumption，不准冒充事实。
3. 一次只推进一个关键未知点。
4. `DESIGN.md` 和 `TASKS.md` 必须足够让执行者脱离当前会话继续工作。
5. 版本、来源、冻结决策必须可追踪。

## Required Outputs

- `DESIGN.md`
- `TASKS.md`
- `task-manifest.json`

## Local Kit

- 模板全部在 `assets/`
- 任务结构解析在 `scripts/parse-task-dependencies.js`
- 计划边界和 placeholder 红线见 `references/planning-contract.md`
- 变更版本时同步 `CHANGELOG.md`，必要时用 `scripts/bump-skill-version.sh`

## Planning Standard

1. 一份 `DESIGN.md` 讲清 clarification、方案、review 和 final gate。
2. 一份 `TASKS.md` 讲清执行任务和 handoff。
3. `task-manifest.json` 只做机器真相源，不再重复人类叙事。
4. 推荐方案获批前，不得生成 `TASKS.md`。
5. `TASKS.md` 之前，`DESIGN.md` 内的 review gate 必须闭合。
6. 每个任务都要写清：
   - 目标
   - dependsOn / 是否允许并行
   - 涉及文件
   - 必读上下文
   - 验证方式
   - 完成证据
7. `TASKS.md` 顶部必须写清 frozen decisions、commands to trust、do-not-re-decide。
8. `task-manifest.json` 必须是 `cc-do` 的真相源，而不是装饰文件。

## Approval Flow

1. 先写 `Source Handoff` 和 requirement framing。
2. 在 `DESIGN.md` 里记录备选方案和推荐。
3. 用户批准推荐方案后，再冻结正式设计。
4. 在 `DESIGN.md` 里完成 review loop 与 final gate。
5. gate 通过后，再拆 `TASKS.md` 与 `task-manifest.json`。

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
如果执行者还得自己猜“这次到底碰哪些文件、为什么这么改”，说明 `DESIGN.md` 仍然不够。
如果执行者还看不出哪些决策已经冻结，说明 `TASKS.md` 仍然不够。
