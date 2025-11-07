# `/flow-roadmap` - 生成产品路线图

## 📋 概述

通过 6 阶段交互式对话生成完整的产品路线图和需求优先级规划。

## 🎯 语法

```bash
/flow-roadmap
```

## 🎬 使用场景

### ✅ 推荐场景
- 项目初期规划产品方向
- 重新梳理需求优先级
- 向团队展示产品规划

### ❌ 不推荐场景
- 单个需求开发 → 使用 `/flow-new`

## 🔄 执行流程（6阶段交互式对话）

```text
Stage 1: 产品愿景与目标
  ├─ 产品定位
  ├─ 核心价值主张
  └─ 长期目标

Stage 2: 目标用户与痛点
  ├─ 用户画像
  ├─ 核心痛点
  └─ 使用场景

Stage 3: 核心功能规划
  ├─ 功能列表
  ├─ 优先级排序
  └─ 功能依赖关系

Stage 4: 技术架构设计
  ├─ 技术栈选择
  ├─ 系统架构
  └─ 技术风险评估

Stage 5: 里程碑与时间线
  ├─ 季度规划 (Q1-Q4)
  ├─ 里程碑定义 (M1, M2, M3...)
  └─ 需求分配到季度

Stage 6: 成功指标定义
  ├─ KPI 定义
  ├─ 验收标准
  └─ 监控指标
```

## 📂 输出文件

- `devflow/ROADMAP.md` - 产品路线图
  - 产品愿景和目标
  - 季度规划 (Q1-Q4)
  - 里程碑定义 (M1-M8)
  - Feature Roadmap 表格
  - Implementation Tracking 表格

- `devflow/BACKLOG.md` - 需求待办列表
  - 按优先级排序的需求列表
  - 需求详细描述
  - 估算和依赖关系

## 💡 示例对话片段

```
Agent: 📋 Stage 1: 产品愿景与目标
请描述您的产品愿景和核心价值主张：

User: 构建一个智能代码审查平台，帮助团队提升代码质量，
      减少人工 Code Review 的时间成本。

Agent: 🎯 Stage 2: 目标用户与痛点
谁是您的目标用户？他们的核心痛点是什么？

User: 目标用户是开发团队的 Tech Lead 和高级工程师。
      痛点：
      1. 人工 Code Review 效率低
      2. 代码质量标准不统一
      3. 新人培养成本高

... (继续 Stage 3-6)
```

## 🔗 相关命令

- [`/flow-architecture`](./flow-architecture.md) - 基于路线图生成架构
- [`/flow-init`](./flow-init.md) - 基于路线图初始化需求
- `.claude/scripts/sync-roadmap-progress.sh` - 同步进度到路线图

## 📚 深度阅读

- [路线图系统详解](../guides/roadmap-guide.md)
- [需求优先级管理](../guides/priority-management.md)
- [ROADMAP_TEMPLATE](../../docs/templates/ROADMAP_TEMPLATE.md)
