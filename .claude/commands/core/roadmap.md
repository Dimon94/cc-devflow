---
name: core:roadmap
description: 'Generate product roadmap through 6-stage dialogue. Usage: /core:roadmap'
scripts:
  calculate_quarter: .claude/scripts/calculate-quarter.sh
  sync_progress: .claude/scripts/sync-roadmap-progress.sh
templates:
  dialogue: .claude/docs/templates/ROADMAP_DIALOGUE_TEMPLATE.md
  roadmap: .claude/docs/templates/ROADMAP_TEMPLATE.md
  backlog: .claude/docs/templates/BACKLOG_TEMPLATE.md
guides:
  troubleshoot: .claude/docs/guides/ROADMAP_TROUBLESHOOTING.md
---

<!--
[INPUT]: 依赖 roadmap 对话模板、路线图/积压模板、季度脚本与进度同步脚本提供上下文骨架。
[OUTPUT]: 对外提供 /core:roadmap 的阶段约束、LLM-native 估算规则、文档生成要求。
[POS]: .claude/commands/core 的项目级规划入口，连接用户对话、roadmap-planner 与 architecture-designer。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

<!-- ============================================================
     头文件引用语法规范 (Header File Reference Syntax)
     ============================================================

命令头文件格式:
```yaml
scripts:
  calculate_quarter: .claude/scripts/calculate-quarter.sh
  sync_progress: .claude/scripts/sync-roadmap-progress.sh
templates:
  dialogue: .claude/docs/templates/ROADMAP_DIALOGUE_TEMPLATE.md
  roadmap: .claude/docs/templates/ROADMAP_TEMPLATE.md
  backlog: .claude/docs/templates/BACKLOG_TEMPLATE.md
guides:
  troubleshoot: .claude/docs/guides/ROADMAP_TROUBLESHOOTING.md
```

引用语法:
- {SCRIPT:calculate_quarter} → 执行 .claude/scripts/calculate-quarter.sh
- {SCRIPT:sync_progress}     → 执行 .claude/scripts/sync-roadmap-progress.sh
- {TEMPLATE:dialogue}        → 加载 .claude/docs/templates/ROADMAP_DIALOGUE_TEMPLATE.md
- {TEMPLATE:roadmap}         → 加载 .claude/docs/templates/ROADMAP_TEMPLATE.md
- {TEMPLATE:backlog}         → 加载 .claude/docs/templates/BACKLOG_TEMPLATE.md
- {GUIDE:troubleshoot}       → 参考 .claude/docs/guides/ROADMAP_TROUBLESHOOTING.md

使用案例:
```markdown
# 正文中遇到:
→ Run: {SCRIPT:calculate_quarter}
# 解释为:
→ 执行命令: bash .claude/scripts/calculate-quarter.sh

# 正文中遇到:
→ 详见 {TEMPLATE:dialogue} Stage 0
# 解释为:
→ 打开并阅读 .claude/docs/templates/ROADMAP_DIALOGUE_TEMPLATE.md 中的 Stage 0 章节

# 正文中遇到:
→ 遇到问题参考 {GUIDE:troubleshoot}
# 解释为:
→ 打开并阅读 .claude/docs/guides/ROADMAP_TROUBLESHOOTING.md
```

规则: 遇到 {TYPE:key} 占位符时，去头文件 YAML 中找对应类型的 key，获取文件路径并执行/加载。
============================================================ -->

# Core:Roadmap - 路线图规划命令

## 命令格式
```
/core:roadmap                # 6阶段对话式规划
/core:roadmap --regenerate   # 更新现有路线图
/core:roadmap --resume       # 从草稿恢复
```

---

## 执行前加载

**详细对话流程**:
→ 参见 `{TEMPLATE:dialogue}` 获取6阶段对话脚本

**路线图模板**:
→ 参见 `{TEMPLATE:roadmap}` 了解输出格式

**故障排查**:
→ 遇到问题参考 `{GUIDE:troubleshoot}`

---

## LLM Native Planning Override

`/core:roadmap` 必须使用 LLM 时代的规划口径，禁止把历史人类开发速度直接当作未来排期。

### 双尺度工时模型

在讨论工作量、容量、风险、优先级时，始终同时展示两套数据：

| 任务类型 | Human Team | LLM-Native | Compression |
|----------|------------|------------|-------------|
| Boilerplate / Scaffolding | 2 days | 15 min | ~100x |
| Test Writing | 1 day | 15 min | ~50x |
| Feature Implementation | 1 week | 30 min | ~30x |
| Bug Fix + Regression Test | 4 hours | 15 min | ~20x |
| Architecture / Design | 2 days | 4 hours | ~5x |
| Research / Exploration | 1 day | 3 hours | ~3x |

### Completeness Principle

