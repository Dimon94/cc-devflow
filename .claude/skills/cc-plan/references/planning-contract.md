# Planning Contract

## Hard Rules

1. `cc-plan` 默认只产出 3 个文件：`DESIGN.md`、`TASKS.md`、`task-manifest.json`。
2. clarification / brainstorm / review 结论必须并入 `DESIGN.md`，不能再默认拆独立文档。
3. 执行 handoff 必须写进 `TASKS.md` 顶部，不能依赖单独的 `context-package.md`。
4. `task-manifest.json` 必须和 `TASKS.md` 同步，且能告诉 `cc-do` 当前任务是谁。
5. `DESIGN.md`、`TASKS.md`、`task-manifest.json` 必须记录来源版本链。
6. 计划里出现 placeholder 词，就说明还没想清楚。
7. 一次只推进一个澄清问题，不允许问题轰炸。
8. 推荐方案没获批前，不允许继续拆执行任务。
9. `DESIGN.md` 通过 review gate 前，不允许宣称计划完成。
10. 如果来自 `roadmap`，planning 不得悄悄丢掉 source constraints / non-goals / success signal。

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

`DESIGN.md` 至少完成：

1. Placeholder scan
2. Consistency scan
3. Scope scan
4. Ambiguity scan
5. Feasibility scan
6. Source alignment
7. Final recommendation

如有 UI scope，再补 design review 结论。
如有 developer-facing scope，再补 DX review 结论。
