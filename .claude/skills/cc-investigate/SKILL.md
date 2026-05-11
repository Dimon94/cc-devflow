---
name: cc-investigate
version: 1.4.1
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
  - "docs/guides/project-postmortem.md"
  - "assets/ANALYSIS_TEMPLATE.md"
  - "assets/TASKS_TEMPLATE.md"
  - "assets/TASK_MANIFEST_TEMPLATE.json"
  - "../cc-roadmap/scripts/locate-roadmap-item.sh"
  - "../cc-roadmap/scripts/sync-roadmap-progress.sh"
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
effects:
  - source roadmap progress sync when investigation freezes, reroutes, or diagnoses a roadmap mismatch
entry_gate:
  - "Read the current bug report, existing requirement artifacts, relevant code, tests, and recent history before forming any hypothesis."
  - "Assign the change key by running `cc-devflow next-change-key --prefix FIX --description \"<short bug name>\"`. Use both output lines: first is changeId for task-manifest, second is the full changeKey for the directory."
  - "Build a runnable feedback loop, confirm it matches the reported symptom, then freeze the evidence chain before proposing repair tasks."
  - "Record persistent debug session state: active hypothesis, probes, cleanup status, and next evidence action."
  - "Search prior investigations, TODO/backlog signals, and recent fixes in the affected area before declaring the bug novel."
  - "Search project postmortems before forming final hypotheses: check `devflow/postmortems/INDEX.md`, `principles.md`, and matching `incidents/*.md` for similar symptoms, modules, failure classes, Git patterns, and model-risk lessons."
  - "For multi-component, deep-stack, or flaky symptoms, record boundary probes, backward trace, or condition-wait evidence before declaring the root cause."
  - "Run the Root Cause Proof Ladder before generating repair tasks: symptom site, first bad state, violated contract, original trigger, counterfactual proof, and escape reason must all be explicit."
  - "For performance regressions, collect a baseline or profile signal before treating logs as evidence."
  - "Do not write production code here; this stage ends with planning/analysis.md plus executable repair tasks for cc-do."
  - "Before exit, locate the source RM in `devflow/roadmap.json`, `devflow/ROADMAP.md`, optional `devflow/BACKLOG.md`, or legacy `devflow/roadmap-tracking.json`; the repair handoff must not leave roadmap progress stale."
exit_criteria:
  - "planning/analysis.md records symptom, reproduction, evidence chain, boundary probes or backward trace when applicable, pattern analysis, tested hypotheses, confirmed root cause, and repair boundary."
  - "planning/analysis.md proves the first bad state and original trigger, not only the visible error site."
  - "planning/analysis.md records the Project Postmortem Recall result, including matching incidents/principles or an explicit no-history verdict."
  - "diagnose-only outcomes clearly stop before implementation while preserving root cause, owner, and next action."
  - "workflow forensics classify artifact, git, state, or tool failures before repair tasks are generated."
  - "planning/tasks.md and planning/task-manifest.json are explicit enough that cc-do can repair the bug without chat memory."
  - "The source roadmap item has been synchronized with the investigation outcome, or `planning/analysis.md` and `change-meta.json` record why no roadmap update is valid."
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
  read_files: 11
  search_steps: 6
  shell_commands: 7
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
7. `docs/guides/project-postmortem.md`

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

## Root Cause Proof Ladder

`cc-investigate` 的根因不是“报错点在哪里”，而是“坏状态第一次被制造在哪里”。任何只修 symptom site 的结论默认不合格，除非已经证明 symptom site 就是 original trigger。

每次调查必须爬完这 6 层，无法爬完就不能生成 repair task：

1. `L1 Symptom Site`：用户看见的错误、失败命令、UI 状态、日志或坏 artifact。
2. `L2 First Bad State`：第一个可观察到状态从正确变成错误的位置；可以是文件、字段、缓存、队列消息、API 响应、配置或内存对象。
3. `L3 Violated Contract`：被破坏的 schema、capability invariant、API contract、state transition、权限边界或时序条件。
4. `L4 Original Trigger`：哪个用户动作、命令、事件、recent diff、配置变化或外部响应制造了 first bad state。
5. `L5 Counterfactual Proof`：如果恢复该 contract、替换输入、回滚 diff、固定配置或断言边界，症状应如何变化；必须记录实际观察。
6. `L6 Escape Reason`：为什么现有测试、类型、验证、监控、review 或 artifact gate 没提前挡住它。

