# `/flow-new` - 启动新需求开发

## 📋 概述

一键启动完整的需求开发流程，从 PRD 生成到代码交付的完整自动化工作流。

## 🎯 语法

```bash
/flow-new "REQ-ID|功能标题|计划URLs"
```

## 📖 参数详解

| 参数 | 说明 | 必填 | 示例 | 备注 |
|------|------|------|------|------|
| **REQ-ID** | 需求编号 | ✅ | `REQ-123` | 必须唯一，格式为 REQ-NNN |
| **功能标题** | 简短功能描述 | ✅ | `用户认证功能` | 用于 Git 分支命名和文档标题 |
| **计划URLs** | 外部参考链接 | ❌ | `https://docs.example.com/auth` | 可选，多个 URL 用 `\|` 分隔 |

## 🎬 使用场景

### ✅ 推荐场景

| 场景 | 说明 |
|------|------|
| 启动全新功能开发 | 从零开始的新功能需求 |
| 首次创建需求文档 | 需要生成 PRD、EPIC、TASKS 等完整文档 |
| 长期项目启动 | 持续时间超过 1 周的项目 |

### ❌ 不推荐场景

| 场景 | 替代方案 |
|------|----------|
| 恢复中断的开发 | 使用 `/flow-restart "REQ-123"` |
| 修复 Bug | 使用 `/flow-fix "BUG-001\|描述"` |
| 仅初始化目录结构 | 使用 `/flow-init "REQ-123\|标题"` |
| 快速原型验证 | 使用 `/flow-ideate "想法描述"` |

## 🔄 执行流程

```text
/flow-new "REQ-123|用户认证|https://docs.example.com/auth"
  ↓
Stage 1: 初始化 (flow-init)
  ├─ 创建需求目录结构
  ├─ 加载路线图和架构上下文（如果存在）
  ├─ 创建 Git 分支 feature/REQ-123-user-auth
  └─ 初始化 orchestration_status.json
  ↓
Stage 2: PRD 生成 (prd-writer 代理)
  ├─ 分析外部参考链接
  ├─ 研究现有代码库
  ├─ 使用 PRD_TEMPLATE 生成 PRD.md
  └─ 记录到 EXECUTION_LOG.md
  ↓
Stage 3: UI 原型生成 (ui-designer 代理，条件触发)
  ├─ 检测 PRD 中是否有 UI 需求
  ├─ 如有 UI 需求，生成 UI_PROTOTYPE.html
  ├─ 响应式设计（320px/768px/1024px）
  └─ 完整交互状态和真实图片
  ↓
Stage 4: 技术设计 (tech-architect 代理)
  ├─ 分析 PRD + 现有代码库
  ├─ 设计技术方案（避免过度设计）
  ├─ 生成 TECH_DESIGN.md
  └─ Anti-Tech-Creep 强制执行
  ↓
Stage 4.5: 需求质量检查 (checklist-agent，可选) ⭐ 新增
  ├─ 生成类型特定检查清单 (ux, api, security 等)
  ├─ 验证 5 个质量维度
  ├─ 计算完成百分比
  └─ 80% 门禁阈值（进入 EPIC 前）
  ↓
Stage 5: EPIC & TASKS 生成 (planner 代理)
  ├─ 分析 PRD + TECH_DESIGN
  ├─ 使用 EPIC_TEMPLATE 生成 EPIC.md
  ├─ 使用 TASKS_TEMPLATE 生成 TASKS.md
  └─ 任务按 TDD 顺序排列（Phase 1-5）
  ↓
Stage 6: 开发 (dev-implementer 代理 + 主代理执行)
  ├─ dev-implementer 生成 IMPLEMENTATION_PLAN.md
  ├─ 主代理执行代码实现
  ├─ 遵循 TDD：先测试后实现
  └─ 实时更新 TASKS.md 进度
  ↓
Stage 7: QA (qa-tester 代理)
  ├─ 生成 TEST_PLAN.md
  ├─ 执行测试（单元测试、集成测试）
  ├─ 生成 TEST_REPORT.md
  └─ 安全扫描（security-reviewer 代理）
  ↓
Stage 8: Release (release-manager 代理)
  ├─ 生成 RELEASE_PLAN.md
  ├─ 检查发布准备度
  ├─ 创建 Pull Request
  └─ 创建 Git Tag（可选）
```

## 💡 示例

### 示例 1: 基础用法

```bash
/flow-new "REQ-001|用户登录功能"
```

**输出**:
```
devflow/requirements/REQ-001/
├── orchestration_status.json
├── EXECUTION_LOG.md
├── PRD.md
├── EPIC.md
├── TASKS.md
└── ... (其他文档)
```

**Git 分支**: `feature/REQ-001-user-login`

### 示例 2: 带外部参考

```bash
/flow-new "REQ-002|支付集成|https://stripe.com/docs/api"
```

**效果**:
- PRD 中会引用 Stripe API 文档
- 技术设计会考虑 Stripe 集成方案
- 任务分解会包含 Stripe SDK 集成任务

### 示例 3: 多个参考链接

```bash
/flow-new "REQ-003|数据分析|https://doc1.com|https://doc2.com"
```

**效果**:
- 系统会抓取两个外部链接内容
- PRD 中会综合参考两份文档
- `research/` 目录会保存抓取的内容

