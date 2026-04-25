---
name: cc-check
version: 1.8.1
description: Use when a planned or investigated change needs fresh verification evidence, layered gate proof, review truth, and an honest pass fail blocked verdict before entering cc-act.
triggers:
  - 验收这个需求
  - 帮我确认是否完成
  - 跑一下质量门
  - check this requirement
  - verify with evidence
  - can this ship
  - 是不是可以进 cc-act
reads:
  - PLAYBOOK.md
  - CHANGELOG.md
  - references/gate-contract.md
  - references/review-contract.md
  - assets/REPORT_CARD_TEMPLATE.json
writes:
  - path: devflow/changes/<change-key>/review/report-card.json
    durability: durable
    required: true
entry_gate:
  - Read planning/design.md or planning/analysis.md, then planning/tasks.md, planning/task-manifest.json, and the latest runtime evidence before selecting a verdict.
  - Re-run fresh commands instead of inheriting cc-do narration.
  - If evidence is stale or missing, reset context and rebuild the verdict from canonical artifacts.
exit_criteria:
  - review/report-card.json records pass, fail, or blocked using fresh evidence, plus spec alignment and sync readiness.
  - Task-level review and requirement-level diff review are separated clearly.
  - 'The next step is unambiguous: cc-act, cc-do, cc-investigate, or cc-plan.'
reroutes:
  - when: The implementation is incomplete, tests fail, or review findings require code changes.
    target: cc-do
  - when: The bug still lacks a trustworthy root cause or the investigation contract is disproven.
    target: cc-investigate
  - when: The plan assumptions, scope, or design contract are invalid.
    target: cc-plan
recovery_modes:
  - name: clean-room-reset
    when: The current verdict is contaminated by stale chat memory or old command output.
    action: Discard narrative memory, reload canonical artifacts, rerun fresh gates, and rebuild review/report-card.json from current evidence only.
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

它不是收尾话术器，也不是替 `cc-do` 涂绿。

## Iron Law

```text
NO PASS WITHOUT FRESH EVIDENCE
```

如果本轮没有重新读取契约、重新跑 gate、重新核对 review，就没有资格写 `pass`。

`cc-check` 的失败不是“你不够努力”，而是“现实还没有被证据证明为绿色”。

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
- 需要判断一个 investigated bug fix 是否真的兑现了 `planning/analysis.md`

如果代码还在继续变、任务还没收口，停下并回 `cc-do`。

## Quick Start

先判断当前现实属于哪一类，再选 verdict：

| 现实状态 | 先读成什么 |
| --- | --- |
| 命令和 review 都齐了，只差最终裁决 | `pass-candidate` |
| 已有明确失败输出或 review finding | `fail-candidate` |
| 关键证据、review、环境、输入缺件 | `blocked-candidate` |

`cc-check` 的第一步不是跑更多形容词，而是先判“我是缺证据，还是有失败，还是已经足够过门”。

## Four Verification Phases

你必须按阶段推进，不能跳着给结论：

1. **Reset Contract**
   - 读 `planning/design.md` 或 `planning/analysis.md`
   - 读 `planning/tasks.md`、`planning/task-manifest.json`
   - 明确本轮要验证的 capability / task / spec delta
2. **Re-run Reality**
   - 重新执行 gate，不继承 `cc-do` 叙述
   - 读取退出码、关键输出、失败位置、skip 原因
3. **Check Every Boundary**
   - runtime gate
   - task-level review proof
   - requirement-level diff review
   - spec alignment / sync readiness
4. **Freeze Verdict**
   - 只允许 `pass` / `fail` / `blocked`
   - 明确 `reroute`
   - 写入 `review/report-card.json`

任何阶段发现“证据过期、边界矛盾、结论无法诚实成立”，都必须停下重建，而不是硬凑 `pass`。

## Harness Contract

- Allowed actions: rerun gates, inspect review proof, record a verdict, and route the requirement honestly.
- Forbidden actions: continuing development, inheriting old execution claims without fresh proof, or masking blocked work as pass.
- Required evidence: every passing statement must cite fresh command output, exit status, and key observation.
- Reroute rule: code and review fixes return to `cc-do`; root-cause drift returns to `cc-investigate`; scope or design invalidation returns to `cc-plan`.

## Verification Layers

`cc-check` 不是只看“测试是不是绿的”，而是至少看 4 层：

1. **Runtime Layer**
   - 测试、lint、typecheck、build、脚本 gate
2. **Task Review Layer**
   - `planning/task-manifest.json` 里的 task proof 是否完整
   - `reviews.spec` / `reviews.code` 是否与完成状态一致
3. **Requirement Diff Layer**
   - 当前改动是否真的兑现 requirement，而不是只让局部测试通过
4. **Spec Sync Layer**
   - capability truth、expected spec delta、handoff readiness 是否仍然一致

任何一层失真，都不能写 `pass`。

## Diff Review Pipeline

`cc-check` 的 requirement-level review 不能只写“diff 看过了”。至少要形成这些事实：

