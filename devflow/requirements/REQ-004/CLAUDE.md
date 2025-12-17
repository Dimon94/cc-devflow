# REQ-004: Agent Adapter Architecture

## 目录结构

```
devflow/requirements/REQ-004/
├── README.md                  # 本需求索引与阶段清单
├── CLAUDE.md                  # 本目录的架构镜像与关键决策（本文件）
├── REQ-004-code-review.md      # Git 新增文件的高强度 Code Review 报告
├── EXECUTION_LOG.md           # 执行事件流水（只追加，不回写）
├── orchestration_status.json  # 编排状态机（机器可读，单一真相源）
└── research/
    ├── research.md            # 研究结论（架构方向/接口草案）
    ├── research-summary.md    # 研究摘要（面向阅读）
    ├── tasks.json             # 研究任务与决策记录（只读）
    ├── internal/
    │   └── codebase-overview.md # 现有代码结构与集成点分析
    └── clarifications/
        └── 20251217-140906-flow-clarify.md # 澄清报告（时间戳永久存档）
```

## 核心澄清结论（flow-clarify）

- MVP 范围：至少落地 2 个可运行 adapter（`claude-code` + `codex-cli`），其余平台先留 stub。
- DoD：接口规范 + registry + 默认 adapter + 配置机制 + 测试 + 文档 + ≥1 非默认平台 adapter。
- Adapter 选择：显式覆盖（ENV/CLI）> 配置 > detect 打分 > fallback 默认；冲突输出告警。
- 安全策略：capability allow-list；默认 deny `shell/network`；启用必须显式配置并记录审计。
- 最小 NFR：detect 总耗时 <50ms（缓存后 <5ms）+ 结构化日志（adapter/timing/result）。

## 开发规范

- 决策落盘：关键决策同步写入 `orchestration_status.json`（避免“报告里有、状态机里没有”）。
- 过程可追溯：任何阶段推进只追加 `EXECUTION_LOG.md`，不要改历史。
- 澄清报告只增不改：放在 `research/clarifications/`，以时间戳命名，保留审计轨迹。

## 变更日志

- 2025-12-17：完成 REQ-004 澄清并生成 `research/clarifications/20251217-140906-flow-clarify.md`。
- 2025-12-17：新增 `REQ-004-code-review.md`，用于记录 Git 新增文件的审查结论与整改建议。
