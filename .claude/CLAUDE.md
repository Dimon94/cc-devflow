# CC-DevFlow .claude Directory Architecture

## Purpose
This directory contains Claude Code CLI extensions for the CC-DevFlow development workflow system.

## Directory Structure (v4.3 Skills-First Architecture)

```
.claude/
├── skills/                    # Skills 目录 (核心)
│   ├── workflow.yaml          # 工作流依赖图定义 [NEW: v4.0]
│   │
│   ├── workflow/              # 工作流 Skills [NEW: v4.0]
│   │   ├── flow-init/         # 需求初始化 (支持 worktree)
│   │   │   ├── SKILL.md       # 核心指令 (<500 行)
│   │   │   ├── context.jsonl  # 上下文定义 (借鉴 Trellis)
│   │   │   ├── scripts/       # 内嵌脚本
│   │   │   ├── references/    # Agent 指令
│   │   │   └── assets/        # 模板
│   │   ├── flow-spec/         # 统一规格阶段 [NEW: v4.1] ⭐
│   │   ├── flow-prd/          # PRD 生成 (deprecated, use flow-spec)
│   │   ├── flow-tech/         # 技术设计 (deprecated, use flow-spec)
│   │   ├── flow-ui/           # UI 原型 (deprecated, use flow-spec)
│   │   ├── flow-epic/         # Epic/Tasks (deprecated, use flow-spec)
│   │   ├── flow-dev/          # 开发执行
│   │   └── flow-release/      # 发布管理 (支持 worktree 清理)
│   │
│   ├── domain/                # 领域 Skills
│   │   ├── tdd/               # TDD Iron Law
│   │   ├── debugging/         # 系统化调试
│   │   ├── brainstorming/     # 头脑风暴
│   │   └── using-git-worktrees/  # Git Worktree 管理 [NEW: v4.3] ⭐
│   │
│   ├── guardrail/             # 守护 Skills
│   │   ├── constitution-guardian/
│   │   └── tdd-enforcer/
│   │
│   └── utility/               # 工具 Skills
│       ├── git-commit/
│       └── npm-release/
│
├── commands/                  # 命令目录 (v4.2 命名空间重构)
│   ├── flow/                  # 工作流命令 (20个) → /flow:xxx
│   ├── core/                  # 核心命令 (4个) → /core:xxx
│   └── util/                  # 工具命令 (4个) → /util:xxx
├── agents/                    # Agent 指令 (迁移到 skills/*/references/)
├── hooks/                     # 钩子脚本
│   ├── inject-skill-context.ts  # 上下文注入钩子 [NEW: v4.0]
│   ├── ralph-loop.ts            # Ralph Loop 程序化验证 [NEW: v4.4]
│   ├── teammate-idle-hook.ts    # Team 任务调度器 [NEW: v4.7] ⭐
│   ├── task-completed-hook.ts   # 任务完成验证器 [NEW: v4.7] ⭐
│   └── types/
│       └── team-types.d.ts      # Team 状态类型定义 [NEW: v4.7]
├── scripts/                   # 共享脚本
│   └── common.sh              # 通用函数 (含 worktree 辅助函数)
└── docs/templates/            # 共享模板
    └── _shared/               # 共享模板组件 [NEW: v4.1]
        ├── CONSTITUTION_CHECK.md
        ├── VALIDATION_CHECKLIST.md
        └── YAML_FRONTMATTER.md

devflow/
├── spec/                      # 分层规范库 [NEW: v4.0]
│   ├── frontend/index.md      # 前端规范
│   ├── backend/index.md       # 后端规范
│   └── shared/index.md        # 共享规范
└── requirements/              # 需求目录
```

## v4.0 Skills-First Architecture

### 核心创新 (借鉴 Trellis + OpenSpec)

| 来源 | 创新点 | 应用方式 |
|------|--------|----------|
| **Trellis** | JSONL 上下文注入 | 每个 Skill 有 `context.jsonl` |
| **Trellis** | 分层规范库 | `devflow/spec/{frontend,backend}/` |
| **OpenSpec** | Schema 驱动工作流 | `workflow.yaml` 定义依赖图 |
| **OpenSpec** | 文件存在性状态检测 | 通过 generates 判断完成状态 |

### Skill 结构规范

```
skill-name/
├── SKILL.md           # 核心指令 (<500 行)
├── context.jsonl      # 上下文定义
├── scripts/           # 内嵌脚本
├── references/        # Agent 指令
└── assets/            # 模板
```

### context.jsonl 格式

```jsonl
{"file": "devflow/requirements/{REQ}/BRAINSTORM.md", "reason": "Original intent"}
{"file": "devflow/spec/frontend/index.md", "reason": "Frontend conventions", "optional": true}
```

---

## v4.2.0 Module: Commands Namespace Restructure

### Purpose

将 28 个扁平命令文件重组为 3 个分类目录，采用 Trellis 风格的命名空间调用。

### New Structure

