---
name: cc-investigate
version: 1.13.1
description: Use when a bug, regression, broken task, or unexpected behavior needs root-cause investigation before coding resumes.
triggers:
  - 帮我查这个 bug
  - 先别修先找根因
  - debug this bug
  - investigate this regression
  - why is this broken
  - root cause this
reads:
  - PLAYBOOK.md
  - references/investigation-contract.md
  - docs/guides/project-postmortem.md
  - assets/TASKS_TEMPLATE.md
  - ../cc-dev/scripts/resolve-cc-devflow.sh
  - ../cc-dev/scripts/detect-worktree-state.sh
  - ../cc-dev/scripts/prepare-change-worktree.sh
  - ../cc-dev/scripts/ensure-work-branch.sh
  - ../cc-roadmap/scripts/locate-roadmap-item.sh
  - ../cc-roadmap/scripts/sync-roadmap-progress.sh
  - ../cc-dev/references/user-choice-output-protocol.md
  - references/checklist-contract.md
writes:
  - path: devflow/changes/<change-key>/task.md
    durability: durable
    required: true
effects:
  - roadmap progress sync when a source item exists
  - Git commit after the Investigate stage is complete
entry_gate:
  - Resolve the CLI with `../cc-dev/scripts/resolve-cc-devflow.sh require next-change-key config`.
  - Assign a FIX change key through `next-change-key --prefix FIX --description "<short bug name>"`.
  - Detect the current Git surface with `../cc-dev/scripts/detect-worktree-state.sh` before preparing the FIX worktree.
  - Prepare an isolated FIX worktree before writing `task.md`; keep the main checkout on `main`.
  - Enforce the Worktree Branch Contract inside the returned FIX worktree.
  - Reproduce or build the closest honest feedback loop before naming root cause.
  - Classify the investigation mode before tracing: reproduce-first, diff-trace, boundary-probe, backward-trace, reference-compare, condition-wait, workflow-forensics, performance, or diagnose-only.
  - Search relevant code, logs, recent history, and project postmortems before declaring the bug novel.
  - Inspect the current state before asking technical detail or solution questions; phenomenon questions may capture reproduction facts, but solution confirmation starts only after symptom, feedback loop, and evidence chain are grounded.
  - Run the Investigation Socratic Dialogue Protocol before freezing the repair boundary when technical details or solution shape need user confirmation.
  - Persist a Dialogue Checkpoint in `task.md#Root Cause Contract` before asking question rounds 11, 21, 31, and every next tenth round.
  - Use `../cc-dev/references/user-choice-output-protocol.md` for repair-boundary choices; prefer host-native structured choice UI and fall back to the fixed A/B/C text block only when no such tool exists.
  - Record hypotheses with falsification methods; do not collapse first intuition into root cause.
exit_criteria:
  - "`task.md#Root Cause Contract` proves symptom site, first bad state, violated contract, original trigger, counterfactual proof, and escape reason."
  - "`task.md#Root Cause Contract` records investigation mode, feedback loop, evidence chain, tested hypotheses, boundary/backward/reference evidence when applicable, correct test seam, and diagnose-only boundary when applicable."
  - "`task.md#Root Cause Contract` contains ASCII Branch Chain Analysis trees for problem chain, solution chain, and impact chain, tracing upstream root cause and downstream blast radius to the deepest proven prompt/code/provider/data source; tree connector characters stay ASCII while node text follows the configured output language."
  - "`task.md#Root Cause Contract` records Investigation Socratic Dialogue rounds, including repo-answered facts, user-answered phenomenon gaps, ten-round Dialogue Checkpoints, the 3 hidden repair assumptions, overengineering / symptom-fix challenge, adversarial review findings, and explicit user release to freeze repair tasks when confirmation was needed."
  - "`task.md` contains the repair tasks needed by `cc-do`."
  - "Evidence gaps produce Evidence Request, diagnose-only, or reroute tasks instead of fake repair tasks."
  - "No process file is created beyond `task.md`."
  - "Source roadmap progress is synced or explicitly skipped in the final response."
  - "Investigate-stage changes are committed to Git before handing off to `cc-do`."
reroutes:
  - when: The issue is actually missing scope, spec truth, or product direction.
    target: cc-plan
  - when: Project priority or sequencing is the real question.
    target: roadmap
  - when: Root cause and repair boundary are already frozen.
    target: cc-do