硬规则：

- `First bad state` 为空时，root cause 只能是 `needs-more-evidence`。
- `Original trigger` 为空时，不能把下游 guard 写成根因修复。
- `Counterfactual proof` 为空时，假设只能停在 candidate，不准进入 confirmed root cause。
- `Escape reason` 不能写成人工提醒；必须变成 regression test、artifact guard、capability invariant、operator check 或明确的 follow-up。
- 如果 ladder 指向 spec 缺失或路线假设错误，停止生成修复任务，reroute 到 `cc-plan` 或 `roadmap`。

## Quick Start

先判断你面对的是哪一类调查现实：

| 现实状态 | 先走什么路径 |
| --- | --- |
| 症状真实，但还没有稳定复现 | `reproduce-first`，先把现象钉死 |
| 已有复现但信号慢 / 松 / 偶然 | `feedback-loop`，先把 pass/fail loop 做快、准、可复跑 |
| 明显是 regression | `diff-trace`，先查最近变化 |
| 多组件链路断裂 | `boundary-probe`，先记录每个边界的输入、输出、配置和状态 |
| 报错点很深或坏值来源不明 | `backward-trace`，从 symptom site 一直追到 original trigger |
| 同仓库有相似可用路径 | `reference-compare`，先列出 working vs broken differences |
| flaky / sleep / timeout 类问题 | `condition-wait`，先找真实等待条件，不先加大延时 |
| 症状已知，但修复边界可能扩大范围 | `contract-check`，先判是否还属于当前 requirement |
| 错误类型陌生，像框架 / 依赖 / 平台问题 | `pattern-research`，先做脱敏外部调研 |
| 同一区域反复坏 | `history-trace`，先查 prior investigations 和最近修复 |
| 看起来像 bug，实则是未定义行为或新需求 | 直接 reroute 到 `cc-plan` |
| 用户只要根因报告、不要求修复 | `diagnose-only`，停止在报告与 next action，不生成完成态实现任务 |
| 失败来自 workflow / artifact / git / state 断裂 | `workflow-forensics`，先分类坏在文件、状态、工具、权限还是流程 |

先说“这是什么类问题”，再说“我要怎么修”。没有分类的 debug，最后都会变成乱打补丁。

## Harness Contract

- Allowed actions: reproduce, collect evidence, trace code paths, test hypotheses, freeze root cause, write `planning/analysis.md`, `planning/tasks.md`, `planning/task-manifest.json`, and `change-meta.json`, then run the final roadmap progress sync for the source RM.
- Forbidden actions: writing production code, disguising guesses as root cause, or skipping directly from symptoms to repair.
- Required evidence: every root-cause claim must point to reproduction evidence, code facts, recent history, or explicit user confirmation.
- Reroute rule: product/scope changes go to `cc-plan`; strategy questions go to `roadmap`; only confirmed repair handoff goes to `cc-do`.

## Project Postmortem Recall Gate

`cc-investigate` 必须先查项目级 AI 尸检报告，再宣称 bug 是新问题。历史不是权威结论，但它能暴露模型容易重复的错判。

```bash
rg -n "<symptom|module|boundary|failure-class|model-risk>" devflow/postmortems
```

执行规则：

1. `devflow/postmortems/` 不存在时，在 `planning/analysis.md` 记录 `no-project-postmortems-yet`。
2. 有命中时，先读 `INDEX.md` / `principles.md`，再打开最相关的 1-2 个 incident。
3. 相关 incident 必须进入假设表或反证表：同根因、相似症状不同根因、已知模型陷阱、或明确不相关。
4. 如果本次确认是重复根因，`Root Cause` 的 `Prior history relationship` 必须标成 `recurring` 或 `same-root-cause`。

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

diagnose-only 仍然写 `planning/analysis.md`，但 `planning/tasks.md` 只能包含证据交接、
监控、人工动作或明确的 `reroute`；不能把“已经诊断”伪装成“已经修复”。

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
   - 确认复现的是用户描述的同一个失败，而不是旁边的红灯
   - 如果上下文缺失，只问一个最关键问题，不一次性抛出问题清单
