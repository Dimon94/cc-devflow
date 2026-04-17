# operations/
> L2 | 父级: /Users/dimon/.codex/worktrees/03a4/cc-devflow/lib/skill-runtime/CLAUDE.md

成员清单
autopilot-shared.js: 提供 autopilot 共享阶段工具与 snapshot 读取，并复用 lifecycle 共享语义避免 core/execution 漂移。
autopilot-core.js: 承载 autopilot 的阶段判定、approval gate、state 读取与 discover/converge/delegate/finish 核心 runner。
autopilot-execution.js: 承载 autopilot 的执行层循环，处理 direct/controller 与 delegated worker 混合执行。
autopilot.js: 自动驾驶兼容入口，直接组合 shared/core/execution，并只负责阶段顺序编排、起止事件与最终摘要返回。
approve.js: 显式批准当前 plan_version，并锁定 direct/delegate/team 执行模式。
dispatch.js: 执行依赖图中的当前任务前沿，写入 checkpoint/events 与运行状态。
init.js: 初始化 requirement/runtime 目录，并写入 harness-state。
janitor.js: 清理过期 runtime 工件，保留仍在运行的任务状态。
snapshot.js: 采集仓库事实与脚本信息，生成 planning-snapshot。
pack.js: 旧的兼容转发层，把 runPack 映射到 snapshot.js。
plan.js: 基于 TASKS.md 生成 task-manifest，并更新计划状态。
prepare-pr.js: 基于 verify 结果和 task result 生成 PR-ready brief。
release.js: 在验证通过后生成 RELEASE_NOTE，并标记 released。
resume.js: 从最近稳定 checkpoint 恢复执行，重排失败/阻塞任务后复用 dispatch 的执行机制。
verify.js: 运行 quick/strict/review 质量门禁，写 report-card。
worker-run.js: 运行本地 worker/provider 命令，并回写任务、事件和记忆工件。
worker.js: 生成 worker handoff bundle，供本地和 provider worker 复用。

法则: 成员完整·一行一文件·父级链接·技术词前置

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
