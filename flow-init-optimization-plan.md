# Flow-Init 优化方案：Research.md 验收标准强化

## 📊 问题诊断

### 现象层（用户看到的）
- `flow-init.md` 的 Exit Gate 只检查文件是否存在
- `research.md` 可能是空文件或格式混乱
- 后续 `/flow-prd` 拿到的研究材料质量不可控

### 本质层（真正的问题）
- 缺少**内容质量验收**机制
- 没有强制 `research.md` 的**标准化格式**
- 未参考 spec-kit 的 Decision/Rationale/Alternatives 结构

### 哲学层（设计理念）
> "Quality gates should fail fast with clear contracts"
> 验收闸门应该尽早失败，并有明确的合约约束

---

## 🎯 优化目标

### 1. 强化 Research.md 格式规范
**参考 spec-kit/templates/commands/plan.md**:
```markdown
## Research Summary

### Technical Stack Decisions

#### Decision 1: [具体技术选型]
- **Decision**: 选择了 Next.js 14 App Router
- **Rationale**:
  - 项目需要 SSR 和 SSG 混合渲染
  - App Router 提供更好的布局复用
  - React Server Components 减少客户端 bundle
- **Alternatives Considered**:
  - Pages Router: 功能完备但布局复用差
  - Remix: 学习曲线陡峭，生态不如 Next.js
  - Astro: 不适合高交互场景

#### Decision 2: [数据库选型]
- **Decision**: PostgreSQL + Prisma ORM
- **Rationale**: ...
- **Alternatives Considered**: ...

### Unresolved Questions
- [NEEDS CLARIFICATION]: 用户认证是否需要支持 SSO？
- [NEEDS CLARIFICATION]: 数据库是否需要读写分离？

### Research Tasks Summary
| Task ID | Topic | Owner | Status | Findings |
|---------|-------|-------|--------|----------|
| RT-001  | Next.js routing | research.md | ✅ Complete | 使用 App Router |
| RT-002  | Database choice | research.md | ✅ Complete | PostgreSQL + Prisma |
| RT-003  | Auth strategy | - | ⏳ Pending | 等待用户澄清 |
```

### 2. 新增 research.md 验收检查点

**阶段 2.6 输出要求**（替换现有内容）:
```markdown
### 阶段 2.6: 调研任务分派与决策整合

**Execution Flow**:
```text
1. 生成研究任务
   → Run: {SCRIPT:research_tasks} "${REQ_DIR}"
   → 输出: research/tasks.json（记录 unknown、owner、状态）
   → 格式验证:
      • 必须是有效 JSON
      • 至少包含 1 个任务或标记为 "no_unknowns"
      • 每个任务必须有: id, topic, status 字段

2. 整合研究结论
   → Run: {SCRIPT:consolidate} "${REQ_DIR}"
   → 输出: research/research.md

   **MANDATORY STRUCTURE** (强制结构):
   ```markdown
   ## Research Summary

   ### Technical Stack Decisions

   #### Decision 1: [技术名称]
   - **Decision**: [选择了什么]
   - **Rationale**: [为什么选择]（至少 2 条理由）
   - **Alternatives Considered**: [评估了哪些替代方案]（至少 1 个）

   #### Decision 2: ...

   ### Unresolved Questions
   - [NEEDS CLARIFICATION]: [具体问题] (如果有)

   ### Research Tasks Summary
   | Task ID | Topic | Owner | Status | Findings |
   |---------|-------|-------|--------|----------|
   | RT-001  | ...   | ...   | ✅/⏳   | ...      |
   ```

   **CONTENT VALIDATION** (内容验证):
   - [ ] 至少包含 1 个 Technical Stack Decision
   - [ ] 每个 Decision 必须有 Decision/Rationale/Alternatives 三部分
   - [ ] Rationale 至少 2 条理由（避免敷衍）
   - [ ] Alternatives 至少 1 个（证明做了对比）
   - [ ] 无 {{PLACEHOLDER}} 或 "TODO" 标记
   - [ ] 如有未解决问题，必须标记 [NEEDS CLARIFICATION]
   - [ ] Research Tasks Summary 表格必须存在且非空

