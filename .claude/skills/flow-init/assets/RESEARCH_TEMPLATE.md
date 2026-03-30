# Research Summary — {FEATURE_NAME}

> **Purpose**: Document all technical decisions made during requirement initialization
> **Owner**: clarify-analyst / planner agents
> **Status**: Living document (updated until PRD finalized)
> **Template Version**: v1.0.0
> **Constitution Compliance**: Article X.1 (Forced Clarification), Article X.2 (No Speculation)

Generated: {GENERATED_AT}

---

## Decisions

### R001 — {TOPIC_DESCRIPTION}
- **Decision**: {技术选型或架构决策}
- **Rationale**:
  - {理由 1: 必须明确说明为什么选择这个方案}
  - {理由 2: 至少提供 2 条理由，证明决策经过深思熟虑}
  - {理由 3 (可选): 更多支持性论据}
- **Alternatives Considered**:
  - {替代方案 1}: {简要评估 - 为什么不选择}
  - {替代方案 2}: {简要评估 - 优缺点对比}
- **Source**: {来源: PRD.md:42 或 Tech-Choice:Frontend Framework}

### R002 — {TOPIC_DESCRIPTION}
- **Decision**: {实际选择的技术/方案}
- **Rationale**:
  - {业务需求匹配度}
  - {技术优势或团队熟悉度}
- **Alternatives Considered**:
  - {对比方案}: {不选择的原因}
- **Source**: {来源}

---

## Unresolved Questions

> ⚠️ 使用 `[NEEDS CLARIFICATION]` 标记所有待澄清问题
> 📌 每个问题必须包含: Context (上下文) + Impact (影响) + Blocked Tasks (阻塞任务)

- **[NEEDS CLARIFICATION]**: {具体问题描述}
  - **Context**: {为什么需要澄清这个问题}
  - **Impact**: {不澄清会影响哪些决策或实现}
  - **Blocked Tasks**: {哪些任务被阻塞 - 如 data-model.md, API contracts}

---

## Source Library

> **说明**: 列出所有研究材料的相对路径（相对于 REQ_DIR）

### Internal Codebase Research
- `research/internal/codebase-overview.md` - 现有代码库结构和可复用模块
- `research/internal/testing-strategy.md` - 现有测试框架和模式

### External Research Materials (MCP)
- `research/mcp/20250126/official/nextjs-docs.md` - Next.js 14 官方文档（App Router）
- `research/mcp/20250126/guides/prisma-best-practices.md` - Prisma ORM 最佳实践
- `research/mcp/20250126/security/auth0-vs-clerk.md` - 认证方案对比

### Manual Research Notes
- `research/manual/database-benchmarks.md` - 性能基准测试结果
- `research/manual/team-feedback.md` - 团队技术偏好调研

---

## Research Completion Checklist

> ✅ 使用此清单验证 research.md 是否完整且符合规范

