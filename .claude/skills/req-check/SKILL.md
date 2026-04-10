---
name: req-check
description: Check-stage skill for CC-DevFlow. Use when a planned change must be verified with tests, quality gates, review evidence, and explicit done criteria.
---

# Req-Check

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Role

`req-check` 是 PDCA 里的 `Check`。

它负责把“应该好了”变成“证据表明它好了”。

## Use This Skill When

- 代码改完，准备验收
- 需要跑测试、lint、类型检查、质量门
- 需要判断 requirement 是否真的完成
- 需要确认是否可以进入交付动作

## Loop

1. 对照 `DESIGN.md`、`TASKS.md`、`task-manifest.json` 验证现实。
2. 失败项必须回指 `req-plan` 或 `req-do`。
3. 只给三种结论：通过、不通过、阻塞。
4. 通过后才允许进入 `req-act`。

## Output

- `report-card.json`
- 验证结果输出
- review 结论

## Working Rules

1. 先验证，再说完成。
2. 失败项必须有明确回退方向。
3. 没有证据，不允许绿灯。
4. 验收只认当前代码现实，不认计划里的自我安慰。

## Exit Criteria

- 验证结论明确
- 失败项已指向 `req-plan` 或 `req-do`
- 通过时下一步唯一答案是 `req-act`

## Do Not

- 不在这里偷偷继续开发
- 不拿“本地感觉没问题”替代结果
- 不把 review 评论当成已经修复
