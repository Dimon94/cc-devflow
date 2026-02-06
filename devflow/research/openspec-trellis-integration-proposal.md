# OpenSpec × Trellis 借鉴方案 (结合 CC-DevFlow 现状)

**Date:** 2026-02-05  
**Status:** Proposal  
**Target:** CC-DevFlow v3.0 Skills-Based Workflow Enhancement

---

## 一、CC-DevFlow 现状分析

### 1.1 现有架构

```
.claude/
├── commands/           # 29 个 Slash Commands
│   ├── core-*.md       # 项目级 (roadmap, architecture, guidelines, style)
│   └── flow-*.md       # 需求级 (init, clarify, prd, tech, epic, dev, qa, release)
├── agents/             # 15+ Agents (prd-writer, tech-architect, planner, etc.)
├── skills/             # Skills 系统
│   ├── cc-devflow-orchestrator/  # 工作流路由
│   ├── flow-tdd/                 # TDD 执行
│   ├── flow-attention-refresh/   # 注意力刷新
│   └── devflow-file-standards/   # 文件标准
├── hooks/              # 9 个 Hooks
│   ├── skill-activation-prompt.sh  # UserPromptSubmit
│   ├── pre-tool-use-guardrail.sh   # PreToolUse
│   ├── ralph-stop-hook.sh          # Stop Hook (Autonomous Loop)
│   └── checklist-gate.js           # Epic Entry Gate
└── scripts/            # 20+ Shell 脚本
```

### 1.2 现有工作流

```
项目级 (执行一次):
/core-roadmap → /core-architecture → /core-guidelines → /core-style

需求级 (每个需求):
/flow-init → /flow-clarify → /flow-prd → /flow-checklist 
    → /flow-tech → /flow-ui → /flow-epic → /flow-dev 
    → /flow-review → /flow-qa → /flow-release
```

### 1.3 现有状态管理

```
devflow/requirements/REQ-XXX/
├── orchestration_status.json    # 状态机 (status, phase, completedSteps)
├── EXECUTION_LOG.md             # 执行日志
├── BRAINSTORM.md                # 北极星 (flow-init 生成)
├── research/                    # 研究资料
│   ├── research.md
│   └── tasks.json
├── PRD.md                       # 需求文档
├── TECH_DESIGN.md               # 技术设计
├── EPIC.md + TASKS.md           # 任务分解
└── checklists/                  # 质量检查
```

### 1.4 现有痛点

| 痛点 | 现状 | 影响 |
|------|------|------|
| **上下文膨胀** | 所有 Agent 共享同一上下文 | Agent 注意力分散，忘记关键信息 |
| **状态分散** | orchestration_status.json 字段不完整 | 难以追踪完整进度 |
| **无增量 Spec** | 每次重写 PRD/TECH_DESIGN | 无法追踪变更历史 |
| **会话不持久** | 无 workspace/journal 机制 | 新会话需重新解释上下文 |
| **质量闭环弱** | ralph-stop-hook 仅检查 completion marker | 无程序化验证 |

---

## 二、借鉴目标对照

### 2.1 OpenSpec 借鉴点 (Delta Specs + Archive)

| OpenSpec 特性 | CC-DevFlow 现状 | 借鉴价值 |
|--------------|----------------|---------|
| `changes/` 变更文件夹 | `requirements/REQ-XXX/` | 已有，可增强 |
| Delta Specs (ADDED/MODIFIED/REMOVED) | 无 | **高价值**: 增量追踪 |
| `specs/` SSOT | 无集中 spec 目录 | **中价值**: 系统行为规格 |
| Archive 历史 | 无归档机制 | **中价值**: 审计追踪 |
| Schema 自定义工作流 | Skills 系统 | 已有类似能力 |

### 2.2 Trellis 借鉴点 (Context Injection + Ralph Loop)

| Trellis 特性 | CC-DevFlow 现状 | 借鉴价值 |
|--------------|----------------|---------|
| `*.jsonl` 上下文配置 | 无 | **高价值**: 精准注入 |
| `inject-subagent-context.py` Hook | `skill-activation-prompt.sh` | 需增强 |
| `ralph-loop.py` 质量闭环 | `ralph-stop-hook.sh` | 需增强为程序化验证 |
| `workspace/{dev}/journal-N.md` | `EXECUTION_LOG.md` | 可增强 |
| `task.sh` 任务管理 | `mark-task-complete.sh` 等 | 可整合 |
| `.trellis/spec/` Guidelines | `devflow/STYLE.md`, `.claude/guides/` | 分散，可集中 |

