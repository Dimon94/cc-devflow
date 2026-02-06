---
name: flow-spec
description: 'Unified specification phase: PRD → Tech+UI (parallel) → Epic/Tasks. Usage: /flow-spec "REQ-123" [--skip-tech] [--skip-ui]'
---

# Flow-Spec Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

统一规格阶段，合并 flow-prd/flow-tech/flow-ui/flow-epic 为单一命令，内部并行调度 Agent。

## Input Format

```bash
# Full Mode (默认)
/flow-spec "REQ_ID"

# Quick Mode (小需求)
/flow-spec "REQ_ID" --skip-tech --skip-ui

# Backend Only
/flow-spec "REQ_ID" --skip-ui

# Frontend Only
/flow-spec "REQ_ID" --skip-tech
```

## Mode Matrix

| Mode | Command | Agents | Output |
|------|---------|--------|--------|
| Full | `/flow-spec` | PRD + Tech + UI + Epic | PRD.md, TECH_DESIGN.md, UI_PROTOTYPE.html, EPIC.md, TASKS.md |
| Quick | `--skip-tech --skip-ui` | PRD + Epic | PRD.md, EPIC.md, TASKS.md |
| Backend | `--skip-ui` | PRD + Tech + Epic | PRD.md, TECH_DESIGN.md, EPIC.md, TASKS.md |
| Frontend | `--skip-tech` | PRD + UI + Epic | PRD.md, UI_PROTOTYPE.html, EPIC.md, TASKS.md |

## Entry Gate

```yaml
Prerequisites:
  1. REQ_ID 解析:
     - 从参数获取
     - 或从当前分支推断 (feature/REQ-XXX-*)
     - 或从 orchestration_status.json 获取

  2. BRAINSTORM.md 存在:
     - 路径: devflow/requirements/${REQ_ID}/BRAINSTORM.md
     - 必须包含: 需求描述、目标用户、核心功能

  3. Research 完成:
     - 路径: devflow/requirements/${REQ_ID}/research/research.md
     - 无 TODO/PLACEHOLDER

  4. Status Check:
     - orchestration_status.status ∈ {"initialized", "spec_failed"}

  5. Constitution Gate:
     - 读取 BRAINSTORM.md 验证需求边界
```

## Execution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        ENTRY GATE                                │
│  REQ_ID → BRAINSTORM.md → research.md → Status Check            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     STAGE 1: PRD Generation                      │
│  Agent: prd-writer                                               │
│  Output: PRD.md                                                  │
│  Rules: ANTI-EXPANSION, INVEST, [NEEDS CLARIFICATION]           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  STAGE 2: Parallel Execution                     │
│                                                                  │
│  ┌─────────────────────┐    ┌─────────────────────┐             │
│  │  tech-architect     │    │   ui-designer       │             │
│  │  (if !--skip-tech)  │    │  (if !--skip-ui)    │             │
│  │                     │    │                     │             │
│  │  Output:            │    │  Output:            │             │
│  │  - TECH_DESIGN.md   │    │  - UI_PROTOTYPE.html│             │
│  │  - data-model.md    │    │  - ui_design_       │             │
│  │  - contracts/       │    │    strategy.md      │             │
│  └─────────────────────┘    └─────────────────────┘             │
│                                                                  │
│  Parallel: Both agents run simultaneously via Task tool          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STAGE 3: Epic Generation                      │
│  Agent: planner                                                  │
│  Input: PRD.md + TECH_DESIGN.md (optional) + UI_PROTOTYPE.html  │
│  Output: EPIC.md + TASKS.md                                      │
│  Rules: TDD Order, Bite-Sized Tasks, Phase -1 Gates             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        EXIT GATE                                 │
│  1. PRD.md exists, no {{PLACEHOLDER}}                           │
│  2. TECH_DESIGN.md exists (if not skipped)                      │
│  3. UI_PROTOTYPE.html exists (if not skipped)                   │
│  4. EPIC.md exists                                               │
│  5. TASKS.md exists, TDD order correct                          │
│  6. Status: spec_complete                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Stage Details

### Stage 1: PRD Generation

```yaml
Agent: prd-writer (research-type)
Input:
  - BRAINSTORM.md
  - research/research.md
  - research/internal/codebase-overview.md

Output:
  - PRD.md

Rules:
  - ANTI-EXPANSION: 未提及 → [NEEDS CLARIFICATION]
  - NO TECH DETAILS: 只关注 WHAT/WHY
  - STORY INDEPENDENCE: 每个故事有独立测试
  - PRIORITY MANDATORY: P1, P2, P3...
  - MVP IDENTIFICATION: P1 = MVP

Validation:
  - 无 {{PLACEHOLDER}}
  - 所有故事有验收标准
  - Constitution Check 通过
```

### Stage 2: Parallel Execution