```
commands/
├── flow/                    # 工作流命令 (20个)
│   ├── init.md             # /flow:init
│   ├── spec.md             # /flow:spec
│   ├── dev.md              # /flow:dev
│   ├── quality.md          # /flow:quality
│   ├── release.md          # /flow:release
│   ├── fix.md              # /flow:fix
│   ├── new.md              # /flow:new
│   ├── ideate.md           # /flow:ideate
│   ├── clarify.md          # /flow:clarify
│   ├── restart.md          # /flow:restart
│   ├── status.md           # /flow:status
│   ├── update.md           # /flow:update
│   ├── upgrade.md          # /flow:upgrade
│   ├── verify.md           # /flow:verify
│   ├── archive.md          # /flow:archive
│   ├── checklist.md        # /flow:checklist
│   ├── context.md          # /flow:context
│   ├── delta.md            # /flow:delta
│   ├── workspace.md        # /flow:workspace
│   └── constitution.md     # /flow:constitution
│
├── core/                    # 核心命令 (4个)
│   ├── architecture.md     # /core:architecture
│   ├── guidelines.md       # /core:guidelines
│   ├── roadmap.md          # /core:roadmap
│   └── style.md            # /core:style
│
└── util/                    # 工具命令 (4个)
    ├── git-commit.md       # /util:git-commit
    ├── code-review.md      # /util:code-review
    ├── problem-analyzer.md # /util:problem-analyzer
    └── cancel-ralph.md     # /util:cancel-ralph
```

### Command Migration

| 旧命令 | 新命令 |
|--------|--------|
| `/flow-init` | `/flow:init` |
| `/flow-spec` | `/flow:spec` |
| `/flow-dev` | `/flow:dev` |
| `/core-architecture` | `/core:architecture` |
| `/git-commit` | `/util:git-commit` |
| `/code-review-high` | `/util:code-review` |

### Benefits

1. **清晰分类**: 28 个命令分为 3 组，一目了然
2. **命名空间**: 避免命令名冲突
3. **可扩展**: 新命令按类别添加
4. **对齐 Trellis**: 统一风格，便于跨项目协作

---

**Last Updated**: 2026-02-07
**v4.2.0 Module**: Commands Namespace Restructure

---

## Legacy Structure (保留兼容)

```
.claude/
├── agents/                    # Agent instruction files (迁移中)
├── commands/                  # Slash command definitions (已重构为命名空间)
├── hooks/                     # JavaScript hooks
├── scripts/                   # Bash utility scripts
└── docs/templates/            # Templates
```

## REQ-002 Module: /flow-checklist

### Purpose
"Unit Tests for English" - Quality validation for requirement documents before task planning.

### Components

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| Command | `commands/flow-checklist.md` | 256 | Command definition and flow |
| Agent | `agents/checklist-agent.md` | 176 | Generation logic with Anti-Example rules |
| Gate Hook | `hooks/checklist-gate.js` | 320 | Epic entry gate validation |
| Calculator | `scripts/calculate-checklist-completion.sh` | 244 | Completion percentage |
| Errors | `scripts/checklist-errors.sh` | 132 | Error codes and validation |
| Template | `docs/templates/CHECKLIST_TEMPLATE.md` | 53 | Output format |

### Integration Points

1. **Entry**: After `/flow-prd`, before `/flow-epic`
2. **Gate**: Integrated into `/flow-epic` Entry Gate (Step 5)
3. **Config**: `config/quality-rules.yml` (80% threshold)
4. **Output**: `devflow/requirements/{REQ}/checklists/*.md`

### Quality Dimensions
- Completeness
- Clarity
- Consistency
- Measurability
- Coverage

---

**Last Updated**: 2025-12-15
**REQ-002 Version**: 1.0.0

---

## v2.3.0 Module: Ralph × Manus Integration

### Purpose
Combine Ralph-Wiggum's autonomous iteration loop with Manus-style Planning-with-Files for memory-enhanced continuous development.

### Core Concepts

**Ralph Loop**: Autonomous iteration until completion (持续迭代直到完成，永不放弃)
- Prompt stays constant, file state changes
- Claude learns from its own previous work
- Auto-retry on errors, no manual intervention

**Manus 6 Principles**:
1. 文件系统作外部记忆 - Filesystem as external memory
2. 注意力操纵 - Attention manipulation (read goal files at key moments)
3. 保留失败痕迹 - Keep failure traces (ERROR_LOG.md, research/attempts/)
4. 避免少样本过拟合 - Avoid few-shot overfitting
5. 稳定前缀优化缓存 - Stable prefix for KV-cache optimization
6. 只追加上下文 - Append-only context

**Why They're a Perfect Match**:
- Ralph: "监督把活干完" (supervise task completion)
- Manus: "认真把进度记下来" (carefully record progress)
- Together: 有记忆的持续迭代系统 (memory-enhanced continuous iteration)

### Components

| Component | File | Purpose |
|-----------|------|---------|
| **Command** | `commands/flow-dev.md` | Autonomous iteration loop (Default) |
| **Attention Skill** | `skills/flow-attention-refresh/SKILL.md` | 4 attention refresh protocols |
| **TDD Skill** | `skills/flow-tdd/SKILL.md` | Error recording integration |
| **Error Template** | `docs/templates/ERROR_LOG_TEMPLATE.md` | Execution error log format |
| **Attempt Template** | `docs/templates/ATTEMPT_TEMPLATE.md` | Research attempt log format |

