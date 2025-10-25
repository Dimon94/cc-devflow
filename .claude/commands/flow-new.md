---
name: flow-new
description: One-shot requirement flow. Usage: /flow-new "REQ-123|支持用户下单|https://plan.example.com/Q1"
---

# Flow-New - 一键需求开发流

## 命令格式
```text
/flow-new "REQ_ID|TITLE|PLAN_URLS"
```

### 参数说明
- **REQ_ID**: 需求编号 (例如: REQ-123)
- **TITLE**: 需求标题 (例如: 支持用户下单)
- **PLAN_URLS**: 计划文档URL，多个用逗号分隔 (可选)

### 示例
```text
/flow-new "REQ-123|支持用户下单|https://plan.example.com/Q1"
/flow-new "REQ-124|用户权限管理|https://docs.company.com/auth-spec.md,https://confluence.company.com/security-requirements"
/flow-new "REQ-125|数据导出功能"
```

## 架构说明

**重要**: /flow-new 已重构为便捷包装器，实际执行通过调用6个阶段化命令完成。

### 设计理念
- **简化入口**: 为新用户提供一键完整流程体验
- **标准化执行**: 底层调用标准阶段化命令，确保流程一致性
- **透明化**: 清晰显示每个阶段的执行状态
- **可恢复**: 任何阶段失败都可通过对应的阶段命令恢复
- **单轨信息源**: 所有产物只写入 `devflow/requirements/${REQ_ID}/` 或 `devflow/bugs/${REQ_ID}/`，不再生成 changes/、specs/ 等辅助目录

### 与阶段化命令的关系
```text
/flow-new
  ├─> /flow-init    (阶段1: 初始化)
  ├─> /flow-prd     (阶段2: PRD生成)
  ├─> /flow-ui      (阶段2.5: UI原型生成) ⚡️ 条件触发
  ├─> /flow-tech    (阶段2.7: 技术方案设计) 🔧 新增
  ├─> /flow-epic    (阶段3: Epic规划)
  ├─> /flow-dev     (阶段4: 开发执行)
  ├─> /flow-qa      (阶段5: 质量保证)
  └─> /flow-release (阶段6: 发布管理)
```

## 执行流程

### 阶段 1: 初始化 (/flow-init)
```text
1. 解析输入参数: REQ_ID|TITLE|PLAN_URLS
2. 调用 /flow-init "REQ_ID|TITLE"
   → 创建需求目录结构（单轨）
   → 创建Git功能分支
   → 初始化状态文件
   → 触发调研工作流（必做）
      • Phase A: 现有代码调研（输出 internal/codebase-overview.md）
      • Phase B: 外部资料采集（MCP）——PLAN_URLS 作为优先抓取源；缺省时自动基于 TITLE 与技术栈推导关键词；所有远程抓取原件以 `.md` 原文保存
   → 所有调研成果写入 devflow/requirements/${REQ_ID}/research/ 并记录 EXECUTION_LOG.md

输出:
  ✅ Git分支: feature/REQ-123-支持用户下单
  ✅ 需求目录: devflow/requirements/REQ-123/
  ✅ 状态文件: orchestration_status.json (status: initialized)
  ✅ 研究材料: research/internal/ 与 research/mcp/ 下的调研成果

错误处理:
  - 如果REQ_ID已存在 → 提示用户并终止
  - 如果Git状态不干净 → 提示清理工作区
  - 如果外部资料抓取失败 → 警告并在 research-summary.md 中标注待补项（需求结构仍可用）
```

### 阶段 2: PRD生成 (/flow-prd)
```text
3. 调用 /flow-prd "REQ_ID"
   → prd-writer 研究型代理分析需求
   → 生成结构化PRD文档
   → 执行Constitution检查
   → 验证文档完整性

输出:
  ✅ PRD.md (100+ 行完整需求文档)
     - 背景与目标
     - 用户故事 + Given-When-Then验收标准
     - 非功能性要求
     - Constitution检查结果
  ✅ 状态更新: prd_complete

错误处理:
  - 如果Constitution检查失败 → 显示违规项，询问是否继续
  - 如果PRD不完整 → 终止并提示手动修正
```