```yaml
Parallel Agents:
  tech-architect:
    Condition: !--skip-tech
    Input: PRD.md, research/codebase-overview.md
    Output: TECH_DESIGN.md, data-model.md, contracts/
    Rules:
      - ANTI-TECH-CREEP: 复用 baseline 技术栈
      - Simplicity Gate: ≤3 栈层
      - Integration-First: 契约先定义

  ui-designer:
    Condition: !--skip-ui AND PRD 含 UI 关键词
    Input: PRD.md, STYLE.md (optional)
    Output: UI_PROTOTYPE.html, ui_design_strategy.md
    Rules:
      - ANTI-GENERIC-DESIGN: 无占位图/AI紫蓝
      - 响应式: 3 断点
      - 交互完整: 所有状态

Execution:
  - 使用 Task tool 并行调用两个 agent
  - 等待两者完成后进入 Stage 3
```

### Stage 3: Epic Generation

```yaml
Agent: planner (research-type)
Input:
  - PRD.md
  - TECH_DESIGN.md (if exists)
  - UI_PROTOTYPE.html (if exists)

Output:
  - EPIC.md
  - TASKS.md

Rules:
  - TDD Order: Phase 2 (Tests) → Phase 3 (Implementation)
  - Bite-Sized Tasks: 每个 step 2-5 分钟
  - Phase -1 Gates: Simplicity, Anti-Abstraction, Integration-First
  - UI Integration: 如有 UI_PROTOTYPE.html，提取组件清单

Validation:
  - EPIC.md 无 {{PLACEHOLDER}}
  - TASKS.md TDD 顺序正确
  - Constitution Check 通过
```

## Exit Gate

```yaml
File Checks:
  - [ ] PRD.md exists, no {{PLACEHOLDER}}
  - [ ] TECH_DESIGN.md exists (if !--skip-tech)
  - [ ] UI_PROTOTYPE.html exists (if !--skip-ui AND UI detected)
  - [ ] EPIC.md exists, no {{PLACEHOLDER}}
  - [ ] TASKS.md exists, TDD order correct

Quality Checks:
  - [ ] PRD: ANTI-EXPANSION rules passed
  - [ ] TECH: ANTI-TECH-CREEP rules passed (if applicable)
  - [ ] UI: ANTI-GENERIC-DESIGN rules passed (if applicable)
  - [ ] EPIC: Phase -1 Gates passed

Status Update:
  - orchestration_status.status = "spec_complete"
  - orchestration_status.phase = "spec"
  - orchestration_status.outputs = [list of generated files]
```

## Output Structure

```
devflow/requirements/${REQ_ID}/
├── PRD.md                          # Always
├── TECH_DESIGN.md                  # If !--skip-tech
├── data-model.md                   # If !--skip-tech
├── contracts/                      # If !--skip-tech
│   └── openapi.yaml
├── quickstart.md                   # If !--skip-tech
├── UI_PROTOTYPE.html               # If !--skip-ui AND UI detected
├── EPIC.md                         # Always
├── TASKS.md                        # Always
├── research/
│   ├── research.md                 # Pre-existing
│   ├── codebase-tech-analysis.md   # If !--skip-tech
│   └── ui_design_strategy.md       # If !--skip-ui
└── orchestration_status.json       # Updated
```

## Error Handling

```yaml
Stage 1 Failure (PRD):
  - Log error to EXECUTION_LOG.md
  - Status: spec_failed
  - Retry: /flow-spec --retry

Stage 2 Failure (Tech/UI):
  - If tech-architect fails: Continue with UI, mark tech as skipped
  - If ui-designer fails: Continue without UI, mark ui as skipped
  - Log partial completion

Stage 3 Failure (Epic):
  - Log error to EXECUTION_LOG.md
  - Status: spec_failed
  - Retry: /flow-spec --retry --from=epic
```

## Backward Compatibility

旧命令仍可用，但显示 deprecation warning:

```bash
/flow-prd "REQ-123"   # ⚠️ Deprecated: Use /flow-spec instead
/flow-tech "REQ-123"  # ⚠️ Deprecated: Use /flow-spec instead
/flow-ui "REQ-123"    # ⚠️ Deprecated: Use /flow-spec instead
/flow-epic "REQ-123"  # ⚠️ Deprecated: Use /flow-spec instead
```

## Next Step

```bash
/flow-dev "${REQ_ID}"
```

## Agent References

| Agent | Purpose | Location |
|-------|---------|----------|
| prd-writer | PRD 生成 | `flow-prd/references/prd-writer.md` |
| tech-architect | 技术设计 | `flow-tech/references/tech-architect.md` |
| ui-designer | UI 原型 | `flow-ui/references/ui-designer.md` |
| planner | Epic/Tasks | `flow-epic/references/planner.md` |

## Constitution Compliance

- **Article I**: Complete implementation, no placeholders
- **Article II**: Reuse existing components
- **Article III**: No hardcoded secrets
- **Article VI**: TDD order enforced
- **Article VII**: Simplicity Gate
- **Article VIII**: Anti-Abstraction Gate
- **Article IX**: Integration-First Gate
- **Article X**: Requirement boundary enforced
