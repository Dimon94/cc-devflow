---
name: cc-act
version: 1.8.4
description: 'Use when verified work must be shipped or handed off with a clear landing path: run simplify and required tests, create or update a PR, prepare a local handoff, close out merged work, sync docs, write release notes, and fold follow-ups back into backlog or roadmap.'
triggers:
  - 准备提 PR
  - 帮我发版
  - 收尾
  - ship this
  - handoff
  - close this requirement
  - merge 之后怎么收口
reads:
  - PLAYBOOK.md
  - CHANGELOG.md
  - references/closure-contract.md
  - references/git-commit-guidelines.md
  - assets/PR_BRIEF_TEMPLATE.md
  - assets/RELEASE_NOTE_TEMPLATE.md
  - ../cc-roadmap/scripts/locate-roadmap-item.sh
  - ../cc-roadmap/scripts/sync-roadmap-progress.sh
  - scripts/ensure-ship-branch.sh
writes:
  - path: devflow/changes/<change-key>/handoff/pr-brief.md
    durability: durable
    required: false
    when: handoff mode is create-pr or update-pr
    exclusive_group: handoff
  - path: devflow/changes/<change-key>/handoff/resume-index.md
    durability: durable
    required: false
    when: handoff mode is local resume
    exclusive_group: handoff
  - path: devflow/changes/<change-key>/handoff/release-note.md
    durability: durable
    required: false
    when: handoff mode is release
    exclusive_group: handoff
effects:
  - roadmap progress and backlog follow-up updates when needed
entry_gate:
  - Accept only a passing review/report-card.json with reroute=none and specSyncReady=true.
  - Freeze current branch, PR, ship-mode, auth, clean-tree, and rollback facts before writing delivery materials.
  - If simplify, tests, or act changes code or verification scope, return to cc-check immediately.
  - Read source roadmap progress from `devflow/roadmap.json`, `devflow/ROADMAP.md`, optional `devflow/BACKLOG.md`, or legacy `devflow/roadmap-tracking.json`; act must not ship against stale RM state.
exit_criteria:
  - The ship mode is explicit, delivery materials match that mode, and the next maintainer has one clear entry point.
  - Docs, PR text, release notes, handoff artifacts, review range, readiness dashboard, PR body accuracy check, and test evidence reflect the same proven facts.
  - Follow-up items are written back to roadmap/backlog instead of lingering in chat memory.
  - The source roadmap item reflects the latest verified state, ship mode, and follow-up decision, or the handoff records a no-op reason.
reroutes:
  - when: Verification is stale, incomplete, or changed during act.
    target: cc-check
  - when: Act reveals unfinished implementation or unresolved review findings.
    target: cc-do
recovery_modes:
  - name: memory-consolidation
    when: Delivery evidence is scattered across checkpoints, reviews, and prior handoff notes.
    action: Compress the current truth into handoff/pr-brief.md, handoff/resume-index.md, and handoff/release-note.md before any ship action continues.
  - name: local-handoff-refresh
    when: Remote push or PR tooling is unavailable but the requirement is otherwise ready to land.
    action: Switch to local-handoff mode, refresh handoff/resume-index.md, and leave a verified next entry for the maintainer.
tool_budget:
  read_files: 8
  search_steps: 5
  shell_commands: 11
---

# CC-Act

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、相关模板/脚本引用，然后检查 `CLAUDE.md`

## Role

`cc-act` 是 PDCA 里的 `Act + Ship`。

它不再只是“写收尾文档”，而是负责把已经通过验证的现实推进到真正可接手、可 review、可发布、可回写的状态。

一句话：`cc-check` 证明“东西已经好”，`cc-act` 负责把“已经好”变成“已经落地”。

## Runtime Output Policy

写入任何 durable Markdown 或 JSON metadata 前，先运行 `cc-devflow config resolve --format policy`。

