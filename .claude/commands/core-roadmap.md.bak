---
name: core-roadmap
description: 'Generate product roadmap and architecture through 6-stage interactive dialogue. Usage: /core-roadmap'
scripts:
  calculate_quarter: .claude/scripts/calculate-quarter.sh
  sync_progress: .claude/scripts/sync-roadmap-progress.sh
---

# Flow-Roadmap - 路线图规划命令

## 命令格式
```text
/core-roadmap              # Start 6-stage roadmap planning dialogue
/core-roadmap --regenerate # Regenerate existing roadmap with current data
```

## 核心原则

**这是一个对话型命令（Command），负责多轮对话引导用户完成路线图规划。**
**roadmap-planner 和 architecture-designer 是研究型 Agent，只接收上下文，不对话。**

### 架构模式
```
用户
  ↓
core-roadmap (6-stage dialogue) ← 你在这里
  ↓
  ├─→ roadmap-planner (research, no dialogue)
  │     ↓
  │   ROADMAP.md + BACKLOG.md
  │
  └─→ architecture-designer (research, no dialogue)
        ↓
      ARCHITECTURE.md (4 diagrams)
```

## 执行流程

### Stage 0: 上下文检测 (Context Detection)

**目标**: 判断是首次创建还是更新现有路线图

```
1. 检查 devflow/ROADMAP.md 是否存在
   → 存在:
      • 读取当前路线图内容
      • 提取现有 RM-IDs 和 milestones
      • 询问用户: "您想要调整哪些方面？(vision/timeline/priorities/dependencies)"
      • 模式 = "update"

   → 不存在:
      • 提示: "未找到现有路线图，将引导您创建新的路线图"
      • 模式 = "create"

2. 运行 {SCRIPT:calculate_quarter}
   → 获取当前季度信息 (CURRENT_QUARTER, PLANNING_HORIZON, REMAINING_DAYS, NEXT_QUARTERS)
   → 保存到 context.quarter_info

3. 扫描 devflow/requirements/
   → 统计完成/进行中/已计划的需求数量
   → 从 EXECUTION_LOG.md 计算平均完成时间
   → 计算 Velocity:
      • completed_reqs = COUNT(REQ-*/orchestration_status.json where status="merged")
      • avg_days_per_req = AVERAGE(time between phase0_complete and merged)
      • capacity = (90 days / avg_days_per_req) OR (REMAINING_DAYS / avg_days_per_req) for current quarter
   → 保存到 context.velocity

4. 初始化 context 对象:
   {
     "mode": "create" | "update",
     "quarter_info": {...},
     "velocity": {...},
     "existing_roadmap": {...}, // if update mode
     "vision_statement": "",
     "candidates": [],
     "dependencies": [],
     "timeline": {}
   }
```

### Stage 1: 愿景声明 (Vision Statement)

**目标**: 明确项目未来 3 个月的核心方向

```
🎯 对话引导:

"让我们规划未来 {PLANNING_HORIZON} 的产品路线图。"
"当前进度: 已完成 {completed_reqs} 个需求，平均 {avg_days_per_req} 天/需求"
"预计容量: 当前季度剩余 {capacity} 个需求，后续季度每季度约 {quarterly_capacity} 个需求"
""
"首先，请描述未来 3 个月的核心愿景:"
"1. 要解决什么核心问题？"
"2. 目标用户是谁？"
"3. 核心价值主张是什么？"
"4. 期望达成的里程碑是什么？"
""
"示例: 我们正在打造最好用的 AI 助手桌面应用。在接下来的 3 个月，我们将专注于提升用户体验和性能..."

等待用户回复 →
```

```
用户回复后:

1. 验证愿景是否清晰:
   → 包含问题、用户、价值、目标
   → 长度 50-500 字

2. 保存到 context.vision_statement

3. 总结并确认:
   "您的愿景: {summary_of_vision}"
   "确认进入下一阶段吗? (yes/no/modify)"

用户确认 → Stage 2
用户 modify → 重新引导 Stage 1
```

### Stage 2: 项目分析 (Project Analysis)

**目标**: 分析现有需求，识别延伸方向