### 阶段 2.5: UI原型生成 (/flow-ui) ⚡️ 条件触发
```text
3.5 检测UI需求并生成原型 (如果适用)
   → Step 1: 检测UI需求
     • 读取PRD.md检测UI关键词:
       - "用户界面", "前端", "Web页面", "UI", "界面设计", "交互"
       - "页面", "表单", "按钮", "导航", "布局"
     • 检测项目技术栈:
       - package.json存在 (前端项目)
       - src/components/目录存在 (组件化架构)
       - public/或static/目录存在 (静态资源)

   → Step 2: 如果检测到UI需求:
     • 调用 /flow-ui "REQ_ID"
     • ui-designer研究型代理执行:
       Phase 1: 加载PRD和上下文
       Phase 2: 智能设计灵感采样 (基于PRD风格提示)
         - 如果PRD提到"现代/简约/专业" → 现代主义信息设计
         - 如果PRD提到"科技感/创新/动态" → 生成艺术+建筑
         - 如果PRD提到"典雅/艺术/文化" → 亚洲与当代艺术
         - 可选: 使用WebSearch查找外部设计参考
         - 保存设计策略到 research/ui_design_strategy.md
       Phase 3: 定义设计系统 (色彩/字体/间距/组件)
       Phase 4-9: 生成HTML原型
       Phase 10: Constitution & Quality Check
     • 生成 UI_PROTOTYPE.html (完整的单文件HTML原型)

   → Step 3: 如果无UI需求:
     • 跳过此阶段,直接进入Epic规划
     • 记录日志: "No UI requirements detected, skipping UI prototype generation"

输出:
  ✅ UI_PROTOTYPE.html (如果有UI需求)
     - 单文件HTML/CSS/JS原型
     - 响应式设计 (320px/768px/1024px断点)
     - 完整交互状态 (hover/active/disabled)
     - 内联真实图片资源 (Picsum/Unsplash)
     - SPA风格多页面路由 (hash-based)
  ✅ research/ui_design_strategy.md (设计策略文档)
     - PRD风格分析
     - 采样的设计大师及转译规则
     - 外部设计参考 (如有WebSearch)
  ✅ 状态更新: ui_complete 或 ui_skipped

条件触发逻辑:
  触发条件 (任一满足):
    - PRD包含UI关键词
    - 项目包含package.json
    - 项目包含src/components/目录
    - 用户显式请求UI原型生成

  跳过条件:
    - PRD明确标注"纯后端/API项目"
    - 无前端技术栈特征
    - 用户显式请求跳过 (--skip-ui)

错误处理:
  - 如果设计灵感采样失败 → 使用默认现代主义风格
  - 如果WebSearch超时 → 跳过外部参考,继续生成
  - 如果HTML生成不完整 → 警告但继续,后续可手动完善
```

