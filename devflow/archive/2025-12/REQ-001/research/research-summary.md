# Research Summary: REQ-001 - /flow-clarify 需求澄清命令

**Requirement ID**: REQ-001
**Feature**: /flow-clarify 需求澄清命令
**Research Date**: 2025-12-15
**Analyst**: Claude
**Status**: ✅ Phase 0 Research Complete

---

## Executive Summary

/flow-clarify 是 CC-DevFlow v2.x 的核心命令，基于 spec-kit 的"质量左移"理念，在 PRD 生成前通过 11 维度歧义扫描消除需求模糊性。研究表明：最佳实践是采用**工作流模式（Workflow）而非纯 Agent 模式**，使用 **Orchestrator-Workers 架构**，结合 **Parallelization（11 维并行扫描）** + **Human-in-the-Loop（顺序交互）** + **Prompt Chaining（增量集成）** 实现高质量澄清。

---

## 1. 内部代码库调研结论 (Internal Codebase)

### 1.1 现有架构洞察
- **命令系统**: 23 个 Slash Commands，采用 Markdown 定义
- **Agent 系统**: 16 个专业 Agent，遵循 Research Agent Pattern (只读分析)
- **脚本基础设施**: 29 个 Bash 脚本，已有 `common.sh` 共享函数库
- **质量门禁**: Constitution Guardian + TDD Enforcer 实时拦截违规

### 1.2 Spec-Kit 模板分析
**发现**: 项目中已有 `spec-kit/templates/commands/clarify.md` 模板

**核心能力**:
1. **10 大类别分类法** (需扩展为 11 维度)
2. **交互式澄清流程** (顺序提问，一次一个)
3. **智能推荐选项** (基于最佳实践)
4. **增量式集成** (每答一题立即写入)
5. **质量门禁** (最多 5 问题，覆盖率优先)

**适配差异**:
| 特性 | Spec-Kit | CC-DevFlow | 适配方案 |
|------|----------|------------|----------|
| 输入源 | FEATURE_SPEC (单文件) | research.md + tasks.json | 多源输入适配 |
| 执行时机 | BEFORE plan | AFTER /flow-init, BEFORE /flow-prd | 时序调整 |
| 输出格式 | 原地修改 spec | 独立文件 clarifications/ | 新目录结构 |
| 分类法 | 10 类 | 11 维度 | 扩展分类 |

---

## 2. 官方文档研究结论 (Claude Code + Agent SDK)

### 2.1 Claude Code 架构特性
**来源**: Context7 - /anthropics/claude-code

**关键发现**:
1. **Multi-Agent Orchestration**: 主 Agent 委派给专业子 Agent
2. **Quality Gates**: 置信度评分（0-100），阈值过滤（≥80）
3. **CLAUDE.md Integration**: 项目特定规范集成
4. **Verification System**: 自动化设置验证（agent-sdk-verifier）
5. **Phase-Based Workflows**: 结构化任务分解（如 `/feature-dev` 7 阶段）

**可复用模式**:
- `/code-review`: 4 个 Agent 并行审查 → 置信度过滤 → 高置信输出
- `/new-sdk-app`: 交互式引导 → 自动设置 → 验证器确认

### 2.2 Claude Agent SDK 核心能力
**来源**: Context7 - /anthropics/claude-agent-sdk-typescript

**工具管理**:
```typescript
// 严格白名单 (Scan 阶段: 只读)
tools: ["Read", "Grep", "Glob"]

// 黑名单 (禁用写入)
disallowedTools: ["Write", "Edit", "Bash"]
```

**权限模式**:
- `"default"`: 标准权限检查 (推荐用于生产)
- `"acceptEdits"`: 自动批准文件编辑
- `"bypassPermissions"`: 跳过所有检查 (危险)
- **自定义回调**: `canUseTool(toolName, input) → {behavior: "allow"|"deny"|"ask"}`

**多 Agent 架构**:
```typescript
agents: {
  "security-reviewer": {
    description: "Expert in security auditing...",
    prompt: "You are a security expert...",
    tools: ["Read", "Grep", "Glob", "Bash"],
    model: "sonnet"
  },
  // ... 多个专业 Agent
}
```