**Modified Files**:
- `commands/flow-dev.md` - Merged Ralph Loop (Autonomous by default)
- `commands/flow-init.md` - Research made mandatory via `flow-researcher` subagent (context-isolated)
- `skills/cc-devflow-orchestrator/SKILL.md` - Updated routing for autonomous flow

### Attention Refresh Protocols

| Protocol | Trigger Point | Reads | Purpose |
|----------|---------------|-------|---------|
| Protocol 1 | Every flow-* Entry Gate | BRAINSTORM.md | Align with original intent |
| Protocol 2 | flow-dev task start | TASKS.md T### + DoD | Clarify task goal |
| Protocol 3 | Ralph iteration start | TASKS.md + ERROR_LOG.md | Next action + avoid errors |
| Protocol 4 | After error | ERROR_LOG.md | Root cause analysis |

### ERROR_LOG.md Structure

```markdown
## [TIMESTAMP] E###: TITLE

**Phase**: flow-dev / T###
**Error Type**: Test Failure | Build Error | Runtime Error
**Error Message**: [full error]
**Root Cause**: [after analysis]
**Resolution**: [after fix]
**Prevention**: [optional]
```

### research/attempts/ Structure

```markdown
# Attempt: [方案名]

**Date**: YYYY-MM-DD
**Context**: 解决 [什么问题]

## Approach / Result / Reason / Learning / References
```

### Integration Points

1. **Entry**: After `/flow-epic`, execute `/flow-dev`
2. **Trigger**: `status: "epic_complete"` → `/flow-dev` (Autonomous by default)
3. **Output**:
   - `ERROR_LOG.md` (execution errors)
   - `research/attempts/` (research phase failures)
   - All tasks completed with TDD

### Modes: Autonomous (Default) vs Manual

| | /flow-dev (Default) | /flow-dev --manual |
|--|-----------|-------------|
| 退出条件 | 迭代直到完成或上限 | 任务失败可停止 |
| 错误处理 | 自动重试 | 提示用户修复 |
| 注意力刷新 | 每迭代刷新（含错误学习） | 每任务一次 |
| 适用场景 | 可无人值守 | 需要人工监督 |
| ERROR_LOG | 强制记录 | 可选记录 |

### Success Metrics (Target)

| 指标 | 目标 |
|------|------|
| 任务完成率 (无人工干预) | ≥85% |
| 测试失败后自动恢复率 | ≥70% |
| 上下文遗忘导致的返工 | ≤0.5 次/需求 |
| 错误重复发生率 | ≤10% |

---

**Last Updated**: 2026-02-06
**v2.3.0 Module**: Ralph × Manus Integration

---

## v3.0.0 Module: OpenSpec × Trellis Integration

### Purpose

Borrow design concepts from OpenSpec (Delta Specs + Archive) and Trellis (Context Injection + Ralph Loop) to solve 5 major pain points:

1. **Context Bloat** → Staged Context Injection (RM-015)
2. **Weak Quality Gates** → Programmatic Verification (RM-016)
3. **No Incremental Tracking** → Delta Specs Engine (RM-017)
4. **No Session Persistence** → Workspace System (RM-018)
5. **Scattered Guidelines** → Unified Spec Directory (RM-019)
6. **Workflow Redundancy** → Flow Simplification (RM-020)

### New Directory Structure

```
devflow/
├── specs/              # SSOT for specifications [NEW: RM-017]
│   └── modules/        # Module-level specs
├── workspace/          # Developer workspaces [NEW: RM-018]
│   └── {developer}/    # Per-developer journals
├── spec/               # Unified project specs [NEW: RM-019]
│   ├── frontend/       # Frontend specifications
│   ├── backend/        # Backend specifications
│   └── shared/         # Cross-cutting specs
├── QUICK_REFERENCE.md  # v3.0 workflow quick reference [NEW]
└── MIGRATION_v3.0.md   # Migration guide [NEW]

.claude/
├── config/
│   └── quality-gates.yml  # Programmatic verification rules [NEW: RM-016]
├── hooks/
│   ├── inject-agent-context.ts  # Context injection hook [NEW: RM-015]
│   ├── types/
│   │   └── context-injection.d.ts  # TypeScript types [NEW]
│   └── utils/
│       └── jsonl-parser.ts  # JSONL parsing utilities [NEW]
├── commands/
│   ├── flow-context.md    # Context management [NEW: RM-015]
│   ├── flow-delta.md      # Delta specs management [NEW: RM-017]
│   ├── flow-workspace.md  # Workspace management [NEW: RM-018]
│   └── flow-quality.md    # Combined quality verification [NEW: RM-020]
├── scripts/
│   ├── flow-context-*.sh  # Context scripts [NEW]
│   ├── flow-delta-*.sh    # Delta scripts [NEW]
│   ├── flow-workspace-*.sh # Workspace scripts [NEW]
│   ├── flow-quality-*.sh  # Quality scripts [NEW]
│   ├── run-quality-gates.sh  # Gate execution [NEW: RM-016]
│   └── record-quality-error.sh  # Error recording [NEW]
└── docs/templates/
    ├── context/           # Context JSONL templates [NEW: RM-015]
    │   ├── dev.jsonl.template
    │   ├── epic.jsonl.template
    │   └── ...
    ├── DELTA_SPEC_TEMPLATE.md  # Delta spec format [NEW: RM-017]
    └── JOURNAL_TEMPLATE.md     # Journal format [NEW: RM-018]
```

