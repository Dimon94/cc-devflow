# CC-Check Playbook

## Iron Law

```text
NO PASS WITHOUT FRESH EVIDENCE
```

只要 gate、review、spec truth 里任一层没有本轮新鲜证据，`pass` 就不成立。

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

## Four Verification Phases

1. **Reset Contract**
   - 重新读取 `planning/design.md` 或 `planning/analysis.md`
   - 重新读取 `planning/tasks.md`、`planning/task-manifest.json`
   - 按 `review-findings.json` -> `review-ledger.jsonl` -> legacy `cc-review-report.md` 的顺序读取 review truth
   - 明确本轮验收对象和 spec delta
2. **Re-run Reality**
   - 重新跑 gate
   - 读取退出码、关键输出、skip 原因
3. **Check Every Boundary**
   - runtime gate
   - task review proof
   - requirement diff review
   - claim evidence matrix
   - QA feedback loop and behavior evidence
   - QA regression / test-quality proof
   - QA coverage and browser evidence
   - review freshness and finding confidence
   - failure ownership
   - spec sync readiness
4. **Freeze Verdict**
   - 只允许 `pass` / `fail` / `blocked`
   - 只允许诚实 reroute

## Gate Function

在宣称任何“完成、通过、ready”之前，必须做 4 件事：

1. 找到证明这个结论的命令
2. 重新运行完整命令
3. 读取真实输出和退出码
4. 把证据写进 `report-card.json`
5. 把任务级 review 与需求级 diff review 分开写清楚
6. 把每个成功声明映射到 `claimEvidence[]`
7. 行为变更必须补 `qa` 证据或例外理由
8. 失败输出必须写入 `runtime.failureOwnership[]`
9. failure ownership 必须包含 named error、artifact refs 和 rescue action
10. human UAT 必须 pass、fail、blocked 或带 skip reason；失败不能被测试绿灯覆盖

## Verification Layers

1. Runtime reality
2. Task review proof
3. Requirement diff truth
4. Claim evidence matrix
5. QA feedback loop and behavior evidence
6. QA regression and test quality
7. QA coverage and browser evidence
8. Review freshness and confidence calibration
9. Failure ownership
10. Spec alignment and sync readiness
11. Human UAT
12. Named runtime errors and rescue actions

## Claim Evidence Matrix

每个“通过”声明都要回答：这条声明由哪条命令或 artifact 证明？

- `tests-pass`：本轮 test command、exit 0、0 failures
- `lint-clean` / `typecheck-clean` / `build-succeeds`：对应 gate 的本轮输出
- `bug-fixed`：原始症状或回归测试通过
- `regression-test-works`：red -> green 证据，而不是只绿一次
- `requirements-met`：逐项 plan / manifest checklist
- `agent-completed`：VCS diff 或 artifact 证明实际变化

缺少必要 claim 的证据时，verdict 至少是 `blocked`。不要把没有证据的 claim 写进 summary。

## Requirement Diff Review

需求级 review 至少分 5 步：

1. `base truth`：确认 base branch、当前 branch、PR 状态。
2. `plan completion`：逐项核对 tasks / manifest 是否真的由 diff 或 runtime proof 兑现。
3. `scope drift`：识别多做、少做、做偏。
4. `critical pass`：检查数据安全、并发、shell、LLM trust boundary、枚举覆盖、静默失败、文档漂移。
5. `adversarial synthesis`：合并外部 review / codex / subagent /人工 finding，去重并标置信度。
6. `specialist facets`：按风险记录 testing / security / performance / api-contract / data-migration / design 等审查面；没有覆盖必须写 skip reason。
7. `freshness`：确认 review 对应当前 head；review 后新增 commit 时不能继续拿旧审查支撑 `pass`。

这些结论进入 `review.diffReview`，不能只写在口头总结里。

每层 review 都要带 `reviewPacket`：`baseSha`、`headSha`、`requirements`、`implemented`、`reviewerContext`。缺少审查范围时，review 不能支撑 `pass`。

review 还要带 `freshness`：`status`、`reviewedCommit`、`currentCommit`、`commitsSinceReview`、`staleReason`。`status=stale` 或缺失 freshness 时，`pass` 不成立。

每条 finding 都要带 `triageStatus`：

- `accepted-fixed`
- `rejected-with-evidence`
- `deferred-minor`
- `clarification-needed`

`critical` / `important` finding 未闭环或仍是 `clarification-needed`，不能进入 `cc-act`。

