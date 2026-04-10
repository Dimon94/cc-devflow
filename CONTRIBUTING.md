# Contributing to cc-devflow

[中文版](./CONTRIBUTING.zh-CN.md) | [English](./CONTRIBUTING.md)

---

## Overview

cc-devflow is now a skills-first repository with a restored distributable CLI.

Public surface:

- `roadmap`
- `req-plan`
- `req-do`
- `req-check`
- `req-act`
- `cc-devflow init`
- `cc-devflow adapt`

Internal implementation details may still live under `lib/harness/`, but they are not the user-facing CLI anymore.

Maintenance helpers may also exist under `.claude/skills/`, such as `docs-sync`, but they do not change the public five-step workflow story.

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm
- Git

### Install

```bash
git clone https://github.com/YOUR_USERNAME/cc-devflow.git
cd cc-devflow
npm install
```

### Local CLI Smoke Test

When working from source, use the repo-local entrypoint:

```bash
node bin/cc-devflow-cli.js --help
tmpdir=$(mktemp -d)
node bin/cc-devflow-cli.js init --dir "$tmpdir"
node bin/cc-devflow-cli.js adapt --cwd "$tmpdir" --platform codex
rm -rf "$tmpdir"
```

For packaged behavior, validate with:

```bash
npm pack
node scripts/validate-publish.js
```

---

## Project Structure

```text
cc-devflow/
├── .claude/skills/            # Distributed skills
├── bin/                       # CLI entrypoints
├── config/                    # Adapter configuration
├── docs/                      # Public docs
├── lib/adapters/              # Platform adapter layer
├── lib/compiler/              # Multi-platform compiler
├── lib/harness/               # Internal runtime library
├── test/harness/              # CLI distribution regression tests
├── README.md
├── README.zh-CN.md
└── package.json
```

### Contribution Areas

- `.claude/skills/`: skill behavior, assets, references, scripts
- `bin/`: distributable CLI behavior
- `lib/compiler/`: skills/prompts parsing, transformation, emitters, rules generation
- `lib/adapters/`: platform adapter config and validation
- `lib/harness/`: internal runtime semantics
- `docs/`: user-facing documentation

---

## Contribution Rules

### 1. Keep The Public Surface Small

Do not reintroduce old `/flow:*` or `harness:*` CLI instructions into new user docs.

The user-facing story should stay:

- whole pack: `cc-devflow init`
- platform outputs: `cc-devflow adapt`
- workflow execution: visible skills

### 2. Preserve Skills-First Layout

Each shipped skill should keep its own folder:

```text
.claude/skills/<skill>/
├── SKILL.md
├── PLAYBOOK.md
├── assets/
├── references/
└── scripts/
```

If you touch a shipped skill, treat these files as one contract:

- `SKILL.md`
- local `CHANGELOG.md`
- any referenced `PLAYBOOK.md`, `assets/`, `references/`, `scripts/`

Do not change one part of the contract and leave the others stale.

### 3. Keep Distribution Clean

Do not ship transient files in templates or tarballs.

Examples of junk we should exclude:

- `.claude/tsc-cache/`
- `.DS_Store`
- local editor or OS artifacts

### 4. Treat Harness As Internal

If you touch `lib/harness/`, keep the behavior testable, but do not document it as the primary user entry.

---

## Testing

### Main Test Command

```bash
npm test
```

### Focused CLI Regression

```bash
npm test -- --runInBand test/harness/cli-bootstrap.test.js
```

### Publish Validation

```bash
node scripts/validate-publish.js
```

This should confirm:

- the expected CLI files exist
- the expected skills exist
- the packed tarball is clean
- transient cache files are not shipped

---

## Documentation Rules

- README and getting-started docs should default to packaged CLI usage
- contributor-only docs may use `node bin/cc-devflow-cli.js ...`
- `skills.sh` should be documented only as a single-skill distribution path
- do not describe `.claude/commands/` as required structure
- do not describe harness CLI as supported public workflow
- if a shipped skill changes, update that skill's `version`, local `CHANGELOG.md`, and affected public docs in the same PR
- keep the workflow story as five visible skills; document maintenance helpers separately

---

## Pull Requests

Good PRs for this repo usually do one of these cleanly:

- improve a skill
- fix CLI distribution
- fix compiler/adaptation behavior
- clean stale docs
- add focused regression coverage

If a change touches the public surface, update the relevant docs in the same PR.
