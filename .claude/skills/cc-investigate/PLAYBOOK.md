# CC-Investigate Playbook

## Visible State Machine

`cc-investigate -> cc-do -> cc-check`

- Enter from: a bug, regression, or broken requirement whose root cause is still unclear.
- Stay in: `cc-investigate` until `planning/analysis.md` and the repair handoff are both frozen.
- Exit to: `cc-do` only after root cause and repair boundary are explicit in canonical artifacts.
- Reroute to: `cc-plan` for scope/design truth changes, or `roadmap` for project-level priority decisions.

## Core Rules

1. 先复现，再猜原因。
2. 先看最近变化，再决定是不是 regression。
3. 先证伪假设，再冻结根因。
4. `planning/analysis.md` 和 `planning/tasks.md` 必须足够让 `cc-do` 脱离当前会话继续工作。
5. 调查失败三次后先重建入口，不准继续乱补。
6. 没有 frozen root-cause contract，不准进入 repair task。
7. 多组件、深层调用、flaky 问题必须先补边界探针、反向追踪或条件等待证据。

## Iron Law

```text
NO REPAIR WITHOUT A FROZEN ROOT-CAUSE CONTRACT
```

root-cause contract 至少包含：稳定复现或缩小后的可验证症状、被破坏的代码 / 配置 / 数据 / 依赖契约、已证伪假设、最小修复边界。

## Required Outputs

- `planning/analysis.md`
- `planning/tasks.md`
- `planning/task-manifest.json`

## Investigation Standard

1. 先收集 symptom、expected、actual、repro。
2. 先查 prior investigations、TODOS/backlog、report-card finding 和最近变更。
3. 先沿代码路径定位触点和最近变更。
4. 先做 pattern analysis，再形成 1-3 个可证伪假设。
5. 每个假设都要写支持证据、反证、证伪方法、预期观察、实际观察。
6. 只有被证据钉死的根因才能进入 repair contract。
7. repair contract 只讲最小修复边界，不顺手发明新范围。

## Investigation Modes

| Mode | 什么时候用 | 第一动作 |
| --- | --- | --- |
| `reproduce-first` | 症状真实但不稳定 | 缩小复现命令 / 手动路径 |
| `diff-trace` | 昨天可用、今天坏了 | `git log --oneline -20 -- <affected-files>` |
| `boundary-probe` | API -> service -> DB、CI -> build -> deploy 这类链路断裂 | 记录每层输入、输出、配置和状态 |
| `backward-trace` | 错误出现在深层堆栈或坏值来源不明 | 从 immediate failure site 反追 original trigger |
| `reference-compare` | 同仓库有相似可用路径 | 列出 working / broken 差异并逐项接受或排除 |
| `condition-wait` | flaky、sleep、timeout、重试后消失 | 找真实等待条件，不先加大延时 |
| `history-trace` | 同一区域反复坏 | 查历史 `analysis.md`、TODO、report-card finding |
| `pattern-research` | 陌生框架 / 依赖 / 平台错误 | 脱敏后查通用错误类型 |
| `contract-check` | 修复边界可能扩大 | 判定 implementation drift / missing spec truth / roadmap mismatch |

## Pattern Analysis

至少对照这些模式，不要直接猜：

- race condition：间歇性、时序相关、共享状态
- null propagation：TypeError / undefined / missing guard
- state corruption：数据不一致、部分更新、hook / transaction 顺序
- integration failure：timeout、协议不匹配、外部服务边界
- configuration drift：本地 / CI / 生产表现不同
- stale cache：清缓存后恢复或旧状态复现
- resource leak：OOM、句柄增长、生命周期未释放
- trust boundary drift：外部输入、LLM 输出、用户输入被当成可信
- timing guess / flaky wait：任意 sleep / timeout / setTimeout 掩盖真实条件

## Boundary And Trace Evidence

复杂链路必须在 `analysis.md` 写清：

- Boundary Probe Matrix：component boundary、input observed、output observed、config/env observed、state observed、verdict
- Backward Trace Chain：immediate failure site、caller chain、bad value origin、original trigger、why symptom-site fix is rejected
- Reference Comparison：similar working example、broken path、differences accepted / ruled out
- Diagnostic Instrumentation Plan：probe location、question answered、command、expected signal、cleanup requirement

这些字段不是装饰。它们的作用是证明根因位于源头，而不是报错点。

## Prior Investigation History

形成根因前至少查：

1. `git log --oneline -20 -- <affected-files>`
2. `rg -n "<error-keyword>|<module>|<capability>" devflow/changes`
3. `TODOS.md`、backlog、roadmap 中的相关项
4. 既有 `planning/analysis.md` 和 `review/report-card.json`

命中历史时，写入 `analysis.md` 的 `Prior Investigations`，说明这次是复发、同类结构味道，还是无关历史。

## External Research Hygiene

只有在本地证据不足、错误类型陌生、或像依赖 / 框架 / 平台问题时才做外部调研。

- 先删除 host、IP、token、customer id、内部路径、SQL、私有 repo 名。
- 只搜错误类别、框架 / 库名、版本、通用组件名。
- 调研结果只能进入候选假设，必须回到本仓库复现或代码证据验证。

## No Code Root Cause

如果结论是环境、外部服务或时序窗口：

- 写 `rootCauseClass`: `code` / `config` / `environment` / `external` / `timing`
- 写明为什么不是 code root cause
- 写明需要什么 monitoring / future evidence
- 写明 operator handling，不要把未知外因包装成代码修复

## Scope Lock

根因假设形成后，写清：

- affected module
- allowed files
- forbidden files
- blast radius estimate
- if touches >5 files: split / justify / reroute

超过 5 个文件默认是调查信号，不是正常 bug-fix 规模。

## Escalation

三次假设失败后写 `Escalation Decision`：

- failed hypothesis count
- attempted evidence
- why current entry is suspect
- next option：continue / instrument-and-wait / human-review / reroute-cc-plan
- recommendation

## Local Kit

- 模板在 `assets/`
- 调查契约在 `references/investigation-contract.md`
- 需要分析骨架时用 `scripts/bootstrap-analysis.sh`

## Exit Rule

只有当下一位执行者读完 `planning/analysis.md`、`planning/tasks.md`、`planning/task-manifest.json` 就知道：

- 为什么坏
- 该修什么
- 不该扩到哪里
- 用什么命令证明修好了

这次调查才算合格。