### 阶段 2.7: 技术方案设计 (/flow-tech) 🔧 新增
```text
2.7 生成技术方案文档 (MANDATORY FOR EPIC/TASKS)
   → Step 1: 技术细化分析 (基于 flow-init 的概览分析)
     • 复用: research/internal/codebase-overview.md (项目概览, from flow-init)
     • 深度分析:
       - 数据模型实现模式 (ORM, schema, validation, 示例代码)
       - API实现模式 (routing, handling, error, 示例代码)
       - 认证授权实现 (middleware, guards, tokens, 示例代码)
       - 数据库连接和事务 (connection, pool, migration)
       - 可复用组件和工具 (logger, validator, utils)
       - 测试模式 (framework, mocks, fixtures)
     • 生成: research/codebase-tech-analysis.md (技术细化分析报告)

   → Step 2: 调用 /flow-tech "REQ_ID"
     • tech-architect研究型代理执行:
       Phase 1: 加载PRD和代码库分析
       Phase 2: 设计系统架构
         - 定义架构层次 (前端/API/服务/数据库)
         - 创建架构图 (文本格式)
         - 定义模块分解
       Phase 3: 选择技术栈
         - 前端技术 (框架, 状态管理, UI库) + 版本和理由
         - 后端技术 (框架, ORM, 验证) + 版本和理由
         - 数据库 (主库, 缓存) + 版本和理由
         - 基础设施 (部署, CI/CD) + 理由
       Phase 4: 定义数据模型
         - 完整数据库表结构 (所有字段, 类型, 约束)
         - 实体关系 (1:1, 1:N, N:M)
         - 索引和性能优化
       Phase 5: 设计API契约
         - 所有API端点 (方法, 路径, 请求, 响应)
         - 数据验证规则
         - 错误处理
       Phase 6: 安全方案
         - 认证策略 (JWT/OAuth)
         - 授权模型 (RBAC/ABAC)
         - 密钥管理 (NO HARDCODED SECRETS)
         - 输入验证和防护 (SQL注入, XSS, CSRF)
       Phase 7: 性能方案
         - 缓存策略 (Redis, TTL)
         - 数据库优化 (索引, 连接池)
         - 水平扩展
       Phase 8: Phase -1 宪法闸门
         - Simplicity Gate (Article VII)
         - Anti-Abstraction Gate (Article VIII)
         - Integration-First Gate (Article IX)
       Phase 9: 验证完整性
       Phase 10: 生成 TECH_DESIGN.md

   → Step 3: 验证技术方案完整性
     • 所有章节填写完整 (无 {{PLACEHOLDER}})
     • 所有技术选型有版本号和理由
     • 数据库表结构完整 (所有表, 字段, 关系, 索引)
     • 所有API端点有请求/响应schema
     • 安全方案完整 (NO HARDCODED SECRETS)
     • 性能方案完整
     • 宪法检查通过

输出:
  ✅ TECH_DESIGN.md (150+ 行完整技术方案)
     - Section 1: 系统架构 (架构图, 模块分解, 数据流)
     - Section 2: 技术栈 (前端, 后端, 数据库, 基础设施 + 版本和理由)
     - Section 3: 数据模型设计 (表结构, 关系, 索引)
     - Section 4: API设计 (所有端点, 请求/响应, 错误)
     - Section 5: 安全设计 (认证, 授权, 密钥, 验证)
     - Section 6: 性能设计 (缓存, 优化, 扩展)
     - Section 7: Constitution检查 (Phase -1 Gates)
     - Section 8: 验证清单
  ✅ research/codebase-tech-analysis.md (技术细化分析报告, 新增)
     - 数据模型模式 + 示例代码
     - API实现模式 + 示例代码
     - 认证授权实现 + 示例代码
     - 数据库连接/事务模式
     - 可复用组件和工具
     - 测试模式和框架
  ✅ 状态更新: tech_design_complete

关键价值:
  • 为 planner 提供完整技术上下文
  • 确保 TASKS.md 覆盖所有技术层 (不漏细节)
  • 提供具体技术选型和API契约
  • 减少任务分解的歧义
  • 明确数据库schema, 所有表和字段提前定义
  • 所有API端点提前定义, 前后端对接无歧义

错误处理:
  - 如果TECH_DESIGN.md不完整 → 终止并提示手动修正
  - 如果Constitution违规 → 显示违规项，要求修正
  - 如果数据模型缺失 → 终止并提示补充
  - 如果API契约不完整 → 终止并提示补充
```

### 阶段 3: Epic规划 (/flow-epic)
```text
4. 调用 /flow-epic "REQ_ID"
   → planner 研究型代理分析PRD + **TECH_DESIGN.md**
   → 分解Epic和原子级任务
   → 定义依赖关系和DoD
   → 标记逻辑独立任务 [P]

输出:
  ✅ EPIC.md (Epic描述和技术方案)
  ✅ TASKS.md (单文件管理所有任务, **基于TECH_DESIGN.md生成**)
     - 每个任务: ID、描述、类型、优先级、依赖、DoD
     - [P] 标记逻辑独立任务
     - **覆盖TECH_DESIGN.md所有层**:
       * 数据模型任务 (Section 3: 所有表, 迁移, 索引)
       * API端点任务 (Section 4: 所有端点, 验证, 错误处理)
       * 安全任务 (Section 5: 认证, 授权, 密钥管理, 验证)
       * 性能任务 (Section 6: 缓存, 优化, 扩展)
       * 前端任务 (Section 2.1: 组件, 状态管理, API集成, 如有)
  ✅ 状态更新: epic_complete

错误处理:
  - 如果TECH_DESIGN.md缺失 → 终止并提示先运行 /flow-tech
  - 如果任务依赖有循环 → 终止并提示修正
  - 如果任务粒度过大 → 警告但继续
  - 如果TASKS未覆盖TECH_DESIGN所有层 → 警告并提示补充
```

