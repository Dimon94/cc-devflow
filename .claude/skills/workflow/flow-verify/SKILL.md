---
name: flow-verify
description: 'Run layered quick/strict gates and emit report-card for a requirement. Use before release and after major dev changes.'
---

# Flow-Verify Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

执行质量门禁并输出 `report-card.json`，作为发布前唯一准入依据。

## Input Format

```bash
/flow:verify "REQ_ID" [--strict] [--skip-review]
```

## Execution Steps

1. 解析参数。
2. 调用验证引擎：

```bash
npm run harness:verify -- --change-id "${REQ_ID}" [--strict] [--skip-review]
```

3. 读取并检查输出：
   - `devflow/requirements/${REQ_ID}/report-card.json`
   - `overall == "pass"` 才能进入 release

## Gate Model

- Quick Gate（默认）:
  - lint
  - typecheck
  - test
- Strict Gate（`--strict`）:
  - test:integration（如存在）
  - npm audit
  - codex review（可 `--skip-review`）

## Exit Criteria

- `report-card.json` 生成成功
- 若 `overall=fail`，停止发布并修复失败项

## Next Step

```bash
/flow:release "${REQ_ID}"
```
