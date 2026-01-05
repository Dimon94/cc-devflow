# Flow-Init Execution Flow Template

> Detailed stages for `/flow-init` requirement initialization

<!-- ============================================================
     调用上下文声明 (Invocation Context Declaration)
     ============================================================

本模板由 `/flow-init` 命令通过 {TEMPLATE:flow} 引用加载。

模板中的 {SCRIPT:xxx} 占位符引用 flow-init.md 头文件中的 scripts 定义：
```yaml
# 来源: .claude/commands/flow-init.md 头文件
scripts:
  create: .claude/scripts/create-requirement.sh
  prereq: .claude/scripts/check-prerequisites.sh
  research_tasks: .claude/scripts/generate-research-tasks.sh
  populate_tasks: .claude/scripts/populate-research-tasks.sh
  consolidate: .claude/scripts/consolidate-research.sh
  validate_research: .claude/scripts/validate-research.sh
```

占位符解析:
- {SCRIPT:prereq}           → bash .claude/scripts/check-prerequisites.sh
- {SCRIPT:create}           → bash .claude/scripts/create-requirement.sh
- {SCRIPT:research_tasks}   → bash .claude/scripts/generate-research-tasks.sh
- {SCRIPT:populate_tasks}   → bash .claude/scripts/populate-research-tasks.sh
- {SCRIPT:consolidate}      → bash .claude/scripts/consolidate-research.sh
- {SCRIPT:validate_research} → bash .claude/scripts/validate-research.sh
============================================================ -->

---

## Stage 1: Entry Gate (参数验证)

```bash
# 1. 解析参数
REQ_ID|TITLE|PLAN_URLS → 验证 REQ_ID 格式: ^(REQ|BUG)-[0-9]+$
→ 若 TITLE 含中文/非ASCII，使用模型意译生成 BRANCH_TITLE_EN（英文语义翻译，禁止拼音/音译）
→ BRANCH_TITLE_EN 仅用于分支名，文档标题仍使用原始 TITLE
→ 若意译不确定或未生成 ASCII 结果，向用户确认英文分支标题

# 2. 前置条件检查
bash {SCRIPT:prereq} --json --paths-only
→ Git 状态干净 + devflow/ 目录存在

# 3. 目录唯一性检查
→ 确认 devflow/requirements/${REQ_ID}/ 不存在
```

---

## Stage 1.5: Context Loading (路线图与架构)

**目标**: 理解需求在项目中的位置

```bash
# 检查 ROADMAP.md 和 ARCHITECTURE.md
→ 如果存在: 加载上下文，展示需求位置
→ 如果不存在: 提示可选运行 /core-roadmap (不阻塞执行)
```

---

## Stage 2: Directory Initialization

```bash
# 创建需求目录
bash {SCRIPT:create} "${REQ_ID}" --title "${TITLE}" --branch-title "${BRANCH_TITLE_EN}" --json

→ 若未生成 BRANCH_TITLE_EN，则省略 --branch-title

# 生成文件
devflow/requirements/${REQ_ID}/
├── README.md
├── EXECUTION_LOG.md
├── orchestration_status.json
└── research/ (空目录)
```

---

## Stage 2.5: Research (MCP Mandatory Flow)

**目标**: 收集"真实材料"，所有步骤 **MANDATORY**

### S0: Internal Codebase Research (必需)
```bash
→ 分析现有代码库
→ 生成 research/internal/codebase-overview.md
```

### Task 1-5: External Learning Materials (MCP)
```
1. Official Documentation (Context7)
   → research/mcp/$(date +%Y%m%d)/official/

2. Domain Tutorials (Web Search)
   → research/mcp/$(date +%Y%m%d)/guides/

3. Core Materials (WebFetch)
   → research/mcp/$(date +%Y%m%d)/tutorials/

4. Case Studies/Examples (Web Search + WebFetch)
   → research/mcp/$(date +%Y%m%d)/examples/

5. Summary & Recommendations
   → research/research-summary.md
```

---

## Stage 2.6: Research Consolidation

```bash
# 1. Generate research tasks
bash {SCRIPT:research_tasks} "${REQ_DIR}"
→ Output: research/tasks.json

# 2. Populate task decisions
bash {SCRIPT:populate_tasks} "${REQ_DIR}"
→ Fill decision/rationale/alternatives from research

# 3. Consolidate research
bash {SCRIPT:consolidate} "${REQ_DIR}"
→ Output: research/research.md
→ Format: Decision/Rationale/Alternatives/Source

# 4. Update status
orchestration_status.json.phase0_complete = true
```

---

## Stage 3: Git Branch Creation

```bash
# 创建功能分支
Requirements: feature/${REQ_ID}-${slug(BRANCH_TITLE_EN)}
Bug Fixes:    bugfix/${BUG_ID}-${slug(BRANCH_TITLE_EN)}

# BRANCH_TITLE_EN = TITLE 的英文意译 (语义为准，非拼音，使用模型意译)
# slug() = lowercase, replace spaces/special chars with hyphens
```

---

## Stage 4: README Generation

```bash
# 生成工作流指南
→ devflow/requirements/${REQ_ID}/README.md
→ 包含: 需求概述、工作流步骤、检查清单
```

---

## Stage 5: Exit Gate (5-Level Quality Check)

### Level 1: File Existence Check
```bash
→ 验证所有必需文件已创建
```

### Level 2: Research.md Structure Validation
```bash
bash {SCRIPT:validate_research} "${REQ_DIR}"
→ 检查 research.md 结构
```

### Level 3: Research.md Content Quality
```bash
→ 无 TODO/FIXME/{{PLACEHOLDER}} 标记
→ 每个 Decision block 完整
```

### Level 4: Research Tasks Validation
```bash
→ 验证 tasks.json 格式和内容
```

### Level 5: Git & Status & Constitution
```bash
→ Git 分支创建成功
→ orchestration_status.json 正确
→ Constitution 符合性检查
```

---

## Output Structure

```
devflow/requirements/${REQ_ID}/
├── README.md
├── research/
│   ├── internal/
│   │   └── codebase-overview.md
│   ├── mcp/
│   │   └── $(date +%Y%m%d)/
│   │       ├── official/
│   │       ├── guides/
│   │       ├── tutorials/
│   │       └── examples/
│   ├── research.md
│   ├── research-summary.md
│   └── tasks.json
├── EXECUTION_LOG.md
└── orchestration_status.json
```

**Git**:
- Branch: `feature/${REQ_ID}-${slug(BRANCH_TITLE_EN)}`
- Status: orchestration_status.json.status = "initialized"
- Phase: orchestration_status.json.phase = "planning"

---

**Last Updated**: 2025-12-19
