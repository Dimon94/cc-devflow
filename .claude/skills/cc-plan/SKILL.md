---
name: cc-plan
version: 3.9.3
description: Use when a requirement, roadmap item, or bug needs scope clarification, design decisions, and executable task breakdown before coding starts.
triggers:
  - 帮我规划这个需求
  - 先别写代码先定方案
  - 这个 bug 边界不清
  - 拆一下任务
  - plan this requirement
  - scope this bug
  - turn this into tasks
reads:
  - PLAYBOOK.md
  - assets/TASKS_TEMPLATE.md
  - assets/TASK_MANIFEST_TEMPLATE.json
  - references/planning-contract.md
  - ../cc-dev/scripts/resolve-cc-devflow.sh
  - ../cc-do/scripts/select-ready-tasks.sh
  - ../cc-do/scripts/mark-task-complete.sh
  - ../cc-roadmap/scripts/locate-roadmap-item.sh
  - ../cc-roadmap/scripts/sync-roadmap-progress.sh
writes:
  - path: devflow/changes/<change-key>/planning/tasks.md
    durability: durable
    required: true
  - path: devflow/changes/<change-key>/planning/task-manifest.json
    durability: durable
    required: true
  - path: devflow/changes/<change-key>/change-meta.json
    durability: durable
    required: true
effects:
  - source roadmap progress sync when planning freezes, splits, or reroutes
entry_gate:
  - Treat the ask as a requirement plan, not project strategy; reroute broad product direction to roadmap.
  - State assumptions and competing interpretations before choosing a plan; ask only when the answer changes scope, design, or verification.
  - Read only enough repo evidence to classify the plan, then expand through explicit escalation packs instead of loading every planning reference.
  - Resolve the CLI with `../cc-dev/scripts/resolve-cc-devflow.sh require query workflow-context task-contract next-change-key review` before running workflow commands; unsupported or old CLIs are blockers.
  - Assign a canonical REQ/FIX change key through the resolved CLI before durable artifacts are written.
  - "Enforce the Worktree Branch Contract immediately after the change key exists: detached worktrees bind to `REQ/<task>` or `FIX/<task>`, default branches stop as setup blockers."
  - Default to `tiny-design`; escalate to `full-design` only for cross-module, state/data/interface, migration, security, rollback, or high-ambiguity work.
  - Ask at most one blocking decision at a time, using the fixed D<N> Decision Question Protocol when the answer changes design or task boundaries.
  - Compare minimal viable and ideal architecture for non-trivial plans, but do not force that comparison for obvious tiny-design patches.
  - "Keep machine records CLI-owned: `task-manifest.json` and `change-meta.json` must be generated or refreshed by `cc-devflow task-contract compile`, not handwritten by the AI."
  - Generate durable artifacts only after the recommended design is approved.
  - Before exit, sync or explicitly no-op the source roadmap item.
exit_criteria:
  - "`planning/tasks.md#Contract Summary` states the approved solution, boundaries, frozen decisions, verification expectations, and any open assumptions."
  - "`planning/tasks.md` contains executable task blocks generated from `assets/TASKS_TEMPLATE.md`, including the script-based completion protocol."
  - "`planning/task-manifest.json` and `change-meta.json` were generated or refreshed by the resolved `cc-devflow task-contract compile`, then validated."
  - "The resolved `cc-devflow query workflow-context --compact` can route the next stage and name the next task."
  - "The only normal next step is `cc-do`; unresolved WHAT/WHY ambiguity reroutes or blocks instead of leaking into execution."
reroutes:
  - when: The discussion is still about project direction or stage order instead of one requirement.
    target: roadmap
  - when: The plan is already approved and tasks are already frozen.
    target: cc-do
recovery_modes:
  - name: re-open-design
    when: Execution feedback, review findings, or user correction invalidates the current design contract.
    action: Return to planning/tasks.md#Contract Summary, reopen the approved decision explicitly, then rerun CLI generation only after the contract is stable again.
tool_budget:
  read_files: 8
  search_steps: 5
  shell_commands: 6
---

# CC-Plan

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、相关模板/脚本引用，必要时写 migration note，然后检查 `CLAUDE.md`

## Role