### 阶段 4: 开发执行 (/flow-dev)
```text
5. 调用 /flow-dev "REQ_ID"
   → 串行执行TASKS.md中的所有任务
   → 对每个任务:
     • dev-implementer代理生成实现计划
     • 主代理执行TDD开发 (测试优先)
     • 测试验证 (TEST VERIFICATION CHECKPOINT)
     • Git提交并标记完成

执行模式:
  Phase 1: 分析现有代码
  Phase 2: 编写测试 (Tests First)
  TEST VERIFICATION CHECKPOINT (测试必须先失败)
  Phase 3: 实现代码
  Phase 4: 测试验证 (测试必须通过)
  Phase 5: Git提交并标记完成

输出:
  ✅ 实现代码 (新文件或修改现有文件)
  ✅ 测试代码 (*.test.ts 或 *.spec.ts)
  ✅ tasks/TASK_*.completed 标记文件
  ✅ tasks/IMPLEMENTATION_PLAN.md (实现计划)
  ✅ Git commits (每个任务一个)
  ✅ 状态更新: dev_complete

错误处理:
  - 如果测试直接通过 → 错误，测试无效
  - 如果实现后测试失败 → 终止，提示修复
  - 如果类型检查失败 → 终止，提示修复
  - 任何阶段失败 → 保存状态，可通过 /flow-dev --resume 恢复
```

### 阶段 5: 质量保证 (/flow-qa)
```text
6. 调用 /flow-qa "REQ_ID" --full
   → qa-tester代理分析测试覆盖
   → 运行完整测试套件
   → 检查代码覆盖率 (≥80%)
   → security-reviewer代理执行安全审查
   → 生成测试和安全报告

输出:
  ✅ TEST_PLAN.md (测试策略和覆盖分析)
  ✅ TEST_REPORT.md (测试结果报告)
  ✅ SECURITY_PLAN.md (安全审查计划)
  ✅ SECURITY_REPORT.md (安全扫描报告)
  ✅ 状态更新: qa_complete

Exit Gate检查:
  - ✅ 所有测试通过
  - ✅ 代码覆盖率 ≥ 80%
  - ✅ 无高危安全问题
  - ✅ TypeScript类型检查通过

错误处理:
  - 如果测试失败 → 显示失败详情，终止
  - 如果覆盖率不足 → 显示未覆盖代码，终止
  - 如果发现高危安全问题 → 显示详情，终止
  - 所有问题修复后 → 重新运行 /flow-qa
```

### 阶段 6: 发布管理 (/flow-release)
```text
7. 调用 /flow-release "REQ_ID"
   → release-manager代理生成发布计划
   → **更新 CLAUDE.md 技术架构**（如有重要架构变更）
     • 检查 TECH_DESIGN.md 的 Baseline Deviation
     • 如果有新增基础设施组件（Redis、Message Queue）或架构层变更
     • 精炼地更新 CLAUDE.md 的 "## Technical Architecture" 章节
     • 格式：bullet points (≤15行)，包含 REQ-ID 引用
     • 提交独立 commit: "docs(REQ-123): update technical architecture"
   → 执行最终构建
   → 创建GitHub Pull Request（包含更新后的 CLAUDE.md）
   → 记录PR URL

输出:
  ✅ RELEASE_PLAN.md (发布计划和回滚策略)
  ✅ CLAUDE.md (更新技术架构，如有重要变更)
  ✅ GitHub Pull Request (包含完整描述)
     - 需求摘要 (来自PRD)
     - 变更清单 (来自Git commits)
     - 测试结果 (来自TEST_REPORT)
     - 安全扫描 (来自SECURITY_REPORT)
     - 技术架构更新 (来自CLAUDE.md，如有)
     - 检查清单
  ✅ 状态更新: release_complete

错误处理:
  - 如果构建失败 → 显示构建错误，终止
  - 如果PR创建失败 → 显示GitHub错误，提供手动创建指引
```

