---
name: flow-orchestrator-guide
description: Standard Operating Procedure for main agent when executing canonical /flow:* delivery chain.
type: workflow-guide
---

# 需求开发流程标准作业程序（主链版）

当用户执行需求交付时，主 Agent 按显式主链推进：

```text
/flow:init -> /flow:spec -> /flow:dev -> /flow:verify -> /flow:release
```

## 主 Agent 职责
- 维护全局上下文与最终实现。
- 仅把研究/规划/审查任务分发给对应子代理。
- 在每个阶段结束后写入状态与审计日志。

## 阶段作业

### 1) 初始化 `/flow:init`
- 创建需求目录与运行时上下文。
- 写入初始 `orchestration_status.json`。

### 2) 规格与任务 `/flow:spec`
- 统一完成 PRD、技术方案、UI 约束（按模式可裁剪）。
- 产出可执行 `TASKS.md`，进入 `spec_complete`。

### 3) 开发执行 `/flow:dev`
- 按 task manifest 执行并更新进度。
- 失败任务通过 `--resume` 增量恢复。

### 4) 质量闸 `/flow:verify`
- 快速模式用于日常检查。
- `--strict` 作为发布前唯一准入门禁。

### 5) 发布收口 `/flow:release`
- 仅在 verify 通过后创建发布产物。
- 收尾清理 runtime/worktree 噪音。

## 失败恢复原则
- 不回退整条链，优先从失败阶段重试。
- 优先命令：`/flow:status`、`/flow:dev --resume`、`/flow:verify --strict`。

## 约束
- 必须遵循项目宪法与质量门禁。
- 禁止把旧链路命令（如 `/flow-new`）作为主流程推荐。
