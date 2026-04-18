# 🚀 cc-devflow

> Roadmap plus PDCA and IDCA skills for agent coding

CC-DevFlow is a stripped-down workflow for the agent coding era. It gives you one front-door planning skill, `cc-roadmap`, then lets each requirement enter one of two closed loops: the planning loop `cc-plan -> cc-do -> cc-check -> cc-act`, or the investigation loop `cc-investigate -> cc-do -> cc-check -> cc-act`.

[中文文档](./README.zh-CN.md) | [English](./README.md)

---

## 🎯 One-Line Introduction

CC-DevFlow exposes six visible skills:

- `cc-roadmap`: build the project's mid and long-range roadmap
- `cc-plan`: clarify a roadmap item, design it, and turn it into tasks
- `cc-investigate`: freeze symptom, reproduction, root cause, and repair tasks before fixing a bug
- `cc-do`: implement, resume, repair from investigation, and apply review feedback
- `cc-check`: verify with evidence
- `cc-act`: ship, sync docs, and feed the result into the next cycle

## ✨ Core Features

- **Minimal visible surface**: one `cc-roadmap` skill plus two entry loops that share the same `cc-do -> cc-check -> cc-act` tail
- **Multi-platform CLI restored**: `cc-devflow` is back as the distributable CLI for `.claude` installation plus multi-platform adaptation for Codex, Cursor, Qwen, and Antigravity
- **skills.sh-compatible skill layout**: `.claude/skills/<skill>/SKILL.md` stays compatible with single-skill distribution on skills.sh
- **Skill-local resources**: each skill carries its own templates, references, and scripts
- **Explicit, not hidden**: no default context injection, read the files you actually need
- **Task-template first**: keep `planning/tasks.md` and `task-manifest.json` as the execution backbone
- **Skill pack first**: the repository distributes `.claude` skills, playbooks, and assets as one pack
- **Evidence before done**: verification, doc sync, PR brief, and release note live at the end of the loop
- **Roadmap-first**: decide medium-range direction once, then execute through PDCA or IDCA

## 🧠 Mental Model

```text
cc-roadmap

PDCA: cc-plan -> cc-do -> cc-check -> cc-act
IDCA: cc-investigate -> cc-do -> cc-check -> cc-act
```

Use `cc-roadmap` to decide the next 1-3 stages of the product.

Use `cc-plan` when the next problem is scope, design, and task freezing.

Use `cc-investigate` when the next problem is root cause, reproduction, and repair boundary.

Both loops converge into the same `cc-do -> cc-check -> cc-act` tail.

The visible state machine lives in the public skills themselves. The pack is intentionally skill-first: routing, reroutes, recovery, and evidence rules are described in `SKILL.md` and `PLAYBOOK.md`, while `lib/skill-runtime/` is limited to shared support code that those skills reuse.

## 🚀 Install

The built-in CLI is back to the classic `init + adapt` model.

For the packaged CLI, the default entry stays simple:

```bash
npx cc-devflow init --dir /path/to/your/project
```

After installation, the restored CLI supports both pack installation and multi-platform adaptation:

```bash
npx cc-devflow init --dir /path/to/your/project
npx cc-devflow init --dir /path/to/your/project --force
npx cc-devflow adapt --cwd /path/to/your/project --platform codex
npx cc-devflow adapt --cwd /path/to/your/project --platform cursor
npx cc-devflow adapt --cwd /path/to/your/project --platform qwen
npx cc-devflow adapt --cwd /path/to/your/project --platform antigravity
```

Whole-pack installation ships the six visible workflow skills plus the maintenance skill `cc-simplify`.
`init --force` now force-upgrades only the managed distributed skills and preserves unrelated project files under `.claude`.

If you are running from a source checkout instead of an installed package, use `node bin/cc-devflow-cli.js ...` or `npm exec -- cc-devflow ...`.

## 🧩 skills.sh Distribution

