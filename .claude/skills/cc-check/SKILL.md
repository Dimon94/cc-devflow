---
name: cc-check
version: 1.15.0
description: Use when a planned or investigated change needs fresh verification evidence and an honest pass/fail/blocked verdict before cc-act.
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
  - references/gate-contract.md
  - references/review-contract.md
  - ../cc-dev/scripts/resolve-cc-devflow.sh
  - references/checklist-contract.md
writes:
  - path: current response
    durability: ephemeral
    required: true
  - path: devflow/changes/<change-key>/task.md
    durability: durable
    required: false
    when: classifying `Failure Ledger` entries touched by this verification
  - path: Git commit
    durability: durable
    required: true
    when: verification completes a PDCA or IDCA environment stage
entry_gate:
  - Read `task.md`, current Git diff, relevant code/tests, PR text when present, and fresh command output.
  - Re-run fresh commands instead of inheriting cc-do narration.
  - Classify the current reality as pass-candidate, fail-candidate, or blocked-candidate before writing a verdict.
  - Map every completion claim to command output, exit status, and key observation.
  - Do not create process files.
exit_criteria:
  - Verdict is exactly pass, fail, or blocked.
  - Every passing statement cites fresh command output, exit status, and what claim it proves.
  - Behavior changes and bugfixes include feedback-loop and test-quality review.
  - Any `task.md#Failure Ledger` entry touched by this verification is classified as `confirmed-lesson`, `noise`, or `unresolved-risk`.
  - Current diff is checked against `task.md` for missing scope, scope creep, and unintended file touch.
  - Failures are classified as branch, baseline, environment, external, or unknown.
  - Missing evidence is separated from real failure.
  - After pass/fail/blocked, commit the stage state when repository policy allows it.
  - The next step is unambiguous: cc-act, cc-do, cc-investigate, cc-plan, or stop.
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
    action: Discard narrative memory, reread task.md and current Git diff, rerun fresh gates, and rebuild the verdict in the response.
tool_budget:
  read_files: 8
  search_steps: 4
  shell_commands: 6
---

# CC-Check

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、相关模板/脚本引用，然后检查 `CLAUDE.md`

## Read First

1. `references/checklist-contract.md`

## Default Output

Use this short shape for every verdict:

1. Verdict: exactly `pass`, `fail`, or `blocked`.
2. Evidence: command, exit status, key observation, and claim proven.
3. Review: clean, findings remain, not reviewed, or skipped with reason.
4. QA: feedback loop, test quality, and behavior evidence when applicable.
5. Diff: scope match, missing scope, or scope drift.
6. Route: `cc-act`, `cc-do`, `cc-investigate`, `cc-plan`, or `stop`.

## Checklist Contract

Follow `references/checklist-contract.md` before each pause point. The checklist is the local do-confirm/read-do contract for this skill; skip only with an explicit blocker or route.

## Role

`cc-check` 是 PDCA / IDCA 的验证节点。它把“应该好了”变成“证据表明它好了”。

它不写过程文件。验证事实进入当前回复、PR 文件和 Git commit。

## Iron Law

```text
NO PASS WITHOUT FRESH EVIDENCE
```

## Verification Loop

1. Read `task.md` and the current diff.
2. Re-run the smallest trustworthy gate: tests, typecheck, lint, build, browser check, CLI smoke, or domain-specific verifier.
3. Map each explicit requirement to proof.
4. Review test quality when behavior changed: red/green proof, public seam, honest fixtures, no private implementation assertions.
5. Classify any relevant Failure Ledger entries:
   - `confirmed-lesson`: verified failure pattern worth compressing at `cc-act`.
   - `noise`: local dead end, transient command issue, or disproven suspicion.
   - `unresolved-risk`: real concern still missing proof or owner.
6. Return verdict:
   - `pass`: all required claims have fresh proof.
   - `fail`: a command, review, or behavior check proves the change is wrong.
   - `blocked`: required environment, auth, input, or evidence is missing.
