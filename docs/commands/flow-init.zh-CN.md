# `/flow:init` - 初始化 Requirement Bootstrap

## 概述

`/flow:init` 是当前 requirement 手动主链的 bootstrap 入口：

```text
/flow:init -> /flow:spec -> /flow:dev -> /flow:verify -> /flow:prepare-pr -> /flow:release
```

它只负责准备最薄的一层 harness runtime 状态。

如果目标还模糊，优先先走 `/flow:autopilot`。

## 语法

```bash
/flow:init "REQ-ID|功能标题|可选URL"
```

## 参数

| 参数 | 说明 | 必填 | 示例 |
|------|------|------|------|
| `REQ-ID` | 需求编号 | 是 | `REQ-123` |
| `功能标题` | 简短描述 | 是 | `用户认证功能` |
| `可选URL` | 可选资料链接，逗号分隔 | 否 | `https://plan.example.com/req-123` |

> 若标题包含中文或非 ASCII，系统可以为分支名生成英文意译，但文档中仍保留原始标题。

## 推荐场景

- 目标已经收敛，只需要进入手动主链
- 已有 intent 笔记或路线图上下文，需要 runtime bootstrap
- 需要先生成 `harness-state.json` 和 `context-package.md`

## 不推荐场景

- 期望单命令完成全部交付
- 需要恢复中断需求，优先使用 `/flow:restart`
- 目标仍然模糊，优先使用 `/flow:autopilot`

## 执行流程

```text
/flow:init "REQ-123|用户认证功能"
  ↓
Stage 1: Bootstrap 校验
  ├─ 校验 REQ-ID 与标题
  ├─ 检查仓库与 devflow/ 可用性
  └─ 组装 goal 文本
  ↓
Stage 2: Harness init
  └─ 写入 devflow/requirements/REQ-123/harness-state.json
  ↓
Stage 3: Harness pack
  └─ 写入 devflow/requirements/REQ-123/context-package.md
  ↓
Stage 4: 继续规划
  ├─ 继续复用 devflow/intent/REQ-123/ 下的语义记忆
  └─ 运行 /flow:spec "REQ-123"
```

## 输出

- `devflow/requirements/REQ-123/harness-state.json`
- `devflow/requirements/REQ-123/context-package.md`

长期语义记忆继续沉淀在：

```text
devflow/intent/REQ-123/
├── summary.md
├── plan.md
└── resume-index.md
```

有些仓库或旧 bootstrap 脚本仍可能生成 `EXECUTION_LOG.md`、`orchestration_status.json` 等 compatibility 文件，但它们不再是主状态面。

## 相关命令

- 目标模糊时优先 `/flow:autopilot`
- `/flow:spec`：把规划输入编译成 `task-manifest.json`
- `/flow:status`：查看当前阶段与下一步动作
- `/flow:restart`：从现有 artifacts 恢复中断工作
