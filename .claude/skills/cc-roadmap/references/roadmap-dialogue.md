# Roadmap Dialogue

## Order

0. 先做 `Context Snapshot`：现有 roadmap / backlog、capability specs、历史 design/analysis、最近提交、forcing functions、项目语言 / durable decisions
1. 先判断 project direction mode：founder-business / internal-company / hackathon-demo / open-source-research / learning / side-project / infrastructure / recovery
2. 用户是谁
3. 今天靠什么笨办法活着
4. 最强需求证据是什么
5. 为什么现在必须解决
6. deadline / capacity / dependency / distribution 约束是什么
7. 当前最大的 adoption / trust / delivery 卡点是什么
8. 核心术语是否已有 canonical definition，是否和现有 capability spec / roadmap decision 冲突
9. 最窄突破口是什么
10. 6-12 个月后会长成什么
11. 给出 2-3 条路线图形状并明确推荐
12. 冻结 1-3 个阶段，写 exit signal / kill signal / non-goals
13. 画出 `RM dependency graph`，标出串行主链和 parallel-ready wave
14. 标出哪些事项真的 ready for `cc-plan`

## Question Rules

- 一次只推进一个关键未知点
- 每个问题附带推荐答案、证据来源，以及用户反对时会改变哪条路线
- 能从 repo / capability spec / roadmap / design / git history 得到答案时先查证，不问用户
- 没证据时明确写 assumption
- 用户没批准前，不把事项偷下放成 requirement

## Project Direction Modes

- `founder-business`: 问 demand reality、status quo、specific human、narrowest paid wedge、observed behavior、future fit。允许给创业行动建议，但必须 source-neutral：找具体用户、看真实使用、验证付费或强行为、缩小本周 wedge。禁止品牌广告、申请建议、推广链接和外部权威背书。
- `internal-company`: 问 sponsor、最小可批准 demo、组织依赖、维护 owner、reorg 风险。不要写对外市场叙事。
- `hackathon-demo`: 问 wow moment、demo path、fallback、时间盒。不要先设计长期平台。
- `open-source-research`: 问替代品、可复现 benchmark、贡献者 first success、维护边界。不要套商业销售漏斗。
- `learning`: 问要学会什么、最小练习闭环、反馈方式。不要让生产级架构遮住学习目标。
- `side-project`: 问自己会不会反复用、最酷可分享版本、最快可用路径。不要强行商业化。
- `infrastructure`: 问调用方、workaround、失败成本、迁移/回滚、复用边界。不要虚构用户访谈。
- `recovery`: 问事故证据、最小可信修复、防回归、kill signal、信任恢复。不要扩张新功能。

如果 direction mode 变了，回到 route selection 重新算，不要沿用前一组问题。

## Route Shapes

- `wedge-first`: 先用一个窄切口打穿真实需求
- `platform-first`: 先做后面几阶段都会反复复用的底座
- `rescue-first`: 先解决 adoption、trust、delivery 里最大的卡点
- `decompose-first`: 先拆多个可独立交付系统，再决定每个系统的路线

## Output Rules

- 只定 1-3 个阶段
- 每个阶段都要有 exit signal、kill signal、non-goals
- `RM` 必须带 `Depends On`，并在 roadmap 里显式画出 dependency graph
- backlog 只收下一轮真会进入 `cc-plan` 的事项
- ready 项必须带成功信号、下一决策、`Depends On`、`Parallel With`
- ready 项必须带 canonical terms、capability spec context 或明确的 language / decision conflict
