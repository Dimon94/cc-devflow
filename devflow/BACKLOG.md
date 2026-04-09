# CC-DevFlow vNext Backlog

**Last Updated:** 2026-04-09
**Status:** Draft
**Scope:** RM-015 ~ RM-020 reprioritized around `Autopilot Minimal Loop`

## Backlog Principles

- 先打通主闭环，再做配套能力
- 先解决状态边界，再做更多自动化
- 先把能力移入 skill/runtime，再考虑扩大 repo 侧资产
- executable dev task 默认强制 TDD
- `team` 是 capability，不是 milestone gating item

## Priority Legend

| Priority | Description | Delivery Target |
|----------|-------------|-----------------|
| P0 | 必须形成最小可用闭环 | 2026 Q2 |
| P1 | 为主闭环减负、减侵入 | 2026 Q2-Q3 |
| P2 | 在主闭环稳定后补强 | 2026 Q3 |

## P0: Core Loop

### RM-020: Autopilot Minimal Loop

**Status:** Done
**Priority:** P0
**Effort:** 2 weeks
**Quarter:** 2026 Q2
**Dependencies:** Existing `autopilot` skill baseline
**Reframed From:** Flow Simplification

**Description:**

把旧的“flow simplification”重新定义为真正的用户闭环：

`discover/converge -> approve -> delegate/execute -> checkpoint -> resume -> verify`

这不是再加一个命令，而是把 `autopilot` 从“一个入口”提升为真正的
产品前门，把其余 `flow-*` 命令降为编排原语。

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

**Status:** Draft
**Priority:** P0
**Effort:** 1.5 weeks
**Quarter:** 2026 Q2
**Dependencies:** RM-020
**Reframed From:** Quality Gate Enhancement

**Description:**

把 quality gate 从“流程末端检查”升级为 autopilot 的刹车系统。
verify 的重点不只是 lint/test 是否通过，而是确保自动执行没有滑成
“先写代码，最后补测试”。

**Acceptance Criteria:**

- [ ] executable dev task 默认强制 TDD
- [ ] 非 TDD 任务必须显式记录 `non_tdd_reason`
- [ ] verify pipeline 至少覆盖 lint、typecheck、tests、artifact completeness
- [ ] 缺失验证证据时不能声明完成
- [ ] `resume-index` 能指出最近一次失败 gate 和下一步唯一动作
- [ ] review / challenge / codex review 能作为可选对抗验证接入

**Technical Notes:**

- Integrate with existing quality gates and constitution rules
- Promote TDD from cultural rule to executable gate
- Prefer evidence files over plain-text completion markers

**Non-Goals:**

- [ ] 不要求所有任务都写成重型测试矩阵
- [ ] 不把纯文档/调研任务硬塞进 TDD

---

### RM-018: Global Runtime + Resume Boundary

**Status:** Draft
**Priority:** P0
**Effort:** 2 weeks
**Quarter:** 2026 Q2
**Dependencies:** RM-020
**Reframed From:** Workspace & Session Persistence

**Description:**

重写 runtime 与 repo 的职责边界。

- `~/.cc-devflow/` 保存运行态、缓存、学习记录、临时事件流
- repo 只保留长期真相源：`devflow/intent/`、`ROADMAP`、`BACKLOG`、
  checkpoints、verification evidence

这一步是“低侵入”承诺的关键，不做清楚，后面所有自动化都会继续污染
用户仓库和平台目录。

**Acceptance Criteria:**

- [ ] `~/.cc-devflow/` 成为 runtime state 默认落点
- [ ] repo 内只保留用户和 agent 都值得读的工件
- [ ] 恢复优先级明确：repo artifacts first, runtime support second
- [ ] 平台目录只保留最薄入口，不新增厚资产
- [ ] `workspace` 从“真相源”降级为可读辅助记录
- [ ] 中断恢复路径文档化并可被脚本/skill 复用

**Technical Notes:**

- Align with plugin-style packaging seen in gstack/superpowers
- Avoid repo-local cache growth
- Keep resume contract simple and auditable

**Non-Goals:**

- [ ] 不把所有历史日志都塞回 repo
- [ ] 不要求 workspace/journal 继续担当唯一恢复入口

