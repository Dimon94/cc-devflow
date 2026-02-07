---
name: flow-spec
description: 'Unified specification phase: PRD → Tech+UI (parallel) → Epic/Tasks. Usage: /flow-spec "REQ-123" [--skip-tech] [--skip-ui]'
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  validate_research: .claude/scripts/validate-research.sh
  validate_constitution: .claude/scripts/validate-constitution.sh
---

# Flow-Spec - 统一规格阶段命令

> **v4.1 新增**: 合并 flow-prd/flow-tech/flow-ui/flow-epic 为单一命令

## User Input

```text
$ARGUMENTS = "REQ_ID [--skip-tech] [--skip-ui]"
```

若未提供 REQ_ID 则根据当前分支或 `DEVFLOW_REQ_ID` 自动解析。

## 命令格式

```bash
# Full Mode (默认) - PRD + Tech + UI + Epic
/flow-spec "REQ-123"

# Quick Mode (小需求) - PRD + Epic only
/flow-spec "REQ-123" --skip-tech --skip-ui

# Backend Only - PRD + Tech + Epic
/flow-spec "REQ-123" --skip-ui

# Frontend Only - PRD + UI + Epic
/flow-spec "REQ-123" --skip-tech
```

## Mode Matrix

| Mode | Flags | Agents | Output |
|------|-------|--------|--------|
| Full | (default) | PRD + Tech + UI + Epic | PRD.md, TECH_DESIGN.md, UI_PROTOTYPE.html, EPIC.md, TASKS.md |
| Quick | `--skip-tech --skip-ui` | PRD + Epic | PRD.md, EPIC.md, TASKS.md |
| Backend | `--skip-ui` | PRD + Tech + Epic | PRD.md, TECH_DESIGN.md, EPIC.md, TASKS.md |
| Frontend | `--skip-tech` | PRD + UI + Epic | PRD.md, UI_PROTOTYPE.html, EPIC.md, TASKS.md |

## 执行流程

**加载 Skill 指令**:
```
→ 读取 .claude/skills/workflow/flow-spec/SKILL.md
→ 按 SKILL.md 中定义的 Execution Flow 执行
```

### 阶段 1: Entry Gate

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

### 阶段 2: PRD Generation (Sequential)

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
```

### 阶段 3: Tech + UI (Parallel)

```yaml
Parallel Execution:
  tech-architect (if !--skip-tech):
    Input: PRD.md, research/codebase-overview.md
    Output: TECH_DESIGN.md, data-model.md, contracts/

  ui-designer (if !--skip-ui AND UI detected):
    Input: PRD.md, STYLE.md (optional)
    Output: UI_PROTOTYPE.html, ui_design_strategy.md

Method:
  - 使用 Task tool 并行调用两个 agent
  - 等待两者完成后进入 Stage 4
```

### 阶段 4: Epic Generation (Sequential)

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
```

### 阶段 5: Exit Gate

```yaml
File Checks:
  - [ ] PRD.md exists, no {{PLACEHOLDER}}
  - [ ] TECH_DESIGN.md exists (if !--skip-tech)
  - [ ] UI_PROTOTYPE.html exists (if !--skip-ui AND UI detected)
  - [ ] EPIC.md exists, no {{PLACEHOLDER}}
  - [ ] TASKS.md exists, TDD order correct

Status Update:
  - orchestration_status.status = "spec_complete"
  - orchestration_status.phase = "spec"
```

## 输出

```
devflow/requirements/${REQ_ID}/
├── PRD.md                          # Always
├── TECH_DESIGN.md                  # If !--skip-tech
├── data-model.md                   # If !--skip-tech
├── contracts/openapi.yaml          # If !--skip-tech
├── UI_PROTOTYPE.html               # If !--skip-ui AND UI detected
├── EPIC.md                         # Always
├── TASKS.md                        # Always
└── orchestration_status.json       # Updated
```

## 错误处理

- **Entry Gate 失败**: 返回具体缺失项，指导用户运行 `/flow-init`
- **PRD 生成失败**: status = "spec_failed"，可重试
- **Tech/UI 失败**: 继续执行，标记为 skipped
- **Epic 失败**: status = "spec_failed"，可用 `--from=epic` 重试

## 下一步

```bash
/flow-dev "${REQ_ID}"
```

## Agent References

| Agent | Purpose | Location |
|-------|---------|----------|
| prd-writer | PRD 生成 | `.claude/agents/prd-writer.md` |
| tech-architect | 技术设计 | `.claude/agents/tech-architect.md` |
| ui-designer | UI 原型 | `.claude/agents/ui-designer.md` |
| planner | Epic/Tasks | `.claude/agents/planner.md` |

## 详细指令

完整执行逻辑见: `.claude/skills/workflow/flow-spec/SKILL.md`
