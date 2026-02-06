---
name: flow-tech
description: 'Generate Technical Design package. Usage: /flow-tech "REQ-123" or /flow-tech'
---

# Flow-Tech Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

生成技术设计方案，包含系统架构、数据模型、API 契约等。

## Input Format

```
/flow-tech "REQ_ID"
/flow-tech             # Auto-detect
```

## Entry Gate

1. **PRD.md** 完整且无 `{{PLACEHOLDER}}`
2. **research/research.md** 存在
3. **Status**: `prd_complete` 或 `ui_complete`

## Anti-Tech-Creep Gate

- 读取 `CLAUDE.md` 技术架构章节
- 对照 `research/internal/codebase-overview.md`
- 禁止引入新技术或替换既有栈（除非明确说明）

## Execution Flow

### Stage 1: Context Loading

加载:
- PRD.md
- research/research.md
- research/internal/codebase-overview.md
- UI_PROTOTYPE.html (可选)

### Stage 2: Tech Analysis

执行技术分析脚本:
- 输出: research/codebase-tech-analysis.md
- 内容: 数据模型、API 模式、认证、安全、可复用组件

### Stage 3: Agent Invocation

调用 `tech-architect` agent:
- 输出: TECH_DESIGN.md
- 派生: data-model.md, contracts/openapi.yaml, quickstart.md

### Stage 4: Exit Gate

1. TECH_DESIGN.md 存在
2. data-model.md 存在
3. contracts/ 目录存在
4. quickstart.md 存在
5. Status: `tech_design_complete`

## Output

```
devflow/requirements/${REQ_ID}/
├── TECH_DESIGN.md
├── data-model.md
├── contracts/
│   └── openapi.yaml
├── quickstart.md
└── research/codebase-tech-analysis.md
```

## Constitution Compliance

- **Simplicity Gate**: ≤3 栈层
- **Anti-Abstraction Gate**: 直接使用框架
- **Integration-First Gate**: 契约先定义

## Next Step

```
/flow-epic "${REQ_ID}"
```