2. **Build feedback loop**
   - 优先构造 agent 可运行的 pass/fail 信号：失败测试、curl / HTTP 脚本、CLI fixture、浏览器脚本、trace replay、throwaway harness、property / fuzz loop、bisect harness、differential loop，最后才是 HITL 脚本
   - 记录 loop 类型、命令、运行时间、确定性、失败率、症状匹配证据和下一步 sharpen 计划
   - loop 太慢、太宽、太 flaky 时，先优化 loop 本身；没有可信 loop，不进入 confirmed root cause
   - 如果确实无法建 loop，写明尝试过什么，并请求 HAR、日志 dump、core dump、带时间戳录屏、可复现环境访问或临时生产探针权限
3. **Trace reality**
   - 沿着代码路径找触点
   - 多组件系统先写 `Boundary Probe Matrix`：每个边界的输入、输出、配置 / 环境、状态和 pass/fail
   - 深层报错先写 `Backward Trace Chain`：immediate failure site、caller chain、bad value origin、original trigger
   - 查最近提交和同类改动
   - 查既有 `devflow/changes/*/planning/analysis.md`、`TODOS.md`、backlog、report-card finding
   - 如果仓库有 `devflow/specs/`、roadmap/backlog handoff、历史 `planning/design.md` / `planning/analysis.md` 或 `change-meta.json`，把领域词汇和已冻结决策当成契约证据
   - 找现有测试和断点证据
   - 判定偏离的是 capability boundary、invariant，还是只是实现细节
4. **Classify pattern**
   - 判定是否属于 race condition、null propagation、state corruption、integration failure、configuration drift、stale cache、resource leak、performance regression、trust boundary drift、timing guess / flaky wait
   - 如果有同仓库 working example，先写 `Reference Comparison`，列出 working path、broken path、差异和被接受 / 排除的假设
   - 如果错误类型陌生，先做脱敏外部调研；只搜索通用错误类型、框架 / 库名和版本，不搜索 raw secret / path / customer data
5. **Form hypotheses**
   - 先列 3-5 个候选假设并排序，避免第一直觉锚定
   - 再收敛到 1-3 个 active hypotheses 进入验证
   - 每个假设都写支持证据、反证和优先级理由
   - 每个假设都写 `falsification method`、`expected observation`、`actual observation`
6. **Test hypotheses**
   - 用复现、日志、断言、最小探针验证
   - 临时探针必须写 `Diagnostic Instrumentation Plan`：probe tag、probe location、question answered、command、expected signal、cleanup requirement
   - 每个 probe 只回答一个假设预测；一次只改一个变量
   - debug 日志必须带唯一前缀，例如 `[DEBUG-FIX123-a4f2]`，进入 `cc-do` 前用前缀 grep 清理或转正
   - 三次假设都失败，就停下进入 escalation decision
7. **Freeze repair contract**
   - 先填写 `Root Cause Proof Ladder`：symptom site、first bad state、violated contract、original trigger、counterfactual proof、escape reason
   - 如果 first bad state、original trigger 或 counterfactual proof 缺失，只能写 `Evidence Request` 或 reroute，不能生成 repair task
   - 根因确认后，写进 `planning/analysis.md`
   - 只保留最小修复边界
   - 写清正确测试缝隙：测试是否覆盖真实触发链；如果没有正确 seam，这本身就是需要记录的架构事实
   - 写明 affected module、allowed files、forbidden files、blast radius estimate；超过 5 个文件默认拆分或 reroute
   - 输出 `planning/tasks.md` + `planning/task-manifest.json` + `change-meta.json`
8. **Roadmap sync**
   - 用 `locate-roadmap-item.sh` 定位 source RM；找不到时在 `analysis.md` 和 `change-meta.json.roadmapSync` 写 `no-source-rm`
   - `implementation drift`：回写 source RM 为 `Repair planned` 或等价调查完成状态，绑定 `FIX-*`，进度保持在可执行修复前的真实百分比
   - `missing spec truth`：回写 source RM 的 expected spec delta 或 follow-up，必要时 reroute 到 `cc-plan`
   - `roadmap mismatch`：不要直接进入修复；先把 mismatch 写回 roadmap / backlog，下一步写 `roadmap` 或 `cc-plan`
   - 使用 `sync-roadmap-progress.sh` 更新 `devflow/roadmap.json`，并重新生成 `devflow/ROADMAP.md` / `devflow/BACKLOG.md`
