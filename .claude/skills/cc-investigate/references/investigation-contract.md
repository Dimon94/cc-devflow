# Investigation Contract

## Iron Law

- 没有根因，不准修 bug。
- 没有 frozen root-cause contract，不准生成 repair task。

## Minimum Evidence

每次调查至少留下这些事实：

- symptom
- reproduction path
- feedback loop contract
- symptom match evidence
- expected vs actual
- code path
- recent change signal
- prior investigation signal
- boundary probe matrix, when the failure crosses components
- backward trace chain, when the error appears below the original trigger
- root cause proof ladder: symptom site, first bad state, violated contract, original trigger, counterfactual proof, escape reason
- reference comparison, when a similar working path exists
- diagnostic instrumentation plan, when probes are needed
- pattern analysis
- ranked candidate hypotheses
- root-cause hypothesis
- falsification method
- confirmed root cause
- correct test seam
- root cause class
- repair boundary
- blast radius
- roadmap sync status

## Output Shape

- `planning/analysis.md` 是人类真相源
- `planning/tasks.md` 是修复 handoff
- `planning/task-manifest.json` 是执行真相源
- `change-meta.json` 必须记录 roadmap sync status、spec diagnosis 和 no-op reason / updated files

## Root-Cause Hypothesis

每条假设都必须可证伪：

- `candidateRank`：候选假设排序，避免第一直觉锚定
- `hypothesis`：具体说明什么坏了，为什么会导致症状
- `evidenceFor`
- `evidenceAgainst`
- `falsificationMethod`
- `expectedObservation`
- `actualObservation`
- `status`：`pending` / `confirmed` / `rejected` / `needs-more-evidence`

只有 `confirmed` 假设可以进入 Root Cause。

## Root Cause Proof Ladder

confirmed root cause 必须证明：

- `symptomSite`：用户实际看到的失败点
- `firstBadState`：状态第一次变坏的位置和证据
- `violatedContract`：被破坏的契约、invariant、schema、协议或时序条件
- `originalTrigger`：制造 first bad state 的动作、事件、diff、配置或外部响应
- `counterfactualProof`：恢复契约、替换输入、回滚 diff 或断言边界后的实际观察
- `escapeReason`：为什么测试、类型、review、监控或 artifact gate 没挡住

缺 `firstBadState`、`originalTrigger` 或 `counterfactualProof` 时，根因状态只能是 `needs-more-evidence`；不允许生成 repair task。

## Feedback Loop Contract

调查必须先构造一个可信 pass/fail loop：

- `loopType`: failing-test / http-script / cli-fixture / browser-script / trace-replay / throwaway-harness / property-fuzz / bisect / differential / hitl
- `commandOrDriver`
- `expectedFailingSignal`
- `actualFailingSignal`
- `symptomMatchEvidence`
- `runtime`
- `determinism`
- `failureRate`
- `sharpeningPlan`

loop 必须复现用户报告的同一失败。无法构造 loop 时，只能进入 `Evidence Request`，不能冻结根因。

## Pattern Analysis

调查必须显式选择或排除常见模式：

- race condition
- null propagation
- state corruption
- integration failure
- configuration drift
- stale cache
- resource leak
- performance regression
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

- probe tag
- probe location
- question answered
- command to run
- expected signal
- actual signal
- cleanup requirement

探针不是修复。handoff 必须说明删除、保留为正式日志，或转成测试断言。

debug 日志必须带唯一前缀，例如 `[DEBUG-FIX123-a4f2]`，确保 cleanup 可以用 grep 验证。

## Correct Test Seam

修复 handoff 必须记录回归测试是否覆盖真实触发链：

- `testSeam`
- `publicInterfaceExercised`
- `realTriggerChainCoverage`
- `whyShallowTestRejected`
- `ifNoCorrectSeam`

没有正确 seam 时，必须把它记录为架构事实，并保留原始 feedback loop 作为修复验证。

## Domain And Decision Context

调查前先读 cc-devflow 原生上下文：`devflow/specs/INDEX.md`、相关 capability specs、roadmap/backlog handoff、历史 `planning/design.md` / `planning/analysis.md`、`change-meta.json`。

- 输出中的领域概念、假设名、测试名使用项目既有词汇
- 如果根因或修复方向违反 capability spec、roadmap decision 或历史 design decision，必须显式记录冲突和理由
- 缺失领域词汇是调查信号，不要临时发明同义词掩盖契约缺口

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
- evidence request：repro env / HAR / log dump / core dump / timestamped recording / temporary production instrumentation

## Reroute

- 根因明确，修复边界清楚 -> `cc-do`
- 发现这不是 bug，而是范围/设计问题 -> `cc-plan`
- 发现这其实是项目优先级问题 -> `roadmap`
