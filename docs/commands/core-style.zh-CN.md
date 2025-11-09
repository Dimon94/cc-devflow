# `/core-style` - 生成项目设计风格指南

[English](./core-style.md) | [中文文档](./core-style.zh-CN.md)

---

## 📋 概述

通过参考设计或现有代码分析，生成项目级设计风格指南（STYLE.md），确保整个项目的视觉一致性。

## 🎯 语法

```bash
/core-style            # 生成新的设计风格指南
/core-style --update   # 更新现有设计风格指南
```

## 🎬 使用场景

### ✅ 推荐场景
- 项目初始化时建立设计标准
- 需要统一项目视觉风格
- 从参考设计中提取设计系统
- 从现有代码中整理设计规范
- 设计风格变更时更新指南

### ❌ 不推荐场景
- 单个需求的 UI 设计 → 使用 `/flow-ui`
- 临时的样式调整 → 直接修改组件代码

## 🧭 定位

**项目级别命令**（类似 `/core-roadmap`）

- `/core-roadmap` 定义产品路线图（功能规划）
- `/core-style` 定义设计风格指南（视觉规范）
- 两者都是项目的 **SSOT（单一真理源）**

## 💡 核心理念

> "设计系统是视觉语言的语法，代码是语法的实现。无语法，则无一致性。"

**STYLE.md 的作用**:
- ✅ 项目设计的唯一真理源（SSOT）
- ✅ `/flow-ui` 生成 UI 原型时的首要参考
- ✅ `/flow-dev` 前端开发时的强制规范
- ✅ 确保所有需求的 UI 视觉一致

## 🔄 执行流程（三阶段）

```text
阶段 1: Entry Gate & 项目类型检测
  ├─ 检测现有风格指南（STYLE.md 是否存在）
  ├─ 检测项目类型（新项目 vs 现有项目）
  └─ 路由选择（新项目 → 参考设计采集 / 现有项目 → 代码分析）

阶段 2: 参考设计采集与复刻（仅新项目）
  ├─ 引导用户提供参考设计（URL / 截图 / HTML+CSS）
  ├─ 生成单 HTML 文件复刻（reference-001.html）
  ├─ 用户微调循环（reference-002.html, reference-003.html...）
  └─ 确认最终版本（reference-final.html）

阶段 3: 风格分析与 STYLE.md 生成
  ├─ 分析输入源（reference-final.html 或项目代码）
  ├─ 生成风格分析文档（research/style_analysis.md）
  ├─ 调用 style-guide-generator Agent
  └─ 输出 STYLE.md

Exit Gate: 文件检查 + 宪法校验 + 状态更新
```

## 📂 输出文件

```
devflow/
├── STYLE.md                                  # 项目设计风格指南（SSOT）
├── research/
│   ├── style_analysis.md                    # 风格分析文档
│   └── style_reference_designs/             # 参考设计（新项目）
│       ├── reference-001.html               # 第 1 版复刻
│       ├── reference-002.html               # 第 2 版（微调）
│       └── reference-final.html             # 最终确认版本
├── project_status.json                      # 项目状态（更新）
└── EXECUTION_LOG.md                         # 执行日志（更新）
```

## 📋 STYLE.md 包含内容

STYLE.md 是一份详尽的设计风格指南，包含以下 15 个核心部分：

1. **Overview** - 设计系统概述（名称、版本、理念、更新历史）
2. **Color Palette** - 色板系统（主色、辅色、语义色、中性色，包含 Hex/RGB/HSL）
3. **Typography** - 字体系统（字体族、字阶、响应式字体、组合规律）
4. **Spacing System** - 间距系统（基础单位、间距等级、使用场景）
5. **Component Styles** - 组件样式库（Button, Input, Card, Modal 等，包含变体、尺寸、状态）
6. **Shadows & Elevation** - 阴影与层级系统（阴影等级、使用场景）
7. **Animations & Transitions** - 动画与过渡（时长、缓动函数、常用动画）
8. **Border Radius** - 圆角系统（圆角等级、使用场景）
9. **Opacity & Transparency** - 透明度系统（透明度等级、使用场景）
10. **Common Tailwind CSS Usage** - Tailwind 使用规范（如适用）
11. **Example Component Reference Design Code** - 示例组件代码（至少 3 个完整实现）
12. **Design Principles** - 设计原则（简洁性、一致性、可访问性等）
13. **Responsive Design** - 响应式设计（断点、策略、示例）
14. **Accessibility** - 可访问性（色彩对比度、键盘导航、ARIA 属性）
15. **Assets** - 资源规范（Icon、Image、Logo 等，如适用）

