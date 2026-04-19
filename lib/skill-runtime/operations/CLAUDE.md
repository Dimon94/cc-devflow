# operations/
> L2 | 父级: ../CLAUDE.md

阶段分组
初始化与快照: `init.js` 创建 runtime 骨架，`snapshot.js` 采集 discover 阶段需要的只读事实。
计划与批准: `plan.js` 生成 `task-manifest.json`，`approve.js` 锁定批准版本与执行模式。
执行主链: `dispatch.js` 推进当前任务前沿，`resume.js` 从稳定 checkpoint 恢复，`verify.js` 和 `release.js` 负责质量门与发布收口。
交接与工人: `prepare-pr.js` 生成唯一 PR brief，`worker.js`/`worker-run.js` 负责本地或 provider worker handoff 与回写。
自动驾驶: `autopilot-shared.js`、`autopilot-core.js`、`autopilot-execution.js`、`autopilot.js` 拆开共享语义、阶段判定和执行循环，避免单文件失控。
维护类: `janitor.js` 清理过期 runtime 工件，但不改变正在运行任务的真相源。

更新规则
这里只记录阶段入口和职责边界，不维护逐文件穷举说明。
新增 operation 如果只是归入已有阶段，不改此文档；只有出现新阶段或边界迁移时才更新。
阶段入口只保留当前真相源，不为历史别名单独占坑。

法则: 阶段先于文件名·边界先于清单·父级链接稳定

[PROTOCOL]: 变更阶段边界或入口约定时更新此头部，然后检查 CLAUDE.md
