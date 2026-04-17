---
name: cc-check
version: 1.5.0
description: "Use when a planned or investigated change needs fresh verification evidence, quality gates, review proof, and a clear pass fail blocked verdict."
triggers:
  - "验收这个需求"
  - "帮我确认是否完成"
  - "跑一下质量门"
  - "check this requirement"
  - "verify with evidence"
  - "can this ship"
  - "是不是可以进 cc-act"
reads:
  - "PLAYBOOK.md"
  - "CHANGELOG.md"
  - "references/gate-contract.md"
  - "references/review-contract.md"
  - "assets/REPORT_CARD_TEMPLATE.json"
writes:
  - "report-card.json"
entry_gate:
  - "Read DESIGN.md or ANALYSIS.md, then TASKS.md, task-manifest.json, and the latest runtime evidence before selecting a verdict."
  - "Re-run fresh commands instead of inheriting cc-do narration."
  - "If evidence is stale or missing, reset context and rebuild the verdict from canonical artifacts."
exit_criteria:
  - "report-card.json records pass, fail, or blocked using fresh evidence and honest reroute."
  - "Task-level review and requirement-level diff review are separated clearly."
  - "The next step is unambiguous: cc-act, cc-do, cc-investigate, or cc-plan."
reroutes:
  - when: "The implementation is incomplete, tests fail, or review findings require code changes."
    target: "cc-do"
  - when: "The bug still lacks a trustworthy root cause or the investigation contract is disproven."
    target: "cc-investigate"
  - when: "The plan assumptions, scope, or design contract are invalid."
    target: "cc-plan"
recovery_modes:
  - name: "clean-room-reset"
    when: "The current verdict is contaminated by stale chat memory or old command output."
    action: "Discard narrative memory, reload canonical artifacts, rerun fresh gates, and rebuild report-card.json from current evidence only."
tool_budget:
  read_files: 8
  search_steps: 4
  shell_commands: 6
---

# CC-Check

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、相关模板/脚本引用，然后检查 `CLAUDE.md`

## Role

`cc-check` 是 PDCA 里的 `Check`。

它负责把“应该好了”变成“证据表明它好了”。

## Read First

1. `PLAYBOOK.md`
2. `CHANGELOG.md`
3. `references/gate-contract.md`
4. `references/review-contract.md`

## Use This Skill When

- 代码改完，准备验收
- 需要跑测试、lint、类型检查、质量门
- 需要判断 requirement 是否真的完成
- 需要确认是否可以进入交付动作

如果代码还在继续变、任务还没收口，停下并回 `cc-do`。

## Quick Start

先判断当前现实属于哪一类，再选 verdict：

| 现实状态 | 先读成什么 |
| --- | --- |
| 命令和 review 都齐了，只差最终裁决 | `pass-candidate` |
| 已有明确失败输出或 review finding | `fail-candidate` |
| 关键证据、review、环境、输入缺件 | `blocked-candidate` |

`cc-check` 的第一步不是跑更多形容词，而是先判“我是缺证据，还是有失败，还是已经足够过门”。

## Harness Contract

- Allowed actions: rerun gates, inspect review proof, record a verdict, and route the requirement honestly.
- Forbidden actions: continuing development, inheriting old execution claims without fresh proof, or masking blocked work as pass.
- Required evidence: every passing statement must cite fresh command output, exit status, and key observation.
- Reroute rule: code and review fixes return to `cc-do`; root-cause drift returns to `cc-investigate`; scope or design invalidation returns to `cc-plan`.

## Entry Gate

1. 先读 `DESIGN.md` 或 `ANALYSIS.md`，再读 `TASKS.md`、`task-manifest.json`。
2. 明确本次要验证哪些事实，不做含糊验收。
3. 所有通过结论都必须来自本次新鲜命令输出。
4. 已完成任务必须能拿出 `spec/code` review 证据。

## Loop

1. 对照 `DESIGN.md` 或 `ANALYSIS.md`、`TASKS.md`、`task-manifest.json` 验证现实。
2. 失败项必须回指 `cc-do`、`cc-investigate` 或 `cc-plan`。
3. 只给三种结论：通过、不通过、阻塞。
4. 通过后才允许进入 `cc-act`。
5. 验收至少覆盖两层：任务级 review gate，需求级 diff review gate。

## Verdict Matrix

`cc-check` 不允许“差不多算过”。结论只能从下面这张表里选：

