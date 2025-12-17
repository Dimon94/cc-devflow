# Code Review: REQ-004 - Agent Adapter Architecture (Git 新增文件)

---
reqId: REQ-004
phase: git-added-files (uncommitted)
completedTasks:
  - N/A (scope = `git ls-files --others --exclude-standard`)
generatedAt: 2025-12-17T09:30:10Z
updatedAt: 2025-12-17T09:44:12Z
reviewer: codex (code-reviewer workflow)
phaseStatus: blocked
decision: request_changes
---

- **What changed**: 新增 Node.js CLI 与 Adapter/Registry/Config/Tests 结构，用于在 Claude Code 与 Codex CLI 环境下选择并执行适配器。
- **Top risks**:
  - `spec-kit/` 整仓引入（含嵌套 `.git/`）若进入提交，将造成 scope/许可/维护风险。
  - 配置加载未做严格校验（schema/zod 未闭环），容易把错配变成“静默降级”。
  - 审计线索未落地（危险能力启用/调用的可追踪记录），与 PRD 安全要求不一致。
- **Alignment Check**:
  - **PRD scope**: partial — 适配器架构/双平台目标在范围内；capability enforcement 已对齐“命令需要能力”，但审计与配置校验仍未满足安全/可靠性验收。
  - **EPIC alignment**: partial — Contract/Registry/基础测试已跑通；仍需补齐审计与配置校验闭环。
- **Previous review follow-up**:
  - No prior review.

## Status update (post-fix)

- ✅ 修复 CLI 运行即崩溃（Adapter getter/字段冲突）：`lib/adapters/claude-adapter.js:6`、`lib/adapters/codex-adapter.js:5`
- ✅ 修复 capability enforcement 语义：改为按 `options.requiredCapabilities` 检查：`lib/adapters/registry.js:103`
- ✅ 修复 Registry 缓存污染：`reset()/setConfig()/register()` 清理 `_cachedSelection`：`lib/adapters/registry.js:22`
- ✅ 修复多命中行为不透明：输出候选告警 + 按 `priority/name` 确定性排序：`lib/adapters/registry.js:82`
- ✅ 安全硬化：`ClaudeAdapter` 默认 `shell: false`：`lib/adapters/claude-adapter.js:48`
- ⚠️ 仍待处理：`spec-kit/` 目录在提交前需移除；审计日志与配置校验闭环未实现

## Affected files (added)

- `bin/cc-devflow.js` — CLI 入口：注册适配器、加载 config、执行命令。
- `config/adapters.yml` — 默认配置（安全默认 deny）。
- `config/schema/adapters.schema.json` — `adapters.yml` 的 JSON Schema。
- `lib/adapters/adapter-interface.js` — Adapter 抽象契约。
- `lib/adapters/registry.js` — Registry/Selector + 安全策略检查。
- `lib/adapters/claude-adapter.js` — Claude Adapter（当前实现）。
- `lib/adapters/codex-adapter.js` — Codex Adapter（当前实现）。
- `lib/adapters/logger.js` — 结构化日志（JSON）实现。
- `test/adapters/registry.test.js` — Registry 合约测试（Jest）。
- `test/adapters/security.test.js` — 安全策略测试（Jest）。
- `test/benchmarks/adapter-detection.test.js` — 探测性能测试（Jest）。
- `package.json` / `package-lock.json` — Node 依赖与锁文件。
- `spec-kit/` — 参考仓库整体拷贝（8MB，含独立 `.git/`）。

## Root cause & assumptions

- **Analysis**: 当前实现把 `AgentAdapter` 设计成“抽象类 + 只读 getter”风格，但具体实现类却把 `name/folder` 当作可写字段赋值，导致运行时 TypeError。该问题属于契约层破坏（contract break），会让任何实际运行路径直接失败。
- **Assumptions**:
  - 目标是让 CLI 可在本仓库环境下直接运行（至少能走到 adapter detect/selection 路径），否则后续 capability/security/observability 都无从验证。
  - capability 模型应按 PRD/TECH_DESIGN：命令声明“需要什么能力”，适配器声明“提供什么能力”，Registry 只在“命令需要且适配器未提供 / 策略不允许”时阻断。

## Findings

