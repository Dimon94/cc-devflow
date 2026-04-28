# cc-devflow

> 面向 Agent 编程的路线图、计划、调查、执行、验证、交付工作流。

[![GitHub stars](https://img.shields.io/github/stars/Dimon94/cc-devflow?style=social)](https://github.com/Dimon94/cc-devflow/stargazers)
[![npm version](https://img.shields.io/npm/v/cc-devflow.svg)](https://www.npmjs.com/package/cc-devflow)
[![Node.js >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](./package.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

[中文文档](./README.zh-CN.md) | [English](./README.md) | [快速开始](./docs/guides/getting-started.zh-CN.md) | [贡献指南](./CONTRIBUTING.zh-CN.md) | [安全策略](./SECURITY.zh-CN.md)

CC-DevFlow 是一个给 Agent 编程时代准备的小而明确的工作流系统。它先用一个 roadmap 入口确定方向，再让每个变更进入「新需求闭环」或「Bug 调查闭环」，最后必须经过验证和交付收口。

```text
cc-roadmap

PDCA: cc-plan        -> cc-do -> cc-check -> cc-act
IDCA: cc-investigate -> cc-do -> cc-check -> cc-act
```

## 为什么用 cc-devflow

- **公开入口很小**：6 个可见 workflow skill，加一个负责安装和平台适配的 CLI。
- **先证据后完成**：实现之后必须经过验证证据，才能进入 ship 或 handoff。
- **Skill-first 分发**：公开契约写在 `.claude/skills/<skill>/SKILL.md` 和 `PLAYBOOK.md`，不依赖隐藏运行时语义。
- **多平台产物**：一次安装，再生成 Codex、Cursor、Qwen、Antigravity 等 Agent 环境需要的输出。
- **持久项目记忆**：roadmap、spec、planning、review、handoff 留在 `devflow/`；临时 worker scratch 不混入 durable truth。

## 快速开始

前置条件：

- Node.js 18+
- npm 或兼容的包运行器
- 一个 Git 仓库
- Claude Code 或其他受支持的 Agent 环境

安装整包 Skill：

```bash
npx cc-devflow@latest init --dir /path/to/your/project
```

生成平台产物：

```bash
npx cc-devflow@latest adapt --cwd /path/to/your/project --platform codex
npx cc-devflow@latest adapt --cwd /path/to/your/project --platform cursor
npx cc-devflow@latest adapt --cwd /path/to/your/project --platform qwen
npx cc-devflow@latest adapt --cwd /path/to/your/project --platform antigravity
```

刷新所有受支持的平台产物：

```bash
npx cc-devflow@latest adapt --cwd /path/to/your/project --all
```

安装完成后，直接让 Agent 使用这些 workflow skill。产品方向先走 `cc-roadmap`，新需求走 `cc-plan`，Bug 和 regression 走 `cc-investigate`，然后继续进入 `cc-do`、`cc-check`、`cc-act`。

## Workflow Skill

| Skill | 什么时候用 | 主要产物 |
| --- | --- | --- |
| `cc-roadmap` | 需要产品方向、阶段范围或 backlog 顺序 | `devflow/ROADMAP.md`、`devflow/BACKLOG.md` |
| `cc-plan` | 新功能或变更需要澄清范围、设计方案、冻结任务 | `planning/design.md`、`planning/tasks.md`、`task-manifest.json` |
| `cc-investigate` | Bug 需要症状、复现、根因和修复边界 | `planning/analysis.md`、`planning/tasks.md`、`task-manifest.json` |
| `cc-do` | 已计划或已调查的任务需要实现 | 代码、测试、checkpoint、scratch runtime |
| `cc-check` | 工作需要新鲜验证证据 | `report-card.json` |
| `cc-act` | 已验证工作需要 PR、本地 handoff、release note 或 closeout | 唯一最终 handoff 文件 |

整包还包含两个维护类 Skill：

- `cc-spec-init`：初始化和维护 `devflow/specs/` 下的 durable capability spec
- `cc-simplify`：审查已改代码的复用、质量、效率和需求漂移

## 计划质量门禁

`cc-roadmap` 现在会先记录 planning posture、evidence maturity、项目 canonical language 和持久决策上下文，再推荐路线。idea、已有用户、付费客户、infra、recovery 场景不会被套进同一组问题，也不会让 roadmap item 发明第二套词汇。面向开发者或操作者的 roadmap item 还会把目标用户、time to first value、magic moment、adoption bottleneck 和 domain handoff 交给 `cc-plan`。

`cc-plan` 会在 `cc-do` 开始前冻结更多实现决策。非 trivial 计划需要比较 minimal viable 和 ideal architecture，full-design 需要包含 implementation decision horizon 和 error/rescue map；测试计划要记录测试框架证据、public test seam、behavior assertion、mock boundary、覆盖质量、强制 regression test、interface depth 和 vertical tracer-bullet slices。

## 验证与交付门禁

`cc-check` 现在把 QA 当成反馈环问题，而不是只看测试是否绿。Bugfix 和行为变更需要记录证明现实的 loop、expected / actual、复现步骤、测试边界质量；如果没有干净的 public test seam，要留下架构 follow-up。

`cc-act` 会把这些证据带进 PR brief、handoff 和 release note。Follow-up 必须写成 durable behavior brief，包含 current behavior、desired behavior、key interfaces、acceptance criteria 和 out-of-scope，再回写 roadmap 或 backlog。

## 安装方式

### 整包安装

需要完整 `.claude` skill pack 时使用：

```bash
npx cc-devflow@latest init --dir /path/to/your/project
npx cc-devflow@latest init --dir /path/to/your/project --force
```

`--force` 只升级 cc-devflow 管理的分发 Skill，不会删除项目里其他已有的 `.claude` 文件。

### 源码仓库调试

如果你在本仓库里开发：

```bash
node bin/cc-devflow-cli.js --help
node bin/cc-devflow-cli.js init --dir /tmp/example-project
node bin/cc-devflow-cli.js adapt --cwd /tmp/example-project --platform codex
```

### 通过 skills.sh 安装单个 Skill

[skills.sh](https://skills.sh/) 只作为单 Skill 分发渠道：

```bash
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-roadmap
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-plan
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-investigate
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-do
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-check
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-act
```

需要整包用 `cc-devflow init`，需要平台产物用 `cc-devflow adapt`，只想拿单个 Skill 才用 `skills add`。

## 配置

CC-DevFlow 会在写入 durable workflow 文档前读取分层 YAML 配置：

```text
~/.cc-devflow/config.yml
<repo>/.cc-devflow/config.yml
<repo>/.cc-devflow/config.local.yml
```

优先级固定为：默认值 < 用户 < 项目 < 本地 < 环境变量 < CLI 参数。`output.document_language` 是机器约束，目前支持 `en` 和 `zh-CN`。非标偏好放在 `agent_preferences` 下，只影响表达风格，不覆盖 workflow 契约。

```yaml
version: 1
output:
  document_language: zh-CN
agent_preferences:
  general:
    - 先给结论。
  documentation:
    - 标题短一些，避免营销腔。
```

常用命令：

```bash
npx cc-devflow config init --cwd /path/to/your/project --project
npx cc-devflow config set output.document_language zh-CN --cwd /path/to/your/project --project
npx cc-devflow config resolve --cwd /path/to/your/project --format policy
npx cc-devflow config doctor --cwd /path/to/your/project
```

完整样例见 [`config/user-config.template.yml`](./config/user-config.template.yml)。

## 仓库格式

对外分发的 Skill 位于 `.claude/skills/`：

```text
.claude/skills/<skill>/
├── SKILL.md
├── PLAYBOOK.md
├── assets/
├── references/
└── scripts/
```

每个已发布 Skill 都把运行契约放在自己目录里：

- `SKILL.md` 包含 YAML frontmatter 和 `Harness Contract`
- `PLAYBOOK.md` 包含 `Visible State Machine`
- 本地资源跟随拥有它的 Skill 一起放置

当前分发目录：

- `.claude/skills/cc-roadmap/`
- `.claude/skills/cc-plan/`
- `.claude/skills/cc-investigate/`
- `.claude/skills/cc-do/`
- `.claude/skills/cc-check/`
- `.claude/skills/cc-act/`
- `.claude/skills/cc-spec-init/`
- `.claude/skills/cc-simplify/`

## Durable 与 Ephemeral

- `devflow/specs/` 保存 durable capability truth：`INDEX.md` 和 `capabilities/*.md`。
- 新 change 目录使用 `REQ-<number>-<description>` 表示需求，使用 `FIX-<number>-<description>` 表示 Bug 修复。
- `devflow/changes/<change>/` 保存 durable change truth：`change-state.json`、`change-meta.json`、planning 文档、`task-manifest.json`、`team-state.json`、任务级 `checkpoint.json`、`report-card.json` 和唯一最终 handoff 文件。
- `devflow/workspaces/<change>/` 保存 ephemeral runtime scratch，例如 worker assignment、journal、prompt 和 session log。
- 能从 durable truth 再生成的文件，不应该持久化到 `devflow/changes/`。

想先看完整产物链，可以从 [`docs/examples/START-HERE.md`](./docs/examples/START-HERE.md) 开始。样例和 Skill 的版本绑定真相源在 [`docs/examples/example-bindings.json`](./docs/examples/example-bindings.json)。

## 开发

```bash
git clone https://github.com/Dimon94/cc-devflow.git
cd cc-devflow
npm install
npm test
npm run verify
```

发布校验：

```bash
npm run verify:publish
```

主要贡献说明见 [`CONTRIBUTING.zh-CN.md`](./CONTRIBUTING.zh-CN.md)，里面包含公开入口规则、本地 CLI 冒烟验证、文档规则和 PR 期望。

## 社区与贡献

- 如果这个工作流对你有用，可以给项目一个 Star：[GitHub stars](https://github.com/Dimon94/cc-devflow/stargazers)
- 可复现 Bug、陈旧文档、缺失平台适配，都可以开 issue。
- PR 保持聚焦：一个 Skill、一个 CLI 行为、一个编译 / 适配修复，或一次文档清理。
- 如果修改已发布 Skill，同一个 PR 里同步它的 `version`、本地 `CHANGELOG.md`、样例和受影响的公开文档。
- 参与讨论前请阅读 [行为准则](./CODE_OF_CONDUCT.zh-CN.md)。
- 漏洞报告请走 [安全策略](./SECURITY.zh-CN.md)，不要发到公开 issue。

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