### 进度展示
实时显示每个阶段的执行状态:
```text
🎯 CC-DevFlow 完整需求开发流程
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

需求: REQ-123 | 支持用户下单

[1/7] ✅ 初始化完成
      → Git分支: feature/REQ-123-支持用户下单
      → 需求目录已创建
      → 研究材料已抓取: 2 个文件

[2/7] ✅ PRD生成完成
      → PRD.md: 145 行
      → 用户故事: 5 个
      → Constitution检查: 通过

[2.5/8] ✅ UI原型生成完成 ⚡️
        → UI需求检测: 通过 (检测到"页面"、"表单"关键词)
        → 设计灵感采样: 3位大师 (Dieter Rams, Josef Müller-Brockmann, 原研哉)
        → UI_PROTOTYPE.html: 单文件原型 (响应式设计)
        → 设计策略文档: ui_design_strategy.md

[2.7/8] ✅ 技术方案设计完成 🔧
        → 代码库分析: 完成 (项目类型: Node.js/TypeScript)
        → TECH_DESIGN.md: 180 行完整技术方案
        → 系统架构: 前端(React) + API(Express) + DB(PostgreSQL) + Cache(Redis)
        → 技术栈: 所有技术选型完成 (含版本和理由)
        → 数据模型: 5 个表, 完整schema和关系
        → API设计: 12 个端点, 完整契约
        → 安全方案: JWT认证, RBAC授权, NO HARDCODED SECRETS
        → 性能方案: Redis缓存, 数据库索引, 水平扩展
        → Constitution检查: 通过

[3/8] ✅ Epic规划完成
      → EPIC.md 已生成 (基于PRD + TECH_DESIGN)
      → TASKS.md: 18 个任务 (基于TECH_DESIGN完整覆盖)
        * 数据模型任务: 5 个 (所有表 + 迁移)
        * API任务: 12 个 (所有端点 + 验证)
        * 安全任务: 4 个 (认证 + 授权 + 验证)
        * 性能任务: 2 个 (缓存 + 优化)
        * 前端任务: 4 个 (组件 + 状态 + 集成)
      → 逻辑独立任务: 8 个 [P]

[4/8] 🔄 开发执行中...
      → 任务进度: 8/18 已完成
      → 当前任务: TASK_009 - 实现用户认证中间件 (基于TECH_DESIGN Section 5.1)
      → Phase 3: 实现JWT验证逻辑...

[5/8] ⏳ 等待质量保证...

[6/8] ⏳ 等待发布管理...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

注:
- 阶段2.5 (UI原型生成) 为条件触发,纯后端项目自动跳过
- 阶段2.7 (技术方案设计) 为MANDATORY,确保TASKS完整覆盖所有技术层
```

### 中断与恢复
任何阶段失败或中断:
```bash
# 查看当前状态
/flow-status REQ-123

# 从中断点恢复
/flow-restart "REQ-123"

# 或手动执行特定阶段
/flow-tech "REQ-123"       # 重新生成技术方案
/flow-epic "REQ-123"       # 重新生成Epic和Tasks
/flow-dev "REQ-123" --resume
/flow-qa "REQ-123"
/flow-release "REQ-123"
```

## 输出产物