- [BLOCKER][FIXED] Correctness — `AgentAdapter` 契约被实现类破坏，CLI 入口运行即崩溃
  - **Where**: `lib/adapters/claude-adapter.js:6`, `lib/adapters/codex-adapter.js:5`
  - **Evidence**: 已把 `ClaudeAdapter`/`CodexAdapter` 改为实现 `get name()`/`get folder()`，不再写入只读属性。
  - **Impact**: CLI 入口可启动，具备最小闭环验证条件。
  - **Scope Fit**: YES（属于 MVP 基础可运行性）。
  - **Recommendation**: 保持契约一致性（getter-only 或字段-only 二选一），避免后续 adapter 再次踩坑。
  - **Tests**: 建议补 CLI smoke test（目前以手动 `node bin/cc-devflow.js foo` 验证）。

- [HIGH][FIXED] Security/Design — capability enforcement 粒度错误：按“适配器拥有能力”deny，而不是按“命令需要能力”deny
  - **Where**: `lib/adapters/registry.js:103`, `test/adapters/security.test.js:12`
  - **Evidence**: 已改为按 `options.requiredCapabilities` 校验策略，并检查 `requiredCapabilities ⊆ adapter.capabilities`。
  - **Impact**: 默认 deny 不再会把“拥有 shell/network 的适配器”整体封死；可以做到“只阻断需要危险能力的命令”。
  - **Scope Fit**: YES（US3 安全模型的核心）。
  - **Recommendation**: 下一步需要把 `requiredCapabilities` 从“options 参数”提升为“命令层声明”，避免调用方忘传。
  - **Tests**: 已补充覆盖（阻断/允许/无需求命令通过）。

- [HIGH→MEDIUM][PARTIALLY FIXED] Security — ClaudeAdapter 子进程启动风险与审计缺失
  - **Where**: `lib/adapters/claude-adapter.js:39`
  - **Evidence**: 已改为 `shell: false`（降低注入/路径劫持风险），但“危险能力启用/调用”的审计线索仍未落地。
  - **Impact**: 安全默认值改善，但仍不满足 PRD 的“可审计”验收要求。
  - **Scope Fit**: YES（默认安全 + 审计要求）。
  - **Recommendation**: 增加审计日志输出（至少包含 adapter、capability、command、result、timestamp），并在策略允许时写入。
  - **Tests**: 增加：启用危险能力时必须产生审计记录（stdout 或文件）。

- [MEDIUM][FIXED] Reliability — Registry 缓存未按配置/生命周期失效，测试 reset 也不会清缓存
  - **Where**: `lib/adapters/registry.js:22`, `test/adapters/registry.test.js:67`
  - **Evidence**: `reset()/setConfig()/register()` 均清理 `_cachedSelection`，并添加回归用例验证。
  - **Impact**: 避免长进程与测试环境的“旧选择泄漏”。
  - **Scope Fit**: YES（US5 性能缓存必须正确）。
  - **Recommendation**: 若后续引入“动态注册/禁用适配器”，需要把缓存与“可用集合”绑定。
  - **Tests**: 已覆盖。

- [MEDIUM][FIXED] Correctness — 多适配器命中时无冲突告警与确定性优先级声明
  - **Where**: `lib/adapters/registry.js:74`, `lib/adapters/codex-adapter.js:6`
  - **Evidence**: Registry 收集所有命中适配器并按 `priority/name` 排序；多命中时输出候选列表告警。
  - **Impact**: 行为可解释且更可复现；在 Codex 环境（存在 `CODEX_*` env）下可优先选择 Codex。
  - **Scope Fit**: YES（US1/US2）。
  - **Recommendation**: 后续应把优先级规则文档化，并提供显式覆盖入口（ENV/CLI）作为第一优先级。
  - **Tests**: 可选：补一个“两个 adapter 同时 detect=true”的排序用例。

- [MEDIUM] Config Validation — 配置未按 schema 校验，`zod` 依赖与 schema 文件未形成闭环
  - **Where**: `bin/cc-devflow.js:20-32`, `config/schema/adapters.schema.json:1-44`
  - **Evidence**: CLI 直接 `yaml.load()` 后 `registry.setConfig(config.adapters)`；没有字段校验/默认值合并；`zod` 依赖未使用。
  - **Impact**: 错配会在运行时以非预期方式 fail（甚至静默降级），与“可解释、可恢复”目标冲突。
  - **Scope Fit**: YES（可靠性/安全默认值）。
  - **Recommendation**: 单一校验路径：要么把 JSON schema 用于 CI 校验，要么在运行时用 `zod` 严格解析并合并默认值。
  - **Tests**: 增加：非法 `preferred`/缺失 `policies` 时给出可操作错误。

