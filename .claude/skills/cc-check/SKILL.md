---
name: cc-check
version: 1.11.2
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
  - Run `cc-devflow query workflow-context --change <changeId> --change-key <changeKey> --data-only --no-trace --compact` first; enter verification only when `nextAction.skill` is `cc-check`, or record the reroute it reports.
  - Use only the workflow context `packetOnly` and `mustNotForget` first, then `defaultOpen` section / JSON refs before expanding `planning/tasks.md`, `planning/task-manifest.json`, `change-meta.json`, and latest runtime evidence; legacy design/analysis files are fallback inputs only.
  - "Read requirement-level review truth in this order: `review/review-findings.json`, then `review/review-ledger.jsonl`, then legacy `review/cc-review-report.md` with `freshness=unknown`; if none exist, block with `review-missing`."
  - Re-run fresh commands instead of inheriting cc-do narration.
  - Separate missing evidence from real failure; conflicts choose the newer or stronger proof source and record the rejected source.
  - If evidence is stale or missing, reset context and rebuild the verdict from canonical artifacts.
exit_criteria:
  - review/report-card.json records pass, fail, or blocked using fresh evidence, review freshness, claim evidence, QA coverage and browser evidence, human UAT when applicable, named failure ownership, plus spec alignment and sync readiness.
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

## Runtime Output Policy

写入任何 durable Markdown 或 JSON metadata 前，先运行 `cc-devflow config resolve --format policy`。

- `Output language` 是机器约束，`review/report-card.json` 中新增的人类可读 verdict 和报告摘要必须记录并遵守它。
- `agent_preferences` 是用户偏好建议，只影响表达方式和结构选择，不覆盖本 Skill 的工作流边界。
- 如果配置解析失败，先修配置或向用户说明阻塞，不要用默认语言继续生成正式文档。

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
- 需要判断一个 investigated bug fix 是否真的兑现了 `planning/tasks.md#Root Cause Contract`

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
   - 先读 `cc-devflow query workflow-context --data-only --no-trace --compact` 的 context index
   - 默认只用 `progressiveDisclosure.packetOnly` 和 `mustNotForget`
   - 先检查 `sourceHashes`；不匹配就重跑 query
   - 只有 `openWhen.conditions` 触发时再读 `deepOpen` 里的 `planning/tasks.md`、完整 `planning/task-manifest.json`、`change-meta.json` 或 legacy fallback
   - 明确本轮要验证的 capability / task / spec delta
2. **Re-run Reality**
   - 重新执行 gate，不继承 `cc-do` 叙述
   - 读取退出码、关键输出、失败位置、skip 原因
3. **Check Every Boundary**
   - runtime gate
   - task-level review proof
   - requirement-level diff review
   - claim evidence matrix
   - QA feedback loop and behavior evidence
   - QA regression / test-quality proof
   - spec alignment / sync readiness
4. **Freeze Verdict**
   - 只允许 `pass` / `fail` / `blocked`
   - 明确 `reroute`
   - 写入 `review/report-card.json`

任何阶段发现“证据过期、边界矛盾、结论无法诚实成立”，都必须停下重建，而不是硬凑 `pass`。

## Harness Contract

- Allowed actions: rerun gates, inspect review proof, record a verdict, and route the requirement honestly.
- Forbidden actions: continuing development, inheriting old execution claims without fresh proof, or masking blocked work as pass.
- Required evidence: every passing statement must cite fresh command output, exit status, key observation, and the claim it proves.
- Reroute rule: code and review fixes return to `cc-do`; root-cause drift returns to `cc-investigate`; scope or design invalidation returns to `cc-plan`.
- Verification discipline: a skipped gate, stale review, ambiguous owner, or test that proves implementation shape instead of user intent blocks `pass`; fail loudly with the next owner.

## Verification Layers

`cc-check` 不是只看“测试是不是绿的”，而是至少看 10 层：

1. **Runtime Layer**
   - 测试、lint、typecheck、build、脚本 gate
2. **Task Review Layer**
   - `planning/task-manifest.json` 里的 task proof 是否完整
   - `reviews.spec` / `reviews.code` 是否与完成状态一致
3. **Requirement Diff Layer**
   - 当前改动是否真的兑现 requirement，而不是只让局部测试通过
4. **Spec Sync Layer**
   - capability truth、expected spec delta、handoff readiness 是否仍然一致
