# Getting Started with cc-devflow

[中文文档](./getting-started.zh-CN.md) | [English](./getting-started.md)

---

## Overview

CC-DevFlow has two entry paths:

- `cc-devflow init`: install the whole `.claude` pack into your project
- `cc-devflow adapt`: generate platform outputs such as Codex rules

The workflow itself is driven by six visible skills:

```text
cc-roadmap

PDCA: cc-plan -> cc-do -> cc-check -> cc-act
IDCA: cc-investigate -> cc-do -> cc-check -> cc-act
```

The public skills are the visible harness. Each distributed `SKILL.md` now carries structured frontmatter plus a `Harness Contract`, and each `PLAYBOOK.md` carries the stage transition rules in a `Visible State Machine` section.

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
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-roadmap
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

If you adapted for Codex, verify the mirrored skill folders:

```bash
find .codex/skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
```

## First Workflow

Use the skills in this order:

```text
1. cc-roadmap
2. choose cc-plan or cc-investigate
3. cc-do
4. cc-check
5. cc-act
6. repeat
```

Typical outputs:

- `cc-roadmap` writes `ROADMAP.md` and `BACKLOG.md`
- `cc-plan` writes `planning/design.md`, `planning/tasks.md`, `task-manifest.json`
- `cc-investigate` writes `planning/analysis.md`, `planning/tasks.md`, `task-manifest.json`
- `cc-check` writes `report-card.json`
- `cc-act` writes exactly one final handoff file: `handoff/pr-brief.md`, `handoff/resume-index.md`, or `handoff/release-note.md`

The durable truth lives in `devflow/changes/<change>/`.

- Keep only `change-state.json`, planning docs, `task-manifest.json`, optional `team-state.json`, task `checkpoint.json`, `report-card.json`, and one final handoff file there.
- Worker prompts, journals, assignments, and session logs belong under `devflow/workspaces/<change>/` as ephemeral scratch.

Typical public contract fields:

- `triggers`, `reads`, structured `writes`, `effects`
- `entry_gate`, `exit_criteria`
- `reroutes`, `recovery_modes`, `tool_budget`

If you want to see complete artifact chains before using the skills, start with [../examples/START-HERE.md](../examples/START-HERE.md). If you are updating examples alongside skills, run [../examples/scripts/check-example-bindings.sh](../examples/scripts/check-example-bindings.sh).

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

If your project has no optional `.claude/commands/` input, this is expected: the compiler will still generate the skills registry and mirror the public workflow skills for Codex.

Codex mirrors only the public workflow skills from `.claude/skills/<skill>/` into `.codex/skills/<skill>/`, and removes non-public mirrors discovered from the Claude tree. It no longer keeps a separate aggregate `cc-devflow` skill entry.

### Keep skills and examples in sync

```bash
npm run verify
```

If you are preparing a publishable pack, run:

```bash
npm run verify:publish
```

## Next Steps

- [CLI And Skills](../commands/README.md)
- [Workflow Guide](./workflow-guide.md)
- [Best Practices](./best-practices.md)
- [Example Entry Page](../examples/START-HERE.md)
- [Compact Example List](../examples/README.md)
- [Project README](../../README.md)
