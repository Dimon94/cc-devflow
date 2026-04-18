# cc-devflow 快速开始

[中文文档](./getting-started.zh-CN.md) | [English](./getting-started.md)

---

## 概览

CC-DevFlow 现在有两条入口：

- `cc-devflow init`：把整包 `.claude` 安装到你的项目里
- `cc-devflow adapt`：生成 Codex、Cursor、Qwen、Antigravity 等平台产物

真正的工作流由 6 个可见 Skill 组成：

```text
cc-roadmap

PDCA: cc-plan -> cc-do -> cc-check -> cc-act
IDCA: cc-investigate -> cc-do -> cc-check -> cc-act
```

公开 Skill 本身就是可见 harness。现在每个分发 `SKILL.md` 都带结构化 frontmatter 和 `Harness Contract`，每个 `PLAYBOOK.md` 都带 `Visible State Machine`，不再依赖隐藏运行时语义来理解阶段流转。

## 前置条件

- Node.js 18+
- 已初始化的 Git 仓库
- Claude Code 或其他受支持的 Agent 环境

## 安装

### 整包安装

```bash
npx cc-devflow init --dir /path/to/your/project
```

整包安装会带上 6 个可见 workflow skill，以及用于 ship 前清理的 `cc-simplify`。

### 单个 Skill 安装

```bash
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-roadmap
```

## 生成平台产物

```bash
npx cc-devflow adapt --cwd /path/to/your/project --platform codex
npx cc-devflow adapt --cwd /path/to/your/project --platform cursor
npx cc-devflow adapt --cwd /path/to/your/project --platform qwen
npx cc-devflow adapt --cwd /path/to/your/project --platform antigravity
```

## 验证安装

检查 Skill 目录是否存在：

```bash
find .claude/skills -mindepth 1 -maxdepth 1 -type d | sort
find .claude/skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
```

如果已经适配 Codex，再检查镜像出来的 skill 目录：

```bash
find .codex/skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
```

## 第一次跑工作流

按这个顺序使用 Skill：

```text
1. cc-roadmap
2. 在 cc-plan 和 cc-investigate 里二选一
3. cc-do
4. cc-check
5. cc-act
6. repeat
```

常见产物：

- `cc-roadmap` 产出 `devflow/ROADMAP.md` 和 `devflow/BACKLOG.md`
- `cc-plan` 产出 `planning/design.md`、`planning/tasks.md`、`task-manifest.json`
- `cc-investigate` 产出 `planning/analysis.md`、`planning/tasks.md`、`task-manifest.json`
- `cc-check` 产出 `report-card.json`
- `cc-act` 只产出一个最终 handoff 文件：`handoff/pr-brief.md`、`handoff/resume-index.md` 或 `handoff/release-note.md`

durable truth 固定放在 `devflow/changes/<change>/`：

- 这里只保留 `change-state.json`、planning 文档、`task-manifest.json`、可选 `team-state.json`、任务级 `checkpoint.json`、`report-card.json` 和唯一的最终 handoff 文件。
- worker prompt、journal、assignment、session log 统一放到 `devflow/workspaces/<change>/`，作为 ephemeral scratch。

公开契约字段的典型形状：

- `triggers`、`reads`、结构化 `writes`、`effects`
- `entry_gate`、`exit_criteria`
- `reroutes`、`recovery_modes`、`tool_budget`

如果你想先看几套完整产物链，再自己开始跑 Skill，可以先读 [../examples/START-HERE.md](../examples/START-HERE.md)。如果你在升级 skill 同时维护样例，可以跑 [../examples/scripts/check-example-bindings.sh](../examples/scripts/check-example-bindings.sh)。

## 升级

通过最新版打包 CLI 刷新整包：

```bash
npx cc-devflow@latest init --dir /path/to/your/project
```

刷新平台产物：

```bash
npx cc-devflow adapt --cwd /path/to/your/project --all
```

刷新单个已安装 Skill：

```bash
npx skills update
```

## 常见问题

### `.claude` 已经存在

```bash
npx cc-devflow init --dir /path/to/your/project --force
```

`--force` 现在只会强制升级 cc-devflow 正式分发的 skill，不会删除现有的 `.claude/commands`、自定义 skill 或其他项目文件。

### 没有生成 Codex 输出

运行：

```bash
npx cc-devflow adapt --cwd /path/to/your/project --platform codex
```

如果你的项目没有可选的 `.claude/commands/` 输入目录，这也是正常的；编译器仍然会生成 skills registry，并为 Codex 镜像正式分发 skill 集合。

Codex 现在会把正式分发的 skill 从 `.claude/skills/<skill>/` 镜像到 `.codex/skills/<skill>/`。这套集合包含 6 个公开 workflow skill 和 `cc-simplify`，并且镜像是纯增量的：项目里已有的自定义 Codex skill 不会被删除。

### 保持 skill 和样例同步

```bash
npm run verify
```

如果你在准备可发布的整包，再跑：

```bash
npm run verify:publish
```

## 下一步

- [CLI 与 Skill](../commands/README.zh-CN.md)
- [工作流详解](./workflow-guide.md)
- [最佳实践](./best-practices.md)
- [样例入口页](../examples/START-HERE.md)
- [简版样例列表](../examples/README.md)
- [项目 README](../../README.zh-CN.md)
