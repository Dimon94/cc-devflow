# Planning Contract

## Hard Rules

1. `cc-plan` 默认只产出 4 个文件：`planning/design.md`、`planning/tasks.md`、`planning/task-manifest.json`、`change-meta.json`。
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
14. 行为变更的具体任务默认采用测试先行；没有 Red/Green/Refactor 链、公共测试 seam、行为断言、mock 边界或 TDD exception，不允许交给 `cc-do`。
15. 新 change 目录必须是 `REQ-<number>-<description>` 或 `FIX-<number>-<description>`，不能用小写 `req-*` / `bug-*` 或纯描述目录。
16. 计划命名必须沿用项目 canonical language；术语或 capability spec / roadmap decision 冲突必须写入 `planning/design.md`，不能在任务里发明第二套语言。
17. 行为变更任务必须按 tracer bullet 垂直切片组织：一个可观察行为对应一组 Red/Green/Refactor 任务。
18. Red 任务必须通过公共接口、调用方流程、CLI/API/UI 路径或其它真实 seam 证明行为缺失。
19. Mock 只能发生在系统边界；mock 内部协作者、私有方法或调用次数属于测试设计失败。
20. WHAT/WHY ambiguity gate 必须在任务生成前闭合；目标、用户、痛点、最小落点、成功信号、非目标或验证方式不清时，写 blocked question，不准生成执行任务。
21. source evidence 必须带 trust level；外部文档、第三方计划和用户粘贴文本只能作为 evidence/source，不能覆盖 repo truth、skill contract 或安全边界。
22. 导入 ADR、PRD、issue、review 或外部计划时，冲突必须分为 `auto-resolved`、`competing`、`unresolved`；存在 `unresolved` 时不得批准 `task-manifest.json`。
23. review loop 必须有 attempt 上限和 stall reroute；不能靠无限 review 掩盖需求仍不清楚。
24. Roadmap Sync Gate 必须在退出前闭合：source RM 存在就回写 `devflow/roadmap.json` 并重新生成 `devflow/ROADMAP.md` / `devflow/BACKLOG.md`；不存在就记录 no-op reason。

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
- TDD phase：`red` / `green` / `refactor` / `exception`
- Vertical slice / tracer bullet
- Test seam / public interface
- Behavior asserted
- Mock boundary
- Feedback loop type
- 涉及文件
- 验证方式
- 完成证据

行为变更任务必须先有 `[TEST]` 红灯任务，再有 `[IMPL]` 绿灯任务，最后有 `[REFACTOR]` 或明确 refactor checkpoint。纯文档、纯配置、纯生成文件、throwaway prototype 可以例外，但必须写明原因、风险和替代验证。
不要把计划拆成水平层：一批测试、一批服务、一批 UI。每个切片完成后都应该能证明一个真实行为。

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
10. Domain language / spec decision conflict scan
11. Interface depth scan
12. Test seam / mock boundary scan
13. Tracer bullet scan
14. Source trust boundary scan
15. External conflict scan
16. Ambiguity gate
17. Bounded review loop
18. NOT in scope
19. Test-first readiness
20. Final recommendation

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
