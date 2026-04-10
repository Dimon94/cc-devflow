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
- **`.claude/skills/` 是真相源**：五个 canonical Skill 拥有流程解释权，`.agents/skills/` 只做镜像分发
- **资源内化到 Skill**：每个 Skill 自带模板、参考资料和脚本
- **白盒优先**：默认不做上下文注入，需要什么文件就显式读取什么文件
- **任务模板保留**：继续以 `TASKS.md` 和 `task-manifest.json` 作为执行骨架
- **薄运行时**：`harness:*` 只作为内部运行时支持，不再是用户心智
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

CC-DevFlow 设计成通过 `skills` CLI 安装：

```bash
npx skills add Dimon94/cc-devflow
```

这遵循官方 [skills.sh CLI 文档](https://skills.sh/docs/cli) 给出的默认模式：`npx skills add <owner>/<skill-name>`。

## 🛠️ 使用

推荐顺序只有这一条：

```text
1. roadmap
2. req-plan
3. req-do
4. req-check
5. req-act
6. repeat
```

你不需要记命令名。

你不需要自带的 cc-devflow CLI。

你只需要 Skill。

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
