# REQ-005: Multi-Platform Adaptation (Compile From `.claude/`)

## 目录结构

```
devflow/requirements/REQ-005/
├── README.md                  # 本需求索引与阶段清单
├── CLAUDE.md                  # 本目录的架构镜像与关键决策（本文件）
├── SOLUTION.md                # 多平台适配新方案（以 .claude 为单一事实源）
├── PRD.md                     # 本需求 PRD（编译式多平台适配）
├── EXECUTION_LOG.md           # 执行事件流水（只追加，不回写）
├── orchestration_status.json  # 编排状态机（机器可读，单一真相源）
└── research/                  # 研究材料（内部/外部）
    ├── research.md
    ├── research-summary.md
    ├── tasks.json
    └── internal/
        ├── codebase-overview.md
        └── spec-kit-source-analysis.md
```

## 核心结论（Solution 摘要）

本需求的关键不在“多写几份命令文件”，而在于把 Claude Code 专属资产（hooks/scripts/skills）变成其他平台可消费形态。

**结论**：采用 **Adapter Compiler（编译器）**，以 `.claude/` 为单一事实源，生成各平台目录产物（`.codex/ .cursor/ .qwen/ .agent/`）。

### 三个关键决策

1. **SSOT**：`.claude/` 是唯一源资产；目标平台目录是可删可重建的生成物。
2. **Skills 渐进加载**：
   - 生成 `Skill Registry`（名称/描述/触发/路径）注入到各平台规则入口文件。
   - 提供 `load_skill(name)` 统一加载入口（脚本工具），必要时再升级为 MCP Server。
3. **Hooks 降级策略**：不强行移植到每个平台；把门禁逻辑“收敛进 /flow-* 命令流程”并在目标平台命令里显式执行。

## 变更日志

- 2025-12-18：新增 `SOLUTION.md`，沉淀多平台编译式适配方案。
- 2025-12-18：同步更新 `devflow/BACKLOG.md`、`devflow/ROADMAP.md`、`devflow/ARCHITECTURE.md` 以匹配新方案。
