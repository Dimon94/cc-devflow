---
name: flow-upgrade
description: 'Requirement change-impact and replanning workflow. Usage: /flow:upgrade "REQ-123" --analyze or /flow:upgrade "REQ-123" --reason="..."'
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  manage_constitution: .claude/scripts/manage-constitution.sh
  validate_constitution: .claude/scripts/validate-constitution.sh
  impact_analyzer: .claude/scripts/analyze-upgrade-impact.sh
---

# Flow-Upgrade - 需求升级与重规划

## 定位

`/flow:upgrade` 的语义是：已有需求方向变更后，先分析影响，再决定是否重新收敛计划。

推荐顺序：

1. 方向仍模糊 -> `/flow:autopilot --resume`
2. 变更已清晰 -> `/flow:upgrade --analyze`
3. 需要重新执行 -> `/flow:spec` / `/flow:dev` / `/flow:verify`

## User Input

```text
$ARGUMENTS = "REQ_ID [--analyze] [--reason='...'] [--compare=baseline] [--compatibility]"
```

## 执行流程

### 1. Entry Gate

1. 校验 `REQ_ID`
2. 读取现有事实：
   - `devflow/intent/<REQ>/plan.md`
   - `devflow/intent/<REQ>/decision-log.md`
   - `task-manifest.json`
   - `report-card.json`
### 2. Analyze

1. 比较“当前目标”与“新增变更”
2. 输出影响分析：
   - 是否需要重跑 planning
   - 是否影响已完成任务
   - 是否导致验证/PR-ready 工件过期
3. 推荐下一步：
   - 小变更 -> `/flow:spec --overwrite`
   - 执行中断续 -> `/flow:dev --resume`
   - 方向明显变化 -> `/flow:autopilot --resume`

### 3. Deep Compare

当需要更强的差异分析时：

- 可以使用 `--compare=baseline` 或 `--compatibility`
- 结果仍需回写到 `plan.md / decision-log.md / task-manifest.json`

## 输出

- 升级影响摘要
- 推荐动作
- 必要时写入 decision log / resume 指引
