# Confirmed Smell Gate

任何 `cc-simplify` 编辑前都使用本 reference。

猜测性 cleanup candidate 只报告，不编辑。Confirmed smell 必须先具备 code fact、usage fact、requirement fact、verification fact，才能改文件。

## 四个事实

1. Code fact：打开点名文件和相邻实现，证明坏味道存在于当前树。
2. Usage fact：用 `rg` 搜调用方，证明 reviewer 没漏掉真实 caller contract。
3. Requirement fact：对照 `task.md`、capability spec、public API 和 product invariant，证明简化保留 required behavior。
4. Verification fact：点名能证明编辑后树的具体命令、测试、parser、smoke 或人工检查。

## Deletion Test

架构类 finding 在删除、保留或重塑 module、wrapper、seam、helper 前，必须通过 deletion test。

- 如果删除只会把同样复杂度散回调用方，代码可能是有效 deep module。
- 如果删除能让概念消失，或只留下更简单的直接调用，它多半是 pass-through / fake seam。
- 如果删除会违反 capability invariant 或 public contract，它不是 cleanup edit。

## 可修的 Confirmed Smells

- confirmed duplicated branch
- 有本地 canonical replacement 的 repeated helper
- false test seam
- shallow wrapper
- 被当前行为反驳的 stale code 或 comment
- 行为不变的局部低效 lookup
- 可复用现有本地模式的小 validation gap

## False-Positive 抑制

这些不要报成 findings：

- 为可读性保留的轻微重复。
- 行为已经被清晰断言覆盖。
- 在产品输入域下不可能出现的 edge case。
- 一个测试覆盖多个 guards，且行为清楚。
- 当前 diff 已经修掉的问题。
- shutdown、emergency 或 fire-and-forget 路径里有意吞错。
- 作为稳定 public API、背后有真实实现的 pass-through wrapper。

## 新鲜验证

编辑后运行新鲜检查。旧命令输出、reviewer 输出、历史聊天 claim 都不能证明当前树。