### 文档结构
```text
devflow/requirements/${reqId}/
├── research/                    # 研究资料
│   ├── internal/               # 内部代码库分析 (flow-init 输出)
│   │   └── codebase-overview.md  # 概览性分析 (项目类型, 技术栈, 模块)
│   ├── mcp/                    # 外部资料 (MCP 抓取)
│   │   ├── ${reqId}_1.md
│   │   └── ${reqId}_2.md
│   └── codebase-tech-analysis.md  # 技术细化分析 (flow-tech 输出)
├── orchestration_status.json   # 状态管理文件 (阶段、进度、时间戳)
├── EXECUTION_LOG.md            # 执行日志 (所有操作的时间序列记录)
│
├── PRD.md                      # 产品需求文档 (/flow-prd 输出)
│                               # - 用户故事 + 验收标准
│                               # - 非功能需求
│                               # - Constitution检查结果
│
├── UI_PROTOTYPE.html           # UI原型文档 (/flow-ui 输出) ⚡️ 条件生成
│                               # - 单文件HTML/CSS/JS原型
│                               # - 响应式设计 (320px/768px/1024px)
│                               # - 完整交互状态和真实图片
│                               # - SPA风格多页面路由
│                               # ⚠️ 仅在检测到UI需求时生成
│
├── EPIC.md                     # Epic规划文档 (/flow-epic 输出)
│                               # - Epic描述和目标
│                               # - 技术方案概览
│
├── TASKS.md                    # 任务分解文档 (/flow-epic 输出)
│                               # - 所有任务列表 (单文件管理)
│                               # - 依赖关系和优先级
│                               # - 每个任务的详细DoD
│                               # - [P] 标记逻辑独立任务
│
├── tasks/                      # 任务执行产物 (/flow-dev 输出)
│   ├── TASK_001.completed      # 空文件，表示任务完成
│   ├── TASK_002.completed
│   └── IMPLEMENTATION_PLAN.md  # dev-implementer输出的实现计划
│
├── TEST_PLAN.md                # 测试计划 (/flow-qa 输出，qa-tester代理)
├── TEST_REPORT.md              # 测试报告 (/flow-qa 输出，实际测试结果)
│
├── SECURITY_PLAN.md            # 安全计划 (/flow-qa 输出，security-reviewer代理)
├── SECURITY_REPORT.md          # 安全报告 (/flow-qa 输出，实际扫描结果)
│
└── RELEASE_PLAN.md             # 发布计划 (/flow-release 输出，release-manager代理)
                                # - PR描述模板
                                # - 发布检查清单
                                # - 回滚计划
```

