# PRD: REQ-004 - Agent Adapter Architecture

**Status**: Draft
**Created**: 2025-12-17
**Owner**: cc-devflow Team
**Type**: Architecture / Core Infrastructure
**Version**: 1.0.0

---

## 背景与目标

### 业务背景

cc-devflow 当前以 Claude Code 的命令/Agent 体系为主要运行环境：命令、Agent、脚本与目录结构（如 `.claude/`）强耦合。

随着路线图进入多平台阶段（例如 Codex CLI、Cursor 等），我们需要让“同一套需求工作流”在不同 Agent 平台上运行，而不是为每个平台复制一套命令与脚本。

本需求的解决方案需要借鉴 @spec-kit 的成熟做法：以“平台目录/运行时差异”为边界，通过可插拔的适配层来承载差异，保持上层规格与流程的一致性。

### 问题陈述

- 现状：平台差异被迫写进命令逻辑，导致分支/条件爆炸，维护成本随平台数线性甚至超线性增长。
- 风险：缺乏统一的能力边界与安全默认值（例如 shell/network 的危险操作）会让扩平台变成“不可控扩权”。
- 结果：每新增一个平台，都可能引发对既有命令/Agent 的连锁修改，测试也难以形成稳定基线。

### 目标

- **主要目标**：引入 Agent Adapter Architecture，使 cc-devflow 在至少两种平台（Claude Code + Codex CLI）可运行，并为后续平台扩展提供稳定接口。
- **成功指标（高层）**：
  - 现有 Claude Code 使用体验不被破坏（核心流程可继续执行）。
  - 在 Codex CLI 环境下可选择到对应适配器并完成最小可运行闭环。
  - 平台差异不再侵入每条命令的业务逻辑。
- **影响范围**：命令执行入口与平台差异封装方式（Adapter/Registry/选择策略/能力模型/日志）。

---

## 范围界定

### 包含内容（In Scope）

- 定义一个统一的 Agent Adapter 抽象（环境探测、命令执行、上下文/能力声明）。
- 提供一个 Registry/Selector：
  - 自动探测当前运行平台并选择适配器。
  - 允许显式覆盖（用于确定性与调试）。
- 交付至少 2 个“可运行”的适配器：
  - 默认适配器：Claude Code。
  - 非默认适配器：Codex CLI。
- 默认安全策略：capability allow-list，默认 deny 高风险能力（如 `shell/network`），启用必须显式配置并记录审计线索。
- 最小非功能边界：探测性能目标 + 结构化日志字段约定（用于排障与验收）。

### 明确不包含（Out of Scope）

- 一次性支持所有平台（Cursor / Antigravity / Qwen 等）作为本需求的交付目标。
- 将现有命令/Agent 全量改造成模板引擎或跨平台 DSL（属于后续需求）。
- 引入完整的分布式 tracing/metrics 体系（本需求只要求轻量结构化日志）。
- 远程执行/微服务化拆分。

---

## 技术约束

| 约束类型 | 具体要求 | 优先级 |
| -------- | -------- | ------ |
| 兼容性 | Claude Code 下既有命令的默认行为保持一致（不要求用户迁移配置） | HIGH |
| 可扩展性 | 新平台的接入通过新增适配器完成，不要求修改每个命令逻辑 | HIGH |
| 安全默认值 | 默认最小权限：危险能力默认关闭，启用需显式配置并可审计 | HIGH |
| 可观测性 | 适配器选择与执行必须输出结构化日志，便于定位环境/选择/失败原因 | HIGH |
| 性能边界 | 适配器探测总耗时 <50ms（缓存后 <5ms） | MEDIUM |
| 借鉴 spec-kit | 参考 spec-kit 的多 Agent 目录/运行时差异隔离思路，避免为平台复制流程 | MEDIUM |

---

## 用户故事与验收标准（INVEST）

### Story 1: 跨平台运行（自动选择适配器）(Priority: P1) 🎯 MVP

**As a** cc-devflow 用户
**I want** 在不同 Agent 平台运行同一套 cc-devflow 流程时，系统能自动选择正确的适配器
**So that** 我无需理解平台差异也能执行工作流

