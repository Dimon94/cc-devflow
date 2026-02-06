---
name: flow-ui
description: 'Generate interactive HTML prototype from PRD. Usage: /flow-ui "REQ-123" or /flow-ui'
---

# Flow-UI Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

生成交互式 HTML 原型，采样 80+ 设计大师风格。

## Input Format

```
/flow-ui "REQ_ID"
/flow-ui             # Auto-detect
```

## Trigger Conditions

- **自动触发**: PRD 含 UI 关键词（用户界面、前端、页面、交互）
- **手动触发**: 用户显式调用
- **自动跳过**: PRD 标注"纯后端/无 UI"

## Entry Gate

1. **PRD.md** 完整且无 `{{PLACEHOLDER}}`
2. **research/research.md** 存在
3. **Status**: `prd_complete`

## Execution Flow

### Stage 1: Style Loading

1. 检查 `devflow/STYLE.md` 是否存在
2. 如存在: 作为首要参考（优先级最高）
3. 如不存在: 使用默认采样策略

### Stage 2: Design Strategy

从 PRD 抽取风格线索:
- 背景/目标、用户画像、NFR 视觉要求
- 关键词映射到设计流派/大师

输出: `research/ui_design_strategy.md`

### Stage 3: Agent Invocation

调用 `ui-designer` agent:
- 输入: PRD.md, ui_design_strategy.md, STYLE.md (可选)
- 输出: UI_PROTOTYPE.html
- 要求: 响应式断点、交互状态、组件清单

### Stage 4: Exit Gate

1. UI_PROTOTYPE.html 存在
2. research/ui_design_strategy.md 存在
3. Status: `ui_complete` 或 `ui_skipped`

## Output

```
devflow/requirements/${REQ_ID}/
├── UI_PROTOTYPE.html
└── research/ui_design_strategy.md
```

## Design Masters Sampling

| 风格关键词 | 设计流派 |
|-----------|---------|
| 现代/简约 | Josef Müller-Brockmann, Massimo Vignelli |
| 科技感/创新 | Refik Anadol, John Maeda |
| 典雅/文化 | 原研哉, Paula Scher |
| 活泼/年轻 | David Carson, Henri Matisse |
| 企业级/严肃 | Le Corbusier, Dieter Rams |

## Next Step

```
/flow-tech "${REQ_ID}"  # 或
/flow-epic "${REQ_ID}"
```