5. **Claim Evidence Layer**
   - 测试通过、build 成功、bug 修复、需求完成、agent 完成等声明，是否各自有对应证据
6. **QA Test Layer**
   - 回归测试是否有 red/green 证据
   - 测试是否验证真实行为，而不是 mock 或 test-only production API
   - 反馈环是否能稳定复现或证明用户描述的行为
7. **Review Freshness Layer**
   - review 是否绑定当前 `headSha`
   - 从 review 到当前 HEAD 是否还有新增 commit
   - 质量分、置信度、finding 去噪是否可复盘
8. **QA Coverage / Browser Layer**
   - 行为链路、错误态、边界条件是否被测试映射覆盖
   - UI / 用户路径变更是否有浏览器证据、截图、console 结果或明确 skip 理由
9. **Failure Ownership Layer**
   - 失败是本分支引入、基线已存在、环境阻塞，还是归属不明
   - 归属不明默认不能支撑 `pass`
10. **Behavior Contract Layer**
   - expected / actual / reproduction steps 是否用用户和领域语言写清
   - follow-up 是否是行为契约，而不是易腐烂的文件行号 TODO
11. **Human UAT Layer**
   - 人工验收是否 required、skipped with reason、pass、fail 或 blocked
   - failed UAT 必须 reroute 到 `cc-do`、`cc-investigate` 或 `cc-plan`
12. **Named Error Layer**
   - runtime failure 必须有 `errorName`、artifact refs、failure owner 和 rescue action
   - invalid JSON、stale artifact、missing report 不能变成静默 `blocked`

任何一层失真，都不能写 `pass`。

## Claim Evidence Matrix

不要把所有绿色都写成“测试过了”。`cc-check` 必须把声明拆成证据：

| Claim | Required proof | Not enough |
| --- | --- | --- |
| Tests pass | 本轮 test command、exit 0、0 failures | 旧输出、局部日志、应该会过 |
| Lint clean | 本轮 lint command、0 errors | 只跑 formatter、只看 touched file 且声明全仓 clean |
| Build succeeds | build command exit 0 | test / lint 通过 |
| Bug fixed | 原始症状或回归测试通过 | 代码改了、推测已修 |
| Regression test works | red -> green 证据 | 测试只绿过一次 |
| Agent completed | VCS diff / artifact 证明实际变化 | agent 自报 success |
| Requirements met | 逐项 plan / manifest checklist | 测试通过 |

这些事实写入 `claimEvidence[]`。缺少关键 claim 的证据时，结论至少是 `blocked`。

## QA Test Review

`cc-check` 必须区分“有测试”和“测试证明了正确行为”：

1. 先建立反馈环，再谈修复：failing test、curl / HTTP、CLI fixture、headless browser、trace replay、throwaway harness、bisect / differential loop 都可以，但必须说明速度、确定性、信号锋利度和复现率。
2. 回归测试必须记录 red/green 证据；red 要因为目标行为缺失而失败，不是语法、fixture 或 mock 写错。
3. 测试应从公共接口验证真实行为；不准为了方便直接测私有实现。
4. mock 只允许站在系统边界：外部 API、数据库、时间、随机数、文件系统、网络。mock 自家模块、断言内部调用次数或顺序，默认是 review finding。
5. 生产代码里新增仅测试使用的 API，默认是坏味道，必须 blocking，除非有明确生产生命周期理由。
6. 复杂 mock setup 超过测试主体时，优先要求 integration / contract test 解释。
7. test fixture 必须诚实表达 contract：partial fixture、generated stub、`as` / `any` / 双重 cast、缺字段 mock payload 都要说明真实字段与填充字段；如果这些技巧让测试绕过公共 seam 或隐藏错误输入，默认是 review finding。
8. 如果没有正确测试 seam，不要硬造脆弱测试；记录 `qa.architectureFollowUps`，说明缺失 seam / hidden coupling / shallow module，并按严重度决定 reroute 或 follow-up。

这些事实写入 `qa.regressionProof` 和 `qa.testQuality`。如果本需求没有行为测试空间，必须记录 `tddException` 或替代验证命令。

## QA Behavior Evidence

用户可见行为、bugfix、regression、工作流、CLI 行为和 API 行为都必须留下行为证据：

