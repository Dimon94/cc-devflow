# 代码库调研报告 (Internal Codebase Overview)

**Requirement**: REQ-001 - /flow-clarify 需求澄清命令
**Date**: 2025-12-15
**Analyst**: Claude

---

## 1. 项目概况 (Project Summary)

**Project**: CC-DevFlow v2.x
**Type**: Plugin-based CLI Framework (Claude Code Extension)
**Tech Stack**:
- **Command System**: Claude Code Slash Commands (Markdown-based)
- **Agent System**: Claude Code Sub-Agents (Research Agent Pattern)
- **Script Runtime**: Bash (macOS/Linux), PowerShell (Windows)
- **Integration**: Claude API, GitHub CLI (gh), MCP Servers

**Statistics**:
- 23 Slash Commands (.claude/commands/)
- 16 Specialized Agents (.claude/agents/)
- 29 Utility Scripts (.claude/scripts/)
- 6 Skill Packages (.claude/skills/)
- ~3,242 lines of command definitions

---

## 2. 现有命令架构 (Existing Command Architecture)

### 2.1 命令层级结构
```
Core-Level Commands (项目级，执行一次):
  /core-roadmap       → ROADMAP.md 生成
  /core-architecture  → ARCHITECTURE.md 生成
  /core-guidelines    → 项目规范生成
  /core-style         → 设计风格指南

Flow-Level Commands (需求级，每需求一次):
  /flow-init         → 需求初始化 (当前正在执行)
  /flow-prd          → PRD 生成
  /flow-tech         → 技术设计
  /flow-ui           → UI 原型
  /flow-epic         → EPIC 规划
  /flow-dev          → TDD 开发
  /flow-qa           → 质量保障
  /flow-release      → 发布管理
  /flow-verify       → 一致性校验
```

### 2.2 与 /flow-clarify 最相关的现有命令

#### /flow-init (当前命令)
- **职责**: 初始化需求目录结构 + 研究调研
- **输出**: README.md, research/, orchestration_status.json
- **阶段**: Phase 0 (Initialization)
- **位置**: [.claude/commands/flow-init.md](.claude/commands/flow-init.md)

#### /flow-prd
- **职责**: 生成 PRD.md (Product Requirements Document)
- **依赖**: research.md 必须完成 (phase0_complete == true)
- **阶段**: Phase 1 (PRD Generation)
- **Agent**: prd-writer.md
- **位置**: [.claude/commands/flow-prd.md](.claude/commands/flow-prd.md)

#### /flow-verify
- **职责**: 一致性校验 (文档与代码)
- **阶段**: 任意阶段可调用
- **Agent**: consistency-checker.md
- **位置**: [.claude/commands/flow-verify.md](.claude/commands/flow-verify.md)

---

## 3. Spec-Kit 参考模板 (Reference Template)

**发现**: 项目中包含 `spec-kit/` 子目录，其中已有 `/speckit.clarify` 命令模板

### 3.1 核心特性分析

**文件位置**: [spec-kit/templates/commands/clarify.md](../../../spec-kit/templates/commands/clarify.md)

**关键能力**:
1. **结构化歧义扫描** (10 大类别分类法):
   - Functional Scope & Behavior
   - Domain & Data Model
   - Interaction & UX Flow
   - Non-Functional Quality Attributes
   - Integration & External Dependencies
   - Edge Cases & Failure Handling
   - Constraints & Tradeoffs
   - Terminology & Consistency
   - Completion Signals
   - Misc / Placeholders

2. **交互式澄清流程**:
   - 顺序提问 (一次一个问题)
   - 智能推荐选项 (基于最佳实践)
   - 多选题格式 (2-5 选项) 或短答题 (≤5 词)
   - 增量式集成 (每答一题立即写入 spec)

3. **质量门禁**:
   - 最多 5 个问题 (配额控制)
   - 覆盖率优先 (高影响 × 不确定性)
   - 验证无矛盾、无占位符
   - 生成覆盖度报告

4. **集成方式**:
   - 在 spec 文件中插入 `## Clarifications` 章节
   - 按会话时间分组 (`### Session YYYY-MM-DD`)
   - Q&A 格式记录: `- Q: <question> → A: <answer>`
   - 同步更新相关章节 (如 Functional Requirements, Data Model)

