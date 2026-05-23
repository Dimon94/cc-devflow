# cc-devflow 快速开始

[中文文档](./getting-started.zh-CN.md) | [English](./getting-started.md)

---

## 概览

CC-DevFlow 现在有两条入口：

- `cc-devflow init`：把整包 `.claude` 安装到你的项目里
- `cc-devflow adapt`：生成 Codex、Cursor、Qwen、Antigravity 等平台产物

核心工作流可以手动走 PDCA/IDCA Skill，也可以通过 PR harness Skill 自动推进：

```text
cc-roadmap -> cc-next -> cc-dev

PDCA: cc-plan -> [cc-review] -> cc-do -> [cc-review] -> cc-check -> cc-act
IDCA: cc-investigate -> [cc-review] -> cc-do -> [cc-review] -> cc-check -> cc-act
```

公开 Skill 本身就是可见 harness。现在每个分发 `SKILL.md` 都带结构化 frontmatter 和 `Harness Contract`，每个 `PLAYBOOK.md` 都带 `Visible State Machine`，不再依赖隐藏运行时语义来理解阶段流转。

## 前置条件

- Node.js 18+
- 已初始化的 Git 仓库
- Claude Code 或其他受支持的 Agent 环境

## 安装

### 整包安装

```bash
npx cc-devflow init --dir /path/to/your/project
```

整包安装会带上 roadmap、next-work selection、autonomous dev、手动 PDCA/IDCA、可选 `cc-review`、PR review/landing，以及维护用的 `cc-spec-init` 和 `cc-simplify`。

### 单个 Skill 安装

```bash
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-roadmap
```

## 生成平台产物

```bash
npx cc-devflow adapt --cwd /path/to/your/project --platform codex
npx cc-devflow adapt --cwd /path/to/your/project --platform cursor
npx cc-devflow adapt --cwd /path/to/your/project --platform qwen
npx cc-devflow adapt --cwd /path/to/your/project --platform antigravity
```

## 验证安装

检查 Skill 目录是否存在：

```bash
find .claude/skills -mindepth 1 -maxdepth 1 -type d | sort
find .claude/skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
```

如果已经适配 Codex，再检查镜像出来的 skill 目录：

```bash
find .codex/skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
```

## 第一次跑工作流

按这个顺序使用 Skill：

```text
1. cc-roadmap
2. 在 cc-plan 和 cc-investigate 里二选一
3. 复杂计划或调查根因冻结后可选 cc-review
4. cc-do
5. 复杂实现可选 cc-review
6. cc-check
7. cc-act
8. repeat
```

常见产物：

- `cc-roadmap` 产出可编辑真相 `devflow/roadmap.json`，再生成 `devflow/ROADMAP.md` 和 deprecated `devflow/BACKLOG.md`
- `cc-spec-init` 产出 `devflow/specs/INDEX.md` 和 capability spec
- `cc-plan` 产出 `task.md#Contract Summary`
- `cc-investigate` 产出 `task.md#Root Cause Contract`
- `cc-review` 把计划 / 调查 finding 写入 `task.md`；执行 finding 留在回复里，等用户选择修复方案后再改代码；只有流程 / 测试 / 设计 / 模型写法逃逸类 finding 可以写入 `task.md#Failure Ledger`；非 trivial review chain 必须记录证据、诊断、现象层 / 本质层 / 哲学层，并以错误节点为中心记录因果链：上游在有证据时向上追直接输入/调用方、合同/规格/provider、来源意图/roadmap 三层，下游在有证据时向下追首个受影响边界、行为/产物、发布/维护风险三层，并按“现象接收 → 本质诊断 → 哲学沉思 → 本质整合 → 现象输出”组织；复杂度报告需要包含 scope、检测到的 stack/test/build 命令、ranked findings、before/after complexity、patch status、files-modified yes/no 和必要测试或测量；结构质量 finding 需要覆盖 code-judo 简化、可维护性护栏、分支 / 抽象 / 类型边界坏味道、ownership boundary、兼容的持久化状态变更、真实视口证据和 approval/blocking verdict；产品化 finding 覆盖 shared action layer、API/agent surface、audit trail、admin/manageability UI、feature flag、idempotency 和 operator path；hardening specialist 覆盖被选中的安全、可观测性、发布就绪和测试策略风险，并记录 surface map、risk gate、checked/skipped/blocked、proof path、confidence-per-minute 测试判断和 residual risk
- `cc-check` 在当前回复、PR 文件或 Git commit 里记录验证事实
- `cc-act` 只产出最终 PR 文件 `handoff/pr-brief.md`；真实事故需要尸检时才产出 incident postmortem 文件

