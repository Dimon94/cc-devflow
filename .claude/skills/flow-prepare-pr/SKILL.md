---
name: flow-prepare-pr
description: 'Generate and refresh pr-brief from verified artifacts. Use after flow-verify passes and before release or manual PR creation.'
---

# Flow-Prepare-PR Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

把验证结果和执行证据收敛成 `pr-brief.md`，作为 review-ready / handoff-ready 的最薄收尾原语。

规则：

- 只复用既有事实源：`task-manifest.json`、`report-card.json`、`devflow/intent/<REQ>/artifacts/results/*.md`
- 这是 PR-ready 文档阶段，不负责创建远端 PR 或再次发明发布流程
- 若验证未通过，先回到 `/flow:verify` 或 `/flow:fix`，不要在这里猜测结论

## Input Format

```bash
/flow:prepare-pr "REQ_ID"
```

## Execution Steps

1. 检查 `devflow/requirements/${REQ_ID}/report-card.json`：
   - 文件存在
   - `overall == "pass"`

2. 运行收尾原语：

```bash
npm run harness:prepare-pr -- --change-id "${REQ_ID}"
```

3. 验证输出：
   - `devflow/intent/${REQ_ID}/artifacts/pr-brief.md`
   - `devflow/intent/${REQ_ID}/resume-index.md`
   - `devflow/intent/${REQ_ID}/decision-log.md`

## Exit Criteria

- `pr-brief.md` 已生成
- `resume-index.md` 的当前阶段进入 `prepare-pr`
- decision log 已记录一次 `prepare_pr_completed`

## Next Step

```bash
/flow:release "${REQ_ID}"
```
