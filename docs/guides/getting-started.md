# Getting Started with cc-devflow

[中文文档](./getting-started.zh-CN.md) | [English](./getting-started.md)

---

## Overview

CC-DevFlow has two entry paths:

- `cc-devflow init`: install the whole `.claude` pack into your project
- `cc-devflow adapt`: generate platform outputs such as Codex rules

The workflow itself is driven by five visible skills:

```text
roadmap

req-plan -> req-do -> req-check -> req-act
```

## Prerequisites

- Node.js 18+
- A Git repository
- Claude Code or another supported agent environment

## Install

### Whole Pack Install

```bash
npx cc-devflow init --dir /path/to/your/project
```

### Single Skill Install

```bash
npx skills add https://github.com/Dimon94/cc-devflow --skill roadmap
```

## Adapt For A Platform

```bash
npx cc-devflow adapt --cwd /path/to/your/project --platform codex
npx cc-devflow adapt --cwd /path/to/your/project --platform cursor
npx cc-devflow adapt --cwd /path/to/your/project --platform qwen
npx cc-devflow adapt --cwd /path/to/your/project --platform antigravity
```

## Verify Installation

Check that the expected skill folders exist:

```bash
find .claude/skills -mindepth 1 -maxdepth 1 -type d | sort
find .claude/skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
```

If you adapted for Codex, verify the generated rule file:

```bash
find .codex/skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
```

## First Workflow

Use the skills in this order:

```text
1. roadmap
2. req-plan
3. req-do
4. req-check
5. req-act
6. repeat
```

Typical outputs:

- `roadmap` writes `ROADMAP.md` and `BACKLOG.md`
- `req-plan` writes `BRAINSTORM.md`, `DESIGN.md`, `TASKS.md`, `task-manifest.json`
- `req-check` writes `report-card.json`
- `req-act` writes `RELEASE_NOTE.md` and `pr-brief.md`

## Upgrade

Refresh the whole pack with the latest packaged CLI:

```bash
npx cc-devflow@latest init --dir /path/to/your/project
```

Refresh generated platform outputs:

```bash
npx cc-devflow adapt --cwd /path/to/your/project --all
```

Refresh one installed skill:

```bash
npx skills update
```

## Troubleshooting

### `.claude` already exists

```bash
npx cc-devflow init --dir /path/to/your/project --force
```

### No Codex output generated

Run:

```bash
npx cc-devflow adapt --cwd /path/to/your/project --platform codex
```

If your project has no optional `.claude/commands/` input, this is expected: the compiler will still generate the skills registry and rules entry files.

## Next Steps

- [CLI And Skills](../commands/README.md)
- [Workflow Guide](./workflow-guide.md)
- [Best Practices](./best-practices.md)
- [Project README](../../README.md)
