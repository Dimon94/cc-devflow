---
name: cc-simplify
version: 1.4.1
description: "Use when changed code needs an automatic subagent-backed simplification pass for scope drift, reuse, code quality, efficiency, test quality, and confidence-gated smell fixes before cc-check or cc-act."
reads:
  - devflow/changes/<change-key>/task.md
  - current Git diff
writes:
  - path: code changes
    durability: working-tree
    required: false
  - path: test changes
    durability: working-tree
    required: false
---

# CC-Simplify

`cc-simplify` 是 ship 前的坏味道清理关口。

它不是“顺手重构”。它只做一件事：基于当前 diff 找到已经存在的重复、过度设计、低效路径、测试假象、spec drift，并修掉已经确认的坏味道。

## Iron Law

```text
ONLY FIX CONFIRMED SMELLS. DO NOT BEAUTIFY BY GUESS.
```

没有证据的 reviewer finding 只是线索，不是命令。先验证，再修改。

## Phase 1: 识别变更

1. 优先读取当前变更：
   - 有 staged diff：跑 `git diff --cached` 和 `git diff`
   - 无 staged diff：跑 `git diff HEAD`
   - 如果没有 git diff，审查本轮对话中用户点名或你刚编辑过的文件
2. 记录 diff 范围：
   - changed files
   - affected modules
   - stack signals: `package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml` / etc.
   - test framework signals: `jest` / `vitest` / `pytest` / `go test` / etc.
   - scope flags: API / auth / backend / frontend / migration / docs / release
   - related `task.md` / capability specs
   - already-run verification, if any
3. 如果变更跨多个互不相关模块，先按模块分组；不要让一个 cleanup pass 变成大扫除。
4. 只审当前 diff 新增或本次改动扩大后的坏味道。历史债只在它阻挡当前交付或被本次 diff 放大时进入清理范围。

## Phase 2: 自动子智能体评审

触发 `cc-simplify` 本身就构成用户对子智能体 / subAgent 评审的明确授权。不要要求用户在 `[$cc-simplify]` 之外再补一句“请开启子智能体”。

只要当前宿主支持子智能体，必须自动启动只读评审智能体；主线程只负责汇总、验证 finding、实际修复和最终验证。

### 调度原则

- ClaudeCode 环境：使用可用的 `Task` / subAgent 机制自动创建只读评审 subAgent。
- Codex App / Codex 工具环境：优先使用内置 `explorer` 子智能体做只读评审；不要假设 ClaudeCode 的 `Task` / `subAgent` 语义存在。
- 在暴露 `spawn_agent` 工具的 Codex 环境里，使用 `spawn_agent(agent_type="explorer", fork_context=false, ...)`；如果没有 `explorer`，使用 `default` 也必须在 prompt 里写明：只读审查，不编辑文件。
- `cc-simplify` 的触发就是对子智能体的明确请求；不要再等待用户二次授权。
- 不依赖 repo-local `.codex/agents/*.toml` 自定义 agent 名称来完成核心流程。自定义 agent 可以作为增强，但主流程必须能依赖 Codex 内置 `explorer` / `default` 或宿主内置 subAgent 机制。
- 只把只读评审交给智能体；主线程负责最终判断和实际编辑。
- 每个智能体拿到同一份完整 diff、相关任务/设计/spec 路径、当前 repo 根目录。
- 智能体不能改文件，只输出结构化 findings。
- 如果当前运行时没有子智能体工具，或工具调用被上层策略禁止，主线程按同样清单顺序执行，并在报告里写 `Agents used: no (subagent tool unavailable)`；不要伪造子智能体结果。
- 小 diff 也要尝试启动子智能体；如果资源或宿主限制不适合三路并行，至少启动一个合并维度的只读 reviewer。
- 条件 specialist 只在对应 scope 出现时启用；不要为了“完整”启动无关评审。

默认调度：

- 大 diff / 多文件 diff：启动 Agent A、Agent B、Agent C 三个只读评审智能体。
- 小 diff / 单文件 diff：至少启动一个 combined reviewer，覆盖 A/B/C 三组检查。
- 命中 security / api-contract / release / frontend-performance 时，再启动对应 specialist；如果 specialist 发现 `critical`，再启动 Red Team 只读复查。

智能体 prompt 必须自包含：

```text
你是 cc-simplify 的只读评审智能体。不要编辑文件。
输入：repo root、完整 diff、相关任务/spec 路径、你的评审维度。
输出：每行一个 JSON finding；没有发现时只输出 NO FINDINGS。
没有证据的猜测不要输出为 finding。
```

Finding JSONL schema：

```json
{"severity":"critical|important|minor","confidence":8,"path":"file","line":12,"category":"reuse|scope|quality|efficiency|testing|security|api-contract|release","summary":"...","evidence":"...","fix":"...","fingerprint":"file:12:category","specialist":"name","test_stub":"optional"}
```

字段要求：