| Verdict | 什么时候用 | reroute |
|---------|------------|---------|
| `pass` | 快速质量门通过，review gate 通过，当前证据足够支持“可以进入 `cc-act`” | `none` |
| `fail` | 命令明确失败，或 review 给出明确未解决问题 | `cc-do` |
| `blocked` | 缺 review 证据、缺必要前提、缺环境、缺输入，导致现在还不能诚实地下 `pass` / `fail` | `cc-do`、`cc-investigate` 或 `cc-plan` |

优先级永远是：

1. 先问“有没有新鲜证据”
2. 再问“证据是失败还是缺条件”
3. 最后才允许给 verdict

如果你已经知道实现方向错了、范围错了、设计前提失效了，`blocked` 不是答案，应该直接 reroute 到 `cc-investigate` 或 `cc-plan`。

## Minimum Evidence Shape

每条 evidence 至少要能回答这 3 件事：

1. 跑了什么命令
2. 退出码 / status 是什么
3. 关键观察是什么

不要写：

- “测试过了”
- “本地看起来可以”
- “review 没问题”

要写：

- `npm test` exited `0`, all targeted tests passed
- `npm run lint` exited `1`, `src/foo.ts:18` 仍有 unused import
- `spec review` 缺失，当前无法确认 T003 是否满足 requirement

## Good Output

最小高质量 `report-card.json` 至少应该长这样：

### Pass

```json
{
  "changeId": "REQ-123",
  "verdict": "pass",
  "overall": "pass",
  "summary": "verdict=pass quick=3/3 strict=0/0 review=pass",
  "quickGates": [],
  "strictGates": [],
  "review": {
    "status": "pass",
    "summary": "Task review and diff review both passed",
    "details": "",
    "taskReviews": { "status": "pass", "required": true, "summary": "all completed tasks carry spec/code proof", "reviewers": [], "findings": [] },
    "diffReview": { "status": "pass", "required": false, "summary": "no blocking requirement-level findings", "reviewers": [], "findings": [] },
    "findings": []
  },
  "blockingFindings": [],
  "reroute": "none",
  "timestamp": "2026-04-15T12:00:00.000Z"
}
```

### Fail

```json
{
  "changeId": "REQ-123",
  "verdict": "fail",
  "overall": "fail",
  "summary": "verdict=fail quick=2/3 strict=0/0 review=pass",
  "blockingFindings": ["test: 2 failing tests remain in auth flow"],
  "reroute": "cc-do",
  "timestamp": "2026-04-15T12:00:00.000Z"
}
```

### Blocked

```json
{
  "changeId": "REQ-123",
  "verdict": "blocked",
  "overall": "fail",
  "summary": "verdict=blocked quick=3/3 strict=0/0 review=blocked",
  "blockingFindings": ["review: missing spec review proof for T002"],
  "reroute": "cc-do",
  "timestamp": "2026-04-15T12:00:00.000Z"
}
```

看完第一屏，下一位接手者应该立刻知道：

1. 现在是 `pass`、`fail` 还是 `blocked`
2. 这个结论由哪条新鲜证据支撑
3. 如果没过，应该回 `cc-do`、`cc-investigate` 还是 `cc-plan`

## Output

- `report-card.json`
- 验证结果输出
- review 结论
- reroute 结论

## Bundled Resources

- 变更记录：`CHANGELOG.md`
- 契约：`references/gate-contract.md`
- 审查契约：`references/review-contract.md`
- 模板：`assets/REPORT_CARD_TEMPLATE.json`
- 质量门执行：`scripts/run-quality-gates.sh`
- 报告渲染：`scripts/render-report-card.js`
- 结论校验：`scripts/verify-gate.sh`

## Working Rules

1. 先验证，再说完成。
2. 失败项必须有明确回退方向。
3. 没有证据，不允许绿灯。
4. 验收只认当前代码现实，不认计划里的自我安慰。
5. 通过结论必须可被 reviewer 复跑。
6. `pass` / `fail` / `blocked` 的选择必须能从 verdict matrix 逐条解释。
7. `reroute` 必须和阻塞原因一致，不能随手填默认值。

## Exit Criteria

- 验证结论明确
- 失败项已指向 `cc-plan` 或 `cc-do`
- 通过时下一步唯一答案是 `cc-act`

## Do Not

- 不在这里偷偷继续开发
- 不拿“本地感觉没问题”替代结果
- 不把 review 评论当成已经修复

## Companion Files

- 深入剧本：`PLAYBOOK.md`
- 变更记录：`CHANGELOG.md`
- Gate 契约：`references/gate-contract.md`
