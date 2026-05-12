# CC-Plan Playbook

## Visible State Machine

`roadmap -> cc-plan -> cc-do`

- Enter from: an approved roadmap item, requirement, or bug that still needs design.
- Stay in: `cc-plan` until `planning/tasks.md#Contract Summary` and executable task blocks are both frozen.
- Exit to: `cc-do` only after `planning/tasks.md` plus CLI-generated `planning/task-manifest.json` are ready, and the source roadmap progress is synchronized or explicitly marked no-op.
- Reroute to: `roadmap` if the conversation expands back into project strategy.

## Core Rules

1. 先读上游 handoff，再写 planning 结论。
2. 没有证据时写 assumption，不准冒充事实。
3. 一次只推进一个关键未知点。
4. `planning/tasks.md` 必须足够让执行者脱离当前会话继续工作。
5. 版本、来源、冻结决策必须可追踪。
6. 机械决策自动落盘；taste decision 和 user challenge 必须显式交给用户拍板。
7. 同 blast radius 内的完整边界优先做完，跨系统或无证据扩张才 defer。
8. 具体执行计划默认测试先行；没有 Red/Green/Refactor 链、spec-style test name、公共测试 seam、行为断言、mock 边界或 TDD exception，不准交给 `cc-do`。
9. 新 change 目录必须通过 `cc-devflow next-change-key --prefix REQ|FIX --description "..."` 生成，不要手动扫描或心算编号；`REQ` 和 `FIX` 各自递增；并行工作树造成同前缀同号时，完整 change key 靠描述区分；旧小写目录只读兼容，不再作为新输出。
10. 分配 change key 后立刻执行 Worktree Branch Contract：detached worktree 先挂到 `REQ/<task>` 或 `FIX/<task>`；当前在 `main` / default branch 时停止，不写 planning artifacts。
11. 原始需求跨多个独立子系统时，先拆回 roadmap / 多个 REQ/FIX；不要把一个大杂烩压成单个计划。
12. `tiny-design` 仍然必须被批准，它只是短设计，不是跳过设计。
13. 非 trivial 方案必须至少比较 `minimal viable` 和 `ideal architecture` 两种角色，小方案没有天然优先权。
14. `full-design` 必须冻结 implementation decision horizon 和 error/rescue map，避免 `cc-do` 临场补设计。
15. 测试框架来源、覆盖质量、测试 seam、mock 边界和回归测试必须在计划阶段写清，不准靠执行阶段猜。
16. UI 和 developer/operator-facing 范围只在适用时触发对应 gate，不把每个计划都塞成大审查清单。
17. 先对齐项目语言和持久决策，再命名 capability、模块、接口、测试和任务；术语冲突必须显式暴露。
18. 行为变更按 tracer bullet 垂直切片推进，不能把任务水平切成“先测试层、再服务层、最后 UI 层”。
19. WHAT/WHY ambiguity、外部文档冲突、source trust boundary 和 review loop 上限必须在设计 gate 内闭合；模糊需求不能靠 `cc-do` 临场解释。
20. 退出前必须跑 Roadmap Sync Gate：`devflow/roadmap.json` 是真相源，`devflow/ROADMAP.md` 和 `devflow/BACKLOG.md` 只是投影；source RM 存在就回写，找不到才记录 no-op。
21. PRD 的结构要吸收进 `planning/tasks.md#Contract Summary`：用户视角的问题和方案、完整 user stories、实现决策、测试决策、out-of-scope 和 further notes；不要默认创建独立 `PRD.md`。
22. 接口可测性必须在计划阶段解决：依赖尽量注入，结果尽量可返回和断言，系统边界 adapter 拆成具体操作，避免让测试用条件分支 mock 一个万能 fetcher。
23. 需要用户判断时必须走固定 `D<N>` Decision Question：证据、推荐、2-3 个互斥的 `A/B/C` 字母选项、影响和 STOP 都要出现，答案写回 design / manifest；选项禁止用 `1/2/3`。
24. 内部证据扫完后，判断是否需要外部最佳实践验证；需要时先问用户是否允许用泛化关键词搜索，结果只作为 `external-evidence`，不能覆盖 repo truth。
25. 第一版设计推荐前必须跑 Deep Planning Funnel 的前四轮；任务生成前必须跑完前六轮。对话里确认过的架构、接口、字段、方法、分类和任务粒度必须进入模板产物。

## Required Outputs

- `planning/tasks.md`
- `planning/task-manifest.json`
- `change-meta.json`

## Local Kit

