# REQ-011 Research: Annotation Cycle 融入 CC-DevFlow

> 研究目标: 深度理解文章方法论与 cc-devflow 现有架构的差异,找到最小改造路径

---

## 1. 文章方法论核心解剖

### 1.1 六阶段流水线

```
Research → Plan → Annotate(1-6x) → Todo List → Implement → Feedback
```

关键洞察——这不是六个独立阶段,而是**两个认知域**:

| 认知域 | 阶段 | 产物 | 控制权 |
|--------|------|------|--------|
| 思考域 | Research + Plan + Annotate | research.md, plan.md | 人类主导 |
| 执行域 | Todo List + Implement + Feedback | 代码 | AI 主导 |

**核心原则**: 思考域和执行域之间有一道硬墙——`"don't implement yet"`.

### 1.2 Annotation Cycle 的本质

Annotation Cycle 不是"审批流程",而是**共享可变状态的迭代协议**:

1. AI 写 plan.md (提案)
2. 人类在编辑器中直接修改 plan.md (批注)
3. AI 读取修改后的 plan.md,处理所有批注,更新文档
4. 重复直到人类满意

关键特征:
- **介质是文件,不是聊天**: plan.md 是持久化的,聊天会被压缩
- **批注是内联的**: 人类在具体位置写具体纠正,不是笼统的聊天指令
- **守卫是显式的**: 每次都说 "don't implement yet"
- **批注粒度极端灵活**: 从两个字 "not optional" 到整段重写

### 1.3 Reference Implementation 技巧

文章提到一个高杠杆技巧: 分享参考实现让 AI 基于具体代码设计,而非从零开始.

```
"this is how they do sortable IDs, write a plan.md explaining
how we can adopt a similar approach"
```

### 1.4 Implementation 阶段的特征

一旦进入执行域:
- 单一指令触发全部执行: "implement it all"
- 进度追踪通过 plan.md 中的 checkbox
- 反馈极简: "wider", "still cropped", "2px gap"
- 错误时 revert + 缩小范围,不 patch

---

## 2. CC-DevFlow 现有架构深度分析

### 2.1 当前五阶段流水线

```
/flow:init → /flow:spec → /flow:dev → /flow:verify → /flow:release
```

每个阶段由 harness 引擎驱动:

| 阶段 | Harness Op | 核心产物 | 人类介入点 |
|------|-----------|---------|-----------|
| init | `harness:init` + `harness:pack` | context-package.md, harness-state.json | 无 |
| spec | `harness:plan` | task-manifest.json | 无 (自动从 TASKS.md 编译) |
| dev | `harness:dispatch` / `harness:resume` | 代码 + events.jsonl + checkpoint.json | Ralph Loop (程序化) |
| verify | `harness:verify` | report-card.json | 无 |
| release | `harness:release` + `harness:janitor` | release-note.md | 无 |

### 2.2 Harness 引擎内部机制

**store.js** (241 行) — 核心基础设施:
- 路径解析: `getRequirementDir()`, `getRuntimeTaskDir()` 等
- 文件 I/O: `readText()`, `writeText()`, `readJson()`, `writeJson()`, `appendJsonl()`
- 工具: `runCommand()`, `nowIso()`, `exists()`, `ensureDir()`

**planner.js** (142 行) — TASKS.md → task-manifest.json 编译器:
- 解析 `- [ ] T001 title (path/to/file)` 格式
- 提取 `dependsOn:T002,T003` 依赖标签
- 检测 `[P]` 并行标记
- 隐式依赖链: 无显式 dependsOn 时默认依赖前一个任务
- 输出: 带 status/attempts/maxRetries 的任务对象数组

**operations/init.js** (49 行) — 创建目录 + harness-state.json
**operations/pack.js** (101 行) — 收集 git 事实 → context-package.md
**operations/plan.js** (30 行) — 薄包装,调用 planner.js

### 2.3 flow:init 的实际行为

1. 解析 `"REQ_ID|TITLE|PLAN_URLS?"` 输入
2. `harness:init` → 创建目录 + harness-state.json
3. `harness:pack` → 收集 git branch/commit/status + npm scripts → context-package.md
4. 创建 session-checklist.json / session-progress.md / session-handoff.md

**context-package.md 内容**: git 事实 + 约束列表 + npm scripts + 下一步命令
**缺失**: 没有深度代码阅读,没有 research.md,没有理解证明

### 2.4 flow:spec 的实际行为

1. Entry Gate 检查: REQ 目录存在, BRAINSTORM.md 存在, research.md 存在
2. 执行 `npm run harness:plan` → 从 TASKS.md 编译 task-manifest.json
3. Exit Gate 检查: manifest 存在, 任务非空, 无循环依赖

**关键发现**: entry-gate.sh 已经检查 research.md 是否存在! (第 5 项检查)
但 flow:init 不产出 research.md,这意味着 research.md 是在 init 和 spec 之间手动创建的.

**另一个关键发现**: flow:spec 的 SKILL.md 描述的是 harness:plan 操作,
但 team-config.json 和 parallel-orchestrator.sh 描述了一个完全不同的流程:
PRD → Tech+UI(并行) → Epic. 这两套逻辑共存但不一致.

### 2.5 flow:dev 的实际行为

1. Entry Gate: 检查 TASKS.md/EPIC.md/PRD.md 存在, 状态为 spec_complete
2. 执行 `harness:dispatch` 或 `harness:resume`
3. 依赖感知并行调度,每组任务完成后写 checkpoint/events
4. Exit Gate: 所有任务 passed 或 skipped

**dev-implementer agent**: 强制 TDD Iron Law, 每个任务先写失败测试再实现