- `Output language` 是机器约束，PR brief、resume index、release note 和 status handoff 必须记录并遵守它。
- `agent_preferences` 是用户偏好建议，只影响表达方式和结构选择，不覆盖本 Skill 的工作流边界。
- 如果配置解析失败，先修配置或向用户说明阻塞，不要用默认语言继续生成正式文档。

## Read First

1. `PLAYBOOK.md`
2. `CHANGELOG.md`
3. `references/closure-contract.md`
4. `references/git-commit-guidelines.md`

## Use This Skill When

- `cc-check` 已通过
- 需要决定这次是 `create-pr`、`update-pr`、`local-handoff`，还是 `post-merge-closeout`
- 需要在 ship 前再做一次 `cc-simplify`、单测、以及按协调器要求执行的 e2e
- 需要同步最终文档、handoff、release note
- 需要把遗留 follow-up / 优先级变化回写 `devflow/roadmap.json`，并重新生成 `devflow/ROADMAP.md` / `devflow/BACKLOG.md`
- 需要把已验证的 spec delta 正式回写 capability spec 与 `devflow/specs/INDEX.md`
- 需要让下一轮入口比现在更清楚

如果 `review/report-card.json` 不是 `pass`，或 `specSyncReady` 不是 `true`，或者仍指向 `cc-do` / `cc-plan`，停止在这里，不准 ship。

## Quick Start

先回答一句话：**这次 verified work 应该以什么方式落地？**

| 现实状态 | 直接选用模式 |
| --- | --- |
| 在 feature branch，远端可用，还没有 PR / MR | `create-pr` |
| 在 feature branch，已经有打开的 PR / MR | `update-pr` |
| 在 detached HEAD，用户要求继续 / 提交远程 PR，且远端可用 | 先 `ensure-ship-branch.sh`，再按 `create-pr` |
| 在 feature branch，但现在不推远端或工具不可用 | `local-handoff` |
| 已在 base branch，或 requirement 已合并完成 | `post-merge-closeout` |

如果 10 秒内还说不清属于哪一类，先停下，重新跑 `scripts/detect-ship-target.sh`。`cc-act` 不是猜模式的地方。

## Harness Contract

- Allowed actions: freeze ship facts, run simplify and required tests, sync docs, prepare landing materials, and execute the matching ship mode.
- Forbidden actions: shipping with a stale report card, claiming readiness without simplify/test evidence or explicit skip evidence, inventing a fifth ambiguous mode, or continuing feature development inside act.
- Required evidence: PR briefs, status reports, release notes, resume indexes, and test evidence must summarize already-proven facts only.
- Reroute rule: changed verification goes back to `cc-check`; unfinished implementation or new fixes go back to `cc-do`.

## Entry Gate

1. 先读 `review/report-card.json`，只接受已通过且有证据的现实。
2. 再读 `planning/design.md` 或 `planning/analysis.md`、`planning/tasks.md`、`planning/task-manifest.json`、`change-meta.json`、相关 capability spec；如果已有 `handoff/resume-index.md`，一并读取，确认这次到底完成了什么。
3. 运行 `scripts/verify-act-gate.sh --dir <requirement-dir>`，确认 gate 真的闭合。
4. 运行 `scripts/detect-ship-target.sh`，识别当前分支、base branch、PR 状态与推荐 ship 路径。
   - 如果输出 `BRANCH_STATE=detached` 且 `BRANCH_RESCUE=create-branch-before-pr`，这不是阻塞；立即运行 `scripts/ensure-ship-branch.sh --dir <requirement-dir>`，然后重跑最终验证与 `detect-ship-target.sh`。
   - 用户已经表达“继续 / 提交远程 PR / 推进”的场景下，detached HEAD 只能触发分支锚定，不能把 `create-pr` 降级成 `local-handoff`。
