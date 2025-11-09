---
name: core-style
description: Generate project-level design style guide. Usage: /core-style [--update]
scripts:
  validate_constitution: .claude/scripts/validate-constitution.sh
---

# Flow-Style - 设计风格指南生成命令

## User Input
```text
$ARGUMENTS = "[--update]"
```
`--update` 表示更新现有 STYLE.md，缺省表示生成新的风格指南。

## 命令格式
```text
/core-style            # 生成新的设计风格指南
/core-style --update   # 更新现有设计风格指南
```

## 触发原则
- **项目初始化时**：在 `/core-roadmap` 之后，或作为独立命令运行
- **设计风格变更时**：通过 `--update` 参数更新现有风格指南
- **项目级别**：类似 `/core-roadmap`，为整个项目建立设计标准（SSOT）

## 核心理念
> "设计系统是视觉语言的语法，代码是语法的实现。无语法，则无一致性。"

STYLE.md 是项目的**设计真理源（SSOT）**，后续所有 UI 相关工作必须遵循：
- `/flow-ui` 生成的 UI_PROTOTYPE.html 必须严格遵循 STYLE.md
- `/flow-dev` 前端开发代码必须严格遵循 STYLE.md

## 执行流程

### 阶段 1: Entry Gate & 项目类型检测
```
1. 检测现有风格指南
   → 检查 devflow/STYLE.md 是否存在
   → 如存在且无 --update 参数 → WARN 并询问是否覆盖
   → 如存在且有 --update 参数 → 进入更新模式

2. 检测项目类型
   → 检查项目特征:
      • package.json, src/components/, styles/, public/ 等前端文件
      • 判断是新项目（无前端代码）还是现有项目（有前端代码）
   → 记录项目类型到 EXECUTION_LOG.md

3. 路由选择
   → 新项目 → 进入阶段 2（参考设计采集）
   → 现有项目 → 进入阶段 3（代码分析）
   → 更新模式 → 进入阶段 3（代码分析 + 现有 STYLE.md 合并）
```

### 阶段 2: 参考设计采集与复刻（仅新项目）
```
1. 引导用户提供参考设计
   → 提示用户:
     "请提供你想要参考的设计，可以包括：
      - 网站 URL（我会抓取并分析）
      - 设计截图（PNG/JPG）
      - 提取的 HTML + CSS 代码

      我将帮你复刻这个设计到单 HTML 文件中。"

2. 生成参考设计复刻
   → 使用提示词:
     "Help me rebuild exact same UI design in single html as reference-001.html.
      Above is extracted css and design screenshot."
   → 生成单 HTML 文件
   → 保存到 devflow/research/style_reference_designs/reference-001.html
   → 如有截图，保存到 devflow/research/style_reference_designs/reference-001.png

3. 用户微调循环
   → 提示用户打开 HTML 文件查看效果:
     "请打开 devflow/research/style_reference_designs/reference-001.html 查看效果。

      你满意吗？如果不满意，请告诉我需要调整的地方：
      - 颜色（如：主色调太鲜艳，改为更柔和的蓝色）
      - 字体（如：标题字体太粗，改为 medium weight）
      - 间距（如：卡片间距太小，增加到 24px）
      - 组件样式（如：按钮圆角太大，改为 4px）
      - 其他..."
   → 根据用户反馈调整 HTML
   → 生成新版本：reference-002.html, reference-003.html, ...
   → 重复此循环，直到用户满意

4. 确认最终版本
   → 用户确认满意后，询问:
     "请确认这是最终版本吗？(y/n)"
   → 用户确认后，复制最终版本为 reference-final.html
   → 进入阶段 3 生成风格分析
```

