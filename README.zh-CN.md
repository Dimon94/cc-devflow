# cc-devflow

> 面向 Agent 编程的路线图、计划、调查、执行、验证、交付工作流。

[![GitHub stars](https://img.shields.io/github/stars/Dimon94/cc-devflow?style=social)](https://github.com/Dimon94/cc-devflow/stargazers)
[![npm version](https://img.shields.io/npm/v/cc-devflow.svg)](https://www.npmjs.com/package/cc-devflow)
[![Node.js >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](./package.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

[中文文档](./README.zh-CN.md) | [English](./README.md) | [快速开始](./docs/guides/getting-started.zh-CN.md) | [贡献指南](./CONTRIBUTING.zh-CN.md) | [安全策略](./SECURITY.zh-CN.md)

CC-DevFlow 是一个给 Agent 编程时代准备的小而明确的工作流系统。它先用一个 roadmap 入口确定方向，再让每个变更进入「新需求闭环」或「Bug 调查闭环」，最后必须经过验证和交付收口。

![CC-DevFlow PR Harness 中文可视化流程](./docs/assets/cc-devflow-pr-harness-zh.svg)

## 为什么用 cc-devflow

- **公开入口很小**：核心 workflow skill、PR Harness 链路、1 个可选深度 review skill，加一个负责安装和平台适配的 CLI。
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

安装完成后，直接让 Agent 使用这些 workflow skill。产品方向先走 `cc-roadmap`。需要自动选择下一步时走 `cc-next`；选中目标后用 `cc-dev` 在当前 worktree 内自动跑 PDCA 或 IDCA，直到远程 PR 打开；PR 用单独会话跑 `cc-pr-review`；review 后用单独会话跑 `cc-pr-land` 合并并证明 main parity。手动核心链路仍然是：新需求走 `cc-plan`，Bug 和 regression 走 `cc-investigate`；复杂计划或根因合同冻结后可以先接 `cc-review`，再进入 `cc-do`；实现复杂时还可以再接一次实现 `cc-review`，最后进入 `cc-check` 和 `cc-act`。

## 流程图

```text
cc-roadmap

PR Harness: cc-next -> cc-dev -> cc-pr-review -> cc-pr-land

PDCA: cc-plan        -> [cc-review] -> cc-do -> [cc-review] -> cc-check -> cc-act
IDCA: cc-investigate -> [cc-review] -> cc-do -> [cc-review] -> cc-check -> cc-act
```

```mermaid
flowchart TD
  Roadmap["cc-roadmap\n产品方向和阶段真相"] --> Next["cc-next\n选择下一个 Goal Packet"]
  Next --> Dev["cc-dev\n当前 worktree 自动推进到 PR"]

  Dev --> Route{"路线"}
  Route -->|新需求或变更| Plan["cc-plan\n冻结范围和任务"]
  Route -->|Bug 或回归| Investigate["cc-investigate\n冻结根因和修复边界"]

  Plan --> PlanReview["cc-review\n可选方案 Review"]
  Investigate --> PlanReview
  PlanReview --> Do["cc-do\n实现并留下证据"]
  Plan --> Do
  Investigate --> Do

  Do --> ImplReview["cc-review\n可选实现 Review"]
  ImplReview --> Check["cc-check\n新鲜验证裁决"]
  Do --> Check
  Check --> Act["cc-act\n创建或更新远程 PR"]
  Act --> PRReview["cc-pr-review\n单独会话 Review PR"]
  PRReview --> PRLand["cc-pr-land\nRebase 合并并证明 main parity"]
  PRReview -->|需要修复| Dev
  PRLand --> Main["main\n本地和远程一致"]
```

## Workflow Skill

| Skill | 什么时候用 | 主要产物 |
| --- | --- | --- |
| `cc-roadmap` | 需要产品方向、阶段范围或 backlog 顺序 | `devflow/roadmap.json`、`devflow/ROADMAP.md`、deprecated `devflow/BACKLOG.md` |
| `cc-next` | 需要从 roadmap、未归档本地 change 和 issue truth 里选下一个 ready 目标 | 交给 `cc-dev` 的 Goal Packet |
| `cc-dev` | 已选目标要在当前 worktree 内自动推进到远程 PR | `task.md`、Git commit、PR 或 handoff |
| `cc-plan` | 新功能或变更需要澄清范围、设计方案、冻结任务 | `task.md#Contract Summary` |
| `cc-investigate` | Bug 需要症状、复现、根因和修复边界 | `task.md#Root Cause Contract` |
| `cc-do` | 已计划或已调查的任务需要实现 | 代码、测试、`task.md` 状态、Git commit |
| `cc-review` | 复杂方案、调查根因或 diff 需要在实现前或验证前做可选深度 Review | 计划 finding 写入 `task.md`；执行 finding 和修复选项回到对话 |
| `cc-pr-review` | 远程 PR 需要单独会话做合并前 Review | PR review packet、findings 和 landing verdict |
| `cc-pr-land` | 已 Review PR 需要 rebase-first 合并到 main 并证明 parity | 已集成 main 和本地 / 远程一致性证据 |
| `cc-check` | 工作需要新鲜验证证据 | pass/fail/blocked 回复和 Git commit |
| `cc-act` | 已验证工作需要 PR、本地 handoff 或 closeout | 可选 `handoff/pr-brief.md`、Git/PR 真相或 incident postmortem |

整包还包含两个维护类 Skill：

- `cc-spec-init`：初始化和维护 `devflow/specs/` 下的 durable capability spec
- `cc-simplify`：审查已改代码的复用、质量、效率和需求漂移

## 计划质量门禁

`cc-roadmap` 现在会先记录 planning posture、evidence maturity、项目 canonical language 和持久决策上下文，再推荐路线。idea、已有用户、付费客户、infra、recovery 场景不会被套进同一组问题，也不会让 roadmap item 发明第二套词汇。面向开发者或操作者的 roadmap item 还会把目标用户、time to first value、magic moment、adoption bottleneck 和 domain handoff 交给 `cc-plan`。

Canonical language 和 durable decisions 只收敛到 cc-devflow 原生真相源：`devflow/specs/`、`devflow/roadmap.json`、`devflow/ROADMAP.md`、`task.md`、Git history 和 PR truth。历史 planning artifacts 只作为可读 fallback 输入。

`cc-plan` 会在 `cc-do` 开始前冻结更多实现决策。非 trivial 计划需要比较 minimal viable 和 ideal architecture，full-design 需要包含 implementation decision horizon 和 error/rescue map；测试计划要记录测试框架证据、public test seam、spec-style test name、public verification path、behavior assertion、mock boundary、覆盖质量、强制 regression test、interface depth、Green minimality guard、refactor candidates 和 vertical tracer-bullet slices。交接前，`cc-plan` 和 `cc-investigate` 还会校准 source roadmap item，让 RM 状态、REQ/FIX 绑定、progress 和 spec diagnosis 不再漂移。

planning 之后的每个阶段都从 `task.md`、当前 Git history/status，以及存在时的 PR 或 handoff truth 开始。系统不再提供 runtime context query 层；有争议的事实必须回到源 artifact 重新读取。用 `npm run benchmark:skills` 保持 public skill 入口足够薄；深层规划规则应该放在条件 reference 后面，而不是默认上下文里。

`cc-review` 是可选的深度 Review，不替代 `cc-check`。它可以接在 `cc-plan` / `cc-investigate` 后审冻结的计划或根因合同，也可以接在 `cc-do` 后审实现。计划 / 调查 Review 的 finding 直接写进 `task.md`。执行 Review 的 finding 在当前回复里组织成修复选项，用户选择后才改代码。PR Review 只留在对话或 GitHub review 中。不写本地 review report、ledger、findings JSON 或其它 Review 产物文件。

## 验证与交付门禁

`cc-check` 现在把 QA 当成反馈环问题，而不是只看测试是否绿。Bugfix 和行为变更需要记录证明现实的 loop、expected / actual、复现步骤、测试边界质量；如果没有干净的 public test seam，要留下架构 follow-up。

`cc-act` 会把这些证据带进 PR brief、handoff 和 release note。它会在 closeout 检查 source roadmap progress，必要时更新 `devflow/roadmap.json` 并重新生成 `devflow/ROADMAP.md` / `devflow/BACKLOG.md`。Follow-up 必须写成 durable behavior brief，包含 current behavior、desired behavior、key interfaces、acceptance criteria 和 out-of-scope，再回写 roadmap 或 backlog。

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
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-next
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-dev
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-plan
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-investigate
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-do
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-review
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-pr-review
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-pr-land
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
- `.claude/skills/cc-next/`
- `.claude/skills/cc-dev/`
- `.claude/skills/cc-plan/`
- `.claude/skills/cc-investigate/`
- `.claude/skills/cc-do/`
- `.claude/skills/cc-review/`
- `.claude/skills/cc-pr-review/`
- `.claude/skills/cc-pr-land/`
- `.claude/skills/cc-check/`
- `.claude/skills/cc-act/`
- `.claude/skills/cc-spec-init/`
- `.claude/skills/cc-simplify/`

## Durable 与 Ephemeral

- `devflow/specs/` 保存 durable capability truth：`INDEX.md` 和 `capabilities/*.md`。
- 新 change 目录使用 `REQ-<number>-<description>` 表示需求，使用 `FIX-<number>-<description>` 表示 Bug 修复。`REQ` 和 `FIX` 各自递增自己的编号，跨前缀同号允许共存。并行工作树也可能产生重复编号，必须用完整 change key 的描述区分业务内容。
- `devflow/changes/<change>/` 的 durable change truth 只保留 `task.md`、可选 `handoff/pr-brief.md` 和 Git commits。真实复发故障可以在 `devflow/postmortems/` 写 incident postmortem。
- 新 change 默认只有一个人工编写的 Markdown artifact：`task.md`。功能计划把冻结设计写进 `## Contract Summary`；Bug 调查把根因真相写进 `## Root Cause Contract`。历史 planning / review artifacts 只作为可读 fallback 输入。
- 流程状态归 Git：保持 `task.md` 当前，每个完成阶段 / 执行环境提交 commit，不创建额外过程文件。
- 用 `npm run verify:examples` 和 `npm run benchmark:skills` 保持 workflow truth 与 skill 入口小而可测。
- `devflow/workspaces/<change>/` 保存 ephemeral runtime scratch，例如 worker assignment、journal、prompt 和 session log。
- 能从 durable truth 再生成的文件，不应该持久化到 `devflow/changes/`。

Artifact contract 快速检查：

```bash
npm run verify:examples
npm run benchmark:skills
```

想先看完整产物链，可以从 [`docs/examples/START-HERE.md`](./docs/examples/START-HERE.md) 开始。样例和 Skill 的版本绑定真相源在 [`docs/examples/example-bindings.json`](./docs/examples/example-bindings.json)。最小 artifact 合同的迁移与编写指南在 [`docs/guides/minimize-artifacts.md`](./docs/guides/minimize-artifacts.md)。

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

## 讨论交流

欢迎扫码加入 cc-devflow 交流 1 群，反馈问题、交流使用体验或提出新功能建议。

<img src="./docs/assets/wechat-group-qr.jpg" alt="cc-devflow 交流 1 群微信群二维码" width="320" />

如果二维码过期，请在 issue 中提醒维护者更新。

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
