# Planning Contract

## Hard Rules

1. `cc-plan` 默认只产出 3 个文件：`planning/design.md`、`planning/tasks.md`、`planning/task-manifest.json`。
2. clarification / brainstorm / review 结论必须并入 `planning/design.md`，不能再默认拆独立文档。
3. 执行 handoff 必须写进 `planning/tasks.md` 顶部，不能依赖单独的 `context-package.md`。
4. `planning/task-manifest.json` 必须和 `planning/tasks.md` 同步，且能告诉 `cc-do` 当前任务是谁。
5. `planning/design.md`、`planning/tasks.md`、`planning/task-manifest.json` 必须记录来源版本链。
6. 计划里出现 placeholder 词，就说明还没想清楚。
7. 一次只推进一个澄清问题，不允许问题轰炸。
8. 推荐方案没获批前，不允许继续拆执行任务。
9. `planning/design.md` 通过 review gate 前，不允许宣称计划完成。
10. 如果来自 `roadmap`，planning 不得悄悄丢掉 source constraints / non-goals / success signal。
11. 每个计划必须先找 existing leverage，再决定新增实现；重复已有能力属于 planning 失败。
12. 同 blast radius 内的完整边界默认纳入，defer 必须写入 `NOT in scope` 和原因。
13. 如果推荐方案挑战用户原始方向，必须标成 `user challenge`，不能自动改写用户意图。

## Design Modes

- `tiny-design`：超小需求的冻结设计卡片，不是跳过设计。
- `full-design`：涉及跨模块、复杂数据流、迁移或高风险约束的完整设计。

默认优先 `tiny-design`，但一旦需要解释复杂边界，就升级到 `full-design`。

## Placeholder Ban

- TODO later
- implement later
- handle edge cases
- write tests later
- similar to task N
- TBD
- 待定
- 之后再补
- 后面再想

## Task Fields

每个任务至少写清：

- 目标
- 涉及文件
- 验证方式
- 完成证据

## Review Gate

`planning/design.md` 至少完成：

1. Placeholder scan
2. Consistency scan
3. Scope scan
4. Ambiguity scan
5. Feasibility scan
6. Source alignment
7. Existing leverage map
8. Scope / complexity challenge
9. Test diagram and failure modes
10. NOT in scope
11. Final recommendation

如有 UI scope，再补 design review 结论。
如有 developer-facing scope，再补 DX review 结论。

## Decision Log

每个非平凡决策至少记录：

- decision
- classification：`mechanical` / `taste` / `user challenge`
- principle：completeness / pragmatic / DRY / explicit / action
- rationale
- rejected alternative

机械选择可以自动落盘。taste decision 和 user challenge 必须在最终 gate 里显式出现。