5. 检查 `review.freshness`、`runtime.failureOwnership`、`qa.coverageAudit`、`qa.browserEvidence`，确认 readiness dashboard 没有 blocker。
6. 检查 `qa.feedbackLoop`、`qa.behaviorEvidence`、`qa.architectureFollowUps` 和 follow-up brief，确认交付材料继承的是行为证据，不是聊天记忆或易腐烂 TODO。
7. 定位 source RM：优先读 `change-meta.json` / `task-manifest.json` 的 `sourceRoadmap.itemId`，再用 `locate-roadmap-item.sh` 对照 `devflow/roadmap.json`、`devflow/ROADMAP.md` 和 optional `devflow/BACKLOG.md`；如果 roadmap 状态和 verified reality 冲突，先同步或 reroute，不能继续 ship。
8. 如果在 `cc-act` 期间因为 `cc-simplify`、单测、e2e、review 修复而改了代码，必须回 `cc-check`，不能带着旧证明继续 ship。

## Ship Modes

`cc-act` 只允许 4 种模式，避免“收尾”变成模糊动作：

1. `create-pr`
   - 当前在 feature branch
   - 或当前在 detached HEAD 但可以通过 `ensure-ship-branch.sh` 在 HEAD 上创建命名分支
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
   - 重点是 merged-result verification、release note、doc sync、backlog writeback、归档

不要发明第五种模糊模式。

## Minimum Output By Mode

先做最小必要交付，再补充可选材料：

1. `create-pr`
   - 必须有 `handoff/pr-brief.md`
   - 必须完成需要同步的 doc updates
   - 如果 `CURRENT_BRANCH` 为空但 `BRANCH_RESCUE=create-branch-before-pr`，必须先运行 `scripts/ensure-ship-branch.sh --dir <requirement-dir>`，再继续 commit / push / PR
   - 新增提交必须遵守 `references/git-commit-guidelines.md`
   - 远端可用时必须完成 commit、push、`gh pr create`
2. `update-pr`
   - 必须有更新后的 `handoff/pr-brief.md`
   - 必须说明这次新增了什么验证或文档同步
   - 必须避免重复创建 PR / MR
   - 新增提交必须遵守 `references/git-commit-guidelines.md`
   - 如果有新增提交，必须 push 并刷新 PR / MR 内容
3. `local-handoff`
   - 必须有更新后的 `handoff/resume-index.md`
   - 必须写清接手入口、验证方式、当前阻塞
4. `post-merge-closeout`
   - 必须完成 doc sync
   - 需要对外说明时生成 `handoff/release-note.md`
   - 必须把 follow-up 回写到 `devflow/roadmap.json`，并重新生成 `devflow/ROADMAP.md` / `devflow/BACKLOG.md`

不是每次都要把所有文件生成一遍。材料必须服务于当前 ship 模式，而不是为了流程好看。

## Pre-Ship Validation

在真正写交付材料或推远端之前，先把这 4 件事做完：

1. `Simplify`
   - 通过当前运行时可用的 skill 调用器调用 `cc-simplify`
   - 如果桥接环境暴露为 `${JM}`，就按 `${JM}` + `skill: "cc-simplify"` 执行
   - 目标不是再开发新范围，而是清理重复、坏味道、低效实现
2. `Run unit tests`
   - 先检查项目的标准测试入口，例如 `package.json` scripts、`Makefile`、`bun test`、`pytest`、`go test`
   - 选择该项目实际存在的单测入口执行
   - 失败就修，但修完必须回 `cc-check` 刷新证明
3. `Test end-to-end`
   - 严格按协调器 prompt 里的 e2e recipe 执行
   - 如果 recipe 明确要求跳过，记录 skip 原因，不要伪造执行
   - e2e 失败并导致代码修改时，同样回 `cc-check`
4. `Commit and push`
   - 只对 `create-pr` / `update-pr` 模式生效
   - 所有验证通过后再 commit，并遵守 `references/git-commit-guidelines.md`
   - push 当前分支，并用 `gh pr create` 创建 PR；已有 PR 时只更新，不重复创建
   - `gh` 不可用、push 失败、远端不可达时，切到 `local-handoff` 并把阻塞写清楚

