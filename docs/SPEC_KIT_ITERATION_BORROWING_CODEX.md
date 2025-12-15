# cc-devflow 借鉴 spec-kit 迭代差异报告（0.0.17 → 0.0.22）

> 目标：在已经存在的“静态对比”基础上，补齐 **spec-kit 近期迭代**带来的新增能力/设计变化，并评估 cc-devflow 是否值得借鉴、怎么借鉴。
>
> - 静态对比基线：`docs/SPEC_KIT_REFERENCE_ANALYSIS.md`
> - spec-kit 迭代事实来源：`spec-kit/CHANGELOG.md`
> - cc-devflow 借鉴点位参考：`.claude/scripts/*.sh`、`.claude/docs/templates/*.md`、`.claude/commands/*.md`

---

## 1. 事实基线（你现在仓库里“实际有什么”）

### 1.1 cc-devflow（当前仓库状态）

- 命令体系：项目级 `/core-*` + 需求级 `/flow-*`（见 `.claude/commands/`）。
- 子代理体系：`.claude/agents/` + hooks + scripts（流程强约束、可测试）。
- 已明确借鉴 spec-kit 的位置：
  - `create-requirement.sh` 注明 “Based on spec-kit's create-new-feature.sh design.”
  - `setup-epic.sh` 注明 “Based on spec-kit's setup-plan.sh design.”
  - Constitution/Phase -1 Gates：见 `.claude/constitution/` 与 `.claude/docs/templates/`。
- 已吸收的 spec-kit 新趋势之一：`TASKS_TEMPLATE.md` 明确按 **User Story** 组织，并标注“Tests optional”（见 `.claude/docs/templates/TASKS_TEMPLATE.md`）。

### 1.2 spec-kit（仓库内 vendored 版本）

- 上游项目：GitHub `github/spec-kit`（仓库中 `spec-kit/` 为其内容快照）。
- 形态：`specify-cli` + templates + 多 agent 初始化适配。
- 命令前缀：`/speckit.*`（可发现性与命令分类）。

---

## 2. spec-kit 0.0.17~0.0.22：关键迭代与差异矩阵

下表只列“会改变使用体验 / 会改变架构约束 / 会降低维护成本”的迭代点。

| spec-kit 版本 | 迭代点（事实） | 意图/收益（本质） | cc-devflow 现状 | 借鉴建议 |
|---|---|---|---|---|
| 0.0.17 | 新增 `/clarify`（最多 5 个高影响澄清问题，回写 Clarifications） | 把“歧义”前置消除，减少后续返工 | **缺失**同等能力（只有 `/flow-ideate` 的意图驱动，但不等价于结构化澄清） | **P0：值得引入**成 `/flow-clarify`，放在 `/flow-prd` 之前 |
| 0.0.17 | 新增 `/analyze`（跨工件一致性报告：spec/clarify/plan/tasks/constitution） | 用“非破坏性报告”做对齐，不把修复掺进实现阶段 | cc-devflow 有 `/flow-verify` + consistency-checker（更重、更全） | **P1：借鉴输出形态/严重级别**，不必照搬实现 |
| 0.0.18 | 使用 `/speckit.` 前缀统一命令文件 | IDE/命令面板可发现性、命名空间隔离 | cc-devflow 已区分 `/core-*` 与 `/flow-*` | **P2：可选**，如果要扩展多 agent，可引入 `/devflow.*` 别名 |
| 0.0.18 | “Tasks per user story” | 降低任务与验证的耦合复杂度，便于独立验收 | cc-devflow **已落地**（`TASKS_TEMPLATE.md` 已按 User Story 分 phase） | **已借鉴**（保持即可） |
| 0.0.18 | “No more polluting things with tests when not needed” | 避免“为了流程而写测试”，维持信噪比 | cc-devflow 强 TDD，但模板已写明 Tests 可选 | **P1：对齐策略**：把“何时必须测试”写成可判定规则（而不是口号） |
| 0.0.20 | 智能分支命名：`--short-name`、停用词过滤、244-byte 限制 | 让分支名语义更稳定，避免长描述导致 GitHub 限制问题 | `create-requirement.sh` 只做简单 slugify，无长度/短名策略 | **P1：强烈建议借鉴**，直接升级 `create-requirement.sh` 的命名算法 |
| 0.0.21~0.0.22 | 远离 prompts，转向“proper agents + hand-offs”，并强化 VS Code/Copilot hand-offs | 多 agent 协作更可控，提示词不再散落为“不可测试文本” | cc-devflow 已有子代理，但 hand-off 机制更多是“命令流程”而非 IDE 原生 hand-off | **P2：评估后再做**：除非你要支持 VS Code/Copilot，否则收益不一定大 |
| 0.0.22 | Copilot 工作流改用 `AGENTS.md`（开箱即用） | 降低适配成本，统一入口文档 | cc-devflow 已有根 `AGENTS.md` 且 `update-agent-context.sh` 使用它 | **已部分对齐**（可补充：按目录分 scope 的 AGENTS.md 约定） |
| 0.0.8 / 0.0.22 | GitHub API 限流回退与错误渲染 | 让 CLI/初始化流程在限流时“可诊断、可恢复” | cc-devflow 在 `release-manager`/脚本里使用 `gh api`，但缺少系统化限流处理策略 | **P1：可借鉴**成统一的 `gh api` 包装函数 + 指南 |
| 0.0.13 | Agent folder 安全提示：凭证/Token 落地风险 + 建议 `.gitignore` | 把“泄露”风险显性化 | cc-devflow 有 hooks/security，但缺少“初始化后提示与 gitignore 建议” | **P2：低成本高收益**：文档 + hook 提示即可 |

