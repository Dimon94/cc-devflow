---
name: flow-release
description: 'Release a verified requirement and run runtime cleanup. Use only after flow-verify has passed.'
---

# Flow-Release Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

在验证通过后生成发布说明并标记需求为 released，同时执行 runtime 清理。

规则：

- `flow:release` 只处理 release-note 与 runtime janitor
- 如果需要 PR-ready 交付材料，先执行 `/flow:prepare-pr`

## Input Format

```bash
/flow:release "REQ_ID" [--janitor-hours N]
```

- `janitor-hours` 默认 `72`

## Execution Steps

1. 检查 `report-card.json`：
   - `overall` 必须为 `pass`

2. 运行发布：

```bash
npm run harness:release -- --change-id "${REQ_ID}"
```

3. 运行熵清理：

```bash
npm run harness:janitor -- --hours ${HOURS}
```

4. 验证输出：
   - `devflow/requirements/${REQ_ID}/RELEASE_NOTE.md`
   - `devflow/requirements/${REQ_ID}/harness-state.json` 中 `status == "released"`

## Exit Criteria

- 发布文件存在且状态为 released
- janitor 执行成功

## Next Step

- 进入 PR / merge 流程（仓库策略处理）