9. **Hand off**
   - 下一步明确写成 `cc-do`
   - 如果 repair contract 越过当前 requirement，就 reroute 到 `cc-plan`
   - 如果是 diagnose-only，下一步写成 human action、monitoring、backlog、`cc-plan` 或 `cc-do`，但不得标记实现完成

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
| performance regression | 变慢、CPU / IO / 查询耗时升高、吞吐下降 | baseline、profiler、query plan、bisect |
| trust boundary drift | LLM / 用户输入 / 外部响应被当成可信 | validation、escaping、policy gate |
| timing guess / flaky wait | sleep / setTimeout / timeout 增大后偶尔通过 | 真实完成条件、事件、文件、状态或队列计数 |

模式分析不是结论，只是定位第一批证据的索引。

## Boundary Probe Matrix

多组件链路不要先猜。先记录每个边界的事实：

- component boundary
- input observed
- output observed
- config / env observed
- state observed
- verdict: `pass` / `fail` / `unknown`

只有一个边界先失败时，后续调查才收缩到那个组件。多个边界都异常时，优先找共同上游，不在下游堆补丁。

## Backward Trace Chain

报错点很深时，不准只在 symptom site 加 guard。`analysis.md` 必须追到：

- immediate failure site
- direct caller
- caller chain
- bad value origin
- original trigger
- why symptom-site fix is rejected

找不到 original trigger 时，根因还没有冻结，只能继续调查或进入 escalation。

## Reference Comparison

同仓库或参考实现有相似可用路径时，先对照再假设：

- similar working example
- broken path
- differences found
- differences accepted as hypothesis
- differences ruled out

不要用“看起来差不多”跳过差异。小差异也可能是根因。

## Diagnostic Instrumentation

临时日志、断言、探针只能用于回答一个明确问题：

- probe location
- question answered
- command to run
- expected signal
- actual signal
- cleanup requirement

探针不能变成修复。进入 `cc-do` 前，要么删除，要么明确写入 repair task 的清理 / 转正方式。

## Feedback Loop Contract

根因调查首先依赖一个可信 loop：

- loop type: failing test / HTTP script / CLI fixture / browser script / trace replay / throwaway harness / property-fuzz / bisect / differential / HITL
- command or manual driver
- expected failing signal
- actual failing signal
- symptom match: 为什么它复现的是用户报告的同一个问题
- runtime and determinism
- failure rate for flaky bugs
- sharpening plan: 如何让它更快、更准、更稳定

把 loop 当成调查产品来迭代。已有 loop 但信号差时，先优化它：

1. faster：缓存 setup、缩小 test scope、跳过无关启动。
2. sharper：断言用户看见的具体症状，不用“没有崩溃”冒充匹配。
3. more deterministic：固定时间、随机种子、filesystem、network、locale、feature flag。

flaky bug 的目标不是立刻 100% 复现，而是提高复现率直到可调试。可以循环 100 次、并行触发、加压力、缩小时序窗口或做 differential loop；如果失败率仍低到不可证伪，先写 Evidence Request，不要继续猜。

没有 loop 时，不能把代码阅读当成根因。只能写 `Evidence Request`：需要可复现环境、HAR、日志 dump、core dump、带时间戳录屏，或临时生产探针权限。

## Correct Test Seam

进入 repair handoff 前，必须说明回归测试缝隙是否正确：

- test seam
- public interface exercised
- why this seam reaches the real trigger chain
- why a shallower test would be false confidence
- if no correct seam exists, record it as an architecture finding and keep repair verification tied to the original feedback loop

## Timing And Flaky Bugs

遇到 flaky、sleep、timeout、重试后消失：

- 先找真实等待条件：event、state、file、count、queue empty、network response
- 任意 timeout 必须说明为什么这个时间是业务 / 协议事实，不是猜测
- 如果只能在并发或负载下复现，记录对应命令和环境
- 不把“加大 sleep”写成 repair contract，除非它本身就是被证实的协议等待窗口

