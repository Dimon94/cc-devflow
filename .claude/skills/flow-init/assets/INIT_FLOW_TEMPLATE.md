# Flow-Init Execution Flow Template

> Detailed stages for `/flow-init` requirement bootstrap

<!-- ============================================================
     调用上下文声明 (Invocation Context Declaration)
     ============================================================

本模板由 `/flow-init` 命令通过 {TEMPLATE:flow} 引用加载。

模板中的 {SCRIPT:xxx} 占位符引用 flow-init.md 头文件中的 scripts 定义。
============================================================ -->

---

## Stage 1: Entry Gate (参数验证)

```bash
# 1. 解析参数
REQ_ID|TITLE|PLAN_URLS → 验证 REQ_ID 格式: ^(REQ|BUG)-[0-9]+$

# 2. 前置条件检查
bash {SCRIPT:prereq} --json --paths-only
→ Git 状态可用 + devflow/ 目录存在

# 3. 目录唯一性检查
→ 确认 devflow/requirements/${REQ_ID}/ 不存在
```

---

## Stage 2: Directory Initialization

```bash
# 运行 bootstrap 脚本 / harness init
bash {SCRIPT:create} "${REQ_ID}" --title "${TITLE}" --json

# canonical output
devflow/requirements/${REQ_ID}/
├── harness-state.json
├── context-package.md
└── research/ (如使用 research bootstrap)

# compatibility files may still exist in some repos
devflow/requirements/${REQ_ID}/
├── EXECUTION_LOG.md
└── orchestration_status.json
```

---

## Stage 2.5: Research (Subagent Mandatory)

**目标**: 研究默认必跑，但研究过程必须“隔离上下文”。

**规则**: 大内容写入 `research/`，主会话只保留路径引用与决策摘要。

### Mandatory: Call `flow-researcher` Subagent

```
Task tool call:
  subagent_type: "flow-researcher"
  prompt: (JSON) reqId/reqDir/title/planUrls/contextFiles
```

**产物** (由 subagent 写入):
- `research/internal/codebase-overview.md`
- `research/mcp/$(date +%Y%m%d)/**`
- `research/research-summary.md`
- `research/tasks.json`
- `research/research.md`

---

## Stage 3: README Generation

```bash
# 如仓库保留 requirement README，则刷新说明
→ devflow/requirements/${REQ_ID}/README.md
→ 说明 bootstrap 输出、intent memory 与下一步命令
```

---

## Stage 4: Exit Gate

### Level 1: File Existence Check
```bash
→ 验证 `harness-state.json` 与 `context-package.md` 已创建
```

### Level 2: Research.md Structure Validation
```bash
bash {SCRIPT:validate_research} "${REQ_DIR}" --strict
→ 检查 research.md 结构
```

### Level 3: Research Tasks Validation
```bash
→ 验证 tasks.json 格式和内容
```

### Level 4: Status Validation
```bash
→ harness-state.json.status == "initialized"
```

---

## Output Structure

```text
devflow/requirements/${REQ_ID}/
├── harness-state.json
├── context-package.md
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
└── README.md (optional)

devflow/intent/${REQ_ID}/
├── summary.md
├── plan.md
└── resume-index.md

compatibility (optional):
├── EXECUTION_LOG.md
└── orchestration_status.json
```

**Status**:
- `harness-state.json.status = "initialized"`
- `context-package.md` exists
- Next canonical command: `/flow:spec "${REQ_ID}"`

---

**Last Updated**: 2026-03-26
