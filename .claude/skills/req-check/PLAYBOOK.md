# Req-Check Playbook

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

## Minimum `report-card.json`

```json
{
  "verdict": "pass",
  "overall": "pass",
  "summary": "one-line reality",
  "evidence": [],
  "gaps": [],
  "reroute": "none"
}
```

`reroute` 只能是 `none`、`req-do`、`req-plan`。

## Local Kit

- `assets/REPORT_CARD_TEMPLATE.json` 提供最小输出形状
- `scripts/run-quality-gates.sh` 跑真实命令
- `scripts/verify-gate.sh` 检查证据和文件是否齐全
- `references/review-contract.md` 说明任务级 / 需求级审查责任边界