```
🔍 自动执行:

1. 扫描 devflow/requirements/REQ-*/PRD.md
   → 提取每个需求的核心功能和技术栈
   → 识别功能模块（认证、会话、输入、分析等）
   → 统计技术债务和优化需求

2. 分析完成需求的衍生可能:
   For each completed REQ:
     → 提取技术栈 (从 TECH_DESIGN.md)
     → 识别功能边界 (从 PRD.md)
     → 推理可能的增强方向:
        • 性能优化 (如启动速度、内存占用)
        • 功能增强 (如多账号、国际化)
        • 用户体验 (如快捷键、主题)
        • 集成扩展 (如新 MCP server、API)
```

```
📊 展示分析结果:

"基于现有 {completed_reqs} 个需求的分析，识别出以下潜在方向:"
""
"【功能模块分布】"
"- 核心层 (Core): {list_core_modules}"
"- 业务层 (Business): {list_business_modules}"
"- 支撑层 (Support): {list_support_modules}"
""
"【技术栈】"
"- Frontend: {frontend_stack}"
"- Backend: {backend_stack}"
"- Database: {database_stack}"
"- Integration: {integration_stack}"
""
"【延伸方向建议】(基于已完成需求)"
"(仅供参考，您可以自由调整)"
""
For each completed REQ with potential extensions:
  "从 {REQ-ID}: {title}"
  "  → 可能的增强: {enhancement_idea}"
  "  → 理由: {rationale}"
  ""
```

```
等待用户确认 →

"这些分析对后续规划有帮助吗？"
"准备好进入头脑风暴了吗？ (yes/no)"

用户确认 → Stage 3
```

### Stage 3: 头脑风暴 (Brainstorming)

**目标**: 收集候选路线图项目（RM-IDs）

```
💡 对话引导:

"现在进入头脑风暴阶段。"
"请告诉我未来 3 个月想要实现的功能或项目。"
""
"每个项目请包含:"
"1. 标题 (简短描述)"
"2. 来源 (从哪个需求延伸，或新想法)"
"3. 描述 (具体做什么)"
"4. 优先级 (P1=MVP必须/P2=重要/P3=Nice-to-have)"
"5. 预估工作量 (周数)"
""
"示例格式:"
"- 标题: 多账号支持"
"  来源: REQ-002 (权限管理)"
"  描述: 支持用户在同一设备上切换多个账号，每个账号独立管理会话和配置"
"  优先级: P2"
"  工作量: 3 周"
""
"您可以一次提供多个项目，或分多次补充。"
"输入 'done' 完成brainstorming。"

初始化 candidate_list = []
```

```
收集循环:

While 用户未输入 'done':
  → 解析用户输入
  → 提取项目信息 (title, source, description, priority, effort_weeks)
  → 分配 RM-ID (RM-001, RM-002, ...)
  → 添加到 candidate_list
  → 展示当前收集的项目:
     "已收集 {count} 个项目:"
     For each candidate:
       "- RM-{id}: {title} (P{priority}, {effort_weeks}周, 来自 {source})"
     ""
     "继续添加或输入 'done' 完成:"

用户输入 'done' →
```

```
验证和确认:

1. 检查至少有 1 个 P1 项目
   → 如果没有: WARN "建议至少有 1 个 P1 项目作为 MVP 核心"

2. 检查总工作量是否合理
   → 按优先级分组统计
   → 对比 velocity 容量
   → 如果超容量 30%: WARN "总工作量超出预估容量，建议调整优先级或工作量"

3. 展示汇总:
   "【Brainstorming 汇总】"
   "总计: {count} 个候选项目"
   "  P1: {p1_count} 项 ({p1_weeks} 周)"
   "  P2: {p2_count} 项 ({p2_weeks} 周)"
   "  P3: {p3_count} 项 ({p3_weeks} 周)"
   ""
   "容量对比:"
   "  预估容量: {total_capacity} 需求"
   "  计划项目: {count} 项"
   "  容量利用率: {utilization}%"
   ""
   "确认继续? (yes/no/modify)"

用户确认 → 保存 context.candidates → Stage 4
用户 modify → 重新进入收集循环
```

### Stage 4: 依赖分析 (Dependency Analysis)

**目标**: 识别项目间的依赖关系

```
🔗 对话引导:

"接下来分析项目间的依赖关系。"
""
"【候选项目列表】"
For each candidate in context.candidates:
  "{RM-ID}: {title} (来自 {source})"

""
"请指出哪些项目有依赖关系:"
"格式: {RM-ID} depends on {REQ-ID or RM-ID}"
""
"示例:"
"- RM-001 depends on REQ-009  (输入框 v2.0 依赖 REQ-009 输入框增强)"
"- RM-003 depends on REQ-002  (多账号支持依赖 REQ-002 权限管理)"
"- RM-004 depends on RM-001   (数据分析增强依赖 RM-001 输入框 v2.0)"
""
"输入 'done' 完成依赖分析，或 'none' 如果没有依赖。"

初始化 dependency_list = []
```

