---
title: UI Prototype Template
description: Self-executable template for generating interactive HTML prototypes from PRD
version: 1.0.0
created: 2025-01-10
updated: 2025-01-10
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
```markdown
1.1 读取PRD.md文档
    → 使用 check-prerequisites.sh 获取文件路径

1.2 提取关键信息:
    - 目标用户画像(从"背景与目标"章节)
    - 核心功能列表(从"用户故事"章节)
    - 关键任务流程(从"验收标准"章节)
    - UI相关的非功能需求(性能/可访问性/响应式)

1.3 识别页面类型:
    - 认证页面(登录/注册/重置密码)
    - 仪表盘/主界面
    - 列表/表格页面
    - 详情/编辑页面
    - 表单/创建页面
    - 设置/配置页面

1.4 构建信息架构草图:
    页面层级
      └─ 导航结构
         └─ 核心交互路径

1.5 输出产品分析报告(存储为变量,稍后写入HTML注释):
    """
    ## Product Analysis
    - Target Users: {用户画像}
    - Core Features: {功能列表}
    - Page Types: {页面类型}
    - Critical Flows: {关键流程}
    """
```

**验证点**:
- [x] 至少识别出3个核心功能
- [x] 明确定义了主要用户角色
- [x] 识别出至少2个关键任务流程

---

### Phase 2: Design Inspiration Sampling (设计灵感采样)

**目标**: 从80+位艺术家/设计师/建筑师中随机采样2位,生成风格转译说明

**输入**: 灵感来源池(见下方)
**输出**: 设计灵感报告(2位大师+转译说明)

**执行步骤**:
```markdown
2.1 随机采样策略:
    - 从不同类别中选择(避免风格过于相似)
    - 优先组合: 现代主义 + 生成艺术, 建筑 + 平面设计
    - 避免组合: 同类别内的大师(如两位都是建筑师)

2.2 为每位大师生成转译说明:
    模板:
    """
    **灵感来源X**: {艺术家姓名} ({类别})
    **核心特质**: {艺术家代表性特点,1-2句话}
    **网页转译**:
      - 色彩: {具体色值} → {应用场景}
      - 版式: {布局策略} → {CSS实现方式}
      - 形态: {视觉元素} → {HTML/CSS实现}
      - 动效: {动态特征} → {CSS/JS实现}
    **禁止模仿**: 不复刻{具体作品名称}的{具体元素}
    """

2.3 生成设计关键词:
    从转译说明中提取3-5个关键设计方向
    示例: ["网格秩序", "高对比撞色", "曲线切割", "200ms过渡动效"]

2.4 定义配色方案基调:
    根据灵感来源确定主色调
    避免: #6B46C1(常见AI紫), #3B82F6(常见AI蓝)
    推荐: 基于大师作品的特征色,但调整明度/饱和度

2.5 输出设计灵感报告(存储为变量):
    包含2位大师的完整转译说明
```

**灵感来源池** (80+ Masters):

#### 类别1: 影视片头 / 动态叙事
Saul Bass, Maurice Binder, Pablo Ferro, Dan Perri, Kyle Cooper

#### 类别2: 平面 / 字体 / 后现代图形
Paula Scher, Neville Brody, April Greiman, David Carson, Jamie Reid, Push Pin Studios (Seymour Chwast)

#### 类别3: 现代主义信息设计 / 网格系统
Massimo Vignelli, Josef Müller-Brockmann, Otl Aicher, Armin Hofmann, Karl Gerstner, Muriel Cooper

#### 类别4: 几何与抽象艺术 / 光学艺术
Piet Mondrian, Sonia Delaunay, Josef Albers, Victor Vasarely, Bridget Riley, M. C. Escher, Paul Klee, Kazimir Malevich, Joan Miró, Henri Matisse, Mark Rothko, René Magritte, Salvador Dalí

#### 类别5: 亚洲与当代艺术
Yayoi Kusama, Takashi Murakami, Katsushika Hokusai(葛饰北斋), Xu Bing(徐冰), Zao Wou-Ki(赵无极)

#### 类别6: 生成艺术 / 新媒体
John Maeda, Casey Reas, Zach Lieberman, Vera Molnár, Manfred Mohr, Refik Anadol, Sougwen Chung

#### 类别7: 建筑 / 空间形态
Zaha Hadid, Bjarke Ingels (BIG), Thomas Heatherwick, Olafur Eliasson, Le Corbusier, Ludwig Mies van der Rohe, Frank Lloyd Wright, Alvar Aalto, Louis Kahn, Norman Foster, Renzo Piano, Herzog & de Meuron, OMA/Rem Koolhaas, Tadao Ando(安藤忠雄), SANAA(Sejima & Nishizawa), Kengo Kuma(隈研吾), Kenzo Tange(丹下健三), Lina Bo Bardi, Luis Barragán

