---
template_name: STYLE_TEMPLATE
version: 1.0.0
description: Template for generating project-level design style guide (STYLE.md)
last_updated: 2025-11-09 北京时间
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

例如：
> 我们的设计系统以"简洁、高效、可访问"为核心，追求极致的用户体验和开发者体验。所有组件遵循一致的视觉语言，确保产品的专业度和易用性。

### 适用范围
- ✅ 所有 Web 应用界面（Desktop, Tablet, Mobile）
- ✅ 所有前端组件库
- ✅ 所有 UI 原型设计
- ❌ 营销材料（使用独立的品牌指南）

### 更新历史
- **v1.0.0** (YYYY-MM-DD): 初始版本，建立核心设计系统
- **v1.1.0** (YYYY-MM-DD): 新增暗色模式支持
- (记录每次更新的版本号、日期、变更内容)

---

## 🎨 Color Palette

### 主色（Primary）
主色用于主要操作、品牌强调、关键 CTA 等。

| 等级 | Hex | RGB | HSL | 使用场景 |
|------|-----|-----|-----|----------|
| Primary 50 | {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | 主色浅背景 |
| Primary 100 | {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | Hover 状态 |
| Primary 500 | {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | 主色（默认） |
| Primary 600 | {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | Active 状态 |
| Primary 900 | {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | 主色深背景 |

**CSS Variables**:
```css
:root {
  --color-primary-50: {#XXXXXX};
  --color-primary-100: {#XXXXXX};
  --color-primary-500: {#XXXXXX};
  --color-primary-600: {#XXXXXX};
  --color-primary-900: {#XXXXXX};

  /* 语义化别名 */
  --color-primary: var(--color-primary-500);
  --color-primary-hover: var(--color-primary-600);
  --color-primary-active: var(--color-primary-700);
}
```

**Tailwind Config** (如适用):
```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '{#XXXXXX}',
          100: '{#XXXXXX}',
          500: '{#XXXXXX}',
          600: '{#XXXXXX}',
          900: '{#XXXXXX}',
          DEFAULT: '{#XXXXXX}', // primary-500
        },
      },
    },
  },
}
```

### 辅色（Secondary）
辅色用于次要操作、辅助信息、背景变化等。

| 等级 | Hex | RGB | HSL | 使用场景 |
|------|-----|-----|-----|----------|
| Secondary 50 | {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | 辅色浅背景 |
| Secondary 500 | {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | 辅色（默认） |
| Secondary 900 | {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | 辅色深背景 |

（CSS Variables 和 Tailwind Config 同上）

### 语义色（Semantic Colors）

#### 成功色（Success）
| Hex | RGB | HSL | 使用场景 |
|-----|-----|-----|----------|
| {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | 成功提示、完成状态、正向反馈 |

#### 警告色（Warning）
| Hex | RGB | HSL | 使用场景 |
|-----|-----|-----|----------|
| {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | 警告提示、需要注意的信息 |

#### 错误色（Error）
| Hex | RGB | HSL | 使用场景 |
|-----|-----|-----|----------|
| {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | 错误提示、失败状态、危险操作 |

#### 信息色（Info）
| Hex | RGB | HSL | 使用场景 |
|-----|-----|-----|----------|
| {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | 信息提示、帮助文本 |

### 中性色（Neutrals / Grayscale）
中性色用于文本、边框、背景、禁用状态等。

| 等级 | Hex | RGB | HSL | 使用场景 |
|------|-----|-----|-----|----------|
| Gray 50 | {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | 浅背景 |
| Gray 100 | {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | Hover 背景 |
| Gray 200 | {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | 边框、分隔线 |
| Gray 300 | {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | 禁用状态边框 |
| Gray 400 | {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | 占位符文本 |
| Gray 500 | {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | 次要文本 |
| Gray 600 | {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | 正文文本 |
| Gray 700 | {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | 标题文本 |
| Gray 800 | {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | 深色文本 |
| Gray 900 | {#XXXXXX} | rgb({R}, {G}, {B}) | hsl({H}, {S}%, {L}%) | 最深文本 |

### 色彩对比度（Accessibility）
所有颜色组合必须通过 **WCAG AA** 对比度测试：
- **正文文本（16px+）**: 对比度 ≥ 4.5:1
- **大文本（18px+ 或 14px+ bold）**: 对比度 ≥ 3:1
- **UI 组件**: 对比度 ≥ 3:1

**已验证的颜色组合**:
- ✅ Primary 500 on White: 对比度 {X.XX:1} (WCAG AA ✓)
- ✅ Gray 700 on White: 对比度 {X.XX:1} (WCAG AA ✓)
- (列出所有常用组合)

---

## ✍️ Typography

### 字体族（Font Families）

#### 标题字体（Headings）
```css
--font-heading: "{Font Name}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```
- **用途**: H1-H6, 页面标题, Section 标题
- **特点**: {简要描述字体特点，如：现代、易读、几何感}

#### 正文字体（Body）
```css
--font-body: "{Font Name}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```
- **用途**: 正文、段落、列表、标签
- **特点**: {简要描述字体特点，如：清晰、易读、舒适}

#### 代码字体（Monospace）
```css
--font-mono: "Fira Code", "Monaco", "Consolas", monospace;
```
- **用途**: 代码块、内联代码、技术信息
- **特点**: 等宽、支持连字（ligatures）

### 字阶系统（Type Scale）

| 类型 | Font Size | Line Height | Font Weight | Letter Spacing | 用途 |
|------|-----------|-------------|-------------|----------------|------|
| **H1** | {XXpx / X.XXrem} | {X.XX} | {XXX / bold} | {X.XXem} | 页面主标题 |
| **H2** | {XXpx / X.XXrem} | {X.XX} | {XXX / semibold} | {X.XXem} | Section 标题 |
| **H3** | {XXpx / X.XXrem} | {X.XX} | {XXX / semibold} | {X.XXem} | 子标题 |
| **H4** | {XXpx / X.XXrem} | {X.XX} | {XXX / medium} | {X.XXem} | 组件标题 |
| **H5** | {XXpx / X.XXrem} | {X.XX} | {XXX / medium} | {X.XXem} | 小标题 |
| **H6** | {XXpx / X.XXrem} | {X.XX} | {XXX / medium} | {X.XXem} | 最小标题 |
| **Body Large** | {XXpx / X.XXrem} | {X.XX} | {XXX / normal} | {X.XXem} | 重要正文 |
| **Body** | {XXpx / X.XXrem} | {X.XX} | {XXX / normal} | {X.XXem} | 默认正文 |
| **Body Small** | {XXpx / X.XXrem} | {X.XX} | {XXX / normal} | {X.XXem} | 次要正文 |
| **Caption** | {XXpx / X.XXrem} | {X.XX} | {XXX / normal} | {X.XXem} | 说明文字 |
| **Label** | {XXpx / X.XXrem} | {X.XX} | {XXX / medium} | {X.XXem} | 标签、按钮文本 |

**CSS Variables**:
```css
:root {
  /* Font Families */
  --font-heading: "{Font Name}", sans-serif;
  --font-body: "{Font Name}", sans-serif;
  --font-mono: "Fira Code", monospace;

  /* Font Sizes */
  --text-h1: {XXpx};
  --text-h2: {XXpx};
  --text-h3: {XXpx};
  --text-h4: {XXpx};
  --text-h5: {XXpx};
  --text-h6: {XXpx};
  --text-body-lg: {XXpx};
  --text-body: {XXpx};
  --text-body-sm: {XXpx};
  --text-caption: {XXpx};
  --text-label: {XXpx};

  /* Line Heights */
  --leading-tight: {X.XX};
  --leading-normal: {X.XX};
  --leading-relaxed: {X.XX};

  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### 响应式字体（Responsive Typography）

| 类型 | Desktop (≥1024px) | Tablet (768-1023px) | Mobile (<768px) |
|------|-------------------|---------------------|-----------------|
| H1 | {XXpx} | {XXpx} | {XXpx} |
| H2 | {XXpx} | {XXpx} | {XXpx} |
| Body | {XXpx} | {XXpx} | {XXpx} |

**响应式实现**:
```css
/* Mobile First */
h1 {
  font-size: {XXpx}; /* Mobile */
  line-height: {X.XX};
}

@media (min-width: 768px) {
  h1 {
    font-size: {XXpx}; /* Tablet */
  }
}

@media (min-width: 1024px) {
  h1 {
    font-size: {XXpx}; /* Desktop */
  }
}
```

### 字体组合规律
1. **标题 + 正文**: {Heading Font} + {Body Font}
2. **强调**: 使用 font-weight（不是颜色）来强调层级
3. **避免**: 同一视图中超过 3 种字体大小
4. **行高**: 标题使用紧凑行高（1.2-1.4），正文使用舒适行高（1.5-1.8）

---

## 📐 Spacing System

### 基础单位（Base Unit）
```css
--spacing-base: {4px / 8px / 16px};
```

### 间距等级（Spacing Scale）

| 等级 | 值 | rem | 使用场景 |
|------|-----|-----|----------|
| 0 | 0px | 0rem | 无间距 |
| 1 | {XXpx} | {X.XXrem} | 极小间距（图标与文本） |
| 2 | {XXpx} | {X.XXrem} | 小间距（按钮内部 padding） |
| 3 | {XXpx} | {X.XXrem} | 默认间距（输入框 padding） |
| 4 | {XXpx} | {X.XXrem} | 中等间距（卡片 padding） |
| 5 | {XXpx} | {X.XXrem} | 大间距（组件之间） |
| 6 | {XXpx} | {X.XXrem} | 更大间距（Section 之间） |
| 8 | {XXpx} | {X.XXrem} | 布局间距 |
| 10 | {XXpx} | {X.XXrem} | 页面级间距 |
| 12 | {XXpx} | {X.XXrem} | 超大间距 |

**CSS Variables**:
```css
:root {
  --spacing-0: 0;
  --spacing-1: {XXpx};
  --spacing-2: {XXpx};
  --spacing-3: {XXpx};
  --spacing-4: {XXpx};
  --spacing-5: {XXpx};
  --spacing-6: {XXpx};
  --spacing-8: {XXpx};
  --spacing-10: {XXpx};
  --spacing-12: {XXpx};

  /* 语义化别名 */
  --spacing-xs: var(--spacing-1);
  --spacing-sm: var(--spacing-2);
  --spacing-md: var(--spacing-3);
  --spacing-lg: var(--spacing-4);
  --spacing-xl: var(--spacing-6);
  --spacing-2xl: var(--spacing-8);
}
```

### 使用场景

#### 组件内部间距（Padding）
- **按钮**: padding: var(--spacing-2) var(--spacing-4);
- **输入框**: padding: var(--spacing-3) var(--spacing-4);
- **卡片**: padding: var(--spacing-4) var(--spacing-5);

#### 组件之间间距（Margin / Gap）
- **垂直间距**: margin-bottom: var(--spacing-4);
- **Grid gap**: gap: var(--spacing-4);
- **Flex gap**: gap: var(--spacing-3);

#### 布局间距（Layout）
- **Section 间距**: margin-bottom: var(--spacing-8);
- **页面 padding**: padding: var(--spacing-6) var(--spacing-4);

---

## 🧩 Component Styles

以下为核心组件的详细样式定义。每个组件包含：基础样式、变体、尺寸、状态。

### Button

#### 基础样式
```html
<button class="btn">Button</button>
```

```css
.btn {
  /* 字体 */
  font-family: var(--font-body);
  font-size: var(--text-label);
  font-weight: var(--font-medium);
  line-height: 1;

  /* 间距 */
  padding: var(--spacing-2) var(--spacing-4);

  /* 圆角 */
  border-radius: var(--radius-md);

  /* 边框 */
  border: 1px solid transparent;

  /* 过渡 */
  transition: all var(--duration-fast) var(--easing-ease-in-out);

  /* 其他 */
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.btn-primary:active {
  background-color: var(--color-primary-active);
}

.btn-primary:disabled {
  background-color: var(--color-gray-300);
  cursor: not-allowed;
}
```

**Secondary**:
```css
.btn-secondary {
  background-color: var(--color-secondary);
  color: white;
}
/* Hover, Active, Disabled 同上 */
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

**Ghost**:
```css
.btn-ghost {
  background-color: transparent;
  color: var(--color-gray-700);
}

.btn-ghost:hover {
  background-color: var(--color-gray-100);
}
```

#### 尺寸（Sizes）

| 尺寸 | Padding | Font Size | Height |
|------|---------|-----------|--------|
| **sm** | var(--spacing-1) var(--spacing-3) | {XXpx} | {XXpx} |
| **md** | var(--spacing-2) var(--spacing-4) | {XXpx} | {XXpx} |
| **lg** | var(--spacing-3) var(--spacing-6) | {XXpx} | {XXpx} |

```css
.btn-sm { padding: var(--spacing-1) var(--spacing-3); font-size: {XXpx}; }
.btn-md { padding: var(--spacing-2) var(--spacing-4); font-size: {XXpx}; }
.btn-lg { padding: var(--spacing-3) var(--spacing-6); font-size: {XXpx}; }
```

#### 完整示例
```html
<!-- Primary Button (Medium) -->
<button class="btn btn-primary btn-md">
  Primary Button
</button>

<!-- Outline Button (Large) -->
<button class="btn btn-outline btn-lg">
  Outline Button
</button>

<!-- Disabled Button -->
<button class="btn btn-primary btn-md" disabled>
  Disabled
</button>
```

---

### Input / Textarea

#### 基础样式
```html
<input type="text" class="input" placeholder="Enter text..." />
```

```css
.input {
  /* 字体 */
  font-family: var(--font-body);
  font-size: var(--text-body);
  line-height: 1.5;

  /* 间距 */
  padding: var(--spacing-3) var(--spacing-4);

  /* 圆角 */
  border-radius: var(--radius-md);

  /* 边框 */
  border: 1px solid var(--color-gray-300);

  /* 背景 */
  background-color: white;

  /* 过渡 */
  transition: all var(--duration-fast) var(--easing-ease-in-out);

  /* 其他 */
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

.input::placeholder {
  color: var(--color-gray-400);
}
```

#### 状态（States）

**Error**:
```css
.input-error {
  border-color: var(--color-error);
}

.input-error:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(var(--color-error-rgb), 0.1);
}
```

**Success**:
```css
.input-success {
  border-color: var(--color-success);
}
```

---

### Card

#### 基础样式
```html
<div class="card">
  <h3>Card Title</h3>
  <p>Card content goes here...</p>
</div>
```

```css
.card {
  /* 背景 */
  background-color: white;

  /* 间距 */
  padding: var(--spacing-4) var(--spacing-5);

  /* 圆角 */
  border-radius: var(--radius-lg);

  /* 阴影 */
  box-shadow: var(--shadow-md);

  /* 边框（可选） */
  border: 1px solid var(--color-gray-200);

  /* 过渡 */
  transition: all var(--duration-base) var(--easing-ease-in-out);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

---

### Modal / Dialog

（类似上述格式，包含基础样式、变体、状态、完整示例代码）

---

### Alert / Toast

（类似上述格式，包含基础样式、变体、状态、完整示例代码）

---

（继续其他核心组件：Badge, Avatar, Table, Navigation, Pagination, Tabs, Tooltip 等）

---

## 🌫️ Shadows & Elevation

### 阴影系统（Shadow Scale）

| 等级 | box-shadow 值 | 使用场景 |
|------|----------------|----------|
| **None** | none | 平面元素（按钮、输入框默认状态） |
| **XS** | 0 1px 2px 0 rgba(0, 0, 0, 0.05) | 轻微层级（边框替代） |
| **SM** | 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) | 小卡片、下拉菜单 |
| **MD** | 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) | 卡片默认状态 |
| **LG** | 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) | 卡片 Hover 状态 |
| **XL** | 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) | Modal、Popup |
| **2XL** | 0 25px 50px -12px rgba(0, 0, 0, 0.25) | 最高层级（全屏 Modal） |

**CSS Variables**:
```css
:root {
  --shadow-none: none;
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

### 层级指南（Elevation Guide）
1. **Level 0**: 页面背景、平面元素
2. **Level 1**: 卡片、按钮
3. **Level 2**: Hover 状态
4. **Level 3**: Dropdown、Tooltip
5. **Level 4**: Modal、Drawer
6. **Level 5**: 全屏 Overlay

---

## 🎬 Animations & Transitions

### 过渡时长（Duration）

| 名称 | 值 | 使用场景 |
|------|-----|----------|
| **Fast** | {XXXms} | Hover 效果、按钮点击 |
| **Base** | {XXXms} | 默认过渡、卡片展开 |
| **Slow** | {XXXms} | Modal 打开、页面切换 |

```css
:root {
  --duration-fast: {XXXms};
  --duration-base: {XXXms};
  --duration-slow: {XXXms};
}
```

### 缓动函数（Easing）

| 名称 | cubic-bezier 值 | 使用场景 |
|------|----------------|----------|
| **Ease-in** | cubic-bezier(0.4, 0, 1, 1) | 元素退出 |
| **Ease-out** | cubic-bezier(0, 0, 0.2, 1) | 元素进入 |
| **Ease-in-out** | cubic-bezier(0.4, 0, 0.2, 1) | 通用过渡 |

```css
:root {
  --easing-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --easing-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --easing-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 常用动画（Keyframes）

#### Fade In
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn var(--duration-base) var(--easing-ease-out);
}
```

#### Slide Up
```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-up {
  animation: slideUp var(--duration-base) var(--easing-ease-out);
}
```

#### Scale
```css
@keyframes scale {
  from { transform: scale(0.95); }
  to { transform: scale(1); }
}

.scale-in {
  animation: scale var(--duration-fast) var(--easing-ease-out);
}
```

---

## 🔲 Border Radius

### 圆角系统（Radius Scale）

| 等级 | 值 | 使用场景 |
|------|-----|----------|
| **None** | 0px | 方形元素（Table, 严肃场景） |
| **SM** | {XXpx} | 按钮、输入框 |
| **Base** | {XXpx} | 默认圆角 |
| **MD** | {XXpx} | 卡片 |
| **LG** | {XXpx} | Modal |
| **XL** | {XXpx} | 特殊卡片 |
| **Full** | 9999px | 圆形（Avatar, Badge） |

```css
:root {
  --radius-none: 0;
  --radius-sm: {XXpx};
  --radius-base: {XXpx};
  --radius-md: {XXpx};
  --radius-lg: {XXpx};
  --radius-xl: {XXpx};
  --radius-full: 9999px;
}
```

---

## 🌟 Opacity & Transparency

### 透明度等级

| 等级 | 值 | 使用场景 |
|------|-----|----------|
| **0** | 0 | 完全透明（隐藏元素） |
| **10** | 0.1 | 极浅遮罩 |
| **25** | 0.25 | 浅遮罩 |
| **50** | 0.5 | 半透明（Overlay） |
| **75** | 0.75 | 轻微透明 |
| **90** | 0.9 | 几乎不透明 |
| **100** | 1 | 完全不透明 |

```css
:root {
  --opacity-0: 0;
  --opacity-10: 0.1;
  --opacity-25: 0.25;
  --opacity-50: 0.5;
  --opacity-75: 0.75;
  --opacity-90: 0.9;
  --opacity-100: 1;
}
```

### 使用场景
- **Disabled 状态**: opacity: var(--opacity-50);
- **Overlay**: background-color: rgba(0, 0, 0, var(--opacity-50));
- **Hover 效果**: opacity: var(--opacity-90);

---

## 🎨 Common Tailwind CSS Usage

（仅当项目使用 Tailwind CSS 时包含此部分）

### 常用 Utility Classes 组合

#### Button
```html
<button class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors duration-200">
  Primary Button
</button>
```

#### Card
```html
<div class="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
  Card content
</div>
```

#### Input
```html
<input
  type="text"
  class="px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
  placeholder="Enter text..."
/>
```

### 自定义 Tailwind 配置
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '{#XXXXXX}',
          500: '{#XXXXXX}',
          600: '{#XXXXXX}',
          // ...
        },
      },
      spacing: {
        // Custom spacing values
      },
      borderRadius: {
        // Custom border radius values
      },
      boxShadow: {
        // Custom shadows
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}
```

---

## 📦 Example Component Reference Design Code

以下是 3 个完整的组件实现示例，可直接复用。

### Example 1: Primary Button with Icon

```html
<button class="btn btn-primary btn-md">
  <svg class="icon" width="16" height="16" fill="currentColor">
    <path d="M12 5l-8 8M4 5l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>
  Button with Icon
</button>
```

```css
.btn {
  /* 字体 */
  font-family: var(--font-body);
  font-size: var(--text-label);
  font-weight: var(--font-medium);
  line-height: 1;

  /* 间距 */
  padding: var(--spacing-2) var(--spacing-4);

  /* 圆角 */
  border-radius: var(--radius-md);

  /* 边框 */
  border: 1px solid transparent;

  /* 过渡 */
  transition: all var(--duration-fast) var(--easing-ease-in-out);

  /* 布局 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  cursor: pointer;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn .icon {
  width: 16px;
  height: 16px;
}
```

**设计决策**:
- 使用 `inline-flex` 和 `gap` 确保图标与文本间距一致
- Hover 使用颜色变化，Active 使用微妙的 scale 效果
- 图标尺寸固定为 16px，确保视觉平衡

---

### Example 2: Card with Hover Effect

```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
    <span class="badge">New</span>
  </div>
  <div class="card-body">
    <p class="card-description">
      This is a card component with hover effect. Hover to see the shadow and transform animation.
    </p>
  </div>
  <div class="card-footer">
    <button class="btn btn-outline btn-sm">Learn More</button>
  </div>
</div>
```

```css
.card {
  /* 背景 */
  background-color: white;

  /* 间距 */
  padding: 0;

  /* 圆角 */
  border-radius: var(--radius-lg);

  /* 阴影 */
  box-shadow: var(--shadow-md);

  /* 边框 */
  border: 1px solid var(--color-gray-200);

  /* 过渡 */
  transition: all var(--duration-base) var(--easing-ease-in-out);

  /* 其他 */
  overflow: hidden;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4) var(--spacing-5);
  border-bottom: 1px solid var(--color-gray-200);
}

.card-title {
  font-size: var(--text-h4);
  font-weight: var(--font-semibold);
  margin: 0;
}

.badge {
  padding: var(--spacing-1) var(--spacing-2);
  background-color: var(--color-primary-50);
  color: var(--color-primary);
  font-size: var(--text-caption);
  font-weight: var(--font-medium);
  border-radius: var(--radius-full);
}

.card-body {
  padding: var(--spacing-4) var(--spacing-5);
}

.card-description {
  color: var(--color-gray-600);
  line-height: 1.6;
  margin: 0;
}

.card-footer {
  padding: var(--spacing-4) var(--spacing-5);
  border-top: 1px solid var(--color-gray-200);
}
```

**设计决策**:
- Card 分为 Header, Body, Footer 三个区域，使用 border 分隔
- Hover 效果结合阴影和位移，营造层级感
- Badge 使用主色的浅色背景，确保视觉一致性

---

### Example 3: Form Input with Error State

```html
<div class="form-group">
  <label for="email" class="form-label">Email Address</label>
  <input
    type="email"
    id="email"
    class="input input-error"
    placeholder="you@example.com"
    aria-invalid="true"
    aria-describedby="email-error"
  />
  <p id="email-error" class="form-error">Please enter a valid email address.</p>
</div>
```

```css
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-label {
  font-size: var(--text-label);
  font-weight: var(--font-medium);
  color: var(--color-gray-700);
}

.input {
  /* 字体 */
  font-family: var(--font-body);
  font-size: var(--text-body);
  line-height: 1.5;

  /* 间距 */
  padding: var(--spacing-3) var(--spacing-4);

  /* 圆角 */
  border-radius: var(--radius-md);

  /* 边框 */
  border: 1px solid var(--color-gray-300);

  /* 背景 */
  background-color: white;

  /* 过渡 */
  transition: all var(--duration-fast) var(--easing-ease-in-out);

  /* 其他 */
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

.input-error {
  border-color: var(--color-error);
}

.input-error:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1); /* Error color with opacity */
}

.form-error {
  font-size: var(--text-caption);
  color: var(--color-error);
  margin: 0;
}
```

**设计决策**:
- 使用 `flex-direction: column` 和 `gap` 确保标签、输入框、错误信息的间距一致
- Error 状态使用红色边框和 box-shadow，视觉明确
- 使用 ARIA 属性确保可访问性（`aria-invalid`, `aria-describedby`）

---

## 📱 Responsive Design

### 断点定义（Breakpoints）

| 名称 | 最小宽度 | 目标设备 |
|------|----------|----------|
| **Mobile** | 0px | 手机（<768px） |
| **Tablet** | 768px | 平板（768-1023px） |
| **Desktop** | 1024px | 桌面（1024-1439px） |
| **Wide** | 1440px | 宽屏（≥1440px） |

```css
:root {
  --breakpoint-mobile: 0px;
  --breakpoint-tablet: 768px;
  --breakpoint-desktop: 1024px;
  --breakpoint-wide: 1440px;
}
```

### 响应式策略
- **Mobile-First**: 默认样式为移动端，使用 `@media (min-width: ...)` 添加更大屏幕样式
- **核心原则**: 确保所有功能在移动端可用，桌面端提供增强体验

### 响应式组件示例

#### Grid Layout
```css
.grid {
  display: grid;
  gap: var(--spacing-4);
  grid-template-columns: 1fr; /* Mobile: 1 column */
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr); /* Tablet: 2 columns */
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr); /* Desktop: 3 columns */
  }
}
```

---

## ♿ Accessibility

### 色彩对比度（Color Contrast）
- ✅ 所有文本与背景的对比度 ≥ 4.5:1（WCAG AA）
- ✅ 大文本（18px+ 或 14px+ bold）对比度 ≥ 3:1
- ✅ UI 组件（按钮、输入框）对比度 ≥ 3:1

### 键盘导航（Keyboard Navigation）
- ✅ 所有交互元素可通过 Tab 键访问
- ✅ Focus 状态清晰可见（使用 box-shadow 或 outline）
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

/* 或使用 box-shadow */
.btn:focus-visible {
  box-shadow: 0 0 0 3px var(--color-primary-50);
}
```

---

## 🖼️ Assets

（如适用）

### Icon 系统
- **Icon Library**: {Heroicons / Feather / Lucide / Material Icons}
- **尺寸**: 16px (sm), 20px (md), 24px (lg)
- **颜色**: 使用 `currentColor` 继承文本颜色

### Image 规范
- **格式**: WebP（现代浏览器）, PNG/JPG（Fallback）
- **压缩**: TinyPNG, ImageOptim
- **尺寸**: 根据显示尺寸提供 1x, 2x, 3x 版本

### Logo 使用规范
- **主 Logo**: 用于导航栏、页脚
- **简化 Logo**: 用于 Favicon, Mobile App Icon
- **最小尺寸**: 不小于 24px（确保可识别）

---

## 🎯 Design Principles

### 1. 简洁性（Simplicity）
- 避免不必要的装饰和复杂性
- 每个组件专注于单一功能
- 使用留白营造呼吸感

### 2. 一致性（Consistency）
- 所有组件遵循统一的视觉语言
- 颜色、字体、间距、圆角使用一致的系统
- 交互行为保持一致（如 Hover, Focus 效果）

### 3. 可访问性（Accessibility）
- 色彩对比度符合 WCAG AA 标准
- 支持键盘导航
- 使用语义化 HTML 和 ARIA 属性

### 4. 响应式（Responsive）
- Mobile-First 设计
- 所有组件在所有设备上可用
- 根据屏幕尺寸优化布局和字体

### 5. 性能优先（Performance）
- 优化资源加载（图片压缩、字体子集化）
- 避免过度使用动画和阴影
- 使用 CSS Variables 减少重复代码

---

## 📝 Usage Guidelines

### 如何使用本指南

1. **开发新组件时**:
   - 查阅对应组件的样式定义
   - 复制示例代码并根据需求调整
   - 确保遵循颜色、字体、间距系统

2. **修改现有组件时**:
   - 检查是否符合本指南的定义
   - 如有偏差,优先修正为符合指南的样式
   - 如需新增变体,确保与现有变体一致

3. **生成 UI 原型时**:
   - `/flow:spec` 阶段会自动引用本指南
   - 确保原型中的所有样式符合本指南

4. **前端开发时**:
   - `/flow:dev` 命令会自动引用本指南
   - 所有组件实现必须遵循本指南的样式定义

### 更新本指南

- **何时更新**: 新增组件、调整设计系统、发现不一致
- **如何更新**: 使用 `/core-style --update` 命令
- **版本控制**: 每次更新增加版本号，记录变更内容

---

## 🔗 Related Resources

- **项目 Roadmap**: `devflow/ROADMAP.md`
- **UI 原型**: `devflow/requirements/{REQ_ID}/UI_PROTOTYPE.html`
- **组件实现**: `src/components/`
- **Tailwind Config**: `tailwind.config.js`

---

## 📄 License & Credits

（如适用）

- **设计系统**: {Project Name} Design System
- **设计师**: {Designer Name}
- **开发者**: {Developer Name}
- **灵感来源**: {Design References, e.g., Tailwind UI, Material Design}

---

**最后更新**: {YYYY-MM-DD 北京时间}
**版本**: {Version}

---
