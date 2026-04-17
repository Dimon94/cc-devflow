---
name: cc-act
version: 1.2.0
description: "Use when verified work must be shipped or handed off with a clear landing path: create or update a PR, prepare a local handoff, close out merged work, sync docs, write release notes, and fold follow-ups back into backlog or roadmap."
triggers:
  - "准备提 PR"
  - "帮我发版"
  - "收尾"
  - "ship this"
  - "handoff"
  - "close this requirement"
  - "merge 之后怎么收口"
reads:
  - "PLAYBOOK.md"
  - "CHANGELOG.md"
  - "references/closure-contract.md"
  - "assets/PR_BRIEF_TEMPLATE.md"
  - "assets/RELEASE_NOTE_TEMPLATE.md"
writes:
  - "status-report.md"
  - "pr-brief.md"
  - "RELEASE_NOTE.md"
  - "resume-index.md"
  - "BACKLOG.md"
  - "ROADMAP.md"
entry_gate:
  - "Accept only a passing report-card.json with reroute=none."
  - "Freeze current branch, PR, and ship-mode facts before writing delivery materials."
  - "If act changes code or verification scope, return to cc-check immediately."
exit_criteria:
  - "The ship mode is explicit, delivery materials match that mode, and the next maintainer has one clear entry point."
  - "Docs, PR text, release notes, and handoff artifacts reflect the same proven facts."
  - "Follow-up items are written back to roadmap/backlog instead of lingering in chat memory."
reroutes:
  - when: "Verification is stale, incomplete, or changed during act."
    target: "cc-check"
  - when: "Act reveals unfinished implementation or unresolved review findings."
    target: "cc-do"
recovery_modes:
  - name: "memory-consolidation"
    when: "Delivery evidence is scattered across checkpoints, reviews, and prior handoff notes."
    action: "Compress the current truth into status-report.md, pr-brief.md, and resume-index.md before any ship action continues."
  - name: "local-handoff-refresh"
    when: "Remote push or PR tooling is unavailable but the requirement is otherwise ready to land."
    action: "Switch to local-handoff mode, refresh resume-index.md and status-report.md, and leave a verified next entry for the maintainer."
tool_budget:
  read_files: 8
  search_steps: 4
  shell_commands: 6
---

# CC-Act

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、相关模板/脚本引用，然后检查 `CLAUDE.md`

## Role

`cc-act` 是 PDCA 里的 `Act + Ship`。

它不再只是“写收尾文档”，而是负责把已经通过验证的现实推进到真正可接手、可 review、可发布、可回写的状态。

一句话：`cc-check` 证明“东西已经好”，`cc-act` 负责把“已经好”变成“已经落地”。

## Read First

1. `PLAYBOOK.md`
2. `CHANGELOG.md`
3. `references/closure-contract.md`

## Use This Skill When

- `cc-check` 已通过
- 需要决定这次是 `create-pr`、`update-pr`、`local-handoff`，还是 `post-merge-closeout`
- 需要同步最终文档、handoff、release note
- 需要把遗留 follow-up / 优先级变化回写 `BACKLOG.md` 或 `ROADMAP.md`
- 需要让下一轮入口比现在更清楚

如果 `report-card.json` 不是 `pass`，或者仍指向 `cc-do` / `cc-plan`，停止在这里，不准 ship。

## Quick Start

先回答一句话：**这次 verified work 应该以什么方式落地？**

| 现实状态 | 直接选用模式 |
| --- | --- |
| 在 feature branch，远端可用，还没有 PR / MR | `create-pr` |
| 在 feature branch，已经有打开的 PR / MR | `update-pr` |
| 在 feature branch，但现在不推远端或工具不可用 | `local-handoff` |
| 已在 base branch，或 requirement 已合并完成 | `post-merge-closeout` |

如果 10 秒内还说不清属于哪一类，先停下，重新跑 `scripts/detect-ship-target.sh`。`cc-act` 不是猜模式的地方。

## Harness Contract

- Allowed actions: freeze ship facts, sync docs, prepare landing materials, and execute the matching ship mode.
- Forbidden actions: shipping with a stale report card, inventing a fifth ambiguous mode, or continuing feature development inside act.
- Required evidence: PR briefs, status reports, release notes, and resume indexes must summarize already-proven facts only.
- Reroute rule: changed verification goes back to `cc-check`; unfinished implementation or new fixes go back to `cc-do`.

## Entry Gate

1. 先读 `report-card.json`，只接受已通过且有证据的现实。
2. 再读 `DESIGN.md`、`TASKS.md`、`task-manifest.json`；如果已有 `resume-index.md`，一并读取，确认这次到底完成了什么。
3. 运行 `scripts/verify-act-gate.sh --dir <requirement-dir>`，确认 gate 真的闭合。
4. 运行 `scripts/detect-ship-target.sh`，识别当前分支、base branch、PR 状态与推荐 ship 路径。
5. 如果在 `cc-act` 期间又改了代码、修了 review、补了测试，必须回 `cc-check`，不能带着旧证明继续 ship。

## Ship Modes

`cc-act` 只允许 4 种模式，避免“收尾”变成模糊动作：

1. `create-pr`
   - 当前在 feature branch
   - 远端存在
   - 当前没有 PR / MR
2. `update-pr`
   - 当前在 feature branch
   - 已存在打开的 PR / MR
   - 需要刷新 body、补文档、同步最新状态
3. `local-handoff`
   - 当前在 feature branch
   - 暂不推远端，或远端工具不可用
   - 但要把 handoff 与下一步写清楚
