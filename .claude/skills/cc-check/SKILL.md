---
name: cc-check
version: 1.12.1
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
writes:
  - path: current response
    durability: ephemeral
    required: true
  - path: Git commit
    durability: durable
    required: true
    when: verification completes a PDCA or IDCA environment stage
entry_gate:
  - Resolve the CLI with `../cc-dev/scripts/resolve-cc-devflow.sh require query workflow-context` when workflow query is needed; unsupported CLIs are blockers.
  - Read `task.md`, current Git diff, relevant code/tests, PR text when present, and fresh command output.
  - Re-run fresh commands instead of inheriting cc-do narration.
  - Do not create process files.
exit_criteria:
  - Verdict is exactly pass, fail, or blocked.
  - Every passing statement cites fresh command output, exit status, and what claim it proves.
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
5. Return verdict:
   - `pass`: all required claims have fresh proof.
   - `fail`: a command, review, or behavior check proves the change is wrong.
   - `blocked`: required environment, auth, input, or evidence is missing.
6. Commit the stage when this PDCA/IDCA environment completes.

## Output

只输出短结论，不写过程文件：

- Verdict: `pass` / `fail` / `blocked`
- Evidence: command, exit status, and the claim it proves
- Review: clean, findings remain, or not reviewed
- Route: `cc-act` / `cc-do` / `cc-investigate` / `cc-plan` / `stop`
