---
name: flow-restart
description: 'Recover interrupted requirement work from current artifacts. Usage: /flow:restart "REQ-123" [--from=init|spec|dev|verify|prepare-pr|release]'
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  recover: .claude/scripts/recover-workflow.sh
  generate_status: .claude/scripts/generate-status-report.sh
---

# Flow-Restart - 中断恢复命令

## 定位

恢复优先读取现有工件，而不是重新猜。

优先级：

1. `devflow/intent/<REQ>/resume-index.md`
2. `devflow/requirements/<REQ>/harness-state.json`
3. `devflow/requirements/<REQ>/task-manifest.json`
4. `devflow/requirements/<REQ>/report-card.json`

## User Input

```text
$ARGUMENTS = "REQ_ID [--from=stage] [--force] [--backup]"
```

## 支持阶段

```text
init | spec | dev | verify | prepare-pr | release
```

阶段别名：

- `planning -> spec`
- `development -> dev`
- `qa|quality -> verify`

## 执行流程

### 1. 检测

1. 校验 `REQ_ID`
2. 读取当前恢复工件
3. 若 `resume-index.md` 存在，优先采用其中的 `当前阶段` 和 `下一步唯一动作`
4. 若用户显式指定 `--from`，以用户指定为准

### 2. 清理

- `init`: 清理损坏的初始化残留
- `spec`: 重建 planning 输入，必要时重新生成 manifest
- `dev`: 使用 `/flow:dev --resume`
- `verify`: 重新跑 quality gates
- `prepare-pr`: 重建 `pr-brief.md`
- `release`: 重新检查 `report-card` 和 `RELEASE_NOTE`

### 3. 输出下一步

- `init` -> `/flow:init "REQ_ID|TITLE|URLS?"`
- `spec` -> `/flow:spec "REQ_ID"`
- `dev` -> `/flow:dev "REQ_ID" --resume`
- `verify` -> `/flow:verify "REQ_ID" --strict`
- `prepare-pr` -> `/flow:prepare-pr "REQ_ID"`
- `release` -> `/flow:release "REQ_ID"`

## 输出

- 可选 `backup/` 目录
- 恢复建议

## 建议

若需求本身已经很复杂，优先直接：

```text
/flow:autopilot "REQ-123|继续当前自动驾驶" --resume
```