这 4 步只接受两种结果：`全部完成` 或 `明确 reroute / handoff`。不要停在“差不多已经好了”。

## Ship Discipline

`cc-act` 的 ship 动作必须是幂等、可审计、可复跑的：

1. Base and branch：识别 base branch、当前 branch、远端状态、已有 PR / MR，所有 diff/log/push 都基于同一个 base。
   - detached HEAD 是可恢复的分支事实，不是交付模式；能创建分支时，先锚定命名分支再继续。
2. Scope completion：PR 简报必须包含 `cc-check` 的 plan completion、scope drift、review finding、验证结果摘要。
3. Version and changelog：如果项目有 `VERSION`、`package.json`、`CHANGELOG.md`，先判断是否已 bump / 是否漂移；不要重复 bump，也不要覆盖 changelog。
4. Bisectable commits：提交按逻辑单元拆分，顺序保证每个 commit 独立可理解、尽量可验证；小于 50 行且少于 4 文件可单 commit。
5. Fresh final verification：每次进入 `cc-act` 都要重跑 entry gate、simplify、单测、e2e 或记录 skip；只有 push、PR 更新、doc 生成这类动作可以幂等跳过。以前跑过不等于现在仍然可信。
6. Push idempotency：push 前比较 local/remote HEAD；已同步就不重复 push，不可用就切 `local-handoff`。
7. PR idempotency：已有打开的 PR / MR 只更新 body，不重复创建。
8. Review range：PR brief / PR body 必须写清 `cc-check` 审过的 base/head SHA、review packet、finding triage 摘要。
9. Post-integration verification：本地合并或 post-merge closeout 后，必须在 merged result 上跑必要 gate；不能只继承合并前绿色。
10. Follow-up durability：PR brief / release note / backlog writeback 里的 follow-up 必须写成行为契约，包含 current behavior、desired behavior、key interfaces、acceptance criteria、out of scope；不要把当前文件路径或行号当成长期计划。
11. Remote state consistency：如果本次 closeout 触碰 GitHub issue / PR / tracker，必须记录当前 state、目标 state、允许转换、已保留事实和下一位 owner；`needs-info` 必须保留已确认事实和具体问题，`ready-for-agent` 必须有可执行 brief。
12. Tooling smoke：如果本次改动影响 hook、pre-commit、lint、publish、adapt 或验证脚本，必须跑真实入口或最接近真实入口的 smoke；只读配置文件不等于工具链可用。

## Ship Preflight And Rescue

ship preflight 必须结构化记录：

- `branch`: 当前分支、base、remote、local/remote HEAD 关系
- `auth`: `gh` / registry / deploy / package publish 等权限是否可用
- `workspace`: clean tree、staged files、未跟踪文件和相关 stash
- `reviewFreshness`: `cc-check` 审查范围是否仍绑定当前 HEAD
- `shipMode`: `create-pr` / `update-pr` / `local-handoff` / `post-merge-closeout`

任何 preflight failure 都必须命名为 `ShipPreflightError`，并写清 rescue action。
不能用“工具不可用”当作模糊失败；要明确切 `local-handoff`、补 auth、刷新 review，
还是返回 `cc-check`。

rollback guard 必须在 publish、merge、PR 更新或 release note 前写清：

- safe state
- rollback command 或人工回退步骤
- data / migration / package / remote side effect
- owner

没有 rollback guard 的 release 只能停在 handoff，不准发布。

## Readiness Dashboard

PR / handoff 之前必须把 readiness 压成一屏事实：