**Why this priority**: 不具备跨平台运行能力，本需求不成立。

**Independent Test**: 在 Claude Code 与 Codex CLI 两种环境分别触发一次命令执行，观察适配器选择结果与执行结果可独立验证。

**Acceptance Criteria**:
```gherkin
AC1: Given 当前运行环境是 Claude Code
     When 用户触发任意一条 DevFlow 命令
     Then 系统选择 Claude 适配器并完成执行

AC2: Given 当前运行环境是 Codex CLI
     When 用户触发同一条 DevFlow 命令
     Then 系统选择 Codex 适配器并完成最小可运行闭环

AC3: Given 多个适配器同时命中
     When 用户未显式指定
     Then 系统按确定性优先级选择并输出告警（包含候选适配器列表）

AC4: Given 没有任何适配器命中
     When 用户未显式指定
     Then 系统选择默认适配器或给出可操作的失败提示（包含如何显式指定）
```

**Priority**: P1 (MVP Critical)
**Complexity**: MEDIUM

---

### Story 2: 适配器可插拔（Registry/接口稳定）(Priority: P1) 🎯 MVP

**As a** cc-devflow 维护者
**I want** 通过新增一个适配器实现即可接入新平台
**So that** 平台扩展不会引发对既有命令/Agent 的连锁修改

**Why this priority**: 这是“架构类需求”的核心价值：把变化隔离到边界。

**Independent Test**: 在不修改既有命令的前提下新增一个最小适配器，能够被注册、被选择、被执行。

**Acceptance Criteria**:
```gherkin
AC1: Given 已存在一组既有 DevFlow 命令
     When 新增一个适配器实现并完成注册
     Then 既有命令无需修改即可在该适配器下执行

AC2: Given 适配器注册表中存在多个实现
     When 触发平台选择
     Then 选择逻辑与覆盖逻辑遵循统一规则，且行为可复现
```

**Priority**: P1 (MVP Critical)
**Complexity**: MEDIUM

---

### Story 3: 安全默认值（能力模型与审计）(Priority: P1) 🎯 MVP

**As a** 安全敏感的 cc-devflow 维护者
**I want** 适配器以 capability 模型声明能力，并默认拒绝高风险能力
**So that** 扩平台不会默认扩大攻击面

**Why this priority**: 没有安全边界的“多平台执行”是不可接受的。

**Independent Test**: 以一个“缺少必要能力”的适配器作为输入，验证系统会阻断并给出明确错误；再以显式配置启用高风险能力，验证产生审计线索。

**Acceptance Criteria**:
```gherkin
AC1: Given 某条命令声明需要危险能力（例如 shell 或 network）
     When 当前选中的适配器未声明该能力
     Then 系统阻断执行并给出清晰错误信息

AC2: Given 用户显式启用了危险能力
     When 执行触发该能力的命令
     Then 系统记录可审计的日志线索（至少包含适配器、能力名、执行结果）
```

**Priority**: P1 (MVP Critical)
**Complexity**: HIGH

---

### Story 4: 可覆盖的选择策略（配置/环境覆盖）(Priority: P2)

**As a** cc-devflow 维护者
**I want** 在需要确定性或调试时显式指定/覆盖适配器选择
**So that** 我能快速定位问题并避免“探测不确定性”导致的不可复现

**Why this priority**: 自动探测应当可用，但不能成为“不可控魔法”。

**Independent Test**: 在同一环境下多次执行，覆盖配置生效且选择结果一致。

**Acceptance Criteria**:
```gherkin
AC1: Given 用户已显式指定期望的适配器
     When 执行命令
     Then 系统使用该适配器且不会被自动探测覆盖

AC2: Given 用户显式禁用某个适配器
     When 自动探测命中该适配器
     Then 系统不会选择它，并给出可操作提示
```

**Priority**: P2 (High)
**Complexity**: MEDIUM

---

### Story 5: 可观测性与性能边界（探测缓存 + 结构化日志）(Priority: P2)

**As a** cc-devflow 维护者
**I want** 适配器探测满足明确的性能边界，并输出可机器解析的结构化日志
**So that** 我能在多平台环境快速定位选择/执行问题

