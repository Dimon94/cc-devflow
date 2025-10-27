# Flow-Init Exit Gate 验收测试计划

## 测试目标
验证 `flow-init` 的 5-Level Exit Gate 能够正确检测 `research.md` 的质量问题。

---

## 测试环境准备

### 1. 创建测试需求目录
```bash
# 创建测试需求
mkdir -p devflow/requirements/TEST-001/research/internal
```

### 2. 生成 tasks.json 模拟数据
```bash
cat > devflow/requirements/TEST-001/research/tasks.json <<'EOF'
{
  "feature": "Test Feature",
  "generatedAt": "2025-01-26T12:00:00Z",
  "requirementDir": "devflow/requirements/TEST-001",
  "tasks": [
    {
      "id": "R001",
      "type": "clarification",
      "prompt": "Research database choice for Test Feature",
      "source": "PRD.md:42",
      "status": "open"
    },
    {
      "id": "R002",
      "type": "best_practices",
      "prompt": "Find best practices for Next.js 14 in the context of Test Feature",
      "source": "Tech-Choice:Frontend Framework",
      "status": "open"
    }
  ]
}
EOF
```

---

## Test Case 1: TODO 占位符检测 ❌ (应该失败)

### 输入
```bash
# 生成包含 TODO 的 research.md
cat > devflow/requirements/TEST-001/research/research.md <<'EOF'
# Research Summary — Test Feature

Generated: 2025-01-26T12:00:00Z

## Decisions

### R001 — Research database choice for Test Feature
- Decision: TODO - fill decision outcome
- Rationale: TODO - explain why this decision was chosen
- Alternatives considered: TODO - list evaluated alternatives
- Source: PRD.md:42

### R002 — Find best practices for Next.js 14
- Decision: TODO - fill decision outcome
- Rationale: TODO - explain why this decision was chosen
- Alternatives considered: TODO - list evaluated alternatives
- Source: Tech-Choice:Frontend Framework

## Source Library

_No research source files detected yet._
EOF
```

### 执行验证
```bash
bash .claude/scripts/validate-research.sh devflow/requirements/TEST-001 --strict
```

### 预期输出
```text
════════════════════════════════════════════════════════════════════════
Research.md Quality Validation
════════════════════════════════════════════════════════════════════════
REQ_DIR: devflow/requirements/TEST-001
MODE: STRICT (fail on errors)

✅ LEVEL 1 PASSED: research.md exists

🔍 LEVEL 2: Validating structure...
  ✅ Found section: ## Research Summary
  ✅ Found section: ## Decisions
  ✅ Found 2 Decision block(s)
✅ LEVEL 2 PASSED: Structure valid

🔍 LEVEL 3: Validating content quality...
  ❌ Found 6 TODO/PLACEHOLDER marker(s):
     14:- Decision: TODO - fill decision outcome
     15:- Rationale: TODO - explain why this decision was chosen
     16:- Alternatives considered: TODO - list evaluated alternatives
     19:- Decision: TODO - fill decision outcome
     20:- Rationale: TODO - explain why this decision was chosen
  ✅ No {{PLACEHOLDER}} markers
  🔍 Checking 2 Decision block(s)...
  ✅ All Decision blocks complete
❌ LEVEL 3 FAILED: 1 content error(s)

🔍 LEVEL 4: Constitution compliance check...
  ℹ️  Article X.1: No unresolved questions (acceptable if research complete)
  ✅ Article I.1: No partial implementation markers
✅ LEVEL 4 PASSED: Constitution compliant

════════════════════════════════════════════════════════════════════════
❌ VALIDATION FAILED: 1 level(s) failed

Next Steps:
  1. Review errors above
  2. Update research.md to fix issues
  3. Re-run: validate-research.sh devflow/requirements/TEST-001

Common Fixes:
  - Remove TODO markers → Fill with actual decisions
  - Add missing sections → Use RESEARCH_TEMPLATE.md
  - Complete Decision blocks → Add Rationale + Alternatives
════════════════════════════════════════════════════════════════════════

EXIT CODE: 1 (FAILED)
```

---

