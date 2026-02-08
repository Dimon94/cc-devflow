---
name: flow-dev
description: 'Execute development tasks following TDD order. Usage: /flow-dev "REQ-123" [--manual] [--max-iterations N] [--team] [--agents N]'
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  check_tasks: .claude/scripts/check-task-status.sh
  mark_task: .claude/scripts/mark-task-complete.sh
  validate_constitution: .claude/scripts/validate-constitution.sh
  verify_gate: .claude/scripts/verify-gate.sh
  setup_loop: .claude/scripts/setup-ralph-loop.sh
  team_init: .claude/scripts/team-dev-init.sh
  parse_tasks: .claude/scripts/parse-task-dependencies.js
  detect_conflicts: .claude/scripts/detect-file-conflicts.sh
skills:
  tdd: .claude/skills/flow-tdd/SKILL.md
  verification: .claude/skills/verification-before-completion/SKILL.md
  attention: .claude/skills/flow-attention-refresh/SKILL.md
---

# Flow-Dev - 开发执行命令

## TDD Iron Law (新增)

参考 `{SKILL:tdd}`:

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

### TDD Checkpoint

在 Phase 2 (Tests) 和 Phase 3 (Implementation) 之间，必须执行：

```yaml
⚠️ TEST VERIFICATION CHECKPOINT:
  1. 运行所有 Phase 2 测试
     → npm test (或 quickstart 中的测试命令)

  2. 验证所有新测试 FAIL
     → 如果任何测试 PASS → STOP
     → 通过的测试 = 无效测试或代码已存在

  3. 只有全部 FAIL 后才能进入 Phase 3

  4. 如果已经写了实现代码:
     → DELETE 代码
     → 重新从 failing tests 开始
```

### Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Tests are ready, let's implement" | Run tests first. Verify they FAIL. |
| "I'll run tests after implementation" | That's testing-after, not TDD. |
| "Test passed, that's good" | Test passing before implementation = invalid test. |
| "Just this once" | No exceptions. TDD is non-negotiable. |

## User Input
```text
$ARGUMENTS = "REQ_ID? [--task T###] [--manual] [--max-iterations N] [--team] [--agents N]"
```

- **REQ_ID**: 未提供时从当前分支或 `DEVFLOW_REQ_ID` 推断
- **--task T###**: 指定起始任务（从该任务开始执行）
- **--manual**: Manual模式，遇错停止等待人工修复（向后兼容）
- **--max-iterations N**: Autonomous模式最大迭代次数（默认10）
- **--team**: Team模式，启用多 Agent 并行执行 [NEW: v4.7]
- **--agents N**: Team模式下的 Agent 数量（默认3，范围2-5）[NEW: v4.7]

**默认行为**: Autonomous模式（自动重试直到完成）

### 运行模式对比

| | Manual模式 | Autonomous模式（默认） | Team模式 [NEW] |
|--|------------|----------------------|----------------|
| 触发方式 | `--manual` | 默认 | `--team` |
| 遇到错误 | 停止，等待人工修复 | 自动重试 | 分布式重试 |
| 并行执行 | 否 | 否 | 是（多 Agent） |
| 注意力刷新 | Protocol 2 | Protocol 2+3+4 | 每 Agent 独立 |
| 适用场景 | 复杂需求 | 清晰需求 | 大量并行任务 |
| 退出条件 | 任务失败可停止 | 迭代直到完成 | 所有 Agent 完成 |

**示例**:
```bash
/flow-dev "REQ-123"                      # Autonomous模式，max 10 iterations
/flow-dev "REQ-123" --max-iterations 20  # Autonomous模式，max 20 iterations
/flow-dev "REQ-123" --manual             # Manual模式，遇错停止
/flow-dev "REQ-123" --task T005          # 从 T005 开始（Autonomous模式）
/flow-dev "REQ-123" --task T005 --manual # 从 T005 开始（Manual模式）
/flow-dev "REQ-123" --team               # Team模式，3 个 Agent 并行
/flow-dev "REQ-123" --team --agents 5    # Team模式，5 个 Agent 并行
```

## 执行流程

