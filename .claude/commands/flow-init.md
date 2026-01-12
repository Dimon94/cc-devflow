---
name: flow-init
description: 'Initialize requirement structure. Usage: /flow-init "REQ-123|Title|URLs"'
scripts:
  create: .claude/scripts/create-requirement.sh
  prereq: .claude/scripts/check-prerequisites.sh
  research_tasks: .claude/scripts/generate-research-tasks.sh
  populate_tasks: .claude/scripts/populate-research-tasks.sh
  consolidate: .claude/scripts/consolidate-research.sh
  validate_research: .claude/scripts/validate-research.sh
templates:
  flow: .claude/docs/templates/INIT_FLOW_TEMPLATE.md
  research: .claude/docs/templates/RESEARCH_TEMPLATE.md
  brainstorm: .claude/docs/templates/BRAINSTORM_TEMPLATE.md
guides:
  troubleshoot: .claude/docs/guides/INIT_TROUBLESHOOTING.md
skills:
  brainstorming: .claude/skills/flow-brainstorming/SKILL.md
---

<!-- ============================================================
     头文件引用语法规范 (Header File Reference Syntax)
     ============================================================

命令头文件格式:
```yaml
scripts:
  create: .claude/scripts/create-requirement.sh
templates:
  flow: .claude/docs/templates/INIT_FLOW_TEMPLATE.md
guides:
  troubleshoot: .claude/docs/guides/INIT_TROUBLESHOOTING.md
```

引用语法:
- {SCRIPT:create}      → 执行 .claude/scripts/create-requirement.sh
- {TEMPLATE:flow}      → 加载 .claude/docs/templates/INIT_FLOW_TEMPLATE.md
- {GUIDE:troubleshoot} → 参考 .claude/docs/guides/INIT_TROUBLESHOOTING.md

使用案例:
```markdown
# 正文中遇到:
→ Run: {SCRIPT:create} "REQ-123" --title "User Auth"
# 解释为:
→ 执行命令: bash .claude/scripts/create-requirement.sh "REQ-123" --title "User Auth"

# 正文中遇到:
→ 详见 {TEMPLATE:flow} Stage 2.5
# 解释为:
→ 打开并阅读 .claude/docs/templates/INIT_FLOW_TEMPLATE.md 中的 Stage 2.5 章节

# 正文中遇到:
→ 遇到问题参考 {GUIDE:troubleshoot}
# 解释为:
→ 打开并阅读 .claude/docs/guides/INIT_TROUBLESHOOTING.md
```

规则: 遇到 {TYPE:key} 占位符时，去头文件 YAML 中找对应类型的 key，获取文件路径并执行/加载。
============================================================ -->

# Flow-Init - 需求初始化命令

## User Input
```text
$ARGUMENTS = "REQ_ID|TITLE|PLAN_URLS?" 或 --interactive
```

**格式**:
- REQ_ID: `^(REQ|BUG)-[0-9]+$` (例如: REQ-123, BUG-456)
- TITLE: 需求简短标题
- PLAN_URLS: 计划文档URL，多个用逗号分隔 (可选)

**示例**:
```
/flow-init "REQ-123|User Authentication"
/flow-init "REQ-124|数据导出|https://docs.example.com/export-spec.md"
/flow-init --interactive
```

---

## 执行前加载

**详细流程**:
→ 参见 `{TEMPLATE:flow}` 获取完整执行流程

**研究模板**:
→ 参见 `{TEMPLATE:research}` 了解研究文档格式

**故障排查**:
→ 遇到问题参考 `{GUIDE:troubleshoot}`

---

## 执行流程

### Stage 1: Entry Gate (参数验证)

```
1. 解析参数: REQ_ID|TITLE|PLAN_URLS
   → 验证 REQ_ID 格式: ^(REQ|BUG)-[0-9]+$
   → 提取 TITLE 和 PLAN_URLS
   → 若 TITLE 含中文/非ASCII，使用模型意译生成 BRANCH_TITLE_EN（英文语义翻译，禁止拼音/音译）
   → BRANCH_TITLE_EN 仅用于分支名，文档标题仍使用原始 TITLE
   → 若意译不确定或未生成 ASCII 结果，向用户确认英文分支标题

2. 前置条件检查
   → Run: {SCRIPT:prereq} --json --paths-only
   → 检查 Git 状态是否干净
   → 验证 devflow/ 目录存在

3. 目录唯一性检查
   → 确认 devflow/requirements/${REQ_ID}/ 不存在
   → 如果存在 → ERROR (使用 --force 强制覆盖)

4. 验证通过 → 继续 Stage 1.5
```

