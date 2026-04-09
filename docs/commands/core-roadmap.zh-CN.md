# `/core:roadmap` - 生成产品路线图

## 概述

`/core:roadmap` 通过 6 阶段对话收敛项目级规划，并在 `devflow/` 下生成可持续维护的路线图工件。

这条命令现在采用 LLM-native 规划模型：
- `llm_effort` 是主排期单位
- `human_effort` 只保留为风险和沟通参考
- `completeness` 表示范围完整性，不表示进度
- `scope_shape` 强制区分 `lake` 和 `ocean`
- 每个路线图项都必须保留 item-level `Acceptance Criteria`

## 语法

```bash
/core:roadmap
/core:roadmap --regenerate
/core:roadmap --resume
```

## 适用场景

推荐：
- 规划未来一个季度的产品方向
- 重排或重写 roadmap/backlog
- 把模糊目标收敛成可落地里程碑

不推荐：
- 单个具体需求的开发执行，这种场景请走 `/flow:init`

## 规划模型

### 核心字段

| 字段 | 含义 | 角色 |
|------|------|------|
| `llm_effort` | LLM 时代的交付工时 | 主排期真相源 |
| `human_effort` | 传统团队口径工时 | 仅用于风险校准 |
| `completeness_score` | 该项是否被定义成完整交付闭环 | 表示范围完整性，不是进度 |
| `scope_shape` | `lake` 或 `ocean` | 强制做正确拆分 |
| `acceptance_criteria` | 2-3 条可观察完成标准 | 单项完成定义 |

### Lake 与 Ocean

- `lake`：可以在一个规划周期内完整交付
- `ocean`：单项过大，必须先拆分再排期

## 执行流程

命令整体是 6 阶段对话，前后各带系统阶段用于上下文检测和文档生成。

```text
系统 Stage 0: 检测上下文、当前季度、基线 velocity
Stage 1: 收敛愿景声明
Stage 2: 分析已有需求与延伸方向
Stage 3: 收集候选项及 effort / completeness / scope_shape / acceptance criteria
Stage 4: 整理依赖关系
Stage 5: 规划季度时间线
Stage 6: 最终确认
系统 Stage 7-8: 生成 ROADMAP.md、BACKLOG.md、ARCHITECTURE.md 并回报结果
```

## 输出文件

- `devflow/ROADMAP.md`
  - 愿景声明
  - 里程碑总览与季度规划
  - 依赖图
  - 速度校准
  - completeness / lake-ocean review
  - 每个 RM 的 acceptance criteria

- `devflow/BACKLOG.md`
  - 按优先级排列的路线图项
  - 商业价值、工时、依赖
  - completeness 与 scope shape 判断
  - 每个 RM 的 acceptance criteria

- `devflow/ARCHITECTURE.md`
  - 与路线图拆分结果保持一致的架构图

## 阅读提示

- `Acceptance Criteria` 和 `Completeness` 不是一回事。
- `Acceptance Criteria` 回答的是：“这项完成时，外界能看到什么证据？”
- `Completeness` 回答的是：“这项定义本身是不是完整闭环，而不是一个 shortcut 碎片？”

## 相关命令

- [`/flow:init`](./flow-init.md) - 把某个 roadmap item 转成正式需求
- [`/core:architecture`](./core-architecture.md) - 基于路线图上下文生成架构

## 深度阅读

- [ROADMAP_TEMPLATE](../../.claude/docs/templates/ROADMAP_TEMPLATE.md)
- [BACKLOG_TEMPLATE](../../.claude/docs/templates/BACKLOG_TEMPLATE.md)
- [ROADMAP_DIALOGUE_TEMPLATE](../../.claude/docs/templates/ROADMAP_DIALOGUE_TEMPLATE.md)