### Structure Validation
- [ ] 包含 "## Decisions" 章节
- [ ] 至少有 1 个 Decision block (### R001, R002, ...)
- [ ] 包含 "## Source Library" 章节

### Content Quality
- [ ] 每个 Decision block 包含 Decision/Rationale/Alternatives 三部分
- [ ] Rationale 至少 2 条理由（不能是单行敷衍）
- [ ] Alternatives 至少 1 个具体方案（不能是 "无" 或 "未评估"）
- [ ] 无 TODO 标记
- [ ] 无 {{PLACEHOLDER}} 占位符
- [ ] 无 FIXME/XXX 标记

### Constitution Compliance
- [ ] Article X.1: 所有 NEEDS CLARIFICATION 已明确标记
- [ ] Article X.2: 无推测性语言（"可能"/"未来"/"预留"）
- [ ] Article I.1: 无部分实现标记（"暂时"/"临时"/"简化版"）

### Source Traceability
- [ ] 每个 Decision 有明确的 Source 字段
- [ ] Source Library 列出所有研究材料路径
- [ ] 研究材料文件实际存在于 research/ 目录

---

## Usage Instructions

### For AI Agents (clarify-analyst, planner)

1. **Initialize from Template**:
   ```bash
   cp .claude/docs/templates/RESEARCH_TEMPLATE.md \
      devflow/requirements/${REQ_ID}/research/research.md
   ```

2. **Fill Template Variables**:
   - Replace `{FEATURE_NAME}` with actual feature title
   - Replace `{GENERATED_AT}` with ISO 8601 UTC timestamp
   - Replace all `{PLACEHOLDERS}` with actual content

3. **Populate Decisions**:
   - Read `research/tasks.json` for research task list
   - For each task, create a Decision block
   - Ensure Decision/Rationale/Alternatives are complete

4. **Validate Before Saving**:
   ```bash
   bash .claude/scripts/validate-research.sh ${REQ_DIR} --strict
   ```

### For Human Developers

1. **Manual Research Workflow**:
   ```bash
   # 1. Run flow-init (generates tasks.json)
   /flow-init "REQ-123|Feature Name"

   # 2. Research each task
   # - Check existing codebase
   # - Search official docs (use MCP)
   # - Benchmark alternatives

   # 3. Update tasks.json with findings
   # - Add decision, rationale, alternatives fields
   # - Update status to "completed"

   # 4. Consolidate findings
   bash .claude/scripts/consolidate-research.sh devflow/requirements/REQ-123

   # 5. Validate
   bash .claude/scripts/validate-research.sh devflow/requirements/REQ-123 --strict
   ```

2. **Direct Editing**:
   - Copy this template to `research/research.md`
   - Fill in decisions based on your research
   - Run validation script before proceeding to /flow:spec

---

## Example: Complete Decision Block

```markdown
### R003 — Research authentication strategy for User Management System
- **Decision**: Auth0 with Next.js Middleware integration
- **Rationale**:
  - Native support for Next.js App Router middleware authentication
  - Pre-built UI components reduce frontend development time
  - SaaS model eliminates need for auth infrastructure maintenance
  - Compliance certifications (SOC 2, GDPR) included in Pro plan
- **Alternatives Considered**:
  - Clerk: Similar features but higher pricing at scale (>10k users)
  - NextAuth.js: Open-source but requires self-hosting and security audits
  - AWS Cognito: Lower cost but complex integration with Next.js middleware
  - Custom JWT: Maximum flexibility but significant security risk and dev time
- **Source**: PRD.md:89 (User Story US-002: User Authentication)
```

---

## Anti-Patterns (避免这些错误)

### ❌ Bad Example 1: 敷衍的 Rationale
```markdown
### R001 — Database choice
- Decision: PostgreSQL
- Rationale: 好用
- Alternatives: MySQL
```
**问题**: Rationale 太简单，没有说明为什么好用。Alternatives 没有对比分析。

### ❌ Bad Example 2: 包含 TODO
```markdown
### R001 — Database choice
- Decision: TODO - fill decision outcome
- Rationale: TODO - explain why
- Alternatives: TODO - list alternatives
```
**问题**: 未完成的研究，validate-research.sh 会拒绝。

### ❌ Bad Example 3: 推测性语言
```markdown
### R001 — Database choice
- Decision: PostgreSQL
- Rationale:
  - 未来可能需要复杂查询
  - 预留扩展性支持分片
```
**问题**: "未来可能"/"预留" 违反 Article X.2 (No Speculation)。

### ✅ Good Example: 完整且符合规范
```markdown
### R001 — Research database choice for E-commerce Platform
- **Decision**: PostgreSQL 15 with Prisma ORM
- **Rationale**:
  - PRD requires ACID transactions for order processing (US-005)
  - Prisma provides type-safe database access aligned with TypeScript stack
  - Team has 3 years PostgreSQL production experience (reduces onboarding time)
  - Native JSON support needed for product catalog flexible attributes (US-012)
- **Alternatives Considered**:
  - MongoDB: No ACID transactions, unsuitable for financial operations
  - MySQL: Weaker JSON support, no partial indexes (needed for US-012)
  - Supabase: Vendor lock-in concerns, enterprise pricing unclear
- **Source**: PRD.md:42 (User Story US-005: Order Processing)
```

---

## Troubleshooting

### Q: consolidate-research.sh 生成的 research.md 全是 TODO，怎么办？

**A**: 这说明 `research/tasks.json` 缺少 `decision/rationale/alternatives` 字段。

**解决方案 1** (推荐): 手动填充 tasks.json
```json
{
  "tasks": [
    {
      "id": "R001",
      "prompt": "Research database choice",
      "status": "completed",
      "decision": "PostgreSQL 15 with Prisma ORM",
      "rationale": "ACID compliance, type-safe access, team experience",
      "alternatives": "MongoDB (no ACID), MySQL (weaker JSON support)",
      "source": "PRD.md:42"
    }
  ]
}
```

**解决方案 2**: 直接编辑 research.md，参考此模板格式。

**解决方案 3**: 跳过 consolidate-research.sh，完全手动创建 research.md。

### Q: validate-research.sh 报错 "No Decision blocks found"，但我有内容？

**A**: Decision block 必须符合格式 `### R001 —` (三个 #，空格，R + 数字，空格，破折号)。

**正确格式**:
```markdown
### R001 — Topic description
```

**错误格式**:
```markdown
## R001 Topic   # ❌ 两个 # 不对
### R1 - Topic  # ❌ 破折号是 - 不是 —
### Decision 1  # ❌ 没有 R00X 编号
```

### Q: 我的 research.md 很长，可以拆分吗？

**A**: 不建议拆分。research.md 是单一真相源 (Single Source of Truth)。
- 如果决策太多（>20 个），考虑需求是否过大，应拆分为多个 REQ-ID。
- 详细研究材料放在 `research/internal/` 或 `research/mcp/`，research.md 只记录决策摘要。

---

**Maintained By**: CC-DevFlow Team
**Last Updated**: 2025-01-26
**Related Docs**:
- [flow-init.md](../../commands/flow-init.md) - 需求初始化流程
- [validate-research.sh](../../scripts/validate-research.sh) - 验证脚本
- [flow-init-optimization-plan.md](../../../flow-init-optimization-plan.md) - 优化方案
