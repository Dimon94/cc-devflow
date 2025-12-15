# docs/

本目录存放 **cc-devflow 的用户可读文档**（命令说明、上手指南、对外分析报告）。

## 目录结构

```text
docs/
├── CLAUDE.md
├── SPEC_KIT_REFERENCE_ANALYSIS.md
├── SPEC_KIT_ITERATION_BORROWING.md
├── commands/
└── guides/
```

## 文件职责（一句话说清）

- `docs/SPEC_KIT_REFERENCE_ANALYSIS.md`: cc-devflow 与 spec-kit 的总体架构/理念/机制对照（静态对比基线）。
- `docs/SPEC_KIT_ITERATION_BORROWING.md`: 基于 spec-kit 近期迭代（Changelog）的“增量差异”与可借鉴项（动态演进对比）。

## 编写约定

- 面向使用者：优先写“怎么用/怎么做”，其次再写“为什么”。
- 可检索：标题清晰、关键词统一（`/flow-*`、`/core-*`、`/speckit.*`）。
- 可落地：结论必须能映射到具体命令、脚本或模板文件路径。

