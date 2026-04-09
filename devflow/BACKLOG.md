# Product Backlog: CC-DevFlow

**Updated**: 2026-04-09 北京时间
**Total Items**: 6
**P1 Count**: 3 | **P2 Count**: 2 | **P3 Count**: 1

**Input**:
- RM-015 ~ RM-020 已按新 `/core:roadmap` 口径重排
- 每个候选项都补齐 `human_effort / llm_effort / completeness_score / scope_shape`
- 优先级按新命令模板映射为 P1 / P2 / P3

## Reading Guide

- **Acceptance Criteria**: 说明每个 backlog item 做完以后怎么验收。
- **Completeness**: 不是进度，而是这个 item 当前是否已经被定义成一个完整可交付
  单元，而不是“先做一半，剩下以后补”的 shortcut shard。
- **Scope Shape**:
  - `lake`: 已经适合进入执行
  - `ocean`: 仍需拆解后才能进入执行

## Priority 1 (MVP Must-Have)

_P1 是必须完成的核心功能，没有这些功能，CC-DevFlow 的 vNext 主叙事不会成立。_

### RM-020: Autopilot Minimal Loop

**Status:** Done
**Priority:** P0
**Effort:** LLM 3-4 days | Human 2 weeks
**Quarter:** 2026 Q2
**Dependencies:** existing `autopilot` skill baseline, current `devflow/intent/` artifacts
**Reframed From:** Flow Simplification

- **Description**: 把旧的 Flow Simplification 重写为真正的 autopilot 前门，打通 `discover/converge -> approve -> execute -> checkpoint -> resume -> verify`。
- **Business Value**: 用户第一次真正感知到 CC-DevFlow 的价值，不再来自“命令很多”，而来自“批准计划后系统真的能继续推进，而且能恢复”。

- **Effort**:
  - LLM-Native: 3-4 days
  - Human Baseline: 2 weeks

- **Completeness**: 9/10
- **Scope Shape**: lake
- **Delivery Strategy**: 一次做成完整前门闭环，不再拆成“先加入口、后补恢复、再补验证”的廉价 shortcut。
- **Dependencies**: existing `autopilot` skill baseline, current `devflow/intent/` artifacts
- **Derived From**: `.claude/skills/autopilot/SKILL.md`, office-hours decisions
- **Target Milestone**: M1-Q2-2026
- **Status**: Done

**Acceptance Criteria:**
- [x] `/flow:autopilot` 成为模糊目标的默认入口
- [x] `plan.md` 未获批准前，不能进入 execute
- [x] 批准后可按配置进入 `direct`、`delegate` 或 `team`
- [x] 默认执行梯清晰可见：`direct -> delegate -> team`
- [x] `team` 默认关闭，只有显式配置才升级
- [x] 每次阶段推进都会刷新 `resume-index.md`
- [x] 执行失败时可以回到上一个稳定 checkpoint

**Progress Snapshot (2026-04-09):**

- 已新增显式批准原语 `harness:approve`
- 已把 approval 变成 `harness-state.json.approval` 的单一 runtime truth source
- 已让 `autopilot` 在 `converge` 后停在 approval gate，不再自动滑进 execute
- 已让 `dispatch` / `resume` 共享同一批准闸，避免绕过 autopilot 直接执行
- 已把 `resume-index.md`、`plan.md`、query stage 与 command docs 对齐到新 contract
- 已把恢复入口收敛为 `harness:resume --from-checkpoint stable`，并允许在失败/重试耗尽/依赖阻塞后回到最近稳定 checkpoint

**Technical Notes:**
- Reuse existing `autopilot` skill and `devflow/intent/<REQ>/` artifacts
- Keep harness thin, avoid new orchestrator layer
- State transitions should be explicit in docs and runtime outputs

**Non-Goals:**
- [x] 不为 `team` 单独造第二套控制面
- [x] 不要求一次性统一所有旧 flow 命令实现

---

### RM-016: Verification + TDD Gate

- **Description**: 把 quality gate 升级为 autopilot 的刹车系统，让 verify 以 artifact 证据和 TDD 约束为准，而不是 completion marker。
- **Business Value**: 如果自动执行不被 verify 和 TDD 限制，系统很快会退化成“先写代码，最后补测试”，用户不会信任它。