**Why this priority**: 平台问题若不可观测，扩平台会把维护成本放大。

**Independent Test**: 运行同一命令两次，第二次探测耗时满足缓存目标；日志字段齐全可检索。

**Acceptance Criteria**:
```gherkin
AC1: Given 首次执行命令触发适配器探测
     When 记录探测耗时
     Then 总耗时 <50ms

AC2: Given 在同一会话/进程中再次执行命令
     When 触发适配器探测
     Then 走缓存路径且耗时 <5ms

AC3: Given 任意一次适配器选择与执行
     When 产生日志
     Then 日志包含适配器标识、耗时、结果状态与失败原因（如失败）
```

**Priority**: P2 (High)
**Complexity**: MEDIUM

---

## 边界案例处理

- **选择冲突**：多个适配器命中时必须有确定性优先级，并输出告警。
- **无命中**：必须给出可操作的失败提示（如何显式指定/如何安装/如何配置）。
- **能力不足**：适配器缺少命令所需能力时必须阻断并提示。
- **执行失败**：适配器执行失败必须输出可诊断信息（错误类别、适配器、上下文摘要）。

---

## 非功能性要求

### 性能要求

| 指标 | 目标值 | 关键性 |
|------|--------|--------|
| 适配器探测总耗时 | <50ms | MEDIUM |
| 适配器探测缓存后耗时 | <5ms | MEDIUM |

### 安全要求

- [ ] **身份验证**: 不新增新的登录体系（沿用各平台的运行时身份/权限边界）
- [ ] **授权机制**: capability allow-list（命令声明所需能力；适配器声明所提供能力）
- [ ] **数据加密**: 不引入新的敏感数据持久化；如必须存储配置，需避免存储明文密钥
- [x] **输入验证**: 所有来自用户配置/环境的适配器选择输入必须校验
- [x] **审计日志**: 危险能力启用与调用需要可追踪日志线索
- [x] **密钥管理**: NO HARDCODED SECRETS（使用环境变量或现有密钥管理方式）

### 可靠性要求

- **错误处理**: 任何适配器选择/执行失败都必须“可解释、可恢复”。
- **降级策略**: 优先保持现有 Claude Code 默认路径可用。

### 可观测性要求

- **日志记录**: 结构化日志必须至少包含：适配器标识、选择原因、耗时、结果状态、错误摘要。
- **监控指标**: [NEEDS CLARIFICATION: 是否需要将探测耗时/失败率沉淀为可聚合指标？]
- **告警设置**: [NEEDS CLARIFICATION: 是否需要对“无命中/多命中”频繁出现设置告警阈值？]

---

## 成功指标

### 主要指标（Measurable Outcomes）

| 指标 | 基线 | 目标 | 时间线 | 测量方法 |
|------|------|------|--------|----------|
| SC-001 Claude Code 兼容性 | 当前可运行 | 关键命令行为保持一致 | PRD 完成后到 Epic 验收 | 回归用例/对比执行日志 |
| SC-002 双平台可运行 | 仅 Claude Code | Claude + Codex 两平台可运行 | 本需求交付时 | 在两环境完成一次最小闭环执行 |
| SC-003 安全默认值 | 未统一 | 默认 deny 危险能力且可审计 | 本需求交付时 | 负向用例（能力不足/未启用）通过 |
| SC-004 可观测性 | 分散 | 统一结构化日志字段可检索 | 本需求交付时 | 日志样例检查 + 失败定位演练 |

---

## Constitution Check (宪法符合性检查)

*GATE: 必须在 Epic 规划前通过*

### Article I: Quality First (质量至上)
- [x] **I.1 - NO PARTIAL IMPLEMENTATION**: 本 PRD 不包含 TODO/占位符；范围与 DoD 可验证
- [x] **I.3 - No Simplification**: 不使用“先随便做、后续完善”作为验收替代
- [x] 用户故事遵循 INVEST（Independent, Negotiable, Valuable, Estimable, Small, Testable）
- [x] 验收标准具体、可测试、可衡量

