---
name: flow-prd
description: Generate Product Requirements Document. Usage: /flow-prd "REQ-123" or /flow-prd
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  validate_research: .claude/scripts/validate-research.sh
  validate_constitution: .claude/scripts/validate-constitution.sh
---

# Flow-PRD - PRD 生成命令

## User Input
```text
$ARGUMENTS = "REQ_ID?"
```
若未提供则根据当前分支或 `DEVFLOW_REQ_ID` 自动解析。

## 命令格式
```text
/flow-prd "REQ_ID"
/flow-prd             # Auto-detect from current branch
```

## 执行流程

### 阶段 1: Entry Gate
```
1. 解析 REQ_ID
   → If argument provided: use it
   → Else: run {SCRIPT:prereq} --json --paths-only
   → If仍为空: ERROR "No requirement ID found."

2. 校验目录
   → 使用 {SCRIPT:prereq} --json 获取路径
   → 必须存在:
      • devflow/requirements/${REQ_ID}/
      • EXECUTION_LOG.md
      • orchestration_status.json (phase0_complete == true)
      • research/research.md
      • research/tasks.json
   → 缺少任何研究产物 → ERROR "Research artifacts missing. Run /flow-init consolidation."

   **研究材料质量验证** (新增 - 2025-01-26):
   → Run: {SCRIPT:validate_research} "${REQ_DIR}" --strict
   → 验证 research.md 质量（5-Level 检查）:
      • LEVEL 1: research.md 文件存在
      • LEVEL 2: 必需章节完整 (Research Summary, Decisions)
      • LEVEL 3: 无 TODO/PLACEHOLDER 占位符
      • LEVEL 4: tasks.json 格式有效
      • LEVEL 5: Constitution 合规
   → 验证失败 → ERROR "research.md quality check failed. Fix issues before /flow-prd."

   **CRITICAL**: 如果 research.md 包含 "TODO - fill decision outcome"，
   说明 /flow-init 的研究任务未完成。prd-writer 无法使用不完整的研究材料。

   **Fix Options**:
     1. 手动填充 research/tasks.json 的 decision/rationale/alternatives 字段
     2. 重新运行 consolidate-research.sh
     3. 直接编辑 research/research.md 补充决策内容
     4. 参考 .claude/docs/templates/RESEARCH_TEMPLATE.md 模板

3. PRD 覆盖提示
   → 若 PRD.md 已存在 → WARN 并确认是否覆盖

4. 状态校验
   → orchestration_status.status ∈ {"initialized", "prd_generation_failed"}
   → 否则提示按流程顺序执行
```

### 阶段 2: 生成准备
```
1. Load PRD 模板 (.claude/docs/templates/PRD_TEMPLATE.md)
2. 汇总上下文:
   → research/research.md（Decision/Rationale/Alternatives）
   → research/internal/codebase-overview.md
   → research/mcp/*.md（如有）
3. 更新 orchestration_status:
   → status = "prd_generation_in_progress"
   → phase = "planning"
4. EXECUTION_LOG.md 记录启动条目
```

### 阶段 3: 调用 prd-writer Agent
```
Prompt 关键要点:
  - 输入: REQ_ID, Title, research 集合, PRD 模板
  - 要求:
      • 按模板 Execution Flow 输出背景、目标、用户故事 (GWT)、NFR、技术约束、成功指标
      • 记录 Constitution Check，确保无硬编码密钥、无部分实现
      • 验证清单必须填写
  - 输出: 完整 PRD.md
  - 日志: log_event "${REQ_ID}" "PRD generation completed"
```

### 阶段 4: Exit Gate
```
1. 文件存在
   → PRD.md 必须生成

2. 结构检查
   → 无 {{PLACEHOLDER}}
   → 包含: 背景/目标、用户故事+GWT、NFR、技术约束、成功指标、Constitution Check、验证清单

3. 宪法校验
   → Run: {SCRIPT:validate_constitution} --type prd --severity warning
   → 出现 ERROR 级违规时终止

4. 状态更新
   → orchestration_status:
        status = "prd_complete"
        phase = "epic_planning"
        completedSteps append "prd"
   → EXECUTION_LOG.md 记录完成
```

## 输出
```
✅ PRD.md (≥100 行、完整模板)
✅ orchestration_status.json 更新 (prd_complete)
✅ EXECUTION_LOG.md 记录
```

## 错误处理
- 缺少研究产物 → 返回指令让用户重复 `/flow-init` consolidation。
- PRD 生成失败 → 将 status 设为 `prd_generation_failed`，方便重试。
- 宪法检查失败 → 显示违规列表并终止，待修复后重跑。

## 下一步
1. 审阅 PRD.md，确认需求准确。
2. 运行 `/flow-tech` 生成技术方案及 data-model/contracts/quickstart。
3. 使用 `/flow-epic` 做 Epic/TASKS 规划。
