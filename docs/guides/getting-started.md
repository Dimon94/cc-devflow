# Getting Started with cc-devflow

[中文文档](./getting-started.zh-CN.md) | [English](./getting-started.md)

---

## Overview

CC-DevFlow has two entry paths:

- `cc-devflow init`: install the whole `.claude` pack into your project
- `cc-devflow adapt`: generate platform outputs such as Codex rules

The core workflow can run manually through PDCA/IDCA skills or automatically through the PR harness skills:

```text
cc-roadmap -> cc-next -> cc-dev

PDCA: cc-plan -> [cc-review] -> cc-do -> [cc-review] -> cc-check -> cc-act
IDCA: cc-investigate -> [cc-review] -> cc-do -> [cc-review] -> cc-check -> cc-act
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

The whole-pack install includes roadmap, next-work selection, autonomous dev, manual PDCA/IDCA, optional `cc-review`, PR review/landing, plus `cc-spec-init` and `cc-simplify` as maintenance helpers.

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
3. optional cc-review for complex frozen plans or investigations
4. cc-do
5. optional cc-review for complex implementations
6. cc-check
7. cc-act
8. repeat
```

Typical outputs:

- `cc-roadmap` writes `devflow/roadmap.json` as the editable roadmap truth, then generates `devflow/ROADMAP.md` and deprecated `devflow/BACKLOG.md`
- `cc-spec-init` writes `devflow/specs/INDEX.md` and capability specs
- `cc-plan` writes `task.md#Contract Summary`
- `cc-investigate` writes `task.md#Root Cause Contract`
- `cc-review` writes plan/investigation findings into `task.md`; implementation findings stay in the response until the user chooses a repair option; only process/test/design/model-pattern review escapes may be written into `task.md#Failure Ledger`; non-trivial review chains record evidence, diagnosis, Phenomenal/Essential/Philosophical cognitive layers, and a fault-centered causal path that walks up through direct input/caller proof, contract/spec/provider, and source intent/roadmap when available, then down through first affected seam, behavior/artifact, and release/maintenance risk when available; complexity reports include scope, detected stack/test/build commands, ranked findings, before/after complexity, patch status, files-modified yes/no, and needed tests or measurements; structural quality findings cover code-judo simplification, branching/abstraction/type-boundary smells, ownership boundaries, and approval/blocking verdicts
- `cc-check` reports verification facts in the response, PR brief, or Git commit
- `cc-act` writes exactly one final PR file, `handoff/pr-brief.md`, or incident postmortem files when a real incident needs a corpse report

Capability truth lives in `devflow/specs/`.
Change truth lives in `devflow/changes/<change>/`.

- Keep `INDEX.md` plus capability markdown under `devflow/specs/`.
- Name new change directories as `REQ-<number>-<description>` for requirements or `FIX-<number>-<description>` for bug fixes. `REQ` and `FIX` advance as separate local sequences, so cross-prefix duplicates are valid. Parallel worktrees may still repeat numbers; the full change key, especially the description, distinguishes the work. Old lowercase directories are compatibility reads only.
- Keep `task.md`, optional `handoff/pr-brief.md`, and Git commits as change truth. Real recurring failures and classified review escapes may also write incident postmortems under `devflow/postmortems/`. Do not generate extra process files.
- Workflow state is Git-owned: keep `task.md`, commit each completed stage, and do not create extra process files.
- Legacy `planning/design.md`, `planning/analysis.md`, and `cc-review-*.md` are readable fallback inputs for older changes, not new default writes.
- Worker prompts, journals, assignments, and session logs belong under `devflow/workspaces/<change>/` as ephemeral scratch.

Planning handoffs should be evidence-rich before implementation starts:

- `cc-roadmap` records planning posture, evidence maturity, framing check, dependency graph, and any developer/operator adoption context.
- `cc-plan` records option roles, implementation surface, decision horizon, error/rescue map, test framework source, coverage quality, and regression-test requirements when they apply.

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

Codex mirrors the distributed skills from `.claude/skills/<skill>/` into `.codex/skills/<skill>/`. That set includes the public workflow skills plus maintenance skills `cc-spec-init` and `cc-simplify`, and the mirror is additive-only: existing project-owned Codex skills are preserved instead of being deleted.

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
- [Minimized Artifact Contract](./minimize-artifacts.md)
- [Example Entry Page](../examples/START-HERE.md)
- [Compact Example List](../examples/README.md)
- [Project README](../../README.md)