#### 类别8: 工业 / 硬件设备设计
Dieter Rams(Braun), Jony Ive(Apple), Naoto Fukasawa(无印良品), Jasper Morrison, Marc Newson, Yves Béhar, Hartmut Esslinger(frog), Raymond Loewy, Richard Sapper(ThinkPad), Charles & Ray Eames, Sori Yanagi, Kenji Ekuan(龟甲万壶/新干线), Nendo(Oki Sato), Philippe Starck, F. A. Porsche, James Dyson, Teenage Engineering, Susan Kare(界面图标语义)

**验证点**:
- [x] 采样了2位来自不同类别的大师
- [x] 每位大师都有明确的转译说明(色彩/版式/形态/动效)
- [x] 明确了禁止模仿的具体作品/元素
- [x] 生成了配色方案基调(非常见AI紫/蓝)

---

### Phase 3: Design System Definition (设计系统定义)

**目标**: 基于设计灵感,定义完整的设计系统(色彩/字体/栅格/间距/组件)

**输入**: Phase 2的设计灵感报告
**输出**: Design Tokens (CSS变量形式)

**执行步骤**:
```markdown
3.1 色彩系统 (Color Palette):
    基于Phase 2的配色基调,定义:
    - 主色 (Primary): 1个主色 + 3个深浅变体
    - 辅色 (Secondary): 1-2个辅色 + 变体
    - 中性色 (Neutral): 灰度7-9级(50/100/200/.../900)
    - 状态色 (Semantic): 成功/警告/错误/信息(各3个变体)
    - 表面色 (Surface): 背景/卡片/浮层

    示例:
    --primary-500: #0066CC;
    --primary-600: #0052A3;
    --primary-400: #3385D6;

    ⚠️ 禁止使用:
    - 纯黑 #000000
    - 纯白 #FFFFFF
    - 常见AI紫 #6B46C1
    - 常见AI蓝 #3B82F6

3.2 字体系统 (Typography):
    - 字体栈: 优先Google Fonts,备用系统字体
    - 中英文混排: 英文字体 + 中文备用(思源黑体/苹方)
    - 字号系统: 6-8级 (12/14/16/18/20/24/32/48px)
    - 字重: 400 Regular, 500 Medium, 600 Semi-Bold, 700 Bold
    - 行高: 标题1.2-1.3, 正文1.5-1.6, 小字1.4

    示例:
    --font-base: 'Inter', 'Noto Sans SC', system-ui, sans-serif;
    --font-size-base: 16px;
    --font-size-lg: 18px;
    --line-height-base: 1.5;

3.3 间距系统 (Spacing):
    基于8px栅格或4px栅格
    - 基础单位: 4px或8px
    - 间距级别: 1/2/3/4/6/8/12/16/24/32/48/64

    示例:
    --space-1: 0.25rem; /* 4px */
    --space-2: 0.5rem;  /* 8px */
    --space-4: 1rem;    /* 16px */
    --space-8: 2rem;    /* 32px */

3.4 栅格系统 (Grid):
    - 容器最大宽度: 1200px或1280px
    - 列数: 12列
    - 间距: 16px或24px
    - 响应式断点:
      * Mobile: 320px-767px
      * Tablet: 768px-1023px
      * Desktop: 1024px+

3.5 圆角与阴影 (Border Radius & Shadow):
    - 圆角: 4px/8px/12px/16px/9999px(圆形)
    - 阴影层级: 3-4级(小/中/大/超大)

    示例:
    --radius-sm: 4px;
    --radius-md: 8px;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.1);

3.6 动效系统 (Animation):
    - 过渡时长: 150ms/200ms/300ms
    - 缓动函数: ease/ease-in-out/cubic-bezier
    - 支持 prefers-reduced-motion 静态回退

    示例:
    --transition-fast: 150ms ease;
    --transition-base: 200ms ease;
    --easing-smooth: cubic-bezier(0.4, 0, 0.2, 1);

3.7 输出Design Tokens:
    将上述系统整理为CSS :root 变量
    准备稍后嵌入HTML <style> 标签
```

**验证点**:
- [x] 色彩系统包含至少8个色值(主/辅/中性/状态)
- [x] 字体系统支持中英文混排
- [x] 间距系统基于统一基准(4px或8px)
- [x] 定义了响应式断点(至少3个)
- [x] 动效支持无障碍(prefers-reduced-motion)

---

### Phase 4: Information Architecture (信息架构设计)

**目标**: 根据PRD用户故事,规划页面结构和导航体系

**输入**: Phase 1的产品分析报告
**输出**: 站点地图 + 导航结构

