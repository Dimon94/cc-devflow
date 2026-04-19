# docs/

本目录存放 **cc-devflow 的用户可读文档**（命令说明、上手指南、对外分析报告）。

## 目录结构

```text
docs/
├── CLAUDE.md
├── commands/
├── examples/
├── guides/
├── skill-runtime-migration.md
└── v4.3.0-migration-guide.md
```

## 文件职责（一句话说清）

- `docs/commands/`: CLI、分发与平台适配相关文档。
- `docs/examples/`: 端到端样例与样例绑定真相源。
- `docs/guides/`: 上手与迁移类说明。
- `docs/skill-runtime-migration.md`: 旧 runtime 叙事迁移说明。
- `docs/v4.3.0-migration-guide.md`: 对外版本迁移说明。

## 编写约定

- 面向使用者：优先写“怎么用/怎么做”，其次再写“为什么”。
- 可检索：标题清晰、关键词统一（`/flow-*`、`/core-*`、`/speckit.*`）。
- 可落地：结论必须能映射到具体命令、脚本或模板文件路径。
- 目录命名统一使用小写 kebab-case；逻辑 ID 可以保持 `REQ-123`，但目录名必须落成 `req-123-...`。
