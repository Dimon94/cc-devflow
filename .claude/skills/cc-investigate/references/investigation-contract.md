# Investigation Contract

## Iron Law

- 没有根因，不准修 bug。
- 没有 frozen root-cause contract，不准生成 repair task。

## Minimum Evidence

每次调查至少留下这些事实：

- symptom
- reproduction path
- expected vs actual
- code path
- recent change signal
- prior investigation signal
- pattern analysis
- root-cause hypothesis
- falsification method
- confirmed root cause
- repair boundary
- blast radius

## Output Shape

- `planning/analysis.md` 是人类真相源
- `planning/tasks.md` 是修复 handoff
- `planning/task-manifest.json` 是执行真相源

## Root-Cause Hypothesis

每条假设都必须可证伪：

- `hypothesis`：具体说明什么坏了，为什么会导致症状
- `evidenceFor`
- `evidenceAgainst`
- `falsificationMethod`
- `expectedObservation`
- `actualObservation`
- `status`：`pending` / `confirmed` / `rejected` / `needs-more-evidence`

只有 `confirmed` 假设可以进入 Root Cause。

## Pattern Analysis

调查必须显式选择或排除常见模式：

- race condition
- null propagation
- state corruption
- integration failure
- configuration drift
- stale cache
- resource leak
- trust boundary drift

模式分析只是检索索引，不是 root cause。

## Prior History

调查必须记录是否检查了：

- `git log --oneline -20 -- <affected-files>`
- historical `planning/analysis.md`
- `TODOS.md` / backlog / roadmap
- previous `report-card.json` findings

如果同一区域重复出现 bug，必须标记为 architectural smell candidate。

## External Research

外部调研必须脱敏：

- 不搜索 host、IP、token、customer id、内部路径、SQL、私有 repo 名
- 只搜索通用错误类别、框架 / 库名、版本、组件名
- research finding 只能作为候选假设，必须回到本仓库验证

## Repair Boundary

修复边界至少记录：

- affected module
- allowed files
- forbidden files
- expected spec delta
- verification after fix
- blast radius file count
- blast radius risk

预计触碰超过 5 个文件时，必须 split / justify / reroute。

## Escalation

三次假设失败后，不再继续猜。必须记录：

- failed hypothesis count
- attempted evidence
- why current entry is suspect
- recommended next option：continue / instrument-and-wait / human-review / reroute-cc-plan

## Reroute

- 根因明确，修复边界清楚 -> `cc-do`
- 发现这不是 bug，而是范围/设计问题 -> `cc-plan`
- 发现这其实是项目优先级问题 -> `roadmap`
