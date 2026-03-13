---
title: UI Prototype Template
description: Self-executable template for generating interactive HTML prototypes from PRD
version: 2.0.0
created: 2025-01-10
updated: 2026-03-12
type: self-executable-template
---

# UI Prototype Template - 自执行原型生成模板

**目的**: 从PRD需求文档生成完整的HTML交互原型,融合艺术设计灵感,输出可直接用于开发实现的高质量原型。

**使用者**: ui-designer研究型代理
**输入**: PRD.md (产品需求文档)
**输出**: UI_PROTOTYPE.html (完整单文件HTML原型)

---

## ⚠️ CRITICAL ANTI-GENERIC-DESIGN RULES

### 强制约束
1. **NO PLACEHOLDER IMAGES**: 必须使用Picsum真实图片资源
2. **NO GENERIC PURPLE/BLUE**: 禁止千篇一律的紫色/蓝色AI风格
3. **NO EMOJI ICONS**: 使用SVG图标或图标库(Lucide/Heroicons/Tabler)
4. **NO LOREM IPSUM**: 使用真实业务场景内容
5. **COMPLETE INTERACTIONS**: 所有交互元素必须有完整状态(hover/active/disabled/error)
6. **ARTISTIC INSPIRATION**: 必须从灵感池采样2位大师并转译风格

### 质量标准
- [ ] HTML文件可独立运行(无外部依赖文件)
- [ ] 响应式布局在三种断点正常显示(320px/768px/1024px)
- [ ] 所有PRD用户故事都有对应UI页面或组件
- [ ] 设计系统完整(色彩/字体/栅格/间距/组件)
- [ ] 通过Constitution检查(NO PARTIAL IMPLEMENTATION)

---

## Execution Flow (10 Phases)

本模板的Execution Flow定义了ui-designer代理必须遵循的10个阶段。

---

### Phase 1: Product Analysis (产品经理分析)

**目标**: 从PRD中提取核心功能、用户流程和UI需求

**输入**: PRD.md
**输出**: 产品分析报告(嵌入HTML注释)

**执行步骤**:
1. 读取PRD.md文档
2. 提取关键信息: 用户画像、核心功能、任务流程、非功能需求
3. 识别页面类型: 认证/仪表盘/列表/详情/表单/设置
4. 构建信息架构草图
5. 输出产品分析报告

**验证点**:
- [x] 至少识别出3个核心功能
- [x] 明确定义了主要用户角色
- [x] 识别出至少2个关键任务流程

---

### Phase 2: Design Inspiration Sampling (设计灵感采样)

**目标**: 从80+位艺术家/设计师/建筑师中随机采样2位,生成风格转译说明

**输入**: 灵感来源池(见 `.claude/docs/examples/design-inspiration-pool.md`)
**输出**: 设计灵感报告(2位大师+转译说明)

**执行步骤**:
1. 随机采样策略: 从不同类别选择,避免风格过于相似
2. 为每位大师生成转译说明(色彩/版式/形态/动效)
3. 生成设计关键词(3-5个)
4. 定义配色方案基调(避免常见AI紫/蓝)
5. 输出设计灵感报告

**验证点**:
- [x] 采样了2位来自不同类别的大师
- [x] 每位大师都有明确的转译说明
- [x] 明确了禁止模仿的具体作品/元素
- [x] 生成了配色方案基调(非常见AI紫/蓝)

---

### Phase 3: Design System Definition (设计系统定义)

**目标**: 基于设计灵感,定义完整的设计系统

**输入**: Phase 2的设计灵感报告
**输出**: Design Tokens (CSS变量形式)

**执行步骤**:
1. 色彩系统: 主色/辅色/中性色/状态色/表面色(禁止纯黑/纯白/常见AI紫蓝)
2. 字体系统: 字体栈/字号/字重/行高
3. 间距系统: 基于8px或4px栅格
4. 栅格系统: 12列/响应式断点
5. 圆角系统: 4-6级
6. 阴影系统: 3-5级
7. 过渡动效: 时长/缓动函数
8. 输出完整Design Tokens

**验证点**:
- [x] 色彩系统完整(至少5个主色变体+7个中性色)
- [x] 字体系统完整(字体栈+字阶)
- [x] 间距/栅格/圆角/阴影系统完整
- [x] 所有Token使用CSS变量格式

---

### Phase 4: Information Architecture (信息架构设计)

**目标**: 设计页面层级、导航结构和用户流程

**输入**: Phase 1的产品分析报告
**输出**: 站点地图(Sitemap) + 用户流程图