3. 更新状态
   → orchestration_status.json.phase0_complete = true
   → EXECUTION_LOG.md 记录 consolidate 时间与关键结论数量
   → 记录格式: "Research consolidated: X decisions, Y unresolved"
```
```

### 3. 强化 Exit Gate 验收（阶段 5）

**替换现有 "阶段 5: 完成确认 (Exit Gate)"**:
```markdown
### 阶段 5: 完成确认 (Exit Gate)

**Exit Gate Validation**:
```text
✅ **LEVEL 1: File Existence Check**
1. Verify all required files created:
   - [ ] REQ_DIR/ directory exists
   - [ ] REQ_DIR/research/ directory exists
   - [ ] REQ_DIR/research/internal/ directory exists (内部调研)
   - [ ] REQ_DIR/README.md exists
   - [ ] REQ_DIR/EXECUTION_LOG.md exists
   - [ ] orchestration_status.json (requirements) 或 status.json (bugs) 存在
   - [ ] research/research.md exists
   - [ ] research/tasks.json exists

✅ **LEVEL 2: Research.md Structure Validation**
2. Validate research.md mandatory sections:
   → Run: grep -q "## Research Summary" research/research.md
   → Run: grep -q "### Technical Stack Decisions" research/research.md
   → Run: grep -q "### Research Tasks Summary" research/research.md

   **Required Sections** (必须全部存在):
   - [ ] "## Research Summary" heading
   - [ ] "### Technical Stack Decisions" section
   - [ ] At least 1 "#### Decision X:" subsection
   - [ ] "### Research Tasks Summary" table
   - [ ] Table has header: | Task ID | Topic | Owner | Status | Findings |

   **Content Quality Checks**:
   - [ ] No {{PLACEHOLDER}} markers (检查: grep -c "{{.*}}" research.md == 0)
   - [ ] No "TODO" markers (检查: grep -c "TODO" research.md == 0)
   - [ ] At least 1 Decision block with all 3 parts:
      • Decision: [选择]
      • Rationale: [理由] (至少 20 字)
      • Alternatives Considered: [替代方案] (至少 10 字)
   - [ ] Rationale 不能是单行（至少 2 条bullet points）
   - [ ] Alternatives 至少 1 个具体方案名称

✅ **LEVEL 3: Research Tasks Validation**
3. Validate research/tasks.json:
   → Run: jq empty research/tasks.json (验证 JSON 格式)
   → Run: jq '.tasks | length' research/tasks.json

   **Tasks File Checks**:
   - [ ] Valid JSON format (可被 jq 解析)
   - [ ] Contains "tasks" array or "no_unknowns": true
   - [ ] If tasks exist, each has: id, topic, status, owner
   - [ ] At least 50% tasks status == "completed" (否则 research.md 不完整)

✅ **LEVEL 4: Git & Status Validation** (unchanged)
4. Verify git branch (if applicable):
   - [ ] Branch created successfully
   - [ ] Currently on feature/bugfix branch
   - [ ] DEVFLOW_REQ_ID environment variable set (if git branch not used)

5. Verify status tracking:
   - [ ] orchestration_status.json/status.json → status === "initialized"
   - [ ] orchestration_status.json/status.json → phase === "planning" (REQ) / "analysis" (BUG)
   - [ ] orchestration_status.json.phase0_complete === true
   - [ ] EXECUTION_LOG.md 已记录初始化事件（含时间戳）
   - [ ] EXECUTION_LOG.md 包含 "Research consolidated: X decisions, Y unresolved" 条目

✅ **LEVEL 5: Constitution Check**
6. Run Constitution validation:
   → Run: {SCRIPT:validate_constitution} --type research --severity error
   → 检查点:
      • Article X.1 (Forced Clarification): 所有 NEEDS CLARIFICATION 已标记
      • Article X.2 (No Speculation): research.md 不包含推测性技术细节
      • Article VII.2 (No Future-Proofing): 决策基于当前需求，非"预留扩展"

