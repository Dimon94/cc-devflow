# Flow-Init Troubleshooting Guide

> Quick reference for `/flow:init` errors and recovery

---

## Core Errors

### E1: Invalid REQ_ID Format
```bash
❌ ERROR: REQ_ID format invalid
```
**Fix**: 使用格式 `REQ-123` 或 `BUG-456`（`^(REQ|BUG)-[0-9]+$`）

---

### E2: REQ_ID Already Exists
```bash
❌ ERROR: devflow/requirements/REQ-123/ already exists
```
**Fix**: 使用不同 ID 或 `/flow:init "REQ-123|..." --force` 强制覆盖

---

### E3: Git Status Not Clean
```bash
❌ ERROR: Git working directory has uncommitted changes
```
**Fix**: `git status` → `git commit` 或 `git stash`

---

### E4: Research Validation Failed
```bash
❌ ERROR: research.md validation failed (incomplete)
```
**Diagnose**: `grep -c "Decision:" devflow/requirements/REQ-123/research/research.md`
**Fix**: 手动补充 research.md Decision blocks 或重新运行 research 步骤

---

### E5: MCP Fetch Failed
```bash
⚠️ WARNING: MCP fetch timed out (Context7)
```
**Fix**: 继续执行但标记 `research/mcp/` 下的待补项，稍后手动补充

---

## Recovery Procedures

### Complete Restart
```bash
rm -rf devflow/requirements/REQ-123/
git branch -D feature/REQ-123-*
/flow:init "REQ-123|Title|URLs"
```

### Recover from Interruption
```bash
# 检查当前状态
cat devflow/requirements/REQ-123/orchestration_status.json | jq '.phase0_complete'

# 如果 false，补充研究材料
# 手动编辑 research/research.md → 添加 Decision blocks

# 更新状态
jq '.phase0_complete = true' devflow/requirements/REQ-123/orchestration_status.json > tmp.json
mv tmp.json devflow/requirements/REQ-123/orchestration_status.json

# 继续下一阶段
/flow:spec "REQ-123"
```

### Rebuild Research.md from Tasks.json
```bash
REQ_DIR="devflow/requirements/REQ-123"

# 从 tasks.json 生成 research.md
bash .claude/scripts/consolidate-research.sh "$REQ_DIR"

# 验证
bash .claude/scripts/validate-research.sh "$REQ_DIR"
```

---

## Configuration

### Environment Variables
| Variable | Default | Purpose |
|----------|---------|---------|
| `SKIP_MCP_RESEARCH` | `false` | 跳过外部 MCP 材料抓取 |
| `REQUIRE_CLEAN_GIT` | `true` | 要求 Git 状态干净 |

### Command-Line Flags
```bash
/flow:init "REQ-123|..." --force        # 强制覆盖现有需求
/flow:init --interactive                # 交互式输入模式
```

---

## FAQ

**Q: 如何跳过 MCP 研究阶段？**
A: `SKIP_MCP_RESEARCH=1 /flow:init "REQ-123|..."`

**Q: Context Loading 阶段找不到 ROADMAP.md 怎么办？**
A: 可选步骤，不影响执行。如需路线图，先运行 `/core-roadmap`

**Q: Research.md 格式要求？**
A: 至少包含 1 个 `### Decision:` block，每个 block 有 Rationale/Alternatives/Source

---

**Last Updated**: 2025-12-19