**执行步骤**:
1. 页面层级设计: 一级/二级/三级页面
2. 导航结构设计: 主导航/侧边栏/面包屑
3. 用户流程设计: 关键任务路径
4. 页面间跳转逻辑
5. 输出站点地图

**验证点**:
- [x] 所有PRD用户故事都有对应页面
- [x] 导航结构清晰
- [x] 关键流程完整

---

### Phase 5: Component Inventory (组件清单生成)

**目标**: 列出所有需要的UI组件

**输入**: Phase 4的站点地图
**输出**: 组件清单(按类别分组)

**执行步骤**:
1. 基础组件: Button/Input/Select/Checkbox/Radio/Switch
2. 布局组件: Container/Grid/Stack/Divider
3. 导航组件: Navbar/Sidebar/Breadcrumb/Tabs/Pagination
4. 数据展示: Table/Card/List/Badge/Tag/Avatar
5. 反馈组件: Alert/Toast/Modal/Tooltip/Progress/Spinner
6. 表单组件: Form/FormField/FormError/FormHelp
7. 业务组件: 根据PRD定义的特定组件
8. 输出组件清单

**验证点**:
- [x] 组件清单完整
- [x] 每个组件有明确的用途说明
- [x] 组件按类别分组

---

### Phase 6: HTML Structure (HTML结构编写)

**目标**: 编写完整的HTML结构

**输入**: Phase 4的站点地图 + Phase 5的组件清单
**输出**: HTML结构(嵌入<body>标签)

**执行步骤**:
1. HTML5文档结构: <!DOCTYPE html> + <html lang="zh-CN">
2. <head>元数据: charset/viewport/title/meta
3. 设计系统元数据(HTML注释): Phase 1/2/3输出
4. <style>占位符(Phase 7填充)
5. <body>结构: 根据站点地图实例化所有页面
6. <script>占位符(Phase 8填充)
7. 使用语义化标签: <header>/<nav>/<main>/<section>/<article>/<aside>/<footer>
8. ARIA标签: role/aria-label/aria-labelledby/aria-describedby
9. 输出完整HTML结构

**验证点**:
- [x] HTML5语义化标签
- [x] ARIA标签完整
- [x] 所有页面都已实例化
- [x] 设计系统元数据已嵌入注释

---

### Phase 7: CSS Styling (CSS样式实现)

**目标**: 基于Phase 3的设计系统,编写完整的CSS样式

**输入**: Phase 6的HTML结构 + Phase 3的Design Tokens
**输出**: 完整的CSS样式(嵌入<style>标签)

**执行步骤**:
1. CSS架构: Design System/Reset/Layout/Components/Pages/Utilities/Responsive/Animations
2. Design System (CSS Variables): 将Phase 3的Design Tokens写入:root
3. Reset & Base Styles
4. Layout System: Flexbox/Grid
5. Component Styles: 为Phase 5的每个组件编写样式,包含所有状态(hover/active/disabled/error)
6. Page-Specific Styles
7. Responsive Design: 三断点媒体查询(320px/768px/1024px)
8. Animations: 基于Phase 2的设计灵感
9. Dark Mode (可选)
10. 输出完整CSS

**验证点**:
- [x] Design Tokens已转换为CSS变量
- [x] 所有组件有完整状态样式
- [x] 响应式布局正常
- [x] 动效符合设计灵感

---

### Phase 8: JavaScript Interactions (JavaScript交互实现)

**目标**: 实现所有交互逻辑

**输入**: Phase 6的HTML结构
**输出**: 完整的JavaScript代码(嵌入<script>标签)

**执行步骤**:
1. 页面路由: SPA单页应用路由逻辑
2. 表单验证: 实时验证+错误提示
3. 模态框/抽屉: 打开/关闭逻辑
4. 下拉菜单/工具提示: 显示/隐藏逻辑
5. 标签页/手风琴: 切换逻辑
6. 数据加载: 模拟API调用+加载状态
7. 搜索/过滤/排序: 列表操作逻辑
8. 通知/Toast: 显示/自动关闭
9. 键盘导航: Tab/Enter/Escape支持
10. 输出完整JavaScript

**验证点**:
- [x] 所有交互元素可用
- [x] 表单验证完整
- [x] 键盘导航可用
- [x] 无console错误

---

### Phase 9: Responsive Adaptation (响应式适配)

**目标**: 确保三断点响应式正常

**输入**: Phase 7的CSS + Phase 8的JavaScript
**输出**: 响应式优化后的代码