*GATE CHECK: All 5 levels passed*
```text

**Failure Actions** (任一级别失败时):
```text
❌ LEVEL 1 失败 → ERROR "Missing required files. Re-run /flow-init."
❌ LEVEL 2 失败 → ERROR "research.md structure invalid. See required format in flow-init.md阶段2.6"
❌ LEVEL 3 失败 → ERROR "research/tasks.json invalid or incomplete. Check task completion status."
❌ LEVEL 4 失败 → ERROR "Git or status tracking issue. Check EXECUTION_LOG.md."
❌ LEVEL 5 失败 → ERROR "Constitution violations detected. Fix before proceeding to /flow-prd."
```
```

---

## 🔧 实施步骤

### Step 1: 更新 flow-init.md
```bash
# 替换阶段 2.6 和阶段 5 的内容
# 使用上述优化后的验收标准
```

### Step 2: 创建 research.md 模板
**新建文件**: `.claude/docs/templates/RESEARCH_TEMPLATE.md`

```markdown
# Research Summary Template

> **Purpose**: Document all technical decisions made during requirement initialization
> **Owner**: prd-writer / planner agents
> **Status**: Living document (updated until PRD finalized)

---

## Research Summary

### Technical Stack Decisions

#### Decision 1: [技术选型名称]
- **Decision**: [选择了什么技术/方案]
- **Rationale**:
  - [理由 1]
  - [理由 2]
  - [理由 3 (可选)]
- **Alternatives Considered**:
  - [替代方案 1]: [简要评估]
  - [替代方案 2]: [简要评估]

#### Decision 2: [数据库 / 状态管理 / 认证方案...]
- **Decision**: ...
- **Rationale**: ...
- **Alternatives Considered**: ...

---

### Unresolved Questions

> 使用 [NEEDS CLARIFICATION] 标记所有待澄清问题

- **[NEEDS CLARIFICATION]**: 用户认证是否需要支持多租户？
  - **Context**: PRD 未明确说明
  - **Impact**: 影响数据库 schema 设计
  - **Blocked Tasks**: data-model.md, DB migration

- **[NEEDS CLARIFICATION]**: ...

---

### Research Tasks Summary

| Task ID | Topic | Owner | Status | Findings |
|---------|-------|-------|--------|----------|
| RT-001  | Next.js routing best practices | MCP:Context7 | ✅ Complete | App Router 适合 SSR+SSG 混合场景 |
| RT-002  | PostgreSQL vs MongoDB | research.md | ✅ Complete | PostgreSQL 更适合关系型数据 |
| RT-003  | Auth0 vs Clerk | - | ⏳ Pending | 待评估价格和集成复杂度 |

---

## Internal Codebase Research

> **Source**: research/internal/codebase-overview.md
> **Last Updated**: YYYY-MM-DD

### Reusable Modules
- `lib/db.ts`: Database connection pool (可复用)
- `lib/auth.ts`: JWT token verification (需扩展支持 OAuth2)

### Related Files
- `app/api/users/route.ts`: 用户 CRUD API (参考实现)
- `tests/integration/auth.test.ts`: 认证测试套件 (可扩展)

### Testing Infrastructure
- 使用 Jest + Testing Library
- 覆盖率要求: ≥80%
- Mock 策略: MSW for API, Prisma Mock for DB

---

## External Research Materials

> **Source**: research/mcp/YYYYMMDD/*.md (MCP 抓取的官方文档)

### Key Findings
1. **Next.js 14 官方文档**: App Router 支持 Partial Prerendering (PPR)
2. **Prisma Best Practices**: 推荐使用 connection pooling 在 serverless 环境
3. **Stripe Billing Guide**: 支持 subscription + usage-based billing 混合模式

### Reference Links
- [Next.js Dynamic Routes](research/mcp/20250126/official/nextjs-routing.md)
- [Prisma Connection Pooling](research/mcp/20250126/guides/prisma-pooling.md)

---

## Research Completion Checklist

- [ ] 至少 1 个 Technical Stack Decision documented
- [ ] 每个 Decision 包含 Decision/Rationale/Alternatives
- [ ] Rationale 至少 2 条理由
- [ ] Alternatives 至少 1 个具体方案
- [ ] 无 {{PLACEHOLDER}} 或 TODO 标记
- [ ] 所有 [NEEDS CLARIFICATION] 已标记并描述影响
- [ ] Research Tasks Summary 表格完整填写
- [ ] Internal codebase research 已完成
- [ ] External MCP materials 已整合（如有）

---

**Template Version**: v1.0.0
**Constitution Compliance**: Article X.1 (Forced Clarification), Article X.2 (No Speculation)
```

