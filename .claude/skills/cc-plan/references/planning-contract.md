# Planning Contract

## Hard Rules

1. `cc-plan` writes only `task.md`.
2. Git commit records Plan completion.
3. Clarification, approval, review notes, and execution protocol live inside `task.md`.
4. No process file beyond `task.md`.
5. New change keys come from `cc-devflow next-change-key`.
6. Branch binds to the full change key before durable output.
7. User decisions that affect scope, design, or verification are written into `task.md#Contract Summary`.
8. Planning flow results are written into `task.md#Contract Summary`; removing old process files must not remove planning thought.
9. Placeholder tasks are invalid.
10. Behavior work uses tracer bullets and TDD unless an exception is recorded.
11. Roadmap sync, when needed, happens through roadmap files and Git commit, not change metadata.
12. Non-trivial plans complete Second-Move Review before approval; the first workable plan is not frozen until a simpler move and a better-architecture move have both been considered.
13. Non-trivial plans complete product/creative discovery before engineering design; if worth, shape, wedge, or 10x/better version is unclear, ask product questions before implementation questions.
14. Product/creative confirmation and engineering confirmation are separate rounds unless roadmap/spec evidence already answers one of them and `task.md` records the skip reason.
15. Non-trivial plans run a Socratic Dialogue before final approval: one question at a time, recommended answer included, repo-answerable questions answered from evidence first, and task generation blocked until the user explicitly says the requirement and technical plan are detailed enough.
16. Technical Socratic dialogue must challenge 3 hidden assumptions, overengineering risk, and the current code or proposal with an adversarial review before task blocks are generated.
17. Every 10 user-facing Socratic question rounds, write a Dialogue Checkpoint into `task.md#Contract Summary` before asking the next question.
18. ASCII branch-chain connector tokens stay ASCII, but labels, evidence, and explanatory text follow `Output language`.
19. User-facing decisions use `../cc-dev/references/user-choice-output-protocol.md`: host-native structured choice first, fixed A/B/C text fallback only when no structured-input tool exists.

## Planning Flow

Every non-trivial plan confirms these rounds before task generation:

1. Product/Creative Discovery: worth doing, desired product shape, narrowest wedge, 10x/better version, do-nothing consequence.
2. Requirement Reality: real user/operator, workaround, painful failure, smallest success signal, non-goals.
3. System Shape: existing code path, module owner, state/data flow, reuse point, boundary systems.
4. Interface/Data Contract: public seam, caller, input/output, fields, error shape, permission/boundary.
5. Abstraction Boundary: where complexity lives, rejected abstractions, public/private method split.
6. Execution Architecture: foundation/core/integration/polish decisions, file responsibility, failure recovery.
7. Task Contract: tracer bullets, Red test names, public seams, Green minimality, refactor candidates.
8. Second-Move Review: first good move, simpler move, better architecture, selected move, and rejected tradeoff.
9. Final Approval: approved option and task contract summary.

Tiny plans may compress a round to one evidence-backed line. Full designs must preserve enough detail that `cc-do` does not invent architecture, fields, interfaces, or tests.

## Planning Standard

- Use the smallest reversible design that solves the real need; do not expand to imaginary future enemies.
- Missing evidence is recorded as an assumption; it is not promoted to fact.
- Product/creative confirmation comes before implementation questions: worth doing, target experience, narrowest wedge, 10x/better version, and do-nothing consequence.
- The first workable plan is not enough for non-trivial work. Record first good move, simpler move, better architecture, selected move, and rejected tradeoff.
- Plans resolve architecture, interfaces, fields, and test seams before task generation; `cc-do` must not guess them.
- Behavior tasks use tracer bullets: `[TEST] -> [IMPL] -> [REFACTOR]`, not horizontal layer slicing.
- Regression tests cannot be deferred. If no honest seam exists, plan a spike or design correction.

## Socratic Dialogue

The dialogue is complete only when both releases are explicit:

- Requirement release: the user confirms the demand, user/operator, status quo, success signal, non-goals, and scope are detailed enough to enter technical planning.
- Technical release: after repo evidence or proposal review, the user confirms the interface, data contract, abstraction boundary, test seam, and task shape are detailed enough to generate tasks.

Record repo-answered questions, user-answered rounds, ten-round Dialogue Checkpoints, hidden assumptions, overengineering challenge, adversarial review findings, and the release phrase in `task.md#Contract Summary`.

Each Dialogue Checkpoint covers the last 10 user-facing question rounds and records round range, next question number, decisions made, rejected options and reasons, remaining open questions, evidence read, hidden assumptions or review findings so far, and current release status. After context compression, resume from the latest checkpoint before asking another question.

## Decision Questions