7. Commit the stage when this PDCA/IDCA environment completes.

## Verification Phases

1. Reset Contract：读取 `task.md`、当前 diff、相关代码 / 测试、PR 文本（如果存在），明确本轮验证对象。
2. Re-run Reality：重新运行可信 gate，不继承 `cc-do` 叙述；记录命令、退出码、关键输出、skip / blocked 原因。
3. Check Boundaries：检查 runtime、task completion、requirement diff、claim evidence、QA/test quality、review freshness、docs / UI / DX 影响。
4. Freeze Verdict：只输出 `pass` / `fail` / `blocked`，并给出 route。

任一阶段发现证据过期、边界矛盾、结论无法诚实成立，都先 reset 或 reroute，不硬凑 `pass`。

## Evidence Layers

`cc-check` 不是只看测试绿不绿。按风险选择必要层，至少说明未覆盖层的 skip reason：

1. Runtime：test、lint、typecheck、build、脚本 gate。
2. Task Completion：`task.md` 的任务是否真的完成，完成证据是否对应当前 diff。
3. Requirement Diff：当前改动是否兑现需求，是否有 scope creep、missing requirement、意外文件触点。
4. Claim Evidence：每个通过声明都有命令、退出码、观察和证明的 claim。
5. QA Test Quality：red/green、public seam、mock boundary、fixture honesty、test-only API smell。
6. Behavior Evidence：用户可见 expected / actual / reproduction steps 是否被当前反馈环覆盖。
7. Review Freshness：本轮 review 是否覆盖当前 HEAD；未 review 要说清风险。
8. Failure Ownership：失败归属 branch、baseline、environment、external 或 unknown。
9. Docs / Browser / Operator：UI、CLI、docs、operator workflow 受影响时有证据或 skip reason。

## Failure Ledger Review

如果 `task.md#Failure Ledger` 有本轮相关条目，`cc-check` 必须把现场记录过滤成可压缩事实：

| Status | Meaning | Keep for postmortem |
| --- | --- | --- |
| `confirmed-lesson` | 新鲜验证证明这是会复发的流程、测试、架构、AI 或交付教训 | `yes` when it should change future workflow behavior |
| `noise` | 临时误会、已推翻假设、一次性环境抖动或无复用价值的尝试 | `no` |
| `unresolved-risk` | 风险真实但证据、owner 或修复边界还不够 | `no` until resolved or explicitly escalated |

不要把所有失败都送进尸检。只有 `confirmed-lesson` 且 `Keep for postmortem: yes` 的条目，才是 `cc-act` 收尾压缩的输入。

## Claim Evidence Matrix

不要把所有绿色写成“测试过了”：

| Claim | Required proof | Not enough |
| --- | --- | --- |
| Tests pass | current command, exit 0, failures 0 | old output |
| Lint clean | current lint command, no errors | formatter only |
| Build succeeds | build command exit 0 | tests only |
| Bug fixed | original symptom or regression loop passes | code changed |
| Regression test works | red -> green evidence | green only |
| Requirements met | each task/acceptance mapped to proof | self-report |

缺关键 claim 证据时，结论至少是 `blocked`。

## Failure Ownership

失败不能只写“红了”：

- `branch`：本分支引入或当前改动相关。
- `baseline`：有 base branch 或历史证据证明预先存在。
- `environment`：缺依赖、权限、服务、密钥或平台条件。
- `external`：外部系统或第三方服务失败。
- `unknown`：归属不明；不能支撑 `pass`。

每个失败写清 error name、证据、owner、rescue action。

## Output

只输出短结论，不写过程文件：

- Verdict: `pass` / `fail` / `blocked`
- Evidence: command, exit status, and the claim it proves
- Review: clean, findings remain, not reviewed, or skipped with reason
- QA: feedback loop, test quality, and behavior evidence when applicable
- Diff: scope match, missing scope, or scope drift
- Route: `cc-act` / `cc-do` / `cc-investigate` / `cc-plan` / `stop`
