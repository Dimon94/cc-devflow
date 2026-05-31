# Reviewer Swarm

当 `cc-simplify` 调度只读 reviewers，或在主线程运行同样审查维度时，使用本 reference。

## 调度规则

- Claude Code：使用可用的 `Task` / subAgent 支持。
- Codex App / Codex tools：优先使用内置 `explorer` 只读 agent。
- 如果只有 `default`，prompt 必须写明：只读审查，不编辑。
- 核心流程不能依赖 repo-local `.codex/agents/*.toml`。
- 每个 reviewer 收到同一份 scope packet：repo root、完整 diff、相关 task/spec 路径、当前验证证据、自己的审查维度。
- Reviewers 永远不编辑文件，也不写报告文件。
- 小 diff 在宿主支持 subagents 时，也至少启动一个 combined reviewer。
- Specialists 是条件触发；不要为了完整感启动无关 specialist。

Fallback：如果没有或不允许使用 subagent 工具，就在主线程运行这些维度，并报告 `Agents used: no (subagent tool unavailable)`。

## Prompt Contract

```text
你是 cc-simplify 的只读评审智能体。不要编辑文件。
输入：repo root、完整 diff、相关任务/spec 路径、你的评审维度。
输出：每行一个 finding；没有发现时只输出 NO FINDINGS。
没有证据的猜测不要输出为 finding。
```

Finding line shape:

```text
severity | confidence | file:line | category | evidence | fix | route
```

必填字段：`severity`、`confidence`、`file:line`、`category`、`evidence`、`fix`、`route`。Confidence 为 1-10；低于 5 的 finding 不能进入自动修复列表。

## 默认 Reviewers

### Agent A: Spec / Scope

目标：确认实现仍然符合冻结的需求边界。

检查：

- 是否遗漏 task 要求。
- 是否多做了未请求行为。
- 行为、边界或 invariant 变化，却没有同步 `task.md` 或 spec。
- bugfix 被伪装成需求，或需求被伪装成 cleanup。
- 是否需要 reroute：设计漂移到 `cc-plan`，根因失效到 `cc-diagnose`，验证缺口到 `cc-check`。

### Agent B: Reuse / Structure

目标：删除重复和无意义抽象。

检查：

- 新 helper 是否重复已有 helper、utility、shared module 或邻近模式。
- 是否手写了本地已有 canonical helper 能处理的路径解析、字符串解析、env 检测、type guard、schema validation 或 error wrapping。
- 是否存在轻微变体 copy-paste。
- 是否用 parameter sprawl 代替了更清晰的 input object 或职责拆分。
- 是否发生边界泄漏：调用方知道内部状态、文件布局、协议细节或 test-only mechanism。
- 当前 diff 是否让一个文件承担多个职责。
- 是否出现 interface complexity 等于 implementation complexity 的 shallow wrapper。
- 是否出现只有一个 adapter、没有具体第二调用方的 hypothetical seam。
- 是否有 deep-module 机会：用小接口隐藏重复调用顺序、错误处理、配置或状态转换。

### Agent C: Quality / Efficiency / Test

目标：找出当前 diff 创建或放大的维护成本、运行成本。

检查：

- redundant state、derived cache、duplicate truth source、无用 observer/effect。
- startup、request、render、polling 或 event hot-path 中新增工作。
- 重复 IO、网络/API 调用、N+1，或为了局部数据读取整文件。
- 可并行的 reads、searches、requests 或 checks 被串行执行。
- 没有真实状态变化却触发 redundant updates。
- TOCTOU check-then-act；直接操作加错误处理更简单。
- 无界 arrays/maps/caches、listener 泄漏、timer 泄漏。
- 测试只断言 mocks、给生产代码加 test-only method、过度 mock effects、遗漏真实响应字段、不能证明抓住 regression、缺 error/empty/permission/concurrency 路径、共享全局状态、依赖时间/locale/随机数据但没有 seed、对无序结果断言顺序、使用脆弱 timeout。

## 条件 Specialists

只有 diff 触碰对应表面时才加载：

- `security`: auth/backend changes, user input, file paths, command execution,
  HTML escape hatches, tokens, secrets
- `api-contract`: endpoint, request/response fields, status codes, auth
  requirements, pagination, OpenAPI/SDK docs
- `release`: VERSION, CHANGELOG, release scripts, CI artifact, tag format,
  publish idempotency
- `frontend-performance`: render loops, list lookup, repeated style injection,
  bundle/lazy-loading boundary

如果任一 specialist 发现 `critical`，再运行一次 Red Team 只读复查，专门找遗漏的跨边界失败模式。Red Team 不重复已有 findings。