### New Commands

| Command | Purpose | Module |
|---------|---------|--------|
| `/flow-context` | Manage staged context injection | RM-015 |
| `/flow-delta` | Manage delta specs | RM-017 |
| `/flow-workspace` | Manage developer workspace | RM-018 |
| `/flow-quality` | Combined quality verification | RM-020 |

### Simplified Workflows

```
【精简流程】(5 步, 适合小需求)
/flow-init --quick → /flow-prd --quick → /flow-epic → /flow-dev → /flow-release

【标准流程】(6 步, 适合中等需求)
/flow-init → /flow-prd → /flow-epic → /flow-dev → /flow-quality → /flow-release

【完整流程】(8 步, 适合大需求)
/flow-init → /flow-clarify → /flow-prd → /flow-tech → /flow-ui
    → /flow-epic → /flow-dev → /flow-quality --full → /flow-release
```

### Deprecations

| Old Command | Replacement | Status |
|-------------|-------------|--------|
| `/flow-review` | `/flow-quality --full` | Deprecated (warning) |
| `/flow-qa` | `/flow-quality --full` | Deprecated (warning) |

### Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Agent context size | 10000+ tokens | 3000 tokens | -70% |
| Single command time | 2-3 min | 1-1.5 min | -50% |
| Full workflow time | 30-45 min | 15-20 min | -50% |
| Rework rate | ~30% | ~10% | -67% |

---

**Last Updated**: 2026-02-07
**v3.0.0 Module**: OpenSpec × Trellis Integration

---

## v4.1.0 Module: Unified Specification Phase

### Purpose

合并 flow-prd/flow-tech/flow-ui/flow-epic 为统一的 `/flow-spec` 命令，减少命令调用次数，利用 Agent 并行执行潜力。

### Key Changes

| Before (v4.0) | After (v4.1) | Improvement |
|---------------|--------------|-------------|
| 4 个独立命令 | 1 个统一命令 | -75% 命令数 |
| 串行执行 | Tech + UI 并行 | -35% 时间 |
| 重复 Entry/Exit Gate | 统一 Gate | -280 行代码 |

### New Command: /flow-spec

```bash
# Full Mode (默认)
/flow-spec "REQ-123"

# Quick Mode (小需求)
/flow-spec "REQ-123" --skip-tech --skip-ui

# Backend Only
/flow-spec "REQ-123" --skip-ui

# Frontend Only
/flow-spec "REQ-123" --skip-tech
```

### Execution Flow

```
PRD (sequential) → Tech + UI (parallel) → Epic (sequential)

Time ────────────────────────────────────────────►

T0   ┌─────────────┐
     │ prd-writer  │  (必须先完成)
     └──────┬──────┘
            │
T1          ├────────────────────┐
            │                    │
     ┌──────▼──────┐      ┌──────▼──────┐
     │tech-architect│      │ ui-designer │  (并行)
     └──────┬──────┘      └──────┬──────┘
            │                    │
T2          └─────────┬──────────┘
                      │
               ┌──────▼──────┐
               │   planner   │  (等待两者完成)
               └─────────────┘
```

### New Files

| File | Purpose |
|------|---------|
| `.claude/skills/workflow/flow-spec/SKILL.md` | 主指令 (~250 行) |
| `.claude/skills/workflow/flow-spec/context.jsonl` | 上下文定义 |
| `.claude/skills/workflow/flow-spec/scripts/entry-gate.sh` | 统一入口检查 |
| `.claude/skills/workflow/flow-spec/scripts/parallel-orchestrator.sh` | 并行调度逻辑 |
| `.claude/skills/workflow/flow-spec/scripts/exit-gate.sh` | 统一出口检查 |
| `.claude/docs/templates/_shared/CONSTITUTION_CHECK.md` | 共享 Constitution 检查 |
| `.claude/docs/templates/_shared/VALIDATION_CHECKLIST.md` | 共享验证清单 |
| `.claude/docs/templates/_shared/YAML_FRONTMATTER.md` | 共享 YAML 头部 |

### Deprecations

| Old Command | Replacement | Status |
|-------------|-------------|--------|
| `/flow-prd` | `/flow-spec` | Deprecated (warning) |
| `/flow-tech` | `/flow-spec` | Deprecated (warning) |
| `/flow-ui` | `/flow-spec` | Deprecated (warning) |
| `/flow-epic` | `/flow-spec` | Deprecated (warning) |

### Simplified Workflows (v4.1)