---

## 三、具体借鉴方案

### 3.1 RM-015: Staged Context Injection (借鉴 Trellis)

**目标**: 分阶段注入上下文，避免 Context Rot

**现状**:
- `skill-activation-prompt.sh` 仅提示激活 Skill
- Agent 通过 `Task tool` 调用，但无上下文注入

**借鉴实现**:

#### 3.1.1 新增目录结构

```
devflow/requirements/REQ-XXX/
├── context/                      # [NEW] 上下文配置目录
│   ├── research.jsonl            # flow-researcher 上下文
│   ├── prd.jsonl                 # prd-writer 上下文
│   ├── tech.jsonl                # tech-architect 上下文
│   ├── epic.jsonl                # planner 上下文
│   ├── dev.jsonl                 # flow-dev 上下文
│   └── review.jsonl              # code-reviewer 上下文
└── ...
```

#### 3.1.2 jsonl 文件格式 (借鉴 Trellis)

```jsonl
{"file": "devflow/requirements/REQ-XXX/BRAINSTORM.md", "reason": "北极星对齐"}
{"file": "devflow/requirements/REQ-XXX/PRD.md", "reason": "需求文档"}
{"file": ".claude/skills/flow-tdd/SKILL.md", "reason": "TDD 执行规范"}
{"file": "devflow/STYLE.md", "reason": "设计风格指南"}
{"file": "src/api/auth.ts", "type": "file", "reason": "现有 auth 模式参考"}
{"file": "src/components/", "type": "directory", "reason": "组件目录结构参考"}
```

#### 3.1.3 新增 Hook: inject-agent-context.ts