Ask only when the answer changes product value, product shape, scope, design, task split, interface, or verification. Before asking, run Second-Move Review on the question itself: can repo evidence answer it, is it too implementation-shaped for the user, and would a better question freeze more downstream decisions? Product/creative questions come before engineering questions when worth or shape is unclear. Use `D<N>` with known evidence, recommendation, 2-3 mutually exclusive options, impact, and a stop point. Prefer Codex `request_user_input` or Claude Code structured input when available; use the fixed A/B/C fallback only when no structured-input tool exists. Record the answer in `task.md#Contract Summary`.

Fixed fallback format:

```text
D<N> - <decision title>
Planning object: <REQ/FIX/RM/change key>
Known evidence: <repo / roadmap / code / test facts>
Decision needed: <what changes downstream>
Recommendation: <A/B/C> because <reason>
Options:
A) <label> (recommended)
  Good: <upside>
  Cost/Risk: <cost or risk>
B) <label>
  Good: <upside>
  Cost/Risk: <cost or risk>
C) <label, optional>
  Good: <upside>
  Cost/Risk: <cost or risk>
Impact: <what cc-do will do differently>
STOP: wait for the user answer before continuing.
```

## ASCII Branch Chain Analysis

`task.md#Contract Summary` contains an ASCII branch-chain block. The tree is execution contract, not decoration.

Language rule:

- Tree structure tokens stay ASCII: `|--`, `` `-- ``, `|`, spaces, and plain punctuation.
- Node labels, placeholder text, explanations, and evidence summaries follow `Output language` in `task.md`.
- If `Output language` is unset, use the current conversation language and record the assumption.
- Do not hard-code English labels such as `Requirement Impact Chain` when the configured output language is not English.
- Use this label table as the shared source for chain titles, node labels, and placeholder text.

| Semantic slot | en | zh-CN |
| --- | --- | --- |
| requirementChain | Requirement Impact Chain | 需求影响链 |
| requirementMarker | REQ | 需求 |
| upstreamSource | Upstream source | 上游来源 |
| currentCodePath | Current code path | 当前代码路径 |
| caller | caller | 调用方 |
| dataOrState | data or state | 数据或状态 |
| deepestAffectedLayer | deepest affected layer | 最深影响层 |
| requiredChange | Required change | 必要变更 |
| verificationSeam | Verification seam | 验证缝隙 |
| businessChain | Business Impact Chain | 业务影响链 |
| outcomeMarker | OUTCOME | 结果 |
| directBehaviorImpact | Direct behavior impact | 直接行为影响 |
| downstreamImpact | Downstream impact | 下游影响 |
| riskBranch | Risk branch | 风险分支 |
| nonGoalBranch | Non-goal branch | 非目标分支 |

```text
<requirementChain>
<requirementMarker>: <user-visible change>
|-- <upstreamSource>: <roadmap / issue / user request / existing task>
|-- <currentCodePath>: <entry>
|   |-- <caller>: <file / command / UI / API>
|   |-- <dataOrState>: <field / config / artifact>
|   `-- <deepestAffectedLayer>: <module / prompt / provider contract / storage>
|-- <requiredChange>: <smallest behavior delta>
`-- <verificationSeam>: <public test / command / artifact>

<businessChain>
<outcomeMarker>: <operator / user value>
|-- <directBehaviorImpact>: <what changes for user>
|-- <downstreamImpact>: <consumers / docs / examples / release>
|-- <riskBranch>: <regression / migration / support / cost>
`-- <nonGoalBranch>: <explicitly not changed>
```

Trace upstream source before downstream impact. Always find the deepest affected data model, state machine, CLI/runtime, prompt, provider contract, storage, or external boundary. If a branch lacks evidence, write `unknown -> Evidence Request`.

## Engineering Review Gate

Before freezing task blocks, write a lightweight review into `task.md#Contract Summary`:

1. Existing leverage map: map each subproblem to existing code, scripts, specs, templates, or tests.
2. Scope challenge: if the plan touches more than 8 files, adds more than 2 services/classes, or creates cross-module coupling, explain why this is not overengineering.
3. Second-Move Review: compare first good move, simpler move, better architecture, selected move, and rejected tradeoff.
4. Domain language check: align core nouns, filenames, test names, and task titles with repo truth; otherwise record an assumption.
5. Interface depth check: keep the public surface small and deep; hide complexity inside the owning module.
6. Test seam check: Red tasks prove behavior through public interface, caller flow, or user-visible path.
7. Mock boundary check: mock only external API, time, randomness, filesystem, network, or required database seams.
8. Feedback loop check: pick the shortest credible feedback loop for every behavior.

## Required Task Fields

- goal
- user or edge story
- files
- dependencies
- TDD phase
- public verification path
- verification command
- completion evidence
- completion command
- commit point

## Review Gate

Before exit, check product/creative discovery, scope, existing leverage, Second-Move Review, domain language, interface depth, test seam, mock boundary, feedback loop, and failure modes. If the plan is not executable from `task.md`, it is not done.