- 必填：`severity`、`confidence`、`path`、`category`、`summary`、`evidence`、`fix`、`specialist`
- 可选：`line`、`fingerprint`、`test_stub`
- `confidence` 用 1-10；低于 5 的 finding 不能进入自动修复列表。
- `test_stub` 只给能用一个小测试抓住的问题；架构判断不要伪造测试。

### 推荐三个智能体

#### Agent A: Spec / Scope Reviewer

目标：确认实现是否仍然符合冻结的需求边界。

检查：

1. 是否遗漏了任务要求。
2. 是否多做了未要求功能。
3. 是否改变行为、边界或 invariant，却没有同步 `task.md` 或 capability spec。
4. 是否把 bug 修复伪装成新需求，或把新需求伪装成 cleanup。
5. 是否应该 reroute：
   - 设计范围变了 -> `cc-plan`
   - 根因故事失效 -> `cc-investigate`
   - 需要重新验证 -> `cc-check`

#### Agent B: Reuse / Structure Reviewer

目标：删除重复和无意义抽象。

检查：

1. 新增函数是否重复现有 helper、utility、shared module、邻近文件里的模式。
2. 是否手写了已有能力：路径处理、字符串解析、env 检测、类型 guard、schema 验证、错误包装。
3. 是否出现 copy-paste with slight variation，应该合并为已有 helper 或一个更小的局部函数。
4. 是否有 parameter sprawl：为了一个场景继续给函数加参数，而不是整理输入对象或拆出职责。
5. 是否泄漏抽象边界：调用方知道了内部状态、文件布局、协议细节或测试专用机制。
6. 文件是否因为本次改动开始承担多个职责；如果只是历史遗留，不在本轮扩大范围。
7. 新增模块是否是浅包装：接口复杂度几乎等于实现复杂度，删除它只是把同样复杂度搬到调用方。
8. seam 是否真实：只有一个 adapter 且没有明确第二个调用场景时，先当作 hypothetical seam；不要为了假扩展性制造抽象。
9. deep module 机会：如果一个小接口能隐藏大量重复调用顺序、错误处理、配置或状态转换，优先让复杂度集中到该模块，而不是散落在调用方。

#### Agent C: Quality / Efficiency / Test Reviewer

目标：找出会变成维护成本或运行成本的坏味道。

检查：

1. 冗余状态：缓存可派生值、重复状态源、无意义 observer/effect。
2. 热路径膨胀：启动、请求、渲染、轮询、事件处理里新增阻塞工作。
3. 重复 IO / 网络 / API 调用、N+1、整文件读取但只需要局部数据。
4. missed concurrency：互不依赖的读文件、搜索、请求、验证命令被串行执行。
5. recurring no-op update：轮询或 reducer 明明没有变化却通知下游。
6. TOCTOU：先检查文件存在再操作；应直接操作并处理错误。
7. 内存和生命周期：无界数组/map/cache、listener 未清理、timer 未释放。
8. 测试坏味道：
   - 测 mock 存在，不测真实行为
   - 为测试给生产类加 test-only method
   - 不理解依赖副作用就 mock
   - partial mock 缺少真实响应字段
   - 只补测试后验通过，没有证明测试会抓住 bug
   - 缺少错误路径、权限拒绝、空值、边界值、单元素集合、并发访问测试
   - 测试共享全局状态、依赖系统时间/时区/locale、真实网络或随机数据但没有 seed
   - 断言无序结果的顺序，或使用过紧 timeout 造成 flaky

### 条件 specialist

当 diff 命中对应范围时，额外启用这些只读维度；没有命中就跳过：

- `security`：auth/backend 大改、用户输入、文件路径、命令执行、HTML escape hatch、token/secret 处理
- `api-contract`：endpoint、请求/响应字段、状态码、鉴权要求、分页、OpenAPI/SDK 文档
- `release`：VERSION、CHANGELOG、发布脚本、CI artifact、tag 格式、publish idempotency
- `frontend-performance`：渲染循环、列表查找、重复 style 注入、bundle/懒加载边界

如果任一 specialist 发现 `critical`，再做一次 Red Team 只读复查：它只找遗漏的跨边界失败模式，不重复前面 finding。

## Phase 3: 汇总和去重 findings

先解析 JSONL；非 JSON 行丢弃，`NO FINDINGS` 表示该 source 没有发现。

Fingerprint 规则：

1. 优先使用 finding 自带 `fingerprint`。
2. 否则用 `{path}:{line}:{category}`。
3. 没有 `line` 时用 `{path}:{category}:{summary}`。

同一 fingerprint 的 finding 合并：

- 保留 confidence 最高的版本。
- 如果多个 specialist 命中同一问题，标记 `multi-specialist`，confidence +1，最高 10。
- 合并后按 `critical -> important -> minor`，再按 confidence 降序排序。

Confidence gate：

- `7-10`：进入主 findings 表。
- `5-6`：进入主表，但 Decision 初始为 `verify-first`。
- `3-4`：放到 appendix，只在主线程读代码后确认时升级。
- `1-2`：抑制，不输出为行动项。

