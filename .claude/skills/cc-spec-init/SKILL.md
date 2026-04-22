---
name: cc-spec-init
version: 1.0.1
description: Use when you need to initialize capability specs under `devflow/specs/`, create or evolve capability truth sources, generate `change-meta.json`, or validate roadmap/change/spec links before roadmap, planning, or closeout work continues.
---

# CC-Spec-Init

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、相关模板/脚本引用，然后检查 `CLAUDE.md`

## Role

`cc-spec-init` 是 capability-centered spec 的收口器。

它只做一件事：把系统“当前承诺什么”收成稳定 truth source，并把 `roadmap -> change -> spec` 的链接补齐。

它不是主 workflow 的一环。

主 workflow 仍然是：

- `cc-roadmap`
- `cc-plan` 或 `cc-investigate`
- `cc-do`
- `cc-check`
- `cc-act`

`cc-spec-init` 负责这些动作：

- 初始化 `devflow/specs/`
- 新建 capability spec
- 对 capability 做 `split` / `merge` / `deprecate`
- 生成或修复 `devflow/changes/<change-key>/change-meta.json`
- 重建 `devflow/specs/INDEX.md`
- 校验 capability、roadmap item、change 之间的链接完整性
- 校验 `primaryCapability`、`secondaryCapabilities`、`specFiles` 与 capability map 没有悬空引用

## Read First

1. `PLAYBOOK.md`
2. `CHANGELOG.md`
3. `references/spec-contract.md`
4. `assets/INDEX_TEMPLATE.md`
5. `assets/CAPABILITY_TEMPLATE.md`
6. `assets/CHANGE_META_TEMPLATE.json`

## Use This Skill When

- 你第一次把仓库升级到 capability-centered spec 模型
- 需要创建新 capability spec
- 需要把 change 绑定到 primary / secondary capability
- 需要做 capability 的 `split` / `merge` / `deprecate`
- `cc-roadmap`、`cc-plan`、`cc-act` 发现 spec 链路断了
- 需要在 closeout 前确认 spec/roadmap/change 仍然同构

如果当前工作只是执行一个已冻结任务，不要停在这里，回主 workflow。

## Entry Gate

1. 先读现有 `devflow/specs/INDEX.md`、相关 capability spec、相关 `devflow/ROADMAP.md` / `devflow/BACKLOG.md`、相关 `change-meta.json`。
2. 先判断你是在做 `bootstrap`、`create`、`update-links`、`split`、`merge` 还是 `deprecate`。
3. 先锁定 capability 边界，再写模板；不要先写 prose 再猜结构。
4. 先明确 primary capability，再允许 secondary capabilities 存在。

## Session Protocol

1. 先判断现状：
   - `devflow/specs/` 是否已存在
   - capability 是否已存在
   - 相关 change 是否已有 `change-meta.json`
2. 如果是首次初始化：
   - 创建 `devflow/specs/INDEX.md`
   - 创建 `devflow/specs/capabilities/`
   - 为当前已知 capability 写最小 spec
3. 如果是新 capability：
   - 先写 capability 边界、约束、当前 truth、gaps
   - 再登记到 `INDEX.md`
4. 如果是 change 绑定：
   - 生成或更新 `change-meta.json`
   - 填入 `primaryCapability`、`secondaryCapabilities`、`expectedDelta`、`affectedInvariants`、`gapsClosed`、`newGaps`
5. 如果是 capability 结构调整：
   - 优先 `deprecated` / `mergedInto` / `splitInto`
   - 不要直接物理删除，除非确认没有 roadmap/change 仍在引用
6. 结束前运行链接校验，确认：
   - `INDEX.md` 引到的 capability 文件都存在
   - `change-meta.json` 里的 capability 都能落到 spec
   - roadmap / backlog 里的 capability 引用仍可追踪

## Output

- `devflow/specs/INDEX.md`
- `devflow/specs/capabilities/<capability>.md`
- `devflow/changes/<change-key>/change-meta.json`
- 链接校验结果

## Working Rules

1. `spec` 写现状，不写一次性推导过程。
2. `roadmap` 写未来推进，不写当前 truth。
3. `change-meta.json` 是机器真相源；capability markdown 是人机共读的长期约束源。
4. 一个 change 可以挂多个 capability，但必须有一个 `primaryCapability`。
5. capability 不直接硬删除；优先用状态表达历史连续性。
6. `INDEX.md` 只做目录和状态总览，不复制各 spec 正文。

## Bundled Resources

- 变更记录：`CHANGELOG.md`
- 使用剧本：`PLAYBOOK.md`
- 契约：`references/spec-contract.md`
- 模板：`assets/INDEX_TEMPLATE.md`
- 模板：`assets/CAPABILITY_TEMPLATE.md`
- 模板：`assets/CHANGE_META_TEMPLATE.json`
- 初始化：`scripts/bootstrap-specs.sh`
- 校验：`scripts/validate-spec-links.sh`

## Exit Criteria

- `devflow/specs/` 已建立或已修复
- 相关 capability spec 有明确边界、约束、truth、gaps
- 相关 change 已有 `change-meta.json`
- `INDEX.md`、roadmap、change、spec 之间的链接可追踪
- 下一步可以安心回到 `cc-roadmap`、`cc-plan` 或 `cc-act`

## Do Not

- 不把 roadmap 写回 spec
- 不把执行细节写成 capability truth
- 不允许没有 primary capability 的多 capability change
- 不直接删 capability 文件导致链路断裂