- 默认推荐完整实现，不推荐为了“省一点点时间”而拆出廉价 shortcut。
- 如果一件事在 LLM-Native 口径下是一个可在单季度内完成、边界清晰、无需平台级迁移的 `lake`，就优先煮沸整个湖泊。
- 如果一件事需要跨季度重写、系统迁移、基础设施翻修或组织级协同，它是 `ocean`，必须显式标记并拆成多个 `lake`，不能伪装成单个 roadmap item。
- `completeness_score` 表示范围完整性，不表示当前进度：
  - `10`: 当前定义已经是一个完整可交付闭环
  - `7`: 只覆盖主路径，仍缺少关键配套或边界场景
  - `3`: 明显是 shortcut / demo / 碎片，不能假装是完整需求
- 每个候选项目都必须给出:
  - `human_effort`
  - `llm_effort`
  - `completeness_score` (1-10)
  - `scope_shape` (`lake` | `ocean`)
  - `acceptance_criteria` (2-3 条，可验证、可观察的完成标准)

### 模板兼容层

- 下游模板若出现 `effort_weeks`、`周数`、`季度容量=90天/平均天数` 等旧口径，统一解释为 `human baseline`，不得作为最终排期真相源。
- 最终 roadmap/backlog 必须以 `llm_effort` 作为主排期单位，以 `human_effort` 作为风险解释与对外沟通参考。
- 最终 roadmap/backlog 必须保留每个 RM 的 item-level `Acceptance Criteria`，不得只保留里程碑级成功标准。
- 若历史 Velocity 与 LLM-native 估算冲突，以 LLM-native 为默认排期，历史数据仅用于识别异常项与校准风险。

---

## 核心原则

**架构模式**:
```
用户 ↔ core:roadmap (6-stage dialogue) ← 你在这里
              ↓
       ├─→ roadmap-planner (research, no dialogue)
       │         ↓
       │   ROADMAP.md + BACKLOG.md
       │
       └─→ architecture-designer (research, no dialogue)
                 ↓
           ARCHITECTURE.md (4 diagrams)
```

**职责划分**:
- **core:roadmap (命令)**: 对话引导，收集用户输入
- **roadmap-planner (Agent)**: 根据上下文生成文档，无对话
- **architecture-designer (Agent)**: 生成架构图，无对话

## Harness Engineering 增强（OpenAI + Anthropic 实践融合）

为避免长会话中的“半成品漂移 / 提前宣布完成 / 上下文断片”，`/core:roadmap` 强制采用双阶段执行。

### Stage -1: Initializer Session（只做地基，不做全量生成）

在首次运行或 `--regenerate` 时先建立可恢复工件：
- `devflow/.core-harness/roadmap/feature-checklist.json`
  - 结构化列出路线图必须产物（愿景、里程碑、依赖图、容量评估、季度分配等），默认 `passes=false`
- `devflow/.core-harness/roadmap/progress.md`
  - 记录每次会话完成内容、未决问题、下一步
- `devflow/.core-harness/roadmap/session-handoff.md`
  - 给下一窗口的启动指令（从哪个 Stage 继续、先做什么验证）

### Worker Session（增量推进，每次只完成一个最小目标）

每个窗口必须遵守：
1. 启动先读状态：`pwd` → `progress.md` → `feature-checklist.json` → 最近 git log（若仓库可用）
2. 先做冒烟检查：确认现有 `ROADMAP.md/BACKLOG.md/ARCHITECTURE.md` 不是损坏状态
3. 只推进一个最小单元：
   - 一个 Stage 的信息收集，或
   - 一个 RM 依赖簇的整理，或
   - 一次时间线冲突修复
4. 结束前必须更新工件：勾选 `passes`、写入 progress/handoff、明确下一步

### 完成判定（禁止“口头完成”）

只有 `feature-checklist.json` 全部 `passes=true`，且 Stage 8 输出文件全部存在并通过校验，才允许宣告完成。

---

## 执行流程骨架

### Stage 0: Context Detection (上下文检测)

```
1. 检查 ROADMAP.md 是否存在
   → 存在: mode = "update"
   → 不存在: mode = "create"

2. Run: {SCRIPT:calculate_quarter}
   → 获取当前季度信息

3. 扫描 requirements/ 计算基线 Velocity
   → 完成需求数、平均天数、季度容量 (human baseline)
   → 基于任务类型压缩倍率推导 llm_capacity
   → 明确: 历史数据只做校准, 不直接主导未来排期

4. 初始化 context 对象
   → 包含 planning_mode="llm-native"
   → 包含 velocity.human_baseline / velocity.llm_capacity / velocity.risk_notes

→ 详见 {TEMPLATE:dialogue} Stage 0
```

---

### Stage 1: Vision Statement (愿景声明)

