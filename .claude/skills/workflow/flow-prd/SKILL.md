---
name: flow-prd
description: 'Generate Product Requirements Document with ANTI-EXPANSION enforcement. Usage: /flow-prd "REQ-123" or /flow-prd'
---

# Flow-PRD Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

生成产品需求文档 (PRD)，强制执行 ANTI-EXPANSION 规则，确保需求边界清晰。

## Input Format

```
/flow-prd "REQ_ID"
/flow-prd             # Auto-detect from branch
```

## Entry Gate

1. **REQ_ID 解析**
   - 从参数或当前分支获取

2. **Brainstorm Alignment Check**
   - 读取 `BRAINSTORM.md`
   - 验证必需章节存在

3. **Research Quality Check**
   - 验证 `research/research.md` 质量
   - 无 TODO/PLACEHOLDER

4. **Status Check**
   - `orchestration_status.status ∈ {"initialized", "prd_generation_failed"}`

## Execution Flow

### Stage 1: Context Loading

加载上下文:
- `BRAINSTORM.md` (北极星)
- `research/research.md`
- `research/internal/codebase-overview.md`

### Stage 2: PRD Generation

调用 `prd-writer` agent:
- 输入: REQ_ID, Title, research 集合
- 输出: PRD.md

**ANTI-EXPANSION Rules**:
- NO SPECULATION: 未提及 → `[NEEDS CLARIFICATION]`
- NO TECH DETAILS: 只关注 WHAT/WHY
- STORY INDEPENDENCE: 每个故事有独立测试
- PRIORITY MANDATORY: P1, P2, P3...
- MVP IDENTIFICATION: P1 = MVP

### Stage 3: Exit Gate

1. **File Existence**: PRD.md 存在
2. **Structure Check**: 无 `{{PLACEHOLDER}}`
3. **Constitution Check**: 合规验证
4. **Status Update**: `prd_complete`

## Output

```
devflow/requirements/${REQ_ID}/
└── PRD.md
```

## Agent Reference

| Agent | Purpose |
|-------|---------|
| `references/prd-writer.md` | PRD 生成 agent |

## Anti-Expansion Checklist

- [ ] NO SPECULATION
- [ ] ALL UNCLEAR MARKED
- [ ] NO TECH DETAILS
- [ ] PRIORITIES ASSIGNED
- [ ] INDEPENDENT TEST
- [ ] MVP IDENTIFIED

## Next Step

```
/flow-tech "${REQ_ID}"   # 技术设计
/flow-epic "${REQ_ID}"   # Epic 规划
```