**所有定义都包含**:
- 具体值（不是 "待定义" 或占位符）
- 语义化命名（如 `--color-primary`, `--spacing-md`）
- 使用场景说明
- 示例代码（CSS Variables / Tailwind Config）

**示例代码特点**:
- ✅ 可直接复用（Copy-paste ready）
- ✅ 包含完整的 HTML 结构和 CSS/Tailwind classes
- ✅ 注释清晰，说明设计决策
- ❌ 不是伪代码或占位符

## 🆕 新项目流程示例

### 场景：你有一个喜欢的设计，想要作为项目的设计基础

```bash
# Step 1: 运行命令
/core-style

# Step 2: Agent 引导
Agent: 检测到这是一个新项目（无前端代码）。

请提供你想要参考的设计，可以包括：
- 网站 URL（我会抓取并分析）
- 设计截图（PNG/JPG）
- 提取的 HTML + CSS 代码

我将帮你复刻这个设计到单 HTML 文件中。

# Step 3: 用户提供参考
User: 我想参考 https://example.com/design，这里是截图和提取的 CSS...

# Step 4: Agent 生成复刻
Agent: 已生成 devflow/research/style_reference_designs/reference-001.html

请打开文件查看效果。你满意吗？如果不满意，请告诉我需要调整的地方：
- 颜色（如：主色调太鲜艳，改为更柔和的蓝色）
- 字体（如：标题字体太粗，改为 medium weight）
- 间距（如：卡片间距太小，增加到 24px）
- 组件样式（如：按钮圆角太大，改为 4px）

# Step 5: 用户微调
User: 主色调改为 #3B82F6，按钮圆角改为 6px。

# Step 6: Agent 调整并再次确认
Agent: 已调整，生成 reference-002.html。请查看。满意吗？

User: 满意！

# Step 7: Agent 生成 STYLE.md
Agent: 正在分析 reference-final.html，生成 STYLE.md...

✅ STYLE.md 已生成！

生成内容统计:
- 颜色定义: 15 个
- 字体定义: 8 个
- 间距等级: 10 个
- 组件样式: 12 个
- 示例代码: 3 个

下一步建议:
1. 审阅 devflow/STYLE.md 确保完整性
2. 运行 /flow-prd 开始需求开发
```

## 🏢 现有项目流程示例

### 场景：你有一个已有前端代码的项目，想要整理设计规范

```bash
# Step 1: 运行命令
/core-style

# Step 2: Agent 自动分析
Agent: 检测到这是一个现有项目（发现 src/components/, styles/ 等）。

正在分析项目代码，提取设计风格...
- 分析文件: src/components/**/*.tsx, styles/**/*.css
- 提取颜色: 主色 #3B82F6, 辅色 #8B5CF6, ...
- 提取字体: Inter, Roboto Mono
- 提取间距: 4px, 8px, 16px, 24px, 32px...

已生成 devflow/research/style_analysis.md，正在生成 STYLE.md...

✅ STYLE.md 已生成！

生成内容统计:
- 颜色定义: 18 个
- 字体定义: 6 个
- 间距等级: 8 个
- 组件样式: 15 个
- 示例代码: 3 个

技术栈:
- 框架: React
- CSS: Tailwind CSS

下一步建议:
1. 审阅 devflow/STYLE.md 确保完整性
2. 根据 STYLE.md 调整不一致的组件（如有）
```

## 🔄 更新模式示例

### 场景：设计风格有变化，需要更新 STYLE.md