tool_budget:
  read_files: 8
  search_steps: 5
  shell_commands: 6
---

# CC-Investigate

## Read First

1. `references/checklist-contract.md`
2. `references/investigation-contract.md`

`cc-investigate` 是 IDCA 的 `Investigate`。它把 bug 现象压成根因合同，并把修复边界写入同一个 `task.md`。

唯一默认输出：

- `devflow/changes/<change-key>/task.md`

不要生成额外过程文件。Git commit 是阶段历史，`task.md` 是根因合同。

## Iron Law

```text
NO REPAIR WITHOUT A FROZEN ROOT-CAUSE CONTRACT
```

根因不是报错点，而是坏状态第一次被制造的地方。

## Progressive Disclosure

入口只保留根因调查的硬门禁。完整 mode definitions、Evidence Flow、Socratic repair dialogue、ASCII Branch Chain 模板和 Root Cause Proof Ladder 在 `references/investigation-contract.md`。需要用户选择 repair boundary 时，再读 `../cc-dev/references/user-choice-output-protocol.md`。

按需打开：

- `docs/guides/project-postmortem.md`：近期故障、重复问题或 escape reason 需要历史证据时。
- `assets/TASKS_TEMPLATE.md`：根因和 repair boundary 冻结后，生成 repair tasks 前。
- roadmap helper scripts：只有存在 source roadmap item 或需要同步进度时。

## Investigation Loop

1. Classify：先按 `references/investigation-contract.md` 选 investigation mode。
2. Detect：分配 FIX change key 后先运行 `../cc-dev/scripts/detect-worktree-state.sh`，用只读 helper 确认当前是 primary / linked / submodule / detached 中哪一种状态。
3. Anchor：再运行 `../cc-dev/scripts/prepare-change-worktree.sh --change-key <FIX-...>`，从主 checkout 创建或复用独立 FIX worktree；进入返回的 `WORKTREE_PATH` 后必须得到 exact-case `FIX/...` 分支。大小写碰撞、submodule 入口、错误 linked worktree 或目标分支不匹配都是 setup blocker。
4. Reproduce：用测试、脚本、日志、浏览器路径或最小 harness 证明同一个症状。
5. Trace：找到 first bad state，而不是只给 symptom guard。
6. Hypothesize：列候选，写证伪方法，逐个打掉。
7. Grill：现状查完后，如果需要确认技术细节或解决方案，用一问一答继续追问；用户没有明确说足够详细前，不冻结 repair tasks。
8. Prove：完成 Root Cause Proof Ladder。
9. Freeze：把根因、ASCII Branch Chain Analysis、修复边界、测试 seam、allowed/forbidden files 写进 `task.md`。
10. Commit：提交 Investigate 阶段，再交给 `cc-do`。

## Evidence Flow

调查结果写入 `task.md#Root Cause Contract`，不要拆新文件。最小证据、mode-specific evidence、Socratic Dialogue、Branch Chain 和 proof ladder 都按 `references/investigation-contract.md` 执行。缺 first bad state、original trigger 或 counterfactual proof 时，只能写 Evidence Request、diagnose-only 或 reroute。

## Root Cause Proof Ladder

- L1 Symptom Site
- L2 First Bad State
- L3 Violated Contract
- L4 Original Trigger
- L5 Counterfactual Proof
- L6 Escape Reason

缺 L2、L4 或 L5 时，只能写 Evidence Request、diagnose-only 或 reroute。

Escape reason 不能写成人工提醒；它必须变成 regression test、artifact guard、capability invariant、operator check 或明确 follow-up。

## Handoff

退出时只说清：

- change key 和分支
- `task.md` 路径
- 复现 / 证据命令
- Investigate commit hash
- 下一步 `cc-do` 或 reroute


## Default Output

After freezing investigation truth, answer with:

1. Change: FIX key and `task.md` path.
2. Symptom: reproduced or closest honest feedback loop.
3. Root cause: first bad state and violated contract.
4. Repair boundary: allowed files, forbidden files, and test seam.
5. Evidence gaps: none, diagnose-only boundary, or evidence request.
6. Route: `cc-do`, `cc-plan`, `roadmap`, or `stop`.

## Checklist Contract

Follow `references/checklist-contract.md` before each pause point. The checklist is the local do-confirm/read-do contract for this skill; skip only with an explicit blocker or route.
