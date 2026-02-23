# REQ-011 Plan: Annotation Cycle 融入 CC-DevFlow

> **状态**: 已处理批注 (Round 2) — 请再次审阅
> **原则**: 不改 harness 引擎代码,只改 SKILL.md 指令和命令定义

---

## 设计概览

在 harness 流水线中插入一个人类可编辑的设计层:

```
flow:init → research.md (人类审阅)
    ↓
flow:spec "REQ-123"
    ↓ 自动检测状态
    ├─ 无 plan.md → 生成 plan.md,提示审阅
    ├─ 有 plan.md,无 task-manifest → 处理批注,更新 plan.md
    └─ 人类说 "定稿" → 编译 TASKS.md + task-manifest.json
    ↓
flow:dev → 代码
```

核心洞察: plan.md 是源码, task-manifest.json 是编译产物.
人类只编辑源码, 机器只消费编译产物.

**交互设计**: 无需记忆 `--revise` / `--finalize` 等参数.
每次都只用 `/flow:spec "REQ-123"`, AI 根据当前状态自动引导,
用自然语言提示下一步操作.

---

## 决策记录

| # | 问题 | 决策 | 原因 |
|---|------|------|------|
| 1 | 批注格式 | 自由格式 | 最低摩擦,AI 通过 diff 识别变更 |
| 2 | 参考实现注入 | 双通道: `--ref` 参数 + research.md 手写 | 灵活性最大化 |
| 3 | 任务清单格式 | 与 TASKS.md 完全一致 | 直接复制,零转换风险 |
| 4 | 深度研究工具 | MCP 全家桶: WebFetch + Context7 + Grep/Glob | 按需求自动选择 |
| 5 | 外部文档链接 | 必须保留原始 URL | 可追溯性,后续会话可查阅验证 |

---

## 改造 1: flow:init 增加深度研究

### 文件: `.claude/skills/workflow/flow-init/SKILL.md`

在 "Execution Steps" 第 5 步之后增加第 6 步:

```markdown
6. 深度研究 — 产出 research.md:
   a. 读取 context-package.md 获取目标和约束
   b. 外部文档研究 (按需求自动选择工具):
      - 如果有 PLAN_URLS → 用 WebFetch 抓取外部文档
      - 如果涉及第三方库 → 用 Context7 (resolve-library-id + query-docs) 获取最新文档
      - 如果涉及 API/协议 → 用 WebSearch 搜索官方文档
      - ⚠️ 所有外部文档必须保留原始 URL,格式: [标题](URL)
   c. 内部代码研究:
      - 用 Grep/Glob 搜索仓库中与需求相关的现有代码
      - 识别: 可复用的模块、潜在冲突点、现有模式
   d. 写入 `devflow/requirements/${REQ_ID}/research.md`
   e. 提示人类: "research.md 已生成,请审阅确认理解是否正确"
```

在 "Exit Criteria" 增加:
```markdown
- `research.md` 存在且非空
```

在 "Done Gate" 增加:
```markdown
- `research.md` 存在且包含至少 "架构理解" 和 "可复用代码" 两个章节
```

### research.md 模板

```markdown
# ${REQ_ID} Research

## 架构理解
{AI 对相关模块的理解,人类审阅后纠正误解}

## 现有模式
{仓库中可复用的代码模式和约定}

## 可复用代码
{具体文件路径 + 函数名 + 复用方式}

## 外部参考
{通过 MCP 工具获取的第三方文档摘要、API 规范等}
{⚠️ 必须保留原始 URL,格式: [文档标题](原始链接) — 摘要内容}

## 风险与冲突
{潜在的架构冲突、依赖问题、破坏性变更}
```

### 不改的东西
- harness:init 和 harness:pack 代码不动
- context-package.md 格式不动
- session 协议不动

---

## 改造 2: flow:spec 状态驱动 + Annotation Cycle

### 核心设计: 状态机,不是命令参数

`/flow:spec "REQ-123"` 每次执行时,AI 检测当前状态并自动选择行为:

```
┌─────────────────────────────────────────────────┐
│ /flow:spec "REQ-123"                            │
│                                                 │
│ 检测: plan.md 存在?                             │
│   ├─ 否 → Phase 1: 生成 plan.md                │
│   └─ 是 → 检测: 人类说了 "定稿/finalize/go"?   │
│       ├─ 否 → Phase 2: 读取并处理批注          │
│       └─ 是 → Phase 3: 编译 TASKS.md + manifest│
└─────────────────────────────────────────────────┘
```

### 文件: `.claude/skills/workflow/flow-spec/SKILL.md`

重写 Execution Steps:

```markdown
## Execution Steps

### Phase 1: 生成设计文档 (plan.md 不存在时)

1. 读取 research.md + context-package.md
2. 如果命令包含 `--ref <path>`,读取参考实现代码
3. 如果 research.md 中 "可复用代码" 章节包含参考路径,也读取
4. 基于上下文生成 `devflow/requirements/${REQ_ID}/plan.md`
   - 使用 PLAN_TEMPLATE.md 模板
   - 任务清单格式必须与 TASKS.md 完全一致
5. **不运行 harness:plan**
6. 输出引导:

   ```
   ✅ plan.md 已生成: devflow/requirements/${REQ_ID}/plan.md

   📝 下一步:
   1. 在编辑器中打开 plan.md 审阅
   2. 直接修改文档 — 删除、重写、添加备注,任何格式都行
   3. 改完后回来告诉我 "处理批注" 或 "revise"

   ⚡ 如果计划已经完美,直接说 "定稿" 或 "finalize"
   ```

### Phase 2: 处理批注 (plan.md 存在,人类要求修订)

触发词: "处理批注" / "revise" / "更新 plan" / 或任何暗示修改 plan 的指令

1. 读取 plan.md (人类已修改)
2. 自由格式识别: 对比上下文理解人类的修改意图
3. 逐一处理所有修改,更新 plan.md
4. **不运行 harness:plan**
5. 输出引导:

   ```
   ✅ 批注已处理,plan.md 已更新

   📝 下一步:
   1. 再次审阅 plan.md
   2. 继续修改,或说 "定稿" 进入实现

   ⚡ 满意了就说 "定稿" 或 "finalize"
   ```

### Phase 3: 定稿编译 (人类确认完成)

触发词: "定稿" / "finalize" / "go" / "implement" / "开始实现"

1. 读取 plan.md 中的 "## 任务清单" 章节
2. 将任务清单直接写入 `devflow/requirements/${REQ_ID}/TASKS.md`
3. 运行 `npm run harness:plan -- --change-id "${REQ_ID}" --overwrite`
4. 校验 task-manifest.json
5. 输出引导:

   ```
   ✅ 定稿完成
   - TASKS.md: N 个任务
   - task-manifest.json: 已生成

   🚀 下一步: /flow:dev "${REQ_ID}"
   ```

### 向后兼容

`/flow:spec "REQ-123" --overwrite` 行为不变:
直接运行 harness:plan,跳过 plan.md 流程.
适用于小需求或已有 TASKS.md 的场景.
```

### plan.md 模板

```markdown
# ${REQ_ID} Plan

> **状态**: 待审阅
> **需求**: ${TITLE}
> **参考**: research.md

## 方法

{整体实现策略,为什么选择这个方案,权衡了什么}

## 关键设计决策

### 决策 1: {标题}
- **选项 A**: {描述} — {优劣}
- **选项 B**: {描述} — {优劣}
- **选择**: {选项 X},因为 {原因}

## 代码变更

### {文件路径}
{修改策略}
```{language}
{关键代码片段}
```

### {文件路径}
{修改策略}

## 任务清单

- [ ] T001 {任务标题} ({触及文件})
- [ ] T002 {任务标题} dependsOn:T001 ({触及文件})
- [ ] T003 {任务标题} [P] ({触及文件})

## 开放问题

{需要人类决策的问题,用 `[NEEDS DECISION]` 标记}
```

---

## 改造 3: 命令入口更新

### 文件: `.claude/commands/flow/spec.md`

```markdown
## Usage

```bash
/flow:spec "REQ-123"                    # 自动检测状态: 生成/修订/定稿
/flow:spec "REQ-123" --ref src/module/  # 带参考实现生成 plan
/flow:spec "REQ-123" --overwrite        # 跳过 plan.md,直接编译 (向后兼容)
```

## Annotation Cycle 引导

命令执行后会自动提示下一步操作,无需记忆参数:
- 首次运行 → 生成 plan.md → 提示 "在编辑器中审阅"
- 人类说 "处理批注" → 更新 plan.md → 提示 "继续审阅或定稿"
- 人类说 "定稿" → 编译 TASKS.md + task-manifest.json → 提示 "/flow:dev"
```

---

## 改造 4: 上下文注入更新

### 文件: `.claude/skills/workflow/flow-spec/context.jsonl`

增加两行:

```jsonl
{"file": "devflow/requirements/{REQ}/research.md", "reason": "Deep research findings"}
{"file": "devflow/requirements/{REQ}/plan.md", "reason": "Human-annotated design plan", "optional": true}
```

### 文件: `.claude/skills/workflow/flow-dev/context.jsonl`

增加一行:

```jsonl
{"file": "devflow/requirements/{REQ}/plan.md", "reason": "Design decisions and rationale", "optional": true}
```

---

## 改造 5: 模板文件

### 新文件: `.claude/skills/workflow/flow-spec/assets/PLAN_TEMPLATE.md`

内容即上面 "plan.md 模板" 章节.

### 新文件: `.claude/skills/workflow/flow-init/assets/RESEARCH_TEMPLATE.md`

内容即上面 "research.md 模板" 章节.

---

## 不改的东西 (明确列出)

| 组件 | 原因 |
|------|------|
| lib/harness/planner.js | 它已经从 TASKS.md 编译,plan.md 的 todo 写入 TASKS.md 即可 |
| lib/harness/operations/plan.js | 薄包装,不需要改 |
| lib/harness/operations/pack.js | context-package.md 格式不变 |
| lib/harness/store.js | 不需要新路径函数 |
| lib/harness/schemas.js | manifest schema 不变 |
| flow-dev SKILL.md | 执行逻辑不变,只是 context 多了 plan.md |
| flow-verify / flow-release | 完全不涉及 |
| entry-gate.sh / exit-gate.sh | 不需要改 (spec 的 entry-gate 已检查 research.md) |

---

## 文件变更清单

| 操作 | 文件 | 变更量 |
|------|------|--------|
| 修改 | `.claude/skills/workflow/flow-init/SKILL.md` | +20 行 (深度研究 + MCP 工具) |
| 修改 | `.claude/skills/workflow/flow-spec/SKILL.md` | 重写 (~90 行, 状态机 + 引导) |
| 修改 | `.claude/commands/flow/spec.md` | 重写 (~25 行, 简化用法 + 引导说明) |
| 修改 | `.claude/skills/workflow/flow-spec/context.jsonl` | +2 行 |
| 修改 | `.claude/skills/workflow/flow-dev/context.jsonl` | +1 行 |
| 新增 | `.claude/skills/workflow/flow-spec/assets/PLAN_TEMPLATE.md` | ~40 行 |
| 新增 | `.claude/skills/workflow/flow-init/assets/RESEARCH_TEMPLATE.md` | ~25 行 |

总计: 修改 5 个文件, 新增 2 个文件. 零 JS 代码变更.