1. Review freshness：`review.freshness.status` 必须是 `fresh` 或 `not-applicable`。
2. Review quality：记录 `review.qualityScore`、specialist facet 覆盖、finding triage 摘要。
3. QA coverage：记录 `qa.coverageAudit` 的 coverage、gaps、e2e/eval requirement。
4. Browser QA：UI / 用户路径变更必须有 `qa.browserEvidence`，否则要有 skip reason。
5. Feedback loop：bugfix / 行为变更必须有 `qa.feedbackLoop`，否则要有不可复现或不适用原因。
6. Behavior evidence：expected / actual / reproduction steps 必须能被 reviewer 独立理解。
7. Failure ownership：`runtime.failureOwnership` 不能有未解释的 `in-branch` 或 `ambiguous` failure。
8. Documentation release：README / CLAUDE / architecture / handoff / changelog 的同步状态必须可审计。
9. PR body accuracy：PR body 必须从当前 `pr-brief.md`、当前 diff、当前 report-card 重建；已有 PR body 只能被刷新，不能被继承。

readiness dashboard 有 blocker 时，不能创建或更新 PR，只能 reroute 到 `cc-check` / `cc-do` 或生成 local handoff。

## Integration Safety

`cc-act` 可以清理交付路径，但不能悄悄做破坏性动作：

1. 删除 feature branch、删除 worktree、丢弃提交、归档 requirement 前，必须列出受影响对象。
2. 丢弃未合并工作必须要求用户显式确认；没有确认时只能转 `local-handoff`。
3. branch cleanup 只发生在 merge / PR / discard 语义已经清楚之后。
4. `post-merge-closeout` 必须记录 merged-result verification：命令、exit status、关键观察、失败时 reroute。
5. 危险 Git 动作必须有明确 ship 语义：`git push` 只在 `create-pr` / `update-pr` / release lane 执行，`git reset --hard`、`git clean -f`、`git branch -D`、整树 restore/checkout 必须先列出对象并取得用户确认；没有确认时写 handoff，不执行。

## Documentation Release

文档同步要作为发布链路的一部分，而不是 PR 后的人工补丁：

1. Diff audit：按最终 diff/log 识别新增能力、行为变化、删除项、基础设施变化。
2. Per-file audit：检查 README、CLAUDE、ARCHITECTURE、CONTRIBUTING、docs、handoff 是否与 diff 矛盾。
3. Auto-update facts：路径、命令、计数、skill 列表、入口链接、明显过期事实可以直接更新。
4. Risky narrative gate：产品定位、安全模型、架构哲学、大段删除、含义改变的 changelog 改写必须停下说明。
5. Changelog protection：只允许润色既有条目或新增由当前 diff 支撑的条目，不能重写历史、删除已有发布说明。
6. Discoverability：新增文档必须能从 README、CLAUDE 或 handoff 入口找到。
7. TODO/backlog cleanup：只把有 diff 证据完成的事项移到 completed；新 follow-up 写回 backlog/roadmap。

## Issue And Follow-Up Handoff

当本次交付产生或更新 issue / PR / backlog follow-up 时，文案必须耐 refactor：

- 先写用户可观察行为：what happened / expected / reproduction 或 desired behavior。
- 再写 agent 可执行 contract：acceptance criteria、allowed scope、blocked by、verification command。
- 不把短期文件路径、行号、函数名写成长期事实；只有当前 reviewer 需要定位时才放进 PR brief 的实现备注。
- 多个 follow-up 必须按独立可验证切片拆开，并标明 `AFK` / `HITL`、blocked-by 和 owner。
- 已经问过或确认过的信息不能在 `needs-info` 里丢失；问题必须具体到 reporter 能直接补证据。

## Loop

