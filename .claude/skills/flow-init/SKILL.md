---
name: flow-init
description: 'Initialize a requirement with harness state and context package. Use when starting a new REQ/BUG and preparing deterministic execution context for the next stages.'
---

# Flow-Init Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

把已收敛的 requirement 接入主链 runtime，并生成最薄 bootstrap context。

规则：

- 目标仍模糊时，优先使用 `/flow:autopilot`
- `/flow:init` 适用于需求已经收敛、只需要进入主链原语时
- `context-package.md` 是 bootstrap bridge artifact，不是长期真相源
- 长期 agent 记忆仍应沉淀在 `devflow/intent/<REQ>/` 的 Markdown memory

## Input Format

```bash
/flow:init "REQ_ID|TITLE|PLAN_URLS?"
```

- `REQ_ID`: `REQ-123` 或 `BUG-123`
- `TITLE`: 需求标题
- `PLAN_URLS`: 可选，逗号分隔

## Execution Steps

1. 解析输入，提取 `REQ_ID`、`TITLE`、`PLAN_URLS`。

2. 组装 goal 文本：
   - `Deliver <REQ_ID>: <TITLE>`
   - 若有 URL，追加 `Sources: <URLS>`。

3. 运行初始化：

```bash
npm run harness:init -- --change-id "${REQ_ID}" --goal "${GOAL}"
```

4. 运行上下文打包：

```bash
npm run harness:pack -- --change-id "${REQ_ID}" --goal "${GOAL}"
```

5. 验证输出文件：
   - `devflow/requirements/${REQ_ID}/harness-state.json`
   - `devflow/requirements/${REQ_ID}/context-package.md`

6. 如果此需求先经过 `/flow:autopilot`：
   - 继续沿用 `devflow/intent/${REQ_ID}/summary.md` / `plan.md`
   - 不要把 `context-package.md` 误当成新的产品记忆中心

## Exit Criteria

- `harness-state.json.status == "initialized"`
- `context-package.md` 存在并包含 Next Commands 段落

## Next Step

```bash
/flow:spec "${REQ_ID}"
```