```
对话引导:
  "描述未来 3 个月的核心愿景..."
  "1. 要解决什么核心问题？"
  "2. 目标用户是谁？"
  "3. 核心价值主张是什么？"
  "4. 期望达成的里程碑是什么？"

收集: vision_statement

→ 详见 {TEMPLATE:dialogue} Stage 1
```

---

### Stage 2: Project Analysis (项目分析)

```
自动执行:
  1. 扫描 requirements/REQ-*/PRD.md
  2. 分析完成需求的延伸方向
  3. 展示功能模块分布和技术栈
  4. 推荐延伸项目

用户确认 → Stage 3

→ 详见 {TEMPLATE:dialogue} Stage 2
```

---

### Stage 3: Brainstorming (头脑风暴)

```
收集循环:
  对话收集候选项目:
    - 标题
    - 来源 (从哪个需求延伸)
    - 描述
    - 优先级 (P1/P2/P3)
    - 预估工作量 (human_effort + llm_effort)
    - 完整度分数 (completeness_score)
    - 范围形态 (lake / ocean)
    - 验收标准 (acceptance_criteria, 2-3 条)

  分配 RM-ID: RM-001, RM-002, ...

  验证:
    - 至少 1 个 P1 项目
    - `ocean` 项必须拆分或显式标红
    - 总 llm_effort vs llm_capacity (警告超容量 30%)
    - 如果某项是 lake 且 completeness_score < 8, 追问为何仍保留 shortcut

收集: candidates[]

→ 详见 {TEMPLATE:dialogue} Stage 3
```

---

### Stage 4: Dependency Analysis (依赖分析)

```
收集循环:
  格式: {RM-ID} depends on {REQ-ID or RM-ID}

  验证:
    - 检查循环依赖 (拓扑排序)
    - 检查悬挂依赖 (被依赖项未完成)
    - 生成依赖图预览

收集: dependencies[]

→ 详见 {TEMPLATE:dialogue} Stage 4
```

---

### Stage 5: Timeline Planning (时间线规划)

```
收集循环:
  分配项目到季度:
    格式: {RM-ID} → Q{n}-{YYYY}

  验证:
    - 依赖约束 (被依赖项在同季度或更早)
    - 容量约束 (每季度 ≤ 150% llm_capacity)
    - `lake` 默认在单季度内完整交付, 不能被随意拆成低完整度碎片
    - `ocean` 不得直接塞进单季度, 必须拆成多个可执行 lake

  生成时间线预览
  → 预览必须同时展示 human vs llm 双尺度工时与容量占用

收集: timeline{}

→ 详见 {TEMPLATE:dialogue} Stage 5
```

---

### Stage 6: Final Confirmation (最终确认)

```
展示完整规划汇总:
  - 愿景
  - 项目总览 (按优先级)
  - 季度分布
  - 依赖关系
  - 容量评估 (human baseline vs llm-native)
  - Completeness 汇总 (哪些 lake 被完整煮沸, 哪些 ocean 被拆解)

用户确认 → Stage 7
用户修改 → 跳转到对应 Stage

→ 详见 {TEMPLATE:dialogue} Stage 6
```

---

### Stage 7: Agent Invocation (生成文档)

```
1. 保存上下文到 .roadmap-context.json

2. 调用 roadmap-planner Agent
   Prompt: "Generate ROADMAP.md and BACKLOG.md based on context. Use llm_effort as the primary planning unit, keep human_effort as reference, preserve item-level acceptance criteria for every RM, explain completeness as scope integrity instead of progress, boil lakes instead of recommending shortcuts, and explicitly flag or split oceans."
   → 生成 devflow/ROADMAP.md
   → 生成 devflow/BACKLOG.md

3. 调用 architecture-designer Agent
   Prompt: "Generate ARCHITECTURE.md with 4 diagrams. Reflect the roadmap decomposition that turns oceans into executable lakes."
   → 生成 devflow/ARCHITECTURE.md (4个Mermaid图表)

→ 详见 {TEMPLATE:dialogue} Stage 7
```

---

### Stage 8: Final Report (完成报告)

```
展示生成文件:
  ✅ devflow/ROADMAP.md (路线图项目, 依赖图, 双尺度工时, Completeness 结论, item-level Acceptance Criteria)
  ✅ devflow/BACKLOG.md (所有候选项目详情, human/llm 工时, lake/ocean 标记, item-level Acceptance Criteria)
  ✅ devflow/ARCHITECTURE.md (4个架构图表)

下一步建议:
  1. 审查路线图
  2. 开始首个需求: /flow:init "REQ-XXX|{RM-title}"
  3. 定期更新: /core:roadmap --regenerate
  4. 监控进度: /flow:status --all

→ 详见 {TEMPLATE:dialogue} Stage 8
```

---

## 输出产物

