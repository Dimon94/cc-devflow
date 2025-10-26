---
name: flow-epic
description: Generate Epic and Tasks breakdown. Usage: /flow-epic "REQ-123" or /flow-epic
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  setup: .claude/scripts/setup-epic.sh
  validate_constitution: .claude/scripts/validate-constitution.sh
agent_scripts:
  sh: .claude/scripts/update-agent-context.sh __AGENT__
  ps: scripts/powershell/update-agent-context.ps1 -AgentType __AGENT__
---

# Flow-Epic - Epic 和任务规划命令

## User Input
```text
$ARGUMENTS = "REQ_ID?"
```
空输入时根据当前分支或 `DEVFLOW_REQ_ID` 自动解析；如果无法解析必须直接报错。

## 命令格式
```text
/flow-epic "REQ_ID"
/flow-epic             # Auto-detect from current branch
```

## 执行流程

### 阶段 1: Entry Gate
```
1. Requirement ID
   → Provided: use argument
   → Else: run {SCRIPT:prereq} --json --paths-only
   → Missing: ERROR "No requirement ID found."

2. 结构校验
   → 需求目录、EXECUTION_LOG.md、orchestration_status.json 必须存在
   → PRD.md 完整且无 {{PLACEHOLDER}}
   → 技术产物：
      • research/research.md
      • research/tasks.json
      • research/codebase-tech-analysis.md
      • data-model.md
      • contracts/ (至少 1 契约文件)
      • quickstart.md
   → orchestration_status.phase0_complete / phase1_complete 均为 true

3. 状态检查
   → status ∈ {tech_design_complete, epic_generation_failed}
   → 已存在 EPIC.md 或 TASKS.md → WARN 并询问是否覆盖

4. Constitution Gate
   → Run: {SCRIPT:validate_constitution} --type prd --severity error --json
   → 若有 ERROR 级违规 → 停止
```

### 阶段 2: Epic/TASKS 初始化
```
1. 执行 {SCRIPT:setup} --json
   → 返回 EPIC_FILE, TASKS_FILE, reqId, title
2. 加载模板
   → EPIC_TEMPLATE.md、TASKS_TEMPLATE.md
3. 写入 orchestration_status
   → status = "epic_generation_in_progress"
   → phase = "planning"
4. EXECUTION_LOG.md 追加启动记录
```

### 阶段 3: Planner Agent
```
Agent Prompt 要点：
- Inputs:
   • PRD.md
   • TECH_DESIGN.md
   • research/research.md (决策)
   • data-model.md
   • contracts/ (OpenAPI/GraphQL)
   • quickstart.md (测试环境/命令)
   • research/codebase-tech-analysis.md
   • UI_PROTOTYPE.html (若存在)
- Must:
   • 执行 Phase -1 Gates (Simplicity / Anti-Abstraction / Integration-First)
   • 按模板输出 EPIC.md (含 Success Metrics、Phase 2 Tests First、Complexity Tracking)
   • 生成单一 TASKS.md：
       - Phase 1 Setup → Phase 2 Foundational → Phase 3+ User Stories → Final Polish
       - Phase 2 列出所有 contract/integration tests（引用 contracts/ 路径）
       - Phase 3+ 依据 data-model 分配实体、依据 contracts 分配端点
       - 引用 quickstart 中的命令作为测试/验证步骤
       - 使用 `[US#]`、`[P]` 标签，包含精确文件路径
       - 插入 “⚠️ TEST VERIFICATION CHECKPOINT” 于 Phase 2 与 Phase 3 之间
   • Dependencies、Parallel Execution、Implementation Strategy 必须填写
   • Constitution Check per phase
```

### 阶段 4: Exit Gate
```
1. 文件存在
   → EPIC_FILE, TASKS_FILE

2. EPIC.md 结构
   → 包含 Technical Approach、Phase 2 Tests First、Complexity Tracking、Constitution Check
   → 无 {{PLACEHOLDER}}

3. TASKS.md 结构
   → Phase 顺序正确 (Setup → Foundational → US… → Polish)
   → Phase 2 在 Phase 3 前且包含 contract tests
   → “⚠️ TEST VERIFICATION CHECKPOINT” 位于 Phase 2 与 Phase 3 之间
   → 任务格式 `- [ ] T### [P?] [US#?] Description with file path`

4. 依赖覆盖
   → 数据模型任务与 data-model.md 一致
   → API 任务覆盖 contracts/
   → Tests 引用 quickstart 与 contracts

5. 状态更新
   → orchestration_status:
        status = "epic_complete"
        completedSteps append "epic"
   → EXECUTION_LOG.md 记录完成时间
```

## 错误处理
- 缺少任一必需产物 → 直接返回 ERROR 提示回到 `/flow-tech`。
- Planner 生成失败 → 标记 `epic_generation_failed`，用户可修正后重试。
- Constitution 校验不通过 → 输出违规项并终止。

## 输出
- `EPIC.md`: 包含范围、成功指标、TDD 阶段、复杂度跟踪。
- `TASKS.md`: 单文件任务清单，按 user story 独立测试，引用 data-model、contracts、quickstart。

## 后续建议
1. 审阅任务依赖和并行策略。
2. 立即运行 `/flow-dev` 进入实现，确保 Phase 2 Tests 先落地。
3. 若新增技术栈，回到 `research/tasks.json` 更新研究状态并同步 agent context。