---

### Stage 1.2: Git Branch Creation

```
创建功能分支:
→ Requirements: feature/${REQ_ID}-${slug(BRANCH_TITLE_EN)}
→ Bug Fixes:    bugfix/${BUG_ID}-${slug(BRANCH_TITLE_EN)}

Where BRANCH_TITLE_EN = TITLE 的英文意译 (语义为准，非拼音，使用模型意译)
      slug() = lowercase, replace spaces/special chars with hyphens
```

---

### Stage 1.5: Context Loading (路线图与架构)

**目标**: 理解需求在项目中的位置

```
检查 ROADMAP.md 和 ARCHITECTURE.md:
→ 如果存在: 加载上下文，展示需求位置
→ 如果不存在: 提示可选运行 /core-roadmap

→ 详见 {TEMPLATE:flow} Stage 1.5
```

**输出**: 显示需求在路线图和架构中的位置 (如果可用)

---

### Stage 2: Directory Initialization

```
创建需求目录结构:
→ Run: {SCRIPT:create} "${REQ_ID}" --title "${TITLE}" --branch-title "${BRANCH_TITLE_EN}" --json (如有)

生成文件:
- devflow/requirements/${REQ_ID}/README.md
- devflow/requirements/${REQ_ID}/EXECUTION_LOG.md
- devflow/requirements/${REQ_ID}/orchestration_status.json
- devflow/requirements/${REQ_ID}/research/ (目录)

→ 详见 {TEMPLATE:flow} Stage 2
```

---

### Stage 2.3: Brainstorming (North Star Capture)

**目标**: 捕捉需求的原始意图，确保后续流程有明确的「北极星」可追溯

**Iron Law**: `NO FLOW EXECUTION WITHOUT BRAINSTORM ALIGNMENT`

```
触发 flow-brainstorming skill:
→ 参见 {SKILL:brainstorming} 了解完整流程

执行步骤:
1. Understanding the Idea
   → 一次问一个问题，不要压垮用户
   → 优先多选题，更容易回答
   → 理解: 目的、约束、成功标准

2. Exploring Approaches
   → 提出 2-3 种方案及取舍
   → 给出推荐方案和理由
   → 让用户做最终决策

3. Presenting the Design
   → 分段呈现设计 (200-300 字/段)
   → 每段后确认是否正确
   → 涵盖: 架构、组件、数据流、测试

4. Documentation
   → 使用 {TEMPLATE:brainstorm} 模板
   → 输出: devflow/requirements/${REQ_ID}/BRAINSTORM.md
   → 必须包含: 原始需求、核心问题、成功标准、方案探索、最终决策

Rationalization Prevention:
| Excuse | Reality |
|--------|---------|
| "需求已经很清楚了" | Brainstorm 确保没有遗漏假设 |
| "用户赶时间" | 头脑风暴节省后续返工时间 |
| "这是小需求" | 小需求也有核心问题和成功标准 |

Red Flags - STOP:
→ 跳过问问题直接开始做
→ 没有记录方案取舍就选定
→ 没有写 BRAINSTORM.md 就进入下一阶段
```

**输出**: `devflow/requirements/${REQ_ID}/BRAINSTORM.md`

**验证**:
- [ ] BRAINSTORM.md 存在
- [ ] 包含「原始需求」章节 (用户原话)
- [ ] 包含「成功标准」章节
- [ ] 包含「方案探索」章节 (2-3种)
- [ ] 包含「最终决策」章节

---

### Stage 2.5: Research (Subagent Mandatory)

**目标**: 研究默认必跑，但将“研究型内容”隔离到 subagent，避免主会话上下文耗尽。

**Iron Law**: 大内容落盘，主会话只返回「决策摘要 + 文件路径」。

