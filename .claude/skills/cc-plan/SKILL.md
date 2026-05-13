---
name: cc-plan
version: 3.10.1
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
  - references/planning-contract.md
  - ../cc-dev/scripts/resolve-cc-devflow.sh
  - ../cc-roadmap/scripts/locate-roadmap-item.sh
  - ../cc-roadmap/scripts/sync-roadmap-progress.sh
writes:
  - path: devflow/changes/<change-key>/task.md
    durability: durable
    required: true
effects:
  - roadmap progress sync when a source item exists
  - Git commit after the Plan stage is complete
entry_gate:
  - Resolve the CLI with `../cc-dev/scripts/resolve-cc-devflow.sh require query workflow-context next-change-key config` before workflow commands.
  - Assign a canonical REQ/FIX change key through `next-change-key` before writing `task.md`.
  - Enforce the Worktree Branch Contract immediately after the change key exists.
  - Read only the repo evidence needed to decide scope, existing leverage, task boundaries, and verification.
  - Ask only when the answer changes scope, design, implementation boundary, or verification.
exit_criteria:
  - "`task.md#Contract Summary` states the approved solution, non-goals, frozen decisions, work branch, verification expectations, and open assumptions."
  - "`task.md` contains executable task blocks generated from `assets/TASKS_TEMPLATE.md`."
  - "No process file is created beyond `task.md`."
  - "Source roadmap progress is synced or explicitly skipped in the final response."
  - "Plan-stage changes are committed to Git before handing off to `cc-do`."
reroutes:
  - when: The discussion is still project direction or stage order instead of one requirement.
    target: roadmap
  - when: The plan is already approved and tasks are frozen.
    target: cc-do
tool_budget:
  read_files: 8
  search_steps: 5
  shell_commands: 6
---

# CC-Plan

`cc-plan` 是 PDCA 的 `Plan`。它只产出一份 durable 任务合同：

- `devflow/changes/<change-key>/task.md`

不要生成额外过程文件或 JSON 文档。Git commit 是阶段历史，`task.md` 是任务真相。

## Operating Contract

1. 先用 resolver 找到当前仓库的 `cc-devflow`，并确认支持 `query workflow-context`、`next-change-key`、`config`。
2. 用 `next-change-key --prefix REQ|FIX --description "..."` 生成 `changeId` 和完整 `changeKey`，不要手动扫描编号。
3. 分配 change key 后立刻锚定分支：`REQ-003-copy-link` 对应 `REQ/003-copy-link`，`FIX-014-auth-race` 对应 `FIX/014-auth-race`。当前在 default branch 时停止并报告 setup blocker。
4. 写 `task.md` 前先确认方案。tiny 计划仍要被批准，只是更短。
5. `task.md` 必须包含 `Contract Summary`、任务列表、验证命令、完成证据、禁止重决策事项和阶段 commit 要求。
6. 完成 Plan 后提交 Git commit。下一阶段从 Git history 和 `task.md` 恢复，不靠过程文件。

```bash
DEVFLOW=".claude/skills/cc-dev/scripts/resolve-cc-devflow.sh"
bash "$DEVFLOW" config resolve --format policy
```

## Planning Standard

- 用最小可逆方案解决真实需求，不扩张到假想未来。
- 缺证据就写 assumption，不伪装成事实。
- 非 trivial 方案比较 `minimal viable` 和 `ideal architecture`，但推荐必须落到当前仓库可执行边界。
- 行为变更任务按 tracer bullet 写：`[TEST] -> [IMPL] -> [REFACTOR]`，不要水平切层。
- 每个任务写清目标、文件、依赖、TDD phase、读什么、怎么验证、完成证据。
- 回归测试不能 defer；缺 seam 时先计划 spike 或设计修正。

## Required Output

`task.md` 的结构由 `assets/TASKS_TEMPLATE.md` 提供。模板外只允许补充对当前需求必要的事实，不允许新建额外过程文件。

## Handoff

退出时只说清：

- change key 和分支
- `task.md` 路径
- 已运行或跳过的验证
- Plan commit hash
- 下一步 `cc-do`