```
devflow/
├── ROADMAP.md           # 产品路线图
│   ├── Vision Statement
│   ├── Milestone Overview
│   ├── Q{n} {YYYY} Milestones (详细)
│   ├── Dependency Graph (Mermaid)
│   ├── Velocity Tracking (human baseline + llm-native)
│   ├── Completeness / Lake-Ocean Review
│   ├── Item-level Acceptance Criteria
│   └── Implementation Tracking
│
├── BACKLOG.md           # 产品积压清单
│   └── 所有 RM-ID 详情 (优先级, human/llm 工作量, completeness, acceptance criteria, 状态)
│
└── ARCHITECTURE.md      # 架构文档
    ├── Feature Architecture Diagram
    ├── Technical Architecture Diagram
    ├── Module Structure Diagram
    └── Requirement Dependency Diagram
```

---

## 高级功能

### --regenerate 模式

**用途**: 更新现有路线图，无需重新对话

```bash
/core:roadmap --regenerate

执行:
1. 读取现有 ROADMAP.md
2. Run: {SCRIPT:sync_progress}
3. 更新 human baseline 与 llm-native 双尺度指标
4. 重新生成文档 (保持原有结构)
```

**适用场景**:
- 定期更新路线图进度
- 需求完成后同步状态
- 修正 Velocity 数据

---

### --resume 模式

**用途**: 从保存的草稿恢复对话

```bash
/core:roadmap --resume

执行:
1. 读取 .roadmap-draft.json
2. 恢复 context 状态
3. 询问用户从哪个 Stage 继续
4. 跳转到对应 Stage
```

**适用场景**:
- 对话被意外中断
- 需要暂停并稍后继续
- 需要修改之前阶段的输入

---

## 错误处理

**常见错误**:
→ 详见 `{GUIDE:troubleshoot}`

**主要错误场景**:
1. User cancel during dialogue → 保存草稿, 使用 --resume 恢复
2. Circular dependency detected → 重新定义依赖或拆分项目
3. Over-capacity warning → 调整优先级/工作量/规划周期
4. Roadmap not found in update mode → 检查文件路径或重新创建
5. Hanging dependency → 确认依赖状态或移除依赖
6. Quarter assignment conflict → 调整季度分配满足依赖约束
7. Agent invocation failed → 检查 context 文件, 重新生成
8. Mermaid syntax error → 修复 Node ID 格式
9. Architecture generation failed → 跳过或手动创建
10. Human 与 LLM 估算冲突 → 以 llm-native 排期, human 口径仅记录风险说明
11. Ocean item 卡住季度规划 → 立即拆分为多个 lake, 不允许直接硬排

**恢复步骤**:
→ 详见 `{GUIDE:troubleshoot}` Recovery Procedures

---

## 使用建议

### 执行前准备

- [ ] 阅读现有 requirements/ 目录
- [ ] 准备愿景声明草稿
- [ ] 列出候选项目清单
- [ ] 识别项目间依赖关系
- [ ] 预估双尺度工作量 (human + llm)
- [ ] 判断哪些是 lake, 哪些是 ocean

### 执行中注意

- [ ] 耐心回答每个阶段的问题
- [ ] 使用 'modify' 命令修正错误输入
- [ ] 关注容量警告，及时调整
- [ ] 优先煮沸 lake，不要为了省几分钟制造 shortcut backlog
- [ ] 依赖分析时绘制简单图表辅助

### 执行后审查

- [ ] 审查生成的 ROADMAP.md
- [ ] 检查 Dependency Graph 是否正确
- [ ] 验证双尺度工时与容量结论是否合理
- [ ] 检查是否仍有伪装成单项的 ocean
- [ ] 分享给团队审查

---

## 路线图维护

**定期更新**:
```bash
# 每周运行一次
/core:roadmap --regenerate
```

**需求完成后**:
```bash
# 同步进度
bash {SCRIPT:sync_progress}

# 更新路线图
/core:roadmap --regenerate
```

**季度回顾**:
```bash
# 检查完成情况
grep "Status: Completed" devflow/ROADMAP.md | wc -l

# 重新规划下一季度
/core:roadmap
# 更新愿景和候选项目
```

---

## Next Step

```
# 选择当前季度的第一个 RM-ID
/flow:init "REQ-XXX|{RM-title}"

# 或查看所有状态
/flow:status --all
```

---

**Related Documentation**:
- [ROADMAP_DIALOGUE_TEMPLATE.md](../.claude/docs/templates/ROADMAP_DIALOGUE_TEMPLATE.md) - 详细对话流程
- [ROADMAP_TROUBLESHOOTING.md](../.claude/docs/guides/ROADMAP_TROUBLESHOOTING.md) - 故障排查指南
- [ROADMAP_TEMPLATE.md](../.claude/docs/templates/ROADMAP_TEMPLATE.md) - 路线图模板
