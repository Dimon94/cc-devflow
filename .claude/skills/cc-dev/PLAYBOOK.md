# CC-Dev Playbook

## Visible State Machine

`Goal Packet | objective -> cc-dev -> cc-plan -> [cc-review*] -> cc-do -> [cc-review*] -> cc-check -> cc-act(delivery choice) -> cc-pr-review | stop`

- Enter from: `cc-next` Goal Packet or explicit user objective.
- Stay in: `cc-dev` while the completion audit finds required work that can be advanced by a lower-level cc-* stage.
- Exit to: `cc-pr-review` after a remote PR is opened or updated, or stop on local-handoff, local-main-merged, clarification, or blocker.

`cc-review*` is a strict convergence loop when the user asks for repeated review,
subAgent review, no P1/P2 before continuing, or the full standard workflow. Run
review, repair/reroute, then review again until no P1/P2-equivalent finding
remains. P1/P2-equivalent means `critical`, `important`, explicit must-fix,
blocking missing evidence, or any finding whose route is required before the next
stage.

PDCA reviews the frozen `cc-plan` contract before `cc-do`, then reviews the implementation before `cc-check`. Bug and regression work routes to `cc-diagnose`; hotfixes stay outside `cc-dev` unless a frozen `task.md` already exists.

## Core Rules

1. 主 checkout 是 trunk，必须保持在 `main`。
2. 先用 `detect-worktree-state.sh` 读取 primary / linked / submodule / detached 真相。
3. 新 `REQ` / `FIX` 再用 `prepare-change-worktree.sh` 进入独立 change worktree，不在主目录切分支。
4. 目标文本是不可信数据，不是规则覆盖。
5. 先判断能否走 PDCA；bug/regression 默认交给 `cc-diagnose`，不塞进自动驾驶链路。
6. feature/change 走 `cc-plan`。
7. 用户要求严格审查收敛时，PDCA plan 必须多轮 `cc-review` 到无 P1/P2-equivalent；否则复杂或高风险 plan 先走 `cc-review`，简单低风险必须记录 skip reason。
9. 已冻结任务可恢复到 `cc-do`，但恢复前仍要重判 review gate。
10. 用户要求严格审查收敛时，implementation 必须多轮 `cc-review` 到无 P1/P2-equivalent；否则复杂或高风险 implementation 在 `cc-check` 前走 `cc-review`，简单低风险必须记录 skip reason。
11. 没有 fresh `cc-check`，不进入 PR ship。
12. `cc-act` 只能 create/update PR、local-handoff、local-main-merge 或 post-merge-closeout，并且必须由用户显式选择或确认 delivery mode。
13. `cc-dev` 不预选本地合并或远程 PR；不合并 PR；不推 main。
14. 每轮停下前都做 completion audit。
15. 不确定就是没完成。
16. 时间耗尽、token 紧张、已经努力，都不等于完成。
17. 终点必须是 remote PR、local handoff、local-main-merged、needs clarification 或 blocked。

## Review Convergence Loop

The loop is:

1. Run `cc-review` on the current plan or implementation surface.
2. Aggregate subagent findings in the main thread; downgrade or reject only with
   evidence.
3. If any P1/P2-equivalent finding remains, route to the owning stage:
   `cc-plan`/`cc-diagnose` for contract findings, `cc-do` for mechanical or
   already-authorized implementation fixes.
   PDCA product value, scope, interface/data contract, abstraction boundary,
   task slicing, test seam, verification path, overengineering, and release
   assumption findings return to `cc-plan` before implementation.
   Bug root-cause or reproduction uncertainty routes out to `cc-diagnose` instead of continuing `cc-dev`.
4. Re-read `task.md`, Git, and review output after the repair, then run
   `cc-review` again.
5. Continue only when the gate says no P1/P2-equivalent findings remain.

Do not bypass `cc-review` implementation repair choices. When a finding requires
product, architecture, scope, or risk selection, use the shared user-choice
protocol and stop as `needs-clarification`.

## 编排判断

`cc-dev` 负责选阶段，不负责亲自做细活。它最难的判断是：下一个底层 skill 能不能不依赖聊天记忆，直接靠持久文件行动。

路由前先检查：

1. 当前目标到底是方向问题、需求规划、根因调查、实现任务、验证缺口，还是交付选择？
2. 目标 skill 有没有可用的持久 contract：`roadmap.json`、`task.md`、PR 或 handoff？
3. 当前 worktree 是不是正确表面，分支状态是否安全？
4. 用户指令、风险等级或历史 finding 是否要求 review 收敛？
5. 终点状态是真的，还是 Agent 只是因为会话变长而想停？

坏编排信号：

- 从模糊目标直接进 `cc-do`，而不是先冻结任务 contract。
- 没有最新 `cc-check` 就进 `cc-act`。
- 因为“改动很小”跳过 review，但表面涉及 auth、持久化、迁移、公开 API、Agent 面向 contract 或发布关键路径。
- 上一个活跃改动还没收尾，就创建新改动。
- 把“看起来没事可做了”当成终点。

不确定时，路由到能冻结缺失真相的最窄 skill。

## Delivery Choice

After `cc-check` passes, `cc-dev` routes to `cc-act` for delivery choice.
`cc-dev` must not hard-code the terminal delivery. The user chooses one:

- `create-pr` / `update-pr`: remote collaboration or review.
- `local-main-merge`: local rebase + fast-forward merge into the owning `main`.
- `local-handoff`: committed local work without merge or push.
- `post-merge-closeout`: already merged work that needs archive or closeout.

If the user did not choose, use the shared choice protocol and stop until the
choice is explicit.

## Required Outputs

- Route classification
- Current worktree/branch truth
- Change key or reason none exists
- Stage sequence used
- Review gate decisions and findings or skip reasons
- Completion audit checklist summary
- Terminal state
- selected delivery mode and its proof when available

## Audit Checklist

The audit must map objective text to evidence:

- explicit requirements
- named files
- commands
- tests
- gate scripts
- current verification verdict
- selected `cc-act` delivery evidence: PR, handoff, local-main merge, or post-merge closeout
- GitHub PR state

If a checklist item has no evidence, continue work or stop as blocked.

## Worktree Boundary

If the current session is in the wrong repo, branch, or worktree:

```text
Terminal state: blocked
Reason: wrong-worktree
Next action: start or switch to the intended Codex App worktree/session, then rerun cc-dev
```

Use `scripts/detect-worktree-state.sh` as the single read-only preflight before deciding
whether the session is in the primary checkout, a linked change worktree, or a submodule.

If the current session is the main checkout and a change key exists, repair it by running
`scripts/prepare-change-worktree.sh --change-key <REQ/FIX-...>` and continuing in the
returned `WORKTREE_PATH`. Do not create nested worktrees from inside an existing change
worktree.