**执行步骤**:
1. Mobile (320px-767px): 移动端优先设计
2. Tablet (768px-1023px): 平板适配
3. Desktop (1024px+): 桌面端适配
4. 触摸优化: 按钮最小44x44px
5. 字体缩放: 移动端基础字号14px,桌面端16px
6. 图片优化: srcset/loading="lazy"
7. 性能优化: CSS/JS压缩,关键CSS内联
8. 输出优化后的代码

**验证点**:
- [x] 三断点正常显示
- [x] 触摸目标足够大
- [x] 图片加载优化
- [x] 性能达标

---

### Phase 10: Constitution & Quality Check (宪法与质量检查)

**目标**: 确保符合Constitution和质量标准

**输入**: 完整的UI_PROTOTYPE.html
**输出**: 质量检查报告 + 最终HTML文件

**执行步骤**:
1. Constitution检查: Article I/III/V/X
2. Anti-Generic-Design检查: 无占位图/常见AI配色/Emoji/Lorem Ipsum
3. HTML质量检查: 语义化/ARIA/无重复ID
4. CSS质量检查: CSS变量/响应式/无!important滥用
5. JavaScript质量检查: 无全局污染/事件监听器正确/无内存泄漏
6. 可访问性检查: 色彩对比度≥4.5:1/键盘导航/屏幕阅读器
7. 性能检查: CDN资源<1s/首屏<2s/交互<100ms
8. 输出质量检查报告

**验证点**: 详见 `.claude/docs/examples/ui-prototype-constitution-checklist.md`

---

## Error Handling

### Phase 2失败: 设计灵感采样失败
- **原因**: 灵感池文件不存在或格式错误
- **解决**: 使用默认灵感(现代主义+生成艺术)
- **重试**: 手动指定2位大师

### Phase 10失败: Constitution检查失败
- **原因**: 存在占位符/硬编码密钥/不完整实现
- **解决**: 修复违规项
- **重试**: 重新运行Phase 10

---

## Data Flow

```text
PRD.md (Input)
  ├─ 用户故事 → Phase 1 (产品分析) → 页面列表
  ├─ 非功能需求 → Phase 3 (设计系统) → 性能/可访问性约束
  └─ 验收标准 → Phase 8 (交互逻辑) → 验证规则

UI_PROTOTYPE.html (Output)
  ├─ HTML注释 → EPIC生成时的参考资料
  ├─ Design System → TASKS生成时的技术约束
  └─ Component Inventory → DEV实现时的组件清单
```

---

## Best Practices

### For ui-designer Agent:

1. **严格遵循Execution Flow**: 不跳过任何Phase
2. **设计灵感采样**: 选择互补而非冲突的风格
3. **内容真实性**: 图片用Picsum,数据符合业务场景
4. **响应式优先**: 移动端优先设计(Mobile First)
5. **可访问性非可选**: ARIA标签/键盘导航/色彩对比度

### For Main Agent (Claude):

1. **条件触发**: 检测PRD关键词前使用grep -i(忽略大小写)
2. **状态管理**: 更新orchestration_status.json中的phase
3. **错误处理**: 记录详细错误到EXECUTION_LOG.md

---

## Validation Checklist (最终检查清单)

在输出UI_PROTOTYPE.html前,确保:

### Template Compliance
- [x] 遵循了所有10个Phase的Execution Flow
- [x] 每个Phase的输出都已生成并嵌入HTML注释

### Anti-Generic-Design
- [x] 无占位图片(所有图片使用Picsum URL)
- [x] 无常见AI紫色/蓝色配色
- [x] 无Emoji图标(使用SVG或图标库)
- [x] 无Lorem Ipsum占位文本

### Constitution Compliance
- [x] Article I - 完整实现,无占位符
- [x] Article III - 无硬编码密钥
- [x] Article V - HTML注释完整,代码可维护
- [x] Article X - 仅实现PRD明确的需求

### Quality Standards
- [x] HTML5语义化标签
- [x] ARIA标签完整
- [x] 响应式布局(三断点)
- [x] 交互逻辑完整
- [x] 设计系统完整
- [x] 所有PRD用户故事对齐

### Ready for Handoff
- [x] 文件可独立运行(浏览器打开即可查看)
- [x] 开发人员可直接参考实现代码
- [x] 产品经理可用于需求验证
- [x] 设计师可用于设计评审

---

**Template Version**: 2.0.0 (Slimmed from 1375 lines to ~400 lines, -71%)
**Last Updated**: 2026-03-12
**Maintainer**: CC-DevFlow Team
**License**: MIT

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