### Step 3: 更新 consolidate-research.sh 脚本
**脚本职责**:
1. 读取 `research/tasks.json`
2. 检查任务完成度（至少 50% 完成）
3. 生成符合模板的 `research.md`
4. 验证必需章节存在
5. 检查占位符和 TODO

**伪代码**:
```bash
#!/usr/bin/env bash
# .claude/scripts/consolidate-research.sh

REQ_DIR="$1"
TASKS_FILE="${REQ_DIR}/research/tasks.json"
OUTPUT_FILE="${REQ_DIR}/research/research.md"
TEMPLATE=".claude/docs/templates/RESEARCH_TEMPLATE.md"

# 1. 验证 tasks.json 存在且有效
if ! jq empty "$TASKS_FILE" 2>/dev/null; then
  echo "ERROR: Invalid tasks.json format"
  exit 1
fi

# 2. 检查任务完成度
TOTAL=$(jq '.tasks | length' "$TASKS_FILE")
COMPLETED=$(jq '[.tasks[] | select(.status == "completed")] | length' "$TASKS_FILE")
COMPLETION_RATE=$(echo "scale=2; $COMPLETED / $TOTAL" | bc)

if (( $(echo "$COMPLETION_RATE < 0.5" | bc -l) )); then
  echo "ERROR: Research incomplete. Only $COMPLETED/$TOTAL tasks done (need ≥50%)"
  exit 1
fi

# 3. 复制模板
cp "$TEMPLATE" "$OUTPUT_FILE"

# 4. 替换动态内容
# - 插入 Technical Stack Decisions（从 tasks.json 的 findings）
# - 插入 Research Tasks Summary 表格
# - 标记 NEEDS CLARIFICATION（status == "pending"）

# 5. 验证必需章节
for SECTION in "## Research Summary" "### Technical Stack Decisions" "### Research Tasks Summary"; do
  if ! grep -q "$SECTION" "$OUTPUT_FILE"; then
    echo "ERROR: Missing required section: $SECTION"
    exit 1
  fi
done

# 6. 检查占位符
if grep -q "{{.*}}" "$OUTPUT_FILE"; then
  echo "ERROR: Placeholders found in research.md"
  exit 1
fi

echo "✅ research.md generated and validated"
```

### Step 4: 创建验证脚本
**新建**: `.claude/scripts/validate-research.sh`

```bash
#!/usr/bin/env bash
# .claude/scripts/validate-research.sh
# Usage: validate-research.sh <REQ_DIR>

REQ_DIR="$1"
RESEARCH_MD="${REQ_DIR}/research/research.md"

# LEVEL 2 验证逻辑
grep -q "## Research Summary" "$RESEARCH_MD" || { echo "❌ Missing: ## Research Summary"; exit 1; }
grep -q "### Technical Stack Decisions" "$RESEARCH_MD" || { echo "❌ Missing: ### Technical Stack Decisions"; exit 1; }
grep -q "### Research Tasks Summary" "$RESEARCH_MD" || { echo "❌ Missing: ### Research Tasks Summary"; exit 1; }

# 检查至少 1 个 Decision
if ! grep -q "#### Decision 1:" "$RESEARCH_MD"; then
  echo "❌ No decisions documented"
  exit 1
fi

# 检查占位符
if grep -q "{{.*}}" "$RESEARCH_MD"; then
  echo "❌ Placeholders found"
  exit 1
fi

# 检查 TODO
if grep -q "TODO" "$RESEARCH_MD"; then
  echo "❌ TODO markers found"
  exit 1
fi

echo "✅ research.md validation passed"
```

---

## 🧪 测试用例

### Test Case 1: 空 research.md 应该失败
```bash
# Setup
echo "" > research/research.md

# Execute
/flow-init "REQ-123|Test"

# Expected
ERROR: research.md structure invalid. See required format in flow-init.md阶段2.6
EXIT_CODE: 1
```

### Test Case 2: 缺少 Rationale 应该失败
```markdown
#### Decision 1: Next.js
- **Decision**: Next.js 14
- **Rationale**: 好用  # ❌ 太简单，不符合"至少 2 条理由"
- **Alternatives Considered**: Remix
```
**Expected**: ERROR (Rationale 少于 2 条 bullet points)

