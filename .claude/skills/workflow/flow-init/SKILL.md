---
name: flow-init
description: 'Initialize requirement structure with brainstorming and research. Usage: /flow-init "REQ-123|Title|URLs". Creates BRAINSTORM.md (north star) and research artifacts.'
---

# Flow-Init Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

初始化需求结构，包含头脑风暴和研究阶段。生成 BRAINSTORM.md 作为需求的「北极星」。

## Input Format

```
/flow-init "REQ_ID|TITLE|PLAN_URLS?"
/flow-init "REQ_ID|TITLE" --branch-only
/flow-init --interactive
```

- **REQ_ID**: `^(REQ|BUG)-[0-9]+$`
- **TITLE**: 需求简短标题
- **PLAN_URLS**: 计划文档URL (可选，逗号分隔)
- **--branch-only**: 使用传统分支模式 (不创建 worktree)

## Execution Flow

### Stage 1: Entry Gate

1. **参数解析**
   - 验证 REQ_ID 格式
   - 提取 TITLE 和 PLAN_URLS
   - 若 TITLE 含中文，意译生成 BRANCH_TITLE_EN

2. **前置检查**
   ```bash
   bash scripts/check-prerequisites.sh --json --paths-only
   ```
   - Git 状态干净
   - devflow/ 目录存在

3. **唯一性检查**
   - `devflow/requirements/${REQ_ID}/` 不存在

### Stage 1.2: Git Worktree (Default) or Branch

**Worktree 模式 (默认)**:
```bash
# 计算路径
REPO_NAME=$(basename $(git rev-parse --show-toplevel))
WORKTREE_DIR="../${REPO_NAME}-${REQ_ID}"
BRANCH_NAME="feature/${REQ_ID}-${slug(BRANCH_TITLE_EN)}"

# 创建 worktree + 分支
git worktree add -b "$BRANCH_NAME" "$WORKTREE_DIR"

# 切换到 worktree
cd "$WORKTREE_DIR"
```

**分支模式 (--branch-only)**:
```bash
# Requirements
git checkout -b feature/${REQ_ID}-${slug(BRANCH_TITLE_EN)}

# Bug Fixes
git checkout -b bugfix/${BUG_ID}-${slug(BRANCH_TITLE_EN)}
```

### Stage 1.5: Context Loading

检查并加载 (如存在):
- `devflow/ROADMAP.md`
- `devflow/ARCHITECTURE.md`

### Stage 2: Directory Init

```bash
bash scripts/create-requirement.sh "${REQ_ID}" --title "${TITLE}"
```

生成:
- `devflow/requirements/${REQ_ID}/README.md`
- `devflow/requirements/${REQ_ID}/EXECUTION_LOG.md`
- `devflow/requirements/${REQ_ID}/orchestration_status.json`
- `devflow/requirements/${REQ_ID}/research/`

### Stage 2.3: Brainstorming (MANDATORY)

**Iron Law**: `NO FLOW EXECUTION WITHOUT BRAINSTORM ALIGNMENT`

触发 `flow-brainstorming` skill，执行:

1. **Understanding** - 一次问一个问题
2. **Exploring** - 提出 2-3 种方案
3. **Presenting** - 分段呈现设计
4. **Documentation** - 输出 BRAINSTORM.md

**输出**: `devflow/requirements/${REQ_ID}/BRAINSTORM.md`

**验证**:
- [ ] BRAINSTORM.md 存在
- [ ] 包含「原始需求」章节
- [ ] 包含「成功标准」章节
- [ ] 包含「方案探索」章节
- [ ] 包含「最终决策」章节

### Stage 2.5: Research (Subagent)

调用 `flow-researcher` subagent:

```json
{
  "reqId": "${REQ_ID}",
  "reqDir": "devflow/requirements/${REQ_ID}",
  "title": "${TITLE}",
  "planUrls": ["..."],
  "contextFiles": {
    "brainstorm": "devflow/requirements/${REQ_ID}/BRAINSTORM.md"
  }
}
```

**输出**:
- `research/internal/codebase-overview.md`
- `research/mcp/YYYYMMDD/**`
- `research/research-summary.md`
- `research/tasks.json`
- `research/research.md`

### Stage 3: README Generation

生成 `devflow/requirements/${REQ_ID}/README.md`

### Stage 4: Exit Gate (5-Level)

```bash
# Level 2: Structure validation
bash scripts/validate-research.sh "${REQ_DIR}" --strict
```

**验证**:
1. File Existence
2. Research.md Structure
3. Content Quality (无 TODO/PLACEHOLDER)
4. Tasks.json Validation
5. Git & Status & Constitution

## Output Artifacts

```
devflow/requirements/${REQ_ID}/
├── README.md
├── BRAINSTORM.md           # 北极星
├── research/
│   ├── internal/
│   │   └── codebase-overview.md
│   ├── mcp/YYYYMMDD/
│   ├── research.md
│   ├── research-summary.md
│   └── tasks.json
├── EXECUTION_LOG.md
└── orchestration_status.json
```

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `scripts/check-prerequisites.sh` | 前置条件检查 |
| `scripts/create-requirement.sh` | 创建目录结构 |
| `scripts/generate-research-tasks.sh` | 生成研究任务 |
| `scripts/populate-research-tasks.sh` | 填充任务内容 |
| `scripts/consolidate-research.sh` | 整合研究结果 |
| `scripts/validate-research.sh` | 验证研究质量 |

## Templates Reference

| Template | Purpose |
|----------|---------|
| `assets/INIT_FLOW_TEMPLATE.md` | 详细执行流程 |
| `assets/RESEARCH_TEMPLATE.md` | 研究文档格式 |
| `assets/BRAINSTORM_TEMPLATE.md` | 头脑风暴模板 |

## Agent Reference

| Agent | Purpose |
|-------|---------|
| `references/flow-researcher.md` | 研究 subagent 指令 |

## Error Handling

| Error | Solution |
|-------|----------|
| Invalid REQ_ID | 检查格式 `^(REQ\|BUG)-[0-9]+$` |
| REQ_ID exists | 使用不同 ID 或 --force |
| Git not clean | commit/stash changes |
| Research validation failed | 手动补充 research.md |

## Next Step

```
/flow-prd "${REQ_ID}"
```

---

**Related Skills**:
- `flow-brainstorming` - 头脑风暴
- `flow-prd` - PRD 生成