**关键变化**:
- **orchestration_status.json**: 替代分散的状态文件，统一管理阶段和进度
- **TASKS.md**: 单文件管理所有任务，替代多个 TASK_*.md
- **tasks/*.completed**: 简单的完成标记，避免复杂的任务状态管理
- **IMPLEMENTATION_PLAN.md**: dev-implementer代理为当前任务生成的详细技术方案

### Git 分支
- 分支命名: `feature/${reqId}-${slug(title)}`
- 提交格式: `feat(${reqId}): ${taskTitle} - ${summary}`

### PR 创建
自动生成包含以下信息的 PR:
- 标题: `${reqId} ${title}`
- 描述: 链接到 PRD、Epic、Tasks、Test Reports
- 标签: 根据需求类型自动添加

## 实现说明

### 实际执行逻辑
当用户调用 `/flow-new "REQ-123|标题|URL"` 时，主代理 (Claude) 执行以下操作:

```text
1. 解析参数: REQ_ID, TITLE, PLAN_URLS
2. 依次调用阶段化命令:

   /flow-init "REQ-123|标题|URL"
   → 等待完成，检查状态

   /flow-prd "REQ-123"
   → 等待完成，检查状态

   ## 条件检测: UI需求判断
   → 读取 PRD.md 内容
   → 检测UI关键词: "用户界面", "前端", "页面", "表单", "按钮"等
   → 检测项目技术栈: package.json, src/components/, public/
   → 如果检测到UI需求:
     /flow-ui "REQ-123"
     → 等待完成，检查状态
   → 如果无UI需求:
     → 跳过UI原型生成
     → 记录: "No UI requirements detected, skipping /flow-ui"

   /flow-epic "REQ-123"
   → 等待完成，检查状态

   /flow-dev "REQ-123"
   → 等待完成，检查状态

   /flow-qa "REQ-123" --full
   → 等待完成，检查状态

   /flow-release "REQ-123"
   → 等待完成，显示PR链接

3. 每个阶段完成后:
   - 检查 orchestration_status.json 状态
   - 如果失败，显示错误并终止
   - 如果成功，显示进度并继续下一阶段

4. 所有阶段完成后:
   - 显示完整的成功摘要
   - 提供PR链接和后续操作建议
```

### 错误处理策略
```text
如果任何阶段失败:
1. 立即终止后续阶段
2. 显示详细错误信息
3. 提示用户修复方法:
   - 手动修复问题
   - 使用对应的阶段命令重试
   - 或使用 /flow-restart 从失败点继续

示例:
  ❌ 阶段 4 失败: 开发执行
  错误: 测试验证失败 - TASK_003 的测试未通过

  修复建议:
  1. 检查测试失败原因: npm test
  2. 修复代码或测试
  3. 继续执行: /flow-dev "REQ-123" --resume
```

## 质量保证

### Constitution 检查贯穿全流程
- **阶段2 (PRD)**: 检查需求完整性，NO PARTIAL IMPLEMENTATION
- **阶段3 (Epic)**: 检查任务分解合理性
- **阶段4 (Dev)**: 检查代码质量，NO CODE DUPLICATION, NO HARDCODED SECRETS
- **阶段5 (QA)**: 检查测试覆盖率和安全性

### Exit Gate 强制检查
每个阶段的输出必须通过质量检查才能进入下一阶段:
- PRD必须完整且通过Constitution检查
- Epic和Tasks必须符合INVEST原则
- 开发必须通过TDD验证
- QA必须达到覆盖率和安全标准

### 不可跳过的检查点
- TEST VERIFICATION CHECKPOINT (测试必须先失败)
- Code Coverage Gate (覆盖率 ≥ 80%)
- Security Gate (无高危安全问题)
- Build Gate (构建必须成功)

## 使用建议

### 适合使用 /flow-new 的场景
✅ 简单明确的需求，不需要中间干预
✅ 演示和学习cc-devflow工作流程
✅ 快速原型开发
✅ 熟悉的需求类型和技术栈

### 建议使用阶段化命令的场景
✅ 复杂需求，需要每个阶段审查
✅ 需要在PRD阶段与需求方确认
✅ 需要在Epic阶段调整任务分解
✅ 开发过程中可能需要暂停和调整
✅ 有经验的开发者，希望更精细控制

### 最佳实践
1. **新用户**: 先用 `/flow-new` 体验完整流程
2. **有经验用户**: 使用阶段化命令，每阶段审查输出
3. **复杂项目**: 始终使用阶段化命令，保持灵活性
4. **关键需求**: 每个阶段都进行人工审查和确认

## 配置选项

### 环境变量
- `DEVFLOW_BASE_BRANCH`: 默认基础分支 (默认: main)
- `DEVFLOW_REQ_ID`: 显式指定需求ID，覆盖分支检测

### 设置文件
在 `.claude/settings.json` 中可配置:
```json
{
  "flow": {
    "baseBranch": "main",
    "requireManualApproval": true,
    "mcpServer": "docs-web"
  }
}
```

## 故障排查

### 问题1: 阶段命令未找到
**症状**: `ERROR: Command /flow-init not found`
**原因**: 阶段化命令文件缺失或未在settings.json中注册
**解决**: 检查 `.claude/commands/` 目录是否包含所有7个命令文件 (flow-init, flow-prd, flow-ui, flow-epic, flow-dev, flow-qa, flow-release)

### 问题2: 状态文件损坏
**症状**: `ERROR: Invalid orchestration_status.json`
**原因**: JSON格式错误或必需字段缺失
**解决**:
```bash
# 手动修复或重新初始化
/flow-init "REQ-123|标题" --force
```

### 问题3: 中途中断后无法恢复
**症状**: 再次运行报错或重复执行已完成的阶段
**解决**:
```bash
# 检查当前状态
/flow-status REQ-123

# 使用恢复命令
/flow-restart "REQ-123"

# 或手动从特定阶段继续
/flow-dev "REQ-123" --resume
```

### 调试信息
设置环境变量启用详细日志:
```bash
export FLOW_DEBUG=1
/flow-new "REQ-123|测试需求"
```

### 日志位置
- 执行日志: `devflow/requirements/${reqId}/LOG.md`
- 错误日志: `.claude/logs/flow-${reqId}.log`
- 调试信息: 控制台输出

### 恢复机制
如果流程中断，可以从特定步骤继续:
```text
/flow:continue "REQ-123" --from=prd
/flow:continue "REQ-123" --from=development
```

## 最佳实践

### 命令使用
1. 确保当前在 main 分支且状态干净
2. 提供准确的需求标题
3. 包含详细的计划文档 URL
4. 在关键节点仔细检查输出

### 需求准备
1. 需求 ID 使用统一格式
2. 计划文档结构化且可访问
3. 提前准备相关背景资料
4. 明确验收标准

### 质量控制
1. 不跳过质量闸检查
2. 仔细审查生成的文档
3. 确保测试覆盖率达标
4. 验证安全扫描结果

---

**注意**: 这是一个存储的提示命令，执行时会调用 flow-orchestrator 子代理来完成整个流程。确保已正确配置所有必需的子代理和权限。
