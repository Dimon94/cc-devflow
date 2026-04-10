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
- **Canonical in `.claude/skills/`**: five canonical skills own the workflow; `.agents/skills/` mirrors them for distribution
- **Skill-local resources**: each skill carries its own templates, references, and scripts
- **Explicit, not hidden**: no default context injection, read the files you actually need
- **Task-template first**: keep `TASKS.md` and `task-manifest.json` as the execution backbone
- **Thin runtime**: `harness:*` stays as internal runtime support, not a user-facing CLI
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

CC-DevFlow is meant to be installed through the `skills` CLI:

```bash
npx skills add Dimon94/cc-devflow
```

This follows the official [skills.sh CLI docs](https://skills.sh/docs/cli), which define the default install flow as `npx skills add <owner>/<skill-name>`.

## 🛠️ Use

The intended sequence is:

```text
1. roadmap
2. req-plan
3. req-do
4. req-check
5. req-act
6. repeat
```

You do not need to remember command names.

You do not need a custom cc-devflow CLI.

You only need the skills.

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
