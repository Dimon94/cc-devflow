# skill-runtime/
> L2 | 父级: ../../CLAUDE.md

职责分组
入口层: `cli.js` 负责命令分发，`index.js` 提供给测试和内部脚本的稳定聚合入口。
基础层: `schemas.js`、`store.js`、`paths.js` 管住契约、持久化与路径规则，避免执行层重复造轮子。
状态层: `artifacts.js`、`lifecycle.js`、`query.js`、`review.js`、`team-state.js` 维护运行时真相源与只读查询。
规划与交接: `planner.js`、`intent.js`、`delegation.js` 把任务解析、handoff 生成和 team/workspace 委派收口成统一语义。
阶段操作: `operations/` 是唯一 stage 入口目录；具体阶段边界见 `operations/CLAUDE.md`。
测试布局: `__tests__/` 紧贴模块放置单元、回归与集成测试；顶层 `test/` 不再承载 `skill-runtime` 私有测试。

更新规则
只在职责边界变化时更新此头部，不为每个新增文件补一条手写目录索引。
新增文件优先归入现有分组；如果放不进去，先反思分层是否失真，再决定是否扩展分组。
测试命名要表达语义，例如 `*.integration.test.js`、`*.tdd.test.js`；文档不维护穷举名单。

法则: 职责先于文件名·分组先于清单·父级链接稳定

[PROTOCOL]: 变更职责边界或目录约定时更新此头部，然后检查 CLAUDE.md
