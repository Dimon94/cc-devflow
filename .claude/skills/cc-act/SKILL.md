---
name: cc-act
version: 1.15.0
description: Use when verified work must be committed, handed off, pushed, merged into local main, or turned into a PR with the smallest durable delivery surface.
triggers:
  - 准备提 PR
  - 帮我发版
  - 收尾
  - ship this
  - handoff
  - close this requirement
reads:
  - PLAYBOOK.md
  - references/closure-contract.md
  - references/git-commit-guidelines.md
  - assets/PR_BRIEF_TEMPLATE.md
  - assets/PROJECT_POSTMORTEM_TEMPLATE.md
  - assets/PROJECT_POSTMORTEM_INDEX_TEMPLATE.md
  - docs/guides/project-postmortem.md
  - ../cc-dev/scripts/resolve-cc-devflow.sh
  - scripts/ensure-ship-branch.sh
  - scripts/evaluate-postmortem-trigger.sh
  - ../cc-dev/references/user-choice-output-protocol.md
  - references/checklist-contract.md
writes:
  - path: devflow/changes/<change-key>/handoff/pr-brief.md
    durability: durable
    required: false
    when: creating or updating a PR
  - path: devflow/postmortems/INDEX.md
    durability: durable
    required: false
    when: closing a FIX or recurring AI/process/engineering failure
  - path: devflow/postmortems/incidents/<date>-<change-key>.md
    durability: durable
    required: false
    when: closing a FIX or recurring AI/process/engineering failure
effects:
  - final Git commits
  - optional local-main fast-forward merge
  - optional push or PR creation
  - archive completed change after merge when requested
entry_gate:
  - "Resolve the CLI with `../cc-dev/scripts/resolve-cc-devflow.sh require config`."
  - "Read `task.md`, Git status, latest commits, validation evidence, and current PR state when relevant."
  - "Identify release-readiness gates from the verified scope: local checks, config/env, migrations/data, deploy/health, smoke/cleanup, rollback, and watch items. Mark irrelevant gates as skipped with reason instead of inventing release work."
  - "Read `task.md#Failure Ledger`; only confirmed entries marked `Keep for postmortem: yes` are long-term incident input, including eligible review escape candidates."
  - "Run `scripts/evaluate-postmortem-trigger.sh --dir <change-dir>` before deciding no incident postmortem is needed."
  - "If verification changed during Act, return to `cc-check`."
  - "If the delivery mode is not already explicit, ask the user to choose with `../cc-dev/references/user-choice-output-protocol.md`; do not default every closeout to remote push, PR, or local-main merge."
  - "Pick one mode: `create-pr`, `update-pr`, `local-handoff`, `local-main-merge`, or `post-merge-closeout`."
exit_criteria:
  - "All completed work is committed with coherent Conventional Commit messages."
  - "PR mode writes or refreshes only `handoff/pr-brief.md`."
  - "Postmortem trigger gate is explicit: either `POSTMORTEM_REQUIRED=no` is reported, or the incident postmortem path is written with `Workflow Patch Candidate` completed."
  - "Release-readiness gate status is explicit in PR/handoff output or final response: passed, failed, skipped with reason, blocked with missing evidence, or not applicable."
  - "No process file is created beyond the allowed durable outputs."
  - "Push, PR, local handoff, or local-main merge status is explicit."
reroutes:
  - when: Verification is stale, incomplete, or changed during Act.
    target: cc-check
  - when: Act reveals unfinished implementation or unresolved findings.
    target: cc-do
tool_budget:
  read_files: 8
  search_steps: 5
  shell_commands: 11
---

# CC-Act

## Read First

1. `references/checklist-contract.md`

`cc-act` 把已经验证的现实落地。它不再制造收尾文档农场。

允许保留的 durable 输出只有：

- `devflow/changes/<change-key>/handoff/pr-brief.md`
- `devflow/postmortems/INDEX.md`
- `devflow/postmortems/incidents/<date>-<change-key>.md`

其余状态和历史交给 Git。不要写额外过程文件。

## Ship Modes

- `create-pr`: feature branch 可推送且没有现有 PR。
- `update-pr`: 已有 PR，需要更新提交或 body。
- `local-handoff`: 不推远端，但本地 commit 和下一步清楚。
- `local-main-merge`: 用户明确要求本地合并时，rebase 当前工作分支到本地 `main`，再从 owning main checkout 执行 `git merge --ff-only <work-branch>`；不推远端。
- `post-merge-closeout`: 已合并后的验证、归档、尸检。

## Delivery Choice

如果用户没有明确要求远程 PR、更新 PR、本地合并或 post-merge closeout，`cc-act` 必须先让用户选择 delivery mode，而不是默认推送远端、创建 PR 或合并本地 `main`。

使用 `../cc-dev/references/user-choice-output-protocol.md`：