```
【精简流程】(3 步, 适合小需求)
/flow-init --quick → /flow-spec --skip-tech --skip-ui → /flow-dev → /flow-release

【标准流程】(4 步, 适合中等需求)
/flow-init → /flow-spec → /flow-dev → /flow-quality → /flow-release

【完整流程】(5 步, 适合大需求)
/flow-init → /flow-clarify → /flow-spec → /flow-dev → /flow-quality --full → /flow-release
```

### Expected Improvements

| Metric | Before (v4.0) | After (v4.1) | Improvement |
|--------|---------------|--------------|-------------|
| 命令调用次数 | 4 | 1 | -75% |
| 设计阶段时间 | 8-12 min | 5-8 min | -35% |
| Entry/Exit Gate 代码 | ~280 行 | ~100 行 | -64% |

---

**Last Updated**: 2026-02-07
**v4.1.0 Module**: Unified Specification Phase

---

## v4.3.0 Module: Git Worktree Integration

### Purpose

将所有 Git 分支操作改为 Git Worktree 方式，支持 3-5 个并行 Claude Code 会话，借鉴官方最佳实践。

### Key Changes

| Before (v4.2) | After (v4.3) | Improvement |
|---------------|--------------|-------------|
| 传统分支切换 | Worktree 隔离 | 并行开发 |
| stash/checkout | cd 切换 | 切换时间 -97% |
| 单一 Claude 会话 | 多会话并行 | 效率 +200% |

### Worktree Directory Layout

```
~/projects/
├── cc-devflow/                    # 主仓库 (main 分支)
├── cc-devflow-REQ-001/            # REQ-001 worktree
├── cc-devflow-REQ-002/            # REQ-002 worktree
├── cc-devflow-analysis/           # 只读分析 worktree (可选)
└── cc-devflow-hotfix/             # 紧急修复 worktree (可选)
```

### New Skill: using-git-worktrees

```
.claude/skills/domain/using-git-worktrees/
├── SKILL.md                    # 核心指令 (~200 行)
├── context.jsonl               # 上下文定义
├── scripts/
│   ├── worktree-create.sh      # 创建 worktree
│   ├── worktree-list.sh        # 列出 worktree
│   ├── worktree-switch.sh      # 切换 worktree
│   ├── worktree-cleanup.sh     # 清理 worktree
│   └── worktree-status.sh      # 状态检查
└── assets/
    └── SHELL_ALIASES.md        # Shell 别名模板
```

### Modified Commands

| Command | Change |
|---------|--------|
| `/flow-init` | 默认使用 worktree 模式，`--branch-only` 兼容旧模式 |
| `/flow-release` | 自动清理 worktree |

### Shell Aliases (Recommended)

```bash
alias za='cd $(git rev-parse --show-toplevel 2>/dev/null || echo .)'
alias zl='git worktree list'
alias zm='cd ~/projects/cc-devflow'

zw() {
  local req_id="${1:-}"
  local repo_name=$(basename $(git rev-parse --show-toplevel 2>/dev/null))
  cd ~/projects/${repo_name}-${req_id}
}
```

### New common.sh Functions

| Function | Purpose |
|----------|---------|
| `is_in_worktree()` | 检测是否在 worktree 中 |
| `get_main_repo_path()` | 获取主仓库路径 |
| `get_worktree_path()` | 获取当前 worktree 路径 |
| `get_worktree_dir_for_req()` | 获取指定 REQ 的 worktree 目录 |
| `worktree_exists_for_req()` | 检查 worktree 是否存在 |
| `get_req_id_from_worktree()` | 从 worktree 路径提取 REQ-ID |
| `list_worktrees_with_req()` | 列出所有 worktree 及其 REQ-ID |

### Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| 并行需求数 | 1 | 3-5 | +400% |
| 上下文切换时间 | 30s | 1s | -97% |
| 紧急修复响应 | 需要 stash | 直接新建 | 即时 |
| Claude 会话隔离 | 无 | 完全隔离 | 100% |

---

**Last Updated**: 2026-02-07
**v4.3.0 Module**: Git Worktree Integration

---

## v4.4.0 Module: Ralph Loop Programmatic Verification

### Purpose

实现 SubagentStop Hook 拦截验证机制，在子 Agent 尝试停止时执行程序化验证，确保代码质量。借鉴 Trellis 的 Ralph Loop 设计。

### Key Changes

| Before (v4.3) | After (v4.4) | Improvement |
|---------------|--------------|-------------|
| 无自动验证 | SubagentStop 拦截 | 质量保证 |
| 手动检查 | 程序化验证 | 自动化 |
| 无迭代控制 | 最大迭代限制 | 防止无限循环 |

### New Files

| File | Purpose |
|------|---------|
| `.claude/hooks/ralph-loop.ts` | SubagentStop Hook 主逻辑 (~350 行) |
| `.ralph-state.json` | 运行时状态文件 (自动生成) |

### Configuration

`quality-gates.yml` 新增配置:

```yaml
# 顶级 verify 命令 (SubagentStop 时执行)
verify:
  - npm run lint --if-present
  - npm run typecheck --if-present
  - npm test -- --passWithNoTests

ralph_loop:
  max_iterations: 5      # 最大迭代次数
  timeout_minutes: 30    # 超时时间
```

### Hook Registration

`settings.json` 新增:

