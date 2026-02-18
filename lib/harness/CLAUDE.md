# harness/
> L2 | 父级: /Users/dimon/001Area/80-CodeWorld/002-devflow/cc-devflow/CLAUDE.md

成员清单
index.js: 聚合导出 harness 基础模块，供 CLI 与测试统一引用。
schemas.js: 定义 manifest/report/checkpoint 的 Zod 契约，阻断脏数据进入执行层。
store.js: 提供路径规范、JSON/文本读写、JSONL 事件记录与 shell 命令执行。
planner.js: 将 TASKS.md 解析为 dependency-aware 的 task-manifest.json。
cli.js: 解析命令参数并分发到 operations 子模块。
operations/init.js: 初始化 requirement 与 runtime 目录并写入 harness-state。
operations/pack.js: 采集 git 与脚本事实，生成 context-package.md。
operations/plan.js: 调用 planner 生成 task-manifest.json。
operations/dispatch.js: 依据依赖图与文件冲突并行执行任务，写 checkpoint 与 events。
operations/resume.js: 恢复中断任务并复用 dispatch 继续执行。
operations/verify.js: 执行 quick/strict 质量门禁并输出 report-card.json。
operations/release.js: 读取通过的 report-card，生成 RELEASE_NOTE 并标记 released。
operations/janitor.js: 清理过期 runtime 工件，保留运行中任务状态。

法则: 成员完整·一行一文件·父级链接·技术词前置

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