`cc-plan` 是 PDCA 里的 `Plan`。它把一个明确 requirement 压成最少但足够强的执行合同，让 `cc-do` 不需要继承当前聊天上下文也能继续。

它不是完整产品路线图，不写生产代码，也不制造规划文档农场。

## Thin Harness Rule

默认相信顶级模型的工程判断。Harness 只做三件事：

1. 防止并发开发写错分支、写错真相源、跳过验证。
2. 把关键决策落到可恢复 artifact，而不是留在聊天里。
3. 在复杂度真的出现时才打开深层检查。
4. 机器态 JSON 必须由 CLI / 模板生成或更新，AI 不手写过程 JSON。

不要为了“流程完整”读取所有 reference。先用本文件闭合常规路径；只有触发升级条件时，才打开 `PLAYBOOK.md` 或 `references/planning-contract.md` 的对应段落。

## Harness Contract

- Allowed actions: clarify scope, compare approaches, freeze decisions, write the 3 default planning artifacts, and sync or no-op the source roadmap item.
- Forbidden actions: production code, extra planning side-docs, task generation before approval, or default-loading every deep planning reference.
- Required evidence: decisions, task boundaries, work branch, and verification commands point to repo facts or explicit user approval.
- Reroute rule: broad strategy returns to `roadmap`; already frozen work goes to `cc-do`.

## Planning Discipline

- Prefer the smallest reversible scope; if a simpler plan solves the requirement, push back on broader work.
- Do not add speculative features or single-use abstractions.
- When repo patterns conflict, choose the newer or better-verified pattern and mark the other as cleanup, not a blended design.
- Verification must encode the user's intent and why the behavior matters, not only implementation shape.
- Deterministic numbering, routing, and JSON generation belong to CLI commands, not model judgment.

## Runtime Output Policy

写入任何 durable Markdown 或 JSON metadata 前，先解析并校验 CLI，再运行配置解析：

```bash
DEVFLOW=".claude/skills/cc-dev/scripts/resolve-cc-devflow.sh"
if [[ ! -f "$DEVFLOW" && -f ".codex/skills/cc-dev/scripts/resolve-cc-devflow.sh" ]]; then
  DEVFLOW=".codex/skills/cc-dev/scripts/resolve-cc-devflow.sh"
fi
bash "$DEVFLOW" require query workflow-context task-contract next-change-key review config
bash "$DEVFLOW" config resolve --format policy
```

- `Output language` 是机器约束，`planning/tasks.md` 和 `change-meta.json` 必须记录并遵守。
- `agent_preferences` 只影响表达方式，不覆盖 workflow 边界。
- 配置解析失败时先修配置或报告阻塞，不用默认语言偷跑。

## Read Lazily

启动时只读：

1. 用户 objective / roadmap handoff / bug report
2. 当前 repo 指令：`CLAUDE.md` / `AGENTS.md` / README 中和本需求直接相关的部分
3. 相关代码、测试、docs 的最小证据集
4. `assets/TASKS_TEMPLATE.md` 和 `assets/TASK_MANIFEST_TEMPLATE.json`

按需再读：

- `PLAYBOOK.md`：需要完整计划剧本、review shape、设计模式判断时打开。
- `references/planning-contract.md`：要校验 hard rules、task fields、review gate 时打开。
- `docs/guides/project-postmortem.md`：只有仓库存在 `devflow/postmortems/`，且本需求匹配历史失败类时打开。
- `../cc-do/scripts/*`：生成 completion command 或验证 ready-task 规则时打开。
- `../cc-roadmap/scripts/*`：定位或回写 source RM 时打开。

## Change Key And Branch

新计划必须先分配 change key：

```bash
bash "$DEVFLOW" next-change-key --prefix REQ --description "short feature name"
```

bug / regression 用 `--prefix FIX`。脚本输出两行：`changeId` 和完整 `changeKey`。直接使用输出，不手动扫描、不心算编号。

分支锚定规则：

1. `REQ-003-copy-link` 对应 `REQ/003-copy-link`。
2. `FIX-014-auth-race` 对应 `FIX/014-auth-race`。
3. 当前 detached 时，立刻 `git switch -c <canonical-work-branch>`。
4. 当前是 `main` / `master` / default branch 时停止，报告 setup blocker。
5. 当前是其它分支时，只有它已明确绑定同一个 change key 才继续。

