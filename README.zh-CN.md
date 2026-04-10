# 🚀 cc-devflow

> 面向 Agent 编程的 roadmap + PDCA 技能体系

CC-DevFlow 是一个给 Agent 编程时代准备的极简开发工作流。它只给你一个前置规划 Skill, `roadmap`，然后让每个 requirement 沿着 `req-plan -> req-do -> req-check -> req-act` 的 PDCA 闭环前进。

[中文文档](./README.zh-CN.md) | [English](./README.md)

---

## 🎯 一句话介绍

CC-DevFlow 只暴露 5 个可见 Skill：

- `roadmap`: 产出项目的中长期路线图
- `req-plan`: 澄清 roadmap item，设计方案，拆成任务
- `req-do`: 实现、调试、恢复、处理 review feedback
- `req-check`: 用证据做验证
- `req-act`: ship、同步文档、把结果回写到下一轮

## ✨ 核心特性

- **可见面极小**：1 个 roadmap Skill + 4 个 PDCA Skill
- **多平台 CLI 已恢复**：`cc-devflow` 已重新回到可分发 CLI 入口，用于 `.claude` 安装与 Codex、Cursor、Qwen、Antigravity 多平台适配
- **skills.sh 兼容布局**：`.claude/skills/<skill>/SKILL.md` 继续保持可被 skills.sh 单 Skill 分发的结构
- **资源内化到 Skill**：每个 Skill 自带模板、参考资料和脚本
- **白盒优先**：默认不做上下文注入，需要什么文件就显式读取什么文件
- **任务模板保留**：继续以 `TASKS.md` 和 `task-manifest.json` 作为执行骨架
- **Skill Pack 优先**：仓库以整包形式分发 `.claude` Skill、playbook 和资源文件
- **先证据后完成**：验证、文档同步、PR brief、release note 都在闭环末端
- **roadmap 先行**：先定中长期方向，再让 requirement 按 PDCA 执行

## 🧠 心智模型

```text
roadmap

req-plan -> req-do -> req-check -> req-act
```

先用 `roadmap` 决定接下来 1-3 个阶段做什么。

再用 PDCA 闭环逐个执行 roadmap item。

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
npx skills add https://github.com/Dimon94/cc-devflow --skill roadmap
npx skills add https://github.com/Dimon94/cc-devflow --skill req-plan
npx skills add https://github.com/Dimon94/cc-devflow --skill req-do
npx skills add https://github.com/Dimon94/cc-devflow --skill req-check
npx skills add https://github.com/Dimon94/cc-devflow --skill req-act
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
- frontmatter 至少声明 `name` 和 `description`
- Skill 的本地资源与说明文件放在同级目录，比如 `PLAYBOOK.md`、`assets/`、`scripts/`、`references/`

这个仓库当前对外分发的 Skill 目录如下：

- `.claude/skills/roadmap/`
- `.claude/skills/req-plan/`
- `.claude/skills/req-do/`
- `.claude/skills/req-check/`
- `.claude/skills/req-act/`

## 🛠️ 使用

Skill 顺序仍然是：

```text
1. roadmap
2. req-plan
3. req-do
4. req-check
5. req-act
6. repeat
```

你不需要记命令名。

`cc-devflow` CLI 仍然是整包安装与适配路径。

skills.sh 则是已分发 `.claude/skills/*` 的单 Skill 安装路径。

## 📦 产物

- `roadmap` 产出 `ROADMAP.md` 和 `BACKLOG.md`
- `req-plan` 产出 `BRAINSTORM.md`、`DESIGN.md`、`TASKS.md`、`task-manifest.json`
- `req-do` 产出代码、测试和运行时 checkpoint
- `req-check` 产出 `report-card.json`
- `req-act` 产出 `pr-brief.md`、`RELEASE_NOTE.md` 和同步后的文档

## 原则

- 先 roadmap，再执行
- 先计划，再写代码
- 先根因，再修 bug
- 先证据，再宣布完成
- ship 之后把结果回写到下一轮计划

## 验证

```bash
find .claude/skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
find .claude/skills -mindepth 2 -maxdepth 3 -type f | sort
```
