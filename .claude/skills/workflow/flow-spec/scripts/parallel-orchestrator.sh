#!/bin/bash
# ============================================================================
# flow-spec Parallel Orchestrator
# ============================================================================
# [INPUT]: REQ_ID, 模式标志
# [OUTPUT]: 并行执行状态
# [POS]: 协调 tech-architect 和 ui-designer 的并行执行
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# ============================================================================

# 注意: 此脚本主要用于文档目的
# 实际的并行执行由 Claude 的 Task tool 处理
# 此脚本提供执行逻辑的参考实现

set -euo pipefail

# ============================================================================
# 参数解析
# ============================================================================

REQ_ID=""
SKIP_TECH=false
SKIP_UI=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tech)
            SKIP_TECH=true
            shift
            ;;
        --skip-ui)
            SKIP_UI=true
            shift
            ;;
        *)
            if [[ -z "$REQ_ID" ]]; then
                REQ_ID="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$REQ_ID" ]]; then
    echo "ERROR: REQ_ID required"
    exit 1
fi

# ============================================================================
# 路径定义
# ============================================================================

REQ_DIR="devflow/requirements/${REQ_ID}"
PRD_FILE="${REQ_DIR}/PRD.md"
EXECUTION_LOG="${REQ_DIR}/EXECUTION_LOG.md"

# ============================================================================
# 并行执行逻辑 (伪代码)
# ============================================================================

cat << 'EOF'
============================================
Parallel Orchestration Logic
============================================

This script documents the parallel execution strategy.
Actual execution is handled by Claude's Task tool.

Execution Flow:
---------------

1. PRD Generation (Sequential - Must complete first)
   Agent: prd-writer
   Output: PRD.md

2. Parallel Execution (After PRD completes)

   ┌─────────────────────────────────────────────────────┐
   │                                                     │
   │  ┌─────────────────┐    ┌─────────────────┐        │
   │  │ tech-architect  │    │  ui-designer    │        │
   │  │                 │    │                 │        │
   │  │ Condition:      │    │ Condition:      │        │
   │  │ !--skip-tech    │    │ !--skip-ui AND  │        │
   │  │                 │    │ UI keywords in  │        │
   │  │                 │    │ PRD             │        │
   │  │                 │    │                 │        │
   │  │ Output:         │    │ Output:         │        │
   │  │ - TECH_DESIGN   │    │ - UI_PROTOTYPE  │        │
   │  │ - data-model    │    │ - ui_design_    │        │
   │  │ - contracts/    │    │   strategy.md   │        │
   │  └────────┬────────┘    └────────┬────────┘        │
   │           │                      │                 │
   │           └──────────┬───────────┘                 │
   │                      │                             │
   │                      ▼                             │
   │              Wait for both                         │
   │                                                    │
   └─────────────────────────────────────────────────────┘

3. Epic Generation (After parallel stage completes)
   Agent: planner
   Input: PRD.md + TECH_DESIGN.md (optional) + UI_PROTOTYPE.html (optional)
   Output: EPIC.md + TASKS.md

Claude Task Tool Usage:
-----------------------

// Stage 2: Parallel execution
const tasks = [];

if (!skipTech) {
  tasks.push(Task({
    subagent_type: "tech-architect",
    prompt: `Generate TECH_DESIGN.md for ${REQ_ID}`,
    description: "Tech design generation"
  }));
}

if (!skipUI && hasUIKeywords) {
  tasks.push(Task({
    subagent_type: "ui-designer",
    prompt: `Generate UI_PROTOTYPE.html for ${REQ_ID}`,
    description: "UI prototype generation"
  }));
}

// Execute in parallel
await Promise.all(tasks);

Error Handling:
---------------

- If tech-architect fails: Continue with UI, mark tech as skipped
- If ui-designer fails: Continue without UI, mark ui as skipped
- If both fail: Log error, status = spec_failed

Timing Expectations:
--------------------

| Stage | Duration | Notes |
|-------|----------|-------|
| PRD   | 2-3 min  | Sequential |
| Tech  | 2-3 min  | Parallel |
| UI    | 2-3 min  | Parallel |
| Epic  | 2-3 min  | Sequential |
| Total | 5-8 min  | With parallelization |

Without parallelization: 8-12 min
Improvement: ~35% time reduction

============================================
EOF

# ============================================================================
# 检测 UI 关键词
# ============================================================================

echo ""
echo "Checking PRD for UI keywords..."

if [[ -f "$PRD_FILE" ]]; then
    if grep -qiE '用户界面|前端|页面|交互|UI|界面设计|Web页面' "$PRD_FILE"; then
        echo "✓ UI keywords detected in PRD"
        echo "  ui-designer will be invoked (unless --skip-ui)"
    else
        echo "⊘ No UI keywords in PRD"
        echo "  ui-designer will be skipped"
    fi
else
    echo "✗ PRD.md not found"
fi

# ============================================================================
# 输出执行计划
# ============================================================================

echo ""
echo "============================================"
echo "Execution Plan for $REQ_ID"
echo "============================================"
echo ""
echo "Stage 1: PRD Generation"
echo "  Agent: prd-writer"
echo "  Status: Pending"
echo ""
echo "Stage 2: Parallel Execution"
if [[ "$SKIP_TECH" == "false" ]]; then
    echo "  [A] tech-architect: Enabled"
else
    echo "  [A] tech-architect: Skipped (--skip-tech)"
fi
if [[ "$SKIP_UI" == "false" ]]; then
    echo "  [B] ui-designer: Enabled (if UI keywords)"
else
    echo "  [B] ui-designer: Skipped (--skip-ui)"
fi
echo ""
echo "Stage 3: Epic Generation"
echo "  Agent: planner"
echo "  Status: Pending"
echo ""
echo "============================================"

exit 0