`planning/tasks.md` 和 `change-meta.json` 必须记录 work branch。

## Machine Artifact Rule

AI 只手写默认人类合同：`planning/tasks.md#Contract Summary` 和后面的 task blocks。

机器态文件必须由命令生成或更新：

```bash
bash "$DEVFLOW" task-contract compile --change <changeId> --change-key <changeKey>
bash "$DEVFLOW" task-contract validate --change <changeId> --change-key <changeKey>
```

硬规则：

- 不手写 `planning/task-manifest.json`。
- 不手写 `change-meta.json`。
- 不生成 `planning/design.md`、`planning/analysis.md`、task `context.md`、`checkpoint.json`、review Markdown 或其它 AI 手写过程文件。
- 需要修机器态结构时，改 CLI / 模板 / validator，再重新生成；不要在项目 change 目录里补 JSON。
- 如果 resolver 找不到支持 `query workflow-context`、`task-contract`、`next-change-key` 和 `review` 的 CLI，必须报告 blocked；禁止改用 simulated adapter 输出或手写机器 JSON。
- legacy `planning/design.md` / `planning/analysis.md` 只能作为读取或 migration 输入。

## Density Switch

先决定计划密度，再写计划。

`tiny-design` 是默认：

- 单一功能点
- 通常触达 1-3 个文件
- 不涉及 migration、权限、安全、复杂状态流或高代价回滚
- 执行者看完冻结卡片即可落地

`full-design` 只在这些条件出现时升级：

- 跨模块协调或多阶段落地
- 新增/改变接口、数据字段、状态机、迁移或兼容性
- 安全、权限、计费、同步一致性、发布物分发等高代价边界
- 不先讲清边界就会逼 `cc-do` 二次设计

`tiny-design` 仍然需要批准；它删的是冗长文档，不是删设计。

## Planning Loop

1. **Frame**：确认对象是一个 requirement，写清问题、非目标、成功信号和验证方式。
2. **Evidence**：用 repo 证据确认现有实现、测试框架、复用点和限制；证据不足写 assumption。
3. **Decide Density**：默认 tiny，满足升级条件才 full。
4. **Compare Options**：非 trivial 计划至少比较 `minimal viable` 与 `ideal architecture`；明显 tiny patch 可直接给推荐并说明排除项。
5. **Ask Only If Blocking**：用户答案会改变设计、任务或交付边界时才问；一次只问一个。
6. **Approve**：推荐方案获批前不写执行 task blocks。
7. **Freeze Tasks**：写稳 `planning/tasks.md#Contract Summary` 和 task blocks。
8. **Compile**：运行 resolved CLI 的 `task-contract compile` 生成/刷新 manifest 和 meta，再 validate。
9. **Sync Roadmap**：source RM 存在就回写；不存在就记录 no-op reason。

## Decision Questions

只在这些 gate 问用户：

- `planning-mode`：tiny/full/design route 无法由证据决定
- `ambiguity-blocker`：WHAT/WHY 缺口会改变任务
- `approach-approval`：需要批准方案
- `external-best-practice`：外部资料可能改变设计或验证
- `taste-or-user-challenge`：推荐方案挑战用户原方向
- `final-design-approval`：准备冻结执行任务

格式固定：

```text
D<N> - <decision title>
Planning object: <REQ/FIX/RM id, branch, or change key>
Known evidence: <repo / roadmap / code / test facts>
Decision needed: <what this changes downstream>
Recommendation: <A/B/C> because <one concrete reason>
Completeness: A=<score>/10, B=<score>/10, C=<score>/10
Options:
A) <label> (recommended)
  Good: <concrete upside>
  Cost/Risk: <honest cost or what it leaves out>
B) <label>
  Good: <concrete upside>
  Cost/Risk: <honest cost or what it leaves out>
Impact: <what cc-do will do differently>
STOP: wait for the user answer before continuing.
```

选项必须是 `A/B/C`，不能用 `1/2/3`。机械选择可以 auto-decide，但必须写进 `Decision Questions` 记录。

## Output Model

默认只允许 3 个主文件：

1. `planning/tasks.md`
   - 唯一默认 human-authored Markdown
   - `## Contract Summary` 放批准方案、边界、冻结决策、验证、review 结论
   - task blocks 放执行步骤和 completion command
