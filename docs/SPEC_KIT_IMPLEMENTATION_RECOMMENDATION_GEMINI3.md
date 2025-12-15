# Spec-Kit 深度借鉴与实施建议指南

> **文档目的**: 基于对 `spec-kit` 源码与模板的深度调研，为 `cc-devflow` 提供具体的特性借鉴与实施路径。
> **核心价值**: 引入 "Shift Left" (质量左移) 理念，在编码前通过结构化澄清与质量检查消除需求歧义。

---

## 核心发现摘要

通过分析 `spec-kit` 的 `templates/commands/` 核心逻辑，我们确认其 "杀手级" 特性并非在于复杂的代码实现，而是在于 **精心设计的 Prompt Engineering** 和 **结构化的思维框架**。

最值得 `cc-devflow` 立即借鉴的两个特性是：
1.  **/clarify (需求澄清)**: 11 维度歧义扫描 + 推荐选项机制。
2.  **/checklist (质量检查)**: "需求单元测试" (Unit Tests for Requirements) 理念。

---

## 一、需求澄清机制 (/clarify) 深度借鉴

`spec-kit` 的 `clarify.md` 模板展示了一个极高水准的交互式澄清流程。

### 1.1 核心逻辑复刻建议

建议为 `cc-devflow` 引入 `/flow-clarify` 命令，复刻以下核心逻辑：

#### A. 11 维度歧义分类法 (Taxonomy)
在 Prompt 中强制要求 AI 按以下维度扫描需求（Status: Clear / Partial / Missing）：

1.  **Functional Scope & Behavior** (核心目标与边界)
2.  **Domain & Data Model** (实体、属性、生命周期)
3.  **Interaction & UX Flow** (关键旅程、异常状态)
4.  **Non-Functional Quality Attributes** (性能、安全、可观测性)
5.  **Integration & External Dependencies** (外部服务、故障模式)
6.  **Edge Cases & Failure Handling** (负向场景、冲突解决)
7.  **Constraints & Tradeoffs** (技术约束、取舍)
8.  **Terminology & Consistency** (术语一致性)
9.  **Completion Signals** (可测量的完成标准)
10. **Misc / Placeholders** (TODOs, 模糊形容词)
11. **Security & Privacy** (权限、数据保护)

#### B. "推荐选项" 交互模式 (Killer Feature)
不要只问开放式问题，必须提供 **Recommended Option**。

**Prompt 模式参考**:
```markdown
For multiple-choice questions:
1. Analyze all options based on best practices/risk/goals.
2. Present your **Recommended Option** prominently with reasoning.
3. Format output:
   **Recommended:** Option B - OAuth2 (Better security ecosystem)

   | Option | Description |
   |--------|-------------|
   | A      | Email/Password only |
   | B      | OAuth2 (recommended) |
   | C      | Magic Link |

   Reply "B", "recommended", or your own answer.
```

#### C. 增量更新机制 (Incremental Update)
每次用户确认答案后，**立即** 更新内存中的 Spec 对象并写入文件（Atomic Overwrite），而不是等所有问题问完。
- Q: "What's the auth timeout?" -> A: "30 mins"
- Action: Find "Security" section, add bullet "- Session timeout: 30 minutes".

### 1.2 实施路径

1.  **创建模板**: `devflow/templates/commands/clarify.md` (适配 Claude Code 格式)。
2.  **定义工作流**: `/flow-init` -> **`/flow-clarify`** -> `/flow-prd`。
3.  **Hook 集成**: 在生成 PRD 前检测是否运行过 clarify，如果没有则提示建议。

---

## 二、需求质量检查 (/checklist) 深度借鉴

`spec-kit` 的 `checklist.md` 提出了一个震撼的理念：**Checklists are Unit Tests for Requirements**。

### 2.1 核心理念复刻

必须在 Prompt 中包含 "Anti-Examples"，防止 AI 生成 "测试步骤" 而非 "需求检查点"。

**核心原则**:
- ❌ **Wrong**: "Verify landing page has 3 cards" (这是测试实现)
- ✅ **Right**: "Is the exact number and layout of cards specified?" (这是测试需求)

### 2.2 检查维度 (Quality Dimensions)

生成的 Checklist 必须包含以下标签：
- `[Completeness]`: 需求是否完整？
- `[Clarity]`: 需求是否无歧义？
- `[Consistency]`: 是否有冲突？
- `[Measurability]`: 是否可验证？
- `[Coverage]`: 是否覆盖了 Edge Cases？

### 2.3 动态生成算法

不要使用静态模板，而是让 AI：
1.  分析用户输入 (e.g. "Generate a security checklist")
2.  提取上下文 (Spec/Plan)
3.  生成特定领域的清单 (e.g. `checklists/security.md`)

**Prompt 提示词参考**:
```markdown
Generate unique checklist filename based on domain (e.g. ux.md, api.md).
Each item MUST evaluate the REQUIREMENTS THEMSELVES.
Example: "Are error response formats specified for all failure scenarios? [Completeness]"
```

---

## 三、其他有价值的微创新

### 3.1 跨文档一致性分析 (/analyze)
- **Token-Efficient Analysis**: `analyze.md` 强调只加载必要的片段（Progressive Disclosure），而不是把所有文件 dump 给 Context。
- **Severity Levels**: 定义已有的一致性问题等级 (Critical/High/Medium/Low)。
- **Actionable Table**: 输出表格包含 `Location` (File:Line) 和 `Recommendation`。

### 3.2 忽略文件自动生成
在 `implement` 阶段，自动检测项目特征并生成 `.gitignore`, `.dockerignore` 等，这是 `cc-devflow` 目前主要依赖手动或模板的部分，可以自动化。

---

## 四、具体实施计划 (Action Plan)

建议将以下任务加入 `cc-devflow` 的 backlog：

### Phase 1: 引入核心 Prompt 模板 (Quick Wins)
- [ ] 创建 `templates/prompts/clarify_requirements.md` (复刻 11 维度 & 推荐机制)
- [ ] 创建 `templates/prompts/generate_checklist.md` (复刻 Requirement Unit Test 理念)

### Phase 2: 开发新命令
- [ ] 开发 `/flow-clarify [REQ-ID]`
    - 读取 research.md 或初步需求
    - 交互式问答 (Limit to 5 questions/session)
    - 更新 research.md 或 PRD.md
- [ ] 开发 `/flow-checklist [REQ-ID] [TYPE]`
    - 生成 `requirements/REQ-XXX/checklists/[type].md`

### Phase 3: 工作流集成
- [ ] 更新 `DEVELOPMENT_PLAN.md` 推荐在 PRD 前运行 Clarify。
- [ ] 更新 QA 流程，要求在开发前 Review Checklist。

---

## 总结

`spec-kit` 的精华在于它**将资深产品经理和架构师的思维（提问技巧、检查视角）固化为了 Prompt 模板**。`cc-devflow` 拥有更强大的 Agent 编排能力，如果引入这些高质量的思维模型，将能显著提升生成的 PRD 和代码质量，真正实现 "One-Command" 但不失深度的开发体验。
