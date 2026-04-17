# CC-Check Playbook

## Visible State Machine

`cc-do -> cc-check -> cc-act`

- Enter from: closed implementation work with fresh runtime evidence.
- Stay in: `cc-check` while verdict is being rebuilt from current commands and review proof.
- Exit to: `cc-act` only when the verdict is `pass` with `reroute=none`.
- Reroute to: `cc-do` for code fixes, `cc-investigate` for root-cause invalidation, or `cc-plan` for design invalidation.

## First Verdict Test

开始前只问 3 件事：

1. 我手里有没有本次新鲜证据？
2. 这些证据是在证明失败，还是只是在暴露缺件？
3. 如果现在不能 `pass`，下一步应该回 `cc-do`、`cc-investigate` 还是 `cc-plan`？

先答完这三题，再跑完整 gate；不要一边验证一边发明 verdict。

## Gate Function

在宣称任何“完成、通过、ready”之前，必须做 4 件事：

1. 找到证明这个结论的命令
2. 重新运行完整命令
3. 读取真实输出和退出码
4. 把证据写进 `report-card.json`
5. 把任务级 review 与需求级 diff review 分开写清楚

## Verdict

只允许 3 种结论：

- `pass`
- `fail`
- `blocked`

速判规则：

1. 命令或 review 明确失败 => `fail`
2. 条件缺失、证据不足、review 缺件 => `blocked`
3. 只有当 gate 和 review 都过，才是 `pass`

## Minimum `report-card.json`

```json
{
  "changeId": "REQ-123",
  "verdict": "pass",
  "overall": "pass",
  "summary": "one-line reality",
  "quickGates": [],
  "strictGates": [],
  "review": {
    "status": "pass",
    "summary": "",
    "details": "",
    "taskReviews": { "status": "pass", "required": true, "summary": "", "reviewers": [], "findings": [] },
    "diffReview": { "status": "skipped", "required": false, "summary": "", "reviewers": [], "findings": [] },
    "findings": []
  },
  "blockingFindings": [],
  "reroute": "none",
  "timestamp": "2026-04-15T12:00:00.000Z"
}
```

`reroute` 只能是 `none`、`cc-do`、`cc-investigate`、`cc-plan`。

## Reroute Rules

- 实现没做完、测试没过、review 提出明确修复项 => `cc-do`
- 根因站不住、复现链断了、当前修复只是症状补丁 => `cc-investigate`
- 范围错了、设计前提失效、当前计划已经不可信 => `cc-plan`
- 只有 `pass` 才能写 `none`

## Local Kit

- `assets/REPORT_CARD_TEMPLATE.json` 提供最小输出形状
- `scripts/run-quality-gates.sh` 跑真实命令
- `scripts/render-report-card.js` 根据 gate 结果、review 结果和 manifest 生成 `report-card.json`
- `scripts/verify-gate.sh` 检查证据和文件是否齐全
- `references/review-contract.md` 说明任务级 / 需求级审查责任边界

## Dry-Run Checklist

真正落盘前，快速过这 5 问：

1. 我写下的 summary 能不能让 reviewer 一眼看懂现在卡在哪？
2. `blockingFindings` 是不是具体到可行动？
3. `reroute` 是不是和失败类型一致？
4. `review.status` 是真实现实，还是我脑补的绿色？
5. 如果把这份 `report-card.json` 给下一位接手者，他知道接下来去哪吗？
