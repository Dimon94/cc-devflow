---
name: flow-init
description: 'Initialize a requirement with harness state and context package. Use when starting a new REQ/BUG and preparing deterministic execution context for the next stages.'
---

# Flow-Init Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

初始化需求目录的 harness 运行状态，并生成可执行上下文包。

## Long-Running Harness Protocol（Initializer/Worker/Done Gate）

为与 `/core:*` 保持一致，`/flow:init` 也采用会话分层协议。

### Initializer Session（为后续窗口建立可恢复上下文）

在执行 `harness:init + harness:pack` 后，确保以下工件存在：
- `devflow/requirements/${REQ_ID}/session-checklist.json`
  - 至少包含 `flow:init/flow:spec/flow:dev/flow:verify/flow:release` 五个阶段，默认 `passes=false`
- `devflow/requirements/${REQ_ID}/session-progress.md`
  - 记录本窗口完成内容、风险和阻塞
- `devflow/requirements/${REQ_ID}/session-handoff.md`
  - 明确下一窗口唯一优先动作（通常是 `/flow:spec "${REQ_ID}"`）

### Worker Session（只做 init 的原子闭环）

每次仅执行一个最小闭环：
1. 读取 `session-progress.md` 与 `session-handoff.md`
2. 运行 `harness:init`
3. 运行 `harness:pack`
4. 验证产物并更新 session 工件

### Done Gate（禁止口头完成）

仅当以下条件同时满足才允许标记 `flow:init` 为完成：
- `harness-state.json.status == "initialized"`
- `context-package.md` 存在且包含 Next Commands
- `session-checklist.json` 中 `flow:init.passes == true`

## Input Format

```bash
/flow:init "REQ_ID|TITLE|PLAN_URLS?"
```

- `REQ_ID`: `REQ-123` 或 `BUG-123`
- `TITLE`: 需求标题
- `PLAN_URLS`: 可选，逗号分隔

## Execution Steps

1. 解析输入，提取 `REQ_ID`、`TITLE`、`PLAN_URLS`。

2. **读取项目级 specs/ 了解当前系统状态**（v4.3 新增）：
   - 读取 `devflow/specs/README.md` 了解模块结构
   - 扫描 `devflow/specs/*/spec.md` 识别相关模块
   - 记录当前系统状态到上下文

3. 组装 goal 文本：
   - `Deliver <REQ_ID>: <TITLE>`
   - 若有 URL，追加 `Sources: <URLS>`。

4. 运行初始化：

```bash
npm run harness:init -- --change-id "${REQ_ID}" --goal "${GOAL}"
```

5. 运行上下文打包：

```bash
npm run harness:pack -- --change-id "${REQ_ID}" --goal "${GOAL}"
```

6. **生成 proposal.md**（v4.3 新增，替代 PRD.md）：
   - 基于 TITLE 和 PLAN_URLS 生成 proposal.md
   - 格式：Why（为什么需要）+ What（要做什么）
   - 使用 `.claude/docs/templates/PROPOSAL_TEMPLATE.md`
   - 输出到 `devflow/requirements/${REQ_ID}/proposal.md`

7. **创建 specs/ 目录**（v4.3 新增）：
   - 创建 `devflow/requirements/${REQ_ID}/specs/` 目录
   - 准备存放 Delta spec.md

8. 验证输出文件：
   - `devflow/requirements/${REQ_ID}/harness-state.json`
   - `devflow/requirements/${REQ_ID}/context-package.md`
   - `devflow/requirements/${REQ_ID}/proposal.md` ⭐ 新增
   - `devflow/requirements/${REQ_ID}/specs/` 目录存在 ⭐ 新增

## Exit Criteria

- `harness-state.json.status == "initialized"`
- `context-package.md` 存在并包含 Next Commands 段落
- `proposal.md` 存在且包含 Why 和 What 章节 ⭐ v4.3 新增
- `specs/` 目录已创建 ⭐ v4.3 新增

## Next Step

```bash
/flow:spec "${REQ_ID}"
```
