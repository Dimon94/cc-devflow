# cc-devflow 快速开始

[中文文档](./getting-started.zh-CN.md) | [English](./getting-started.md)

---

## 概览

CC-DevFlow 现在有两条入口：

- `cc-devflow init`：把整包 `.claude` 安装到你的项目里
- `cc-devflow adapt`：生成 Codex、Cursor、Qwen、Antigravity 等平台产物

真正的工作流由 5 个可见 Skill 组成：

```text
roadmap

req-plan -> req-do -> req-check -> req-act
```

## 前置条件

- Node.js 18+
- 已初始化的 Git 仓库
- Claude Code 或其他受支持的 Agent 环境

## 安装

### 整包安装

```bash
npx cc-devflow init --dir /path/to/your/project
```

### 单个 Skill 安装

```bash
npx skills add https://github.com/Dimon94/cc-devflow --skill roadmap
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

如果已经适配 Codex，再检查生成的规则文件：

```bash
find .codex/skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
```

## 第一次跑工作流

按这个顺序使用 Skill：

```text
1. roadmap
2. req-plan
3. req-do
4. req-check
5. req-act
6. repeat
```

常见产物：

- `roadmap` 产出 `ROADMAP.md` 和 `BACKLOG.md`
- `req-plan` 产出 `BRAINSTORM.md`、`DESIGN.md`、`TASKS.md`、`task-manifest.json`
- `req-check` 产出 `report-card.json`
- `req-act` 产出 `RELEASE_NOTE.md` 和 `pr-brief.md`

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

### 没有生成 Codex 输出

运行：

```bash
npx cc-devflow adapt --cwd /path/to/your/project --platform codex
```

如果你的项目没有可选的 `.claude/commands/` 输入目录，这也是正常的；编译器仍然会生成 skills registry 和 rules entry。

## 下一步

- [CLI 与 Skill](../commands/README.zh-CN.md)
- [工作流详解](./workflow-guide.md)
- [最佳实践](./best-practices.md)
- [项目 README](../../README.zh-CN.md)