```bash
# Step 1: 运行命令
/core-style --update

# Step 2: Agent 分析并更新
Agent: 检测到现有 STYLE.md（v1.0.0），进入更新模式。

正在分析最新代码，检测新增设计模式...
- 发现新颜色: Warning #F59E0B
- 发现新组件: Tooltip, Pagination
- 发现新间距: 96px

已合并到 STYLE.md（v1.1.0）。

更新内容:
- 新增颜色: 1 个
- 新增组件: 2 个
- 新增间距: 1 个

✅ STYLE.md 更新完成！

下一步建议:
1. 审阅变更内容
2. 更新现有 UI 原型（如有）
```

## 🔗 与其他工作流的集成

### `/flow-ui` 集成

**变更前**（无 STYLE.md）:
- `/flow-ui` 使用默认采样策略（80+ 设计大师）
- 每个需求的 UI 可能风格不一致

**变更后**（有 STYLE.md）:
- `/flow-ui` 优先加载 `devflow/STYLE.md`
- 所有颜色、字体、间距、组件严格遵循 STYLE.md
- 仅在 STYLE.md 未覆盖的部分，才使用默认采样策略

**示例**:
```bash
# 运行 /flow-ui
/flow-ui "REQ-001"

# Agent 自动引用 STYLE.md
Agent: 检测到 devflow/STYLE.md（v1.0.0），将严格遵循设计风格指南。

正在生成 UI 原型...
- 主色: #3B82F6（来自 STYLE.md）
- 字体: Inter（来自 STYLE.md）
- 按钮圆角: 6px（来自 STYLE.md）

✅ UI_PROTOTYPE.html 已生成，所有样式符合 STYLE.md。
```

### `/flow-dev` 集成

**变更后**（有 STYLE.md）:
- `/flow-dev` 在生成前端代码时自动加载 `devflow/STYLE.md`
- 所有组件实现必须遵循 STYLE.md 的样式定义
- 特别注意：颜色使用、字体使用、间距使用、组件结构

**示例**:
```bash
# 运行 /flow-dev
/flow-dev "REQ-001"

# Agent 自动引用 STYLE.md
Agent: 检测到 devflow/STYLE.md（v1.0.0），所有前端代码将遵循设计风格指南。

正在实现 Task T003: 实现登录按钮...
- 使用 STYLE.md 的 Button Primary 样式
- 颜色: var(--color-primary)
- 圆角: var(--radius-md)
- 间距: var(--spacing-2) var(--spacing-4)

✅ 登录按钮实现完成，样式符合 STYLE.md。
```

## 💡 设计哲学

### 1. SSOT 原则（单一真理源）
- STYLE.md 是项目设计的唯一真理源
- 所有 UI 相关工作必须以 STYLE.md 为准
- 避免设计风格的碎片化和不一致

### 2. 一致性优先
- 统一的视觉语言提升产品专业度
- 一致的组件样式降低开发和维护成本
- 用户体验更流畅、可预测

### 3. 可复用性
- 所有定义都是具体、可执行的
- 示例代码可直接复用，不是伪代码
- 减少重复劳动，提高开发效率

### 4. 演进性
- 通过 `--update` 参数支持风格指南的迭代
- 版本控制（v1.0.0, v1.1.0...）
- 记录每次更新的原因和变更内容

### 5. 用户中心
- 新项目通过参考设计采集 + 微调循环
- 确保用户满意度
- 避免后期大规模重构

## 📊 工作流位置

```
/flow-init → research.md + tasks.json
     ↓
/core-roadmap → ROADMAP.md + BACKLOG.md (可选，项目级)
     ↓
/core-style → STYLE.md (可选，项目级设计风格指南) ⭐ 新增
     ↓
/flow-prd → PRD.md
     ↓
/flow-tech → TECH_DESIGN.md + data-model + contracts
     ↓
/flow-ui → UI_PROTOTYPE.html (必须参考 STYLE.md) ⭐ 变更
     ↓
/flow-epic → EPIC.md + TASKS.md
     ↓
/flow-dev → TASKS.md execution (前端代码必须参考 STYLE.md) ⭐ 变更
     ↓
/flow-qa → QA reports
     ↓
/flow-release → PR creation
```