- Codex App / Codex 工具环境：优先调用 `request_user_input`，选项包含 `local-handoff` 与 `create-pr`，必要时包含 `update-pr`、`local-main-merge` 或 `post-merge-closeout`。
- Claude Code：如果有 MCP elicitation / ask-question 工具，使用结构化单选；否则输出固定 A/B/C 文本块并停止。

默认推荐规则：

1. 已有 PR 且本轮只是更新交付物：推荐 `update-pr`。
2. 用户明确要远程协作、审查或发布：推荐 `create-pr`。
3. 用户只要求本地提交、个人项目收尾，或远程上下文缺失：推荐 `local-handoff`，说明下一步可以 rebase 后 fast-forward 合并到本地主分支。
4. 用户明确要求 rebase 并合并到本地 `main`：推荐 `local-main-merge`。
5. 已经合并并要求归档 / closeout：推荐 `post-merge-closeout`。

## Local Main Merge

`local-main-merge` 是本地交付动作，不是远程发布动作。它只在用户明确要求本地 `main` 合并时执行。

Required proof:

1. Fresh `cc-check` pass evidence exists for the work branch.
2. Work branch is committed and has no unexpected dirty scope.
3. Owning primary checkout path is known and currently on `main`.
4. Local `main` is clean enough for the merge surface.
5. Work branch rebases onto current local `main`.
6. Owning main checkout runs `git merge --ff-only <work-branch>`.
7. Final proof shows local `main` contains the delivered commit.
8. No `git push` runs unless the user separately requested it.

If any proof is missing, stop as blocked or route back to `cc-check` / `cc-do`; do not downgrade to `local-handoff` while claiming the local merge happened.

## PR Brief

`pr-brief.md` 只服务 PR / handoff，内容来自当前 Git diff、commits、`task.md`、验证命令和 release-readiness gate。不要继承旧 PR body；每次创建或更新 PR 前重建。

## Postmortem

先运行：

```bash
scripts/evaluate-postmortem-trigger.sh --dir devflow/changes/<change-key>
```

只在这些情况写 incident postmortem：

1. change key 是 `FIX-*`。
2. 暴露重复 AI、流程、测试、release、Git 或架构错误。
3. 用户明确要求记录教训。

如果本轮会话出现了返工、reroute、三次修补仍失败、发布/Git/验证工具异常，但这些信号还没有进入 `task.md` 或 Git history，调用脚本时用 `--trigger <short-label>` 把会话证据纳入本次 gate。没有触发时，最终响应也必须写明 `POSTMORTEM_REQUIRED=no`。

尸检报告必须基于 Git 证据、验证命令和 `task.md#Failure Ledger` 中已确认的失败资产。不要把 raw `cc-review` findings、聊天记忆或未分类 review escape candidates 写成尸检事实。不要把教训拆成额外原则文件。

## Failure Compression

`cc-act` 负责把现场失败压缩成长期知识：

1. 读取 `Failure Ledger`。
2. 丢弃 `noise` 和未解决的 `unresolved-risk`，除非用户明确要求记录。
3. 只把 `confirmed-lesson` 且 `Keep for postmortem: yes` 的条目写进 incident postmortem；`Source=cc-review` 的 review escape candidates 也必须先经过 `cc-check` 分类。
4. 每份 incident postmortem 必须完成 `Workflow Patch Candidate`：
   - `no-action`：说明为什么只记忆、不改 workflow。
   - `skill-rule`：目标 skill 和最小规则。
   - `template-field`：目标模板和字段。
   - `script-guard`：目标脚本和失败条件。
   - `regression-test`：目标测试或 fixture。
   - `roadmap-followup`：目标 roadmap/backlog 行为 brief。
5. 如果候选补丁会改验证口径或代码，收尾后 reroute 到 `cc-check` 或新 REQ/FIX，不把未验证的新规则塞进当前交付。

## Commit Rule

PDCA / IDCA 每个阶段或执行环境完成后都提交 Git commit。Git history 是过程记录，不再用过程文件模拟状态机。

## Exit

最终响应说明 commit、验证、PR、本地 handoff 或 local-main merge 状态，以及是否写了 incident postmortem。


## Default Output

Keep the final response short and fixed:

1. Commit: latest commit hash or explicit uncommitted state.
2. Verification: fresh evidence reused from cc-check or reroute reason.
3. Delivery: PR URL, updated PR, local handoff path, local-main merge proof, or post-merge closeout state.
4. Postmortem: `POSTMORTEM_REQUIRED=no` or incident path written with workflow patch candidate.
5. Release: gate status, rollback/watch path, or explicit not-applicable reason.
6. Route: terminal state or next skill.

## Checklist Contract

Follow `references/checklist-contract.md` before each pause point. The checklist is the local do-confirm/read-do contract for this skill; skip only with an explicit blocker or route.
