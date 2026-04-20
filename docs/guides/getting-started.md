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

The whole-pack install includes the six visible workflow skills plus `cc-spec-init` and `cc-simplify` as maintenance helpers.

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

- `cc-roadmap` writes `devflow/ROADMAP.md` and `devflow/BACKLOG.md`; helper sync can also maintain `devflow/roadmap-tracking.json` as the shared roadmap/backlog truth source
- `cc-spec-init` writes `devflow/specs/INDEX.md`, capability specs, and `change-meta.json`
- `cc-plan` writes `planning/design.md`, `planning/tasks.md`, `task-manifest.json`, and `change-meta.json`
- `cc-investigate` writes `planning/analysis.md`, `planning/tasks.md`, `task-manifest.json`, and `change-meta.json`
- `cc-check` writes `report-card.json`
- `cc-act` writes exactly one final handoff file: `handoff/pr-brief.md`, `handoff/resume-index.md`, or `handoff/release-note.md`

Capability truth lives in `devflow/specs/`.
Change truth lives in `devflow/changes/<change>/`.

- Keep `INDEX.md` plus capability markdown under `devflow/specs/`.
- Keep `change-state.json`, `change-meta.json`, planning docs, `task-manifest.json`, optional `team-state.json`, task `checkpoint.json`, `report-card.json`, and one final handoff file under each `devflow/changes/<change>/`.
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

`--force` force-upgrades only the distributed cc-devflow skills. It does not delete existing `.claude/commands`, custom skills, or other project-owned files.

### No Codex output generated

Run:

```bash
npx cc-devflow adapt --cwd /path/to/your/project --platform codex
```

If your project has no optional `.claude/commands/` input, this is expected: the compiler will still generate the skills registry and mirror the distributed skill set for Codex.

Codex mirrors the distributed skills from `.claude/skills/<skill>/` into `.codex/skills/<skill>/`. That set includes the six public workflow skills plus `cc-spec-init` and `cc-simplify`, and the mirror is additive-only: existing project-owned Codex skills are preserved instead of being deleted.

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
