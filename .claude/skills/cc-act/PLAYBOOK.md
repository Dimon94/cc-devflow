# CC-Act Playbook

## State Machine

`cc-check -> cc-act -> PR | local handoff | local main merge | post-merge closeout | next roadmap/REQ/FIX`

Act ships verified work. It does not create process state.

## Durable Outputs

- `handoff/pr-brief.md` for PR or local handoff
- incident postmortem for FIX or recurring failure

Everything else is Git history, PR history, or final response.

## Closeout

1. Verify Git status and latest commits.
2. Run or cite the current validation commands.
3. Commit any remaining owned changes.
4. State release-readiness gates: local checks, config/env, migrations/data,
   deploy/health, smoke/cleanup, rollback, and watch items. Mark skipped,
   blocked, or not applicable gates honestly.
5. Build `pr-brief.md` only when PR/handoff needs it.
6. Run `evaluate-postmortem-trigger.sh`; write incident postmortem when it returns `POSTMORTEM_REQUIRED=yes`.
7. Push/create/update PR when requested and available.
8. For `local-main-merge`, rebase the work branch onto local `main`, fast-forward merge from the owning main checkout, prove `main` contains the delivered commit, and do not push unless explicitly requested.
9. Archive completed change only after merge or explicit closeout.

## Delivery Choice

If the user did not explicitly request remote PR, PR update, local handoff,
local-main merge, or post-merge closeout, ask through
`../cc-dev/references/user-choice-output-protocol.md` before acting.

Recommendation defaults:

1. Existing PR and refreshed delivery only: `update-pr`.
2. Remote collaboration, review, or release requested: `create-pr`.
3. Local commits, personal closeout, or missing remote context: `local-handoff`.
4. Explicit rebase + local `main` merge request: `local-main-merge`.
5. Already merged and archiving/closing out: `post-merge-closeout`.

Do not bias toward local `main` merge or remote PR.

## 收尾判断

`cc-act` 不是“把工作区弄干净”，而是最后一道责任边界。选择交付方式前，先证明三件事：

1. 工作真的完成：`task.md`、提交记录、最新 `cc-check` 证据三者一致。
2. 发布叙事诚实：跳过的 gate 有具体范围或环境原因，不是为了省事。
3. 下一个人或 PR reviewer 不读聊天记录，也能看懂风险。

坏收尾信号：

- `cc-check` 证据过期，或者早于最新提交。
- release-readiness gate 写成 `not applicable`，但没有绑定到本次改动面。
- PR / handoff 只说“测试通过”，没有列命令、退出码和证明的 claim。
- `Failure Ledger` 里还有可能影响发布安全的 `unreviewed` 项。
- 交付方式是为了 Agent 省事，不是因为它匹配协作和发布现实。

出现任一坏信号时，不要伪造漂亮收尾；转回 `cc-check`、`cc-do`，或让用户明确交付选择。

## Local Main Merge

Use this mode only when the user explicitly asks for local `main` integration.

Required sequence:

1. Confirm the work branch has fresh `cc-check` pass evidence.
2. Confirm all intended changes are committed.
3. Confirm the owning primary checkout is on `main`.
4. Rebase the work branch on current local `main`.
5. From the owning primary checkout, run `git merge --ff-only <work-branch>`.
6. Verify local `main` contains the delivered commit.
7. Report that no remote push happened unless the user separately requested it.

If the owning main checkout is dirty, not on `main`, missing, or cannot fast-forward,
stop blocked with the exact Git evidence.

## PR Brief

`pr-brief.md` only serves PR or handoff. Rebuild it from current Git diff,
commits, `task.md`, validation commands, and release-readiness gates. Do not
inherit stale PR prose.

## Postmortem

Run:

```bash
scripts/evaluate-postmortem-trigger.sh --dir devflow/changes/<change-key>
```

Write an incident postmortem only when:

1. change key is `FIX-*`
2. repeated AI, process, test, release, Git, or architecture failure was exposed
3. user explicitly asked to record the lesson

If session-only rework evidence is relevant, pass it as
`--trigger <short-label>`. If no trigger applies, final output still states
`POSTMORTEM_REQUIRED=no`.

Postmortems use Git evidence, verification commands, and confirmed
`task.md#Failure Ledger` assets. Do not turn raw `cc-review` findings, chat
memory, or unclassified review escape candidates into postmortem facts.

## Failure Compression

1. Read `Failure Ledger`.
2. Discard `noise` and unresolved `unresolved-risk` unless the user explicitly
   asks to record them.
3. Write only `confirmed-lesson` with `Keep for postmortem: yes` into incident
   postmortems; `Source=cc-review` review escape candidates must first be
   classified by `cc-check`.
4. Complete `Workflow Patch Candidate`: `no-action`, `skill-rule`,
   `template-field`, `script-guard`, `regression-test`, or `roadmap-followup`.
5. If the candidate changes verification posture or code, route to `cc-check`
   or a new REQ/FIX instead of smuggling unverified rules into current closeout.

## Blockers

Return to `cc-check` when evidence changed. Return to `cc-do` when implementation is unfinished. If the postmortem gate depends on session-only rework evidence, pass it as `--trigger <short-label>` instead of silently dropping it. Do not patch around missing proof in Act.