### 阶段 3: 风格分析与 STYLE.md 生成
```
1. 分析输入源
   → 新项目:
      • 读取 devflow/research/style_reference_designs/reference-final.html
      • 提取颜色、字体、间距、组件样式、动画、阴影等
   → 现有项目:
      • 使用 Glob 查找前端文件: **/*.{tsx,jsx,vue,svelte,css,scss,sass}
      • 使用 Grep 搜索样式定义、Tailwind classes、CSS variables
      • 分析组件结构、设计模式
   → 更新模式:
      • 结合现有 STYLE.md + 最新代码分析
      • 保留现有定义，补充新发现的模式

2. 生成风格分析文档
   → 创建 devflow/research/style_analysis.md
   → 结构:
     ```
     # 设计风格分析

     ## 分析来源
     - 参考设计: reference-final.html (新项目)
     - 代码分析: src/components/**, styles/** (现有项目)
     - 分析时间: YYYY-MM-DD 北京时间

     ## 颜色提取
     - 主色: #XXXXXX (使用频率: XX%)
     - 辅色: #XXXXXX (使用频率: XX%)
     - 成功色: #XXXXXX
     - 警告色: #XXXXXX
     - 错误色: #XXXXXX
     - 中性色: #XXXXXX, #XXXXXX, ...

     ## 字体分析
     - 标题字体: Font Family, Weight, Size
     - 正文字体: Font Family, Weight, Size
     - 代码字体: Font Family (如有)
     - 字体组合规律

     ## 间距系统
     - 基础单位: 4px / 8px / 16px
     - 组件间距: 8px, 16px, 24px, 32px
     - 布局间距: 48px, 64px, 96px

     ## 组件样式模式
     - 按钮: 圆角、阴影、hover 效果、padding
     - 卡片: 圆角、阴影、边框、padding
     - 输入框: 圆角、边框、focus 效果、padding
     - ...

     ## 其他设计元素
     - 阴影 & 层级: box-shadow 定义
     - 动画 & 过渡: transition, animation 定义
     - 圆角: border-radius 规律
     - 透明度: opacity 使用场景
     ```
   → EXECUTION_LOG.md 记录分析完成

3. 调用 style-guide-generator Agent
   → Prompt 要求:
      • 输入: research/style_analysis.md + (reference-final.html 或项目代码)
      • 输出: devflow/STYLE.md
      • 遵循模板: .claude/docs/templates/STYLE_TEMPLATE.md
      • 必须包含:
        - Overview (设计系统概述)
        - Color Palette (完整色板 + Hex/RGB/HSL)
        - Typography (字体系统 + weight/size/line-height 组合)
        - Spacing System (间距系统 + 使用示例)
        - Component Styles (所有组件的详细样式定义)
        - Shadows & Elevation (阴影系统 + 层级说明)
        - Animations & Transitions (动画 + 过渡效果)
        - Border Radius (圆角系统)
        - Opacity & Transparency (透明度使用场景)
        - Common Tailwind CSS Usage (如适用)
        - Example Component Reference Design Code (示例组件代码)
        - Design Principles (设计原则，如有)
      • Constitution 约束:
        - 禁止外链资源（字体、图片等必须本地化或使用 CDN）
        - 禁止硬编码敏感数据
        - 所有颜色必须提供 Hex 和语义化命名
        - 所有示例代码必须可直接复用

4. 生成 STYLE.md
   → Agent 输出 devflow/STYLE.md
   → 确保文档包含所有必需部分
   → 确保示例代码完整可执行
```

### 阶段 4: Exit Gate
```
1. 文件完整性检查
   → 必须存在:
      • devflow/STYLE.md
      • devflow/research/style_analysis.md
   → 新项目还需:
      • devflow/research/style_reference_designs/reference-final.html

2. 结构检查
   → STYLE.md 包含所有必需部分（Overview, Color Palette, Typography, ...）
   → 包含至少 3 个完整的示例组件代码
   → 所有颜色定义包含 Hex 值和语义化命名
   → 所有字体定义包含 weight, size, line-height

3. 宪法校验
   → {SCRIPT:validate_constitution} --type style --severity warning
   → 检查外链资源、硬编码数据等

4. 状态更新
   → 创建/更新项目级状态文件（如不存在）:
      devflow/project_status.json:
      {
        "project_name": "Project Name",
        "style_guide_complete": true,
        "style_guide_version": "1.0.0",
        "last_updated": "YYYY-MM-DD HH:mm 北京时间"
      }
   → EXECUTION_LOG.md 记录完成事件

5. 后续集成提醒
   → 输出提示:
     "✅ STYLE.md 已生成！

      后续工作流将自动引用此设计风格指南：
      - /flow-ui 将严格遵循 STYLE.md 生成 UI 原型
      - /flow-dev 前端开发将严格遵循 STYLE.md

      下一步建议：
      1. 审阅 devflow/STYLE.md 确保完整性
      2. （可选）运行 /flow-prd 开始需求开发
      3. （可选）运行 /core-roadmap 生成产品路线图"
```

## 输出
```
✅ devflow/STYLE.md                                         # 项目设计风格指南（SSOT）
✅ devflow/research/style_analysis.md                      # 风格分析文档
✅ devflow/research/style_reference_designs/reference-*.html  # 参考设计（新项目）
✅ devflow/project_status.json                             # 项目级状态（更新）
✅ EXECUTION_LOG.md                                        # 执行日志（更新）
```

## 错误处理
- **STYLE.md 已存在且无 --update 参数** → 询问是否覆盖，用户拒绝则退出
- **项目无前端特征且用户未提供参考设计** → 提示用户提供参考设计或确认是纯后端项目
- **参考设计复刻失败** → 要求用户提供更详细的设计信息（HTML/CSS/截图）
- **Agent 生成失败** → 保留 style_analysis.md，提示用户检查后重试
- **宪法校验失败** → 根据 severity 决定是否阻塞（warning 级别仅提示）

## 下一步
1. **审阅 STYLE.md** - 确保设计风格指南完整且符合项目需求
2. **更新现有组件**（现有项目）- 根据 STYLE.md 调整不一致的组件
3. **运行 /flow-prd** - 开始需求开发（如适用）
4. **运行 /core-roadmap** - 生成产品路线图（如适用）

## 与其他工作流的集成

### /flow-ui 集成
- `/flow-ui` 在阶段 2（设计风格分析）时，优先加载 `devflow/STYLE.md`
- 所有颜色、字体、间距、组件必须严格遵循 STYLE.md
- 仅在 STYLE.md 未覆盖的部分，才使用默认采样策略（80+ 设计大师）

### /flow-dev 集成
- `/flow-dev` 在阶段 2（Quickstart 初始化）时，加载 `devflow/STYLE.md`
- 所有前端代码生成必须遵循 STYLE.md 定义的风格
- 特别注意：颜色、字体、间距、组件结构

### /flow-verify 集成
- `/flow-verify` 可检查代码是否符合 STYLE.md 定义的风格
- 检查项：颜色使用、字体使用、间距使用、组件结构一致性

## 设计哲学
- **SSOT 原则**: STYLE.md 是项目设计的唯一真理源
- **一致性优先**: 所有 UI 相关工作必须遵循 STYLE.md，避免风格碎片化
- **可复用性**: 示例代码必须可直接复用，不是伪代码
- **演进性**: 通过 `--update` 参数支持风格指南的迭代更新
- **用户中心**: 新项目通过参考设计采集 + 微调循环，确保用户满意度

## 补充说明

### 为什么需要项目级设计风格指南？
1. **避免风格碎片化**: 每个需求的 UI 可能由不同人开发，STYLE.md 确保一致性
2. **提高开发效率**: 开发者直接引用 STYLE.md 的定义，无需重复决策
3. **降低维护成本**: 统一的设计系统减少重复代码和样式冲突
4. **提升用户体验**: 一致的视觉语言提升产品专业度和可用性

### 参考设计微调循环的价值
- **用户满意度**: 允许用户在实际 HTML 中看到效果并迭代调整
- **设计精准度**: 通过多次微调，确保最终风格指南真正符合用户期望
- **避免返工**: 早期确定设计风格，避免后期大规模重构

### 现有项目 vs 新项目
- **新项目**: 通过参考设计建立设计系统（主动定义）
- **现有项目**: 通过代码分析提取设计系统（被动提取）
- **更新模式**: 结合现有定义 + 最新代码，持续演进

### STYLE.md 的演进策略
- **版本控制**: 每次更新增加版本号（记录在 project_status.json）
- **向后兼容**: 更新时保留现有定义，仅补充新模式
- **变更追踪**: 在 EXECUTION_LOG.md 记录每次更新的原因和变更内容