**执行步骤**:
```markdown
4.1 站点地图 (Sitemap):
    根据PRD用户故事列出所有页面:

    示例:
    /                       (首页/仪表盘)
    /auth/login             (登录)
    /auth/register          (注册)
    /orders                 (订单列表)
    /orders/:id             (订单详情)
    /orders/create          (创建订单)
    /profile                (用户资料)
    /settings               (设置)

4.2 导航结构:
    - 主导航 (Primary Nav): 顶部导航栏,3-7个主菜单
    - 次级导航 (Secondary Nav): 侧边栏或标签页
    - 面包屑 (Breadcrumb): 用于深层页面

    示例:
    主导航:
      - 首页
      - 订单管理
      - 数据报表
      - 系统设置

4.3 用户流程图:
    为每个核心用户故事绘制流程:

    示例:
    创建订单流程:
      订单列表页 → 点击"新建" → 填写表单 → 预览确认 → 提交成功 → 跳转详情

4.4 页面优先级:
    - P0: 必须实现的核心页面(登录/主界面/核心功能)
    - P1: 重要但非关键的页面
    - P2: 辅助功能页面

4.5 输出站点地图文档:
    存储为变量,稍后嵌入HTML注释
```

**验证点**:
- [x] 站点地图覆盖所有PRD用户故事
- [x] 主导航菜单数量合理(3-7个)
- [x] 至少1个核心用户流程被完整定义

---

### Phase 5: Component Inventory (组件清单生成)

**目标**: 根据页面需求,列出所有需要的UI组件及其状态

**输入**: Phase 4的站点地图
**输出**: 组件清单 + 状态定义

**执行步骤**:
```markdown
5.1 基础组件 (Atoms):
    - Button (按钮): 主按钮/次要按钮/文本按钮/图标按钮
    - Input (输入框): 文本/数字/密码/搜索/多行文本
    - Checkbox (复选框)
    - Radio (单选框)
    - Select (下拉选择)
    - Switch (开关)
    - Icon (图标): 使用Lucide或Heroicons

5.2 组合组件 (Molecules):
    - Form Field (表单字段): Label + Input + Error Message
    - Search Bar (搜索栏): Input + Icon + Button
    - Card (卡片): Header + Body + Footer
    - List Item (列表项): Avatar + Title + Subtitle + Action
    - Pagination (分页器)
    - Breadcrumb (面包屑)

5.3 复杂组件 (Organisms):
    - Navigation Bar (导航栏): Logo + Menu + User Avatar
    - Sidebar (侧边栏): Menu + Collapse
    - Table (表格): Header + Rows + Pagination + Actions
    - Modal (模态框): Overlay + Content + Close
    - Toast (通知提示)
    - Dropdown Menu (下拉菜单)

5.4 状态定义 (States):
    为每个交互组件定义状态:
    - Default (默认)
    - Hover (悬停)
    - Active (激活)
    - Focus (聚焦)
    - Disabled (禁用)
    - Error (错误)
    - Loading (加载中)
    - Empty (空状态)

5.5 输出组件清单:
    组织为表格形式,包含:
    组件名称 | 类型 | 状态列表 | 使用页面

    示例:
    | Button | Atom | default, hover, active, disabled | 所有页面 |
    | Modal  | Organism | default, open, closing | 订单创建,设置 |

5.6 确定图标库:
    选择 Lucide Icons 或 Heroicons 或 Tabler Icons
    记录CDN链接,稍后嵌入HTML
```

**验证点**:
- [x] 至少定义了10个基础组件
- [x] 所有交互组件都定义了至少3种状态
- [x] 选定了图标库并记录了CDN链接
- [x] 组件清单与PRD用户故事对齐

---

### Phase 6: HTML Structure (HTML结构编写)

**目标**: 编写语义化的HTML5结构,包含所有页面内容

**输入**: Phase 4的站点地图 + Phase 5的组件清单
**输出**: 完整的HTML结构(无样式)

