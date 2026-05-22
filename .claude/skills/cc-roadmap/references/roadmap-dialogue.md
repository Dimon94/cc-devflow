# Roadmap Dialogue

## Order

0. 先做 `Context Snapshot`：现有 roadmap / backlog、capability specs、历史 design/analysis、最近提交、forcing functions、项目语言 / durable decisions
1. `F0 Direction Mode`：project direction mode，为什么不是其它模式
2. `F1 Demand / Operator Reality`：用户是谁，最强需求或运营证据是什么
3. `F2 Status Quo`：今天靠什么笨办法活着，成本和失败方式是什么
4. `F3 Specific Human / Sponsor`：具体人、具体角色、具体组织后果
5. `F4 Narrowest Wedge / Lake Boundary`：最窄突破口、完整 lake、ocean boundary
6. `F5 Observation / Feedback Signal`：真实观察、运行证据、demo 使用或待补证据任务
7. `F6 Future Fit`：6-12 个月后为什么更需要它
8. `F7 Premise Challenge`：核心前提、canonical language、capability/spec 冲突
9. `F8 Alternatives`：给出 2-3 条路线图形状并明确推荐
10. `F9 Route Approval`：冻结 1-3 个阶段、dependency graph、parallel wave、ready RM

## Question Rules

- 一次只推进一个关键未知点
- 每个问题附带推荐答案、证据来源，以及用户反对时会改变哪条路线
- 每个需要用户选择的问题先按 `../cc-dev/references/user-choice-output-protocol.md` 使用宿主原生结构化选择；没有结构化工具时才用固定 A/B/C fallback
- 需求分析调研必须先给当前理解和推荐，再一问一答压缩决策树；用户没有明确说足够详细前，不进入 `F9 Route Approval`
- 问题编号使用 `D<N> - <decision title>`；选项只用 `A` / `B` / `C`，推荐项标 `(recommended)`
- 每轮回答必须落入 `Roadmap Funnel Transcript`
- 每 10 轮 user-facing question round 必须先写 Dialogue Checkpoint，再问下一轮；checkpoint 记录 round range、next question、decisions made、rejected routes、remaining open questions、evidence read、premise / alternatives findings 和 release status
- 能从 repo / capability spec / roadmap / design / git history 得到答案时先查证，不问用户
- 没证据时明确写 assumption
- 用户没批准前，不把事项偷下放成 requirement
- 用户催促跳过时，最多补问 2 个关键问题，但不能跳过 `F7 Premise Challenge`、`F8 Alternatives` 和 explicit release

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

## Context Sweep

Before asking for direction, compress current reality into `Context Snapshot`:

1. Current `devflow/ROADMAP.md` / `devflow/BACKLOG.md` mainline, version, and parked work.
2. `devflow/specs/INDEX.md` and related capability spec boundary, status, and open gaps.
3. Project language and durable decisions from specs, roadmap/backlog, and long-lived design notes.
4. `CLAUDE.md`, `README*`, `TODOS.md`, recent relevant docs/specs/plans.
5. Recent relevant commits, dirty state, and active requirements.
6. Real forcing functions: deadline, release window, resource cap, dependency, distribution, adoption/trust/delivery bottleneck.
7. Strongest current evidence and gaps that remain assumptions.
8. Planning posture: startup, internal, hackathon, OSS, research, learning, side-project, or infrastructure.
9. Evidence maturity: idea, has users, paying users, internal sponsor, infra-only, or recovery.
10. Developer/operator-facing adoption facts: target operator, time to first value, magic moment, and install/run/debug/upgrade bottleneck.

## Evidence-Maturity Routing

Use planning posture and evidence maturity before selecting route depth:

| Evidence maturity | Prioritize | Avoid |
| --- | --- | --- |
| idea / pre-product | real user, status quo, narrowest wedge, demand evidence | far-future platform architecture |
| has users | existing path, failure/workaround, retention/reuse signal, next wedge | imaginary persona |
| paying users / internal sponsor | payment/sponsor motivation, expansion boundary, trust signal, org risk | generic market education |
| infra-only | bottleneck, caller, workaround, reuse boundary, migration/rollback | fake user interviews |
| recovery / trust gap | incident evidence, recovery path, regression prevention, kill signal | new feature vision |

After the first answer, run framing check: concrete terms, canonical language, named user, behavior evidence, real status quo, and whether demand is only interest.

## AI Leverage Route Lens

