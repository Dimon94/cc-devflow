# Research: REQ-002 - /flow-checklist 需求质量检查命令

**Version**: 1.0.0
**Created**: 2025-12-15T21:53:00+08:00
**Last Updated**: 2025-12-15T21:53:00+08:00

---

## Research Summary

REQ-002 实现 `/flow-checklist` 命令，核心理念是 **"Unit Tests for English"** - 对需求文档进行质量测试。通过在 PRD 生成后、任务分解前设置质量门禁（80% 阈值），阻断不达标需求，显著减少下游返工。

### 关键发现
1. 内部已有 flow-clarify 完整实现可作为模式参考
2. SPEC_KIT_FINAL_SOLUTION.md 包含详细设计规格
3. Shift-Left 测试理念是行业最佳实践
4. 5 个质量维度 + 6 种 Checklist 类型是最佳平衡点

---

## Decisions

### R001 — Checklist 类型设计

- Decision: 支持 6 种 Checklist 类型 (ux, api, security, performance, data, general)
- Rationale: 不同需求特性需要不同质量检查维度，细分类型提供针对性检查，同时保持易用性
- Alternatives considered: 单一通用 Checklist（缺乏针对性）; 11 维度全量检查（与 flow-clarify 重复）

### R002 — 质量门禁阈值

- Decision: 最低通过分数 80%，可通过 quality-rules.yml 配置
- Rationale: 80% 是行业标准质量阈值，允许一定灵活性，支持 --skip-gate 紧急跳过
- Alternatives considered: 100% 强制（过于严格）; 无阈值仅建议（失去门禁价值）

### R003 — Anti-Example 强制逻辑

- Decision: 在 checklist-agent 中嵌入强制 Anti-Example 指导，区分"测试需求质量"与"测试实现"
- Rationale: 核心创新点，防止生成实现级测试用例，确保 Checklist 检查需求完整性而非代码行为
- Alternatives considered: 不做限制依赖 Agent 理解（质量不可控）

### R004 — YAML 配置格式

- Decision: 使用 YAML 存储质量规则配置 (config/quality-rules.yml)
- Rationale: YAML 人类可读，项目已有 YAML 配置模式，支持复杂嵌套结构
- Alternatives considered: JSON 配置（不支持注释）; 硬编码在 Agent 中（难以定制）

### R005 — 入口门集成位置

- Decision: 在 /flow-epic 入口门检查 Checklist 完成度
- Rationale: Epic/Tasks 分解是关键节点，确保质量问题在任务拆分前解决
- Alternatives considered: 在 /flow-prd 后立即检查（过早）; 在 /flow-dev 前检查（过晚）

---

## Source Library

### Internal Sources
| 来源 | 用途 |
|------|------|
| `.claude/commands/flow-clarify.md` | 命令模式参考 |
| `.claude/agents/clarify-analyst.md` | Agent 结构参考 |
| `docs/SPEC_KIT_FINAL_SOLUTION.md` | 详细设计规格 |
| `docs/SPEC_KIT_UPGRADE_TASKS.md` | 任务分解参考 |
| `spec-kit/templates/commands/checklist.md` | **完整参考实现** (Unit Tests for English) |
| `spec-kit/templates/checklist-template.md` | Checklist 模板结构 |
| `spec-kit/spec-driven.md` | Specification-Driven Development 理念 |

### External Sources
| 来源 | URL | 洞察 |
|------|-----|------|
| BMC Shift-Left | https://www.bmc.com/blogs/what-is-shift-left-shift-left-testing-explained/ | 测试左移理论 |
| CMU SEI | https://www.sei.cmu.edu/blog/four-types-of-shift-left-testing/ | 四种左移策略 |
| Microsoft | https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-best-practices | AAA 模式 |
| Context7 YAML | /eemeli/yaml | YAML 解析配置 |

---

## Technical Approach

### 新增文件
1. `.claude/commands/flow-checklist.md` - 命令定义
2. `.claude/agents/checklist-agent.md` - Agent 指令 (≤250 lines)
3. `.claude/hooks/checklist-gate.js` - Epic 入口门 Hook
4. `.claude/docs/templates/CHECKLIST_TEMPLATE.md` - Checklist 模板
5. `config/quality-rules.yml` - 质量规则配置

### 修改文件
1. `.claude/commands/flow-epic.md` - 添加入口门检查
2. `.claude/skills/cc-devflow-orchestrator/skill.md` - 更新工作流图
3. `devflow/requirements/*/orchestration_status.json` - 新增 checklist_complete 字段

### 质量维度
| Tag | Pattern | Example |
|-----|---------|---------|
| `[Completeness]` | 是否定义了 X？ | "是否定义了所有 API 端点的请求/响应格式？" |
| `[Clarity]` | X 是否有明确定义？ | "'快速响应' 是否有具体时间指标？" |
| `[Consistency]` | X 和 Y 是否一致？ | "API 和 UI 字段命名是否一致？" |
| `[Measurability]` | 如何验证 X？ | "如何验证'用户体验流畅'？" |
| `[Coverage]` | 是否覆盖 X 场景？ | "是否覆盖网络断开场景？" |

---

## Constitution Compliance

| Article | 要求 | 状态 |
|---------|------|------|
| I | 完整实现 | ✅ 5 维度全覆盖设计 |
| II | 架构一致 | ✅ 遵循现有模式 |
| V.4 | 文件大小 | ✅ agent ≤ 500 lines |
| VI | TDD | ✅ 测试任务先于实现 |
| X | 需求边界 | ✅ 仅实现方案定义功能 |