```typescript
// .claude/hooks/inject-agent-context.ts
// Trigger: PreToolUse (when tool_name == "Task")

interface ContextEntry {
  file: string;
  type?: "file" | "directory";
  reason: string;
}

function getAgentContext(reqDir: string, agentType: string): string {
  const jsonlPath = `${reqDir}/context/${agentType}.jsonl`;
  if (!fs.existsSync(jsonlPath)) return "";
  
  const entries: ContextEntry[] = readJsonl(jsonlPath);
  return entries.map(entry => {
    const content = entry.type === "directory" 
      ? readDirectoryMdFiles(entry.file) 
      : fs.readFileSync(entry.file, "utf-8");
    return `=== ${entry.file} (${entry.reason}) ===\n${content}`;
  }).join("\n\n");
}

// Hook handler
export function preToolUse(params: HookParams) {
  if (params.tool_name !== "Task") return params;
  
  const { subagent_type, prompt } = params.tool_input;
  const reqDir = getCurrentReqDir(); // 从 DEVFLOW_REQ_ID 或分支推断
  
  const context = getAgentContext(reqDir, subagent_type);
  if (context) {
    params.tool_input.prompt = `# Injected Context\n\n${context}\n\n---\n\n${prompt}`;
  }
  
  return params;
}
```

#### 3.1.4 分阶段注入策略

| Agent | 注入内容 | 排除内容 |
|-------|---------|---------|
| `flow-researcher` | BRAINSTORM.md, ROADMAP.md, ARCHITECTURE.md | PRD, TECH_DESIGN |
| `prd-writer` | BRAINSTORM.md, research.md, clarifications/ | TECH_DESIGN, TASKS |
| `tech-architect` | PRD.md, research.md, data-model 参考 | TASKS, 实现代码 |
| `planner` | PRD.md, TECH_DESIGN.md, contracts/ | 实现代码 |
| `code-reviewer` | PRD.md, TECH_DESIGN.md, TASKS.md, STYLE.md | 研究资料 |

#### 3.1.5 初始化命令: flow-context

```bash
# 新增命令
/flow-context init "REQ-XXX" --type backend
  → 生成 context/*.jsonl 默认配置

/flow-context add "REQ-XXX" dev "src/api/auth.ts" "现有 auth 模式参考"
  → 追加条目到 dev.jsonl

/flow-context list "REQ-XXX" dev
  → 显示 dev.jsonl 内容

/flow-context validate "REQ-XXX"
  → 验证所有 jsonl 文件路径有效
```

---

### 3.2 RM-016: Quality Gate Enhancement (借鉴 Trellis Ralph Loop)

**目标**: 程序化质量验证，替代 completion marker 检查

**现状**:
- `ralph-stop-hook.sh` 检查 `AUTONOMOUS_COMPLETE` marker
- 依赖 AI 输出，不可靠

**借鉴实现**:

#### 3.2.1 新增配置: quality-gates.yml

```yaml
# .claude/config/quality-gates.yml

flow-dev:
  verify:
    - npm run lint
    - npm run typecheck
    - npm test -- --passWithNoTests
  max_iterations: 10
  timeout_minutes: 30

flow-review:
  verify:
    - npm run lint
    - npm run typecheck
  completion_markers:
    - SPEC_REVIEW_PASS
    - CODE_QUALITY_PASS

flow-qa:
  verify:
    - npm run test:coverage
    - npm run security:check
  min_coverage: 80
```

#### 3.2.2 增强 ralph-stop-hook.sh

```bash
#!/bin/bash
# .claude/hooks/ralph-stop-hook.sh (增强版)

STATE_FILE=".claude/ralph-loop.local.json"
CONFIG_FILE=".claude/config/quality-gates.yml"

# 读取当前阶段 (flow-dev, flow-review, etc.)
CURRENT_PHASE=$(jq -r '.phase' "$STATE_FILE" 2>/dev/null)

# 获取该阶段的 verify 命令
VERIFY_COMMANDS=$(yq -r ".${CURRENT_PHASE}.verify[]" "$CONFIG_FILE" 2>/dev/null)

if [[ -n "$VERIFY_COMMANDS" ]]; then
  # 程序化验证模式
  echo "$VERIFY_COMMANDS" | while read cmd; do
    echo "Running: $cmd"
    if ! eval "$cmd"; then
      echo "BLOCK: Verification failed: $cmd"
      # 记录到 ERROR_LOG.md
      echo "## $(date) - Verify Failed" >> "$REQ_DIR/ERROR_LOG.md"
      echo "Command: $cmd" >> "$REQ_DIR/ERROR_LOG.md"
      exit 1  # 阻止停止
    fi
  done
  echo "ALLOW: All verifications passed"
  exit 0
else
  # 回退到 completion marker 模式
  # ... 现有逻辑
fi
```

#### 3.2.3 状态文件格式

```json
// .claude/ralph-loop.local.json
{
  "reqId": "REQ-123",
  "phase": "flow-dev",
  "iteration": 3,
  "maxIterations": 10,
  "startedAt": "2026-02-05T10:00:00Z",
  "errors": [
    {
      "iteration": 2,
      "error": "npm test failed",
      "resolution": "Fixed import path"
    }
  ]
}
```

---

### 3.3 RM-017: Delta Specs Engine (借鉴 OpenSpec)

**目标**: 增量规格管理，追踪需求/设计变更

**现状**:
- PRD.md, TECH_DESIGN.md 每次全量重写
- 无变更历史

**借鉴实现**:

#### 3.3.1 新增目录结构

```
devflow/
├── specs/                        # [NEW] SSOT - 系统行为规格
│   ├── auth/
│   │   └── spec.md               # 认证模块当前规格
│   ├── payments/
│   │   └── spec.md
│   └── ...
│
└── requirements/REQ-XXX/
    ├── delta-specs/              # [NEW] 本需求的增量规格
    │   └── auth/
    │       └── spec.md           # ADDED/MODIFIED/REMOVED sections
    └── ...
```

#### 3.3.2 Delta Spec 格式

```markdown
# Delta for Auth (REQ-123: 添加 2FA)

## ADDED Requirements

### Requirement: Two-Factor Authentication
The system MUST support TOTP-based two-factor authentication.

#### Scenario: 2FA enrollment
- GIVEN a user without 2FA enabled
- WHEN the user enables 2FA in settings
- THEN a QR code is displayed

## MODIFIED Requirements

### Requirement: Session Expiration
The system MUST expire sessions after 15 minutes of inactivity.
(Previously: 30 minutes, per auth/spec.md line 45)

## REMOVED Requirements

### Requirement: Remember Me
(Deprecated in favor of 2FA)
```

#### 3.3.3 新增命令: flow-delta

```bash
/flow-delta create "REQ-XXX" auth "Add 2FA support"
  → 创建 delta-specs/auth/spec.md

/flow-delta sync "REQ-XXX"
  → 将 delta-specs/ 合并到 specs/ SSOT

/flow-delta diff "REQ-XXX"
  → 显示本需求的所有增量变更

/flow-delta archive "REQ-XXX"
  → 归档到 devflow/archive/2026-02-05-REQ-XXX/
```

#### 3.3.4 与现有命令集成

```
/flow-prd "REQ-XXX"
  → 生成 PRD.md
  → [NEW] 同时生成 delta-specs/ (如涉及已有模块)

/flow-release "REQ-XXX"
  → 创建 PR
  → [NEW] 自动运行 /flow-delta sync
  → [NEW] 归档到 devflow/archive/
```

---

### 3.4 RM-018: Workspace & Session Persistence (借鉴 Trellis)

**目标**: 会话持久化，新会话可快速恢复上下文

**现状**:
- EXECUTION_LOG.md 记录执行日志
- 无结构化会话记录

**借鉴实现**:

#### 3.4.1 新增目录结构

```
devflow/
└── workspace/                    # [NEW] 工作空间
    ├── index.md                  # 活跃开发者列表
    └── {developer}/
        ├── index.md              # 个人会话索引
        ├── journal-1.md          # 会话记录 (max 2000 行)
        ├── journal-2.md
        └── .current-req          # 当前需求 ID
```

#### 3.4.2 journal 格式

```markdown
## Session 2026-02-05 14:30

**REQ:** REQ-123 (添加 2FA)
**Phase:** flow-dev
**Tasks Completed:** T005-T008

### Summary
实现了 TOTP 生成和 QR 码显示。遇到 authenticator 兼容性问题，
通过使用标准 otpauth:// URI 格式解决。

### Changes
- Added `src/auth/totp.ts`
- Modified `src/components/Settings2FA.tsx`

### Errors & Resolutions
- **E001**: `Cannot find module 'otplib'`
  - Root Cause: 未安装依赖
  - Resolution: `npm install otplib`

### Next Steps
- [ ] 实现 OTP 验证端点
- [ ] 添加 2FA 恢复码
```

#### 3.4.3 新增命令: flow-workspace

```bash
/flow-workspace init <developer-name>
  → 创建 workspace/{developer}/

/flow-workspace start
  → 读取 .current-req 和 journal
  → 恢复上次会话上下文

/flow-workspace record "Session Title"
  → 追加到 journal-N.md
  → 自动创建新文件 (超 2000 行)

/flow-workspace switch <developer-name>
  → 切换开发者工作空间
```

#### 3.4.4 与现有流程集成

```
/flow-init "REQ-XXX"
  → [NEW] 更新 workspace/{dev}/.current-req

/flow-dev "REQ-XXX"
  → [NEW] 每次迭代自动记录到 journal (简化版)
  → 错误自动记录 (从 ERROR_LOG.md 同步)

Session 结束时:
  → 提示运行 /flow-workspace record
```

---

### 3.5 RM-019: Spec Guidelines System (借鉴 Trellis)

**目标**: 集中管理项目规范，按需加载

**现状**:
- `.claude/guides/` 分散的指南
- `devflow/STYLE.md` 设计风格
- `.claude/skills/` 各种 Skill

**借鉴实现**:

#### 3.5.1 统一 spec 目录

```
devflow/
└── spec/                         # [NEW] 项目规范 (SSOT)
    ├── frontend/
    │   ├── index.md              # 入口
    │   ├── component-guidelines.md
    │   ├── hook-guidelines.md
    │   └── type-safety.md
    ├── backend/
    │   ├── index.md
    │   ├── api-guidelines.md
    │   ├── database-guidelines.md
    │   └── error-handling.md
    ├── shared/
    │   ├── index.md
    │   ├── git-conventions.md
    │   └── code-quality.md
    └── guides/
        ├── index.md
        ├── cross-layer-thinking.md
        └── code-reuse-thinking.md
```

#### 3.5.2 与 context injection 集成

```jsonl
// context/dev.jsonl 自动包含
{"file": "devflow/spec/frontend/index.md", "reason": "前端开发规范"}
{"file": "devflow/spec/backend/index.md", "reason": "后端开发规范"}
{"file": "devflow/spec/shared/code-quality.md", "reason": "代码质量标准"}
```

#### 3.5.3 迁移现有内容

```
.claude/guides/technical-guides/  →  devflow/spec/shared/
.claude/guides/workflow-guides/   →  保留 (workflow 相关)
devflow/STYLE.md                  →  devflow/spec/frontend/style.md
```

---

## 四、实施优先级

### Phase 1: 上下文工程 (Q2-2026, 3 weeks)

| ID | 需求 | 优先级 | 工作量 |
|----|------|--------|--------|
| RM-015 | Staged Context Injection | P0 | 2 weeks |
| RM-016 | Quality Gate Enhancement | P0 | 1 week |

**交付物**:
- `.claude/hooks/inject-agent-context.ts`
- `context/*.jsonl` 机制
- `quality-gates.yml` 配置
- 增强的 `ralph-stop-hook.sh`

### Phase 2: 变更追踪 (Q2-2026, 2 weeks)

| ID | 需求 | 优先级 | 工作量 |
|----|------|--------|--------|
| RM-017 | Delta Specs Engine | P1 | 2 weeks |

**交付物**:
- `devflow/specs/` SSOT 目录
- `delta-specs/` 机制
- `/flow-delta` 命令

### Phase 3: 会话持久化 (Q3-2026, 2 weeks)

| ID | 需求 | 优先级 | 工作量 |
|----|------|--------|--------|
| RM-018 | Workspace & Session | P1 | 1.5 weeks |
| RM-019 | Spec Guidelines | P2 | 0.5 weeks |

**交付物**:
- `devflow/workspace/` 目录
- `/flow-workspace` 命令
- `devflow/spec/` 统一规范目录

---

## 五、与现有系统兼容性

### 5.1 向后兼容

| 现有机制 | 保留/增强 | 说明 |
|----------|----------|------|
| `orchestration_status.json` | 保留 | 增加 `contextFiles` 字段 |
| `EXECUTION_LOG.md` | 保留 | 与 journal 互补 |
| `skill-activation-prompt.sh` | 保留 | 新增 inject hook |
| `ralph-stop-hook.sh` | 增强 | 添加程序化验证 |
| `/flow-*` 命令 | 保留 | 增加 context 参数 |

### 5.2 迁移策略

```
Phase 1: 新需求使用新机制
  → /flow-init 自动生成 context/*.jsonl
  → 旧需求可选手动创建

Phase 2: 渐进式迁移
  → 提供 /flow-migrate 命令
  → 批量生成 delta-specs/

Phase 3: 统一
  → 所有需求使用新机制
  → 旧格式保持只读兼容
```

---

## 六、成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| Agent 上下文大小 | 减少 30%+ | 对比 token 数 |
| 质量门禁通过率 | 程序化验证 95%+ | verify 命令成功率 |
| 会话恢复时间 | < 30 秒 | workspace start 耗时 |
| 变更追踪完整性 | 100% delta 可追溯 | delta-specs 覆盖率 |

---

## 七、参考资料

### OpenSpec
- `docs/concepts.md` - Delta Specs, Archive 机制
- `docs/workflows.md` - /opsx:ff, /opsx:apply, /opsx:archive
- `docs/customization.md` - Schema 自定义

### Trellis
- `docs/guide.md` - Workflow, Spec System, Session Tracking
- `src/templates/claude/hooks/inject-subagent-context.py` - 上下文注入实现
- `src/templates/claude/hooks/ralph-loop.py` - 质量闭环实现
- `src/templates/trellis/scripts/task.sh` - 任务管理脚本

### CC-DevFlow 现有
- `.claude/skills/cc-devflow-orchestrator/SKILL.md` - 工作流路由
- `.claude/hooks/ralph-stop-hook.sh` - Autonomous Loop
- `.claude/commands/flow-dev.md` - 开发执行命令

---

**Proposal Owner**: CC-DevFlow Team  
**Last Updated**: 2026-02-05  
**Status**: Awaiting Review