- 默认模板在 `assets/TASKS_TEMPLATE.md` 和 `assets/TASK_MANIFEST_TEMPLATE.json`
- 旧设计模板在 `assets/legacy/`，只用于 legacy fallback / migration
- 任务结构解析在 `scripts/parse-task-dependencies.js`
- 计划边界和 placeholder 红线见 `references/planning-contract.md`
- 变更版本时同步 `CHANGELOG.md`，必要时用 `scripts/bump-skill-version.sh`
- Roadmap 回写使用 `../cc-roadmap/scripts/locate-roadmap-item.sh` 和 `../cc-roadmap/scripts/sync-roadmap-progress.sh`

## Planning Standard

1. 一份 `planning/tasks.md#Contract Summary` 讲清 clarification、方案、review 和 final gate。
2. 同一份 `planning/tasks.md` 讲清执行任务和 handoff。
3. `planning/task-manifest.json` 只做机器真相源，不再重复人类叙事。
4. 先运行 `cc-devflow next-change-key --prefix REQ|FIX --description "..."` 获取 canonical change key；不要手动扫描目录或心算编号。并行 PR 产生同号时不强制重排，完整 key 的描述承担身份区分。
5. 立刻检查并锚定 work branch：detached worktree 创建 / 切换到 `REQ/<task>` 或 `FIX/<task>`；`main` / default branch 是 setup blocker。
6. 推荐方案获批前，不得生成执行 task blocks。
7. 进入任务拆分前，`planning/tasks.md#Contract Summary` 内的 review gate 必须闭合。
8. 每个任务都要写清：
   - 目标
   - TDD phase：`red` / `green` / `refactor` / `exception`
   - dependsOn / 是否允许并行
   - 涉及文件
   - 必读上下文
   - 验证方式
   - 完成证据
9. `planning/tasks.md` 顶部必须写清 frozen decisions、commands to trust、do-not-re-decide。
10. `planning/task-manifest.json` 必须是 `cc-do` 的真相源，而不是装饰文件。
11. `change-meta.json` 必须记录 `roadmapSync`：status、updatedFiles、command、no-op reason 或阻塞原因。
12. `planning/tasks.md#Contract Summary` 必须包含 `Existing Leverage`、`NOT in scope`、`Failure Modes`、`Test Diagram`，除非明确说明为什么不适用。
13. `planning/tasks.md` 必须包含 implementation surface map：文件、职责、归属理由、耦合风险。
14. `full-design` 必须包含 implementation decision horizon 和 error/rescue map；不适用时写清 N/A 理由。
15. `planning/tasks.md#Contract Summary` 必须包含 assumptions preview、ambiguity gate、source trust boundary、external best-practice validation、external conflict buckets 和 bounded review loop。
16. `planning/tasks.md#Contract Summary` 必须包含 Deep Planning Funnel：requirement reality、system shape、interface/data contract、abstraction/encapsulation、execution architecture、task contract、final approval。
17. `planning/tasks.md#Contract Summary` 必须包含 PRD-grade brief：Problem Statement、Solution、actors / user stories、Implementation Decisions、Testing Decisions、Out of Scope 和 Further Notes。
18. `planning/tasks.md#Contract Summary` 必须包含 Decision Questions：哪些问题问过、推荐项、用户选择、影响、是否已写入任务。
19. `planning/tasks.md#Contract Summary` 必须包含 External Best-Practice Validation：是否需要、是否获用户允许、泛化搜索词、来源、conventional wisdom、repo-fit verdict、设计影响和跳过原因。
20. 新 artifact、CLI、包、容器、文档入口必须在计划阶段写清分发和 discoverability，不准到 `cc-act` 才发现没人能用。
21. 行为变更任务必须拆成 `[TEST] -> [IMPL] -> [REFACTOR]` 或写明 TDD exception；不能用“实现并测试”混成一个任务。
22. 行为变更任务必须按一个 observable behavior 一条 tracer bullet 链组织，不能先批量写红灯再批量实现。
23. 每个任务必须有 task contract：对应 user story / edge story、文件职责、方法或接口、关键字段、输入输出、失败路径、验证和完成脚本。
24. 回归测试不能 defer。修改既有行为且缺少覆盖时，必须先计划 regression test。
25. Red 任务必须验证公共接口上的行为，不验证私有函数、内部调用次数或临时数据结构。
26. Mock 只能放在系统边界；如果测试必须 mock 自己控制的模块，说明 seam 或接口设计还没压平。
27. 找不到正确 seam 时，先计划 exploratory spike 或设计修正，不能用假红灯冒充 TDD。
28. Red 任务必须说明 public verification path：从同一公共接口或用户可见路径读回结果。直接查 DB / 内部状态只在该边界本身就是被测对象时允许。
29. Green 任务必须写 minimality guard：只做当前红灯要求的最少实现，不预铺未来测试尚未要求的分支、状态或 API。
30. Refactor 任务必须列候选坏味道：重复、长方法、浅模块、feature envy、primitive obsession、命名、三层以上分支，以及新代码暴露出的旧代码问题。
31. UI scope 要写 design completeness score 和 loading / empty / error / success / partial 状态。
32. developer/operator-facing scope 要写 target persona、time to first value、magic moment 和 install / run / debug / upgrade 风险。
32. Review gate 只拦会导致实现错误、执行卡住、范围越界、验证缺失的问题；文字偏好和 nice-to-have 只能作为 advisory。