- **Effort**:
  - LLM-Native: 2-3 days
  - Human Baseline: 1.5 weeks

- **Completeness**: 9/10
- **Scope Shape**: lake
- **Delivery Strategy**: 把 lint/typecheck/tests/artifact completeness 统一收口，并给非 TDD 任务引入显式 `non_tdd_reason`。
- **Dependencies**: RM-020
- **Derived From**: RM-016 research, Constitution Article VI, existing quality gates
- **Target Milestone**: M2-Q2-2026
- **Status**: Backlog

**Acceptance Criteria**:
- [ ] executable dev task 默认 tests-first
- [ ] 非 TDD 任务必须记录 `non_tdd_reason`
- [ ] verify 至少覆盖 tests、lint/typecheck、artifact completeness
- [ ] 没有验证证据时不能宣布完成

---

### RM-018: Global Runtime + Resume Boundary

- **Description**: 把 runtime/cache/learning state 放到 `~/.cc-devflow/`，repo 只保留长期真相源和人机共读工件。
- **Business Value**: 这是“低侵入”和“可恢复”同时成立的关键。不做这一步，repo 会继续被运行态污染，平台目录也会继续膨胀。

- **Effort**:
  - LLM-Native: 3 days
  - Human Baseline: 2 weeks

- **Completeness**: 8/10
- **Scope Shape**: lake
- **Delivery Strategy**: 先定义 repo/runtime truth boundary，再整理 restore precedence，避免“journal、repo、cache、聊天”四处都像真相源。
- **Dependencies**: RM-020
- **Derived From**: RM-018 research, runtime boundary decisions, gstack/superpowers inspiration
- **Target Milestone**: M2-Q2-2026
- **Status**: Backlog

**Acceptance Criteria**:
- [ ] `~/.cc-devflow/` 成为 runtime/cache 默认落点
- [ ] repo 只保留长期真相源和人机共读工件
- [ ] resume 优先读取 repo artifacts
- [ ] 平台目录只保留最薄入口

## Priority 2 (Important)

_P2 是重要配套能力，它们能让主闭环更轻、更稳、更不侵入，但不是前门成立的先决条件。_

### RM-015: Staged Context Injection

- **Description**: 上下文注入改为阶段化、最小化，只让每个阶段拿到真正需要的 intent、facts、plan、spec index 和少量实现参考。
- **Business Value**: 避免 agent 上下文再次膨胀成“什么都塞一点”，让 autopilot 的每一步都更聚焦、更稳定。

- **Effort**:
  - LLM-Native: 2 days
  - Human Baseline: 1.5 weeks

- **Completeness**: 8/10
- **Scope Shape**: lake
- **Delivery Strategy**: 保留 JSONL/profile 这种轻量描述方式，但让它服务于 autopilot 闭环，而不是反过来主导系统设计。
- **Dependencies**: RM-016, RM-018
- **Derived From**: OpenSpec × Trellis proposal, current intent/spec layout
- **Target Milestone**: M3-Q2-2026
- **Status**: Backlog

**Acceptance Criteria**:
- [ ] 不同阶段有明确 context profile
- [ ] 默认只注入当前阶段相关材料
- [ ] intent artifacts 成为默认注入核心
- [ ] 不依赖 repo 新增大量平台专属目录

---

### RM-019: Skill-Packaged Specs & Templates

- **Description**: 通用模板、提示、脚本、自动化逻辑尽量移入 skill assets 或 plugin 侧，repo 只保留项目专属规范与产出。
- **Business Value**: 直接回应“不要侵占用户 `.claude` 等平台目录”的目标，让 CC-DevFlow 更像一个可复用系统，而不是一堆 repo 杂物。

- **Effort**:
  - LLM-Native: 1-2 days
  - Human Baseline: 1 week

- **Completeness**: 8/10
- **Scope Shape**: lake
- **Delivery Strategy**: 先迁通用模板与自动化，再决定哪些项目级规范必须留在 repo，避免“一股脑全局化”。
- **Dependencies**: RM-018
- **Derived From**: `devflow/spec/`, gstack packaging model, superpowers plugin philosophy
- **Target Milestone**: M3-Q2-2026
- **Status**: Backlog

