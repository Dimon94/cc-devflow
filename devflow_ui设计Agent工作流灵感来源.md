---
title: "GLM-4.6 vs Claude 4.5：当AI编程模型能力趋同，会用比选什么更重要"
source: "https://mp.weixin.qq.com/s/aoTh_Ve6i79CbGV6Azozzw"
author:
  - "[[花叔]]"
published:
created: 2025-10-12
description: "最近GLM-4.6在国内外开发者圈子里的热度有点高。"
tags:
  - "clippings"
---


最近GLM-4.6在国内外开发者圈子里的热度有点高。

  

![Image](https://mmbiz.qpic.cn/mmbiz_png/HRdaeEmxNHbHibebAbdgicGgJ6J8YxrlnKBsxRTMORJBe7rDIuG5yEBUfyroKmub9h3VazicMcsn0oNNjfOGRdOiaw/640?wx_fmt=png&from=appmsg&tp=webp&wxfrom=5&wx_lazy=1#imgIndex=0)

  

先看几个数据：

- 在LMArena全球大模型竞技场，GLM-4.6排名全球第4、开源第1、国内第1

![Image](https://mmbiz.qpic.cn/mmbiz_png/HRdaeEmxNHbHibebAbdgicGgJ6J8YxrlnKt3UibkUZ2SjIFSibpZWyGSY7jk2EpYxicyNNvvMhWWZNYhCicAsA1vZ7Pw/640?wx_fmt=png&from=appmsg&tp=webp&wxfrom=5&wx_lazy=1#imgIndex=1)

更关键的是价格：GLM-4.6的API调用成本是Claude 4.5的 1/10 ，但能达到Claude Sonnet 4的 90%+能力 。

  

这些数据确实很亮眼，也是很多人开始关注GLM-4.6的原因。

  

但说实话， 跑分是一回事，实战常常是另一回事。

  

十一假期前的大模型厂商们也着实是太卷了，DeepSeek V3.2、Claude 4.5、GLM-4.6... 一个接一个地不停出，搞得很多人都焦虑无比，不停有人来问我：现在AI编程产品和模型这么多，到底该选哪个？

  

在回答了几十个类似问题后，我发现了一个更本质的问题：

在国内大模型厂商的努力下，现在顶级AI编程模型的能力已经非常接近了，反而是会不会用、能不能用好提示词去激发模型的真实能力，成了关键。

  

就像你给十个程序员同样的需求文档，有人能做出用户体验出色的产品，有人做出来的东西根本没法用。差别不在于他们用的编程语言或IDE，而在于对需求的理解和执行能力。

  

AI编程现在也是一样的道理。

  

所以这篇文章，我不打算再去重复那些benchmark跑分，也不想去纠结SWE-bench上那相差1-2个百分点的数据。我想做的是：

1. 1.给你两套我实际在用的AI编程提示词 ，一套用于从0到1生成网站，一套用于网站设计优化
2. 2.用真实的开发任务测试GLM-4.6和Claude 4.5 ，看看在复杂提示词+实际工程场景下，谁的表现更好
3. 3.告诉你怎么用Claude Code + GLM-4.6的组合 ，用最好的工具+最具性价比的模型做出好产品

这才是AI编程真正的"实战"。

  

## 一、为什么要用提示词来测试模型能力？

  

很多评测文章会单纯拿benchmark数据来对比模型，但问题是，这些跑分和你实际用AI写代码的体验，完全是两回事。

  

真实的AI编程场景是什么样的？

- 你需要AI理解一个复杂的产品需求
- 你需要AI既能做产品经理的需求分析，又能做设计师的UI设计，还能写出可运行的代码
- 你需要AI产出一个完整的工程项目

  

所以，我准备了两套自己日常在用的提示词，来测试模型在真实场景下的能力。

  

### 提示词一：从0到1生成网站

  

这套提示词的核心逻辑是：让AI先当产品经理做需求分析和PRFAQ，再当设计师做视觉设计（还会从艺术家/建筑师中随机采样灵感），最后当前端工程师交付代码。

  

完整的提示词是这样的：

```
# 1. 你的任务
## 1.1 目标描述
- 根据我的描述，帮我创建一个设计出色，内容丰富，用户体验友好的网站。
- 网站主题：{把你的需求写在这里}

# 2. 工作流程

## 作为具有20年经验，在Apple、Google、facebook等顶级企业工作，比乔布斯、张小龙更出色的产品经理执行工作
### 2.1.1 采用逆向工作法，先撰写1000字深入思考过产品的PRFAQ
### 2.1.2 需求洞察，穿透用户表述，补齐显性与隐性需求，形成完整需求清单：功能、用户角色、使用场景、核心任务路径、边界与异常、数据结构。
### 2.1.3 结构输出PRD文档，明确目标用户，功能，优先级（MoSCoW），绘制信息架构草图（站点地图与任务流）。

## 作为具有20年工作经验，在Apple以及顶级设计咨询企业工作过的设计师执行工作
### 2.2.1 执行设计灵感采样
- 任务说明：请借鉴艺术家/建筑师/工业设计师的"风格与感觉"，进行提炼与融合后改造网站视觉与交互。
- 仅借鉴气质与方法，禁止临摹或再现具体作品。
- 从"灵感来源池"中随机采样 2 位
- 每位灵感需给出"灵感 → 网页实现"的转译说明
- 灵感来源池：Saul Bass, Maurice Binder, Pablo Ferro, Dan Perri, Kyle Cooper，Paula Scher, Neville Brody, April Greiman, David Carson, Jamie Reid, Push Pin Studios (Seymour Chwast)
，Massimo Vignelli, Josef Müller-Brockmann, Otl Aicher, Armin Hofmann, Karl Gerstner, Muriel Cooper
，Piet Mondrian, Sonia Delaunay, Josef Albers, Victor Vasarely, Bridget Riley, M. C. Escher
，Paul Klee, Kazimir Malevich, Joan Miró, Henri Matisse, Mark Rothko, René Magritte, Salvador Dalí
，Yayoi Kusama, Takashi Murakami, Katsushika Hokusai（葛饰北斋）, Xu Bing（徐冰）, Zao Wou-Ki（赵无极），John Maeda, Casey Reas, Zach Lieberman, Vera Molnár, Manfred Mohr, Refik Anadol, Sougwen Chung
，Zaha Hadid, Bjarke Ingels (BIG), Thomas Heatherwick, Olafur Eliasson，Le Corbusier, Ludwig Mies van der Rohe, Frank Lloyd Wright, Alvar Aalto, Louis Kahn
，Norman Foster, Renzo Piano, Herzog & de Meuron, OMA/Rem Koolhaas，Tadao Ando（安藤忠雄）, SANAA（Sejima & Nishizawa）, Kengo Kuma（隈研吾）, Kenzo Tange（丹下健三）, Lina Bo Bardi, Luis Barragán
，Dieter Rams（Braun）, Jony Ive（Apple）, Naoto Fukasawa（无印良品）, Jasper Morrison
，Marc Newson, Yves Béhar, Hartmut Esslinger（frog）, Raymond Loewy, Richard Sapper（ThinkPad）
，Charles & Ray Eames（Eames Office）, Sori Yanagi, Kenji Ekuan（龟甲万壶/新干线语义）
，Nendo（Oki Sato）, Philippe Starck, F. A. Porsche（Porsche Design）, James Dyson
，Teenage Engineering（Jesper Kouthoofd）, Susan Kare（界面图标语义）

#### 转译而非模仿（必须遵守）
- 版式：非对称分栏、超大标题、网格秩序与"破格"、分镜式章节标题
- 色彩：高对比撞色、三原色几何、工业警示条、渐变/光散射
- 形态：曲线切割、体块叠合、模块化卡片、纸感与细微纹理
- 动态：200–300ms 的入场/勾勒/滚动反馈；支持 \`prefers-reduced-motion\` 的静态回退
- 语义：极简图形符号、变量字体轴（字重/宽度小幅过渡）、数字/指标的等宽排版
- 不复刻具体作品的构图、配色、字体组合、标语或品牌元素
- 不生成与原作高度相似的页面布局或元素组合
### 2.2.2 交互与视觉方案，基于"网站前端设计原则"，输出可交付方案：页面结构、组件清单、状态说明（默认/悬停/激活/禁用/错误/空态/加载）、可访问性与动效规范、响应式断点策略。
### 2.2.3 设计系统，给出色彩、字体、栅格与间距系统（Design Tokens），文字描述 2–3 个关键页面线框。

## 2.3 作为出色的前端工程师完成前端设计，交付代码
### 2.3.1 前端设计基础原则
- 在理解需求与设计规范基础上，交付完整的 HTML/CSS/JS 代码。
### 2.3.2 组件化与增强
- 将复杂交互抽象为可扩展组件（卡片、表格、图表区、导航、表单），遵循渐进增强。
### 2.3.3 前端代码要求
- 使用 HTML5 语义结构：header、main、aside、section、nav、footer；标题层级正确。
- 通过 CDN 引入 Google Fonts（示例：Inter），并提供中英文混排备用字体栈。
- 使用 Font Awesome CDN 提供图标（或见第 5 章选用 SVG 图标库方案）。
- 三断点响应式；可点击区域不小于 44×44px；表格与图表具备小屏策略。
- 需要图片时必须给出实际链接，不留空白占位：
  - Picsum: https://picsum.photos/ （示例：https://picsum.photos/id/157/800/600）
- 必备 meta：viewport 与 color-scheme。

### 2.3.4. 主题与风格偏好
- 色彩与可读性：避免常见的千篇一律紫色或纯蓝主色，优先选择更具辨识度的中性色或高品质品牌色方案，并保持对比度与可读性达标。
- 内容表现：避免使用 emoji！！！当需要图标时，可以生成独特设计的svg图表，或者从引入以下图标库：Lucide、Heroicons、Tabler Icons
- 避免留下任何空白的占位符，该出现图片的地方都应引入开源图片资源
```

这套提示词的特点是：

- 把真实世界的产品开发完整流程融入到AI编程项目中（产品-设计-开发）
- 引入设计灵感采样机制，让生成的网站不会千篇一律
- 明确技术要求和质量标准
-

### 提示词二：网站设计优化

  

当你已经有一个网站，但觉得设计质量不够好时，可以用这套提示词让AI进行优化：

```
# 0. 目标与方法
## 0.1 任务说明
- 我们当前的网站设计质量不佳。请**借鉴艺术家/建筑师/工业设计师**的"风格与感觉"，进行**提炼与融合**后改造网站视觉与交互。
- 仅**借鉴气质与方法**，禁止临摹或再现具体作品。
- 新建一个文件存放优化后的代码以方便我们对比前后设计

## 0.2 使用方式
- 从"灵感来源池"中**采样 2位**。
- 每位灵感需给出**"灵感 → 网页实现"**的**转译说明**（不超过两行）。

---

# 1. 灵感来源池（扩展版）
> 只可从下列名单采样 2–3 位；按分类便于组合异质风格。请在输出中标注所采样的名字与对应类别。

## 1.1 影视片头 / 动态叙事
- Saul Bass, Maurice Binder, Pablo Ferro, Dan Perri, Kyle Cooper

## 1.2 平面 / 字体 / 后现代图形
- Paula Scher, Neville Brody, April Greiman, David Carson, Jamie Reid, Push Pin Studios (Seymour Chwast)

## 1.3 现代主义信息设计 / 网格系统
- Massimo Vignelli, Josef Müller-Brockmann, Otl Aicher, Armin Hofmann, Karl Gerstner, Muriel Cooper

## 1.4 几何与抽象艺术 / 光学艺术
- Piet Mondrian, Sonia Delaunay, Josef Albers, Victor Vasarely, Bridget Riley,
- 扩展画家：Paul Klee, Kazimir Malevich, Joan Miró, Henri Matisse, Mark Rothko, René Magritte, Salvador Dalí
- 亚洲与当代：Yayoi Kusama, Takashi Murakami, Katsushika Hokusai（葛饰北斋）, Xu Bing（徐冰）, Zao Wou-Ki（赵无极）

## 1.5 生成艺术 / 新媒体
- John Maeda, Casey Reas, Zach Lieberman, Vera Molnár, Manfred Mohr, Refik Anadol, Sougwen Chung

## 1.6 建筑 / 空间形态
- Zaha Hadid, Bjarke Ingels (BIG), Thomas Heatherwick, Olafur Eliasson
- 现代大师：Le Corbusier, Ludwig Mies van der Rohe, Frank Lloyd Wright, Alvar Aalto, Louis Kahn
- 当代与高技：Norman Foster, Renzo Piano, Herzog & de Meuron, OMA/Rem Koolhaas
- 日本与拉美：Tadao Ando（安藤忠雄）, SANAA（Sejima & Nishizawa）, Kengo Kuma（隈研吾）, Kenzo Tange（丹下健三）, Lina Bo Bardi, Luis Barragán

## 1.7 工业 / 硬件设备设计（产品语义、细节与材质）
- Dieter Rams（Braun）, Jony Ive（Apple）, Naoto Fukasawa（无印良品）, Jasper Morrison
- Marc Newson, Yves Béhar, Hartmut Esslinger（frog）, Raymond Loewy, Richard Sapper（ThinkPad）
- Charles & Ray Eames（Eames Office）, Sori Yanagi, Kenji Ekuan（龟甲万壶/新干线语义）
- Nendo（Oki Sato）, Philippe Starck, F. A. Porsche（Porsche Design）, James Dyson
- Teenage Engineering（Jesper Kouthoofd）, Susan Kare（界面图标语义）

---

# 2. 转译而非模仿（必须遵守）
## 2.1 可转译特征（示例）
- 版式：非对称分栏、超大标题、网格秩序与"破格"、分镜式章节标题
- 色彩：高对比撞色、三原色几何、工业警示条、渐变/光散射
- 形态：曲线切割、体块叠合、模块化卡片、纸感与细微纹理
- 动态：200–300ms 的入场/勾勒/滚动反馈；支持 \`prefers-reduced-motion\` 的静态回退
- 语义：极简图形符号、变量字体轴（字重/宽度小幅过渡）、数字/指标的等宽排版

## 2.2 禁止事项
- 不复刻具体作品的构图、配色、字体组合、标语或品牌元素
- 不生成与原作高度相似的页面布局或元素组合

## 2.3 交付写法
- "来自 {姓名} 的启发 → 页面实现：{具体可编码做法}；
```

这套提示词的核心是：通过艺术家/设计师的风格启发，让AI对现有设计进行创意性优化，而不是简单的"调色"或"改字体"。

  

## 二、真实测试：用AI论文生成展示网页

测试场景很简单：我找了一篇Air Street Capital 最近出的313页的关于AI现状的研究PDF《State of AI Report》，我已经在各种AI群聊里看到这个pdf文档的传播了，但我很怀疑这中间有没有1%的人能把这个全英文pdf读完🐶

  

所以，我的需求是让AI帮我把这篇报告总结生成网页，要求设计出色、信息呈现清晰。

![Image](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E)

  

这是一个非常典型的真实场景：你有内容，需要快速做一个展示页面。

  

我分别用Claude 4.5和GLM-4.6，配合上面的两套提示词进行测试。

  

### 第一轮测试：从0到1生成网站

  

测试方式：

- 使用「网站生成」提示词
- 上传这篇AI研究报告（这个pdf太大了，超过了32M，cc无法读取，所以我事先转成了md文件）
- 要求生成一个展示论文内容的网页

Claude 4.5的表现：

![Image](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E)

Claude的执行流程还算完整：

1. 1.读取了文档，做了核心内容分析
2. 2.设计了页面的信息架构
3. 3.从设计师池中采样了Josef Müller-Brockmann（瑞士网格系统）和Massimo Vignelli（现代主义大师）
4. 4.生成了一个单独的HTML文件（995行），包含所有HTML/CSS/JS代码

生成的网页设计质量不错，有明显的现代主义风格，网格系统运用得当。但有几个问题：

- 没有按提示词要求撰写PRFAQ ：直接跳过了产品经理的逆向工作法环节
- 没有输出PRD文档 ：提示词要求的需求洞察、优先级划分等步骤被省略了
- 代码组织方式 ：所有代码混在一个HTML文件里，不太符合工程化规范

最后得到的网页表现如下👇

![图片](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E)

GLM-4.6的表现：

![图片](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E)

  

GLM-4.6的表现让我有点意外。它非常严格地遵循了提示词的每一个步骤：

1. 1.完整的产品经理流程 ：
- 撰写了详细的PRFAQ文档（包括问题分析、解决方案、目标用户、功能特性、独特价值）
	- 输出了完整的需求清单和使用场景分析
3. 2.设计师流程 ：
- 从池中采样了John Maeda（计算美学）和Zaha Hadid（流体建筑）
	- 给出了清晰的"灵感→网页实现"转译说明
	- 设计了完整的设计系统：色彩方案、字体系统、组件清单、响应式断点
5. 3.工程化的代码实现 ：
- 分离的HTML、CSS、JS文件（index.html、styles.css、script.js）
	- 还额外创建了README.md说明文档

生成的网页质量也很高，深蓝色+青色+橙色的配色很有科技感，信息层级清晰，交互细节丰富。

![Image](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E)

  

无提示词加成情况下Claude 4.5的表现：

当然，从更科学的角度来说，除了对比用了复杂结构化提示词下Claude 4.5和GLM-4.6之外，我们还需要至少测一下不额外添加提示词的情况下，Claude 4.5的自然表现。

Emmm... 下面就是没用我这套提示词情况下

![图片](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E)

  

第一轮小结：Claude 4.5 >= GLM-4.6 >>> 无提示词加成的Claude 4.5

在这一轮，我觉得Claude 4.5 和 GLM-4.6各具特色：

- 最终的视觉表现我更喜欢Claude 4.5 ，网页结构非常清晰，把报告主要模块都涉及到了
- 但执行过程上， GLM-4.6表现出了更严格的指令遵循能力 ：完整执行了产品经理→设计师→工程师的完整流程
- 在如果不做特殊提示词要求，Claude 4.5 会给你铲出一个信息量巨大，但在设计上重点毫不突出，紫色背景AI感满满的页面，实在是原输前两者的表现。

这一轮测试让我意识到： 好的提示词+好的模型，真的能激发出远超预期的能力。

  

### 第二轮测试：设计优化

  

测试方式：

- 把第一轮Claude生成的网页代码作为基础
- 使用"网站优化"提示词
- 要求进行设计升级

Claude 4.5的设计👇

![图片](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E)

GLM-4.6的设计👇

![Image](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E)

  

第二轮小结： GLM-4.6 >= Claude 4.5

  

Claude和GLM在设计优化这个任务上都展现了很强的创意能力，两者都在风格转变上很大胆。以及在设计灵感的深度转译上可以看出贯彻得很彻底，比如GLM-4.6采用了电影人和现代主义信息设计大师的风格。

  

下面是GLM-4.6执行我的网站设计优化提示词的思考过程。

![Image](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E)

  

从我个人喜好来说，我更喜欢GLM-4.6提供的简约又特别的感觉，你完全感受不到这居然是在没有设计师的情况下，纯由AI写出来的。

  

不过我也得说，首先这种视觉审美的偏好有一定的主观性，你可能并不认同。以及，因为我们的提示词特别，每次生成新网站或者网页改版的过程都很像抽卡，也可能只是这次GLM-4.6抽出了我更喜欢的卡。

  

但这些都不重要，问题的核心：  
1）这套提示词能够让AI写出足够出色，且丰富多样的设计风格；

2）GLM-4.6在提示词理解和指令遵从上有相当出色的表现。

  

但总的来说，无论是代码质量、设计审美、还是对需求的理解，GLM-4.6和Claude 4.5都已经站在了同一水平线上。

  

### 提示词质量比模型选择更重要

  

这次测试最大的收获是： 一个精心设计的提示词，能让GLM-4.6生成远超预期的结果。

  

像我前面所展示的，如果我只是简单地说"帮我做个展示AI报告的网页"，GLM-4.6和Claude的输出可能都会差强人意。但当我提供了完整的工作流程、设计灵感池、技术要求后，GLM-4.6的表现就会质的飞跃。

  

这也是为什么我在文章开头就说：会用比选什么更重要。

  

那么问题来了：如果能力这么接近，为什么还要选GLM-4.6？

答案很简单： 性价比。

  

## 三、性价比才是王道

  

我们来看看实际的价格对比：

  

Claude 4.5： 通过Anthropic官方API：输入$3/百万tokens，输出$15/百万tokens；如果你用Claude Pro订阅：每月$20-$200，使用次数限制越来越严。

  

GLM-4.6： GLM Coding Plan：¥20/月 起，性价比远优于Claude Pro，你可以通过下面智谱的官方营销图片查看套餐对比信息👇

![Image](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E)

  

简单算一下就能知道，在同等用量水平下，Claude 4.5 和 GLM-4.6 价格几乎相差10倍以上，而能力差距呢？从我的实测来看， GLM-4.6能达到Claude 4.5的90%+能力，在某些任务上甚至更强。

  

这个性价比，对开发者意味着什么？

  

意味着你可以放开手脚做产品了。

  

以前用Claude做AI编程，你可能会想："这个需求要不要优化一下prompt，节省点tokens？" "这个功能要不要简化一下，减少API调用次数？"

现在用GLM-4.6，这些顾虑基本可以打消了。

  

你可以：

- 用更复杂的提示词，获得更好的输出质量
- 做更多的迭代和优化，而不用担心成本
- 把AI编程能力集成到你的产品中，不用担心用户量上来后API费用爆炸

这才是GLM-4.6真正的价值：让AI编程从"谨慎试用"变成"放手去做"。

  

## 四、最佳实践：Claude Code + GLM-4.6

  

说了这么多，具体怎么用呢？

  

我的建议是： 用Claude Code这个产品，但配置GLM-4.6作为底层模型。

  

为什么这么组合？

1、Claude Code是目前体验最好的AI编程工具 ：它的任务规划能力、多文件编辑能力、终端集成，都做得很出色

2、GLM-4.6的API完全兼容Anthropic格式 ：可以无缝接入Claude Code

3、这个组合兼顾了体验和成本 ：最好的工具+最具性价比的模型

  

下面是完整的配置教程：

  

### Step 1: 安装Claude Code

比较建议你通过Cursor、Trae等AI IDE进行安装（这样出问题的话，你也可以让AI帮你解决）

  

打开下方的终端界面，输入以下代码：

```
npm install -g @anthropic-ai/claude-code
```

![图片](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E)

  

回车之后，如果你电脑中还没安装Claude Code的话，就会进入安装的步骤。如果你已经安装了，则会出现和我类似的界面，获得相应的版本更新。

  

万一出现了报错提醒，你也可以把错误信息复制给Cursor等IDE的对话框，让他帮你解决问题。

安装完成后，可以运行 claude 命令验证安装成功。

  

### Step 2: 获取GLM-4.6 API Key

1. 1.访问智谱AI开放平台： https://bigmodel.cn/usercenter/proj-mgmt/apikeys
2. 2.注册/登录账号
3. 3.创建并复制API Key

新用户会赠送一定额度的免费tokens，足够你测试使用。如果要长期使用，建议订阅GLM Coding Lite（可以先从 ¥20/月 套餐开始，我现在就是用的这个套餐）： https://zhipuaishengchan.datasink.sensorsdata.cn/t/2w

![Image](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E)

### Step 3: 配置Claude Code使用GLM-4.6

  

Claude Code支持自定义模型配置。你可以直接在终端里通过以下代码讲Claude Code调用的API URL改成智谱的：

```
export ANTHROPIC_BASE_URL="https://open.bigmodel.cn/api/anthropic"
export ANTHROPIC_AUTH_TOKEN="你上一步获取到的智谱api_key"
Claude
```

  

不过呢，如果你像我一样，会比较频繁地同时使用Claude订阅版的Claude Code，又要使用GLM-4.6的Claude Code，不想每次都要在终端这么复杂输入的话，还有个我自己常用的小技巧。

  

那就是：使用shell别名快速切换模型

  

对于macOS/Linux用户，编辑 ~/.zshrc （或 ~/.bashrc ）文件，在最后添加以下内容：

  

```
# 使用智谱 AI 模型的 ClaudeCode
glm() {
    exportANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic
    exportANTHROPIC_AUTH_TOKEN=你的GLM-4.6_API_Key
    exportANTHROPIC_MODEL=GLM-4.6
    claude --dangerously-skip-permissions "$@"
}
```

  

保存之后，你只需要在终端输入\`glm\`就可以直接使用GLM-4.6模型的Claude Code了，非常方便。

  

![Image](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E)

  
如果你在配置过程中遇到任何问题，或者对上面的步骤不太理解，有个更简单的方法：直接让AI帮你配置。  
  
打开Cursor、Trae或任何你熟悉的AI IDE，把这部分教程内容复制给AI，告诉它："帮我完成Claude Code + GLM-4.6的配置"。AI会逐步引导你完成所有操作。  
  
这就是AI时代的好处：连学习使用AI工具，都可以让AI来教你。

  

## 五、写在最后：聚焦做产品，而非纠结工具

  

现在AI编程领域有个很有趣的现象：很多人花大量时间研究"哪个模型在某个benchmark上领先0.5%"，却很少真正用AI做出过什么产品。

  

就像我在文章开头说的： 现在顶级AI编程模型的能力已经非常接近了，真正的差距在于会不会用。

  

从我的实测来看：

- Claude 4.5和GLM-4.6在实际编程任务中的表现难分伯仲
- GLM-4.6的性价比是Claude的10倍以上
- 配合好的提示词，两个模型都能做出高质量的产品

所以，我的建议是：

  

不要把时间花在"哪个模型更强0.1%"的纠结上，应该把精力放在：用这些工具快速做出好产品。

  

这是最好的时代：

- 有Claude Code这样体验出色的AI编程工具
- 有GLM-4.6这样能力强悍、价格亲民的模型

在有这么好的选择的情况下，就不要再费力干麻烦的事了。

选个性价比高的模型，配上好的提示词，然后去做你想做的产品。

  

这才是AI编程的正确打开方式。

[阅读原文](https://mp.weixin.qq.com/s/)

---
title: "Cursor+Claude3.7的绝杀：从原型到app，两步完成app开发"
source: "https://mp.weixin.qq.com/s/8STi5CntEehPiwR8rS1-Ag"
author:
  - "[[花生]]"
published:
created: 2025-10-12
description:
tags:
  - "clippings"
---
![cover_image](https://mmbiz.qpic.cn/mmbiz_jpg/HRdaeEmxNHbqSJbGXb4WfAGHxGoQeNMgP6bia9EhtMth9pNu8ND8HuRb5iaBkWE4nxsL95e1icaDqsufaQAJMawGw/0?wx_fmt=jpeg)

原创 花生 [花叔](https://mp.weixin.qq.com/s/) *2025年03月02日 11:33*

最近在X上看到了一些人在用Claude 3.7 Sonnet生成 app原型图的尝试，受到启发，发现这么先生成不同界面的原型图再让Cursor基于原型图开发app会是很好的尝试。尤其是，你也可以不两步直接生成，而是在过程中更可视化地思考你要生产的原型，这对于非专业的产品经理来说，会是好得多的方式。

我今天做了些尝试后，效果让我感到惊艳。这里给大家介绍下具体的操作方式。

## 步骤一：新开项目文件生成HTML原型图

可以参考我的提示词，修改其中的要求。

```css
我想开发一个ai自动记账app，现在需要输出原型图，请通过以下方式帮我完成app所有原型图片的设计。1、思考用户需要ai记账app实现哪些功能2、作为产品经理规划这些界面3、作为设计师思考这些原型界面的设计4、使用html在一个界面上生成所有的原型界面，可以使用FontAwesome等开源图标库，让原型显得更精美和接近真实我希望这些界面是需要能直接拿去进行开发的
```

```css
这里有三个关键点：
```

1、选择Claude 3.7 Sonnet模型，不建议thinking

2、选择composer normal模式，或者说0.46版本中editor模式，不要选择agent，不要选择agent！

3、由于一次性生成的html代码文件会太长，中间可能会截断或创建失败，你可以点击生成失败的代码文件，cursor会提醒你是否创建文件，然后把已经生成的一部分代码复制到新创建的文件中；接着，@对应代码文件，要求cursor继续补全文件。

![图片](https://mmbiz.qpic.cn/mmbiz_png/HRdaeEmxNHbqSJbGXb4WfAGHxGoQeNMgxCCquxBecPzGwe15guVrP49qukhw5ibVnoMrIPApev431InulPUJP9Q/640?wx_fmt=png&from=appmsg&tp=webp&wxfrom=5&wx_lazy=1#imgIndex=0) ![图片](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E)

然后，打开补全完成的html，你就获得了类似下面的整个app所有主要界面的原型图👇

![图片](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E)

步骤二：让Cursor根据原型图创建app

用Xcode创建一个新项目，然后在Cursor中打开项目的根目录（如果从来没开发过iOS项目，不知道这一步如何操作的，可以先去看我之前的iOS app开发视频）

![图片](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E)

在Cursor打开的iOS app开发项目根目录中发送上面得到的app原型图，然后要求：

```js
请根据我提供的原型图完成这个app的设计
```

![图片](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E)
```css
这一步依然有三个关键点：
```

1、选择Claude 3.7 Sonnet模型，thinking或非thinking都可以试试

2、选择agent模式，必须选择agent！

3、这个过程中不断accept生成的代码文件就好了，创建完成后如果在Xcode调试出现bug，可以把xcode的报错提示复制回cursor，修bug场景建议使用thinking模型。

我这次测试过程中，两个步骤分别出现了一次cursor生成出错和一次Xcode报错，其他都一切顺利，得到的结果远超我的预期了。

![图片](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E) ![图片](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E) ![图片](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E)

甚至，这个app大部分功能都已经是可以正常操作，逻辑正常的。

这个两步生成app的策略其实都离不开Claude 3.7的能力，核心用到了两点：

1、Claude 3.7生成原型的能力惊人

2、Cursor agent模式+Claude 3.7基于原型图多步骤完成任务能力惊人

下面是其他一些原型图

![图片](https://mp.weixin.qq.com/s/www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3E%3C/title%3E%3Cg%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%20fill-opacity='0'%3E%3Cg%20transform='translate(-249.000000,%20-126.000000)'%20fill='%23FFFFFF'%3E%3Crect%20x='249'%20y='126'%20width='1'%20height='1'%3E%3C/rect%3E%3C/g%3E%3C/g%3E%3C/svg%3E)




