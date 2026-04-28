# Roadmap Dialogue

## Order

0. 先做 `Context Snapshot`：现有 roadmap / backlog、capability specs、历史 design/analysis、最近提交、forcing functions、项目语言 / durable decisions
1. 用户是谁
2. 今天靠什么笨办法活着
3. 最强需求证据是什么
4. 为什么现在必须解决
5. deadline / capacity / dependency / distribution 约束是什么
6. 当前最大的 adoption / trust / delivery 卡点是什么
7. 核心术语是否已有 canonical definition，是否和现有 capability spec / roadmap decision 冲突
8. 最窄突破口是什么
9. 6-12 个月后会长成什么
10. 给出 2-3 条路线图形状并明确推荐
11. 冻结 1-3 个阶段，写 exit signal / kill signal / non-goals
12. 画出 `RM dependency graph`，标出串行主链和 parallel-ready wave
13. 标出哪些事项真的 ready for `cc-plan`

## Question Rules

- 一次只推进一个关键未知点
- 每个问题附带推荐答案、证据来源，以及用户反对时会改变哪条路线
- 能从 repo / capability spec / roadmap / design / git history 得到答案时先查证，不问用户
- 没证据时明确写 assumption
- 用户没批准前，不把事项偷下放成 requirement

## Route Shapes

- `wedge-first`: 先用一个窄切口打穿真实需求
- `platform-first`: 先做后面几阶段都会反复复用的底座
- `rescue-first`: 先解决 adoption、trust、delivery 里最大的卡点

## Output Rules

- 只定 1-3 个阶段
- 每个阶段都要有 exit signal、kill signal、non-goals
- `RM` 必须带 `Depends On`，并在 roadmap 里显式画出 dependency graph
- backlog 只收下一轮真会进入 `cc-plan` 的事项
- ready 项必须带成功信号、下一决策、`Depends On`、`Parallel With`
- ready 项必须带 canonical terms、capability spec context 或明确的 language / decision conflict