```
收集循环:

While 用户未输入 'done' or 'none':
  → 解析依赖关系
  → 验证 RM-ID 和 REQ-ID 存在
  → 添加到 dependency_list
  → 展示当前依赖:
     "已识别 {count} 条依赖:"
     For each dep in dependency_list:
       "- {dependent} → {prerequisite}"
     ""
     "继续添加或输入 'done' 完成:"

用户输入 'done' or 'none' →
```

```
依赖验证:

1. 检查循环依赖
   → 构建依赖图
   → 执行拓扑排序
   → 如果检测到循环: ERROR "检测到循环依赖: {cycle_path}，请调整"

2. 检查悬挂依赖
   → 确保所有被依赖的 REQ-ID 确实存在且已完成
   → 如果依赖未完成: WARN "{RM-ID} 依赖 {REQ-ID} 但该需求未完成，建议重新评估"

3. 生成依赖图预览 (文本格式):
   "【依赖关系图】"
   For each RM-ID (topologically sorted):
     "{RM-ID}: {title}"
     "  ├─ Depends on: {list_prerequisites}"
     "  └─ Blocks: {list_dependents}"
   ""
```

```
确认:

"依赖分析完成。"
"确认继续? (yes/no/modify)"

用户确认 → 保存 context.dependencies → Stage 5
用户 modify → 重新进入收集循环
```

### Stage 5: 时间线规划 (Timeline Planning)

**目标**: 将项目分配到季度和里程碑

```
📅 对话引导:

"现在规划时间线，将项目分配到各个季度。"
""
"【规划视野】"
"当前季度: {CURRENT_QUARTER} {CURRENT_YEAR} (剩余 {REMAINING_DAYS} 天)"
"规划季度: {NEXT_QUARTERS}"
""
"【可用容量】(基于历史 Velocity)"
"当前季度 ({CURRENT_QUARTER}): 约 {current_capacity} 个需求"
"后续季度 (Q{n}): 约 {quarterly_capacity} 个需求/季度"
""
"【候选项目】(按优先级和依赖排序)"
For each candidate (sorted by priority, then topology):
  "{RM-ID}: {title} (P{priority}, {effort_weeks}周)"
  "  Dependencies: {list_dependencies}"

""
"请为每个项目分配季度:"
"格式: {RM-ID} → Q{n}-{YYYY}"
""
"示例:"
"- RM-001 → Q4-2025"
"- RM-002 → Q1-2026"
""
"提示:"
"1. P1 项目优先分配到近期季度"
"2. 考虑依赖关系顺序"
"3. 注意每季度容量限制"
"4. 可以将相关项目分组到同一季度"
""
"输入 'done' 完成分配。"

初始化 timeline = {}
```

```
收集循环:

While 用户未输入 'done':
  → 解析分配 ({RM-ID} → Q{n}-{YYYY})
  → 验证季度在规划范围内
  → 验证依赖关系满足 (prerequisite 必须在相同或更早季度)
  → 更新 timeline[quarter].push(RM-ID)
  → 计算该季度容量使用率
  → 如果超容量: WARN "Q{n} 已分配 {count} 项，超出容量 {capacity}"
  → 展示当前分配:
     "【时间线】"
     For each quarter in timeline:
       "Q{n}-{YYYY}: {list_rm_ids} ({total_weeks}周, 容量使用率 {utilization}%)"
     ""
     "继续分配或输入 'done' 完成:"

用户输入 'done' →
```

```
时间线验证:

1. 检查所有项目都已分配
   → 如果有未分配: ERROR "以下项目未分配季度: {list_unassigned}"

2. 检查依赖约束
   → 对每条依赖 (A depends on B):
     • B 的季度 ≤ A 的季度
     • 否则: ERROR "依赖约束违反: {A} depends on {B}，但 {A} 在 {B} 之前"

3. 检查容量约束
   → 对每个季度:
     • 如果超容量 50%: ERROR "Q{n} 严重超容量，建议调整"
     • 如果超容量 30%: WARN "Q{n} 可能超容量，建议复查"

4. 生成里程碑预览:
   "【里程碑预览】"
   For each quarter in timeline:
     "M{n}-Q{q}-{YYYY}: {quarter_theme}"
     "  Timeline: {start_date} ~ {end_date}"
     "  Features: {count} 项"
     For each RM-ID in quarter:
       "    - {RM-ID}: {title}"
     "  Estimated Effort: {total_weeks} 周"
     ""
```

