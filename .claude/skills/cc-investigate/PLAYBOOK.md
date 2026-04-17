# CC-Investigate Playbook

## Visible State Machine

`cc-investigate -> cc-do -> cc-check`

- Enter from: a bug, regression, or broken requirement whose root cause is still unclear.
- Stay in: `cc-investigate` until `ANALYSIS.md` and the repair handoff are both frozen.
- Exit to: `cc-do` only after root cause and repair boundary are explicit in canonical artifacts.
- Reroute to: `cc-plan` for scope/design truth changes, or `roadmap` for project-level priority decisions.

## Core Rules

1. 先复现，再猜原因。
2. 先看最近变化，再决定是不是 regression。
3. 先证伪假设，再冻结根因。
4. `ANALYSIS.md` 和 `TASKS.md` 必须足够让 `cc-do` 脱离当前会话继续工作。
5. 调查失败三次后先重建入口，不准继续乱补。

## Required Outputs

- `ANALYSIS.md`
- `TASKS.md`
- `task-manifest.json`

## Investigation Standard

1. 先收集 symptom、expected、actual、repro。
2. 先沿代码路径定位触点和最近变更。
3. 每个假设都要写支持证据和反证。
4. 只有被证据钉死的根因才能进入 repair contract。
5. repair contract 只讲最小修复边界，不顺手发明新范围。

## Local Kit

- 模板在 `assets/`
- 调查契约在 `references/investigation-contract.md`
- 需要分析骨架时用 `scripts/bootstrap-analysis.sh`

## Exit Rule

只有当下一位执行者读完 `ANALYSIS.md`、`TASKS.md`、`task-manifest.json` 就知道：

- 为什么坏
- 该修什么
- 不该扩到哪里
- 用什么命令证明修好了

这次调查才算合格。