### Test Case 3: 完整格式应该通过
```markdown
#### Decision 1: Next.js
- **Decision**: Next.js 14 App Router
- **Rationale**:
  - 项目需要 SSR 和 SSG 混合渲染
  - App Router 提供更好的布局复用
- **Alternatives Considered**:
  - Remix: 学习曲线陡峭
```
**Expected**: ✅ PASS

---

## 📋 Migration Checklist

### Phase 1: 文档更新
- [ ] 更新 `.claude/commands/flow-init.md` 阶段 2.6
- [ ] 更新 `.claude/commands/flow-init.md` 阶段 5 (Exit Gate)
- [ ] 创建 `.claude/docs/templates/RESEARCH_TEMPLATE.md`
- [ ] 更新 `CLAUDE.md` 项目文档，说明新的 research.md 规范

### Phase 2: 脚本增强
- [ ] 增强 `.claude/scripts/consolidate-research.sh`（参考 Step 3 伪代码）
- [ ] 创建 `.claude/scripts/validate-research.sh`（参考 Step 4）
- [ ] 更新 `.claude/scripts/check-prerequisites.sh`，增加 research.md 验证调用

### Phase 3: 测试
- [ ] 编写测试用例 `test_consolidate_research.sh`
- [ ] 覆盖场景: 空文件、缺少章节、占位符、TODO 标记、任务完成度不足
- [ ] 运行现有测试套件，确保无回归

### Phase 4: 集成
- [ ] 在 `flow-init.md` 的 Exit Gate 中调用 `validate-research.sh`
- [ ] 在 `flow-prd.md` 的 Entry Gate 中验证 `research.md` 存在且有效
- [ ] 更新 `prd-writer.md` agent，要求其读取 `research.md` 并引用 Decisions

### Phase 5: 文档同步
- [ ] 更新主 `README.md`，说明 research.md 的作用和格式
- [ ] 更新 `CONTRIBUTING.md`（如有），添加 research.md 编写指南
- [ ] 生成示例 `research.md` 放在 `examples/` 目录

---

## 🎯 预期效果

### Before (优化前)
```bash
/flow-init "REQ-123|Test"
# → 生成空 research.md
# → Exit Gate 只检查文件存在 ✅
# → /flow-prd 拿到的是垃圾数据
```

### After (优化后)
```bash
/flow-init "REQ-123|Test"
# → 强制生成结构化 research.md
# → Exit Gate 验证 5 个级别
# → 如果 research.md 不合格 → ERROR 并终止
# → 确保 /flow-prd 拿到的是高质量研究材料
```

---

## 🔮 哲学反思

> "A quality gate that always passes is not a gate, but a decoration."
> 永远通过的质量闸门不是闸门，而是装饰品。

**现象层**: flow-init 生成了文件
**本质层**: 但文件质量不可控，导致后续阶段失败
**哲学层**: **"Fail fast with clear contracts"** — 尽早失败，用明确的契约约束输入输出

通过这次优化，我们实现了：
1. **强制结构化**: research.md 必须符合标准格式
2. **内容质量保证**: Decision/Rationale/Alternatives 三部分缺一不可
3. **可追溯性**: 所有决策有明确理由和对比
4. **Constitution 合规**: 符合 Article X (Requirement Boundary) 的强制澄清原则

---

## 附录：与 spec-kit 的对比

| 维度 | spec-kit/plan.md | cc-devflow/flow-init (优化后) |
|------|------------------|-------------------------------|
| **Research 格式** | Decision/Rationale/Alternatives | ✅ 完全一致 |
| **验收严格度** | 检查必需章节、无占位符 | ✅ 5-Level Exit Gate |
| **NEEDS CLARIFICATION** | 强制标记 | ✅ Article X.1 合规 |
| **任务完成度** | 无明确要求 | ✅ 至少 50% 完成 |
| **Constitution 集成** | 无 | ✅ validate-constitution.sh |

**优势**: cc-devflow 的验收更严格，集成了 Constitution 体系
**对齐**: 完全采纳 spec-kit 的 research.md 格式规范
