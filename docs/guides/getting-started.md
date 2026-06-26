# Getting Started with cc-devflow

[中文文档](./getting-started.zh-CN.md) | [English](./getting-started.md)

---

## Overview

CC-DevFlow has two entry paths:

- `cc-devflow init`: install the whole `.claude` pack into your project
- `cc-devflow adapt`: generate platform outputs such as Codex rules

The core workflow runs planned work through PDCA and keeps bug work on the lighter `cc-diagnose` hotfix path:

```text
PDCA: cc-plan -> [cc-review] -> cc-do -> [cc-review] -> cc-check -> cc-act
Hotfix: cc-diagnose -> focused fix -> regression proof
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
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-plan
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
1. use cc-plan for planned work, or cc-diagnose directly for bugs
2. optional cc-review for complex frozen plans
3. cc-do
4. optional cc-review for complex implementations
5. cc-check
6. cc-act
7. repeat
```

Typical outputs:

- `cc-plan` writes `task.md#Contract Summary`
- `cc-diagnose` records reproduction, hypotheses, probes, fix evidence, and regression proof in the response or final commit/PR text
- `cc-check` reports verification facts in the response, PR brief, or Git commit
- `cc-act` writes exactly one final PR file, `handoff/pr-brief.md`, or incident postmortem files when a real incident needs a corpse report

Change truth lives in `devflow/changes/<change>/`.

- Name new change directories as `REQ-<number>-<description>` for requirements or `FIX-<number>-<description>` for bug fixes. `REQ` and `FIX` advance as separate local sequences, so cross-prefix duplicates are valid. Parallel worktrees may still repeat numbers; the full change key, especially the description, distinguishes the work. Old lowercase directories are compatibility reads only.
- Keep `task.md`, optional `handoff/pr-brief.md`, and Git commits as change truth. Real recurring failures and classified review escapes may also write incident postmortems under `devflow/postmortems/`. Do not generate extra process files.
- Workflow state is Git-owned: keep `task.md`, commit each completed stage, and do not create extra process files.
- Legacy `planning/design.md`, `planning/analysis.md`, and `cc-review-*.md` are readable fallback inputs for older changes, not new default writes.
- Worker prompts, journals, assignments, and session logs belong under `devflow/workspaces/<change>/` as ephemeral scratch.

Planning handoffs should be evidence-rich before implementation starts:

- `cc-plan` records option roles, implementation surface, decision horizon, error/rescue map, test framework source, coverage quality, confidence-per-minute proof value, focused suite shape, and regression-test requirements when they apply.
- `cc-do` does not treat decorative Red tests as valid TDD evidence; broad snapshots, duplicate happy paths, no-op smoke tests, brittle internal assertions, and overmocked implementation details must be rewritten or routed back to planning.
- `cc-check` re-applies that standard before pass: a green suite must name the behavior it proves, the suite layer, command/runtime, fixture/mock boundary, and low-value tests avoided.
- `cc-act` carries release-readiness gates and remote issue closeout state into PR or handoff output: local checks, config/env, migrations/data, deploy/health, smoke/cleanup, rollback, watch items, verified closures, auto-close-on-merge refs, and related-only issue references.

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

Codex mirrors the distributed skills from `.claude/skills/<skill>/` into `.codex/skills/<skill>/`. That set includes the public workflow skills plus maintenance skills such as `cc-archive` and `cc-simplify`, and the mirror is additive-only: existing project-owned Codex skills are preserved instead of being deleted.

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