4. `post-merge-closeout`
   - 当前已在 base branch，或 requirement 已完成合并
   - 重点是 release note、doc sync、backlog writeback、归档

不要发明第五种模糊模式。

## Minimum Output By Mode

先做最小必要交付，再补充可选材料：

1. `create-pr`
   - 必须有 `status-report.md`
   - 必须有 `pr-brief.md`
   - 必须完成需要同步的 doc updates
2. `update-pr`
   - 必须有更新后的 `pr-brief.md`
   - 必须说明这次新增了什么验证或文档同步
   - 必须避免重复创建 PR / MR
3. `local-handoff`
   - 必须有 `status-report.md`
   - 必须有更新后的 `resume-index.md`
   - 必须写清接手入口、验证方式、当前阻塞
4. `post-merge-closeout`
   - 必须完成 doc sync
   - 需要对外说明时生成 `RELEASE_NOTE.md`
   - 必须把 follow-up 回写到 `BACKLOG.md` / `ROADMAP.md`

不是每次都要把所有文件生成一遍。材料必须服务于当前 ship 模式，而不是为了流程好看。

## Loop

1. 先锁定 ship 事实：当前分支、base branch、PR 状态、requirement 状态。
2. 只使用 `cc-check` 已经证明过的事实写交付材料，不编故事，不补脑。
3. 同步文档：
   - 结构变了，更新对应目录的 `CLAUDE.md`
   - 用户可感知行为变了，更新 `README.md` / `RELEASE_NOTE.md`
   - handoff 变了，更新 `resume-index.md`
4. 生成 `pr-brief.md`，把需求、变更、验证证据、风险、文档同步状态一次写清。
   - 优先运行 `scripts/sync-act-docs.sh --dir <requirement-dir>`
   - 再运行 `scripts/render-pr-brief.sh --dir <requirement-dir>`
5. 执行分支集成动作：
   - `create-pr`：推分支并创建 PR / MR
   - `update-pr`：刷新 PR / MR body，不沿用陈旧内容
   - `local-handoff`：不假装已经发出，只生成可接手材料
   - `post-merge-closeout`：跳过 PR，完成发布与闭环回写
6. 处理 doc sync：如果 ship 结果改变了代码地图、用法、架构边界，文档必须跟上。
7. 回写 `BACKLOG.md` / `ROADMAP.md`：
   - 新发现的 follow-up
   - 被推迟但必须保留的事项
   - 因本次结果而改变优先级的事项
8. 如果 requirement 真正闭环，更新状态摘要并归档；否则把下一位接手者的入口写清楚。

## Output

- `status-report.md`
- `pr-brief.md`
- `RELEASE_NOTE.md`（需要对外发布时）
- 更新后的 `resume-index.md`
- 同步后的 `CLAUDE.md` / README / 架构文档
- 必要时更新后的 `BACKLOG.md` / `ROADMAP.md`
- 必要时创建或更新的 PR / MR

## Good Output

一个好的 `cc-act` 结果应该让 reviewer 或下一位接手者不用追问：

- 这次到底选了哪种 ship 模式，为什么不是另外三种
- 哪些材料已经准备好，哪些刻意不需要
- 现在谁都可以顺着 `pr-brief.md` 或 `resume-index.md` 继续往前走
- 文档、PR 描述、release note 说的是同一套现实

## Bundled Resources

- 变更记录：`CHANGELOG.md`
- 契约：`references/closure-contract.md`
- 模板：`assets/PR_BRIEF_TEMPLATE.md`
- 模板：`assets/RELEASE_NOTE_TEMPLATE.md`
- 状态摘要：`scripts/generate-status-report.sh`
- Gate 校验：`scripts/verify-act-gate.sh`
- Ship 目标识别：`scripts/detect-ship-target.sh`
- 文档同步：`scripts/sync-act-docs.sh`
- PR 简报生成：`scripts/render-pr-brief.sh`
- requirement 归档：`scripts/archive-requirement.sh`

## Working Rules

1. `cc-check` 没过，不准 ship。
2. 没有新鲜证据的完成结论，不准进入交付材料。
3. 交付材料只总结现实，不重写历史。
4. 文档必须与最终代码和 ship 状态同构。
5. 分支决策必须明确属于 4 种模式之一，不要含糊。
6. 已存在 PR / MR 时，优先更新，不重复创建。
7. 如果 Act 阶段修改了代码、测试或验证口径，必须回 `cc-check`。
8. `BACKLOG.md` / `ROADMAP.md` 只回写真正改变优先级或产生 follow-up 的事项，不写噪音。
9. `local-handoff` 不是偷懒模式，它仍然必须让下一位接手者知道做什么、怎么验证、卡在哪。

## Exit Criteria

- gate 闭合且现实一致
- ship 模式已明确并执行到位
- reviewer / maintainer 能直接接手
- 需要同步的文档已经同步
- follow-up 已回写到正确的 backlog / roadmap 位置
- 下一轮该怎么继续已经写清楚
- requirement 不是“看起来结束”，而是真正闭环

## Do Not

- 不把发布动作偷偷塞回 `cc-check`
- 不拿旧测试输出冒充当前事实
- 不重复创建 PR / MR
- 不让 handoff 只停留在口头描述
- 不留“下次再说”的关键空洞
- 不在 `cc-act` 阶段继续偷偷开发新范围

## Companion Files

- 深入剧本：`PLAYBOOK.md`
- 变更记录：`CHANGELOG.md`
- 收尾契约：`references/closure-contract.md`
