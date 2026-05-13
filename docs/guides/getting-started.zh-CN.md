# cc-devflow 快速开始

[中文文档](./getting-started.zh-CN.md) | [English](./getting-started.md)

---

## 概览

CC-DevFlow 现在有两条入口：

- `cc-devflow init`：把整包 `.claude` 安装到你的项目里
- `cc-devflow adapt`：生成 Codex、Cursor、Qwen、Antigravity 等平台产物

核心工作流可以手动走 PDCA/IDCA Skill，也可以通过 PR harness Skill 自动推进：

```text
cc-roadmap -> cc-next -> cc-dev

PDCA: cc-plan -> [cc-review] -> cc-do -> [cc-review] -> cc-check -> cc-act
IDCA: cc-investigate -> [cc-review] -> cc-do -> [cc-review] -> cc-check -> cc-act
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

整包安装会带上 roadmap、next-work selection、autonomous dev、手动 PDCA/IDCA、可选 `cc-review`、PR review/landing，以及维护用的 `cc-spec-init` 和 `cc-simplify`。

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
3. 复杂计划或调查根因冻结后可选 cc-review
4. cc-do
5. 复杂实现可选 cc-review
6. cc-check
7. cc-act
8. repeat
```

常见产物：

- `cc-roadmap` 产出可编辑真相 `devflow/roadmap.json`，再生成 `devflow/ROADMAP.md` 和 deprecated `devflow/BACKLOG.md`
- `cc-spec-init` 产出 `devflow/specs/INDEX.md`、capability spec 和 `change-meta.json`
- `cc-plan` 产出 `planning/tasks.md#Contract Summary`，再由 CLI 生成 `task-manifest.json` 和 `change-meta.json`
- `cc-investigate` 产出 `planning/tasks.md#Root Cause Contract`，再由 CLI 生成 `task-manifest.json` 和 `change-meta.json`
- `cc-review` 产出 `review-ledger.jsonl`、可选 `review-findings.json`，Markdown 报告只在需要时按需渲染
- `cc-check` 产出 `report-card.json`
- `cc-act` 只产出一个最终 handoff 文件：`handoff/pr-brief.md`；release notes、resume entry 和 doc sync 状态都写入这个文件的章节

durable truth 分两层：

- `devflow/specs/`：capability 真相，保留 `INDEX.md` 与 `capabilities/*.md`
- 新 change 目录必须命名为 `REQ-<number>-<description>`（需求）或 `FIX-<number>-<description>`（修复）；`REQ` 和 `FIX` 分别维护自己的递增编号，跨前缀同号不是冲突；并行工作树造成重复编号时，完整 change key 的描述负责区分业务内容，旧小写目录只作为历史兼容读取。
- `devflow/changes/<change>/`：变更真相，保留 CLI 生成的 `change-meta.json`、`planning/tasks.md`、CLI 生成的 `task-manifest.json`、review ledger / findings 记录、debug / failed 的可选 CLI 日志、`report-card.json` 和唯一最终 handoff 文件 `handoff/pr-brief.md`。不要生成任务级 `context.md`、`checkpoint.json` 或 AI 手写过程文件。
- 机器态 JSON 归 CLI 所有：运行 `cc-devflow task-contract compile` / `validate`；不要手写 `task-manifest.json` 或 `change-meta.json`。
- 历史 `planning/design.md`、`planning/analysis.md` 和 `cc-review-*.md` 是旧 change 的可读 fallback，不再是新默认写入。
- worker prompt、journal、assignment、session log 统一放到 `devflow/workspaces/<change>/`，作为 ephemeral scratch。

进入实现前，planning handoff 应该先把证据写实：

- `cc-roadmap` 记录 planning posture、evidence maturity、framing check、依赖图，以及适用时的 developer/operator adoption context。
- `cc-plan` 记录 option roles、implementation surface、decision horizon、error/rescue map、测试框架来源、覆盖质量，以及适用时的 regression-test requirement。

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

Codex 现在会把正式分发的 skill 从 `.claude/skills/<skill>/` 镜像到 `.codex/skills/<skill>/`。这套集合包含公开 workflow skill 和维护类 skill `cc-spec-init`、`cc-simplify`，并且镜像是纯增量的：项目里已有的自定义 Codex skill 不会被删除。

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
- [最小 Artifact 合同](./minimize-artifacts.md)
- [样例入口页](../examples/START-HERE.md)
- [简版样例列表](../examples/README.md)
- [项目 README](../../README.zh-CN.md)