**执行步骤**:
```markdown
6.1 HTML文档结构:
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <title>{需求标题} - 原型</title>

        <!-- 设计系统元数据 (来自Phase 1/2/3) -->
        <!--
        Generated: {ISO 8601 timestamp}
        REQ-ID: {REQ_ID}
        Design Inspirations: {Phase 2输出}
        Product Analysis: {Phase 1输出}
        -->

        <!-- CDN资源: Google Fonts + 图标库 -->
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <script src="https://unpkg.com/lucide@latest"></script>

        <style>
            /* Phase 7 将在这里填充CSS */
        </style>
    </head>
    <body>
        <!-- Phase 6 将在这里填充HTML -->
    </body>
    </html>

6.2 语义化标签:
    使用HTML5语义标签:
    - <header> - 页面头部/导航
    - <nav> - 导航菜单
    - <main> - 主要内容区
    - <section> - 内容分段
    - <article> - 独立内容单元
    - <aside> - 侧边栏/辅助信息
    - <footer> - 页面底部

6.3 可访问性 (Accessibility):
    - ARIA标签: aria-label, aria-labelledby, aria-describedby
    - 键盘导航: tabindex属性
    - 语义化按钮: <button> 而非 <div onclick>
    - 表单标签: <label for="input-id">

6.4 多页面处理策略:
    选项A: 单页应用(SPA)风格
      - 所有页面作为<section>嵌入同一HTML
      - 使用CSS显示/隐藏切换页面 (.page-active)
      - JavaScript路由模拟

    选项B: 选择1个核心页面深度实现
      - 如果页面过多(>5个),选择最重要的1个页面
      - 其他页面用简化卡片展示

    推荐: 选项A (SPA风格)

6.5 页面结构示例:
    <body>
        <!-- Global Header -->
        <header class="header">
            <nav class="nav-primary">
                <div class="nav-logo">{Logo}</div>
                <ul class="nav-menu">
                    <li><a href="#home">首页</a></li>
                    <li><a href="#orders">订单</a></li>
                </ul>
                <div class="nav-user">{User Avatar}</div>
            </nav>
        </header>

        <!-- Main Content Area -->
        <main class="main">
            <!-- Page 1: Dashboard -->
            <section id="page-dashboard" class="page page-active">
                <h1>仪表盘</h1>
                <!-- Dashboard content -->
            </section>

            <!-- Page 2: Orders List -->
            <section id="page-orders" class="page">
                <h1>订单列表</h1>
                <div class="table-container">
                    <table><!-- Table rows --></table>
                </div>
            </section>

            <!-- More pages... -->
        </main>

        <!-- Global Footer -->
        <footer class="footer">
            <p>&copy; 2025 {Project Name}</p>
        </footer>

        <script>
            /* Phase 8 将在这里填充JavaScript */
        </script>
    </body>

6.6 内容填充:
    - 使用真实的业务场景内容(来自PRD)
    - 图片使用Picsum: https://picsum.photos/id/{id}/{width}/{height}
    - 数据使用模拟真实数据(如订单编号/用户名/日期)
    - 禁止使用Lorem Ipsum占位文本

6.7 组件实例化:
    根据Phase 5的组件清单,在HTML中实例化所有组件
    确保每个状态都有对应的HTML示例(可用CSS类名切换)
```

**验证点**:
- [x] 使用HTML5语义化标签
- [x] 包含ARIA标签和可访问性属性
- [x] 所有图片使用Picsum真实资源
- [x] 无Lorem Ipsum占位文本
- [x] 至少2个完整页面被实现

---

### Phase 7: CSS Styling (CSS样式实现)

**目标**: 基于Phase 3的设计系统,编写完整的CSS样式

**输入**: Phase 6的HTML结构 + Phase 3的Design Tokens
**输出**: 完整的CSS样式(嵌入<style>标签)

**执行步骤**:
```markdown
7.1 CSS架构:
    组织为以下模块:
    1. Design System (CSS变量)
    2. Reset & Base Styles
    3. Layout (Grid/Flexbox)
    4. Components (按Phase 5组件清单)
    5. Pages (页面特定样式)
    6. Utilities (工具类)
    7. Responsive (媒体查询)
    8. Animations (动效)
    9. Dark Mode (可选)

7.2 Design System (CSS Variables):
    将Phase 3的Design Tokens写入:root

    :root {
        /* Colors */
        --primary-500: #0066CC;
        --neutral-50: #F9FAFB;

        /* Typography */
        --font-base: 'Inter', system-ui, sans-serif;
        --font-size-base: 16px;

        /* Spacing */
        --space-2: 0.5rem;
        --space-4: 1rem;

        /* Transitions */
        --transition-fast: 200ms ease;
    }

7.3 Reset & Base Styles:
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
        font-family: var(--font-base);
        font-size: var(--font-size-base);
        line-height: 1.5;
        color: var(--neutral-900);
        background: var(--neutral-50);
    }

7.4 Layout System:
    使用Flexbox或Grid实现响应式布局

    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 var(--space-4);
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: var(--space-4);
    }

7.5 Component Styles:
    为Phase 5的每个组件编写样式,包含所有状态

    示例:
    .btn {
        display: inline-flex;
        padding: var(--space-2) var(--space-4);
        border: none;
        border-radius: var(--radius-md);
        background: var(--primary-500);
        color: white;
        cursor: pointer;
        transition: all var(--transition-fast);
    }
    .btn:hover {
        background: var(--primary-600);
        transform: translateY(-2px);
    }
    .btn:active {
        transform: translateY(0);
    }
    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

7.6 Page-Specific Styles:
    为每个页面编写特定样式

    .page {
        display: none; /* 默认隐藏 */
    }
    .page-active {
        display: block; /* 激活页面显示 */
    }

7.7 Responsive Design:
    使用媒体查询实现三断点响应式

    /* Mobile: 320px-767px (默认) */
    .nav-menu {
        flex-direction: column;
    }

    /* Tablet: 768px-1023px */
    @media (min-width: 768px) {
        .nav-menu {
            flex-direction: row;
        }
    }

    /* Desktop: 1024px+ */
    @media (min-width: 1024px) {
        .container {
            max-width: 1200px;
        }
    }

7.8 Animations:
    基于Phase 2的设计灵感添加动效

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .card {
        animation: fadeIn var(--transition-base);
    }

    /* 无障碍: 禁用动效 */
    @media (prefers-reduced-motion: reduce) {
        * {
            animation: none !important;
            transition: none !important;
        }
    }

7.9 Dark Mode (可选):
    @media (prefers-color-scheme: dark) {
        :root {
            --neutral-50: #111827;
            --neutral-900: #F9FAFB;
        }
    }

7.10 Utilities:
    .text-center { text-align: center; }
    .mt-4 { margin-top: var(--space-4); }
    .hidden { display: none; }
```