### 阶段 1: Entry Gate
```
1. 解析参数
   → Parse: REQ_ID, --task, --manual, --max-iterations, --team, --agents
   → If REQ_ID not provided: run {SCRIPT:prereq} --json --paths-only
   → Determine mode:
      • --team flag present → Team mode
      • --manual flag present → Manual mode
      • Otherwise → Autonomous mode (default max_iterations = 10)

2. 校验资产
   → 必须存在（/flow-tech 产物）:
      • TECH_DESIGN.md (技术方案总纲)
      • research/codebase-tech-analysis.md (代码库技术分析)
      • data-model.md (数据模型定义)
      • contracts/ (API 契约目录，至少 1 个文件)
      • quickstart.md (快速启动指南)
   → 必须存在（/flow-epic 产物）:
      • EPIC.md (Epic 规划文档)
      • TASKS.md (任务分解清单)
   → 状态校验:
      • orchestration_status.status ∈ {"epic_complete", "development_in_progress"}
      • phase0_complete == true (研究阶段完成)
      • phase1_complete == true (技术设计完成)

3. TASKS 结构校验
   → Phase 顺序: Setup → Foundational → Phase 2 Tests First → ⚠️ Test Verification → Phase 3 Core Implementation → ...
   → 任务格式 `- [ ] T### [P?] [US?] Description (path)`

4. 模式初始化
   → If Team mode:
      • Run: {SCRIPT:team_init} init "${REPO_ROOT}" "${REQ_ID}" ${NUM_AGENTS}
      • Analyze tasks: {SCRIPT:team_init} analyze "${REPO_ROOT}" "${REQ_ID}"
      • Check conflicts: {SCRIPT:team_init} conflicts "${REPO_ROOT}" "${REQ_ID}"
      • Assign tasks: {SCRIPT:team_init} assign "${REPO_ROOT}" "${REQ_ID}" ${NUM_AGENTS}
      • Log to EXECUTION_LOG.md: "Starting Team mode with N agents"
   → If Autonomous mode:
      • Run: {SCRIPT:setup_loop} "${REQ_ID}" --max-iterations ${MAX_ITERATIONS}
      • Creates .claude/ralph-loop.local.md (state file for Stop Hook)
      • Creates ERROR_LOG.md if not exists
      • Log to EXECUTION_LOG.md: "Starting Autonomous mode"
   → If Manual mode:
      • Log to EXECUTION_LOG.md: "Starting Manual mode"

5. 起始任务
   → Run: {SCRIPT:check_tasks} --json
   → 若指定 --task，验证任务存在且未完成
   → 记录下一任务 ID
```

### 阶段 2: Quickstart 与风格指南加载
```
1. 读取 quickstart.md
   → 获取环境变量、依赖安装、测试命令

2. 读取 STYLE.md（如存在）
   → 检查 devflow/STYLE.md 文件
   → 如存在:
      • 加载设计风格指南（颜色、字体、间距、组件样式等）
      • 所有前端代码生成必须遵循 STYLE.md 定义的风格
      • 特别注意:
        - 颜色使用（使用 CSS Variables 或 Tailwind classes 引用 STYLE.md 定义）
        - 字体使用（字体族、字阶、行高、字重等必须符合 STYLE.md）
        - 间距使用（padding, margin, gap 必须使用 STYLE.md 的间距系统）
        - 组件结构（Button, Card, Input 等必须遵循 STYLE.md 的组件规范）
        - 阴影、圆角、动画、透明度等（必须遵循 STYLE.md）
      • 在 EXECUTION_LOG.md 记录 STYLE.md 版本和使用情况
   → 如不存在:
      • 使用项目现有的样式约定（如有）
      • 建议用户运行 /flow-style 建立项目设计标准

3. 如果首次运行:
   → 执行 quickstart 中的 setup 命令

4. 在 EXECUTION_LOG.md 记录 quickstart 版本 + STYLE.md 版本（如有）
```

### 阶段 3: 执行循环

**Team 模式循环** (--team) [NEW: v4.7]:
```
┌──────────────────────────────────────────────────────────────────┐
│ Team Mode Execution Flow                                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. 任务分析与分配                                                 │
│     → Run: {SCRIPT:team_init} analyze "${REPO_ROOT}" "${REQ_ID}"  │
│     → Run: {SCRIPT:team_init} conflicts "${REPO_ROOT}" "${REQ_ID}"│
│     → Run: {SCRIPT:team_init} assign "${REPO_ROOT}" "${REQ_ID}" N │
│                                                                   │
│  2. 并行执行                                                       │
│     → 每个 Agent 独立执行分配的任务                                │
│     → 文件冲突的任务分配给同一 Agent 串行执行                       │
│     → 无冲突的任务可并行执行                                       │
│                                                                   │
│  3. 任务完成处理                                                   │
│     → TeammateIdle Hook 验证任务完成                               │
│     → 验证通过 → 标记完成，分配下一任务                            │
│     → 验证失败 → 继续修复                                          │
│                                                                   │
│  4. 阶段转换                                                       │
│     → 当前阶段所有任务完成 → 进入下一阶段                          │
│     → 重新分析任务并行性和冲突                                     │
│                                                                   │
│  5. 完成条件                                                       │
│     → 所有任务完成 → 所有 Agent shutdown                           │
│     → 更新 orchestration_status.json                               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

