# 🚀 cc-devflow

> 面向 Agent 编程的 cc-roadmap + PDCA / IDCA 技能体系

CC-DevFlow 是一个给 Agent 编程时代准备的极简开发工作流。它只给你一个前置规划 Skill, `cc-roadmap`，然后让每个 requirement 进入两条闭环之一：新需求走 `cc-plan -> cc-do -> cc-check -> cc-act`，bug / regression 走 `cc-investigate -> cc-do -> cc-check -> cc-act`。

[中文文档](./README.zh-CN.md) | [English](./README.md)

---

## 🎯 一句话介绍

CC-DevFlow 现在暴露 6 个可见 Skill：

- `cc-roadmap`: 产出项目的中长期路线图
- `cc-plan`: 澄清 roadmap item，设计方案，拆成任务
- `cc-investigate`: 冻结症状、复现、根因和修复任务，再把 bug 交给执行环
- `cc-do`: 实现、恢复、按调查 handoff 修复 bug、处理 review feedback
- `cc-check`: 用证据做验证
- `cc-act`: ship、同步文档、把结果回写到下一轮

## ✨ 核心特性

- **可见面极小**：1 个 `cc-roadmap` Skill + 2 条共享 `cc-do -> cc-check -> cc-act` 尾段的闭环
- **多平台 CLI 已恢复**：`cc-devflow` 已重新回到可分发 CLI 入口，用于 `.claude` 安装与 Codex、Cursor、Qwen、Antigravity 多平台适配
- **skills.sh 兼容布局**：`.claude/skills/<skill>/SKILL.md` 继续保持可被 skills.sh 单 Skill 分发的结构
- **资源内化到 Skill**：每个 Skill 自带模板、参考资料和脚本
- **白盒优先**：默认不做上下文注入，需要什么文件就显式读取什么文件
- **任务模板保留**：继续以 `planning/tasks.md` 和 `task-manifest.json` 作为执行骨架
- **Skill Pack 优先**：仓库以整包形式分发 `.claude` Skill、playbook 和资源文件
- **先证据后完成**：验证、文档同步、PR brief、release note 都在闭环末端
- **cc-roadmap 先行**：先定中长期方向，再让 requirement 按 PDCA 或 IDCA 执行

## 🧠 心智模型

```text
cc-roadmap

PDCA: cc-plan -> cc-do -> cc-check -> cc-act
IDCA: cc-investigate -> cc-do -> cc-check -> cc-act
```

先用 `cc-roadmap` 决定接下来 1-3 个阶段做什么。

当问题是 feature / scope / task freezing，就走 `cc-plan`。

当问题是 bug 根因 / regression / 复现链，就走 `cc-investigate`。

两条闭环最后都会并回同一条 `cc-do -> cc-check -> cc-act` 主干。

这条可见状态机直接写在公开 Skill 里。整个包现在明确是 skill-first：路由、reroute、恢复和证据规则由 `SKILL.md` 与 `PLAYBOOK.md` 显式声明，`lib/skill-runtime/` 只保留给这些 Skill 复用的薄共享支撑代码。

## 🚀 安装

内置 CLI 已回到经典的 `init + adapt` 模式。

对外打包后的默认入口应保持简洁：

```bash
npx cc-devflow init --dir /path/to/your/project
```

安装后，恢复后的 CLI 同时支持整包安装和多平台适配：

```bash
npx cc-devflow init --dir /path/to/your/project
npx cc-devflow init --dir /path/to/your/project --force
npx cc-devflow adapt --cwd /path/to/your/project --platform codex
npx cc-devflow adapt --cwd /path/to/your/project --platform cursor
npx cc-devflow adapt --cwd /path/to/your/project --platform qwen
npx cc-devflow adapt --cwd /path/to/your/project --platform antigravity
```

如果你不是通过已安装包，而是在源码仓库里调试 CLI，本地运行请用 `node bin/cc-devflow-cli.js ...` 或 `npm exec -- cc-devflow ...`。

## 🧩 skills.sh 分发