## P1: Thin Surface

### RM-015: Staged Context Injection

**Status:** Draft
**Priority:** P1
**Effort:** 1.5 weeks
**Quarter:** 2026 Q2-Q3
**Dependencies:** RM-016, RM-018

**Description:**

上下文注入改为阶段化、最小化。不是“把更多东西喂给 agent”，而是让
每个阶段只拿到它真正需要的 intent、facts、plan、spec index 和少量
实现参考。

**Acceptance Criteria:**

- [ ] 不同阶段存在明确的 context profile
- [ ] 自动排除与当前阶段无关的大块上下文
- [ ] intent artifacts 成为默认注入核心
- [ ] context files 可以验证有效性与缺失项
- [ ] 注入策略不依赖 repo 中新增大量平台专属目录

**Technical Notes:**

- Keep JSONL-style context lists if useful, but subordinate to autopilot loop
- Favor reuse of `devflow/spec/` indexes and intent artifacts

**Non-Goals:**

- [ ] 不为了 context injection 再造新规格系统
- [ ] 不默认共享整包项目上下文

---

### RM-019: Skill-Packaged Specs & Templates

**Status:** Draft
**Priority:** P1
**Effort:** 1 week
**Quarter:** 2026 Q2-Q3
**Dependencies:** RM-018
**Reframed From:** Spec Guidelines System

**Description:**

规范目录继续保留，但模板、脚本、自动化提示词尽可能向 skill assets
与 plugin 侧收束，减少用户仓库内与平台规范无关的文件扩张。

**Acceptance Criteria:**

- [ ] 通用模板优先住在 skill assets，而不是 repo 零散目录
- [ ] repo 中只保留项目真的需要长期维护的 spec/guideline
- [ ] skill 可以自带模板与自动化逻辑，不要求用户复制一堆脚本
- [ ] 平台入口保持最薄，只做路由和必要配置

**Technical Notes:**

- Borrow packaging philosophy from gstack and superpowers
- Keep project-specific specs in `devflow/spec/`
- Move reusable automation content toward skills, not user `.claude` sprawl

**Non-Goals:**

- [ ] 不移除 repo 中真正属于项目的规范文档
- [ ] 不追求“所有东西都全局化”

## P2: Change Discipline

### RM-017: Delta Specs Engine

**Status:** Draft
**Priority:** P2
**Effort:** 2 weeks
**Quarter:** 2026 Q3
**Dependencies:** RM-015, RM-019

**Description:**

为稳定后的模块提供增量规格跟踪。它很有价值，但不是短期闭环的第一推动器。
如果现在就把它拉到 P0，很容易重新走回“规格系统先膨胀，执行闭环后补”。

**Acceptance Criteria:**

- [ ] 支持 ADDED / MODIFIED / REMOVED 形式记录增量规格
- [ ] 可以从 delta 同步到 SSOT spec
- [ ] 归档和 diff 行为可审计
- [ ] 不阻塞主环路最小可用版本

**Technical Notes:**

- Reuse OpenSpec-style delta format where helpful
- Defer wide rollout until main loop is stable

**Non-Goals:**

- [ ] 不在第一波交付里覆盖所有模块
- [ ] 不把 delta specs 当作 execute/resume 的前置条件

## Cross-Cutting Decisions Locked By Office-Hours

- [x] `team` 不是必选项，由配置决定是否启用
- [x] executable dev task 默认强制 TDD
- [x] 非 TDD 任务必须显式记录 `non_tdd_reason`
- [x] runtime 和缓存放 `~/.cc-devflow/`
- [x] repo 内只保留有长期价值的 Markdown 工件
- [x] 自动化能力优先进入 skill/plugin，而不是继续扩张用户平台目录

## Draft Rollout Order

1. RM-020
2. RM-016
3. RM-018
4. RM-015
5. RM-019
6. RM-017

## Open Questions

- `~/.cc-devflow/` 的 runtime schema 需要做到多轻，才能既可恢复又不变厚平台？
- `non_tdd_reason` 应该挂在 plan task、manifest task 还是 verify evidence 里，还是三者镜像？
- `team` 的配置入口应该出现在 autopilot plan、repo config，还是全局 runtime config？
