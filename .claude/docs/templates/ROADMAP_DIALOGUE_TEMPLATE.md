# Core-Roadmap Dialogue Template

<!--
[INPUT]: 依赖 /core:roadmap 命令头文件中的脚本定义与 roadmap 上下文约束。
[OUTPUT]: 对外提供路线图对话的阶段脚本、LLM-native 估算字段与生成提示。
[POS]: .claude/docs/templates 的路线图对话真相源，被 /core:roadmap 在 Stage 0-8 直接引用。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

> 6-stage interactive dialogue script for `/core:roadmap`

<!-- ============================================================
     调用上下文声明 (Invocation Context Declaration)
     ============================================================

本模板由 `/core:roadmap` 命令通过 {TEMPLATE:dialogue} 引用加载。

模板中的 {SCRIPT:xxx} 占位符引用 core/roadmap.md 头文件中的 scripts 定义：
```yaml
# 来源: .claude/commands/core/roadmap.md 头文件
scripts:
  calculate_quarter: .claude/scripts/calculate-quarter.sh
  sync_progress: .claude/scripts/sync-roadmap-progress.sh
```

占位符解析:
- {SCRIPT:calculate_quarter} → bash .claude/scripts/calculate-quarter.sh
- {SCRIPT:sync_progress}     → bash .claude/scripts/sync-roadmap-progress.sh
============================================================ -->

---

## Stage 0: Context Detection (上下文检测)

```bash
# 1. 检查 ROADMAP.md
→ 存在: mode = "update"
→ 不存在: mode = "create"

# 2. 计算当前季度
bash {SCRIPT:calculate_quarter}
→ 获取: current_quarter, current_year, next_quarters[]

# 3. 扫描 requirements/ 计算基线 Velocity
→ 完成需求数、平均天数、季度容量 (human baseline)
→ 基于压缩倍率推导 llm_capacity
→ 标记 risk_notes，说明哪些历史数据不能直接外推

# 4. 初始化 context 对象
{
  "mode": "create",
  "planning_mode": "llm-native",
  "velocity": {
    "human_baseline": {...},
    "llm_capacity": {...},
    "risk_notes": [...]
  },
  "quarter_info": {...}
}
```

---

## Stage 1: Vision Statement (愿景声明)

**对话引导**:
```
"描述未来 3 个月的核心愿景..."
"1. 要解决什么核心问题？"
"2. 目标用户是谁？"
"3. 核心价值主张是什么？"
"4. 期望达成的里程碑是什么？"
```

**收集**: `vision_statement`

---

## Stage 2: Project Analysis (项目分析)

**自动执行**:
```bash
# 1. 扫描 requirements/REQ-*/PRD.md
→ 分析完成需求的延伸方向

# 2. 展示功能模块分布和技术栈
→ 推荐延伸项目

# 3. 用户确认 → Stage 3
```

---

## Stage 3: Brainstorming (头脑风暴)

**收集循环**:
```
对话收集候选项目:
  - 标题
  - 来源 (从哪个需求延伸)
  - 描述
  - 优先级 (P1/P2/P3)
  - human_effort
  - llm_effort
  - completeness_score (1-10)
  - scope_shape (lake / ocean)

分配 RM-ID: RM-001, RM-002, ...

验证:
  - 至少 1 个 P1 项目
  - `ocean` 项必须拆分或显式标红
  - 总 llm_effort vs llm_capacity (警告超容量 30%)
  - 如果某项是 lake 且 completeness_score < 8，继续追问为何保留 shortcut
```

**收集**: `candidates[]`

---

## Stage 4: Dependency Analysis (依赖分析)

**收集循环**:
```
格式: {RM-ID} depends on {REQ-ID or RM-ID}

验证:
  - 检查循环依赖 (拓扑排序)
  - 检查悬挂依赖 (被依赖项未完成)
  - 生成依赖图预览
```

**收集**: `dependencies[]`

---

## Stage 5: Timeline Planning (时间线规划)

**收集循环**:
```
分配项目到季度:
  格式: {RM-ID} → Q{n}-{YYYY}

验证:
  - 依赖约束 (被依赖项在同季度或更早)
  - 容量约束 (每季度 ≤ 150% llm_capacity)
  - `lake` 默认单季度完整交付
  - `ocean` 必须拆成多个 lake，不能直接进季度

生成时间线预览
→ 同时展示 human vs llm 双尺度容量占用
```

**收集**: `timeline{}`

---

## Stage 6: Final Confirmation (最终确认)

**展示完整规划汇总**:
```
- 愿景
- 项目总览 (按优先级)
- 季度分布
- 依赖关系
- 容量评估 (human baseline vs llm-native)
- Completeness 汇总 (lake 是否完整，ocean 是否已拆分)

用户确认 → Stage 7
用户修改 → 跳转到对应 Stage
```

---

## Stage 7: Agent Invocation (生成文档)

```bash
# 1. 保存上下文
→ .roadmap-context.json

# 2. 调用 roadmap-planner Agent
Prompt: "Generate ROADMAP.md and BACKLOG.md based on context. Use llm_effort as the primary planning unit, keep human_effort as reference, boil lakes instead of recommending shortcuts, and explicitly flag or split oceans."
→ 生成 devflow/ROADMAP.md
→ 生成 devflow/BACKLOG.md

# 3. 调用 architecture-designer Agent
Prompt: "Generate ARCHITECTURE.md with 4 diagrams. Reflect the roadmap decomposition that turns oceans into executable lakes."
→ 生成 devflow/ARCHITECTURE.md (4个Mermaid图表)
```

---

## Stage 8: Final Report (完成报告)

**展示生成文件**:
```
✅ devflow/ROADMAP.md (路线图项目, 依赖图, 双尺度工时, Completeness 结论)
✅ devflow/BACKLOG.md (所有候选项目详情, human/llm 工时, lake/ocean 标记)
✅ devflow/ARCHITECTURE.md (4个架构图表)

下一步建议:
1. 审查路线图
2. 开始首个需求: /flow:init "REQ-XXX|{RM-title}"
3. 定期更新: /core:roadmap --regenerate
4. 监控进度: /flow:status --all
```

---

## Output Files

```
devflow/
├── ROADMAP.md           # 路线图 (Milestones, Dependency Graph, Dual-Scale Velocity, Completeness)
├── BACKLOG.md           # 积压清单 (所有 RM-ID 详情 + lake/ocean 判断)
└── ARCHITECTURE.md      # 架构文档 (4个Mermaid图表)
```

---

**Last Updated**: 2026-04-09