## No Code Root Cause

如果调查证明是环境、外部服务或时序窗口，不要假装代码根因：

- `rootCauseClass`: `code` / `config` / `environment` / `external` / `timing`
- `why not code root cause`
- `monitoring or future evidence needed`
- `operator handling after fix`

这类结论仍然需要本地证据支撑；“没有根因”通常只是调查不完整。

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

## Prevention Handoff

根因冻结后必须写一句后验判断：什么结构、测试 seam、capability invariant、operator guard 或文档会让这个 bug 更早暴露或根本不出现。

- 如果答案是小范围 regression test，把它写进当前 repair task。
- 如果答案是 seam / module / capability 边界问题，把它写成 architecture finding，并明确交给 `cc-plan` 或后续 backlog。
- 如果答案只是流程提醒或人工记忆，不算预防；要么转成可执行 guard，要么明确不记录。

## Escalation Decision

三次假设失败后，不准继续硬猜。`analysis.md` 必须写：

- failedHypothesisCount
- what was attempted
- why current entry is suspect
- next option：`continue-with-new-hypothesis` / `instrument-and-wait` / `human-review` / `reroute-cc-plan`
- evidence request if the loop cannot be built or the environment is missing
- recommendation

## Good Output

- 看完第一屏就知道 bug 是什么、怎么复现、为什么会坏
- 根因不是感觉，而是被证据钉死的具体断点
- 根因证明追到 first bad state 和 original trigger，而不是停在 symptom site
- 假设不是列表装饰，而是带证伪方法和实际观察
- 历史调查、最近改动、模式分析没有被跳过
- 修复边界清楚到 `cc-do` 不需要二次调查
- 正确测试缝隙写清楚，不用浅层测试制造假安全
- `planning/tasks.md` 只包含修复任务，不夹带新需求
- 如果应该回 `cc-plan`，理由写清楚，不假装还能继续 patch
- Roadmap Sync Gate 必须在 handoff 前闭合：source RM 绑定的 `FIX-*`、调查状态、spec diagnosis 和 next action 不能停留在聊天里。

## Bundled Resources

- 变更记录：`CHANGELOG.md`
- 调查契约：`references/investigation-contract.md`
- 分析模板：`assets/ANALYSIS_TEMPLATE.md`
- 修复任务模板：`assets/TASKS_TEMPLATE.md`
- manifest 模板：`assets/TASK_MANIFEST_TEMPLATE.json`
- 分析骨架：`scripts/bootstrap-analysis.sh`
- Roadmap 定位：`../cc-roadmap/scripts/locate-roadmap-item.sh`
- Roadmap 回写：`../cc-roadmap/scripts/sync-roadmap-progress.sh`

## Working Rules

1. 没有复现，不准声称找到了根因。
2. 没有可信 feedback loop，不准把代码阅读包装成 confirmed root cause。
3. 没有证据，不准把猜测写成结论。
4. 先根因，再修复；先调查，再编码。
5. `planning/tasks.md` 必须足够让 `cc-do` 在脱离当前对话后继续推进。
6. 如果修复方案已经变成新 feature 设计，停止 debug，回 `cc-plan`。
7. 三次假设失败后，默认说明你的调查入口错了，不准继续硬猜。
8. 外部调研必须先脱敏，调研结论必须回到本仓库证据验证。
9. 修复触点超过 5 个文件时，默认先拆分或 reroute，不把大重构伪装成 bug fix。
10. 好的调查不是“找了很多可能性”，而是把错误世界缩成一个可信的 repair contract。
11. Roadmap 相关文件以 `devflow/roadmap.json` 为真相源，`devflow/ROADMAP.md` / `devflow/BACKLOG.md` 只是投影；不要再写旧式 `devflow/roadmap/*` 路径。

## Exit Criteria

- `planning/analysis.md` 已冻结症状、复现、证据链、根因和修复边界
- `planning/tasks.md` / `planning/task-manifest.json` 可直接交给 `cc-do`
- Roadmap Sync Gate 已闭合：source RM 已回写调查结果 / reroute，或 no-op reason 已落盘
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