**验证点**:
- [x] 使用CSS变量实现Design System
- [x] 所有组件都有完整的状态样式
- [x] 响应式布局在三种断点正常显示
- [x] 动效时长在150-300ms之间
- [x] 支持prefers-reduced-motion

---

### Phase 8: JavaScript Interactions (JavaScript交互实现)

**目标**: 实现所有交互逻辑和状态管理

**输入**: Phase 6的HTML结构 + Phase 7的CSS样式
**输出**: 完整的JavaScript代码(嵌入<script>标签)

**执行步骤**:
```markdown
8.1 基础初始化:
    document.addEventListener('DOMContentLoaded', () => {
        // 初始化图标库
        lucide.createIcons();

        // 初始化路由
        initRouter();

        // 初始化事件监听
        initEventListeners();
    });

8.2 SPA路由系统:
    const routes = {
        'home': 'page-dashboard',
        'orders': 'page-orders',
        'settings': 'page-settings'
    };

    function navigateTo(routeName) {
        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('page-active');
        });

        // 显示目标页面
        const targetPageId = routes[routeName];
        document.getElementById(targetPageId).classList.add('page-active');

        // 更新URL (使用hash)
        window.location.hash = routeName;
    }

    function initRouter() {
        // 监听hash变化
        window.addEventListener('hashchange', () => {
            const route = window.location.hash.slice(1) || 'home';
            navigateTo(route);
        });

        // 初始化路由
        const initialRoute = window.location.hash.slice(1) || 'home';
        navigateTo(initialRoute);
    }

8.3 导航交互:
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const route = link.getAttribute('href').slice(1);
            navigateTo(route);

            // 更新活动状态
            document.querySelectorAll('.nav-menu a').forEach(a => {
                a.classList.remove('active');
            });
            link.classList.add('active');
        });
    });

8.4 表单验证:
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // 简单验证示例
            const inputs = form.querySelectorAll('input[required]');
            let isValid = true;

            inputs.forEach(input => {
                if (!input.value.trim()) {
                    input.classList.add('error');
                    isValid = false;
                } else {
                    input.classList.remove('error');
                }
            });

            if (isValid) {
                showToast('提交成功!', 'success');
                form.reset();
            } else {
                showToast('请填写所有必填字段', 'error');
            }
        });
    });

8.5 模态框 (Modal):
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('modal-open');
        document.body.style.overflow = '';
    }

    // 点击遮罩关闭
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay.closest('.modal').id);
            }
        });
    });

8.6 Toast 通知:
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // 动画显示
        setTimeout(() => toast.classList.add('toast-show'), 10);

        // 3秒后移除
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

8.7 表格排序 (Table Sorting):
    document.querySelectorAll('.table-sortable th').forEach(th => {
        th.addEventListener('click', () => {
            const table = th.closest('table');
            const columnIndex = Array.from(th.parentNode.children).indexOf(th);
            const rows = Array.from(table.querySelectorAll('tbody tr'));

            rows.sort((a, b) => {
                const aText = a.children[columnIndex].textContent;
                const bText = b.children[columnIndex].textContent;
                return aText.localeCompare(bText);
            });

            // 重新插入排序后的行
            rows.forEach(row => table.querySelector('tbody').appendChild(row));
        });
    });

8.8 模拟数据加载:
    function simulateDataLoad(callback, delay = 1000) {
        // 显示加载状态
        const loader = document.createElement('div');
        loader.className = 'loader';
        loader.textContent = '加载中...';
        document.querySelector('.main').appendChild(loader);

        // 模拟异步加载
        setTimeout(() => {
            loader.remove();
            callback();
        }, delay);
    }

8.9 搜索功能:
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const items = document.querySelectorAll('.searchable-item');

            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }

8.10 防抖/节流 (Debounce/Throttle):
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // 应用于搜索
    searchInput.addEventListener('input', debounce((e) => {
        console.log('搜索:', e.target.value);
    }, 300));
```

**验证点**:
- [x] SPA路由系统正常工作
- [x] 所有按钮/链接有点击交互
- [x] 表单有验证逻辑
- [x] 模态框可打开/关闭
- [x] Toast通知可显示
- [x] 至少1个复杂交互(排序/搜索/过滤)

---

### Phase 9: Responsive Adaptation (响应式适配)

**目标**: 确保所有页面和组件在三种断点下正常显示和交互

**输入**: Phase 6/7/8的完整HTML/CSS/JS
**输出**: 响应式测试报告(嵌入HTML注释)