```
确认:

"时间线规划完成。"
"确认继续? (yes/no/modify)"

用户确认 → 保存 context.timeline → Stage 6
用户 modify → 重新进入收集循环
```

### Stage 6: 最终确认 (Final Confirmation)

**目标**: 展示完整规划，确认后生成文档

```
✅ 展示完整规划:

"【路线图规划汇总】"
""
"📋 愿景:"
"{vision_statement}"
""
"📊 项目总览:"
"总计: {total_count} 个候选项目"
"  P1 (MVP必须): {p1_count} 项"
"  P2 (重要): {p2_count} 项"
"  P3 (Nice-to-have): {p3_count} 项"
""
"📅 时间线:"
For each quarter in timeline:
  "M{n}-Q{q}-{YYYY}: {count} 个项目"
  For each RM-ID:
    "  - {RM-ID}: {title} (P{priority})"
  "  预计工作量: {weeks} 周"
  ""
""
"🔗 依赖关系: {dependency_count} 条"
""
"📈 容量分析:"
"历史速度: {avg_days_per_req} 天/需求"
"规划容量: {total_planned} 项"
"预估容量: {total_capacity} 项"
"容量利用率: {utilization}%"
""
"确认生成路线图和架构文档? (yes/no/modify)"

用户输入 'yes' → 进入 Agent 调用阶段
用户输入 'no' → 取消并保存草稿
用户输入 'modify' → 询问要修改哪个阶段 (1-5)
```

### Stage 7: Agent 调用阶段 (Agent Invocation)

**目标**: 调用两个研究型 Agent 生成文档

```
🤖 Phase 7.1: 调用 roadmap-planner Agent

1. 准备 JSON 上下文:
   {
     "vision_statement": context.vision_statement,
     "candidates": context.candidates,
     "dependencies": context.dependencies,
     "timeline": context.timeline,
     "velocity": context.velocity,
     "quarter_info": context.quarter_info
   }

2. 提示:
   "正在生成路线图和需求池..."
   ""
   "调用 roadmap-planner Agent..."

3. 使用 Task tool 调用 roadmap-planner:
   description: "Generate ROADMAP.md and BACKLOG.md"
   subagent_type: "roadmap-planner"
   prompt: "根据以下上下文生成路线图和需求池:

   {JSON_CONTEXT}

   请按照 ROADMAP_TEMPLATE.md 和 BACKLOG_TEMPLATE.md 的 Execution Flow 执行。
   生成完整的 devflow/ROADMAP.md 和 devflow/BACKLOG.md 文件。"

4. 等待 Agent 完成
   → 检查输出文件是否生成
   → 如果失败: ERROR "路线图生成失败: {error}"

5. 提示:
   "✅ ROADMAP.md 已生成"
   "✅ BACKLOG.md 已生成"
```

```
🤖 Phase 7.2: 调用 architecture-designer Agent

1. 提示:
   "正在生成架构文档..."
   ""
   "调用 architecture-designer Agent..."

2. 使用 Task tool 调用 architecture-designer:
   description: "Generate ARCHITECTURE.md with 4 diagrams"
   subagent_type: "architecture-designer"
   prompt: "分析 devflow/ROADMAP.md 和现有需求，生成架构文档。

   请按照 ARCHITECTURE_TEMPLATE.md 的 Execution Flow 执行。
   生成完整的 devflow/ARCHITECTURE.md 文件，包含 4 种架构图:
   1. Feature Architecture (功能架构图)
   2. Technical Architecture (技术架构图)
   3. Module Structure (模块划分图)
   4. Requirement Dependency (需求依赖图)
   "

3. 等待 Agent 完成
   → 检查输出文件是否生成
   → 如果失败: ERROR "架构文档生成失败: {error}"

4. 提示:
   "✅ ARCHITECTURE.md 已生成 (包含 4 种架构图)"
```

### Stage 8: 最终报告 (Final Report)