- [LOW] Maintainability — Registry 存在未使用依赖与重复 console 输出，logger 未被接入
  - **Where**: `lib/adapters/logger.js:1`, `bin/cc-devflow.js:31`
  - **Evidence**: `registry.js` 未使用依赖已移除；但日志仍主要通过 `console.*`，`logger.js` 未被接入主流程。
  - **Impact**: 噪音与维护成本上升，结构化日志目标难以一致落地。
  - **Scope Fit**: YES（US5 可观测性）。
  - **Recommendation**: 统一日志出口（logger），并为关键事件定义字段（adapter、latency、reason、decision）。
  - **Tests**: 可选：对日志字段做快照测试（避免过度约束）。

- [LOW] Testing Gap — 当前测试未覆盖“真实适配器 + CLI”路径，错过运行时崩溃
  - **Where**: `test/adapters/registry.test.js:1-66`, `test/adapters/security.test.js:1-45`
  - **Evidence**: 测试使用 MockAdapter（getter 覆盖），未实例化 `ClaudeAdapter`/`CodexAdapter`。
  - **Impact**: 关键路径回归无法被测试捕获。
  - **Scope Fit**: YES。
  - **Recommendation**: 增加最小集成测试：CLI 启动、解析参数、完成一次 detect/execute。
  - **Tests**: 新增 `test/smoke/cli.test.js`（或在现有文件里加 1 个用例）。

## Performance & Reliability

- Hotspots: `AdapterRegistry.detectEnvironment()` 当前为线性扫描，暂可接受；冲突处理与缓存失效规则已补齐。
- Complexity notes: 缓存与覆盖/优先级同时存在时，必须用“单一真相源”（config + registered adapters）驱动，避免隐式状态。
- Monitoring/Benchmarks: 建议输出探测耗时与缓存命中字段（结构化日志），而不仅依赖 Jest 的时间断言。

## Security & Compliance

- Risks: 审计日志缺失；配置校验缺失会放大错配风险。
- Secrets/PII: 未发现硬编码密钥（符合 PRD）。
- Hardening suggestions: 将“危险能力”从“适配器固有”转为“命令请求”，并在允许时记录审计线索。

## Testing & Verification

- Coverage signals: `jest` 单测覆盖 Registry/Security/Benchmark，且已新增缓存失效回归与 capability 语义用例。
- Gaps: 仍缺少自动化的 CLI smoke（目前依赖手动验证），以及“审计日志必达”的测试。
- Suggested test plan:
  - Given 未配置 `allow_shell`
    When 运行 `node bin/cc-devflow.js <cmd>`
    Then 不应崩溃，且对需要 shell 的命令给出清晰拒绝与如何启用的提示
  - Given 同时存在 `.claude/` 与 `.codex/`
    When 执行同一命令
    Then 按确定性优先级选择并输出候选列表告警

## Documentation & DX

- Updates needed: 需要在 quickstart 或 README 中明确：默认 deny 会导致哪些命令不可用、如何安全启用、审计输出在哪里。
- Observability: 建议把 CLI 的 console 输出统一迁移到 `lib/adapters/logger.js`，并为审计日志提供稳定字段。

## Decision

- **Phase Gate Result**: Fail
- **Required Actions Before Next Phase**:
  1. 在提交前移除 `spec-kit/`（避免 scope/许可/维护风险进入版本历史）。
  2. 落地审计线索（危险能力启用/调用的可追踪记录）并补测试。
  3. 完成配置校验闭环（schema/zod 二选一），让错配“可解释、可恢复”。
- **Optional Follow-ups**:
  1. 统一日志出口与字段规范（接入 `lib/adapters/logger.js`），补齐多命中/无命中可观测性。

## Next Actions for Main Agent

1. 提交前移除 `spec-kit/`（你已确认会做，建议同时加入 `.gitignore` 防误加）。
2. 把审计做成“不可绕过”的路径：允许危险能力时，必须写入审计日志并有测试保证。
3. 给 `adapters.yml` 增加严格解析/默认值合并与错误提示，避免 silent fallback。