1. `qa.feedbackLoop` 记录本轮用什么 loop 证明现实，包含 `status`、`mode`、`commandOrArtifact`、`speed`、`determinism`、`signalSharpness`、`reproductionRate`、`attempts`、`blockedReason`。
2. `qa.behaviorEvidence` 记录 `userFacingBoundary`、`expectedBehavior`、`actualBehavior`、`reproductionSteps`、`consistency`、`domainLanguage`、`status`。
3. bugfix 不能只写“代码改了”；必须证明用户描述的原始症状已经被同一条或更可信的反馈环覆盖。
4. 不能复现时，verdict 默认 `blocked` 或回 `cc-investigate`，并写清尝试过哪些 loop、还缺什么 artifact / 权限 / 输入。
5. QA issue / follow-up 必须用行为和验收条件表达，不写易失效的文件路径或行号，除非它是当前 review finding 的证据位置。

## QA Coverage And Browser Evidence

测试不是数量游戏。`cc-check` 必须判断测试覆盖了哪条真实路径：

1. `qa.coverageAudit` 记录 `coveragePct`、`pathMap`、`gaps`、`testsAdded`、`e2eRequired`、`evalRequired`、`qualityStars`。
2. UI、路由、端到端用户路径、可视状态、交互状态变化时，必须记录 `qa.browserEvidence`。
3. `qa.browserEvidence` 至少说明 `mode`、`affectedRoutes`、`screenshots`、`consoleErrors`、`healthScore`、`issues`、`skipReason`。
4. 前端变更没有浏览器证据也没有 skip reason，不能写 `pass`。
5. 非前端或纯内部变更可以把 `browserEvidence.status` 写成 `skipped`，但必须说明为什么不需要浏览器 QA。

## Diff Review Pipeline

`cc-check` 的 requirement-level review 不能只写“diff 看过了”。至少要形成这些事实：

1. Base truth：识别 base branch、当前分支、是否已有 PR / MR，避免拿错比较基准。
2. Plan completion audit：从 `planning/tasks.md` / `task-manifest.json` 抽取可执行项，逐项标 `DONE` / `PARTIAL` / `NOT_DONE` / `CHANGED`。
3. Scope drift：比较原始 intent 与当前 diff，标出 scope creep、missing requirement、意外文件触点。
4. Critical pass：检查数据安全、并发、shell injection、LLM trust boundary、enum/value completeness、time/window safety、错误吞噬、静默数据损坏。
5. Outside-diff lookup：新增枚举值、状态、路由、artifact 类型时，必须搜索 sibling references，不能只读 diff 内文件。
6. Documentation staleness：代码行为、入口、命令、结构变化时，检查 README / CLAUDE / architecture docs 是否漂移。
7. Adversarial synthesis：如果有 codex review、subagent review、人工 review，多视角 finding 要去重并标出高置信重叠项。
8. Specialist facets：按实际风险记录 `testing`、`security`、`performance`、`api-contract`、`data-migration`、`design` 等 review facet；没有派发也要写 skip reason，避免 reviewer 误以为已经覆盖。
9. Confidence calibration：每条 finding 必须有可比较的置信度和指纹，低置信 finding 不准伪装成 blocker。

这些事实写入 `review.diffReview.details` 或 `review.findings`。`pass` 只在 scope、completion、critical pass、doc staleness 都没有 blocking finding 时成立。

## Review Packet And Triage

每次 task-level 或 requirement-level review 都必须能脱离聊天记录复盘：

1. `reviewPacket.baseSha`
2. `reviewPacket.headSha`
3. `reviewPacket.requirements`
4. `reviewPacket.implemented`
5. `reviewPacket.reviewerContext`

每次 review 还必须记录 freshness：

1. `review.freshness.status`：`fresh` / `stale` / `unknown` / `not-applicable`
2. `review.freshness.reviewedCommit`
3. `review.freshness.currentCommit`
4. `review.freshness.commitsSinceReview`
5. `review.freshness.staleReason`
6. `review.qualityScore`：0-10，缺失时不能当成高置信审查

每条 finding 必须有 triage：

- `accepted-fixed`：已修并有验证
- `rejected-with-evidence`：经代码 / 测试证明不适用
- `deferred-minor`：非阻塞，已写入 follow-up
- `clarification-needed`：不清楚，当前 verdict 不能是 `pass`

`critical` / `important` finding 未 triage 或未闭环，不能进入 `cc-act`。

每条 finding 还必须带去噪字段：

