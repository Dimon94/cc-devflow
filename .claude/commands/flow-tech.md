---
name: flow-tech
description: Generate Technical Design package. Usage: /flow-tech "REQ-123" or /flow-tech
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  tech_analysis: .claude/scripts/generate-tech-analysis.sh
  extract_data_model: .claude/scripts/extract-data-model.sh
  export_contracts: .claude/scripts/export-contracts.sh
  quickstart: .claude/scripts/generate-quickstart.sh
agent_scripts:
  sh: .claude/scripts/update-agent-context.sh __AGENT__
  ps: scripts/powershell/update-agent-context.ps1 -AgentType __AGENT__
---

# Flow-Tech - 技术方案生成命令

## User Input
```text
$ARGUMENTS = "REQ_ID"
```
若缺省则从当前分支或 `DEVFLOW_REQ_ID` 推断；进入流程前必须解析成功。

## 命令格式
```text
/flow-tech "REQ_ID"
/flow-tech             # Auto-detect from current branch
```

### 参数说明
- **REQ_ID**: 需求编号 (可选，默认从当前 Git 分支或环境变量获取)

## 执行流程

### 阶段 0: Anti-Tech-Creep Gate
- 读取 `CLAUDE.md` 的技术架构章节并对照 `research/internal/codebase-overview.md`。
- 若缺失或与现状不符：重写 ≤15 行的架构摘要并记录核心原则。
- 触发约束：除非在技术方案中明确说明，禁止引入新技术或任意替换既有栈。

### 阶段 1: 前置条件检查 (Entry Gate)
```
1. 解析 REQ_ID
   → If $ARGUMENTS provided: use split("|") first token
   → Else: run {SCRIPT:prereq} --json --paths-only
   → If仍为空: ERROR "No requirement ID found."

2. 验证目录与产物
   → 检查: devflow/requirements/${REQ_ID}/
   → 必须存在: PRD.md, research/research.md, research/tasks.json, research/internal/codebase-overview.md
   → orchestration_status.json.phase0_complete 必须为 true

3. 状态门
   → status ∈ {prd_complete, ui_complete, tech_design_failed}
   → 未满足则拒绝进入。
```

### 阶段 2: 技术细化分析
```
1. 执行 {SCRIPT:tech_analysis} "${REQ_ID}"
   → 输出: research/codebase-tech-analysis.md
   → 内容: 数据模型模式、API 模式、认证、安全、数据库、可复用组件、测试、示例代码。

2. 同步 EXECUTION_LOG.md
   → 记录分析完成时间、重点洞察、待确认风险。
```

### 阶段 3: 资产生成与 Agent 调用
```
1. 准备 TECH_DESIGN 上下文
   → 读取: PRD.md, research/research.md, research/codebase-tech-analysis.md
   → 可选: UI_PROTOTYPE.html (存在时加载结构摘要)
   → 更新 orchestration_status: status=tech_design_in_progress, phase=technical_design.

2. 调用 tech-architect agent
   → 加载模板: .claude/docs/templates/TECH_DESIGN_TEMPLATE.md
   → 执行模板 Execution Flow，输出 TECH_DESIGN.md（无 {{PLACEHOLDER}}）
   → 记录 log_event "${REQ_ID}" "Technical design completed"

3. 派生资产
   → Run: {SCRIPT:extract_data_model} "${REQ_ID}" → 生成 data-model.md
   → Run: {SCRIPT:export_contracts} "${REQ_ID}" → 生成 contracts/openapi.yaml (或其他格式)
   → Run: {SCRIPT:quickstart} "${REQ_ID}" → 生成 quickstart.md（包含环境、测试命令、验证步骤）

4. 更新代理上下文
   → Run: {AGENT_SCRIPT}  # 仅新增技术条目，保持 markers 内手动内容
   → 在 EXECUTION_LOG.md 记录新增技术。
```

### 阶段 4: 完成校验 (Exit Gate)
```
1. 文件存在性
   → TECH_DESIGN.md, research/codebase-tech-analysis.md
   → data-model.md, contracts/, quickstart.md

2. 质量检查
   → TECH_DESIGN.md: 包含系统架构/技术栈/数据模型/API/安全/性能/Constitution Gate
   → data-model.md: 实体、字段、关系、校验、状态机
   → contracts/: 所有端点请求/响应 schema
   → quickstart.md: 环境准备、测试矩阵、验证指令

3. 宪法校验
   → Run: validate-constitution.sh --type tech_design --severity warning
   → 若有 ERROR 级别违规：终止并修复

4. 状态更新
   → orchestration_status.json:
      • status = "tech_design_complete"
      • phase = "epic_planning"
      • phase1_complete = true
      • completedSteps append "tech_design"
   → EXECUTION_LOG.md 记录出口验收。
```

### 阶段 5: 输出与下一步
- 汇总结果：
  ```
  ✅ TECH_DESIGN.md
  ✅ research/codebase-tech-analysis.md
  ✅ data-model.md
  ✅ contracts/openapi.yaml
  ✅ quickstart.md
  ```
- 建议操作：
  1. 审阅技术方案关键决策。
  2. 使用 `/flow-epic` 进入任务规划（会 gate 检查上述资产）。
  3. 如需补充研究，回到 `/flow-init` 生成的 research/tasks.json 更新状态。

## 错误处理提示
- 缺少 PRD 或 research.md → 直接 ERROR，让用户先补 Phase 0。
- agent 输出不完整 → 保留临时文件并记录 `tech_design_failed`，用户可修正后重试。
- 派生资产脚本失败 → 标记 `phase1_complete = false`，提示对应脚本名与日志路径。

## 宪法遵循
- Simplicity Gate：设计 ≤3 栈层、禁止为未来功能做预设。
- Anti-Abstraction Gate：直接使用框架，不新增自定义抽象层。
- Integration-First Gate：所有 contracts 在 Phase 2 先定义，Phase 3 任务只需按合同落地。

## 产物摘要
- `TECH_DESIGN.md`: 技术总纲，引用子文档链接。
- `research/codebase-tech-analysis.md`: 深度分析，支撑方案假设。
- `data-model.md`: 供 planner 和 DB 工具使用的实体清单。
- `contracts/`: OpenAPI/GraphQL 等契约基线。
- `quickstart.md`: QA、Dev、CI 共享的执行脚本。
