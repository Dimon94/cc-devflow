---
template_name: STYLE_TEMPLATE
version: 2.0.0
description: Template for generating project-level design style guide (STYLE.md)
last_updated: 2026-03-12 北京时间
---

# Design Style Guide - {Project Name}

> 项目设计风格指南 - 视觉一致性的唯一真理源（SSOT）

---

## 📋 Overview

### 设计系统信息
- **名称**: {Design System Name}
- **版本**: {Version, e.g., 1.0.0}
- **创建时间**: {YYYY-MM-DD 北京时间}
- **最后更新**: {YYYY-MM-DD 北京时间}

### 设计理念
{简要描述设计系统的核心价值和设计理念，2-3 句话}

### 适用范围
- ✅ 所有 Web 应用界面（Desktop, Tablet, Mobile）
- ✅ 所有前端组件库
- ✅ 所有 UI 原型设计
- ❌ 营销材料（使用独立的品牌指南）

---

## 🎨 Color Palette

### 主色（Primary）
主色用于主要操作、品牌强调、关键 CTA 等。

| 等级 | Hex | 使用场景 |
|------|-----|----------|
| Primary 50 | {#XXXXXX} | 主色浅背景 |
| Primary 500 | {#XXXXXX} | 主色（默认） |
| Primary 600 | {#XXXXXX} | Active 状态 |
| Primary 900 | {#XXXXXX} | 主色深背景 |

**CSS Variables**:
```css
:root {
  --color-primary-50: {#XXXXXX};
  --color-primary-500: {#XXXXXX};
  --color-primary-600: {#XXXXXX};
  --color-primary-900: {#XXXXXX};
  --color-primary: var(--color-primary-500);
  --color-primary-hover: var(--color-primary-600);
}
```

### 辅色（Secondary）
辅色用于次要操作、辅助信息、背景变化等。

| 等级 | Hex | 使用场景 |
|------|-----|----------|
| Secondary 500 | {#XXXXXX} | 辅色（默认） |

### 语义色（Semantic Colors）

| 类型 | Hex | 使用场景 |
|------|-----|----------|
| Success | {#XXXXXX} | 成功提示、完成状态、正向反馈 |
| Warning | {#XXXXXX} | 警告提示、需要注意的信息 |
| Error | {#XXXXXX} | 错误提示、失败状态、危险操作 |
| Info | {#XXXXXX} | 信息提示、帮助文本 |

### 中性色（Neutrals / Grayscale）
中性色用于文本、边框、背景、禁用状态等。

| 等级 | Hex | 使用场景 |
|------|-----|----------|
| Gray 50 | {#XXXXXX} | 浅背景 |
| Gray 200 | {#XXXXXX} | 边框、分隔线 |
| Gray 400 | {#XXXXXX} | 占位符文本 |
| Gray 600 | {#XXXXXX} | 正文文本 |
| Gray 900 | {#XXXXXX} | 最深文本 |

### 色彩对比度（Accessibility）
所有颜色组合必须通过 **WCAG AA** 对比度测试：
- **正文文本（16px+）**: 对比度 ≥ 4.5:1
- **大文本（18px+ 或 14px+ bold）**: 对比度 ≥ 3:1
- **UI 组件**: 对比度 ≥ 3:1

---

## ✍️ Typography

### 字体族（Font Families）

#### 标题字体（Headings）
```css
--font-heading: "{Font Name}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

#### 正文字体（Body）
```css
--font-body: "{Font Name}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

#### 代码字体（Monospace）
```css
--font-mono: "Fira Code", "Monaco", "Consolas", monospace;
```

### 字阶系统（Type Scale）

| 类型 | Font Size | Line Height | Font Weight | 用途 |
|------|-----------|-------------|-------------|------|
| **H1** | {XXpx / X.XXrem} | {X.XX} | {XXX / bold} | 页面主标题 |
| **H2** | {XXpx / X.XXrem} | {X.XX} | {XXX / semibold} | Section 标题 |
| **H3** | {XXpx / X.XXrem} | {X.XX} | {XXX / semibold} | 子标题 |
| **Body** | {XXpx / X.XXrem} | {X.XX} | {XXX / normal} | 默认正文 |
| **Caption** | {XXpx / X.XXrem} | {X.XX} | {XXX / normal} | 说明文字 |
| **Label** | {XXpx / X.XXrem} | {X.XX} | {XXX / medium} | 标签、按钮文本 |

**CSS Variables**:
```css
:root {
  --font-heading: "{Font Name}", sans-serif;
  --font-body: "{Font Name}", sans-serif;
  --font-mono: "Fira Code", monospace;

  --text-h1: {XXpx};
  --text-h2: {XXpx};
  --text-h3: {XXpx};
  --text-body: {XXpx};
  --text-caption: {XXpx};

  --leading-tight: {X.XX};
  --leading-normal: {X.XX};

  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### 响应式字体（Responsive Typography）

| 类型 | Desktop (≥1024px) | Mobile (<768px) |
|------|-------------------|-----------------|
| H1 | {XXpx} | {XXpx} |
| H2 | {XXpx} | {XXpx} |
| Body | {XXpx} | {XXpx} |

---

## 📐 Spacing System

### 基础单位（Base Unit）
```css
--spacing-base: {4px / 8px};
```

### 间距等级（Spacing Scale）

| 等级 | 值 | 使用场景 |
|------|-----|----------|
| 0 | 0px | 无间距 |
| 1 | {XXpx} | 极小间距（图标与文本） |
| 2 | {XXpx} | 小间距（按钮内部 padding） |
| 3 | {XXpx} | 默认间距（输入框 padding） |
| 4 | {XXpx} | 中等间距（卡片 padding） |
| 6 | {XXpx} | 大间距（组件之间） |
| 8 | {XXpx} | 布局间距 |
| 12 | {XXpx} | 超大间距 |

**CSS Variables**:
```css
:root {
  --spacing-0: 0;
  --spacing-1: {XXpx};
  --spacing-2: {XXpx};
  --spacing-3: {XXpx};
  --spacing-4: {XXpx};
  --spacing-6: {XXpx};
  --spacing-8: {XXpx};
  --spacing-12: {XXpx};

  /* 语义化别名 */
  --spacing-xs: var(--spacing-1);
  --spacing-sm: var(--spacing-2);
  --spacing-md: var(--spacing-3);
  --spacing-lg: var(--spacing-4);
  --spacing-xl: var(--spacing-6);
}
```

---

## 🧩 Component Styles

以下为核心组件的详细样式定义。

### Button

#### 基础样式
```css
.btn {
  font-family: var(--font-body);
  font-size: var(--text-label);
  font-weight: var(--font-medium);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  transition: all var(--duration-fast) var(--easing-ease-in-out);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
}
```

#### 变体（Variants）

**Primary**:
```css
.btn-primary {
  background-color: var(--color-primary);
  color: white;
}
.btn-primary:hover {
  background-color: var(--color-primary-hover);
}
.btn-primary:disabled {
  background-color: var(--color-gray-300);
  cursor: not-allowed;
}
```

**Outline**:
```css
.btn-outline {
  background-color: transparent;
  color: var(--color-primary);
  border-color: var(--color-primary);
}
.btn-outline:hover {
  background-color: var(--color-primary-50);
}
```

#### 尺寸（Sizes）

| 尺寸 | Padding | Font Size |
|------|---------|-----------|
| **sm** | var(--spacing-1) var(--spacing-3) | {XXpx} |
| **md** | var(--spacing-2) var(--spacing-4) | {XXpx} |
| **lg** | var(--spacing-3) var(--spacing-6) | {XXpx} |

---

### Input / Textarea

#### 基础样式
```css
.input {
  font-family: var(--font-body);
  font-size: var(--text-body);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-300);
  background-color: white;
  transition: all var(--duration-fast);
  width: 100%;
  outline: none;
}
.input:hover {
  border-color: var(--color-gray-400);
}
.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-50);
}
.input:disabled {
  background-color: var(--color-gray-100);
  cursor: not-allowed;
}
```

#### 状态（States）
- **Error**: `.input-error` - 红色边框 + 错误提示
- **Success**: `.input-success` - 绿色边框
- **Disabled**: `:disabled` - 灰色背景 + 禁用光标

---

### Card

```css
.card {
  background-color: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-normal);
}
.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

---

## 🌫️ Shadows & Elevation

| 等级 | CSS Variable | 使用场景 |
|------|--------------|----------|
| **sm** | `--shadow-sm: 0 1px 2px rgba(0,0,0,0.05)` | 卡片、按钮 |
| **md** | `--shadow-md: 0 4px 6px rgba(0,0,0,0.1)` | Hover 状态 |
| **lg** | `--shadow-lg: 0 10px 15px rgba(0,0,0,0.1)` | Modal、Dropdown |
| **xl** | `--shadow-xl: 0 20px 25px rgba(0,0,0,0.15)` | 浮层 |

---

## 🎬 Animations & Transitions

### 时长（Duration）
```css
:root {
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 350ms;
}
```

### 缓动函数（Easing）
```css
:root {
  --easing-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --easing-ease-in: cubic-bezier(0.4, 0, 1, 1);
}
```

### 常用动画
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
```

### 无障碍: 禁用动效
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## 🔲 Border Radius

| 等级 | 值 | 使用场景 |
|------|-----|----------|
| **sm** | {XXpx} | 小组件（Badge, Tag） |
| **md** | {XXpx} | 按钮、输入框 |
| **lg** | {XXpx} | 卡片、Modal |
| **full** | 9999px | 圆形按钮、Avatar |

```css
:root {
  --radius-sm: {XXpx};
  --radius-md: {XXpx};
  --radius-lg: {XXpx};
  --radius-full: 9999px;
}
```

---

## 📱 Responsive Design

### 断点（Breakpoints）
```css
/* Mobile: 320px-767px (默认) */
/* Tablet: 768px-1023px */
@media (min-width: 768px) { ... }
/* Desktop: 1024px+ */
@media (min-width: 1024px) { ... }
```

### 响应式策略
- **Mobile-First**: 默认样式为移动端，使用 `@media (min-width: ...)` 添加更大屏幕样式
- **核心原则**: 确保所有功能在移动端可用，桌面端提供增强体验

---

## ♿ Accessibility

### 色彩对比度（Color Contrast）
- ✅ 所有文本与背景的对比度 ≥ 4.5:1（WCAG AA）
- ✅ 大文本（18px+ 或 14px+ bold）对比度 ≥ 3:1
- ✅ UI 组件（按钮、输入框）对比度 ≥ 3:1

### 键盘导航（Keyboard Navigation）
- ✅ 所有交互元素可通过 Tab 键访问
- ✅ Focus 状态清晰可见
- ✅ 支持 Enter/Space 触发按钮和链接

### ARIA 属性（ARIA Attributes）
- ✅ 使用 `aria-label` 为无文本的图标按钮添加说明
- ✅ 使用 `aria-invalid` 和 `aria-describedby` 标记表单错误
- ✅ 使用 `aria-expanded` 标记可展开/折叠的组件

### Focus 状态设计
```css
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

---

## 🎯 Design Principles

### 1. 简洁性（Simplicity）
- 避免不必要的装饰和复杂性
- 每个组件专注于单一功能
- 使用留白营造呼吸感

### 2. 一致性（Consistency）
- 所有组件遵循统一的视觉语言
- 颜色、字体、间距、圆角使用一致的系统
- 交互行为保持一致

### 3. 可访问性（Accessibility）
- 色彩对比度符合 WCAG AA 标准
- 支持键盘导航
- 使用语义化 HTML 和 ARIA 属性

### 4. 响应式（Responsive）
- Mobile-First 设计
- 所有组件在不同屏幕尺寸下正常工作

---

## 📝 Usage Guidelines

### For Designers
1. 使用本指南中定义的 Design Tokens
2. 新组件设计前检查是否已有类似组件
3. 确保所有设计符合可访问性标准

### For Developers
1. 使用 CSS Variables 而非硬编码值
2. 遵循组件样式规范
3. 确保响应式实现正确

### For Product Managers
1. 新功能设计应符合现有设计系统
2. 特殊需求需与设计团队讨论

---

**Template Version**: 2.0.0 (Slimmed from 1266 lines to ~450 lines, -64%)
**Last Updated**: 2026-03-12
**Maintainer**: CC-DevFlow Team
**License**: MIT

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
