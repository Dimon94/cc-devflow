---
name: cc-investigate
version: 1.1.1
description: "Use when a bug, regression, broken task, or unexpected behavior needs root-cause investigation, reproducible evidence, and a frozen repair handoff before cc-do resumes coding."
triggers:
  - "帮我查这个 bug"
  - "先别修先找根因"
  - "debug this bug"
  - "investigate this regression"
  - "why is this broken"
  - "root cause this"
  - "先调查再修"
reads:
  - "PLAYBOOK.md"
  - "CHANGELOG.md"
  - "references/investigation-contract.md"
  - "assets/ANALYSIS_TEMPLATE.md"
  - "assets/TASKS_TEMPLATE.md"
  - "assets/TASK_MANIFEST_TEMPLATE.json"
writes:
  - path: "devflow/changes/<change-key>/planning/analysis.md"
    durability: "durable"
    required: true
  - path: "devflow/changes/<change-key>/planning/tasks.md"
    durability: "durable"
    required: true
  - path: "devflow/changes/<change-key>/planning/task-manifest.json"
    durability: "durable"
    required: true
  - path: "devflow/changes/<change-key>/change-meta.json"
    durability: "durable"
    required: true
entry_gate:
  - "Read the current bug report, existing requirement artifacts, relevant code, tests, and recent history before forming any hypothesis."
  - "Use a FIX-<number>-<description> change key for new bug-fix investigations."
  - "Reproduce or narrow the symptom first, then freeze the evidence chain before proposing repair tasks."
  - "Do not write production code here; this stage ends with planning/analysis.md plus executable repair tasks for cc-do."
exit_criteria:
  - "planning/analysis.md records symptom, reproduction, evidence chain, confirmed root cause, and repair boundary."
  - "planning/tasks.md and planning/task-manifest.json are explicit enough that cc-do can repair the bug without chat memory."
  - "The honest next step is cc-do, cc-plan, or roadmap."
reroutes:
  - when: "The issue is actually a new feature, a scope redesign, or a product decision instead of a bug investigation."
    target: "cc-plan"
  - when: "The discussion expands into project sequencing or roadmap priority instead of one broken requirement."
    target: "roadmap"
  - when: "Root cause and repair boundary are already frozen."
    target: "cc-do"
recovery_modes:
  - name: "repro-reset"
    when: "The current conversation cannot state a stable reproduction path or the symptom evidence is stale."
    action: "Drop the narrative, rebuild the reproduction from canonical artifacts and fresh output, then restate the symptom before testing hypotheses."
  - name: "re-open-investigation"
    when: "New execution evidence disproves the current root-cause contract or widens the suspected blast radius."
    action: "Reopen planning/analysis.md, update the evidence chain, and regenerate repair tasks only after the new root cause is frozen."
tool_budget:
  read_files: 10
  search_steps: 6
  shell_commands: 6
---

# CC-Investigate

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、相关模板/脚本引用，然后检查 `CLAUDE.md`

## Role

`cc-investigate` 是 bug 路径里的 `Investigate`，也可以理解成 `Debug Plan`。

它不是直接修 bug 的地方，而是替代原来 bug 场景下那种混在 `cc-do` 里的临场 planning。它先把症状压成证据，再把证据压成根因，再把根因压成一个可执行的修复 handoff。

一句话：

- 新需求走 `cc-plan -> cc-do -> cc-check -> cc-act`
- 已知需求里的 bug 走 `cc-investigate -> cc-do -> cc-check -> cc-act`

所以现在仓库里有两条闭环：

- `PDCA`
- `IDCA`，如果你更喜欢口语，也可以把它理解成 `DDCA`

## Read First

1. `PLAYBOOK.md`
2. `CHANGELOG.md`
3. `references/investigation-contract.md`
4. `assets/ANALYSIS_TEMPLATE.md`
5. `assets/TASKS_TEMPLATE.md`
6. `assets/TASK_MANIFEST_TEMPLATE.json`

## Use This Skill When

- bug 现象很多，但根因还没冻结
- regression 已出现，不能接受“先补一个试试”
- `cc-do` 连续修补失败，怀疑上游根因判断错了
- review / verification 指出当前修法只是症状补丁
- 你需要一个专门面向 debug 的可执行 handoff，而不是重开 feature planning

如果问题其实是在问“应该做什么功能”或“范围是否要变”，别硬调试，回 `cc-plan`。

## Quick Start

先判断你面对的是哪一类调查现实：

| 现实状态 | 先走什么路径 |
| --- | --- |
| 症状真实，但还没有稳定复现 | `reproduce-first`，先把现象钉死 |
| 明显是 regression | `diff-trace`，先查最近变化 |
| 症状已知，但修复边界可能扩大范围 | `contract-check`，先判是否还属于当前 requirement |
| 看起来像 bug，实则是未定义行为或新需求 | 直接 reroute 到 `cc-plan` |