**执行步骤**:
```markdown
9.1 三断点测试:
    - Mobile (320px-767px): 竖屏手机
    - Tablet (768px-1023px): 平板/横屏手机
    - Desktop (1024px+): 桌面/笔记本

9.2 Mobile优化:
    - 导航: 汉堡菜单或底部Tab导航
    - 表格: 卡片化展示或横向滚动
    - 表单: 全宽输入框
    - 图片: 响应式图片(srcset或object-fit)
    - 字体: 稍小的基准字号(14px)

9.3 Tablet优化:
    - 导航: 折叠式侧边栏或顶部导航
    - 表格: 简化列数或固定关键列
    - 布局: 2列网格

9.4 Desktop优化:
    - 导航: 完整顶部导航+侧边栏
    - 表格: 完整列数+排序/过滤
    - 布局: 3-4列网格

9.5 Touch Targets:
    确保所有可点击元素在移动端至少44x44px

    .btn, .nav-link {
        min-height: 44px;
        min-width: 44px;
    }

9.6 Viewport Meta:
    已在Phase 6添加:
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

9.7 测试清单:
    在每个断点测试:
    - [ ] 页面布局正常
    - [ ] 导航可用
    - [ ] 表单可填写
    - [ ] 按钮可点击
    - [ ] 图片正常显示
    - [ ] 文字可读(不截断)
    - [ ] 滚动流畅
    - [ ] 无水平滚动条

9.8 输出测试报告:
    将测试结果记录为HTML注释
    <!-- Responsive Test Report
    Mobile (375px): ✅ Layout OK, ✅ Nav OK, ✅ Forms OK
    Tablet (768px): ✅ Layout OK, ✅ Nav OK, ✅ Tables OK
    Desktop (1280px): ✅ Layout OK, ✅ Nav OK, ✅ All features OK
    -->
```

**验证点**:
- [x] 在320px宽度下页面可用
- [x] 在768px宽度下页面可用
- [x] 在1280px宽度下页面可用
- [x] 所有Touch Targets ≥ 44px
- [x] 无水平滚动条

---

### Phase 10: Constitution & Quality Check (宪法与质量检查)

**目标**: 验证原型符合所有Constitution条款和质量标准

**输入**: 完整的UI_PROTOTYPE.html
**输出**: Constitution检查报告

**执行步骤**:
```markdown
10.1 Constitution检查:

    Article I - Quality First (质量至上):
    - [ ] I.1 Complete Implementation: HTML无占位符,所有页面完整
    - [ ] I.2 No Simplification: 交互逻辑完整,非简化版本
    - [ ] I.4 Quality Gates: 通过HTML验证,无console错误

    Article III - Security First (安全优先):
    - [ ] III.1 No Hardcoded Secrets: 无API密钥硬编码
    - [ ] III.2 Input Validation: 表单有验证逻辑
    - [ ] III.4 Secure by Default: 使用HTTPS CDN资源

    Article V - Maintainability (可维护性):
    - [ ] V.3 Documentation: HTML注释包含设计文档
    - [ ] V.4 File Size Limits: 单文件HTML ≤ 2000行(可接受)

    Article X - Requirement Boundary (需求边界):
    - [ ] X.1 No Speculation: 仅实现PRD明确的功能
    - [ ] X.2 No Speculative Features: 无"未来可能需要"的功能

10.2 质量检查清单:

    HTML质量:
    - [ ] 使用HTML5语义化标签
    - [ ] 无未闭合标签
    - [ ] ARIA标签完整
    - [ ] 无重复ID

    CSS质量:
    - [ ] 使用CSS变量(Design System)
    - [ ] 响应式媒体查询正常
    - [ ] 无!important滥用
    - [ ] 命名规范(BEM或一致的命名)

    JavaScript质量:
    - [ ] 无全局变量污染
    - [ ] 事件监听器正确绑定
    - [ ] 无内存泄漏(事件监听器移除)
    - [ ] Console无错误

    可访问性:
    - [ ] 色彩对比度 ≥ 4.5:1
    - [ ] 键盘导航可用
    - [ ] 屏幕阅读器友好
    - [ ] focus状态可见

    性能:
    - [ ] CDN资源加载<1s
    - [ ] 首屏渲染<2s
    - [ ] 交互响应<100ms
    - [ ] 无不必要的重绘/回流

10.3 PRD对齐检查:
    遍历PRD中的每个用户故事:
    - [ ] 用户故事1: {标题} → UI页面/组件: {对应实现}
    - [ ] 用户故事2: {标题} → UI页面/组件: {对应实现}
    ...

    确保所有用户故事都有对应的UI实现

10.4 设计灵感验证:
    - [ ] 采样了2位大师
    - [ ] 转译说明清晰可执行
    - [ ] 实际样式符合转译说明
    - [ ] 禁止模仿的元素未出现

10.5 Anti-Generic-Design验证:
    - [ ] 无占位图片(Picsum图片正常加载)
    - [ ] 无常见AI紫/蓝配色
    - [ ] 无Emoji图标(使用SVG/图标库)
    - [ ] 无Lorem Ipsum文本

10.6 运行Constitution验证脚本:
    bash .claude/scripts/validate-constitution.sh --type ui --severity warning

    解析输出:
    - 如果有ERROR级别违规 → 必须修复
    - 如果有WARNING级别违规 → 记录到报告

10.7 输出Constitution检查报告:
    嵌入HTML注释:
    <!-- Constitution Check Report
    Generated: {timestamp}
    Status: PASS / WARN / FAIL

    Article I - Quality First: ✅ PASS
    Article III - Security First: ✅ PASS
    Article V - Maintainability: ⚠️  WARN (文件略大,但可接受)
    Article X - Requirement Boundary: ✅ PASS

    Quality Checklist:
    - HTML: ✅ 18/18 checks passed
    - CSS: ✅ 12/12 checks passed
    - JavaScript: ✅ 8/8 checks passed
    - Accessibility: ⚠️  7/8 checks passed (1 minor issue)
    - Performance: ✅ 4/4 checks passed

    PRD Alignment:
    - User Story 1: ✅ Implemented in page-orders
    - User Story 2: ✅ Implemented in modal-create-order
    - User Story 3: ✅ Implemented in page-settings

    Design Inspirations:
    - Inspiration 1: ✅ Applied (grid system from Müller-Brockmann)
    - Inspiration 2: ✅ Applied (color palette from Kusama)

    Anti-Generic-Design:
    - ✅ Real images (Picsum)
    - ✅ Unique color palette (避免AI紫)
    - ✅ SVG icons (Lucide)
    - ✅ Real content (no Lorem Ipsum)

    Overall Status: READY FOR HANDOFF
    -->

10.8 最终文件输出:
    将完整的HTML写入:
    devflow/requirements/${reqId}/UI_PROTOTYPE.html

10.9 更新状态:
    orchestration_status.json:
    {
      "phase": "ui_complete",
      "uiPrototypeGenerated": true,
      "uiPrototypeFile": "UI_PROTOTYPE.html",
      "constitutionCheckPassed": true
    }

10.10 记录事件:
    log_event "$REQ_ID" "UI prototype generation completed"
```

