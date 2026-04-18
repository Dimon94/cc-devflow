# Project Context

## Canonical Positioning

CC-DevFlow 当前的对外形态是：

- skill-first
- cc-roadmap + PDCA
- packaged CLI for distribution
- multi-platform adaptation
- skill-owned workflow with `lib/skill-runtime` as shared internal support code

用户真正看见的入口只有两类：

- `cc-devflow init` / `cc-devflow adapt`
- `cc-roadmap -> cc-plan -> cc-do -> cc-check -> cc-act`

---

## Visible Flow

### Distribution Layer

```bash
npx cc-devflow init --dir /path/to/project
npx cc-devflow adapt --cwd /path/to/project --platform codex
```

`init` 负责把 `.claude/skills/*` 整包放进目标项目。

`adapt` 负责把 `.claude` 内容编译成 Codex、Cursor、Qwen、Antigravity 的平台产物。

### Workflow Layer

```text
cc-roadmap

cc-plan -> cc-do -> cc-check -> cc-act
```

`skills.sh` 只负责单个 Skill 的分发，不承担整包安装或多平台适配。

---

## Repository Truth

### Source Of Distribution

```text
.claude/skills/
├── cc-roadmap/
├── cc-plan/
├── cc-do/
├── cc-check/
└── cc-act/
```

这五个 Skill 目录是当前仓库的主要分发源。

### Source Of Platform Outputs

```text
bin/
├── cc-devflow-cli.js
├── adapt.js
└── cc-devflow.js

lib/compiler/
config/
```

多平台适配由 compiler + adapters 完成。

### Shared Runtime Layer

```text
lib/skill-runtime/
```

`lib/skill-runtime/` 仍然存在，但它只是给公开 Skill 复用的共享支撑层：

- 可被测试覆盖
- 可被 Skill 或内部模块调用
- 不再承担公开工作流语义

---

## Output Model

常见工作流产物：

- `devflow/ROADMAP.md`
- `devflow/BACKLOG.md`
- `devflow/changes/<change-key>/planning/design.md`
- `devflow/changes/<change-key>/planning/tasks.md`
- `devflow/changes/<change-key>/planning/task-manifest.json`
- `devflow/changes/<change-key>/review/report-card.json`
- `devflow/changes/<change-key>/handoff/status.md`
- `devflow/changes/<change-key>/handoff/pr-brief.md`
- `devflow/changes/<change-key>/handoff/release-note.md`
- `devflow/workspaces/<change-key>/<worker-id>/`

常见平台产物：

- `.codex/skills/*`
- `.cursor/rules/*`
- `.qwen/*`
- `.antigravity/*`
- generated skills registry

---

## Compatibility Rules

- `.claude/commands/` 现在只是可选兼容输入，不是默认结构
- 旧 `/flow:*` 只允许作为历史语境出现，不应再写进新的用户文档
- 内部 runtime 词汇不应再写成用户操作手册
- 分发文档默认写 `cc-devflow` CLI；源码开发文档才写 `node bin/...` 或 `npm exec --`

---

## Practical Reading Order

优先参考这些文件理解当前系统：

- `README.md`
- `README.zh-CN.md`
- `docs/guides/getting-started.md`
- `docs/examples/START-HERE.md`
- `docs/examples/example-bindings.json`
- `docs/examples/scripts/check-example-bindings.sh`
- `docs/examples/README.md`
- `bin/cc-devflow-cli.js`
- `bin/adapt.js`
- `lib/compiler/index.js`
- `config/adapters.yml`
