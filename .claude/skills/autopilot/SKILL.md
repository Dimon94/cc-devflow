---
name: autopilot
description: 'Run CC-DevFlow in skill-first autopilot mode: clarify a vague goal, write Markdown memory, approve a plan, then drive direct/delegate/team execution with resume and verification evidence.'
---

# Autopilot Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

把模糊目标和聊天记录收敛成可执行计划，并在计划批准后进入自动驾驶。`autopilot` 不替代 `flow-init / flow-spec / flow-dev / flow-verify / flow-release`，而是把它们收束成一个 agent-first、可恢复、可委派的总协议。

## Position

- 默认入口：需求模糊、聊天很多、希望系统先想清再自动推进时使用
- 主叙事：`skill-first + protocol-first + markdown-first`
- 默认执行梯：`direct -> delegate -> team`
- Team 不是默认值，只在 direct 和 delegate 不够时升级

## Input Format

```bash
/flow:autopilot "REQ_ID|模糊目标"
/flow:autopilot "REQ_ID|模糊目标" --resume
/flow:autopilot "REQ_ID|模糊目标" --from=discover
```

## Required Artifacts

工作目录建议为 `devflow/intent/${REQ_ID}/`。

最小工件集：

- `summary.md`
- `facts.md`
- `decision-log.md`
- `plan.md`
- `delegation-map.md`
- `resume-index.md`
- `artifacts/`
- `checkpoints/`

规则：

- 记忆默认写 Markdown
- 日志默认 append-only
- 机器 schema 只给 harness/runtime 用，不作为主要阅读介质

## State Machine

### 1. discover

目标：
- 吃进模糊目标、聊天记录、仓库上下文
- 产出第一版 `summary.md` 和 `facts.md`

要求：
- 明确写出 `已确认 / 待确认 / 已否定`
- 不直接开始编码

### 2. converge

目标：
- 挑战模糊点
- 收敛计划
- 生成 `plan.md`

要求：
- 每个关键决策追加到 `decision-log.md`
- `plan.md` 未获批准前，不得进入自动执行

### 3. delegate

目标：
- 决定当前用 `direct`、`delegate` 还是 `team`
- 生成或刷新 `delegation-map.md`

调度准则：
- 小任务、低风险、上下文短：`direct`
- 任务边界清晰、可并行：`delegate`
- 跨模块、争议大、多角色判断：`team`

### 4. execute

目标：
- 执行计划中的最小前沿任务
- 调用已有 `flow-*` 原语或 subagent

执行准则：
- 优先复用已有原语，不新造 runtime
- 每个 worker 必须写 `result.md` 或 checkpoint
- 如果上下文开始膨胀，先回写记忆，再继续执行

### 5. verify

目标：
- 聚合测试、lint、review、对抗验证、文档同步证据

要求：
- 没证据不算完成
- 缺失 artifact 直接失败

### 6. document

目标：
- 同步 `CLAUDE.md`、L3 文件头、变更说明、计划状态

要求：
- 发生架构级改动时，立即同步对应 `CLAUDE.md`

### 7. prepare-pr

目标：
- 生成 PR 标题、摘要、验证结论、风险与回滚说明

### 8. resume

目标：
- 从 `resume-index.md + checkpoints/` 恢复

要求：
- 恢复优先看工件，不优先看聊天历史
- 先判断当前阶段，再继续，不重复 discover/converge

## Memory Protocol

### `summary.md`

记录：
- 当前目标
- 目标用户
- 关键约束
- 已达成共识
- 当前阶段

### `facts.md`

固定分区：
- `Confirmed`
- `Open Questions`
- `Rejected`

### `decision-log.md`

每条记录一段，至少包含：
- 时间
- 决策
- 原因
- 影响范围

### `plan.md`

至少包含：
- 目标
- 非目标
- 阶段
- 验收标准
- 风险
- 当前 `plan_version`

### `resume-index.md`

至少包含：
- 当前阶段
- 最近一次成功的 checkpoint
- 待处理 blocker
- 下一步唯一动作

## Delegation Protocol

### Default Ladder

1. `direct`
2. `delegate`
3. `team`

### Team Rules

- Team 是角色分工，不是第二套控制面
- 同类任务优先复用同类角色
- 角色共享记忆层
- 角色通过 append-only bus 沟通
- 主 controller 统一裁决，不允许无限拆分

### Budget Rules

- runtime budget 是硬限制
- 超预算时必须降级、暂停或收束
- 不允许无限派发 subagent/worktree

### Result Rules

- worker 结果必须绑定 `plan_version`
- `plan_version` 过期结果直接拒收
- 只说“完成了”但没写 artifact，视为未完成

## Conflict Protocol

默认：
- AI 自动解决低风险冲突，并写入记录

必须升级人工确认：
- schema / migration
- 删除关键文件
- 发布相关变更
- 权限或公共接口破坏

## Worktree Protocol

- 允许主会话在 worktree 内运行
- controller 可以运行在当前 worktree
- worker 可分配额外 worktree
- 如果 worktree 分配失败，降级为串行执行，但保留全部协议工件

## Exit Criteria

仅当以下条件满足，autopilot 才能声明一次完整交付完成：

- `plan.md` 已批准
- 所有执行任务都有 artifact 证据
- `resume-index.md` 与最近 checkpoint 一致
- 验证通过
- 文档同步完成
- PR 准备材料齐全

## Anti-Patterns

- 直接把聊天记录当状态机
- 默认启动 Team
- 为了调度而新写厚平台
- JSON-first 记忆
- 没有证据的“done”

## Recommended Reuse

- 需求初始化：`flow-init`
- 规格沉淀：`flow-spec`
- 执行：`flow-dev`
- 验证：`flow-verify`
- 发布收尾：`flow-release`

autopilot 是编排协议，不是替代品。