### Article X: Requirement Boundary (需求边界) - CRITICAL
- [x] **X.1 - Forced Clarification**: 所有不明确项以 `[NEEDS CLARIFICATION: ...]` 标记
- [x] **X.2 - No Speculative Features**: 不纳入“未来可能需要”的平台/能力作为本需求交付
- [x] **X.3 - User Story Independence**: 每个故事有明确优先级（P1/P2）
- [x] **X.3 - Independent Test**: 每个故事包含可独立验证方式

### Article II: Architectural Consistency (架构一致性)
- [x] **II.1 - NO CODE DUPLICATION**: 平台差异集中在适配层，避免在命令层复制分支
- [x] **II.3 - Anti-Over-Engineering**: 仅要求轻量日志与明确边界，不引入完整可观测套件
- [x] **II.4 - Single Responsibility**: 适配层负责平台差异；命令层只表达业务流程

### Article III: Security First (安全优先)
- [x] **III.1 - NO HARDCODED SECRETS**: 明确要求使用环境变量/现有机制
- [x] **III.2 - Input Validation**: 适配器选择输入必须校验
- [x] **III.3 - Least Privilege**: capability allow-list + 默认 deny
- [x] **III.4 - Secure by Default**: 危险能力启用需显式配置与审计线索

---

## 依赖关系

### 上游依赖

- 现有 cc-devflow 命令/Agent/脚本体系（作为兼容性基线）。
- @spec-kit 的多平台目录隔离思路（作为参考而非运行时依赖）。

### 下游依赖

- 多平台相关后续需求（例如命令模板引擎、更多平台适配）将依赖本适配层。

---

## 风险评估与缓解

### 技术风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 平台探测不稳定导致误选 | M | H | 提供显式覆盖入口；冲突告警；选择策略确定性 |
| 扩平台带来默认扩权 | M | H | capability allow-list；默认 deny；审计线索 |
| 适配层侵入命令层 | L | H | 强制边界：命令只表达流程，适配层承载差异 |

### 进度风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Codex CLI 适配范围不清导致返工 | M | M | 以“最小可运行闭环”为 DoD，并将更多能力拆分为后续需求 |

---

## 假设条件

- Claude Code 与 Codex CLI 环境都能够执行 cc-devflow 所需的最小操作（例如读取文件、执行必要命令）。
- 现有 `.claude/scripts/` 自动化脚本可以继续复用（无需为平台复制脚本）。

---

## 未决问题

- [ ] **Q1**: `[NEEDS CLARIFICATION: 是否要求 Claude Code 行为 100% 向后兼容（包括所有边角输出），还是允许有限 breaking change？]`
  - 负责人: cc-devflow Team
  - 截止日期: Epic 规划前

- [ ] **Q2**: `[NEEDS CLARIFICATION: ROADMAP.md 与 ARCHITECTURE.md 中 RM 编号存在不一致时，以哪个为准？]`
  - 负责人: cc-devflow Team
  - 截止日期: Epic 规划前

- [ ] **Q3**: `[NEEDS CLARIFICATION: 结构化日志的格式是否需要机器可解析的严格 schema（例如 JSON 行），还是仅要求字段一致？]`
  - 负责人: cc-devflow Team
  - 截止日期: Epic 规划前

---

## 发布计划

### 里程碑

- **Phase 1**: 交付 Adapter 抽象 + Registry + Claude/Codex 两适配器 + 最小安全/日志要求
- **Phase 2**: 扩展更多平台适配（Cursor/Antigravity/Qwen 等，拆分为后续需求）

### 回滚计划

- **回滚触发条件**: Claude Code 默认路径出现回归（核心命令不可用或行为不可接受）。
- **回滚步骤**: 临时强制选择默认适配器；禁用非默认适配器；恢复到上一个可用版本。

---

## 附录

### 研究材料

- `research/research.md`
- `research/research-summary.md`
- `research/internal/codebase-overview.md`
- `research/clarifications/20251217-140906-flow-clarify.md`

### 参考资料

- spec-kit: `spec-kit/src/specify_cli/__init__.py`（多 Agent 目录配置/运行时差异隔离的参考）

---

**Generated by**: prd-writer agent
**Based on**: CC-DevFlow Constitution v2.0.0
**Next Step**: Run `/flow-epic REQ-004`