1. 先锁定 ship 事实：当前分支、base branch、PR 状态、requirement 状态。
2. 调用 `cc-simplify`，清理重复、坏味道、低效实现；如果因此改了代码，回 `cc-check`。
3. 运行项目单测；失败就修，修完回 `cc-check`。
4. 按协调器 recipe 执行 e2e；如果 recipe 允许 skip，记录 skip 理由；如果失败并修复，回 `cc-check`。
5. 先把 `change-meta.json.spec.syncStatus` 从 `planned/verified` 推进到 `synced`，并正式回写 capability spec 与 `devflow/specs/INDEX.md`；只在 spec truth 更新后继续交付材料。
6. 只使用 `cc-check` 已经证明过的事实写交付材料，不编故事，不补脑。
7. 同步文档：
   - 结构变了，更新对应目录的 `CLAUDE.md`
   - 用户可感知行为变了，更新 `README.md` / `handoff/release-note.md`
   - handoff 变了，更新 `handoff/resume-index.md`
8. 执行 documentation release audit：保护 changelog，检查 discoverability，记录 doc sync 结果。
9. 生成 `handoff/pr-brief.md`，把需求、变更、验证证据、风险、文档同步状态一次写清。
   - 优先运行 `scripts/sync-act-docs.sh --dir <requirement-dir>`
   - 再运行 `scripts/render-pr-brief.sh --dir <requirement-dir>`
10. 执行分支集成动作：
   - `create-pr`：按 `references/git-commit-guidelines.md` 完成提交并推分支，再优先使用 `gh pr create` 创建 PR / MR
     - detached HEAD 且远端可用时，先运行 `scripts/ensure-ship-branch.sh --dir <requirement-dir>`；创建分支成功后，不再停在 `local-handoff`
   - `update-pr`：如果有新提交，先按 `references/git-commit-guidelines.md` 完成 commit / push，再刷新 PR / MR body，不沿用陈旧内容
   - `local-handoff`：不假装已经发出，只生成可接手材料
   - `post-merge-closeout`：跳过 PR，完成发布与闭环回写
11. 处理 PR / MR body：从当前 `pr-brief.md`、最新验证、review、doc sync、TODO/backlog 结果重新渲染，不复用旧 body。
12. 在 `handoff/pr-brief.md` 写入 readiness dashboard 与 PR body accuracy check；已有 PR body 与当前事实不一致时先刷新再继续。
13. 回写 `devflow/roadmap.json` 并重新生成 `devflow/ROADMAP.md` / `devflow/BACKLOG.md`：
   - 新发现的 follow-up
   - 被推迟但必须保留的事项
   - 因本次结果而改变优先级的事项
14. 用 `sync-roadmap-progress.sh` 更新 source RM 的 status、REQ/FIX 绑定和 progress：`create-pr` / `update-pr` 通常写 `In review` + `100%`，`local-handoff` 写 `Ready for handoff`，`post-merge-closeout` 写 `Done`；如果无 source RM，必须在 handoff 写 no-op reason。
15. 如果 requirement 真正闭环，更新状态摘要并归档：运行 `cc-devflow archive-change <change-key>` 将已完成变更移入 `devflow/changes/archive/YYYY-MM/`；否则把下一位接手者的入口写清楚。

## Output

- `handoff/pr-brief.md`
- `handoff/release-note.md`（需要对外发布时）
- 更新后的 `handoff/resume-index.md`
- 同步后的 `CLAUDE.md` / README / 架构文档
- 必要时更新后的 `devflow/roadmap.json` / `devflow/ROADMAP.md` / `devflow/BACKLOG.md`
- 单测 / e2e 的通过证据，或明确记录的 skip / blocker
- 必要时创建或更新的 PR / MR
- PR / MR body 中的 Summary、Test Coverage、Pre-Landing Review、Scope Drift、Plan Completion、Verification Results、Documentation、Test plan
- readiness dashboard 和 PR body accuracy check

## Good Output

一个好的 `cc-act` 结果应该让 reviewer 或下一位接手者不用追问：

- 这次到底选了哪种 ship 模式，为什么不是另外三种
- 哪些材料已经准备好，哪些刻意不需要
- 现在谁都可以顺着 `handoff/pr-brief.md` 或 `handoff/resume-index.md` 继续往前走
- 文档、PR 描述、release note 说的是同一套现实
- `cc-simplify`、单测、e2e、commit/push 的结果都能被接手者追溯
- source RM 的 status、REQ/FIX 绑定、progress 和 follow-up 已经和 ship 现实一致

