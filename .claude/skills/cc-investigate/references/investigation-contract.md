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
- boundary probe matrix, when the failure crosses components
- backward trace chain, when the error appears below the original trigger
- reference comparison, when a similar working path exists
- diagnostic instrumentation plan, when probes are needed
- pattern analysis
- root-cause hypothesis
- falsification method
- confirmed root cause
- root cause class
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
- timing guess / flaky wait

模式分析只是检索索引，不是 root cause。

## Boundary Probe Matrix

多组件链路必须记录每个边界的事实：

- `componentBoundary`
- `inputObserved`
- `outputObserved`
- `configEnvObserved`
- `stateObserved`
- `verdict`: `pass` / `fail` / `unknown`

第一个失败边界决定下一轮调查收缩点；多个边界同时失败时，优先追共同上游。

## Backward Trace Chain

深层堆栈或坏值来源不明时，必须追到源头：

- immediate failure site
- direct caller
- caller chain
- bad value origin
- original trigger
- why symptom-site fix is rejected

找不到 original trigger 时，不能冻结根因。

## Reference Comparison

有相似可用实现时，必须记录：

- similar working example
- broken path
- differences found
- differences accepted as hypothesis
- differences ruled out

不能用“差不多”跳过差异。

## Diagnostic Instrumentation

临时探针必须回答一个明确问题：

- probe location
- question answered
- command to run
- expected signal
- actual signal
- cleanup requirement

探针不是修复。handoff 必须说明删除、保留为正式日志，或转成测试断言。

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

## No Code Root Cause

如果结论不是代码根因，必须写清：

- `rootCauseClass`: `code` / `config` / `environment` / `external` / `timing`
- why not code root cause
- monitoring or future evidence needed
- operator handling after fix

环境、外部服务、时序窗口仍然需要证据；不能把调查不足写成外因。

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