```
🎉 展示最终报告:

"==================================================================="
"路线图规划完成！"
"==================================================================="
""
"📁 生成的文档:"
"  ✅ devflow/ROADMAP.md       - 产品路线图 ({roadmap_size} bytes)"
"  ✅ devflow/BACKLOG.md        - 需求池 ({backlog_size} bytes)"
"  ✅ devflow/ARCHITECTURE.md   - 架构文档 ({arch_size} bytes)"
""
"📊 规划摘要:"
"  - 愿景: {first_50_chars_of_vision}..."
"  - 规划视野: {PLANNING_HORIZON}"
"  - 候选项目: {total_count} 个 (P1:{p1_count} | P2:{p2_count} | P3:{p3_count})"
"  - 里程碑: {milestone_count} 个"
"  - 依赖关系: {dependency_count} 条"
""
"📐 架构图:"
"  ✅ 功能架构图 (Feature Architecture)"
"  ✅ 技术架构图 (Technical Architecture)"
"  ✅ 模块划分图 (Module Structure)"
"  ✅ 需求依赖图 (Requirement Dependency)"
""
"🎯 下一步:"
"  1. 查看 devflow/ROADMAP.md 验证路线图"
"  2. 查看 devflow/BACKLOG.md 确认优先级"
"  3. 查看 devflow/ARCHITECTURE.md 确认架构图渲染正常"
"  4. 运行 /flow-init {RM-ID} 开始实现路线图项目"
""
"💡 提示:"
"  - 使用 /core-roadmap --regenerate 可重新生成路线图"
"  - 使用 /core-architecture 可单独更新架构文档"
"  - ROADMAP.md 会自动同步需求进度 (via sync-roadmap-progress.sh)"
""
"==================================================================="
```

## 错误处理

### 常见错误及处理

1. **用户取消对话**:
   ```
   在任何阶段用户输入 'cancel':
     → 保存当前 context 到 devflow/.roadmap-draft.json
     → 提示: "规划已暂停，进度已保存。使用 /core-roadmap --resume 继续。"
   ```

2. **循环依赖**:
   ```
   Stage 4 检测到循环依赖:
     → ERROR: "检测到循环依赖: {cycle_path}"
     → 提示用户调整依赖关系
     → 返回 Stage 4
   ```

3. **超容量分配**:
   ```
   Stage 5 检测到严重超容量:
     → ERROR: "Q{n} 分配了 {count} 项，超出容量 {capacity} 的 50%"
     → 提示: "建议: 1) 降低部分项目优先级, 2) 延后到下一季度, 3) 减少工作量预估"
     → 返回 Stage 5
   ```

4. **Agent 调用失败**:
   ```
   Stage 7 Agent 返回错误:
     → 保存 context 到 devflow/.roadmap-draft.json
     → ERROR: "Agent 调用失败: {error_message}"
     → 提示: "上下文已保存，请检查错误后使用 /core-roadmap --resume 重试"
   ```

## 高级功能

### --regenerate 模式
```
/core-roadmap --regenerate

流程:
1. 读取现有 ROADMAP.md
2. 扫描现有需求进度
3. 使用 sync-roadmap-progress.sh 更新进度
4. 重新调用 architecture-designer 更新架构图
5. 跳过 6-stage dialogue
```

### --resume 模式
```
/core-roadmap --resume

流程:
1. 读取 devflow/.roadmap-draft.json
2. 恢复 context 和当前 stage
3. 继续中断的对话
```

## 输出

### 文件输出
- `devflow/ROADMAP.md`: 完整路线图文档
- `devflow/BACKLOG.md`: 优先级需求池
- `devflow/ARCHITECTURE.md`: 架构文档（含 4 图）
- `devflow/.roadmap-draft.json`: 草稿（如果中断）

### 状态更新
- 无需更新 orchestration_status.json（项目级别，非需求级别）
- 可选：创建 devflow/roadmap-log.md 记录规划历史

## 下一步

路线图创建后，用户可以:
1. `/flow-init {RM-ID}` - 将路线图项目转为正式需求
2. `/core-architecture` - 单独更新架构文档
3. 手动编辑 ROADMAP.md - 调整路线图内容
4. 运行 `sync-roadmap-progress.sh` - 同步需求进度

## 注意事项

1. **对话引导是关键**: 用清晰的问题和示例引导用户
2. **验证是必须的**: 每个阶段都要验证输入有效性
3. **容量意识**: 时刻提醒用户历史速度和可用容量
4. **保存中间状态**: 允许用户暂停和恢复
5. **Agent 是工具**: Command 做对话，Agent 做生成
6. **错误友好**: 给出明确的错误信息和修复建议