- `confidenceScore`：1-10，低于 7 的 finding 只能作为 warning 或待验证 gap
- `fingerprint`：稳定去重键，避免多路 review 重复报同一件事
- `displayTier`：`blocking` / `warning` / `info` / `suppressed`
- `suppressionReason`：只有 `displayTier=suppressed` 时允许非空

## Failure Ownership

失败不能只写“测试红了”。`cc-check` 必须把失败归属写入 `runtime.failureOwnership[]`：

1. `classification` 只能是 `in-branch`、`pre-existing`、`environment`、`ambiguous`。
2. `ambiguous` 默认按 `in-branch` 处理，除非有 base branch 复验证据。
3. `pre-existing` 必须有 base branch 或历史证据，不能靠猜。
4. `environment` 必须记录缺失依赖、权限、服务、密钥或平台约束。
5. `pass` 不能带未解释的 `in-branch` 或 `ambiguous` 失败。

每条 failure ownership 还必须命名：

- `errorName`：可搜索的错误名，例如 `MissingSpecReviewProof`
- `artifactRefs`：指向 report、manifest、task state、日志或命令输出
- `rescueAction`：下一步救援动作，不写空泛“检查一下”
- `owner`：`branch` / `baseline` / `environment` / `external` / `unknown`

## Entry Gate

1. 先读 `planning/tasks.md#Contract Summary` 或 `planning/tasks.md#Root Cause Contract`，再读 `planning/task-manifest.json` 和 `change-meta.json`。
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
   - 记录 failure ownership，而不是把所有红灯混成一个失败摘要
3. **Compare against the contract**
   - 对照 `planning/tasks.md` 的 canonical contract
   - 对照 `planning/task-manifest.json` 和 `change-meta.json`
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
   - 同时写 `confidenceScore`，用 1-10 数字表达可比较置信度
3. source：`runtime` / `task-review` / `diff-review` / `adversarial` / `docs`
4. evidence：文件、命令、退出码、manifest path、或具体观察
5. action：`fix-now` / `reroute-cc-do` / `reroute-cc-plan` / `reroute-cc-investigate` / `document-follow-up`
6. fingerprint：稳定去重键
7. displayTier：`blocking` / `warning` / `info` / `suppressed`

不能写“可能有问题”然后让接手者猜。要么证明，要么标成待验证 gap。

## Good Output

最小高质量 `review/report-card.json` 至少应该长这样：

```json
{
  "changeId": "REQ-123",
  "verdict": "pass",
  "overall": "pass",
  "summary": "verdict=pass quick=3/3 strict=0/0 review=pass",
  "claimEvidence": [
    { "claim": "tests-pass", "requiredProof": "fresh test command", "commandOrArtifact": "npm test", "exitStatus": 0, "keyObservation": "0 failures", "status": "pass" },
    { "claim": "requirements-met", "requiredProof": "plan checklist", "commandOrArtifact": "planning/tasks.md", "exitStatus": null, "keyObservation": "all tasks complete", "status": "pass" }
  ],
  "runtime": { "status": "pass", "failureOwnership": [] },
  "qa": {
    "status": "pass",
    "regressionProof": [],
    "testQuality": [],
    "coverageAudit": { "status": "pass", "coveragePct": 80, "pathMap": [], "gaps": [], "testsAdded": [], "e2eRequired": false, "evalRequired": false, "qualityStars": "★★" },
    "browserEvidence": { "status": "skipped", "mode": "not-applicable", "affectedRoutes": [], "screenshots": [], "consoleErrors": [], "healthScore": null, "issues": [], "skipReason": "not a UI or user-path change" },
    "tddException": null
  },
  "quickGates": [],
  "strictGates": [],
  "review": {
    "status": "pass",
    "summary": "Task review and diff review both passed",
    "details": "",
    "freshness": { "status": "fresh", "reviewedCommit": "example-head", "currentCommit": "example-head", "commitsSinceReview": 0, "staleReason": "" },
    "qualityScore": 9,
    "specialistReviews": [],
    "taskReviews": { "status": "pass", "required": true, "summary": "all completed tasks carry spec/code proof", "reviewPacket": {}, "reviewers": [], "findings": [] },
    "diffReview": { "status": "pass", "required": true, "summary": "plan completion clean, no scope drift, no critical diff findings", "reviewPacket": {}, "reviewers": [], "findings": [] },
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
