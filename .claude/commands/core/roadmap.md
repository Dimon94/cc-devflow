---
name: core-roadmap
description: 'Generate product roadmap through 6-stage dialogue. Usage: /core-roadmap'
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

# Core-Roadmap - 路线图规划命令

## 命令格式
```
/core-roadmap                # 6阶段对话式规划
/core-roadmap --regenerate   # 更新现有路线图
/core-roadmap --resume       # 从草稿恢复
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

## 核心原则

**架构模式**:
```
用户 ↔ core-roadmap (6-stage dialogue) ← 你在这里
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
- **core-roadmap (命令)**: 对话引导，收集用户输入
- **roadmap-planner (Agent)**: 根据上下文生成文档，无对话
- **architecture-designer (Agent)**: 生成架构图，无对话

## Harness Engineering 增强（OpenAI + Anthropic 实践融合）

为避免长会话中的“半成品漂移 / 提前宣布完成 / 上下文断片”，`/core-roadmap` 强制采用双阶段执行。

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

3. 扫描 requirements/ 计算 Velocity
   → 完成需求数、平均天数、季度容量

4. 初始化 context 对象

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
    - 预估工作量 (周数)

  分配 RM-ID: RM-001, RM-002, ...

  验证:
    - 至少 1 个 P1 项目
    - 总工作量 vs 容量 (警告超容量 30%)

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
    - 容量约束 (每季度 ≤ 150% 容量)

  生成时间线预览

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
  - 容量评估

用户确认 → Stage 7
用户修改 → 跳转到对应 Stage

→ 详见 {TEMPLATE:dialogue} Stage 6
```

---

### Stage 7: Agent Invocation (生成文档)

```
1. 保存上下文到 .roadmap-context.json

2. 调用 roadmap-planner Agent
   Prompt: "Generate ROADMAP.md and BACKLOG.md based on context..."
   → 生成 devflow/ROADMAP.md
   → 生成 devflow/BACKLOG.md

3. 调用 architecture-designer Agent
   Prompt: "Generate ARCHITECTURE.md with 4 diagrams..."
   → 生成 devflow/ARCHITECTURE.md (4个Mermaid图表)

→ 详见 {TEMPLATE:dialogue} Stage 7
```

---

### Stage 8: Final Report (完成报告)

```
展示生成文件:
  ✅ devflow/ROADMAP.md (路线图项目, 依赖图, 速度指标)
  ✅ devflow/BACKLOG.md (所有候选项目详情)
  ✅ devflow/ARCHITECTURE.md (4个架构图表)

下一步建议:
  1. 审查路线图
  2. 开始首个需求: /flow:init "REQ-XXX|{RM-title}"
  3. 定期更新: /core-roadmap --regenerate
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
│   ├── Velocity Tracking
│   └── Implementation Tracking
│
├── BACKLOG.md           # 产品积压清单
│   └── 所有 RM-ID 详情 (优先级, 工作量, 状态)
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
/core-roadmap --regenerate

执行:
1. 读取现有 ROADMAP.md
2. Run: {SCRIPT:sync_progress}
3. 更新 Velocity 指标
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
/core-roadmap --resume

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

**恢复步骤**:
→ 详见 `{GUIDE:troubleshoot}` Recovery Procedures

---

## 使用建议

### 执行前准备

- [ ] 阅读现有 requirements/ 目录
- [ ] 准备愿景声明草稿
- [ ] 列出候选项目清单
- [ ] 识别项目间依赖关系
- [ ] 预估工作量

### 执行中注意

- [ ] 耐心回答每个阶段的问题
- [ ] 使用 'modify' 命令修正错误输入
- [ ] 关注容量警告，及时调整
- [ ] 依赖分析时绘制简单图表辅助

### 执行后审查

- [ ] 审查生成的 ROADMAP.md
- [ ] 检查 Dependency Graph 是否正确
- [ ] 验证 Velocity 指标合理性
- [ ] 分享给团队审查

---

## 路线图维护

**定期更新**:
```bash
# 每周运行一次
/core-roadmap --regenerate
```

**需求完成后**:
```bash
# 同步进度
bash {SCRIPT:sync_progress}

# 更新路线图
/core-roadmap --regenerate
```

**季度回顾**:
```bash
# 检查完成情况
grep "Status: Completed" devflow/ROADMAP.md | wc -l

# 重新规划下一季度
/core-roadmap
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