每条 finding 还要带 `confidenceScore`、`fingerprint`、`displayTier`、`suppressionReason`。低置信 finding 只能作为 warning 或 gap，不能伪装成 blocking fact。

## QA Test Quality

行为变化、bugfix、边界条件、用户可见流程必须补 `qa`：

- `feedbackLoop`：用什么 loop 证明现实，速度、确定性、信号锋利度、复现率如何
- `behaviorEvidence`：用户边界、expected / actual、复现步骤、稳定性、领域语言
- `regressionProof`：red command、red failure reason、green command、是否恢复最终状态
- `testQuality`：是否经公共接口验证真实行为、mock 是否只停在系统边界、是否存在 test-only production API
- `architectureFollowUps`：没有正确 test seam 时记录 seam / hidden coupling / shallow module 的后续改造
- `tddException`：纯配置、生成文件、throwaway prototype 等例外和替代验证
- `coverageAudit`：覆盖率、codepath / user-flow map、缺口、是否需要 e2e / eval、测试质量星级
- `browserEvidence`：UI / 用户路径变更的 affected routes、截图、console、health score、issues，或明确 skip reason

测试只绿过一次，不能证明 regression test 有效；断言 mock 本身，不能证明真实行为。没有可信反馈环时，`pass` 不成立。

## Failure Ownership

失败要先归属，再下结论：

- `in-branch`：当前分支引入，默认回 `cc-do`
- `pre-existing`：base branch 也存在，必须有复验证据
- `environment`：依赖、权限、服务、密钥、平台缺失，通常是 `blocked`
- `ambiguous`：无法证明归属，默认不能 `pass`

不要把环境红灯、基线红灯、本分支红灯混成一句“测试失败”。

## Verdict

只允许 3 种结论：

- `pass`
- `fail`
- `blocked`

速判规则：

1. 命令或 review 明确失败 => `fail`
2. 条件缺失、证据不足、review 缺件 => `blocked`
3. 只有当 gate 和 review 都过，才是 `pass`

如果已经证明根因故事失效，别用 `blocked` 糊过去，直接 reroute 到 `cc-investigate`。

## Minimum `report-card.json`

```json
{
  "changeId": "REQ-123",
  "verdict": "pass",
  "overall": "pass",
  "summary": "one-line reality",
  "claimEvidence": [],
  "runtime": {
    "status": "pass",
    "failureOwnership": []
  },
  "qa": {
    "status": "pass",
    "feedbackLoop": {
      "status": "pass",
      "mode": "targeted-test",
      "commandOrArtifact": "npm test -- src/feature/feature.test.ts",
      "speed": "fast",
      "determinism": "high",
      "signalSharpness": "fails only when the target behavior is absent",
      "reproductionRate": "1/1",
      "attempts": [],
      "blockedReason": ""
    },
    "behaviorEvidence": {
      "status": "pass",
      "userFacingBoundary": "feature action",
      "expectedBehavior": "the user-visible behavior succeeds",
      "actualBehavior": "verified by targeted test",
      "reproductionSteps": [],
      "consistency": "deterministic",
      "domainLanguage": []
    },
    "regressionProof": [],
    "testQuality": [],
    "coverageAudit": {
      "status": "pass",
      "coveragePct": 80,
      "pathMap": [],
      "gaps": [],
      "testsAdded": [],
      "e2eRequired": false,
      "evalRequired": false,
      "qualityStars": "★★"
    },
    "browserEvidence": {
      "status": "skipped",
      "mode": "not-applicable",
      "affectedRoutes": [],
      "screenshots": [],
      "consoleErrors": [],
      "healthScore": null,
      "issues": [],
      "skipReason": "not a UI or user-path change"
    },
    "architectureFollowUps": [],
    "tddException": null
  },
  "quickGates": [],
  "strictGates": [],
  "review": {
    "status": "pass",
    "summary": "",
    "details": "",
    "freshness": { "status": "fresh", "reviewedCommit": "example-head", "currentCommit": "example-head", "commitsSinceReview": 0, "staleReason": "" },
    "qualityScore": 9,
    "specialistReviews": [],
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

## Red Flags

看到下面这些念头就停下 reset：

- “上次跑过，沿用就行”
- “测试绿了，review 应该也没问题”
- “先给 blocked，省得解释 reroute”
- “manifest proof 以后再补”
- “spec truth 应该没漂”

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
6. diff review 是否同时覆盖了 plan completion、scope drift、critical pass、doc staleness？
7. feedback loop 是否真的证明了用户描述的行为，而不是只证明附近代码能跑？