durable truth 分两层：

- `devflow/specs/`：capability 真相，保留 `INDEX.md` 与 `capabilities/*.md`
- 新 change 目录必须命名为 `REQ-<number>-<description>`（需求）或 `FIX-<number>-<description>`（修复）；`REQ` 和 `FIX` 分别维护自己的递增编号，跨前缀同号不是冲突；并行工作树造成重复编号时，完整 change key 的描述负责区分业务内容，旧小写目录只作为历史兼容读取。
- `devflow/changes/<change>/`：变更真相，只保留 `task.md`、可选 `handoff/pr-brief.md` 和 Git commit；真实复发事故和已分类的 review escape 可在 `devflow/postmortems/` 写尸检文件。不要生成额外过程文件。
- 流程状态归 Git：保留 `task.md`，每个完成阶段提交 commit，不创建额外过程文件。
- 历史 `planning/design.md`、`planning/analysis.md` 和 `cc-review-*.md` 是旧 change 的可读 fallback，不再是新默认写入。
- worker prompt、journal、assignment、session log 统一放到 `devflow/workspaces/<change>/`，作为 ephemeral scratch。

进入实现前，planning handoff 应该先把证据写实：

- `cc-roadmap` 记录 planning posture、evidence maturity、framing check、依赖图，以及适用时的 developer/operator adoption context。
- `cc-plan` 记录 option roles、implementation surface、decision horizon、error/rescue map、测试框架来源、覆盖质量、confidence-per-minute proof value、focused suite shape，以及适用时的 regression-test requirement。
- `cc-do` 不把装饰性 Red 当作有效 TDD 证据；宽泛 snapshot、重复 happy path、no-op smoke、脆弱内部断言、过度 mock 自家模块，必须重写或退回 planning。
- `cc-check` 在 pass 前重新套用这个标准：绿色 suite 必须说明证明了什么行为、suite layer、command/runtime、fixture/mock boundary，以及避开了哪些低价值测试。
- `cc-act` 会把 release-readiness gates 带进 PR 或 handoff 输出：local checks、config/env、migrations/data、deploy/health、smoke/cleanup、rollback 和 watch items。

公开契约字段的典型形状：

- `triggers`、`reads`、结构化 `writes`、`effects`
- `entry_gate`、`exit_criteria`
- `reroutes`、`recovery_modes`、`tool_budget`

如果你想先看几套完整产物链，再自己开始跑 Skill，可以先读 [../examples/START-HERE.md](../examples/START-HERE.md)。如果你在升级 skill 同时维护样例，可以跑 [../examples/scripts/check-example-bindings.sh](../examples/scripts/check-example-bindings.sh)。

## 升级

通过最新版打包 CLI 刷新整包：

```bash
npx cc-devflow@latest init --dir /path/to/your/project
```

刷新平台产物：

```bash
npx cc-devflow adapt --cwd /path/to/your/project --all
```

刷新单个已安装 Skill：

```bash
npx skills update
```

## 常见问题

### `.claude` 已经存在

```bash
npx cc-devflow init --dir /path/to/your/project --force
```

`--force` 现在只会强制升级 cc-devflow 正式分发的 skill，不会删除现有的 `.claude/commands`、自定义 skill 或其他项目文件。

### 没有生成 Codex 输出

运行：

```bash
npx cc-devflow adapt --cwd /path/to/your/project --platform codex
```

如果你的项目没有可选的 `.claude/commands/` 输入目录，这也是正常的；编译器仍然会生成 skills registry，并为 Codex 镜像正式分发 skill 集合。

Codex 现在会把正式分发的 skill 从 `.claude/skills/<skill>/` 镜像到 `.codex/skills/<skill>/`。这套集合包含公开 workflow skill 和维护类 skill `cc-spec-init`、`cc-simplify`，并且镜像是纯增量的：项目里已有的自定义 Codex skill 不会被删除。

### 保持 skill 和样例同步

```bash
npm run verify
```

如果你在准备可发布的整包，再跑：

```bash
npm run verify:publish
```

## 下一步

- [CLI 与 Skill](../commands/README.zh-CN.md)
- [工作流详解](./workflow-guide.md)
- [最佳实践](./best-practices.md)
- [最小 Artifact 合同](./minimize-artifacts.md)
- [样例入口页](../examples/START-HERE.md)
- [简版样例列表](../examples/README.md)
- [项目 README](../../README.zh-CN.md)