#### ✅ Mandatory: Call `flow-researcher` Subagent

> subagent 负责内部/外部研究、落盘、任务回填、研究整合与质量验证；主 agent 只做编排与最终 Gate。

```
Task tool call:
  description: "Run mandatory research for /flow-init (file-based memory)"
  subagent_type: "flow-researcher"
  model: "inherit"
  prompt: (JSON)
    {
      "reqId": "${REQ_ID}",
      "reqDir": "devflow/requirements/${REQ_ID}",
      "title": "${TITLE}",
      "planUrls": ["..."],
      "contextFiles": {
        "brainstorm": "devflow/requirements/${REQ_ID}/BRAINSTORM.md",
        "roadmap": "devflow/ROADMAP.md",
        "architecture": "devflow/ARCHITECTURE.md"
      }
    }
```

**期望输出** (由 subagent 写入):
- `devflow/requirements/${REQ_ID}/research/internal/codebase-overview.md`
- `devflow/requirements/${REQ_ID}/research/mcp/$(date +%Y%m%d)/**`
- `devflow/requirements/${REQ_ID}/research/research-summary.md`
- `devflow/requirements/${REQ_ID}/research/tasks.json` (decision/rationale/alternatives 完整)
- `devflow/requirements/${REQ_ID}/research/research.md` (可通过 validate-research)

---

### Stage 2.6: Research Consolidation

> 该阶段由 `flow-researcher` subagent 执行（包含 tasks 生成/回填/整合/校验）。

主 agent 在 Exit Gate 中只做最终验证与状态更新：
- Run: `{SCRIPT:validate_research} "${REQ_DIR}" --strict`
- `orchestration_status.json.phase0_complete = true`

---
### Stage 3: README Generation

```
生成工作流指南:
→ devflow/requirements/${REQ_ID}/README.md
→ 包含: 需求概述、工作流步骤、检查清单
```

---

### Stage 4: Exit Gate (5-Level Quality Check)

**5层验证**:

```
Level 1: File Existence Check
→ 验证所有必需文件已创建

Level 2: Research.md Structure Validation
→ Run: {SCRIPT:validate_research} "${REQ_DIR}" --strict
→ 检查 research.md 结构

Level 3: Research.md Content Quality
→ 无 TODO/FIXME/{{PLACEHOLDER}} 标记
→ 每个 Decision block 完整

Level 4: Research Tasks Validation
→ 验证 tasks.json 格式和内容

Level 5: Git & Status & Constitution
→ Git 分支创建成功
→ orchestration_status.json 正确
→ Constitution 符合性检查

→ 详见 {TEMPLATE:flow} Stage 4
```

---

## 输出产物

### Requirements

```
devflow/requirements/${REQ_ID}/
├── README.md
├── BRAINSTORM.md               # 需求的北极星 (Stage 2.3)
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

### Git

- **Branch**: `feature/${REQ_ID}-${slug(BRANCH_TITLE_EN)}`
- **Status**: orchestration_status.json.status = "initialized"
- **Phase**: orchestration_status.json.phase = "planning"

---

## 错误处理

**常见错误**:
→ 详见 `{GUIDE:troubleshoot}`

**主要错误场景**:
1. Invalid REQ_ID format → 检查格式
2. REQ_ID already exists → 使用不同 ID 或 --force
3. Git status not clean → commit/stash changes
4. Research validation failed → 手动补充 research.md
5. MCP fetch failed → 继续但标记待补项

**恢复步骤**:
→ 详见 `{GUIDE:troubleshoot}` Recovery Procedures

---

## Next Step

```
/flow-prd "${REQ_ID}"
```

生成产品需求文档

---

**Related Documentation**:
- [INIT_FLOW_TEMPLATE.md](../.claude/docs/templates/INIT_FLOW_TEMPLATE.md) - 详细执行流程
- [INIT_TROUBLESHOOTING.md](../.claude/docs/guides/INIT_TROUBLESHOOTING.md) - 故障排查指南
- [RESEARCH_TEMPLATE.md](../.claude/docs/templates/RESEARCH_TEMPLATE.md) - 研究模板格式
