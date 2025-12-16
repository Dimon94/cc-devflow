# Research Summary: REQ-002 - /flow-checklist 需求质量检查命令

**Generated**: 2025-12-15T21:53:00+08:00
**MCP Research Date**: 20251215
**Status**: Complete

---

## Research Summary

本需求旨在实现 `/flow-checklist` 命令，核心理念是 **"Unit Tests for English"** - 对需求文档进行质量测试，而非对实现代码进行测试。通过在 PRD 生成后、任务分解前设置质量门禁，显著减少下游返工。

### 关键洞察

1. **Shift-Left 测试哲学**: 测试左移到需求阶段，比代码阶段修复缺陷成本低 10-100 倍
2. **需求质量维度**: 完整性、清晰性、一致性、可测量性、覆盖率
3. **入口门集成**: 与 `/flow-epic` 绑定，阈值 80%，阻断不达标需求

---

## Decisions

### R001 — Checklist 类型设计

- **Decision**: 支持 6 种 Checklist 类型 (ux, api, security, performance, data, general)
- **Rationale**: 不同需求特性需要不同质量检查维度，细分类型提供针对性检查
- **Alternatives considered**:
  - A) 单一通用 Checklist → 缺乏针对性
  - B) 11 维度全量检查 → 过于繁琐，与 flow-clarify 重复
  - **C) 6 类型系统 ✅** → 平衡全面性与易用性

### R002 — 质量门禁阈值

- **Decision**: 最低通过分数 80%，可配置
- **Rationale**:
  - 80% 是行业标准质量阈值
  - 允许一定灵活性（非 100% 强制）
  - 支持 `--skip-gate` 紧急跳过
- **Alternatives considered**:
  - A) 100% 强制 → 过于严格，阻塞开发
  - B) 无阈值，仅建议 → 失去门禁价值
  - **C) 80% 可配置 ✅** → 平衡质量与效率

### R003 — Anti-Example 强制逻辑

- **Decision**: 在 checklist-agent 中嵌入强制 Anti-Example 指导
- **Rationale**:
  - 核心区分：测试需求质量 vs 测试实现
  - 防止生成实现级测试用例
- **Alternatives considered**:
  - A) 不做限制，依赖 Agent 理解 → 质量不可控
  - **B) 强制 Anti-Example ✅** → 明确边界，输出一致

### R004 — YAML 配置格式

- **Decision**: 使用 YAML 存储质量规则配置 (`config/quality-rules.yml`)
- **Rationale**:
  - YAML 人类可读，易于维护
  - 项目已有 YAML 配置模式 (clarify-dimensions.yaml)
  - 支持复杂嵌套结构（维度、权重、示例）
- **Alternatives considered**:
  - A) JSON 配置 → 不支持注释，可读性差
  - B) 硬编码在 Agent 中 → 难以定制
  - **C) YAML 配置 ✅** → 灵活、可维护、一致

### R005 — 入口门集成位置

- **Decision**: 在 `/flow-epic` 入口门检查 Checklist 完成度
- **Rationale**:
  - Epic/Tasks 分解是关键节点
  - 确保质量问题在任务拆分前解决
  - 与 SPEC_KIT_FINAL_SOLUTION 设计一致
- **Alternatives considered**:
  - A) 在 /flow-prd 后立即检查 → 过早，PRD 可能需要迭代
  - B) 在 /flow-dev 前检查 → 过晚，任务已分解
  - **C) 在 /flow-epic 入口 ✅** → 最佳时机点

---

## Source Library

### 内部来源

| 来源 | 路径 | 用途 |
|------|------|------|
| flow-clarify 实现 | `.claude/commands/flow-clarify.md` | 命令模式参考 |
| clarify-analyst Agent | `.claude/agents/clarify-analyst.md` | Agent 结构参考 |
| run-clarify-scan.sh | `.claude/scripts/run-clarify-scan.sh` | 脚本模式参考 |
| SPEC_KIT_FINAL_SOLUTION | `docs/SPEC_KIT_FINAL_SOLUTION.md` | 详细设计规格 |
| SPEC_KIT_UPGRADE_TASKS | `docs/SPEC_KIT_UPGRADE_TASKS.md` | 任务分解参考 |

### 外部来源

| 来源 | URL | 关键洞察 |
|------|-----|----------|
| BMC Shift-Left Testing | [链接](https://www.bmc.com/blogs/what-is-shift-left-shift-left-testing-explained/) | 测试左移理论基础 |
| CMU SEI - Four Types of Shift Left | [链接](https://www.sei.cmu.edu/blog/four-types-of-shift-left-testing/) | 四种左移策略 |
| BrowserStack Shift-Left Guide | [链接](https://www.browserstack.com/guide/what-is-shift-left-testing) | 实施最佳实践 |
| Microsoft Unit Testing Best Practices | [链接](https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-best-practices) | AAA 模式参考 |
| GeeksforGeeks Unit Testing 2025 | [链接](https://www.geeksforgeeks.org/unit-testing-best-practices/) | 现代测试趋势 |
| YAML Library (eemeli/yaml) | Context7 | YAML 解析配置参考 |

---

## Technical Recommendations

### 1. checklist-agent 设计
- 文件大小控制在 250 行以内
- 包含强制 Anti-Example 章节
- 支持 6 种 Checklist 类型
- 实现 5 个质量维度标签

### 2. checklist-gate Hook 设计
- PreToolUse 事件绑定 `/flow-epic`
- 检查 checklists/ 目录非空
- 验证至少一个 Checklist ≥ 80%
- 提供 `--skip-gate` 紧急跳过

### 3. quality-rules.yml 配置
- 5 个质量维度定义
- 每维度包含示例问题
- 权重配置支持
- 阈值可配置

---

## Pending

无待解决事项。所有研究问题已在内部文档和外部调研中找到答案。

---

**调研完成时间**: 2025-12-15T21:53:00+08:00
**下一步**: 进入 /flow-prd 生成 PRD 文档
