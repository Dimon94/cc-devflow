# 🚀 cc-devflow

> Roadmap plus PDCA skills for agent coding

CC-DevFlow is a stripped-down workflow for the agent coding era. It gives you one front-door planning skill, `roadmap`, then runs every requirement through a PDCA loop: `req-plan -> req-do -> req-check -> req-act`.

[中文文档](./README.zh-CN.md) | [English](./README.md)

---

## 🎯 One-Line Introduction

CC-DevFlow exposes only five visible skills:

- `roadmap`: build the project's mid and long-range roadmap
- `req-plan`: clarify a roadmap item, design it, and turn it into tasks
- `req-do`: implement, debug, resume, and apply review feedback
- `req-check`: verify with evidence
- `req-act`: ship, sync docs, and feed the result into the next cycle

## ✨ Core Features

- **Minimal visible surface**: one roadmap skill plus four PDCA stages
- **Multi-platform CLI restored**: `cc-devflow` is back as the distributable CLI for `.claude` installation plus multi-platform adaptation for Codex, Cursor, Qwen, and Antigravity
- **skills.sh-compatible skill layout**: `.claude/skills/<skill>/SKILL.md` stays compatible with single-skill distribution on skills.sh
- **Skill-local resources**: each skill carries its own templates, references, and scripts
- **Explicit, not hidden**: no default context injection, read the files you actually need
- **Task-template first**: keep `TASKS.md` and `task-manifest.json` as the execution backbone
- **Skill pack first**: the repository distributes `.claude` skills, playbooks, and assets as one pack
- **Evidence before done**: verification, doc sync, PR brief, and release note live at the end of the loop
- **Roadmap-first**: decide medium-range direction once, then execute through PDCA

## 🧠 Mental Model

```text
roadmap

req-plan -> req-do -> req-check -> req-act
```

Use `roadmap` to decide the next 1-3 stages of the product.

Use the PDCA loop to execute one roadmap item at a time.

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

If you are running from a source checkout instead of an installed package, use `node bin/cc-devflow-cli.js ...` or `npm exec -- cc-devflow ...`.

## 🧩 skills.sh Distribution

[skills.sh](https://skills.sh/) is supported only as a distribution channel for the new `.claude` skills.

Because skills.sh installs skills one by one, use it to pull the specific skills you want:

```bash
npx skills add https://github.com/Dimon94/cc-devflow --skill roadmap
npx skills add https://github.com/Dimon94/cc-devflow --skill req-plan
npx skills add https://github.com/Dimon94/cc-devflow --skill req-do
npx skills add https://github.com/Dimon94/cc-devflow --skill req-check
npx skills add https://github.com/Dimon94/cc-devflow --skill req-act
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
- `name` and `description` in that frontmatter
- bundled local resources beside the skill, such as `PLAYBOOK.md`, `assets/`, `scripts/`, and `references/`

In this repository, the published skills are:

- `.claude/skills/roadmap/`
- `.claude/skills/req-plan/`
- `.claude/skills/req-do/`
- `.claude/skills/req-check/`
- `.claude/skills/req-act/`

## 🛠️ Use

The skill sequence remains:

```text
1. roadmap
2. req-plan
3. req-do
4. req-check
5. req-act
6. repeat
```

You do not need to remember command names.

The `cc-devflow` CLI remains the whole-pack installation and adaptation path.

skills.sh remains the single-skill distribution path for `.claude/skills/*`.

## 📦 Outputs

- `roadmap` writes `ROADMAP.md` and `BACKLOG.md`
- `req-plan` writes `BRAINSTORM.md`, `DESIGN.md`, `TASKS.md`, `task-manifest.json`
- `req-do` writes code, tests, and runtime checkpoints
- `req-check` writes `report-card.json`
- `req-act` writes `pr-brief.md`, `RELEASE_NOTE.md`, and synced docs

## Principles

- Roadmap before execution
- Plan before code
- Root cause before fix
- Evidence before done
- Ship, then feed the result into the next plan

## Verification

```bash
find .claude/skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
find .claude/skills -mindepth 2 -maxdepth 3 -type f | sort
```