## Bundled Resources

- 变更记录：`CHANGELOG.md`
- 契约：`references/closure-contract.md`
- 模板：`assets/PR_BRIEF_TEMPLATE.md`
- 模板：`assets/RELEASE_NOTE_TEMPLATE.md`
- 提交规范：`references/git-commit-guidelines.md`
- 状态摘要：`scripts/generate-status-report.sh`
- Gate 校验：`scripts/verify-act-gate.sh`
- Ship 目标识别：`scripts/detect-ship-target.sh`
- detached HEAD 分支锚定：`scripts/ensure-ship-branch.sh`
- 文档同步：`scripts/sync-act-docs.sh`
- PR 简报生成：`scripts/render-pr-brief.sh`
- 变更归档：`scripts/archive-change.sh`
- Roadmap 定位：`../cc-roadmap/scripts/locate-roadmap-item.sh`
- Roadmap 回写：`../cc-roadmap/scripts/sync-roadmap-progress.sh`

## Working Rules

1. `cc-check` 没过，不准 ship。
2. 没有新鲜证据的完成结论，不准进入交付材料。
3. 交付材料只总结现实，不重写历史。
4. 文档必须与最终代码和 ship 状态同构。
5. 分支决策必须明确属于 4 种模式之一，不要含糊。
6. 已存在 PR / MR 时，优先更新，不重复创建。
7. `cc-simplify`、单测、e2e 任何一步只要导致代码变化或验证口径变化，必须回 `cc-check`。
8. `devflow/roadmap.json` 只回写真正改变优先级或产生 follow-up 的事项，并用 `sync-roadmap-progress.sh` 重新生成 `devflow/ROADMAP.md` / `devflow/BACKLOG.md`，不写噪音。
9. `local-handoff` 不是偷懒模式，它仍然必须让下一位接手者知道做什么、怎么验证、卡在哪。
10. `create-pr` / `update-pr` 模式默认要求提交历史符合 `references/git-commit-guidelines.md`，并完成正确的 push、PR 创建或更新动作。
11. detached HEAD 不是小问题停下来的理由；当用户目标是继续或提交远程 PR，先创建命名分支并重跑验证，再推进 `create-pr`。
12. CHANGELOG 只能基于当前 diff / commit history / release truth 更新，不允许覆盖既有历史条目。
13. PR / MR body 每次都从当前事实重建，不沿用旧 body 或旧测试输出。
14. Verification 每次执行 `cc-act` 都必须重新运行；只有已完成且可证明幂等的动作可以跳过。
15. source RM 找不到时不能编造新 RM；写 no-op reason。如果 follow-up 改变阶段顺序或优先级，reroute 到 `cc-roadmap`。

## Exit Criteria

- gate 闭合且现实一致
- ship 模式已明确并执行到位
- reviewer / maintainer 能直接接手
- 需要同步的文档已经同步
- `cc-simplify`、单测、e2e 已执行完毕，或 skip / blocker 已被明确记录
- source RM 已回写最新进度，follow-up 已回写到正确的 backlog / roadmap 位置
- 下一轮该怎么继续已经写清楚
- requirement 不是“看起来结束”，而是真正闭环

## Do Not

- 不把发布动作偷偷塞回 `cc-check`
- 不拿旧测试输出冒充当前事实
- 不跳过 `cc-simplify`、单测、e2e 却声称 ready
- 不重复创建 PR / MR
- 不让 handoff 只停留在口头描述
- 不留“下次再说”的关键空洞
- 不在 `cc-act` 阶段继续偷偷开发新范围

## Companion Files

- 深入剧本：`PLAYBOOK.md`
- 变更记录：`CHANGELOG.md`
- 收尾契约：`references/closure-contract.md`
- 提交规范：`references/git-commit-guidelines.md`
