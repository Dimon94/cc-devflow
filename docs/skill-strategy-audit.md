# External Skill Strategy Audit

本审计覆盖 `/Users/dimon/001Area/80-CodeWorld/003-project/skills` 下的 22 个
`SKILL.md`。目标不是复制外部 skill，而是抽取能让 cc-devflow 原生 workflow
更稳的策略，并把不适合迁移的部分明确跳过。

## Migration Summary

| Source skill | Good strategy | cc-devflow target | Decision |
| --- | --- | --- | --- |
| `deprecated/design-an-interface` | "design it twice"，用不同接口形态比较 depth、易用错点和隐藏复杂度 | `cc-plan` | 迁移为接口备选比较 gate，不迁移 parallel subagent 强制要求 |
| `deprecated/qa` | 用户视角 issue、轻量澄清、按可独立验证行为拆分 | `cc-act` / `cc-plan` | 迁移为 follow-up / issue handoff 的行为化规则 |
| `deprecated/request-refactor-plan` | 重构计划拆成 tiny commits，每步保持可运行 | `cc-plan` / `cc-act` | 迁移为 refactor slicing 和 bisectable commit 规则 |
| `deprecated/triage-issue` | 先查根因，再写 TDD fix plan，issue 不绑定易腐烂文件行号 | `cc-diagnose` / `cc-plan` | 迁移为 repair contract 和 durable issue brief 规则 |
| `deprecated/ubiquitous-language` | canonical terms、aliases to avoid、ambiguity flag | `cc-spec-init` / `cc-plan` | 迁移为 capability/domain language glossary gate |
| `engineering/diagnose` | 反馈回路优先级、提高 flaky 复现率、假设必须可证伪、debug tag cleanup | `cc-diagnose` | 已有大部分；补强 loop sharpening 和 postmortem handoff |
| `engineering/github-triage` | label state machine、needs-info 保留已确认事实、resume triage notes | `cc-act` | 迁移为远端 issue/PR closeout 的状态一致性规则 |
| `engineering/grill-with-docs` | 术语冲突立即叫停、具体场景压测、ADR 只记难逆/意外/真实取舍 | `cc-plan` | 已有大部分；补强 glossary update 和 ADR sparsity |
| `engineering/improve-codebase-architecture` | deep module、deletion test、one adapter vs two adapters、locality/leverage | `cc-simplify` / `cc-plan` | 迁移为架构坏味道确认清单 |
| `engineering/tdd` | 禁止水平切片，使用 tracer bullet 垂直 Red/Green 循环 | `cc-do` / `cc-plan` | 已有 planning 规则；补强执行阶段逐条 task 的 tracer bullet guard |
| `engineering/to-issues` | 独立可领的 vertical slices，HITL/AFK 标注，依赖顺序创建 | `cc-plan` / `cc-act` | 迁移为 task / follow-up 切片规则 |
| `engineering/to-prd` | 从现有上下文合成 PRD，测试决策只写行为和模块，不写短期文件路径 | `cc-plan` | 迁移为 design durable output 规则，不迁移 GitHub issue 自动创建 |
| `misc/git-guardrails-claude-code` | 阻断危险 git 动作，保留用户确认边界 | `cc-act` | 迁移为 destructive / publish action guard，不迁移 Claude hook 实现 |
| `misc/migrate-to-shoehorn` | 测试里的 partial fixture 要显式表达，不用不透明 cast 掩盖类型事实 | `cc-do` / `cc-check` | 迁移为通用 test fixture discipline，不绑定 shoehorn 依赖 |
| `misc/scaffold-exercises` | 生成目录后必须跑专用 lint，移动用 `git mv` 保留历史 | `cc-act` | 仅迁移验证/移动原则；课程目录规则不迁移 |
| `misc/setup-pre-commit` | 根据实际包管理器和已有 scripts 装配 hook，最后用真实 hook smoke | `cc-act` | 仅作为工具链变更验证参考，不迁移 Husky 方案 |
| `personal/edit-article` | 文档结构按依赖顺序组织，段落短、信息先后可追踪 | `docs-sync` | 迁移为 docs-sync 叙事顺序规则 |
| `personal/obsidian-vault` | index note、wikilink、反向查找的知识图谱维护 | none | 个人知识库规则，不迁移到 cc-devflow |
| `productivity/caveman` | 压缩沟通但保留精确技术事实，复杂步骤暂时恢复完整表达 | `cc-act` / output style | 作为输出风格参考，不写进 workflow 合约 |
| `productivity/grill-me` | 一次一个问题；能查代码就别问用户 | `cc-plan` | 已有规则；审计确认不重复迁移 |
| `productivity/write-a-skill` | description 是触发真相源；SKILL.md 要短，复杂内容下沉到 references/scripts | `docs-sync` | 迁移为 skill contract quality gate |

## Implementation Order

1. `cc-plan`: 吸收接口备选、领域语言、垂直切片和 durable design 输出规则。
2. `cc-diagnose`: 补强 feedback loop sharpening、flaky rate、postmortem handoff。
3. `cc-do`: 补强 tracer bullet 执行和 test fixture discipline。
4. `cc-simplify`: 增加 deep module / deletion test / adapter reality 检查。
5. `cc-act`: 增加 issue/PR 状态、危险 git 动作、工具链验证和 durable follow-up 规则。
6. `docs-sync`: 增加 skill 合约质量 gate 和文档依赖顺序检查。

## Skip Rules

- 不迁移个人路径、个人 vault、课程目录命名、具体第三方测试依赖。
- 不把 deprecated skill 的 GitHub issue 自动创建行为搬进主流程；cc-devflow 仍以
  durable local artifact 和可选 remote handoff 为主。
- 不新增一套平行 skill；所有迁移必须落回现有 `cc-*` workflow 语义。
