---
name: flow-release
description: 'Release a verified requirement and run runtime cleanup. Use only after flow-verify has passed.'
---

# Flow-Release Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

在验证通过后生成发布说明并标记需求为 released，同时执行 runtime 清理。

## Input Format

```bash
/flow:release "REQ_ID" [--janitor-hours N]
```

- `janitor-hours` 默认 `72`

## Execution Steps

1. 检查 `report-card.json`：
   - `overall` 必须为 `pass`

2. **合并 Delta specs 到项目级 specs/**（v4.3 新增）：
   - 检测 `devflow/requirements/${REQ_ID}/specs/` 目录
   - 遍历所有模块的 Delta spec.md
   - 调用 `delta-parser.ts merge` 合并到 `devflow/specs/{module}/spec.md`
   - 自动更新项目级 spec.md 的版本号和时间戳
   - 记录合并结果到 RELEASE_NOTE.md

3. 运行发布：

```bash
npm run harness:release -- --change-id "${REQ_ID}"
```

4. 运行熵清理：

```bash
npm run harness:janitor -- --hours ${HOURS}
```

5. 验证输出：
   - `devflow/requirements/${REQ_ID}/RELEASE_NOTE.md`
   - `devflow/requirements/${REQ_ID}/harness-state.json` 中 `status == "released"`
   - 项目级 `devflow/specs/{module}/spec.md` 已更新版本号 ⭐ v4.3 新增

## Exit Criteria

- 发布文件存在且状态为 released
- Delta specs 已成功合并到项目级 specs/ ⭐ v4.3 新增
- 项目级 spec.md 版本号已更新 ⭐ v4.3 新增
- janitor 执行成功

## Next Step

- 进入 PR / merge 流程（仓库策略处理）
