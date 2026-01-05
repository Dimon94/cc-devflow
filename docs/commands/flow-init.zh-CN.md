# `/flow-init` - 初始化需求结构

## 📋 概述

初始化需求目录结构，加载路线图和架构上下文（如果存在）。这是 `/flow-new` 的第一个阶段，也可以单独使用。

## 🎯 语法

```bash
/flow-init "REQ-ID|功能标题"
# 或
/flow-init --interactive
```

## 📖 参数详解

| 参数 | 说明 | 必填 | 示例 |
|------|------|------|------|
| **REQ-ID** | 需求编号 | ✅ | `REQ-123` |
| **功能标题** | 简短描述 | ✅ | `用户认证功能` |
| **--interactive** | 交互式选择 ID | ❌ | 自动选择下一个可用 ID |

> 若标题包含中文/非ASCII，分支名将使用模型意译生成英文语义短语（禁止拼音/音译），文档标题仍保留原始中文。

## 🎬 使用场景

### ✅ 推荐场景
- 单独初始化需求结构
- 已有路线图，需要定位需求
- 需要手动创建文档内容

### ❌ 不推荐场景
- 完整开发流程 → 使用 `/flow-new`
- 恢复开发 → 使用 `/flow-restart`

## 🔄 执行流程

```text
/flow-init "REQ-123|用户认证功能"
  ↓
Stage 1: 前置条件验证
  ├─ 检查 Git 仓库
  ├─ 检查 devflow/ 目录
  └─ 验证 REQ-ID 唯一性
  ↓
Stage 1.5: 路线图与架构上下文加载（NEW）
  ├─ 检查 ROADMAP.md 存在性
  ├─ 定位需求在路线图中的位置
  │  ├─ RM-ID (Roadmap Item ID)
  │  ├─ Milestone (M{n}-Q{q}-{yyyy})
  │  └─ Cluster (功能群组)
  ├─ 加载 ARCHITECTURE.md
  └─ 显示架构上下文
     ├─ Feature Architecture (功能分层)
     ├─ Technical Architecture (技术栈)
     └─ Module Structure (目标模块)
  ↓
Stage 2: 目录结构创建
  ├─ 创建 devflow/requirements/REQ-123/
  ├─ 创建子目录 tasks/, research/
  ├─ 初始化 orchestration_status.json
  └─ 初始化 EXECUTION_LOG.md
  ↓
Stage 2.6: 调研任务分派与决策整合（FIXED）
  ├─ 生成研究任务 (generate-research-tasks.sh)
  ├─ 填充研究决策 (populate-research-tasks.sh)
  └─ 整合研究结论 (consolidate-research.sh)
  ↓
Stage 3: Git 分支创建
  └─ 创建 feature/REQ-123-user-auth 分支（标题英文意译，非拼音）
```

## 💡 示例

### 示例 1: 基础用法

```bash
/flow-init "REQ-123|用户认证功能"
```

**输出示例（带路线图上下文）**:

```text
===================================================================
📍 Requirement Location in Roadmap
===================================================================

📋 Requirement:    REQ-123
🎯 Roadmap Item:   RM-05
📝 Feature:        User Management
📌 Derived From:   Product Backlog

📅 Timeline:
   Quarter:        Q2 2025
   Milestone:      M2-Q2-2025
   Cluster:        Core Features
===================================================================

🏗️  Architecture Context
===================================================================

🎯 Feature Architecture:
   Layer: Core (核心功能层)
   Related Features: Authentication, Authorization

🔧 Technical Architecture:
   Tech Stack Layer: Business Logic + Data Access
   Key Technologies: Node.js, PostgreSQL, Redis

📦 Module Structure:
   Target Modules: src/auth/, src/user/
===================================================================
```

### 示例 2: 交互式模式

```bash
/flow-init --interactive
```

**效果**:
- 自动扫描现有需求编号
- 提示下一个可用 ID（如 REQ-124）
- 引导输入功能标题

## 📂 输出文件结构

```
devflow/requirements/REQ-123/
├── orchestration_status.json    # 状态管理
├── EXECUTION_LOG.md             # 审计轨迹
├── tasks/                       # 任务产物目录
├── research/                    # 研究材料目录
└── (等待后续阶段生成其他文档)
```

## 🔗 相关命令

- [`/flow-new`](./flow-new.md) - 完整开发流程
- [`/core-roadmap`](./core-roadmap.md) - 先生成路线图
- [`/core-architecture`](./core-architecture.md) - 先生成架构
- [`/flow-status`](./flow-status.md) - 查看进度

## 🚨 常见问题

### Q: Stage 1.5 没有加载路线图上下文？

**A**: 检查以下条件：
1. `devflow/ROADMAP.md` 文件是否存在
2. ROADMAP.md 中是否有对应的 RM-ID 映射
3. 使用 `/core-roadmap` 先生成路线图

### Q: 如何手动定位需求到路线图？

**A**: 编辑 `devflow/ROADMAP.md`，在 Implementation Tracking 表格中添加映射：

```markdown
| RM-05 | User Management | ... | REQ-123 | ... |
```

## 📚 深度阅读

- [路线图系统](../guides/roadmap-guide.md)
- [架构上下文加载](../architecture/context-loading.md)
- [目录结构规范](../architecture/directory-structure.md)