**验证点**:
- [x] Constitution检查通过(或仅WARNING)
- [x] 质量检查清单至少90%通过
- [x] 所有PRD用户故事都有对应UI实现
- [x] 设计灵感已应用且可验证
- [x] Anti-Generic-Design规则全部遵守

---

## Output Format (最终输出格式)

### UI_PROTOTYPE.html Structure:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <title>{REQ_ID} - {需求标题} - UI原型</title>

    <!-- === Design System Metadata === -->
    <!--
    Generated: {ISO 8601 timestamp}
    REQ-ID: {REQ_ID}
    Template Version: 1.0.0

    === Product Analysis ===
    {Phase 1 输出}

    === Design Inspirations ===
    {Phase 2 输出: 2位大师+转译说明}

    === Design System ===
    {Phase 3 输出: 色彩/字体/间距系统}

    === Information Architecture ===
    {Phase 4 输出: 站点地图+导航结构}

    === Component Inventory ===
    {Phase 5 输出: 组件清单}

    === Constitution Check Report ===
    {Phase 10 输出: 完整检查报告}
    -->

    <!-- CDN Resources -->
    <link href="https://fonts.googleapis.com/css2?family={选定字体}&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>

    <style>
        /* === Design System (CSS Variables) === */
        :root {
            /* Phase 3 的 Design Tokens */
        }

        /* === Reset & Base Styles === */
        /* Phase 7.3 */

        /* === Layout System === */
        /* Phase 7.4 */

        /* === Components === */
        /* Phase 7.5 - 所有组件样式 */

        /* === Pages === */
        /* Phase 7.6 - 页面特定样式 */

        /* === Responsive === */
        /* Phase 7.7 - 媒体查询 */

        /* === Animations === */
        /* Phase 7.8 - 动效 */

        /* === Utilities === */
        /* Phase 7.10 - 工具类 */
    </style>
</head>
<body>
    <!-- === Global Header === -->
    <header class="header">
        <!-- Phase 6.5 - 导航栏 -->
    </header>

    <!-- === Main Content === -->
    <main class="main">
        <!-- Page 1 -->
        <section id="page-{name}" class="page page-active">
            <!-- Phase 6.5 - 页面内容 -->
        </section>

        <!-- Page 2 -->
        <section id="page-{name}" class="page">
            <!-- More pages... -->
        </section>
    </main>

    <!-- === Global Footer === -->
    <footer class="footer">
        <!-- Phase 6.5 - 页脚 -->
    </footer>

    <!-- === Modals === -->
    <div id="modal-{name}" class="modal">
        <!-- Phase 6.5 - 模态框 -->
    </div>

    <script>
        /* === Initialization === */
        /* Phase 8.1 */

        /* === SPA Router === */
        /* Phase 8.2 */

        /* === Navigation === */
        /* Phase 8.3 */

        /* === Forms === */
        /* Phase 8.4 */

        /* === Modals === */
        /* Phase 8.5 */

        /* === Toast === */
        /* Phase 8.6 */

        /* === Table Sorting === */
        /* Phase 8.7 */

        /* === More Interactions === */
        /* Phase 8.8-8.10 */
    </script>

    <!-- === Responsive Test Report === -->
    <!-- Phase 9.8 输出 -->