Task Assignment Strategy:
┌─────────────────────────────────────────────────────────────────┐
│ 1. 解析 TASKS.md 获取当前阶段任务                                 │
│    → node {SCRIPT:parse_tasks} next TASKS.md                     │
│                                                                  │
│ 2. 检测文件冲突                                                   │
│    → {SCRIPT:detect_conflicts} < tasks.json                      │
│                                                                  │
│ 3. 分配策略                                                       │
│    → 有冲突: 冲突任务分配给同一 Agent                             │
│    → 无冲突: Round-robin 分配给各 Agent                           │
│                                                                  │
│ 4. 输出分配计划                                                   │
│    {                                                             │
│      "assignments": [                                            │
│        {"agent": "dev-1", "tasks": ["T001", "T002"]},            │
│        {"agent": "dev-2", "tasks": ["T003"]},                    │
│        {"agent": "dev-3", "tasks": ["T004"]}                     │
│      ],                                                          │
│      "hasConflicts": false                                       │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘

Conflict Resolution:
┌─────────────────────────────────────────────────────────────────┐
│ 文件冲突检测示例:                                                 │
│                                                                  │
│ Input:                                                           │
│   T001 [P] 修改 src/user.ts                                      │
│   T002 [P] 修改 src/user.ts                                      │
│   T003 [P] 修改 src/order.ts                                     │
│                                                                  │
│ Output:                                                          │
│   {                                                              │
│     "hasConflicts": true,                                        │
│     "conflicts": [                                               │
│       {"file": "src/user.ts", "tasks": ["T001", "T002"]}         │
│     ],                                                           │
│     "safeGroups": [{"tasks": ["T003"]}]                          │
│   }                                                              │
│                                                                  │
│ Assignment:                                                      │
│   dev-1: T001, T002 (串行，因为冲突)                              │
│   dev-2: T003 (独立)                                             │
└─────────────────────────────────────────────────────────────────┘
```

**Manual 模式循环** (--manual):
```
For each remaining task (顺序严格遵循 TASKS.md):

**注意力刷新** (参见 {SKILL:attention} Protocol 2):
→ Read: TASKS.md 当前任务 T### 段落 + DoD
→ Read: quickstart.md 相关命令
→ Focus: 这个任务的验收标准是什么？
→ Then: 开始执行任务

1. 读取任务定义
   → 提取 task id、phase、文件路径、是否 [P]

2. 执行策略
   - Phase 2 (测试任务):
       • 根据 contracts/ 生成 contract/integration tests
       • 每个测试必须 FAIL (使用 quickstart 的 test 命令)
   - Phase 3 (实现任务):
       • 依据 data-model.md、TECH_DESIGN.md、contracts/ 实现代码
       • 运行相关测试 (quickstart) 确认 PASS
   - 后续 Phase:
       • 按任务描述（安全、性能、文档等）完成

3. 验证 DoD
   → 测试失败/成功状态符合阶段要求
   → 文件路径与任务描述一致

4. 错误处理 (Manual 模式)
   → 遇到错误 → 停止执行
   → 提示用户修复问题
   → 可选：记录到 ERROR_LOG.md

5. 标记完成 (CRITICAL)
   → Run: {SCRIPT:mark_task} T### (MANDATORY)
   → 必须执行此脚本将 TASKS.md 中的 [ ] update 为 [x]
   → 如果不执行此脚本，Check Tasks 将认为任务未完成并导致死循环
   → Git 提交 (一任务一提交)
```

**Autonomous 模式循环** (默认):
```
FOR iteration in 1..max_iterations:

  ┌──────────────────────────────────────────────────────┐
  │ Step A: 注意力刷新 (Protocol 2 + Protocol 3)         │
  ├──────────────────────────────────────────────────────┤
  │ → Read: TASKS.md 第一个未完成任务 `- [ ]`             │
  │ → Read: ERROR_LOG.md 最近 5 条记录（如存在）          │
  │ → Read: quickstart.md 相关命令                        │
  │ → Focus: 下一步行动 + 避免重复错误                     │
  └──────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────┐
  │ Step B: 执行任务 (TDD 方式)                           │
  ├──────────────────────────────────────────────────────┤
  │ → 提取任务 ID, phase, 文件路径                        │
  │ → 遵循 {SKILL:tdd} 执行                              │
  │ → Phase 2: 写测试，验证 FAIL                          │
  │ → Phase 3: 写实现，验证 PASS                          │
  │ → 后续 Phase: 按任务描述完成                          │
  └──────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────┐
  │ Step C: 错误处理 (Autonomous 自动重试)                │
  ├──────────────────────────────────────────────────────┤
  │ IF test fails OR build error:                        │
  │   → Record error to ERROR_LOG.md (强制)              │
  │   → Apply Protocol 4 (Error Recovery)                │
  │   → Analyze root cause                               │
  │   → Fix and re-run tests                             │
  │   → Update ERROR_LOG.md with resolution              │
  │ ELSE:                                                │
  │   → Task succeeded                                   │
  │   → Run: {SCRIPT:mark_task} T### (CRITICAL: MUST RUN)│
  │   → NEVER skip this step. Task is NOT done until marked.│
  │   → Git commit (one task per commit)                 │
  └──────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────┐
  │ Step D: 完成检查                                      │
  ├──────────────────────────────────────────────────────┤
  │ → Run: {SCRIPT:check_tasks} --json                   │
  │ → IF remaining_tasks == 0:                           │
  │     → Output "AUTONOMOUS_COMPLETE"                   │
  │     → BREAK (Exit loop successfully)                 │
  │ → ELSE IF iteration == max_iterations:               │
  │     → Output status report                           │
  │     → BREAK (Reached limit)                          │
  │ → ELSE:                                              │
  │     → Continue to next iteration                     │
  │     → Stop Hook will re-inject same prompt           │
  └──────────────────────────────────────────────────────┘

END FOR

Note: Stop Hook (.claude/hooks/ralph-stop-hook.sh) 会在 Autonomous 模式下:
  • 检测 .claude/ralph-loop.local.md 存在
  • 阻止退出，重新注入任务继续 prompt
  • 直到 remaining_tasks == 0 或达到 max_iterations
```

### 阶段 4: Exit Gate
```
1. 所有任务完成?
   → {SCRIPT:check_tasks} --json 确认 remaining=0

2. 清理 Autonomous 状态文件（如存在）
   → rm .claude/ralph-loop.local.md

3. 代码质量
   → 运行 quickstart 中全量测试命令
   → 可选: {SCRIPT:validate_constitution} --type dev --severity warning

4. 状态更新
   → orchestration_status:
        status = "development_complete"
        completedSteps append "dev"
   → EXECUTION_LOG.md 记录完成
```

## 运行提示
- **默认 Autonomous 模式**: 遇错自动重试，无需人工干预
- **使用 `--manual` 退出**: 适合需要人工判断的复杂场景
- **使用 `--team` 并行**: 适合大量可并行任务的需求 [NEW: v4.7]
- **使用 `/cancel-ralph` 停止**: 紧急停止 Autonomous 循环
- 始终使用 quickstart 中提供的命令（测试、lint、db migrate 等）
- Phase 2 的所有测试必须在实现前失败；若某测试直接通过，回滚并修正
- 遵循 TASKS.md 标注的 `[P]` 表示可并行，Team 模式下会真正并行执行
- 如需恢复，可使用 `/flow-dev --task TXYZ` 指向首个未完成任务

## 错误处理

**Manual 模式**:
- 缺少资产 → 引导用户先运行 `/flow-tech` 或 `/flow-epic`
- quickstart 命令失败 → 输出日志路径，要求修复环境后重试
- 任务执行失败 → 保留当前状态，停止执行，等待人工修复

**Autonomous 模式**:
- 缺少资产 → 同 Manual 模式（Entry Gate 阻止）
- quickstart 命令失败 → 记录 ERROR_LOG.md，分析根因，自动修复，重试
- 任务执行失败 → 记录 ERROR_LOG.md，Protocol 4 刷新注意力，自动重试
- 达到 max_iterations → 输出状态报告（已完成/剩余任务），保持 development_in_progress
- 紧急停止 → 使用 `/cancel-ralph` 删除状态文件，立即终止循环

**Team 模式** [NEW: v4.7]:
- 缺少资产 → 同 Manual 模式（Entry Gate 阻止）
- 文件冲突 → 自动检测并分配给同一 Agent 串行执行
- Agent 任务失败 → TeammateIdle Hook 触发重试
- 所有 Agent 空闲但任务未完成 → 重新分配任务
- 紧急停止 → 清理 Team 状态，所有 Agent shutdown

## 取消 Autonomous 循环

```bash
/cancel-ralph
# 检查 .claude/ralph-loop.local.md 存在性
# 删除状态文件，Stop Hook 将允许退出
# 输出：Cancelled autonomous loop (was at iteration N)
```

## 下一步
1. 完成所有任务后运行 `/flow-quality` 进入测试与安全审查（需要深度审查时再加 `--full`）
2. 若有新技术引入，回到 `research/tasks.json` 补记并通知 planner
