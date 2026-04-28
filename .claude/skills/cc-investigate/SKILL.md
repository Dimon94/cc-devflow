---
name: cc-investigate
version: 1.1.3
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
  - "Search prior investigations, TODO/backlog signals, and recent fixes in the affected area before declaring the bug novel."
  - "Do not write production code here; this stage ends with planning/analysis.md plus executable repair tasks for cc-do."
exit_criteria:
  - "planning/analysis.md records symptom, reproduction, evidence chain, pattern analysis, tested hypotheses, confirmed root cause, and repair boundary."
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

## Runtime Output Policy

写入任何 durable Markdown 或 JSON metadata 前，先运行 `cc-devflow config resolve --format policy`。

- `Output language` 是机器约束，`planning/analysis.md`、`planning/tasks.md` 和 `change-meta.json` 必须记录并遵守它。
- `agent_preferences` 是用户偏好建议，只影响表达方式和结构选择，不覆盖本 Skill 的工作流边界。
- 如果配置解析失败，先修配置或向用户说明阻塞，不要用默认语言继续生成正式文档。

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

## Iron Law

```text
NO REPAIR WITHOUT A FROZEN ROOT-CAUSE CONTRACT
```

`cc-investigate` 可以跑复现、读代码、查日志、加临时探针、证伪假设，但不能把“可能是”写成 repair task。

根因合同必须同时回答：

1. 症状如何稳定复现或被缩小到可验证范围。
2. 哪条代码 / 配置 / 数据 / 依赖路径违反了什么契约。
3. 哪些假设被证伪，为什么不是它们。
4. 最小修复边界在哪里，哪些文件明确不该动。

## Quick Start

先判断你面对的是哪一类调查现实：

| 现实状态 | 先走什么路径 |
| --- | --- |
| 症状真实，但还没有稳定复现 | `reproduce-first`，先把现象钉死 |
| 明显是 regression | `diff-trace`，先查最近变化 |
| 症状已知，但修复边界可能扩大范围 | `contract-check`，先判是否还属于当前 requirement |
| 错误类型陌生，像框架 / 依赖 / 平台问题 | `pattern-research`，先做脱敏外部调研 |
| 同一区域反复坏 | `history-trace`，先查 prior investigations 和最近修复 |
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
   - 如果上下文缺失，只问一个最关键问题，不一次性抛出问题清单
2. **Trace reality**
   - 沿着代码路径找触点
   - 查最近提交和同类改动
   - 查既有 `devflow/changes/*/planning/analysis.md`、`TODOS.md`、backlog、report-card finding
   - 找现有测试和断点证据
   - 判定偏离的是 capability boundary、invariant，还是只是实现细节
3. **Classify pattern**
   - 判定是否属于 race condition、null propagation、state corruption、integration failure、configuration drift、stale cache、resource leak、trust boundary drift
   - 如果错误类型陌生，先做脱敏外部调研；只搜索通用错误类型、框架 / 库名和版本，不搜索 raw secret / path / customer data
4. **Form hypotheses**
   - 只保留 1-3 个可被证伪的假设
   - 每个假设都写支持证据和反证
   - 每个假设都写 `falsification method`、`expected observation`、`actual observation`
5. **Test hypotheses**
   - 用复现、日志、断言、最小探针验证
   - 三次假设都失败，就停下进入 escalation decision
6. **Freeze repair contract**
   - 根因确认后，写进 `planning/analysis.md`
   - 只保留最小修复边界
   - 写明 affected module、allowed files、forbidden files、blast radius estimate；超过 5 个文件默认拆分或 reroute
   - 输出 `planning/tasks.md` + `planning/task-manifest.json` + `change-meta.json`
7. **Hand off**
   - 下一步明确写成 `cc-do`
   - 如果 repair contract 越过当前 requirement，就 reroute 到 `cc-plan`

## Pattern Analysis

不要从空白猜测开始。先把 bug 放进一个可检查的模式：

| Pattern | Signature | First place to inspect |
| --- | --- | --- |
| race condition | 间歇性、时序相关、重试后消失 | 并发写、锁、队列、共享状态 |
| null propagation | TypeError / NoMethod / undefined access | nullable 输入、默认值、边界 guard |
| state corruption | 数据不一致、部分更新、顺序错乱 | transaction、callback、hook、副作用 |
| integration failure | timeout、unexpected response、协议不匹配 | API boundary、service config、schema |
| configuration drift | 本地可用、CI/生产失败 | env、feature flag、版本、路径、权限 |
| stale cache | 清缓存后恢复、旧状态复现 | browser / CDN / Redis / build cache |
| resource leak | OOM、句柄增长、慢性崩溃 | lifecycle、subscription、retention、cleanup |
| trust boundary drift | LLM / 用户输入 / 外部响应被当成可信 | validation、escaping、policy gate |

模式分析不是结论，只是定位第一批证据的索引。

## Prior Investigation History

同一区域反复坏是架构味道，不是巧合。形成根因前至少查：

1. `git log --oneline -20 -- <affected-files>`
2. `rg -n "<error-keyword>|<module>|<capability>" devflow/changes`
3. `TODOS.md`、backlog、roadmap 中的相关未解决项
4. 既有 `report-card.json` finding 和 `planning/analysis.md`
5. 可用时，查询项目记忆或历史调查摘要

如果命中过往调查，写入 `analysis.md` 的 `Prior Investigations`，包括是否复发、根因是否同类、这次是否说明结构问题。

## External Research Hygiene

外部调研只在本地证据不足、错误类型陌生、或像依赖 / 框架 / 平台 bug 时使用。

调研前必须脱敏：

- 删除 host、IP、token、customer id、内部路径、SQL 片段、私有 repo 名
- 搜索错误类别、框架 / 库名、版本和通用组件名
- 如果无法安全脱敏，就跳过外部搜索，并在 `researchEvidence` 写明原因

调研结论只能作为候选假设，不能直接变成 confirmed root cause。必须回到本仓库复现或代码证据验证。

## Scope Lock And Blast Radius

形成根因假设后，先锁定最小调查 / 修复边界：

- `affectedModule`
- `allowedFiles`
- `forbiddenFiles`
- `blastRadiusFiles`
- `blastRadiusRisk`: `low` / `medium` / `high`

如果修复预计触碰超过 5 个文件，默认说明这可能不是单点 bug：

1. 能拆成 critical path + follow-up，就拆。
2. 不能拆但仍是根因跨度，写明为什么。
3. 如果已经变成设计 / 架构范围，reroute 到 `cc-plan`。

## Escalation Decision

三次假设失败后，不准继续硬猜。`analysis.md` 必须写：

- failedHypothesisCount
- what was attempted
- why current entry is suspect
- next option：`continue-with-new-hypothesis` / `instrument-and-wait` / `human-review` / `reroute-cc-plan`
- recommendation

## Good Output

- 看完第一屏就知道 bug 是什么、怎么复现、为什么会坏
- 根因不是感觉，而是被证据钉死的具体断点
- 假设不是列表装饰，而是带证伪方法和实际观察
- 历史调查、最近改动、模式分析没有被跳过
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
7. 外部调研必须先脱敏，调研结论必须回到本仓库证据验证。
8. 修复触点超过 5 个文件时，默认先拆分或 reroute，不把大重构伪装成 bug fix。
9. 好的调查不是“找了很多可能性”，而是把错误世界缩成一个可信的 repair contract。

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