```json
{
  "hooks": {
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "npx ts-node $CLAUDE_PROJECT_DIR/.claude/hooks/ralph-loop.ts"
          }
        ]
      }
    ]
  }
}
```

### State File Format

`.ralph-state.json`:

```json
{
  "agent_id": "session-xxx",
  "iteration": 2,
  "last_failures": [
    {
      "command": "npm run lint",
      "output": "error: ...",
      "timestamp": "2026-02-07T06:00:00Z"
    }
  ],
  "started_at": "2026-02-07T06:00:00Z"
}
```

### Execution Flow

```
SubagentStop Event
       │
       ▼
┌──────────────────┐
│ Load State       │
│ Check Timeout    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Check Max Iter   │──── Reached ──▶ Allow Stop
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Run Verify Cmds  │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
  Pass      Fail
    │         │
    ▼         ▼
 Allow     Block
 Stop      Stop
           (return errors)
```

### Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| 代码质量保证 | 手动 | 自动 | 100% |
| 验证遗漏率 | ~20% | ~0% | -100% |
| 无限循环风险 | 存在 | 受控 | 安全 |

---

**Last Updated**: 2026-02-07
**v4.4.0 Module**: Ralph Loop Programmatic Verification

---

## v4.5.0 Module: Delta Specs Enhancement

### Purpose

增强 Delta Specs 机制，借鉴 OpenSpec 的设计，实现完整的增量规格管理。支持 ADDED/MODIFIED/REMOVED/RENAMED 四种操作，提供 TypeScript 解析器和完整的 CLI 工具链。

### Key Changes

| Before (v4.4) | After (v4.5) | Improvement |
|---------------|--------------|-------------|
| 简单复制 | 真正的 delta 应用 | 精确变更 |
| 3 个子命令 | 4 个子命令 | 完整功能 |
| Bash 解析 | TypeScript 解析器 | 可靠性 |
| 无状态管理 | 状态工作流 | 可追溯 |

### New Command: /flow:delta

```bash
# Create a new delta spec
/flow:delta create "REQ-123" "add-2fa"

# List all deltas for a requirement
/flow:delta list "REQ-123"

# Apply delta to main specs (PRD.md)
/flow:delta apply "REQ-123" "add-2fa"

# Check delta status
/flow:delta status "REQ-123" "add-2fa"
```

### Delta Spec Format (OpenSpec-style)

```markdown
---
delta_id: "2026-02-01-add-2fa"
req_id: "REQ-123"
title: "Add 2FA Support"
created_at: "2026-02-01T10:00:00Z"
status: "draft|review|approved|applied"
---

# Delta: Add 2FA Support

## ADDED Requirements
### Requirement: Two-Factor Authentication
#### Scenario: Enable 2FA
- GIVEN user is logged in
- WHEN user enables 2FA
- THEN system generates QR code

## MODIFIED Requirements
### Requirement: User Login
(Previously: old description)

## REMOVED Requirements
### Requirement: Legacy Session
**Reason**: Replaced by JWT
**Migration**: Run migration script

## RENAMED Requirements
- FROM: Old Name
- TO: New Name
```

### New Files

| File | Purpose |
|------|---------|
| `.claude/scripts/delta-parser.ts` | TypeScript Delta 解析器 (~400 行) |
| `.claude/scripts/flow-delta-create.sh` | 创建 delta 目录和文件 |
| `.claude/scripts/flow-delta-list.sh` | 列出所有 deltas |
| `.claude/scripts/flow-delta-apply.sh` | 应用 delta 到 PRD.md |
| `.claude/scripts/flow-delta-status.sh` | 检查 delta 状态 |
| `.claude/docs/templates/DELTA_SPEC_TEMPLATE.md` | Delta 模板 (OpenSpec 格式) |

### Directory Structure

```
devflow/requirements/REQ-123/
├── PRD.md                    # Main specification (SSOT)
├── deltas/                   # Delta specs directory
│   ├── 2026-02-01-add-2fa/
│   │   ├── delta.md          # Delta specification
│   │   └── tasks.md          # Delta-specific tasks
│   └── 2026-02-05-fix-login/
│       ├── delta.md
│       └── tasks.md
└── ...

devflow/archive/
└── 2026-02/
    └── REQ-123/
        └── deltas/           # Archived deltas
```

### Status Workflow

```
draft → review → approved → applied
  │       │         │
  │       │         └── /flow:delta apply
  │       │
  │       └── Manual review approval
  │
  └── /flow:delta create
```

### TypeScript Parser API

```typescript
interface DeltaBlock {
  type: 'ADDED' | 'MODIFIED' | 'REMOVED' | 'RENAMED';
  name: string;
  content: string;
  previousContent?: string;  // for MODIFIED
  reason?: string;           // for REMOVED
  newName?: string;          // for RENAMED
}

function parseDelta(content: string): DeltaBlock[];
function applyDelta(prdContent: string, delta: DeltaBlock[]): string;
```

### Integration Points

| Integration | Description |
|-------------|-------------|
| `/flow:spec` | 生成 delta 而非直接修改 PRD |
| `/flow:release` | 应用所有 approved deltas |
| `/flow:archive` | 归档 applied deltas |

### Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| 变更追溯性 | 无 | 完整 | 100% |
| 冲突检测 | 无 | 自动 | 100% |
| 回滚能力 | 手动 | 自动 | 100% |
| 审核流程 | 无 | 状态驱动 | 100% |

---

**Last Updated**: 2026-02-07
**v4.5.0 Module**: Delta Specs Enhancement

---

## v4.6.0 Module: Archive System Enhancement

### Purpose

增强归档系统，集成 Delta Specs 支持，提供完整的需求生命周期管理。

### Key Changes

| Before (v4.5) | After (v4.6) | Improvement |
|---------------|--------------|-------------|
| 简单移动目录 | Delta Specs 检查 | 完整性保证 |
| 无警告机制 | 未应用 delta 警告 | 防止遗漏 |
| 基础状态记录 | deltaCount 字段 | 可追溯性 |

### New Features

#### 1. Delta Specs 检查

归档前自动检测:
- 检查 `deltas/` 目录是否存在
- 统计 Delta Specs 数量
- 警告未应用的 Delta Specs (status != "applied")

#### 2. 增强的状态记录

```json
{
  "status": "archived",
  "archivedReason": "completed",
  "archivedAt": "2026-02-07T10:00:00+08:00",
  "archiveLocation": "devflow/archive/2026-02/REQ-123",
  "statusBeforeArchive": "release_complete",
  "deltaCount": 3
}
```

#### 3. 新增 common.sh 函数

| Function | Purpose |
|----------|---------|
| `get_archive_summary()` | 获取归档需求的 JSON 摘要 |
| `has_deltas_to_archive()` | 检查是否有 deltas 需要归档 |
| `get_delta_count()` | 获取 delta 数量 |

### Archive Directory Structure

```
devflow/archive/
├── 2026-01/                      # 按月组织
│   ├── REQ-001/
│   │   ├── PRD.md
│   │   ├── EPIC.md
│   │   ├── TASKS.md
│   │   ├── deltas/               # Delta Specs 完整保留
│   │   │   └── 2026-01-15-add-feature/
│   │   │       ├── delta.md
│   │   │       └── tasks.md
│   │   ├── orchestration_status.json
│   │   └── ...
│   └── REQ-002/
└── 2026-02/
    └── REQ-003/
```

### Command Usage

```bash
# 归档需求 (自动检测 Delta Specs)
/flow:archive "REQ-123"

# 预览归档 (显示 Delta Specs 信息)
/flow:archive "REQ-123" --dry-run

# 列出所有归档
/flow:archive --list

# 恢复归档
/flow:archive "REQ-123" --restore
```

### Integration Points

| Integration | Description |
|-------------|-------------|
| `/flow:release` | 发布后自动触发归档 |
| `/flow:delta` | 归档前检查未应用的 deltas |
| `/flow:status` | 显示归档状态 |

### Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Delta 遗漏率 | ~15% | ~0% | -100% |
| 归档完整性 | 基础 | 完整 | 100% |
| 可追溯性 | 有限 | 完整 | 100% |

---

**Last Updated**: 2026-02-07
**v4.6.0 Module**: Archive System Enhancement

---

## v4.7.0 Module: Claude Team Integration

### Purpose

集成 Claude Team 功能，支持多 Agent 并行协作开发。实现 TeammateIdle 和 TaskCompleted Hook，扩展状态管理支持 Team 模式。

### Key Changes

| Before (v4.6) | After (v4.7) | Improvement |
|---------------|--------------|-------------|
| 单 Agent 执行 | 多 Agent 并行 | 效率 +200% |
| 无 Team 状态 | 完整 Team 状态管理 | 可追溯 |
| 单一 Ralph Loop | 多 Teammate Ralph Loop | 分布式验证 |

### New Hooks

| Hook | File | Trigger | Purpose |
|------|------|---------|---------|
| **TeammateIdle** | `teammate-idle-hook.ts` | Teammate 空闲时 | 任务分配和调度 |
| **TaskCompleted** | `task-completed-hook.ts` | 任务完成时 | 质量验证和状态更新 |

### TeammateIdle Hook 工作流程

```
TeammateIdle Event
    ↓
验证 last_task_id (如有)
    ↓
验证失败 → 返回 assign_task (继续修复)
验证通过 → 标记任务完成
    ↓
查找下一个未分配任务
    ↓
有任务 → 返回 assign_task
无任务 + 所有 Teammate 空闲 → 返回 shutdown
无任务 + 有 Teammate 工作中 → 返回 wait
```

### TaskCompleted Hook 工作流程

```
TaskCompleted Event
    ↓
执行 task_completed.verify 命令
    ↓
    ├── 通过 → accept + 更新 Team 状态
    └── 失败 → block_on_failure?
                ├── true → reject
                └── false → accept (with warning)
    ↓
记录失败到 ERROR_LOG.md
    ↓
检查阶段转换
```

### orchestration_status.json 扩展