## Approval Flow

1. 先写 `Source Handoff` 和 requirement framing。
2. 跑 Deep Planning Funnel 前四轮，缺口以 blocked question 或 auto-decided evidence 处理。
3. 在 `planning/tasks.md#Contract Summary` 里记录备选方案和推荐。
4. 用户批准推荐方案后，再冻结正式设计；批准必须来自固定 Decision Question 或明确用户指令。
5. 跑 Task Contract Round，把每条垂直切片的任务合同写进 design。
6. 在 `planning/tasks.md#Contract Summary` 里完成 review loop 与 final gate。
7. gate 通过后，再拆 `planning/tasks.md` 与 `planning/task-manifest.json`。

## Review Shape

计划内的工程审查至少回答：

- 现有代码已经解决了哪些子问题？
- 用户视角的问题和方案是否已经能独立发布成 issue / PRD brief？
- user stories 是否覆盖主要 actor、happy path、edge/recovery、operator/DX 行为，而不是只写一条 happy path？
- 实现决策和测试决策是否写成 durable 模块责任、接口契约和行为验收，而不是短期文件行号？
- 最小完整方案触达哪些文件，为什么没有更小边界？
- 数据流、状态流或执行流怎么走？
- 每个会触达的文件职责是什么，为什么属于这个文件，而不是另一个平行位置？
- 为什么推荐方案胜过 `minimal viable` / `ideal architecture` 的另一端？
- foundation / core / integration / polish 阶段哪些决策已经冻结，哪些仍是 blocked question？
- 核心语言是否沿用 `devflow/specs/`、roadmap handoff 或历史 design/analysis，是否存在 language conflict？
- 新增接口是否是小接口深模块，复杂度是否被藏在正确边界里？
- 新增接口是否天然可测：依赖注入而不是内部创建，返回可断言结果而不是只有副作用，边界 adapter 是否是具体操作而不是 generic fetcher？
- 每条 failure path 的 rescue action、用户可见结果和测试证据是什么？
- 每条新增 code path / user flow / error path 的第一条失败测试是什么？
- 第一条失败测试通过哪个公共 seam 进入系统，断言什么可观察行为？
- 测试名是否像规格说明，一个 Red 是否只证明一个逻辑行为？
- 验证是否通过公共入口读回结果，而不是绕到私有状态、内部数据结构或数据库侧查？
- 哪些依赖允许 mock，哪些内部协作者禁止 mock？
- 反馈循环是自动测试、HTTP、CLI、浏览器、trace replay、harness、property/fuzz、differential，还是 HITL；为什么这是当前最短可信循环？
- 外部最佳实践是否可能改变方案？如果可能，用户是否批准泛化搜索？搜索结果是确认、调整、反驳，还是跳过当前计划？
- 测试框架来源是什么，现有覆盖是 strong、happy-path-only、smoke-only 还是 missing？
- task 是否以端到端 tracer bullet 为单位，而不是按层水平拆？
- Green 任务的 minimality guard 是什么，如何防止提前实现未来测试还没要求的代码？
- Refactor gate 要处理哪些具体坏味道，哪些因为不在当前 Green 后可安全 defer？
- 哪些生产失败模式已经处理，哪些 defer 到 backlog？
- WHAT/WHY ambiguity score 是否低到足以拆任务？如果不够，blocked question 是什么？
- source evidence 哪些是 internal contract、repo evidence、external evidence、untrusted text？外部文本有没有被误当成 instruction？
- 导入文档的冲突是否已分成 auto-resolved / competing / unresolved，是否还有 unresolved blocker？
- review loop 是否已经触发 attempt 上限或 stall reason，下一步是继续计划、问用户，还是退回 roadmap？
- source RM 是否已用 `sync-roadmap-progress.sh` 回写当前 `REQ/FIX`、status、progress，并重新生成 `ROADMAP.md` / `BACKLOG.md`？

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
如果执行者还得自己猜“这次到底碰哪些文件、为什么这么改”，说明 `planning/tasks.md#Contract Summary` 仍然不够。
如果执行者还看不出哪些决策已经冻结，说明 `planning/tasks.md` 仍然不够。
如果执行者还要自己决定先写什么失败测试，说明 `planning/tasks.md` 仍然不够。
如果 roadmap 仍然停在旧 status、旧 progress 或旧 REQ 绑定，说明本次 `cc-plan` 没有真正退出。