先说“这是什么类问题”，再说“我要怎么修”。没有分类的 debug，最后都会变成乱打补丁。

## Harness Contract

- Allowed actions: reproduce, collect evidence, trace code paths, test hypotheses, freeze root cause, and write only `planning/analysis.md`, `planning/tasks.md`, `planning/task-manifest.json`, and `change-meta.json`.
- Forbidden actions: writing production code, disguising guesses as root cause, or skipping directly from symptoms to repair.
- Required evidence: every root-cause claim must point to reproduction evidence, code facts, recent history, or explicit user confirmation.
- Reroute rule: product/scope changes go to `cc-plan`; strategy questions go to `roadmap`; only confirmed repair handoff goes to `cc-do`.

## Output Model

`cc-investigate` 只允许产出 4 个主文件：

1. `planning/analysis.md`
   - 现象
   - 复现
   - 证据链
   - 假设表
   - 已确认根因
   - 修复边界
2. `planning/tasks.md`
   - 只保留真正要执行的修复任务
   - 顶部明确 canonical contract 是 `planning/analysis.md`
3. `planning/task-manifest.json`
   - 机器真相源
   - 标记当前任务、依赖、验证命令、调查版本链
4. `change-meta.json`
   - 标记当前 bug 是实现偏离 spec、spec 本身缺失，还是 roadmap 假设错误
   - 记录这次修复会如何影响 capability truth

`cc-investigate` 不写生产代码，不在这里偷跑 `cc-do`。

## Entry Gate

1. 先确认当前对象仍然属于一个 requirement，而不是整个项目级故障。
2. 先收症状事实：错误、触发条件、影响面、复现路径。
3. 先读现有 change 目录里的 `planning/design.md` / `planning/analysis.md` / `planning/tasks.md` / `planning/task-manifest.json`，不要假设自己是第一位调查者。
4. 先读代码、测试、日志、相关 capability spec 和最近提交，再下任何假设。
5. 如果复现都不稳定，先不要写根因。

## Investigation Loop

1. **Collect symptom**
   - 记录用户看见了什么
   - 记录预期与实际差异
   - 记录复现命令或手动路径
2. **Trace reality**
   - 沿着代码路径找触点
   - 查最近提交和同类改动
   - 找现有测试和断点证据
   - 判定偏离的是 capability boundary、invariant，还是只是实现细节
3. **Form hypotheses**
   - 只保留 1-3 个可被证伪的假设
   - 每个假设都写支持证据和反证
4. **Test hypotheses**
   - 用复现、日志、断言、最小探针验证
   - 三次假设都失败，就停下重建上下文
5. **Freeze repair contract**
   - 根因确认后，写进 `planning/analysis.md`
   - 只保留最小修复边界
   - 输出 `planning/tasks.md` + `planning/task-manifest.json` + `change-meta.json`
6. **Hand off**
   - 下一步明确写成 `cc-do`
   - 如果 repair contract 越过当前 requirement，就 reroute 到 `cc-plan`

## Good Output

- 看完第一屏就知道 bug 是什么、怎么复现、为什么会坏
- 根因不是感觉，而是被证据钉死的具体断点
- 修复边界清楚到 `cc-do` 不需要二次调查
- `planning/tasks.md` 只包含修复任务，不夹带新需求
- 如果应该回 `cc-plan`，理由写清楚，不假装还能继续 patch

## Bundled Resources

- 变更记录：`CHANGELOG.md`
- 调查契约：`references/investigation-contract.md`
- 分析模板：`assets/ANALYSIS_TEMPLATE.md`
- 修复任务模板：`assets/TASKS_TEMPLATE.md`
- manifest 模板：`assets/TASK_MANIFEST_TEMPLATE.json`
- 分析骨架：`scripts/bootstrap-analysis.sh`

## Working Rules

1. 没有复现，不准声称找到了根因。
2. 没有证据，不准把猜测写成结论。
3. 先根因，再修复；先调查，再编码。
4. `planning/tasks.md` 必须足够让 `cc-do` 在脱离当前对话后继续推进。
5. 如果修复方案已经变成新 feature 设计，停止 debug，回 `cc-plan`。
6. 三次假设失败后，默认说明你的调查入口错了，不准继续硬猜。
7. 好的调查不是“找了很多可能性”，而是把错误世界缩成一个可信的 repair contract。

## Exit Criteria

- `planning/analysis.md` 已冻结症状、复现、证据链、根因和修复边界
- `planning/tasks.md` / `planning/task-manifest.json` 可直接交给 `cc-do`
- 下一步唯一答案是 `cc-do`、`cc-plan` 或 `roadmap`

## Do Not

- 不在这里写生产代码
- 不拿“可能是”冒充“已经证实”
- 不把新需求伪装成 bug 修复
- 不在根因未明时开始堆 patch

## Companion Files

- 深入剧本：`PLAYBOOK.md`
- 变更记录：`CHANGELOG.md`
- 调查契约：`references/investigation-contract.md`
