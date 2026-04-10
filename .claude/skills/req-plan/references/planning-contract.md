# Planning Contract

## Hard Rules

1. 先写目标、约束、非目标，再写方案。
2. `TASKS.md` 的任务必须能直接执行，不能写成口号。
3. `task-manifest.json` 必须和 `TASKS.md` 同步，且能告诉 `req-do` 当前任务是谁。
4. `BRAINSTORM.md`、`DESIGN.md`、`PLAN_REVIEW.md`、`context-package.md`、`task-manifest.json` 必须记录来源版本链。
5. 计划里出现 placeholder 词，就说明还没想清楚。
6. 一次只推进一个澄清问题，不允许问题轰炸。
7. 推荐方案没获批前，不允许继续拆执行任务。
8. 推荐方案获批后，必须先确定设计模式，再写 `DESIGN.md`。
9. `DESIGN.md` 通过与模式匹配的 review loop 前，不允许宣称计划完成。
10. 如果来自 `roadmap`，planning 不得悄悄丢掉 source constraints / non-goals / success signal。
9. `PLAN_REVIEW.md` 的 final gate 通过前，不允许生成 `TASKS.md`。

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

## Review Loop

`DESIGN.md` 至少完成：

1. Placeholder scan
2. Consistency scan
3. Scope scan
4. Ambiguity scan
5. Feasibility scan
6. Source alignment scan
7. Version trace scan

## Robustness Review

`PLAN_REVIEW.md` 至少完成：

1. Scope Review
2. Engineering Review
3. Cross-Phase Summary
4. Decision Audit Trail
5. Final Gate

如有 UI scope，再做 Design Review。
如有 developer-facing scope，再做 DX Review。
