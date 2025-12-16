---
name: flow-dev
description: Execute development tasks following TDD order. Usage: /flow-dev "REQ-123" or /flow-dev
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  check_tasks: .claude/scripts/check-task-status.sh
  mark_task: .claude/scripts/mark-task-complete.sh
  validate_constitution: .claude/scripts/validate-constitution.sh
---

# Flow-Dev - 开发执行命令

## User Input
```text
$ARGUMENTS = "REQ_ID? [--task T###]"
```
未提供 REQ_ID 时从当前分支或 `DEVFLOW_REQ_ID` 推断；`--task` 用于指定起始任务。

## 执行流程

### 阶段 1: Entry Gate
```
1. 解析 REQ_ID 与 --task
   → If argument provided: split
   → Else: run {SCRIPT:prereq} --json --paths-only

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

4. 起始任务
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

### 阶段 3: TDD 循环
```
For each remaining task (顺序严格遵循 TASKS.md):

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

4. 标记完成
   → Run: {SCRIPT:.claude/scripts/mark-task-complete.sh} T###
   → Git 提交 (一任务一提交)
```

### 阶段 4: Exit Gate
```
1. 所有任务完成?
   → {SCRIPT:check_tasks} --json 确认 remaining=0

2. 代码质量
   → 运行 quickstart 中全量测试命令
   → 可选: {SCRIPT:validate_constitution} --type dev --severity warning

3. 状态更新
   → orchestration_status:
        status = "development_complete"
        completedSteps append "dev"
   → EXECUTION_LOG.md 记录完成
```

## 运行提示
- 始终使用 quickstart 中提供的命令（测试、lint、db migrate 等）。
- Phase 2 的所有测试必须在实现前失败；若某测试直接通过，回滚并修正。
- 遵循 TASKS.md 标注的 `[P]` 仅表示逻辑上可并行，实际执行依旧串行。
- 如需恢复，可使用 `/flow-dev --task TXYZ` 指向首个未完成任务。

## 错误处理
- 缺少资产 → 引导用户先运行 `/flow-tech` 或 `/flow-epic`。
- quickstart 命令失败 → 输出日志路径，要求修复环境后重试。
- 任务执行失败 → 保留当前状态，不自动跳过。

## 下一步
1. 完成所有任务后运行 `/flow-qa` 进入测试与安全审查。
2. 若有新技术引入，回到 `research/tasks.json` 补记并通知 planner。
