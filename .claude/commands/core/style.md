---
name: core-style
description: 'Generate project-level design style guide. Usage: /core-style [--update]'
scripts:
  validate_constitution: .claude/scripts/validate-constitution.sh
---

# /core-style - 项目设计风格指南

## User Input
```text
$ARGUMENTS = "[--update]"
```

## 目标
生成或更新 `devflow/STYLE.md`，作为项目设计 SSOT，供 `/flow:spec`、`/flow:dev`、`/flow:verify` 全链路复用。

## 命令
```text
/core-style            # 新建风格指南
/core-style --update   # 更新已有风格指南
```

## Harness Engineering 增强（多窗口稳定执行）

为避免风格文档在多轮会话中变成“补丁堆”，执行采用 initializer + incremental worker。

### 0. Initializer Session
- 建立 `devflow/.core-harness/style/` 工件：
  - `checklist.json`: token 体系、组件约束、可访问性、响应式、动效、禁用项等验收项（默认 `passes=false`）
  - `progress.md`: 本轮修改与未决项
  - `session-handoff.md`: 下一轮优先任务与验证命令

### 1. Worker Session
- 每轮只处理一个最小块（例如颜色 token、排版 token、某一类组件约束）
- 修改后立即做局部验证，不通过则回滚该块后重试
- 收尾必须同步 checklist/progress/handoff，保持可恢复

### 2. Done Gate
- 只有 checklist 全部 `passes=true` 且第 4 步校验通过，才允许输出“STYLE 生成完成”

## 执行步骤

### 1. 入口检查
- 检查 `devflow/STYLE.md` 是否存在。
- 无 `--update` 且文件已存在时，要求用户确认是否覆盖。
- 记录执行开始到 `EXECUTION_LOG.md`。

### 2. 采集输入
- 新项目：引导用户提供参考 URL / 截图 / HTML+CSS。
- 现有项目：扫描前端代码提取颜色、排版、间距、组件模式。
- 输出分析材料到 `devflow/research/style_analysis.md`。

### 3. 生成 STYLE
- 使用 `.claude/docs/templates/STYLE_TEMPLATE.md` 生成 `devflow/STYLE.md`。
- 必须包含语义化 token 与组件级约束。
- 避免页面级“临时补丁式”描述。

### 4. 校验与落盘
- 校验文件存在：
  - `devflow/STYLE.md`
  - `devflow/research/style_analysis.md`
- 运行宪法检查：
  - `{SCRIPT:validate_constitution} --type style --severity warning`
- 更新 `devflow/project_status.json` 与 `EXECUTION_LOG.md`。

## 与主链集成
- `/flow:spec`：将 STYLE 约束写入需求验收标准。
- `/flow:dev`：实现阶段必须遵循 STYLE token/组件规范。
- `/flow:verify`：质量闸检查样式一致性并产出 gate 结果。

## 输出
```text
✅ devflow/STYLE.md
✅ devflow/research/style_analysis.md
✅ devflow/project_status.json (updated)
✅ EXECUTION_LOG.md (updated)
```

## 异常处理
- STYLE 已存在且用户拒绝覆盖：直接退出，不改动。
- 输入不足：提示补充参考设计，不进入生成阶段。
- 生成失败：保留 `style_analysis.md`，提示修正后重试。