## 📂 输出文件结构

执行 `/flow-new` 后会生成完整的需求目录：

```
devflow/requirements/REQ-XXX/
├── orchestration_status.json    # 状态管理（阶段、进度、时间戳）
├── EXECUTION_LOG.md             # 完整审计轨迹
├── PRD.md                       # 产品需求文档
├── UI_PROTOTYPE.html            # UI 原型（条件生成）
├── TECH_DESIGN.md               # 技术设计文档
├── checklists/                  # 需求质量检查清单 ⭐ 新增
│   ├── ux.md                    # UX 检查清单
│   ├── api.md                   # API 检查清单
│   └── security.md              # Security 检查清单
├── EPIC.md                      # Epic 规划和分解
├── TASKS.md                     # 单一统一任务列表
├── tasks/                       # 任务执行产物
│   ├── TASK_001.completed
│   ├── TASK_002.completed
│   └── IMPLEMENTATION_PLAN.md
├── research/                    # 外部研究材料（MCP 抓取）
├── TEST_PLAN.md                 # QA 测试策略
├── TEST_REPORT.md               # QA 测试结果
├── SECURITY_PLAN.md             # 安全审查计划
├── SECURITY_REPORT.md           # 安全扫描结果
└── RELEASE_PLAN.md              # 发布 checklist
```

## 🔗 相关命令

- [`/flow-init`](./flow-init.md) - 仅初始化需求结构（不执行后续阶段）
- [`/flow-checklist`](../../.claude/commands/flow-checklist.md) - 需求质量检查（EPIC 前 80% 门禁）⭐ 新增
- [`/flow-restart`](./flow-restart.md) - 恢复中断的开发
- [`/flow-status`](./flow-status.md) - 查看需求开发进度
- [`/flow-verify`](./flow-verify.md) - 验证文档一致性
- [`/flow-fix`](./flow-fix.md) - Bug 修复工作流（替代 flow-new）

## ⚙️ 配置选项

### 环境变量

```bash
# 质量闸配置
export MIN_TEST_COVERAGE=80              # 最小测试覆盖率
export STRICT_TYPE_CHECKING=true         # 严格类型检查

# 流程控制
export FLOW_AUTO_APPROVE=false           # 质量闸是否需要手动批准
export FLOW_SKIP_BACKGROUND=false        # 是否跳过后台进程启动

# MCP 集成
export WEBFETCH_TIMEOUT=30               # 外部链接抓取超时（秒）
export ALLOWED_DOMAINS=""                # 允许抓取的域名白名单
```

### Hooks 配置

`.claude/settings.json` 中的 Hooks 会在 flow-new 执行过程中触发：

- **PreToolUse**: 阻止不合规操作（如违反 TDD 顺序）
- **PostToolUse**: 自动记录文件变更到 EXECUTION_LOG.md
- **Constitution Compliance**: 每个阶段强制执行 Constitution v2.0.0

## 🚨 常见问题

### Q1: flow-new 执行到一半中断了怎么办？

**A**: 使用 `/flow-restart "REQ-123"` 自动检测重启点并继续执行。

### Q2: 如何跳过某些阶段（如 UI 原型）？

**A**: UI 原型是条件触发的。如果 PRD 中没有 UI 需求，会自动跳过。其他阶段暂不支持跳过。

### Q3: 外部链接抓取失败怎么办？

**A**:
1. 检查网络连接
2. 检查 `ALLOWED_DOMAINS` 配置
3. 增加 `WEBFETCH_TIMEOUT` 超时时间
4. 手动将参考内容保存到 `research/` 目录

### Q4: 生成的 PRD 不符合预期？

**A**:
1. 提供更详细的外部参考链接
2. 执行后手动编辑 PRD.md
3. 使用 `/flow-restart "REQ-123" --from=prd` 重新生成

### Q5: 任务顺序不符合 TDD 要求？

**A**: 这是 Bug。TASKS.md 必须按照 Phase 1-5 TDD 顺序排列：
- Phase 1: 测试基础设施
- Phase 2: 单元测试编写
- Phase 3: 集成测试编写
- **Phase 3.5: TEST VERIFICATION CHECKPOINT** (阻塞点)
- Phase 4: 功能实现
- Phase 5: 文档和清理

如果发现顺序错误，请报告 Bug。

## 📊 性能预估

| 需求复杂度 | 预估执行时间 | 生成文件数 | Token 消耗 |
|-----------|-------------|-----------|-----------|
| 简单（CRUD） | 5-10 分钟 | 10-15 个 | ~20K tokens |
| 中等（API 集成） | 15-30 分钟 | 15-20 个 | ~50K tokens |
| 复杂（多模块） | 30-60 分钟 | 20-30 个 | ~100K tokens |

**注**: 实际时间取决于代码库大小、外部链接数量、代理响应速度等因素。

## 🔍 调试模式

启用详细日志查看执行细节：

```bash
export FLOW_DEBUG=1
/flow-new "REQ-123|测试功能"
```

日志文件位置：`.claude/logs/flow-*.log`

## 📚 深度阅读

- [执行模型详解](../architecture/execution-model.md)
- [子代理工作流](../architecture/agent-workflow.md)
- [质量闸系统](../architecture/quality-gates.md)
- [Constitution v2.0.0](../architecture/constitution.md)