## ⚠️ 错误处理

| 错误场景 | 处理方式 |
|----------|----------|
| **STYLE.md 已存在且无 --update 参数** | 询问是否覆盖，用户拒绝则退出 |
| **项目无前端特征且用户未提供参考设计** | 提示用户提供参考设计或确认是纯后端项目 |
| **参考设计复刻失败** | 要求用户提供更详细的设计信息（HTML/CSS/截图） |
| **Agent 生成失败** | 保留 style_analysis.md，提示用户检查后重试 |
| **宪法校验失败** | 根据 severity 决定是否阻塞（warning 级别仅提示） |

## 🎯 下一步

1. **审阅 STYLE.md** - 确保设计风格指南完整且符合项目需求
2. **更新现有组件**（现有项目）- 根据 STYLE.md 调整不一致的组件
3. **运行 /flow-prd** - 开始需求开发（如适用）
4. **运行 /core-roadmap** - 生成产品路线图（如适用）

## 🔗 相关命令

- [`/core-roadmap`](./core-roadmap.zh-CN.md) - 生成产品路线图
- [`/flow-ui`](./flow-ui.zh-CN.md) - 生成 UI 原型（将引用 STYLE.md）
- [`/flow-dev`](./flow-dev.zh-CN.md) - 执行开发任务（将引用 STYLE.md）
- [`/flow-verify`](./flow-verify.zh-CN.md) - 一致性检查（可检查代码是否符合 STYLE.md）

## 📚 深入阅读

- [设计系统指南](../guides/design-system-guide.md)（待创建）
- [视觉一致性管理](../guides/visual-consistency.md)（待创建）
- [STYLE_TEMPLATE](../../.claude/docs/templates/STYLE_TEMPLATE.md)

## ❓ 常见问题

### Q: 什么时候应该运行 `/core-style`？
A:
- ✅ 项目初始化时（建立设计标准）
- ✅ 有参考设计想要复刻时
- ✅ 现有项目需要整理设计规范时
- ✅ 设计风格发生变化时（使用 `--update`）

### Q: `/core-style` 和 `/flow-ui` 的区别？
A:
- **core-style**: 生成**项目级**设计风格指南（STYLE.md），一次性或按需更新
- **flow-ui**: 为**特定需求**生成 UI 原型（UI_PROTOTYPE.html），每个需求都要运行

### Q: 如果我的项目是纯后端，需要运行 `/core-style` 吗？
A: 不需要。`/core-style` 是为前端项目或全栈项目设计的。纯后端项目无需设计风格指南。

### Q: STYLE.md 生成后可以手动修改吗？
A: 可以。STYLE.md 是 Markdown 文件，你可以手动编辑。但建议使用 `/core-style --update` 命令更新，确保版本控制和一致性。

### Q: 如果参考设计复刻不满意怎么办？
A: Agent 会提供微调循环，你可以多次调整直到满意。每次调整都会生成新版本（reference-002.html, reference-003.html...），你可以随时回退。

### Q: STYLE.md 会自动应用到代码吗？
A: 不会自动修改代码。但 `/flow-ui` 和 `/flow-dev` 会自动引用 STYLE.md，确保新生成的代码符合风格指南。现有代码需要手动调整（或使用 `/flow-verify` 检查不一致）。

### Q: 如果我的项目使用 Tailwind CSS，STYLE.md 会包含 Tailwind 配置吗？
A: 会。Agent 会自动检测技术栈，如果使用 Tailwind CSS，STYLE.md 会包含 Tailwind Config 示例代码。

### Q: STYLE.md 包含哪些内容？
A: 包含 15 个核心部分：Overview, Color Palette, Typography, Spacing System, Component Styles, Shadows, Animations, Border Radius, Opacity, Tailwind Usage, Example Code, Design Principles, Responsive Design, Accessibility, Assets。详见 [STYLE_TEMPLATE](../../.claude/docs/templates/STYLE_TEMPLATE.md)。
