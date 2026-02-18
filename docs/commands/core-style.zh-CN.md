# `/core-style` - 生成项目设计风格指南

[English](./core-style.md) | [中文文档](./core-style.zh-CN.md)

生成或更新 `devflow/STYLE.md`，作为项目级设计 SSOT（单一真理源）。

## 语法

```bash
/core-style
/core-style --update
```

## 定位

`/core-style` 是项目级命令（与 `/core-roadmap` 同级），并服务于主链交付：

- `/flow:spec`：读取 STYLE 约束，形成可执行的 UI/UX 验收标准。
- `/flow:dev`：实现阶段强制遵循 STYLE 的 token 与组件规范。
- `/flow:verify`：在质量闸中检查样式一致性。

## 执行流程

1. 识别模式（新建或更新）。
2. 收集风格输入：
- 新项目：参考 URL / 截图 / HTML+CSS。
- 现有项目：从代码中提取设计 token 与组件模式。
3. 生成 `devflow/research/style_analysis.md`。
4. 基于 `STYLE_TEMPLATE.md` 生成 `devflow/STYLE.md`。
5. 执行结构与宪法约束校验。

## 输出

```text
devflow/STYLE.md
devflow/research/style_analysis.md
devflow/project_status.json（更新）
EXECUTION_LOG.md（更新）
```

## STYLE 后的最小交付链

```bash
/flow:init "REQ-123|功能"
/flow:spec "REQ-123"
/flow:dev "REQ-123"
/flow:verify "REQ-123" --strict
```

## 说明

- STYLE 是持续演进的 SSOT，优先使用 `--update`，避免临时散点改样式。
- 风格约束应保持语义化（token/组件级），不要退化成页面级补丁。