</body>
</html>
```

---

## Error Handling & Recovery

### Common Errors:

**1. PRD中无UI需求**
```
WARNING: No UI requirements detected in PRD.md
Analyzed sections: 用户故事, 非功能需求
Found keywords: 0 matches for "用户界面|前端|Web页面|UI"

Recommendation:
  1. This appears to be a backend-only requirement
  2. Skipping UI prototype generation
  3. Continuing within /flow:spec

Action: EXIT with status "ui_skipped"
```

**2. 设计灵感采样失败**
```
ERROR: Design inspiration sampling failed
Sampled: {Designer1}, {Designer2}
Issue: Both designers from same category (建筑)
Expected: Designers from different categories

Recovery:
  1. Re-sample with category diversity check
  2. Retry Phase 2
```

**3. HTML验证失败**
```
ERROR: HTML validation failed
Issues:
  - Unclosed <div> tag at line 145
  - Duplicate ID "btn-submit" at lines 89, 203
  - Missing alt attribute on <img> at line 67

Recovery:
  1. Fix HTML errors
  2. Re-run validate-constitution.sh
  3. Retry Phase 10
```

**4. Constitution违规**
```
⚠️  Constitution violations detected:

[error] Article I.1 - NO PARTIAL IMPLEMENTATION
  Location: UI_PROTOTYPE.html:245
  Issue: Placeholder image <img src="placeholder.jpg">
  Fix: Replace with Picsum URL

[warning] Article V.4 - File Size
  Location: UI_PROTOTYPE.html
  Issue: File size 2300 lines (limit: 2000 lines)
  Fix: Acceptable for complex prototypes, or split into modules

Recovery:
  1. If ERROR violations: MUST FIX before proceeding
  2. If only WARNINGS: Document in report, proceed with caution
```

---

## Integration with DevFlow

### Workflow Position:
```text
/flow:spec → PRD.md 生成完成
    ↓
/flow:spec → 检测UI需求 → 生成UI_PROTOTYPE.html ← YOU ARE HERE
    ↓
/flow:spec → 参考UI原型生成EPIC.md和TASKS.md
    ↓
/flow:dev  → 基于UI原型实现代码
```

### Conditional Trigger Logic:
在 `/flow:spec` 执行期间自动触发:

```bash
# 检测是否需要UI原型
has_ui_keywords=$(grep -iE "用户界面|前端|Web页面|UI|界面设计|交互" "$PRD_FILE")
has_frontend_stack=$(ls -d src/components 2>/dev/null || ls package.json 2>/dev/null)

if [[ -n "$has_ui_keywords" || -n "$has_frontend_stack" ]]; then
    echo "✅ UI requirements detected, continue UI prototype generation in /flow:spec"
else
    echo "ℹ️  No UI requirements detected, skipping UI prototype"
    # 继续 /flow:spec 后续任务规划
fi
```

### Data Flow:
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

1. **严格遵循Execution Flow**
   - 不跳过任何Phase
   - 每个Phase的输出是下一个Phase的输入

2. **设计灵感采样**
   - 选择互补而非冲突的风格
   - 推荐组合: 现代主义(秩序) + 生成艺术(动态)
   - 避免组合: 两位极简主义大师(风格过于相似)

3. **内容真实性**
   - 图片: https://picsum.photos/id/{1-200}/{width}/{height}
   - 数据: 使用符合业务场景的模拟数据
   - 文本: 从PRD中提取真实的业务术语

4. **响应式优先**
   - 移动端优先设计(Mobile First)
   - 在小屏幕可用是基础,而非可选

5. **可访问性非可选**
   - ARIA标签是必需品
   - 键盘导航必须可用
   - 色彩对比度必须达标

### For Main Agent (Claude):

1. **条件触发**
   - 检测PRD关键词前使用grep -i(忽略大小写)
   - 检测前端技术栈时检查多个标志(package.json, src/, components/)

2. **状态管理**
   - 更新orchestration_status.json中的phase
   - 记录uiPrototypeFile路径

3. **错误处理**
   - 如果UI生成失败,记录详细错误到EXECUTION_LOG.md
   - 允许用户选择跳过UI阶段直接进入Epic

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

**Template Version**: 1.0.0
**Last Updated**: 2025-01-10
**Maintainer**: CC-DevFlow Team
**License**: MIT
