---
name: cc-do
version: 1.7.1
description: Use when implementing frozen tasks, resuming interrupted work, applying an investigation handoff, or fixing review feedback inside the approved scope.
triggers:
  - 开始做 T003
  - 继续上次做到一半的任务
  - 按 task.md 开始实现
  - 修这个 review comment
  - implement this task
  - resume this requirement
reads:
  - PLAYBOOK.md
  - references/execution-recovery.md
  - references/parallel-dispatch.md
  - docs/guides/project-postmortem.md
  - ../cc-dev/scripts/resolve-cc-devflow.sh
writes:
  - path: devflow/changes/<change-key>/task.md
    durability: durable
    required: true
    when: task checkbox/status changes
effects:
  - code changes
  - test changes
  - Git commit after each completed execution environment or task slice
entry_gate:
  - Resolve the CLI with `../cc-dev/scripts/resolve-cc-devflow.sh require query workflow-context config`.
  - Run `query workflow-context --change <changeId> --change-key <changeKey> --data-only --no-trace --compact`.
  - Read `task.md`, current Git status, and only the code/tests needed by the current task.
  - Reject execution if the task cannot be restated from `task.md` and repo evidence.
exit_criteria:
  - Current task has Red/Green evidence or a recorded TDD exception in `task.md`.
  - Verification commands have been run or explicitly blocked.
  - Task status is updated through `scripts/mark-task-complete.sh`.
  - The completed task/environment is committed to Git.
  - No process file is created beyond `task.md` updates and Git commits.
reroutes:
  - when: New evidence disproves root cause.
    target: cc-investigate
  - when: New evidence breaks scope or design.
    target: cc-plan
  - when: Implementation and review feedback are complete.
    target: cc-check
tool_budget:
  read_files: 9
  search_steps: 6
  shell_commands: 8
---

# CC-Do

`cc-do` 是 PDCA / IDCA 的 `Do`。它只执行 `task.md` 中已经冻结的任务。

默认只更新：

- 代码和测试
- `devflow/changes/<change-key>/task.md` 中的任务状态
- Git commit

不要生成额外过程文件。失败和阻塞写在对用户的响应里；需要长期保留的失败教训交给 `cc-act` 写 incident postmortem。

## TDD Iron Law

```text
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

允许例外：纯配置、纯生成文件、throwaway prototype、用户明确禁止测试。例外必须写进当前 task block。

## Loop

1. 从 `task.md` 选择第一个未完成且依赖满足的任务；必要时用 `scripts/select-ready-tasks.sh` 复核。
2. 读取当前任务涉及的最小代码和测试。
3. Red：写最小失败测试，确认失败原因就是目标行为缺失。
4. Green：写最小实现，不预铺未来分支。
5. Refactor：只清理当前 slice 暴露出的坏味道，保持测试绿。
6. Review：自查 scope、公共 seam、mock 边界、错误路径和文档影响。
7. Complete：运行 `scripts/mark-task-complete.sh --tasks devflow/changes/<change-key>/task.md --task <task-id>`。
8. Commit：每个任务或执行环境完成后提交 Git commit。

## Parallel Rule

只有任务显式允许并行、依赖已满足、触碰路径无重叠、且每个执行环境都能独立提交时，才并行。否则串行。

## Exit

退出时报告任务 ID、验证命令、commit hash、剩余任务或下一步 `cc-check`。不要写过程文件。
