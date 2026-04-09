# harness/
> L2 | 父级: /Users/dimon/.codex/worktrees/03a4/cc-devflow/CLAUDE.md

成员清单
index.js: 聚合导出 harness 基础模块，供 CLI 与测试统一引用。
schemas.js: 定义 manifest/report/checkpoint/harness-state 的 Zod 契约，阻断脏数据进入执行层。
store.js: 提供路径规范、JSON/文本读写、JSONL 事件记录与 shell 命令执行。
intent.js: 将 harness 运行时状态同步为 `devflow/intent/<goal>/` 下的 Markdown 记忆、delegation briefs/results、PR brief 与 resume-index。
team-state.js: 维护 `devflow/intent/<goal>/artifacts/team-state.json` 真相源，并按需同步 `orchestration_status.json` 兼容镜像。
delegation.js: 生成本地 assignment、shared memory、message bus、worker workspace 选择，并复用 team-state 维护 Team runtime 状态。
operations/CLAUDE.md: 记录 operations 目录的阶段入口、职责边界与文件地图。
operations/worker.js: 生成本地 worker handoff bundle，作为 worker-run 或 provider-specific launcher 的稳定入口。
operations/worker-run.js: 在本地 workspace 按 task 粒度执行 worker 命令，并以最薄 launcher 适配 codex/claude，回写 manifest、runtime events、session.log、checkpoint、Task Result、state、journal、message bus 与目标 assignment 状态。
planner.js: 将 TASKS.md 解析为 dependency-aware 的 task-manifest.json。
lifecycle.js: 收敛 lifecycle stage、approval truth 与 direct/delegate/team 路由语义，供 intent/query/autopilot/dispatch 共享。
query.js: 聚合分散状态文件，提供 getProgress/getNextTask/getFullState 查询函数，并暴露 prepare-pr 阶段与 pr-brief 路径。
cli.js: 解析命令参数并分发到 operations 子模块。
operations/init.js: 初始化 requirement 与 runtime 目录并写入 harness-state。
operations/pack.js: 采集 git 与脚本事实，生成 context-package.md。
operations/plan.js: 调用 planner 生成 task-manifest.json，更新 harness-state 为 planned。
operations/approve.js: 为当前 plan_version 写入 approval 真相源，并把执行模式锁定到 direct/delegate/team。
operations/prepare-pr.js: 复用 intent PR brief 生成器，输出 PR-ready 简报并同步 decision-log / resume-index。
operations/autopilot-shared.js: 提供 autopilot 共享阶段工具、approval 判定与 snapshot 读取，作为 core/execution 的共同基础层。
operations/autopilot-core.js: 承载 autopilot 的阶段判定、approval gate、state 读取与 discover/converge/delegate/finish 核心 runner。
operations/autopilot-execution.js: 承载 autopilot 的执行层循环，处理 direct/controller 与 delegated worker 混合执行。
operations/autopilot-stages.js: 聚合 autopilot-shared、autopilot-core 与 autopilot-execution，作为 autopilot 总入口的稳定依赖面。
operations/autopilot.js: 复用 autopilot-stages 推进最薄自动驾驶闭环，只保留阶段顺序与最终摘要返回。
operations/dispatch.js: 依据依赖图与文件冲突并行执行任务，写 checkpoint 与 events，更新 harness-state 为 in_progress。
operations/resume.js: 从最近稳定 checkpoint 恢复中断任务，重排失败/阻塞任务后复用 dispatch 继续执行。
operations/verify.js: 执行 quick/strict 质量门禁并输出 report-card.json，通过时更新 harness-state 为 verified。
operations/release.js: 读取通过的 report-card，生成 RELEASE_NOTE 并标记 released。
operations/janitor.js: 清理过期 runtime 工件，保留运行中任务状态。
__tests__/planner.tdd.test.js: 覆盖 planner 的 TDD 顺序校验。
__tests__/lifecycle.test.js: 覆盖共享 lifecycle 层的 approval/stage/route 语义，防止 query 与 intent 再次漂移。
__tests__/intent.test.js: 覆盖 intent Markdown memory 与 checkpoint/resume-index 生成。
__tests__/team-state.test.js: 覆盖 Team 真相源写入、兼容镜像同步与旧状态回退读取。
__tests__/autopilot.test.js: 覆盖 autopilot 在 approval gate 前停住，并在批准后恢复执行/发布。
__tests__/dispatch.test.js: 覆盖 dispatch 对 approval gate 与 stale plan_version 的拒收逻辑。
__tests__/delegation.test.js: 覆盖 assignment、message bus、team-state 真相源与兼容状态镜像生成。
__tests__/worker.test.js: 覆盖 worker handoff bundle 与 launch/state/journal 生成。
__tests__/worker-run.test.js: 覆盖 codex/claude launcher 命令拼装、provider prompt 构建、多任务 worker 的 task 粒度回写，以及 session.log 落盘与 completed/failed 状态回写。

法则: 成员完整·一行一文件·父级链接·技术词前置

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