## Test Case 2: 完整 research.md ✅ (应该通过)

### 输入
```bash
# 生成符合规范的 research.md
cat > devflow/requirements/TEST-001/research/research.md <<'EOF'
# Research Summary — Test Feature

Generated: 2025-01-26T12:00:00Z

## Decisions

### R001 — Research database choice for Test Feature
- Decision: PostgreSQL 15 with Prisma ORM
- Rationale:
  - Project requires ACID compliance for transaction handling
  - Prisma provides type-safe database access aligned with TypeScript stack
  - Team has prior experience with PostgreSQL deployment and maintenance
- Alternatives considered:
  - MongoDB: Not suitable for complex relational data and transactions
  - MySQL: Less advanced JSON support compared to PostgreSQL
  - Supabase (managed PostgreSQL): Vendor lock-in concerns for enterprise deployment
- Source: PRD.md:42

### R002 — Find best practices for Next.js 14
- Decision: Next.js 14 App Router with React Server Components
- Rationale:
  - App Router provides better layout composition and data fetching patterns
  - Server Components reduce client bundle size and improve initial page load
  - Streaming and Suspense support align with progressive enhancement requirements
- Alternatives considered:
  - Pages Router: Deprecated in favor of App Router, lacks RSC support
  - Remix: Strong alternative but smaller ecosystem and team unfamiliarity
  - Astro: Optimized for content sites, not suitable for highly interactive applications
- Source: Tech-Choice:Frontend Framework

## Source Library

- research/internal/codebase-overview.md
- research/mcp/20250126/official/nextjs-docs.md
- research/mcp/20250126/guides/prisma-best-practices.md
EOF
```

### 执行验证
```bash
bash .claude/scripts/validate-research.sh devflow/requirements/TEST-001 --strict
```

### 预期输出
```text
════════════════════════════════════════════════════════════════════════
Research.md Quality Validation
════════════════════════════════════════════════════════════════════════
REQ_DIR: devflow/requirements/TEST-001
MODE: STRICT (fail on errors)

✅ LEVEL 1 PASSED: research.md exists

🔍 LEVEL 2: Validating structure...
  ✅ Found section: ## Research Summary
  ✅ Found section: ## Decisions
  ✅ Found 2 Decision block(s)
✅ LEVEL 2 PASSED: Structure valid

🔍 LEVEL 3: Validating content quality...
  ✅ No TODO/PLACEHOLDER markers
  ✅ No {{PLACEHOLDER}} markers
  🔍 Checking 2 Decision block(s)...
  ✅ All Decision blocks complete
✅ LEVEL 3 PASSED: Content quality valid

🔍 LEVEL 4: Constitution compliance check...
  ℹ️  Article X.1: No unresolved questions (acceptable if research complete)
  ✅ Article I.1: No partial implementation markers
✅ LEVEL 4 PASSED: Constitution compliant

════════════════════════════════════════════════════════════════════════
✅ ALL VALIDATIONS PASSED
research.md is ready for /flow-prd
════════════════════════════════════════════════════════════════════════

EXIT CODE: 0 (SUCCESS)
```

---

## Test Case 3: 缺少必需章节 ❌ (应该失败)

### 输入
```bash
# 生成缺少 "## Decisions" 的 research.md
cat > devflow/requirements/TEST-001/research/research.md <<'EOF'
# Research Summary — Test Feature

Generated: 2025-01-26T12:00:00Z

## Some Random Section

This is not the Decisions section.
EOF
```

### 执行验证
```bash
bash .claude/scripts/validate-research.sh devflow/requirements/TEST-001 --strict
```

### 预期输出
```text
🔍 LEVEL 2: Validating structure...
  ✅ Found section: ## Research Summary
  ❌ Missing section: ## Decisions
  ❌ No Decision blocks found (expected ### R001, R002, etc.)
❌ LEVEL 2 FAILED: 2 structure error(s)

EXIT CODE: 1
```

---

## Test Case 4: 包含推测性语言 ⚠️ (警告但通过)