[skills.sh](https://skills.sh/) 只作为新的 `.claude` Skill 分发渠道使用。

因为 skills.sh 是按单个 Skill 安装，所以按需拉取对应 Skill：

```bash
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-roadmap
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-plan
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-investigate
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-do
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-check
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-act
```

当你想拿整包 `.claude` 时，用 `cc-devflow init`。

当你想生成多平台产物时，用 `cc-devflow adapt`。

skills.sh 仍然用于按单个 Skill 安装或刷新。

## 🔁 升级

通过最新版 CLI 刷新整包并重新执行适配：

```bash
npx cc-devflow@latest init --dir /path/to/your/project
npx cc-devflow@latest adapt --cwd /path/to/your/project --all
npx skills check
npx skills update
```

如果你只想立刻刷新某一个 Skill，直接重跑它对应的 `npx skills add ... --skill ...` 命令即可。

## 🧱 skills.sh 项目格式

CC-DevFlow 让 `.claude` Skill 目录保持与 skills.sh 单 Skill 分发兼容：

- 一个 Skill 一个目录
- 每个分发 Skill 都有自己的 `SKILL.md`
- `SKILL.md` 顶部使用 YAML frontmatter
- 公开 Skill 的 frontmatter 显式声明 `triggers`、`reads`、结构化 `writes`、`effects`、`entry_gate`、`exit_criteria`、`reroutes`、`recovery_modes`、`tool_budget`
- Skill 的本地资源与说明文件放在同级目录，比如 `PLAYBOOK.md`、`assets/`、`scripts/`、`references/`

同时，公开 Skill 还带两层文本契约：

- `SKILL.md` 里有 `Harness Contract`
- `PLAYBOOK.md` 里有 `Visible State Machine`

这个仓库当前对外分发的 Skill 目录如下：

- `.claude/skills/cc-roadmap/`
- `.claude/skills/cc-plan/`
- `.claude/skills/cc-investigate/`
- `.claude/skills/cc-do/`
- `.claude/skills/cc-check/`
- `.claude/skills/cc-act/`

## 🛠️ 使用

Skill 顺序仍然是：

```text
1. cc-roadmap
2. 在 cc-plan 和 cc-investigate 里二选一
3. cc-do
4. cc-check
5. cc-act
6. repeat
```

你不需要记命令名。

`cc-devflow` CLI 仍然是整包安装与适配路径。

skills.sh 则是已分发 `.claude/skills/*` 的单 Skill 安装路径。

## 📦 产物

- `cc-roadmap` 产出 `ROADMAP.md` 和 `BACKLOG.md`
- `cc-plan` 产出 `planning/design.md`、`planning/tasks.md`、`task-manifest.json`
- `cc-investigate` 产出 `planning/analysis.md`、`planning/tasks.md`、`task-manifest.json`
- `cc-do` 产出代码、测试、任务级 `checkpoint.json`，以及 workspace scratch 运行态
- `cc-check` 产出 `report-card.json`
- `cc-act` 只产出一个最终 handoff 文件：`handoff/pr-brief.md`、`handoff/resume-index.md` 或 `handoff/release-note.md`

## Durable 与 Ephemeral

- `devflow/changes/<change>/` 只保存 durable truth：`change-state.json`、planning 文档、`task-manifest.json`、`team-state.json`、任务级 `checkpoint.json`、`report-card.json`，以及唯一的最终 handoff 文件。
- `devflow/workspaces/<change>/` 只保存 ephemeral runtime scratch，比如 worker assignment、journal、prompt 和 session log。
- 凡是可以从 durable truth 即时再生的内容，都不应该持久化到 `devflow/changes/`。

可以先看 [docs/examples/START-HERE.md](./docs/examples/START-HERE.md) 这个单页入口，它已经把样例选择、按产物反查和样例跳转合在一起了。样例和 skill 的版本绑定真相源在 [docs/examples/example-bindings.json](./docs/examples/example-bindings.json)。

## 原则

- 先 cc-roadmap，再执行
- 新需求先计划，再写代码
- bug 先调查，再修复
- 先根因，再修 bug
- 先证据，再宣布完成
- ship 之后把结果回写到下一轮计划

## 验证

```bash
find .claude/skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
find .claude/skills -mindepth 2 -maxdepth 3 -type f | sort
npm run verify
```