[skills.sh](https://skills.sh/) is supported only as a distribution channel for the new `.claude` skills.

Because skills.sh installs skills one by one, use it to pull the specific skills you want:

```bash
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-roadmap
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-plan
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-investigate
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-do
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-check
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-act
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-simplify
```

Use `cc-devflow init` when you want the whole `.claude` pack.

Use `cc-devflow adapt` when you want generated multi-platform outputs.

Use skills.sh when you want to install or refresh a single skill.

## 🔁 Upgrade

Refresh the packaged `.claude` bundle with the latest CLI:

```bash
npx cc-devflow@latest init --dir /path/to/your/project
npx cc-devflow@latest adapt --cwd /path/to/your/project --all
```

Upgrade installed skills with the skills CLI lifecycle commands:

```bash
npx skills check
npx skills update
```

If you only want to refresh one skill immediately, re-run its `npx skills add ... --skill ...` command.

## 🧱 Repository Format

CC-DevFlow keeps the `.claude` skill folders compatible with skills.sh single-skill distribution:

- one skill per folder
- one `SKILL.md` per distributed skill
- YAML frontmatter at the top of each `SKILL.md`
- public skills declare structured runtime contract fields in frontmatter: `triggers`, `reads`, structured `writes`, `effects`, `entry_gate`, `exit_criteria`, `reroutes`, `recovery_modes`, `tool_budget`
- bundled local resources beside the skill, such as `PLAYBOOK.md`, `assets/`, `scripts/`, and `references/`

Public skills also carry two explicit text contracts:

- `SKILL.md` includes a `Harness Contract` section
- `PLAYBOOK.md` includes a `Visible State Machine` section

In this repository, the distributed skill folders are:

- `.claude/skills/cc-roadmap/`
- `.claude/skills/cc-plan/`
- `.claude/skills/cc-investigate/`
- `.claude/skills/cc-do/`
- `.claude/skills/cc-check/`
- `.claude/skills/cc-act/`
- `.claude/skills/cc-simplify/`

## 🛠️ Use

The skill sequence remains:

```text
1. cc-roadmap
2. choose cc-plan or cc-investigate
3. cc-do
4. cc-check
5. cc-act
6. repeat
```

You do not need to remember command names.

The `cc-devflow` CLI remains the whole-pack installation and adaptation path.

skills.sh remains the single-skill distribution path for distributed `.claude/skills/*`.

## 📦 Outputs

- `cc-roadmap` writes `devflow/ROADMAP.md` and `devflow/BACKLOG.md`
- `cc-plan` writes `planning/design.md`, `planning/tasks.md`, `task-manifest.json`
- `cc-investigate` writes `planning/analysis.md`, `planning/tasks.md`, `task-manifest.json`
- `cc-do` writes code, tests, task `checkpoint.json`, and workspace scratch runtime
- `cc-check` writes `report-card.json`
- `cc-act` writes exactly one final handoff file: `handoff/pr-brief.md`, `handoff/resume-index.md`, or `handoff/release-note.md`

## Durable vs Ephemeral

- `devflow/changes/<change>/` stores durable truth only: `change-state.json`, planning docs, `task-manifest.json`, `team-state.json`, task `checkpoint.json`, `report-card.json`, and one final handoff file.
- `devflow/workspaces/<change>/` stores ephemeral runtime scratch such as worker assignment, journals, prompts, and session logs.
- If a file can be regenerated from durable truth, it should not be persisted under `devflow/changes/`.

See [docs/examples/START-HERE.md](./docs/examples/START-HERE.md) for the single entry page to the example set. Example version bindings live in [docs/examples/example-bindings.json](./docs/examples/example-bindings.json).

## Principles

- Roadmap before execution
- Plan before feature code
- Investigate before bug repair
- Root cause before fix
- Evidence before done
- Ship, then feed the result into the next plan

## Verification

```bash
find .claude/skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
find .claude/skills -mindepth 2 -maxdepth 3 -type f | sort
npm run verify
```