**多轮对话**:
```typescript
async function* conversationFlow() {
  yield "First question...";
  yield "Follow-up question...";
}

const response = query({
  prompt: conversationFlow(),
  options: { model: "claude-sonnet-4-5" }
});
```

---

## 3. 学术研究结论 (Ambiguity Detection Best Practices)

### 3.1 LLM 性能指标 (2025 研究)
**来源**: [Requirements Ambiguity Detection and Explanation with LLMs: An Industrial Study](https://www.ipr.mdu.se/pdf_publications/7221.pdf)

**关键数据**:
- **模型大小影响**: Phi3-mini (3.8B) > Llama-3 (8B) > Qwen-2.5 (1.5B)
- **检测准确率**: GPT-3.5 / Llama 略高于随机猜测
- **改进策略**: Chain-of-thought 提升边际收益
- **层级分析**: 中间层表示 > 最终层 (用于歧义检测)
- **效率提升**: SRS 起草时间减少 60-70% (vs 新手工程师)

### 3.2 最佳实践 (9 大主题)
1. **Context**: 提供领域特定背景
2. **Persona**: 角色化提示 (如"你是安全专家")
3. **Templates**: 结构化输出格式
4. **Disambiguation**: 显式歧义解决
5. **Reasoning**: Chain-of-thought 推理
6. **Analysis**: 多步骤评估
7. **Keywords**: 领域术语强调
8. **Wording**: 精确语言使用
9. **Few-shot Prompting**: 基于示例学习

### 3.3 推荐技术
- **In-context Learning**: 适应特定领域 (提供 spec-kit 示例)
- **Chain-of-thought Templates**: 结构化推理 (扫描 → 分析 → 问题 → 验证)
- **Contextual Anchoring**: 基于项目上下文 (引用 ROADMAP, ARCHITECTURE)
- **Persona Conditioning**: 角色特定提示 (如"数据模型专家")
- **Iterative Feedback Cycles**: 检测 → 纠正 → 验证循环

---

## 4. 工作流模式研究 (Agentic Workflows)

### 4.1 Anthropic 官方指南
**来源**: [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents)

**核心架构区分**:
- **Workflows**: 预定代码路径编排，适合明确定义的任务
- **Agents**: LLM 动态决策，适合需求变化的任务

**5 大工作流模式**:
1. **Prompt Chaining**: 顺序步骤，每步处理前一步输出
2. **Routing**: 分类输入，路由到专业任务
3. **Parallelization**: 并行执行独立子任务
4. **Orchestrator-Workers**: 中央 LLM 协调专业工作器
5. **Evaluator-Optimizer**: 迭代优化，反馈循环

**关键指导**:
> "Success in the LLM space isn't about building the most sophisticated system. It's about building the right system for your needs."

**工具设计原则**:
- 充足 token 用于思考
- 自然文本格式 (避免 JSON、XML)
- 零格式开销 (无行号、转义)
- 示例 + 边界案例
- Poka-yoke (防错设计)

### 4.2 交互式澄清模式 (Synthesis)
**来源**: [AI-SDK Agents Workflows](https://ai-sdk.dev/docs/agents/workflows), [Weaviate Agentic Workflows](https://weaviate.io/blog/what-are-agentic-workflows)

**定义**: Routing + HITL + Iterative Refinement

**工作流**:
1. **Context Gathering**: 收集需求材料
2. **Ambiguity Detection**: 扫描缺失/不清元素
3. **Question Generation**: 创建高影响问题
4. **User Interaction**: 逐一展示问题
5. **Answer Recording**: 捕获并验证响应
6. **Integration**: 更新需求文档
7. **Validation**: 验证完整性和一致性

---

## 5. 技术决策与架构建议

### 5.1 架构模式选择

**决策**: 采用 **Workflow 模式 (非纯 Agent)**

**理由**:
1. 澄清流程步骤明确 (扫描 → 问题 → 答案 → 集成)
2. 预定代码路径提高可靠性
3. 质量门禁在每阶段确保质量
4. 符合 Anthropic "right system for your needs" 指导

**拒绝方案**: 纯 Agent 自由探索 (过于不可预测，难以质量控制)

---

### 5.2 工作流架构设计

**模式组合**: Orchestrator-Workers + Parallelization + HITL + Prompt Chaining

```
/flow-clarify (Command Entry Point)
   ↓
clarify-analyst (Main Orchestrator Agent)
   ↓
[Phase 1: Augmented LLM - Context Loading]
   ├─ Read research.md
   ├─ Read tasks.json
   └─ Grep for TODO/PLACEHOLDER markers
   ↓
[Phase 2: Parallelization - 11 Dimension Scanners]
   ├─ dim-scanner-01: Functional Scope (haiku, parallel)
   ├─ dim-scanner-02: Data Model (haiku, parallel)
   ├─ dim-scanner-03: UX Flow (haiku, parallel)
   ├─ dim-scanner-04: Non-Functional Quality (haiku, parallel)
   ├─ dim-scanner-05: Integration & Dependencies (haiku, parallel)
   ├─ dim-scanner-06: Edge Cases (haiku, parallel)
   ├─ dim-scanner-07: Constraints & Tradeoffs (haiku, parallel)
   ├─ dim-scanner-08: Terminology (haiku, parallel)
   ├─ dim-scanner-09: Completion Signals (haiku, parallel)
   ├─ dim-scanner-10: Misc / Placeholders (haiku, parallel)
   └─ dim-scanner-11: Security & Privacy (haiku, parallel)
   ↓
[Phase 3: Orchestrator - Question Generation]
   └─ Main agent (sonnet) synthesizes scan results
       - Prioritize by (Impact × Uncertainty)
       - Generate max 5 questions
       - Apply best practices (persona, few-shot, chain-of-thought)
   ↓
[Phase 4: Routing + HITL - Interactive Presentation]
   └─ Sequential question loop (one at a time)
       - Present with recommended answer (based on best practices)
       - Multiple choice (2-5 options) OR short answer (≤5 words)
       - User: accept recommendation / select option / custom answer
       - Validate answer before recording
   ↓
[Phase 5: Prompt Chaining - Incremental Integration]
   └─ After EACH answer:
       - Append to clarifications/[timestamp].md (Q&A bullet)
       - Update relevant section in research.md
       - Save immediately (prevent context loss)
   ↓
[Phase 6: Evaluator - Validation]
   └─ Validator agent checks:
       - No TODO/PLACEHOLDER markers
       - No contradictions with earlier statements
       - All 11 dimensions scanned
       - Exactly ≤5 questions asked
       - Markdown structure valid
```

---

### 5.3 模型与工具配置

**模型选择**:
- **Main Orchestrator**: `claude-sonnet-4-5` (关键决策，质量优先)
- **11 Dimension Scanners**: `claude-haiku` (并行执行，成本优化)
- **Question Generator**: `claude-sonnet-4-5` (质量关键)
- **Report Writer**: `claude-haiku` (格式化输出，无需复杂推理)
- **Validator**: `claude-haiku` (结构检查)

**工具访问控制**:
```typescript
// Phase 1-2: Context + Scanning (Read-only)
tools: ["Read", "Grep", "Glob"]
disallowedTools: ["Write", "Edit", "Bash"]

// Phase 5: Integration (Write-only)
tools: ["Write"]
disallowedTools: ["Read", "Grep", "Glob", "Edit", "Bash"]

// Phase 6: Validation (Read-only)
tools: ["Read", "Grep"]
```

**权限模式**:
- **Default permission mode** with custom `canUseTool` callback
- Deny all Bash commands during entire flow
- Ask for confirmation before writing clarification reports
- Allow Read/Grep/Glob without confirmation (sandboxed environment)

---

### 5.4 11 维度分类法 (扩展 spec-kit)

基于 spec-kit 的 10 大类别 + CC-DevFlow 需求，定义 11 维度：

1. **业务目标与范围 (Functional Scope)**
   - 核心用户目标与成功标准
   - 显式排除声明 (out-of-scope)
   - 用户角色/画像区分

2. **数据模型与领域 (Data Model)**
   - 实体、属性、关系
   - 身份与唯一性规则
   - 生命周期/状态转换
   - 数据量级/规模假设

3. **交互与 UX 流程 (UX Flow)**
   - 关键用户旅程/序列
   - 错误/空状态/加载状态
   - 无障碍/本地化注释

4. **非功能质量属性 (Non-Functional Quality)**
   - 性能 (延迟、吞吐量目标)
   - 可扩展性 (水平/垂直限制)
   - 可靠性与可用性 (正常运行时间、恢复预期)
   - 可观测性 (日志、指标、追踪)

5. **集成与外部依赖 (Integration & Dependencies)**
   - 外部服务/API 及故障模式
   - 数据导入/导出格式
   - 协议/版本假设

6. **边界案例与故障处理 (Edge Cases)**
   - 负面场景
   - 限流/节流
   - 冲突解决 (如并发编辑)

7. **约束与权衡 (Constraints & Tradeoffs)**
   - 技术约束 (语言、存储、托管)
   - 显式权衡或拒绝替代方案

8. **术语与一致性 (Terminology)**
   - 规范术语表
   - 避免同义词/弃用术语

9. **完成信号 (Completion Signals)**
   - 验收标准可测试性
   - 可衡量的完成定义 (DoD)

10. **杂项与占位符 (Misc / Placeholders)**
    - TODO 标记/未解决决策
    - 模糊形容词 ("robust", "intuitive") 缺乏量化

11. **安全与隐私 (Security & Privacy)** ← 新增，CC-DevFlow 特定
    - AuthN/AuthZ 机制
    - 数据保护要求
    - 威胁假设
    - 合规/监管约束

---

### 5.5 质量门禁 (Phase Gates)

**Entry Gate (flow-clarify 执行前)**:
- ✅ research.md 存在且无 TODO placeholder
- ✅ orchestration_status.json → phase0_complete == true
- ✅ /flow-init 已完成 (REQ 目录结构初始化)

**Intermediate Gates (执行过程中)**:
- ✅ Phase 2: 所有 11 维度扫描完成 (并行超时: 2 分钟)
- ✅ Phase 3: 生成的问题数量 ≤ 5 (硬性限制)
- ✅ Phase 3: 每个问题有推荐答案 (基于最佳实践)
- ✅ Phase 4: 用户回答验证通过 (选项匹配或 ≤5 词)
- ✅ Phase 5: 每答一题后立即写入 (防止上下文丢失)

**Exit Gate (flow-clarify 完成后)**:
- ✅ clarifications/[timestamp]-[feature].md 存在
- ✅ 包含所有已答问题 (Q&A 格式)
- ✅ research.md 已更新 (相关章节同步)
- ✅ 无 TODO/PLACEHOLDER 标记
- ✅ 无矛盾陈述
- ✅ Markdown 结构有效
- ✅ 术语一致性 (相同规范术语)
- ✅ orchestration_status.json → clarify_complete == true

---

### 5.6 文件结构设计

```
devflow/requirements/REQ-XXX/
└── research/
    ├── clarifications/               ← 新增目录
    │   └── [timestamp]-[feature].md  ← 澄清报告 (每次运行一个)
    ├── research.md                   ← 集成澄清结论 (原地更新)
    ├── tasks.json                    ← 研究任务跟踪
    └── mcp/                          ← MCP 调研材料 (本次 /flow-init 创建)
```

**clarifications/[timestamp]-[feature].md 格式**:
```markdown
# Clarification Report: REQ-XXX - Feature Name

**Date**: 2025-12-15 14:30:00
**Dimensions Scanned**: 11
**Questions Asked**: 3 / 5
**Time Taken**: 4 min 32 sec

---

## Clarification Session

### Q1: Data Model
**Question**: How should user identity be established? OAuth2, JWT, or session cookies?

**Recommended**: Option A (OAuth2) - Industry standard, better security, easier third-party integration

| Option | Description |
|--------|-------------|
| A | OAuth2 with PKCE flow |
| B | JWT with refresh tokens |
| C | Traditional session cookies |

**User Answer**: A (OAuth2)

**Rationale**: Aligns with enterprise requirements, supports SSO, widely adopted.

**Alternatives Considered**: JWT rejected due to token revocation complexity; session cookies lack scalability.

---

### Q2: Performance Target
**Question**: What is the acceptable API response latency for clarification scan?

**Suggested**: < 3 seconds (based on user expectation research)

Format: Short answer (≤5 words)

**User Answer**: 2 seconds (accepted suggestion with stricter target)

**Rationale**: Interactive CLI commands should feel instantaneous; 2s is upper bound for perceived responsiveness.

---

### Q3: Edge Case Handling
**Question**: How to handle incomplete research.md (missing dimensions)?

**Recommended**: Option B (Warn + Continue) - Balance between strictness and usability

| Option | Description |
|--------|-------------|
| A | Block execution (strict gate) |
| B | Warn user + Continue (permissive) |
| C | Auto-fill with placeholders (risky) |

**User Answer**: B (Warn + Continue)

**Rationale**: Phase 0 research may be intentionally minimal; allow flexibility but alert user.

---

## Coverage Summary

| Dimension | Status | Notes |
|-----------|--------|-------|
| 1. Functional Scope | Clear | Well-defined in roadmap |
| 2. Data Model | **Resolved** | OAuth2 selected (Q1) |
| 3. UX Flow | Clear | Sequential questioning confirmed |
| 4. Non-Functional Quality | **Resolved** | 2s latency target (Q2) |
| 5. Integration & Dependencies | Clear | spec-kit integration documented |
| 6. Edge Cases | **Resolved** | Warn + Continue (Q3) |
| 7. Constraints & Tradeoffs | Clear | Workflow > Agent decision documented |
| 8. Terminology | Clear | Consistent with CC-DevFlow conventions |
| 9. Completion Signals | Clear | 11-dimension scan + ≤5 questions |
| 10. Misc / Placeholders | Clear | None found |
| 11. Security & Privacy | Deferred | Not applicable for CLI command |

**Outstanding**: None (all high-impact dimensions resolved)

**Deferred**: Security dimension (low relevance for local CLI)

**Recommendation**: ✅ Proceed to /flow-prd

---

## Updated Sections in research.md

- `## Data Model`: Added OAuth2 decision
- `## Non-Functional Requirements`: Added 2s latency target
- `## Edge Case Handling`: Added incomplete research.md handling strategy

---

**Next Command**: `/flow-prd`
```

---

## 6. 实现优先级

### P0 (MVP - M1 Milestone, Q4-2025, 2 weeks)
- [ ] 11 维度歧义检测算法 (基于 spec-kit 扩展)
- [ ] 交互式澄清对话流程 (顺序提问 + 推荐选项)
- [ ] 结构化报告生成 (Markdown 格式)
- [ ] 与 /flow-prd 集成 (Entry Gate 验证)

### P1 (Enhancement - M2 Milestone, Q1-2026)
- [ ] 澄清历史记录查询 (`ls research/clarifications/`)
- [ ] 覆盖度可视化 (进度条或饼图)
- [ ] 多语言支持 (中英文问题/答案)

### P2 (Future - Post-M2)
- [ ] 机器学习增强 (学习用户偏好)
- [ ] 多轮澄清支持 (分阶段执行)
- [ ] 自动回归验证 (检测新歧义)

---

## 7. 风险与缓解策略

### 风险 1: 歧义识别准确性
- **风险**: LLM 可能漏检或误报
- **缓解**: 规则引擎 + LLM 混合模式 (规则先行，LLM 补充)
- **验证**: Pilot 测试，收集假阳性/假阴性率

### 风险 2: 用户疲劳
- **风险**: 问题过多导致放弃
- **缓解**: 严格 5 问题配额 + 智能优先级 (Impact × Uncertainty)
- **验证**: 用户满意度调查，目标 > 80%

### 风险 3: 与现有流程兼容
- **风险**: 打断现有工作流
- **缓解**: 设计为可选命令 (非强制)，/flow-prd 仍可直接调用
- **验证**: A/B 测试，对比有/无 clarify 的 PRD 质量

### 风险 4: 性能瓶颈
- **风险**: 11 维并行扫描耗时过长
- **缓解**: 使用 haiku 模型 (成本低、速度快)，设置 2 分钟超时
- **验证**: 性能测试，目标 < 2 秒 (实际可能 10-30 秒，需调整预期)

---

## 8. 成功指标 (M1 Milestone)

### 定量指标
- [ ] < 5 min 平均澄清时间 (roadmap 目标)
- [ ] > 80% 用户满意度 (Pilot 阶段)
- [ ] ≥ 90% 维度覆盖率 (11 个中至少 10 个)
- [ ] 0 high-severity 歧义遗漏 (Post-PRD 验证)

### 定性指标
- [ ] 用户反馈: "问题切中要害，不浪费时间"
- [ ] 开发者体验: "推荐答案很准，加速决策"
- [ ] PRD 质量提升: "澄清后的 PRD 更清晰、更可执行"

---

## 9. 下一步行动 (Post-Research)

### 立即行动 (当前 /flow-init 完成后)
1. ✅ 生成 research/tasks.json (generate-research-tasks.sh)
2. ✅ 填充 tasks.json 决策字段 (populate-research-tasks.sh)
3. ✅ 整合为 research/research.md (consolidate-research.sh)
4. ✅ 运行 5-level exit gate validation (validate-research.sh)
5. ✅ 更新 orchestration_status.json → phase0_complete = true
6. → 进入 /flow-prd 阶段 (生成完整 PRD)

### PRD 阶段 (REQ-001 进入 Phase 1)
1. 调用 prd-writer agent
2. 输入: research-summary.md + spec-kit clarify.md
3. 输出: PRD.md (完整产品需求文档)

### TECH 阶段 (REQ-001 进入 Phase 2)
1. 调用 tech-architect agent
2. 输入: PRD.md
3. 输出: TECH_DESIGN.md (技术方案设计)

### EPIC 阶段 (REQ-001 进入 Phase 3)
1. 调用 planner agent
2. 输入: PRD.md + TECH_DESIGN.md
3. 输出: EPIC.md + TASKS.md (任务分解)

### DEV 阶段 (REQ-001 进入 Phase 4)
1. 实现 `.claude/commands/flow-clarify.md`
2. 实现 `.claude/agents/clarify-analyst.md`
3. 实现支持脚本 (scan, report, integrate)
4. 编写测试 (单元 + 集成)
5. 更新 orchestrator skill (路由规则)

---

## 10. 研究材料索引

### Internal Research
- [codebase-overview.md](research/internal/codebase-overview.md) - 内部代码库调研

### Official Documentation
- [claude-code-docs.md](research/mcp/20251215/official/claude-code-docs.md) - Claude Code 官方文档
- [claude-agent-sdk-docs.md](research/mcp/20251215/official/claude-agent-sdk-docs.md) - Claude Agent SDK 文档

### Guides and Resources
- [resources.md](research/mcp/20251215/guides/resources.md) - 学术论文与最佳实践索引

### Tutorials
- [anthropic-building-effective-agents.md](research/mcp/20251215/tutorials/anthropic-building-effective-agents.md) - Anthropic 官方指南

---

## 11. 关键引用 (Citations)

1. **Spec-Kit Clarify Template**: [spec-kit/templates/commands/clarify.md](../../../spec-kit/templates/commands/clarify.md)
2. **Requirements Ambiguity Detection**: [IEEE Paper](https://www.ipr.mdu.se/pdf_publications/7221.pdf)
3. **Building Effective AI Agents**: [Anthropic Engineering](https://www.anthropic.com/engineering/building-effective-agents)
4. **Agentic Workflow Patterns**: [AI-SDK Docs](https://ai-sdk.dev/docs/agents/workflows)
5. **Claude Agent SDK**: Context7 - /anthropics/claude-agent-sdk-typescript
6. **Claude Code**: Context7 - /anthropics/claude-code

---

**Research Status**: ✅ COMPLETE
**Phase 0 Complete**: ✅ YES
**Ready for /flow-prd**: ✅ YES
**Next Command**: `/flow-prd "REQ-001"`