---

## 3. 结论：哪些算“重大优化”，cc-devflow 值不值得跟

### 3.1 重大且可直接借鉴（建议 P0/P1）

1) **结构化澄清（/clarify）是 spec-kit 近期最关键的流程增强**

- 这是“在写 PRD 之前先消除歧义”的硬手段，而不是鼓励式口号。
- cc-devflow 的缺口不在“能不能写 PRD”，而在“PRD 的输入是否足够清晰”。

落地方向：

- 新增 `/flow-clarify "REQ-123"`：读取 `devflow/requirements/REQ-123/research/` 与初始需求描述，产出 `CLARIFICATIONS.md`（或并入 PRD 前置章节）。
- 强约束：最多 5 个问题、每个问题必须解释“为什么这会导致返工”。
- 与现有流程的最小侵入式集成：`/flow-init` 之后建议执行，`/flow-prd` 必须读取澄清结果。

2) **分支命名算法（0.0.20）是“低风险高收益”的工程级优化**

- 你当前的 `create-requirement.sh` 已经是 spec-kit 系谱，但缺少其最新的“短名/限长/停用词”能力。
- 这类改动不动核心架构，却能显著减少日常摩擦（尤其是长中文标题、混合字符时）。

落地方向：

- 对齐 spec-kit：增加 `--short-name` 可选参数；未提供时用停用词过滤生成 3~4 个关键词；统一做 244-byte 限长并给出 warning。

3) **GitHub API 限流处理**（0.0.22）建议补齐

- cc-devflow 已“深入使用 GitHub”（release-manager、脚本），但缺少统一的限流诊断路径。

落地方向：

- 在 `.claude/scripts/common.sh` 增加 `gh_api_safe()`：捕获 rate limit 相关错误，输出可操作提示（等待多久、建议设置 token、如何重试）。

### 3.2 重大但不一定该跟（建议 P2）

1) **prompt → proper agents + hand-offs**

- spec-kit 的动机是“适配多 IDE/多 agent”，因此必须把 prompt 体系工程化。
- cc-devflow 目前是 Claude Code 专用，已有子代理与 hooks，收益不一定覆盖迁移成本。

建议：

- 如果你计划支持 VS Code/Copilot/Cursor 等生态，再把 hand-offs 作为架构目标；否则先维持“命令流程 + 子代理”的优势即可。

---

## 4. 可执行的借鉴路线图（最小改动、最大收益）

### Phase A（P0）：质量前置，减少返工

- 新增 `/flow-clarify`（对齐 spec-kit 0.0.17 clarify 的结构与“最多 5 问”约束）。
- 新增 `/flow-checklist`（对齐 spec-kit checklist 的“Unit tests for English”理念，作为 PRD 出口门或 QA 入口门）。

### Phase B（P1）：工程体验优化

- 升级 `create-requirement.sh` 分支命名（短名、停用词、限长）。
- 统一 GitHub API 调用的限流回退与可诊断输出。

### Phase C（P2）：生态扩展准备

- 评估引入 `/devflow.*` 命令别名或命名空间（借鉴 `/speckit.*` 的可发现性）。
- 增加“agent 文件夹可能含凭证”的安全提示 + `.gitignore` 建议。

---

## 5. 品味自检（避免把借鉴变成分支爆炸）

- 借鉴的目标不是“功能更多”，而是让“歧义消失、分支消失、例外消失”。
- 任何新增命令都必须回答：它消除了哪个反复出现的返工循环？能不能并入现有命令而不是多一个入口？