### 输入
```bash
cat > devflow/requirements/TEST-001/research/research.md <<'EOF'
# Research Summary — Test Feature

## Decisions

### R001 — Database choice
- Decision: PostgreSQL
- Rationale:
  - Might be better for scaling in the future
  - Could support sharding if needed
- Alternatives considered: MongoDB
- Source: PRD.md:42

## Source Library

_None yet._
EOF
```

### 预期输出
```text
🔍 LEVEL 4: Constitution compliance check...
  ℹ️  Article X.1: No unresolved questions (acceptable if research complete)
  ⚠️  Article X.2: Found speculative language: 'might|maybe|probably|possibly|perhaps'
     (Review context - acceptable if explaining rationale)
  ⚠️  Article X.2: Found speculative language: 'could be|should be|would be'
     (Review context - acceptable if explaining rationale)
  ⚠️  Article X.2: Found speculative language: 'in the future|future-proof|预留|扩展性'
     (Review context - acceptable if explaining rationale)
  ✅ Article I.1: No partial implementation markers
✅ LEVEL 4 PASSED: Constitution compliant

(⚠️ 是警告，不影响通过)
```

---

## 修复指南

### 如果遇到 "TODO - fill decision outcome" 错误

#### 方案 1: 手动填充 tasks.json
```bash
# 编辑 tasks.json，添加 decision/rationale/alternatives 字段
cat > devflow/requirements/TEST-001/research/tasks.json <<'EOF'
{
  "feature": "Test Feature",
  "tasks": [
    {
      "id": "R001",
      "prompt": "Research database choice",
      "status": "completed",
      "decision": "PostgreSQL 15 with Prisma ORM",
      "rationale": "ACID compliance, type-safe access, team experience",
      "alternatives": "MongoDB (no ACID), MySQL (weaker JSON support)"
    }
  ]
}
EOF

# 重新运行 consolidate
bash .claude/scripts/consolidate-research.sh devflow/requirements/TEST-001
```

#### 方案 2: 直接编辑 research.md
```bash
# 手动替换 TODO 为实际内容
# 参考 Test Case 2 的示例格式
```

#### 方案 3: 使用 RESEARCH_TEMPLATE.md
```bash
# 复制模板并填充
cp .claude/docs/templates/RESEARCH_TEMPLATE.md \
   devflow/requirements/TEST-001/research/research.md

# 编辑填充实际决策
```

---

## 集成测试：完整 /flow-init 流程

```bash
# 1. 运行 flow-init
/flow-init "TEST-002|Complete Flow Test"

# 2. 检查 research.md 是否包含 TODO
grep -c "TODO" devflow/requirements/TEST-002/research/research.md

# 3. 如果包含 TODO → 手动修复
# 4. 重新运行验证
bash .claude/scripts/validate-research.sh devflow/requirements/TEST-002 --strict

# 5. 验证通过后，继续 /flow-prd
/flow-prd "TEST-002"
```

---

## 关键指标

### ✅ 验证通过标准
- LEVEL 1: 所有文件存在
- LEVEL 2: 必需章节完整
- LEVEL 3: 无 TODO/PLACEHOLDER，Decision 块完整
- LEVEL 4: Constitution 合规
- EXIT CODE: 0

### ❌ 验证失败标准
- 任何 LEVEL 失败
- research.md 包含 "TODO - fill decision outcome"
- 缺少 ## Decisions 章节
- tasks.json 格式错误
- EXIT CODE: 1

---

## 后续优化建议

### 短期 (本周)
1. ✅ 创建 `RESEARCH_TEMPLATE.md` 模板
2. ✅ 更新 `validate-research.sh` 验证脚本
3. ✅ 集成到 `flow-init.md` Exit Gate

### 中期 (下周)
4. 增强 `consolidate-research.sh`，检测 TODO 并警告
5. 编写自动化测试套件 `test_validate_research.sh`
6. 集成到 CI/CD 流程

### 长期 (本月)
7. 考虑使用 AI agent 自动填充研究任务
8. 构建研究材料知识库，提供上下文建议
9. 支持多语言 research.md（中英文混合）

---

**测试执行者**: Claude Anna AI
**测试日期**: 2025-01-26
**测试结果**: 待用户执行测试用例