### 2.6 Long-Running Harness Protocol

所有阶段共享的会话协议:
- **Session Start**: 读取 session-checklist.json / session-progress.md / session-handoff.md
- **Worker Session**: 最小可执行前沿,每完成一组写 checkpoint
- **Done Gate**: 条件满足才标记完成

这个协议是为**跨窗口恢复**设计的,不是为**人机迭代**设计的.

---

## 3. 差异分析: 四个认知断层

### 断层 1: Research 深度不足

| 维度 | 文章方法 | CC-DevFlow |
|------|---------|-----------|
| 目的 | 证明 AI 理解了系统 | 收集执行上下文 |
| 产物 | research.md (人类可审阅) | context-package.md (机器消费) |
| 内容 | 架构理解、模式识别、潜在冲突 | git 事实、npm scripts、约束 |
| 审阅 | 人类读后纠正误解 | 无审阅环节 |

**现有基础**: entry-gate.sh 已检查 research.md,说明设计意图存在但未实现.

### 断层 2: Annotation Cycle 完全缺失

| 维度 | 文章方法 | CC-DevFlow |
|------|---------|-----------|
| 设计讨论介质 | plan.md (Markdown, 人类可编辑) | task-manifest.json (JSON, 机器消费) |
| 人类判断力注入 | 内联批注 1-6 次 | 无 |
| 守卫机制 | "don't implement yet" | 阶段分离 (命令级) |
| 迭代协议 | 写批注 → AI 更新 → 重复 | 无 |

**这是最大的断层**. task-manifest.json 是 plan 的编译产物,但源码 (plan.md) 不存在.

### 断层 3: Plan 格式不适合人类编辑

planner.js 从 TASKS.md 编译出 task-manifest.json:
```
TASKS.md (Markdown) → planner.js → task-manifest.json (JSON)
```

TASKS.md 是任务列表,不是设计文档. 它缺少:
- 方法说明 (为什么这样做)
- 代码片段 (具体怎么改)
- 权衡考量 (为什么不那样做)
- 文件路径与修改策略

### 断层 4: 实现阶段缺少简短纠正通道

| 维度 | 文章方法 | CC-DevFlow |
|------|---------|-----------|
| 反馈形式 | "wider", "still cropped" | Ralph Loop (程序化验证) |
| 反馈时机 | 每个视觉变更后 | 每组任务完成后 |
| 回滚策略 | git revert + 缩小范围 | --resume 从失败点继续 |

---

## 4. 可复用的现有基础设施

### 4.1 直接可用

| 组件 | 位置 | 复用方式 |
|------|------|---------|
| store.js I/O 函数 | lib/harness/store.js | readText/writeText 读写 plan.md |
| session 协议 | 所有 SKILL.md | session-handoff.md 可指向 plan.md |
| entry-gate research 检查 | flow-spec/scripts/entry-gate.sh | 已检查 research.md 存在 |
| context.jsonl 注入 | 所有 context.jsonl | 增加 plan.md 条目 |
| TASKS.md 解析 | lib/harness/planner.js | plan.md 中的 todo list 可编译为 TASKS.md |

### 4.2 需要新增

| 组件 | 用途 |
|------|------|
| plan.md 模板 | 标准化设计文档格式 |
| `--revise` 标志 | flow:spec 的批注处理模式 |
| `--finalize` 标志 | 从 plan.md 编译 task-manifest.json |
| research 指令增强 | flow:init 的深度阅读指令 |

### 4.3 需要修改

| 文件 | 修改内容 |
|------|---------|
| flow-init/SKILL.md | 增加 research.md 产出要求 |
| flow-spec/SKILL.md | 增加 plan.md 产出 + annotation cycle 协议 |
| flow-spec/context.jsonl | 增加 plan.md 和 research.md 条目 |
| flow/spec.md | 增加 --revise / --finalize 参数 |
| lib/harness/operations/plan.js | 增加从 plan.md 提取 todo → TASKS.md 的路径 |

---

## 5. 风险与约束

### 5.1 不能破坏的东西
- harness 引擎的 init → pack → plan → dispatch → verify → release 链路
- task-manifest.json 的 schema (planner.js + schemas 验证)
- Long-Running Harness Protocol 的 session 机制
- 现有 REQ 的目录结构兼容性

### 5.2 设计约束
- plan.md 必须是 Markdown (人类可编辑)
- task-manifest.json 仍然是执行的单一真相源
- annotation cycle 必须是可选的 (小需求可跳过)
- research.md 的产出不能阻塞自动化流程

### 5.3 开放问题
1. plan.md 中的 todo list 如何与现有 TASKS.md 格式对齐?
   - 选项 A: plan.md 的 todo 直接就是 TASKS.md 格式
   - 选项 B: plan.md 有自己的 todo 格式,finalize 时转换
2. --revise 是独立命令还是 flow:spec 的子模式?
3. research.md 由 flow:init 自动产出还是人类手动触发?

---

## 6. 总结

文章方法论的灵魂是 **plan.md 作为人机共享可变状态 + annotation cycle 作为判断力注入机制**.

CC-DevFlow 的灵魂是 **harness 引擎驱动的确定性流水线 + task-manifest.json 作为执行真相源**.

融合的关键是: **在 harness 流水线中插入一个人类可编辑的设计层 (plan.md),
让它成为 task-manifest.json 的上游源码,而不是替代品**.

```
flow:init → research.md (人类审阅)
    ↓
flow:spec → plan.md (人类批注 1-6x)
    ↓
flow:spec --finalize → TASKS.md + task-manifest.json (机器消费)
    ↓
flow:dev → 代码
```

这保持了 harness 引擎的确定性,同时在关键节点注入了人类判断力.
