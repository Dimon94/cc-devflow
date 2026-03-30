---
name: flow-ideate
description: 'Turn a vague idea into a requirement entrypoint. Usage: /flow:ideate "我想做一个用户管理系统" or /flow:ideate "REQ-123|支持用户下单"'
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  create_requirement: .claude/scripts/create-requirement.sh
  manage_constitution: .claude/scripts/manage-constitution.sh
agent_scripts:
  sh: .claude/scripts/update-agent-context.sh __AGENT__
  ps: scripts/powershell/update-agent-context.ps1 -AgentType __AGENT__
---

# Flow-Ideate - 模糊想法入口

## 定位

`/flow:ideate` 是一个更轻的需求入口，不负责在这里直接展开正式规格和执行链。

- 想法还模糊：推荐转到 `/flow:autopilot`
- 需求已经够清晰：转到 `/flow:init`
- 已有 `REQ-ID` 且只是变更方向：记录增量想法，推荐 `/flow:autopilot --resume` 或 `/flow:upgrade`

## User Input

```text
$ARGUMENTS = "REQ_ID?|IDEA|LINKS?"
```

## 命令格式

```text
/flow:ideate "我想做一个用户管理系统"
/flow:ideate "REQ-123|我想把现有结算流程自动化"
/flow:ideate "|支持用户下单|https://plan.example.com/Q1"
```

## 执行流程

### 1. 输入解析

1. 识别是否已显式提供 `REQ-ID`
2. 提取：
   - 原始目标
   - 关键约束
   - 可用链接
3. 判断当前输入属于：
   - 模糊意图
   - 已可初始化需求
   - 已有需求的方向升级

### 2. 收敛策略

- 模糊意图：
  - 产出简短 `intent-log.md`
  - 推荐 `/flow:autopilot "REQ-XXX|目标描述"`
- 已可初始化需求：
  - 生成 `REQ_ID|TITLE|LINKS`
  - 推荐 `/flow:init`
- 已有需求增量：
  - 在需求目录或 intent 目录中追加想法摘要
  - 推荐 `/flow:autopilot --resume` 或 `/flow:upgrade`

### 3. 输出

- `README.md` 或 `research/intent-log.md` 中保留原始想法摘要
- 若生成新需求目录，只做最小入口准备
- 不在此命令内直接扩展为完整 spec/dev 流程

## 下一步

- 模糊目标：`/flow:autopilot "REQ-123|目标"`
- 已清晰需求：`/flow:init "REQ-123|TITLE|LINKS?"`
- 已有需求变更：`/flow:autopilot "REQ-123|继续当前目标" --resume`
