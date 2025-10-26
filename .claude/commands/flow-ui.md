---
name: flow-ui
description: Generate interactive HTML prototype from PRD. Usage: /flow-ui "REQ-123" or /flow-ui
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  validate_constitution: .claude/scripts/validate-constitution.sh
---

# Flow-UI - UI 原型生成命令

## User Input
```text
$ARGUMENTS = "REQ_ID?"
```
缺省时依据当前分支或 `DEVFLOW_REQ_ID` 自动解析。

## 命令格式
```text
/flow-ui "REQ_ID"
/flow-ui             # Auto-detect from current branch
```

## 触发原则
- **自动触发**：PRD 含 UI 关键词（用户界面、前端、页面、交互…），或仓库存在 `package.json`、`src/components/` 等前端特征。
- **手动触发**：用户显式调用 `/flow-ui`。
- **自动跳过**：PRD 标注“纯后端/无 UI”，或项目缺少前端栈特征。跳过时记录 `ui_skipped`。

## 执行流程

### 阶段 1: Entry Gate
```
1. 解析 REQ_ID
   → If argument provided: use it
   → Else: run {SCRIPT:prereq} --json --paths-only
   → If仍为空: ERROR "No requirement ID found."

2. 校验资产
   → 必须存在:
      • PRD.md（无 {{PLACEHOLDER}}）
      • research/research.md
      • orchestration_status.status == "prd_complete"
   → 如果 UI_PROTOTYPE.html 已存在 → WARN 并确认覆盖

3. UI 需求检测
   → 检查 PRD 关键词 + 项目结构
   → 如检测不到且用户拒绝继续 → 记录 EXECUTION_LOG "ui_skipped" 后退出
```

### 阶段 2: 设计风格分析与灵感采样
```
1. 从 PRD 抽取风格线索
   → 背景/目标、用户画像、NFR 中的视觉/品牌要求
   → 关键词示例: 现代、简约、科技感、典雅、活泼、企业级、极简、暗色、明快

2. 建立关键词 → 设计风格/大师映射（至少保留原规范的采样组合）
   • 现代 / 简约 / 专业:
       - 现代主义信息设计 (Josef Müller-Brockmann, Massimo Vignelli)
       - 工业设计 (Dieter Rams, Jony Ive)
   • 科技感 / 创新 / 动态:
       - 生成艺术 (Refik Anadol, John Maeda)
       - 未来派建筑 (Zaha Hadid, BIG)
   • 典雅 / 文化 / 文艺:
       - 亚洲与当代艺术 (原研哉, 草间弥生)
       - 平面设计 (Paula Scher, Neville Brody)
   • 活泼 / 年轻 / 时尚:
       - 后现代图形 (David Carson, April Greiman)
       - 抽象艺术 (Henri Matisse, Joan Miró)
   • 企业级 / 金融 / 严肃:
       - 现代主义建筑 (Le Corbusier, Alvar Aalto)
       - 工业设计 (Braun School)
   • 未匹配关键词:
       - 默认组合: 现代主义 + 工业设计

3. 可选灵感采集
   → 若 PRD 或用户提供参考站点/风格，使用 WebSearch/WebFetch 收集视觉要点，
     保存至 `research/ui_inspiration_*.md`

4. 生成 `research/ui_design_strategy.md`
   → 结构建议:
     ```
     # UI 设计策略 - ${REQ_ID}

     ## PRD 风格提取
     - 领域 / 用户画像 / 场景
     - 关键词列表
     - 明确要求 / 禁忌

     ## 采样策略
     - 选定流派 1 （大师列表 + 采样理由）
     - 选定流派 2 （大师列表 + 采样理由）
     - 默认样式（无关键词时的 fallback）

     ## 色彩 / 字体 / 布局假设
     - 主/辅色、对比度、排版方向

     ## 交互与响应式要点
     - 核心动效、断点策略、可访问性注意事项

     ## 外部灵感 (如有)
     - 引用链接 + 摘要
     ```
   → EXECUTION_LOG.md 记录策略生成与关键词
```

### 阶段 3: 调用 ui-designer Agent
```
Prompt 要求:
  - 输入: PRD.md、ui_design_strategy.md、research 集合
  - 输出: UI_PROTOTYPE.html
  - 遵循模板 (.claude/docs/templates/UI_PROTOTYPE_TEMPLATE.md):
      • 页面列表、组件清单、设计系统 (颜色/字体/间距)
      • 响应式断点 (320/768/1024)
      • 交互状态 (hover/active/disabled)
      • 文档内注释说明各部分映射的 PRD 验收标准
  - Constitution: 禁止外链资源、禁止敏感数据硬编码
```

### 阶段 4: Exit Gate
```
1. 文件存在
   → UI_PROTOTYPE.html
   → research/ui_design_strategy.md

2. 结构检查
   → HTML 内包含设计系统、页面导航、组件说明
   → 注释中标注 PRD 用户故事和验收点

3. 状态更新
   → orchestration_status:
        status = "ui_complete"
        completedSteps append "ui"
   → 如跳过，则 status = "ui_skipped" 并记录原因

4. 宪法校验（可选）
   → {SCRIPT:validate_constitution} --type ui --severity warning
```

## 输出
```
✅ UI_PROTOTYPE.html
✅ research/ui_design_strategy.md
✅ EXECUTION_LOG.md 更新（完成或跳过）
```

## 错误处理
- 缺少 PRD 或研究资产 → 提示先完成 `/flow-prd`、`/flow-init` Consolidation。
- Agent 生成失败 → status 设为 `ui_generation_failed`，可修正后重试。
- 用户确认跳过 → 标记 `ui_skipped`，后续流程仍可继续。

## 下一步
1. 审阅原型并与产品对齐。
2. 若涉及前端实现，确保 `/flow-tech` 引用 UI_PROTOTYPE 中的组件与断点。
3. Planner 在 `/flow-epic` 阶段加载页面/组件清单生成对应任务。