**Acceptance Criteria**:
- [ ] 通用模板优先进入 skill assets 或 plugin 侧
- [ ] repo 只保留项目专属规范
- [ ] 自动化逻辑不再依赖复制大量脚本到用户平台目录
- [ ] 入口配置仍然可发现、可维护

## Priority 3 (Nice-to-Have)

_P3 不是没价值，而是它目前还是 ocean，必须拆解后才能变成真正可执行的 backlog item。_

### RM-017: Delta Specs Engine

- **Description**: 为稳定模块提供 ADDED / MODIFIED / REMOVED 的增量规格跟踪与同步能力。
- **Business Value**: 长期看很有价值，它能提高演化可审计性；但短期它不会比 `RM-020/016/018` 更直接提升用户第一次成功体验。

- **Effort**:
  - LLM-Native: 4-5 days (Phase A only)
  - Human Baseline: 2 weeks+

- **Completeness**: 6/10
- **Scope Shape**: ocean
- **Delivery Strategy**: 不直接执行整项。先拆成 3 个 lakes：
  1. 单模块 delta format
  2. 单模块 sync to SSOT
  3. archive/diff path
- **Dependencies**: RM-015, RM-019
- **Derived From**: OpenSpec delta-spec design
- **Target Milestone**: M4-Q3-2026
- **Status**: Backlog

**Acceptance Criteria**:
- [ ] 先拆成至少一个单模块 delta lake
- [ ] 单模块 delta 能同步到 SSOT spec
- [ ] archive/diff 行为可审计
- [ ] 在拆成 lakes 前不进入 Q2 主闭环

## Dependency Matrix

| RM-ID | Blocks | Blocked By |
|-------|--------|------------|
| RM-020 | RM-016, RM-018, RM-015 | - |
| RM-016 | RM-015, RM-019 | RM-020 |
| RM-018 | RM-015, RM-019 | RM-020 |
| RM-015 | RM-017 | RM-016, RM-018 |
| RM-019 | RM-017 | RM-018 |
| RM-017 | - | RM-015, RM-019 |

## Backlog Management Notes

### 优先级调整指南

**何时提升 P3 -> P2**:
- ocean 已被拆成可执行 lakes
- 不再挤压 Q2 主闭环资源
- 有稳定模块值得先试点

**何时提升 P2 -> P1**:
- 直接影响 autopilot 最小闭环成功率
- 不做就会继续污染 repo 或让恢复失效
- 用户第一体验明显受损

**何时降低优先级**:
- 只是“看起来更完整”，但不提高闭环价值
- 仍然停留在抽象平台工程
- scope_shape 实际上已经膨胀成 ocean

### Definition of Ready

一个 backlog item 准备好进入开发的标准：
- [ ] Description 清晰
- [ ] Business Value 已明确
- [ ] LLM-Native 与 Human Baseline Effort 已评估
- [ ] Completeness 已达到可接受阈值，或说明为何暂不提升
- [ ] 如果是 ocean，已经拆成可执行 lakes 或明确写出拆分计划
- [ ] Dependencies 已识别并满足
- [ ] Target Milestone 已明确
- [ ] 用户已确认方向

### Definition of Done

一个 backlog item 被认为完成的标准：
- [ ] 通过 `plan -> execute -> verify -> resume` 主链验证
- [ ] executable dev tasks 遵循 TDD，或显式声明 `non_tdd_reason`
- [ ] 所有关键任务都有 artifact 证据
- [ ] 文档与状态边界同步完成
- [ ] 用户验收通过

## Appendix: Reordered RM Sequence

| Execution Order | RM-ID | Why |
|----------------|-------|-----|
| 1 | RM-020 | 先建立真正前门 |
| 2 | RM-016 | 再建立刹车系统 |
| 3 | RM-018 | 再厘清 repo/runtime 边界 |
| 4 | RM-015 | 再压缩上下文负担 |
| 5 | RM-019 | 再把通用能力收束进 skill |
| 6 | RM-017 | 最后拆 ocean 做增量规格 |
