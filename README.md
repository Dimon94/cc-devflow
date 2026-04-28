# cc-devflow

> Agent-first development workflow for roadmap, planning, investigation, implementation, verification, and shipping.

[![GitHub stars](https://img.shields.io/github/stars/Dimon94/cc-devflow?style=social)](https://github.com/Dimon94/cc-devflow/stargazers)
[![npm version](https://img.shields.io/npm/v/cc-devflow.svg)](https://www.npmjs.com/package/cc-devflow)
[![Node.js >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](./package.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

[中文文档](./README.zh-CN.md) | [English](./README.md) | [Getting Started](./docs/guides/getting-started.md) | [Contributing](./CONTRIBUTING.md) | [Security](./SECURITY.md)

CC-DevFlow is a small, explicit workflow system for agent coding. It gives an AI agent one roadmap entry point, then routes every change through either a feature loop or a bug-investigation loop before work can be called done.

```text
cc-roadmap

PDCA: cc-plan        -> cc-do -> cc-check -> cc-act
IDCA: cc-investigate -> cc-do -> cc-check -> cc-act
```

## Why cc-devflow

- **Small public surface**: six visible workflow skills plus a CLI for installation and platform adaptation.
- **Evidence before done**: implementation must pass through verification proof before shipping or handoff.
- **Skill-first distribution**: the public contract lives in `.claude/skills/<skill>/SKILL.md` and `PLAYBOOK.md`, not in hidden runtime behavior.
- **Multi-platform output**: install once, then adapt for Codex, Cursor, Qwen, Antigravity, and related agent environments.
- **Durable project memory**: roadmap, specs, planning, review, and handoff artifacts stay in `devflow/`; temporary worker scratch stays outside durable truth.

## Quick Start

Prerequisites:

- Node.js 18+
- npm or a compatible package runner
- A Git repository
- Claude Code or another supported agent environment

Install the whole skill pack:

```bash
npx cc-devflow@latest init --dir /path/to/your/project
```

Generate platform outputs:

```bash
npx cc-devflow@latest adapt --cwd /path/to/your/project --platform codex
npx cc-devflow@latest adapt --cwd /path/to/your/project --platform cursor
npx cc-devflow@latest adapt --cwd /path/to/your/project --platform qwen
npx cc-devflow@latest adapt --cwd /path/to/your/project --platform antigravity
```

Refresh every supported platform output:

```bash
npx cc-devflow@latest adapt --cwd /path/to/your/project --all
```

After installation, ask your agent to use the workflow skills directly. Start with `cc-roadmap` for product direction, use `cc-plan` for new work, use `cc-investigate` for bugs, then continue through `cc-do`, `cc-check`, and `cc-act`.

## Workflow Skills

| Skill | Use it when | Main output |
| --- | --- | --- |
| `cc-roadmap` | You need product direction, staged scope, or backlog order | `devflow/ROADMAP.md`, `devflow/BACKLOG.md` |
| `cc-plan` | A feature or change needs scope, design, and task freezing | `planning/design.md`, `planning/tasks.md`, `task-manifest.json` |
| `cc-investigate` | A bug needs symptom, reproduction, root cause, and repair boundary | `planning/analysis.md`, `planning/tasks.md`, `task-manifest.json` |
| `cc-do` | Planned or investigated work needs implementation | code, tests, checkpoints, scratch runtime |
| `cc-check` | Work needs fresh verification evidence | `report-card.json` |
| `cc-act` | Verified work needs a PR, local handoff, release note, or closeout | one final handoff file |

Maintenance skills are shipped with the pack:

- `cc-spec-init`: initialize and maintain durable capability specs under `devflow/specs/`
- `cc-simplify`: review changed code for reuse, quality, efficiency, and spec drift

## Planning Quality Gates

`cc-roadmap` now records planning posture, evidence maturity, canonical project language, and durable decision context before recommending a route. That keeps idea-stage, active-user, paying-customer, infrastructure, and recovery work from being forced through the same questions, and prevents roadmap items from inventing a second vocabulary. Developer-facing or operator-facing roadmap items also carry target user, time to first value, magic moment, adoption bottleneck, and domain handoff into `cc-plan`.

`cc-plan` freezes more implementation decisions before `cc-do` starts. Non-trivial plans compare minimal viable and ideal architecture options, full designs include decision horizon plus error/rescue mapping, and test-first plans record test framework evidence, coverage quality, mandatory regression tests, interface depth, and vertical tracer-bullet slices when existing behavior changes.

## Installation Modes

### Whole-pack install

Use this when you want the complete `.claude` skill pack:

```bash
npx cc-devflow@latest init --dir /path/to/your/project
npx cc-devflow@latest init --dir /path/to/your/project --force
```

`--force` upgrades only cc-devflow-managed distributed skills and preserves unrelated project files under `.claude`.

### Source checkout

When developing this repository locally:

```bash
node bin/cc-devflow-cli.js --help
node bin/cc-devflow-cli.js init --dir /tmp/example-project
node bin/cc-devflow-cli.js adapt --cwd /tmp/example-project --platform codex
```

### Single-skill install with skills.sh

[skills.sh](https://skills.sh/) is supported as a single-skill distribution channel:

```bash
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-roadmap
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-plan
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-investigate
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-do
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-check
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-act
```

Use `cc-devflow init` for the full pack, `cc-devflow adapt` for generated platform outputs, and `skills add` only when you want one skill at a time.

## Configuration

CC-DevFlow reads layered YAML config before durable workflow documents are written:

```text
~/.cc-devflow/config.yml
<repo>/.cc-devflow/config.yml
<repo>/.cc-devflow/config.local.yml
```

Precedence is deterministic: defaults < user < project < local < environment < CLI. `output.document_language` is machine-enforced and currently supports `en` and `zh-CN`. Non-standard preferences belong under `agent_preferences`; they guide style but do not override workflow contracts.

```yaml
version: 1
output:
  document_language: en
agent_preferences:
  general:
    - Start with the conclusion.
  documentation:
    - Keep headings short and avoid marketing language.
```

Useful commands:

```bash
npx cc-devflow config init --cwd /path/to/your/project --project
npx cc-devflow config set output.document_language zh-CN --cwd /path/to/your/project --project
npx cc-devflow config resolve --cwd /path/to/your/project --format policy
npx cc-devflow config doctor --cwd /path/to/your/project
```

See [`config/user-config.template.yml`](./config/user-config.template.yml) for the full sample.

## Repository Format

Distributed skills live in `.claude/skills/`:

```text
.claude/skills/<skill>/
├── SKILL.md
├── PLAYBOOK.md
├── assets/
├── references/
└── scripts/
```

Each shipped skill keeps its runtime contract local:

- `SKILL.md` has YAML frontmatter plus the `Harness Contract`
- `PLAYBOOK.md` has the `Visible State Machine`
- local resources stay beside the skill that owns them

The currently distributed skill folders are:

- `.claude/skills/cc-roadmap/`
- `.claude/skills/cc-plan/`
- `.claude/skills/cc-investigate/`
- `.claude/skills/cc-do/`
- `.claude/skills/cc-check/`
- `.claude/skills/cc-act/`
- `.claude/skills/cc-spec-init/`
- `.claude/skills/cc-simplify/`

## Durable vs Ephemeral

- `devflow/specs/` stores durable capability truth: `INDEX.md` plus `capabilities/*.md`.
- New change directories use `REQ-<number>-<description>` for requirements or `FIX-<number>-<description>` for bug fixes.
- `devflow/changes/<change>/` stores durable change truth: `change-state.json`, `change-meta.json`, planning docs, `task-manifest.json`, `team-state.json`, task `checkpoint.json`, `report-card.json`, and one final handoff file.
- `devflow/workspaces/<change>/` stores ephemeral runtime scratch such as worker assignment, journals, prompts, and session logs.
- Regenerable files should not be persisted under `devflow/changes/`.

For complete artifact examples, start with [`docs/examples/START-HERE.md`](./docs/examples/START-HERE.md). Example version bindings live in [`docs/examples/example-bindings.json`](./docs/examples/example-bindings.json).

## Development

```bash
git clone https://github.com/Dimon94/cc-devflow.git
cd cc-devflow
npm install
npm test
npm run verify
```

Publish validation:

```bash
npm run verify:publish
```

The main contributor guide is [`CONTRIBUTING.md`](./CONTRIBUTING.md). It explains the public surface rules, local CLI smoke tests, documentation rules, and PR expectations.

## Community

- Star the project if the workflow is useful: [GitHub stars](https://github.com/Dimon94/cc-devflow/stargazers)
- Open issues for reproducible bugs, stale docs, or missing platform adapters.
- Keep PRs focused: one skill, one CLI behavior, one compiler/adaptation fix, or one documentation cleanup.
- If a shipped skill changes, update its `version`, local `CHANGELOG.md`, examples, and affected public docs in the same PR.
- Read the [Code of Conduct](./CODE_OF_CONDUCT.md) before participating in project discussions.
- Report vulnerabilities through the [Security Policy](./SECURITY.md), not public issues.

## Star History

<a href="https://www.star-history.com/#Dimon94/cc-devflow&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=Dimon94/cc-devflow&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=Dimon94/cc-devflow&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=Dimon94/cc-devflow&type=Date" />
  </picture>
</a>

## License

[MIT](./LICENSE)