```json
{
  "reqId": "REQ-007",
  "status": "in_progress",
  "phase": "development",

  "team": {
    "mode": "parallel",
    "lead": "team-lead",
    "teammates": [
      {
        "id": "dev-analyst",
        "role": "developer",
        "status": "working",
        "currentTask": "T001",
        "completedTasks": ["T000"],
        "lastActiveAt": "2026-02-07T10:00:00Z"
      }
    ],
    "taskAssignments": {
      "T001": "dev-analyst"
    }
  },

  "ralphLoop": {
    "enabled": true,
    "teammates": {
      "dev-analyst": {
        "iteration": 2,
        "lastVerifyResult": "passed"
      }
    },
    "globalIteration": 3,
    "maxIterations": 10
  }
}
```

### New Files

| File | Purpose |
|------|---------|
| `.claude/hooks/teammate-idle-hook.ts` | TeammateIdle Hook 实现 |
| `.claude/hooks/task-completed-hook.ts` | TaskCompleted Hook 实现 |
| `.claude/hooks/types/team-types.d.ts` | Team 状态 TypeScript 类型 |
| `.claude/scripts/parse-task-dependencies.js` | TASKS.md 任务依赖解析器 |
| `.claude/scripts/detect-file-conflicts.sh` | 并行任务文件冲突检测 |
| `.claude/scripts/team-dev-init.sh` | flow-dev Team 模式初始化 |
| `.claude/skills/workflow/flow-spec/scripts/team-init.sh` | flow-spec Team 模式初始化 |
| `.claude/skills/workflow/flow-spec/scripts/team-communication.sh` | Teammate 通信协议 |
| `.claude/skills/workflow/flow-spec/team-config.json` | spec-design-team 配置 |
| `.claude/docs/templates/DESIGN_DECISIONS_TEMPLATE.md` | 设计决策记录模板 |

### common.sh 新增函数

| Function | Purpose |
|----------|---------|
| `is_team_mode_enabled()` | 检查 Team 模式是否启用 |
| `init_team_state()` | 初始化 Team 状态 |
| `add_teammate()` | 添加 Teammate |
| `update_teammate_status()` | 更新 Teammate 状态 |
| `mark_teammate_task_complete()` | 标记任务完成 |
| `assign_task_to_teammate()` | 分配任务 |
| `get_unassigned_tasks()` | 获取未分配任务 |
| `update_teammate_ralph_state()` | 更新 Ralph 状态 |
| `all_teammates_idle()` | 检查所有 Teammate 空闲 |
| `cleanup_team_state()` | 清理 Team 状态 |

### flow-dev Team 模式命令

```bash
# 启用 Team 模式 (默认 3 个 Agent)
/flow:dev "REQ-123" --team

# 指定 Agent 数量 (2-5)
/flow:dev "REQ-123" --team --agents 5

# Team 模式执行流程
# 1. 解析 TASKS.md 获取任务依赖
# 2. 检测文件冲突，分配任务给 Agent
# 3. 并行执行无冲突任务
# 4. 冲突任务分配给同一 Agent 串行执行
# 5. TeammateIdle Hook 自动分配下一任务
# 6. 所有任务完成后 shutdown
```

### Task Dependency Parser (parse-task-dependencies.js)

```bash
# 解析 TASKS.md
node .claude/scripts/parse-task-dependencies.js parse TASKS.md

# 获取并行分组
node .claude/scripts/parse-task-dependencies.js groups TASKS.md

# 获取下一批可执行任务
node .claude/scripts/parse-task-dependencies.js next TASKS.md

# 输出格式
{
  "tasks": [
    {"id": "T001", "phase": 1, "parallel": true, "userStory": "US1", "filePath": "src/user.ts"}
  ],
  "parallelGroups": [["T001", "T002"], ["T003"]],
  "stats": {"total": 10, "completed": 3, "pending": 7}
}
```

### File Conflict Detection (detect-file-conflicts.sh)

```bash
# 检测文件冲突
echo '{"tasks": [...]}' | .claude/scripts/detect-file-conflicts.sh

# 输出格式
{
  "hasConflicts": true,
  "conflicts": [{"file": "src/user.ts", "tasks": ["T001", "T002"]}],
  "safeGroups": [{"tasks": ["T003", "T004"]}]
}
```

### quality-gates.yml 新增配置

```yaml
# TeammateIdle Hook 配置
teammate_idle:
  idle_checks:
    - npm run lint --if-present
    - npm run typecheck --if-present
  assignment_strategy: priority_first
  idle_timeout: 300

# TaskCompleted Hook 配置
task_completed:
  verify:
    - npm run lint --if-present
    - npm run typecheck --if-present
    - npm test -- --passWithNoTests
  block_on_failure: true
  max_retries: 3

# Ralph Loop Team 模式配置
ralph_loop:
  team_mode:
    enabled: true
    scope: teammate
    max_iterations_per_teammate: 3
    max_global_iterations: 10
```

### Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| 并行 Agent 数 | 1 | 3-5 | +400% |
| 需求完成时间 | 90 min | 50 min | -45% |
| 任务调度 | 手动 | 自动 | 100% |
| 质量验证 | 单点 | 分布式 | 100% |

---

**Last Updated**: 2026-02-07
**v4.7.0 Module**: Claude Team Integration