### 3.2 与 CC-DevFlow 的适配差异

| 特性 | Spec-Kit | CC-DevFlow | 适配需要 |
|------|----------|------------|----------|
| 输入源 | FEATURE_SPEC (单文件) | research.md + tasks.json + 用户输入 | ✅ 需适配多源输入 |
| 执行时机 | BEFORE /speckit.plan | AFTER /flow-init, BEFORE /flow-prd | ✅ 需调整时序 |
| 输出格式 | 更新 FEATURE_SPEC (原地修改) | 生成 clarifications/[timestamp].md | ✅ 需独立文件 |
| 分类法 | 10 类 (spec-kit) | 11 维度 (roadmap 要求) | ✅ 需扩展分类 |
| 集成点 | 直接修改 spec 文件 | 写入 research/clarifications/ | ✅ 需新目录 |
| 报告格式 | 覆盖度表 + 建议 | Markdown 结构化报告 | ✅ 需定制模板 |

---

## 4. 关键模块与可复用组件 (Reusable Components)

### 4.1 脚本基础设施
**位置**: `.claude/scripts/`

**可复用脚本**:
- `check-prerequisites.sh` (前置条件检查)
- `common.sh` (共享函数库)
- `generate-research-tasks.sh` (研究任务生成)
- `populate-research-tasks.sh` (任务填充)
- `consolidate-research.sh` (研究整合)

**新增脚本需求**:
- `run-clarify-scan.sh` (执行 11 维度扫描)
- `generate-clarification-report.sh` (生成报告)
- `integrate-clarifications.sh` (与 research.md 集成)

### 4.2 Agent 架构模式
**参考**: `.claude/agents/prd-writer.md`

**关键模式**:
1. **Research Agent Pattern** (只读分析，不修改文件)
2. **Phase Gate Validation** (Entry Gate + Exit Gate)
3. **Constitution Compliance** (强制规范检查)
4. **Markdown Output** (结构化文档生成)

**建议新增 Agent**:
- `clarify-analyst.md` (专门负责歧义扫描与澄清对话)
  - 职责: 执行 11 维度扫描，生成澄清问题，记录答案
  - 模式: Research Agent (read-only)
  - 输入: research.md, tasks.json, 用户回答
  - 输出: clarifications/[timestamp]-[feature].md

### 4.3 技能系统
**位置**: `.claude/skills/`

**现有技能**:
- `cc-devflow-orchestrator` (工作流路由)
- `devflow-tdd-enforcer` (TDD 顺序守卫)
- `constitution-guardian` (宪法合规守卫)

**可能需要新增技能**:
- `clarify-validator` (澄清报告验证)
  - Trigger: 当生成 clarification 报告时
  - 校验: 11 维度全覆盖、无占位符、无矛盾

---

## 5. 测试与质量保障 (Testing & Quality)

### 5.1 现有测试框架
**位置**: 未发现统一测试框架

**测试方式**:
- 手动测试 (通过执行命令验证)
- Constitution 验证 (通过 constitution-guardian skill)
- Phase Gate 校验 (通过脚本 validate-*.sh)

### 5.2 /flow-clarify 测试需求
1. **单元测试** (脚本级):
   - 测试 11 维度扫描算法
   - 测试问题生成逻辑
   - 测试答案集成逻辑

2. **集成测试** (命令级):
   - 测试完整澄清流程
   - 测试与 /flow-prd 的衔接
   - 测试多轮对话场景

3. **验收测试** (用户级):
   - < 5 min 平均澄清时间
   - > 80% 用户满意度 (Pilot 阶段)
   - 无 high-severity 歧义遗漏

---

## 6. 目标目录结构 (Target Directory Structure)

基于现有架构，`/flow-clarify` 应遵循以下结构:

```
.claude/
├── commands/
│   └── flow-clarify.md           ← 新增命令定义
├── agents/
│   └── clarify-analyst.md        ← 新增澄清分析 Agent
├── scripts/
│   ├── run-clarify-scan.sh       ← 新增扫描脚本
│   ├── generate-clarification-report.sh
│   └── integrate-clarifications.sh
└── skills/
    └── clarify-validator/         ← 可选，验证技能

devflow/requirements/REQ-XXX/
└── research/
    ├── clarifications/            ← 新增澄清目录
    │   └── [timestamp]-[feature].md
    └── research.md                ← 集成澄清结论
```

---

## 7. 依赖关系 (Dependencies)

### 7.1 上游依赖 (Prerequisites)
- `/flow-init` 必须完成 (research/ 目录已初始化)
- `research.md` 存在且无 TODO placeholder
- `orchestration_status.json` → phase0_complete == true

### 7.2 下游依赖 (Dependents)
- `/flow-prd` 需读取澄清结论
- `/flow-epic` 需参考澄清的验收标准
- `/flow-dev` 需遵循澄清的技术约束

### 7.3 并行命令 (Parallel Compatibility)
- 可与 `/flow-verify` 并行 (独立校验)
- 不可与 `/flow-prd` 并行 (顺序依赖)

---

## 8. 关键洞察与建议 (Key Insights & Recommendations)

### 8.1 架构决策
1. **复用 spec-kit 的分类法**:
   - 10 大类别 → 扩展为 11 维度 (需确认差异)
   - 保留交互式提问逻辑
   - 调整输出格式 (独立文件 vs 原地修改)

2. **适配 CC-DevFlow 的工作流**:
   - 在 /flow-init 和 /flow-prd 之间插入
   - 读取 research.md 作为初始输入
   - 输出写入 research/clarifications/
   - 与 orchestration_status.json 集成

3. **Agent vs Script**:
   - 核心扫描逻辑 → Agent (clarify-analyst.md)
   - 文件操作与集成 → Script (bash)
   - 提问与对话 → 命令主流程 (flow-clarify.md)

### 8.2 实现优先级
**P0 (MVP 必需)**:
- [ ] 11 维度歧义检测算法 (基于 spec-kit)
- [ ] 交互式澄清对话流程 (顺序提问 + 推荐选项)
- [ ] 结构化报告生成 (Markdown 格式)

**P1 (增强功能)**:
- [ ] 与 /flow-prd 自动集成 (传递澄清结论)
- [ ] 澄清历史记录查询 (ls research/clarifications/)
- [ ] 覆盖度可视化 (饼图或进度条)

**P2 (未来优化)**:
- [ ] 机器学习增强 (学习用户偏好)
- [ ] 多轮澄清支持 (分阶段执行)
- [ ] 自动回归验证 (检测新歧义)

### 8.3 风险与挑战
1. **歧义识别准确性**:
   - 风险: LLM 可能漏检或误报
   - 缓解: 规则引擎 + LLM 混合模式

2. **用户疲劳**:
   - 风险: 问题过多导致放弃
   - 缓解: 严格 5 问题配额 + 智能优先级

3. **与现有流程兼容**:
   - 风险: 打断现有工作流
   - 缓解: 设计为可选命令 (非强制)

---

## 9. 下一步行动 (Next Actions)

### 9.1 立即行动 (当前 /flow-init 完成后)
1. ✅ 完成 MCP 外部调研 (Tasks 1.1-1.5)
2. ✅ 生成 research-summary.md
3. ✅ 运行 5-level exit gate validation
4. → 进入 /flow-prd 阶段 (生成完整 PRD)

### 9.2 开发阶段 (PRD 完成后)
1. 创建 `.claude/commands/flow-clarify.md` (参考 spec-kit)
2. 创建 `.claude/agents/clarify-analyst.md` (Research Agent)
3. 创建支持脚本 (scan, report, integrate)
4. 编写单元测试与集成测试
5. 更新 orchestrator skill (路由规则)

### 9.3 验证阶段 (开发完成后)
1. Pilot 测试 (内部团队 5-10 人)
2. 收集反馈 (满意度 + 时间指标)
3. 迭代优化 (调整问题优先级算法)
4. 正式发布 (M1 Milestone)

---

**调研完成时间**: 2025-12-15 13:45:00
**下一步**: 执行 MCP 外部调研 (官方文档 + 教程 + 案例)