2. `planning/task-manifest.json`
   - CLI 生成的执行图真相源
   - 保留 `currentTaskId`、依赖、触点、命令、验证、证据和 review 状态
   - 不复制 PRD、review prose、source-trust prose、completion shell 命令、roadmap progress 或 spec sync 状态
3. `change-meta.json`
   - CLI 生成/更新的 capability/spec sync、source RM、roadmap sync、work branch metadata

新计划默认不写：

- `planning/design.md`
- `planning/analysis.md`
- `BRAINSTORM.md`
- `PLAN_REVIEW.md`
- `context-package.md`
- `handoff/resume-index.md`
- AI 手写的 `execution/tasks/<task-id>/context.md` 或 `checkpoint.json`

历史文件只能作为 legacy fallback 读取；有效内容吸收进 `planning/tasks.md#Contract Summary`。

## Progressive Disclosure

`planning/tasks.md` 第一屏必须能回答：做什么、不做什么、为什么现在做、当前批准状态、下一步读哪个 task。

后续阶段默认从这里恢复：

```bash
bash "$DEVFLOW" query workflow-context --change <changeId> --change-key <changeKey> --cwd <repo-root> --data-only --no-trace --compact
```

`workflow-context` 是 context index，不是语义裁决者。它负责路由和打开引用；源 artifact 负责事实裁决。

## Task Contract

行为变更默认测试先行：

```text
[TEST] Red -> [IMPL] Green -> [REFACTOR] cleanup
```

每个 task 至少写清：

- Goal
- TDD phase 或 exception
- Files / touches
- Read first
- Verification
- Evidence
- Public test seam 或替代验证
- Mock boundary
- Completion command

完成命令必须调用 `mark-task-complete.sh`，禁止手工勾 checkbox 或只改 manifest：

```bash
SCRIPT_ROOT=".claude/skills/cc-do/scripts"
if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then
  SCRIPT_ROOT=".codex/skills/cc-do/scripts"
fi
bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest devflow/changes/<change-key>/planning/task-manifest.json --tasks devflow/changes/<change-key>/planning/tasks.md --task <task-id>
```

纯文档、纯配置、纯生成文件、throwaway prototype 可以写 TDD exception，但必须写清替代验证。

## Escalation Packs

只在触发时打开深层规则：

| Pack | Trigger | Open |
| --- | --- | --- |
| Deep Planning Funnel | 新接口、字段、状态流、多文件协作、需求仍模糊 | `PLAYBOOK.md#Planning Standard`, `references/planning-contract.md#Review Gate` |
| AI Leverage Lens | 范围可能太小或太大，用户担心 AI 被流程绑住 | `PLAYBOOK.md#Core Rules`, `references/planning-contract.md#Decision Log` |
| External Best Practice | 新平台、外部 API、安全、分发、性能、UI/DX 且 repo 无先例 | `references/planning-contract.md#Decision Question Fields` |
| Postmortem Recall | `devflow/postmortems/` 存在且匹配模块/失败类 | `docs/guides/project-postmortem.md` |
| Full Engineering Review | 跨模块、高风险、实现者会二次设计 | `PLAYBOOK.md#Review Shape` |
| UI/DX Review | UI / API / CLI / operator-facing scope | `PLAYBOOK.md#Planning Standard` |

如果没有触发条件，不要打开这些包。

## Roadmap Sync

退出前定位 source RM：

```bash
bash .claude/skills/cc-roadmap/scripts/locate-roadmap-item.sh --id <RM-or-REQ>
```

source RM 存在时，用 roadmap sync 脚本回写 `devflow/roadmap.json` 并重新生成投影。找不到 source RM 时，在 `planning/tasks.md#Contract Summary` 和 `change-meta.json.roadmapSync` 记录 `no-source-rm`。

## Exit Rule

计划合格的标准很简单：

- 范围边界清楚
- 推荐方案已批准
- 任务顺序和验证方式没有歧义
- machine artifacts 由 CLI 生成并通过 validate
- `workflow-context --compact` 能恢复下一步
- `cc-do` 不需要靠聊天记忆补设计

如果执行者还要猜“碰哪些文件、为什么这么改、先写什么失败测试”，计划没完成。