主表格式：

| ID | Source | Severity | File:line | Claim | Evidence | Proposed fix | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | spec | critical | | | | | pending |

Severity：

- `critical`: 会破坏功能、安全、数据、发布真实性
- `important`: 明显坏味道、spec drift、测试假象、性能风险
- `minor`: 可读性、局部重复、小优化

Decision：

- `auto-fix`: 已确认、机械、低风险，主线程可直接修
- `ask`: 需要用户判断或会改变用户可见行为
- `fix`: 已确认且在当前 cleanup 边界内
- `verify-first`: 线索合理但证据不足，修前必须读代码确认
- `skip-false-positive`: 和代码事实不符
- `skip-not-worth-it`: 成本高于收益，且不影响当前交付
- `reroute`: 已经不是 simplify 范围

### Fix-First 决策表

默认自动修：

- dead code、unused variable/import、明显 stale comment
- 简单重复 helper、路径/版本/changelog 不一致
- 局部 magic value 提取为已存在常量或邻近常量
- 明显 O(n*m) 查找可改为 map/index，且行为不变
- 缺少轻量输入 shape 校验，且已有本地校验模式可复用

默认 ask 或 reroute：

- auth、XSS、注入、secret、权限、安全边界
- race condition、数据迁移、事务语义、enum/value completeness
- 需要超过约 20 行的新设计，或触碰超过 5 个文件
- 删除功能、改变公共 API、改变用户可见行为
- finding 证明 frozen plan、root cause、acceptance 已经失效

## Phase 4: 验证 finding 是否成立

不要盲信 reviewer。

每条 finding 修复前先做四个检查：

1. **代码事实**：打开对应文件和相邻实现，确认问题真实存在。
2. **使用事实**：用 `rg` 查调用方，确认不是 reviewer 缺上下文。
3. **需求事实**：对照 `task.md`、capability spec，确认没有误删必要行为。
4. **验证事实**：明确修复后用什么命令或检查证明没有回归。

架构类 finding 还必须过删除测试：想象删除这个模块、helper、wrapper 或 seam。

- 如果复杂度只是原样散回多个调用方，它可能是有价值的 deep module。
- 如果复杂度消失或只留下一个直接调用，它多半是 pass-through / fake seam。
- 如果删除会违反 capability invariant 或 public contract，就不能当作 cleanup 直接删。

如果 reviewer 建议“更专业”的能力，先做 YAGNI 检查：没有调用方、没有需求、没有 acceptance，就不要新增。

这些情况不要报成 finding：

- 为可读性保留的轻微重复。
- 已有断言已经覆盖真实行为，只是“不够漂亮”。
- 输入域受约束，所谓边界值在产品里不可能出现。
- 测试一次覆盖多个 guard；只要行为清楚，不必强拆。
- 当前 diff 已经修掉的问题。
- shutdown/emergency/fire-and-forget 路径里有意吞掉错误。
- pass-through wrapper 只是稳定 API 层，内部委托到真实实现。

## Phase 5: 只修 confirmed smells

修复顺序：

1. Critical
2. Simple important fixes
3. Complex important fixes
4. Minor fixes only if low-risk

边界：

- 不做 unrelated refactor。
- 不改公共 API，除非 finding 证明当前 API 本身就是坏味道。
- 不把多个架构方向揉进一个 cleanup。
- 不为了消灭 3 行重复制造 50 行抽象。
- 如果预计触碰超过 5 个文件，先停下说明：拆分、reroute，还是只修 critical path。

如果某条 finding 需要重新设计，停止并交给 `cc-plan`。如果 finding 证明根因不明，交给 `cc-investigate`。

## Phase 6: 新鲜验证

完成修改后必须运行和本次 cleanup 相关的最小验证：

1. 格式/结构：例如 `git diff --check`、JSON/YAML parse、脚本 `bash -n`。
2. 目标测试：覆盖被修改模块的单测或 smoke。
3. 必要时运行更高层 gate：`npm test`、`npm run verify:*`、项目本地等价命令。

不能用旧结果声称现在通过。智能体报告也不能替代主线程验证。

## 输出格式

结束时输出简短 `Simplify Report`：

- Reviewed diff:
- Agents used: `yes` / `no`
- Findings fixed:
- Findings skipped:
- Reroutes / blockers:
- Verification run:
- Next step: `cc-check` / `cc-act` / `cc-plan` / `cc-investigate`

如果 `cc-simplify` 修改了代码或验证口径，下一步必须回 `cc-check`，不能带旧 verification report 继续 `cc-act`。

## Do Not

- 不把 cleanup 当成重写入口。
- 不因为 reviewer 说了就盲改。
- 不把风格偏好升级成 critical。
- 不跳过 spec drift。
- 不用 mock 通过来证明真实行为正确。
- 不在没有新鲜验证时声称“已简化完成”。
