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

| Mode | Command | Agents | Execution |
|------|---------|--------|-----------|
| Full | `/flow-spec` | PRD + Tech + UI + Epic | **Team Mode** (v4.7) |
| Quick | `--skip-tech --skip-ui` | PRD + Epic | Subagent Mode |
| Backend | `--skip-ui` | PRD + Tech + Epic | Subagent Mode |
| Frontend | `--skip-tech` | PRD + UI + Epic | Subagent Mode |

## Execution Mode Detection (v4.7)

```yaml
Mode Detection:
  if (--skip-tech OR --skip-ui):
    mode: subagent    # 简单模式，无需协商
  else:
    mode: team        # Full Mode，需要协商

Team Mode Benefits:
  - tech-architect 和 ui-designer 可实时协商
  - 解决 API 格式、字段命名等共享决策
  - 减少返工率 ~60%

Script: scripts/team-init.sh detect [skip_tech] [skip_ui]
```

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
# =============================================================================
# Team Mode (Full Mode, v4.7)
# =============================================================================
Team Mode:
  Condition: !--skip-tech AND !--skip-ui

  Team: spec-design-team
    Lead: spec-lead (main agent)
    Teammates:
      - tech-architect: 技术设计
      - ui-designer: UI 原型

  # ---------------------------------------------------------------------------
  # Team Mode Execution Steps (详细)
  # ---------------------------------------------------------------------------
  Execution Steps:

    Step 1 - 初始化 Team:
      Action: 调用 scripts/team-init.sh init
      Result: 创建 spec-design-team，设置 lead 为当前 agent
      State Update: orchestration_status.team.mode = "parallel"

    Step 2 - Spawn Teammates:
      Action: 使用 Task tool 并行 spawn 两个 agent
      Parallel:
        - Task: tech-architect
          Agent: flow-tech/references/tech-architect.md
          Input: PRD.md, research/codebase-overview.md
          Output: TECH_DESIGN.md, data-model.md, contracts/

        - Task: ui-designer
          Agent: flow-ui/references/ui-designer.md
          Input: PRD.md, STYLE.md (optional)
          Output: UI_PROTOTYPE.html, ui_design_strategy.md

    Step 3 - 协商协议 (SendMessage):
      Trigger: tech-architect 完成初稿后发起
      Protocol: Direct Message via SendMessage tool
      Topics:
        - api_format: API 响应格式
        - field_naming: 数据字段命名
        - auth_strategy: 认证策略
        - state_management: 前端状态管理
      Output: design_decisions.md (协商结果记录)

    Step 4 - 等待完成:
      Mechanism: 监听 TeammateIdle 事件
      Condition: 两者都完成后进入 Stage 3
      Timeout: 30 minutes (可配置)

    Step 5 - 清理 Team:
      Action: 发送 shutdown_request 给 teammates
      Cleanup: 调用 TeamDelete 清理 Team 状态

  # ---------------------------------------------------------------------------
  # SendMessage 协商协议 (v4.7)
  # ---------------------------------------------------------------------------
  Negotiate Protocol:

    # -------------------------------------------------------------------------
    # Topic 1: API Format 协商
    # -------------------------------------------------------------------------
    api_format:
      Initiator: tech-architect
      Responder: ui-designer
      Decision Owner: tech-architect

      Message Flow:
        1. tech-architect → ui-designer:
           SendMessage:
             type: "message"
             recipient: "ui-designer"
             content: |
               API 响应格式建议采用 REST + JSON。
               - 分页: cursor-based (nextCursor 字段)
               - 错误格式: { code, message, details }
               - 时间格式: ISO 8601
               请确认是否与前端需求一致。
             summary: "API 格式协商请求"

        2. ui-designer → tech-architect:
           SendMessage:
             type: "message"
             recipient: "tech-architect"
             content: |
               确认 REST + JSON 格式。
               建议补充:
               - 分页响应包含 hasMore 字段便于前端判断
               - 列表接口支持 limit 参数 (默认 20)
             summary: "API 格式确认 + 补充建议"

        3. tech-architect 更新 TECH_DESIGN.md 并记录到 design_decisions.md

    # -------------------------------------------------------------------------
    # Topic 2: Field Naming 协商
    # -------------------------------------------------------------------------
    field_naming:
      Initiator: tech-architect
      Responder: ui-designer
      Decision Owner: tech-architect

      Message Flow:
        1. tech-architect → ui-designer:
           SendMessage:
             type: "message"
             recipient: "ui-designer"
             content: |
               数据模型字段命名规范建议:
               - API 响应: camelCase (userId, createdAt)
               - 数据库: snake_case (user_id, created_at)
               - 前端 props: camelCase
               核心实体字段: id, name, status, createdAt, updatedAt
               请确认是否与 UI 组件 props 一致。
             summary: "字段命名规范协商"

        2. ui-designer → tech-architect:
           SendMessage:
             type: "message"
             recipient: "tech-architect"
             content: |
               确认 camelCase 命名。
               UI 组件需要的额外字段:
               - displayName (用于展示)
               - isActive (布尔状态)
               - avatarUrl (头像链接)
             summary: "字段命名确认"

    # -------------------------------------------------------------------------
    # Topic 3: Auth Strategy 协商
    # -------------------------------------------------------------------------
    auth_strategy:
      Initiator: tech-architect
      Responder: ui-designer
      Decision Owner: tech-architect

      Message Flow:
        1. tech-architect → ui-designer:
           SendMessage:
             type: "message"
             recipient: "ui-designer"
             content: |
               认证策略建议采用 JWT:
               - Access Token: 15 分钟过期
               - Refresh Token: 7 天过期
               - 存储: httpOnly cookie (推荐) 或 localStorage
               前端需要处理 token 刷新逻辑。
             summary: "认证策略协商"

        2. ui-designer → tech-architect:
           SendMessage:
             type: "message"
             recipient: "tech-architect"
             content: |
               确认 JWT 方案。
               前端实现:
               - 使用 axios interceptor 自动刷新
               - 401 响应触发 refresh 流程
               - refresh 失败跳转登录页
             summary: "认证策略确认"

    # -------------------------------------------------------------------------
    # Topic 4: State Management 协商
    # -------------------------------------------------------------------------
    state_management:
      Initiator: ui-designer
      Responder: tech-architect
      Decision Owner: ui-designer

      Message Flow:
        1. ui-designer → tech-architect:
           SendMessage:
             type: "message"
             recipient: "tech-architect"
             content: |
               前端状态管理建议采用 Zustand:
               - 全局状态: user, theme, notifications
               - 服务端状态: 使用 React Query 管理
               - 表单状态: 组件内部 useState
               API 缓存策略需要后端支持 ETag 或 Last-Modified。
             summary: "状态管理方案协商"

        2. tech-architect → ui-designer:
           SendMessage:
             type: "message"
             recipient: "ui-designer"
             content: |
               确认 Zustand + React Query 方案。
               后端支持:
               - 列表接口返回 ETag header
               - 详情接口返回 Last-Modified
               - 支持 If-None-Match 条件请求
             summary: "状态管理确认"

  # ---------------------------------------------------------------------------
  # 协商结果记录
  # ---------------------------------------------------------------------------
  Decision Record:
    Path: devflow/requirements/${REQ_ID}/research/design_decisions.md
    Format: |
      # Design Decisions

      > 由 spec-design-team 协商生成
      > 生成时间: ${TIMESTAMP}

      ## API Format
      **决策**: REST + JSON, cursor-based pagination
      **参与者**: tech-architect, ui-designer
      **原因**: 前后端一致性，便于缓存

      ## Field Naming
      **决策**: camelCase for API, snake_case for DB
      **参与者**: tech-architect, ui-designer
      **原因**: 行业标准，前端友好

      ## Auth Strategy
      **决策**: JWT with refresh token
      **参与者**: tech-architect, ui-designer
      **原因**: 无状态，可扩展

      ## State Management
      **决策**: Zustand + React Query
      **参与者**: ui-designer, tech-architect
      **原因**: 轻量级，服务端状态分离

  Negotiate Topics:
    - api_format: API 响应格式 (REST/GraphQL)
    - field_naming: 数据字段命名规范
    - auth_strategy: 认证策略
    - state_management: 前端状态管理

# =============================================================================
# Subagent Mode (Simplified Modes)
# =============================================================================
Subagent Mode:
  Condition: --skip-tech OR --skip-ui

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
    - 使用 Task tool 并行调用 agent
    - 等待完成后进入 Stage 3
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