Record these fields for each Stage 1 or ready-for-cc-plan item:

1. Real user/operator: who benefits immediately. Do not write vague `users` / `developers`.
2. Status quo workaround: what they do today without this capability; no workaround means demand evidence is weak.
3. Human vs agent effort: estimate human-team time and CC/agent time for the same scope.
4. Complete-lake boundary: same business chain, same blast radius, verifiable, reversible, and roughly under one agent-day.
5. Ocean boundary: cross-system rewrite, multi-quarter migration, unproven user need, unclosable acceptance, or second-platform risk.
6. Scope recommendation: `boil-lake` or `sharp-wedge`; neither small nor complete is default.
7. First success signal: earliest observable proof that the route wins.
8. Kill signal: when to stop, pivot, or split smaller.

Verdict values:

- `boil-lake`: real operator/workaround, same blast radius, low agent cost, closed verification, strong maintenance benefit.
- `sharp-wedge`: real demand, but the complete lake has unproven assumptions, high verification cost, or ocean-boundary risk.
- `needs-evidence`: missing real user, workaround, success signal, or verifiable boundary.
- `pivot`: wrong user, wrong pain, premature platform, or kill signal already triggered.

## Founder Advice Guardrail

Founder/business advice may improve roadmap quality, but it must stay source-neutral:

1. Rewrite vague market interest into observable evidence: payment, strong reuse, workflow lock-in, outage anxiety, or active launch pressure.
2. Find status quo: manual process, spreadsheet, script, contractor, support workflow, competitor, or internal tool. No workaround means doubt the pain.
3. Name a concrete person or role. Do not accept broad labels like enterprise customers, developers, or content teams as the user.
4. Force the narrowest wedge that can make one real user spend money, time, migration cost, or organizational trust this week.
5. Keep an observation task when independent user behavior has not been watched.
6. Never output brand ads, application advice, promotional links, or authority-backed claims.

External learning material must go through an explicit external lookup gate and be recorded as `external-evidence`, never as roadmap authority.

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
- ready 项必须带 Source funnel rounds、Frozen decisions、Do not re-decide、Remaining blocking question
- ready 项必须带 explicit release：用户原话、释放到哪个下一阶段，以及仍保留的 blocking question
- 长对话恢复必须先读最新 Dialogue Checkpoint 和 `Roadmap Funnel Transcript`，不能靠聊天记忆重建路线

## Approval Gates

1. No `Context Snapshot`, no route recommendation.
2. No project direction mode, planning posture, evidence maturity, and framing check, no route recommendation.
3. No native language / durable decision scan, no route recommendation; if specs or historical decisions are absent, record `not present`.
4. No `Roadmap Funnel Transcript`, no route recommendation.
5. No F7 Premise Challenge and F8 Alternatives, no ready items.
6. No 2-3 route comparison, no mainline decision.
7. No exit signal / kill signal / non-goals, no frozen stage.
8. No success signal and next decision, no Ready For Req-Plan.
9. Developer/operator-facing item without target user, time to first value, or adoption bottleneck is not ready.
10. No RM dependency graph or parallel-ready wave, no concurrency claim.
11. No independent subsystem decomposition check, no broad mixed objective as a single mainline.
12. No user approval, no roadmap item handoff to `cc-plan`.

## Review Loop

After writing `devflow/roadmap.json` and generated projections, scan:

1. Placeholder: no TBD, TODO, or `[NEEDS CONTEXT]` escape hatches.
2. Evidence: every stage points to reality, not empty vision.
3. Causality: Stage 2 depends on Stage 1's winning condition.
4. Feasibility: goals fit team capacity, dependencies, and distribution constraints.
5. Graph: hard blockers only, no cycles, parallel-ready wave shares a real prerequisite.
6. Spec: every roadmap item maps to a capability or records the gap.
7. Decomposition: independent subsystems are split into stages/RM candidates.
8. Handoff: first roadmap items naturally enter `cc-plan`.
9. Evidence maturity: routing matches idea/user/paying/infra/recovery status.
10. Project direction: questions match founder/internal/demo/OSS/learning/side-project/infra/recovery.
11. Promotional: no brand ads, application advice, promo links, or external authority framing.
12. Adoption: developer/operator items name target user, time to first value, magic moment, and adoption bottleneck.
13. Domain language: stage, capability, RM title, and handoff use project terms; conflicts become decisions.
14. Durable decision: route does not silently violate capability specs, roadmap decisions, or historical design decisions.