1. Base truth：识别 base branch、当前分支、是否已有 PR / MR，避免拿错比较基准。
2. Plan completion audit：从 `planning/tasks.md` / `task-manifest.json` 抽取可执行项，逐项标 `DONE` / `PARTIAL` / `NOT_DONE` / `CHANGED`。
3. Scope drift：比较原始 intent 与当前 diff，标出 scope creep、missing requirement、意外文件触点。
4. Critical pass：检查数据安全、并发、shell injection、LLM trust boundary、enum/value completeness、time/window safety、错误吞噬、静默数据损坏。
5. Outside-diff lookup：新增枚举值、状态、路由、artifact 类型时，必须搜索 sibling references，不能只读 diff 内文件。
6. Documentation staleness：代码行为、入口、命令、结构变化时，检查 README / CLAUDE / architecture docs 是否漂移。
7. Adversarial synthesis：如果有 codex review、subagent review、人工 review，多视角 finding 要去重并标出高置信重叠项。

这些事实写入 `review.diffReview.details` 或 `review.findings`。`pass` 只在 scope、completion、critical pass、doc staleness 都没有 blocking finding 时成立。

## Entry Gate

1. 先读 `planning/design.md` 或 `planning/analysis.md`，再读 `planning/tasks.md`、`planning/task-manifest.json`。
2. 明确本次要验证哪些事实，不做含糊验收。
3. 所有通过结论都必须来自本次新鲜命令输出。
4. 已完成任务必须能拿出 `spec/code` review 证据，并能说明 expected spec delta 是否已被验证。
5. 如果 review、manifest、spec truth、runtime output 彼此矛盾，先停下做 reset，不准直接选 verdict。

## Verification Loop

1. **Reset the target**
   - 写清楚本轮验收对象
   - 识别这是 feature closeout 还是 investigated bug closeout
2. **Run fresh gates**
   - 运行真实命令
   - 记录 exit status
   - 识别 failure 还是 blocked
3. **Compare against the contract**
   - 对照 `planning/design.md` 或 `planning/analysis.md`
   - 对照 `planning/tasks.md`、`planning/task-manifest.json`
   - 对照 review truth 和 spec delta
4. **Freeze verdict**
   - `pass` 只在所有必要层都通过时成立
   - `fail` 用于已有明确失败现实
   - `blocked` 用于缺件、缺环境、缺 review、缺输入
5. **Route honestly**
   - 代码修补回 `cc-do`
   - 根因站不住回 `cc-investigate`
   - 设计前提失效回 `cc-plan`

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

## Red Flags: STOP And Reset

如果你出现下面这些念头，说明 `cc-check` 已经跑偏：

- “上次测过是绿的，这次就沿用”
- “review 应该没问题，先写 pass”
- “这个 warning 不影响交付，先忽略”
- “task 已标 done，manifest proof 以后再补”
- “现在先给 blocked，省得判断 reroute”
- “用户看起来满意，应该能进 `cc-act`”
- “测试是绿的，所以 spec 一定同步了”

这些都不叫验证，叫叙述污染。回到 `Reset Contract`。

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

## Multi-Boundary Rule

如果系统是多层链路，不要只验最终按钮或最终命令。

至少要确认：

1. 输入契约有没有被正确读取
2. runtime gate 有没有真实执行
3. review proof 有没有真的落到 manifest / review 产物
4. spec / handoff truth 有没有和本次实现同步

哪一层先坏，就把 blocking finding 写到那一层，不要把深层症状伪装成最终 verdict。

## Finding Discipline

每个 finding 至少要写清：

1. severity：`critical` / `important` / `info`
2. confidence：`high` / `medium` / `low`，低置信不要伪装成 blocker
3. source：`runtime` / `task-review` / `diff-review` / `adversarial` / `docs`
4. evidence：文件、命令、退出码、manifest path、或具体观察
5. action：`fix-now` / `reroute-cc-do` / `reroute-cc-plan` / `reroute-cc-investigate` / `document-follow-up`

不能写“可能有问题”然后让接手者猜。要么证明，要么标成待验证 gap。

## Good Output

最小高质量 `review/report-card.json` 至少应该长这样：

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
      "diffReview": { "status": "pass", "required": true, "summary": "plan completion clean, no scope drift, no critical diff findings", "reviewers": [], "findings": [] },
      "findings": []
  },
  "blockingFindings": [],
  "reroute": "none",
  "timestamp": "2026-04-15T12:00:00.000Z"
}
```

看完第一屏，下一位接手者应该立刻知道：

1. 现在是 `pass`、`fail` 还是 `blocked`
2. 这个结论由哪条新鲜证据支撑
3. 如果没过，应该回 `cc-do`、`cc-investigate` 还是 `cc-plan`

## Output

- `review/report-card.json`
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
8. 如果同一 requirement 连续出现“测试绿但 closeout 红”，优先怀疑 review truth、manifest proof、spec sync，而不是继续给模糊总结。
9. Requirement diff review 默认要做 plan completion、scope drift、critical pass、doc staleness 四项；跳过任一项必须写 skip 理由。

## Exit Criteria

- 验证结论明确
- 失败项已指向 `cc-plan` 或 `cc-do`
- 通过时下一步唯一答案是 `cc-act`

## Do Not

- 不在这里偷偷继续开发
- 不拿“本地感觉没问题”替代结果
- 不把 review 评论当成已经修复
- 不把 stale JSON、旧截图、旧日志当成当前现实
- 不用 `blocked` 掩盖本该明确 reroute 的失败类型

## Companion Files

- 深入剧本：`PLAYBOOK.md`
- 变更记录：`CHANGELOG.md`
- Gate 契约：`references/gate-contract.md`
