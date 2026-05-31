# CC-Simplify Playbook

## 目的

`cc-simplify` 是发货前、验证前的清理关口。它不是顺手重构。它只清除当前 diff 引入或放大的 confirmed smell，然后把工作交回新鲜验证。

## 资源解析

`SKILL.md` 是入口。`PLAYBOOK.md` 和 `references/` 都从当前 `SKILL.md` 所在目录加载，不从 shell cwd 猜路径。

## Phase 1: 识别变更

1. 优先使用当前 Git 证据：
   - 有 staged diff：运行 `git diff --cached` 和 `git diff`
   - 只有 unstaged diff：运行 `git diff HEAD`
   - 没有 diff：审查用户点名或本轮刚编辑过的文件
2. 冻结 cleanup 边界：
   - changed files
   - affected modules
   - stack signals: `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`
   - test signals: `jest`, `vitest`, `pytest`, `go test` 等
   - scope flags: API、auth、backend、frontend、migration、docs、release
   - 相关 `task.md`、capability specs、已经跑过的验证
3. 如果 diff 跨了互不相关模块，先按模块分组；不要把 cleanup 变成全仓大扫除。
4. 历史债只有在阻塞当前交付，或被当前 diff 放大时，才进入范围。

## Phase 2: 只读 Reviewer 调度

触发 `cc-simplify` 本身就表示允许使用宿主支持的只读 reviewer agents。不要再让用户二次授权 subagents。

调度规则、prompt 形状、默认 reviewer、条件 specialist 和 fallback 行为见 `references/reviewer-swarm.md`。

主线程责任不能转交给 subagents：

- 定义 scope packet
- 验证每条 finding
- 决定 fix / ask / reroute / skip
- 编辑文件
- 运行新鲜验证

如果没有 subagent 工具，就在主线程按同样维度审查，并报告 `Agents used: no (subagent tool unavailable)`。

## Phase 3: 分拣 Findings

使用 `references/finding-triage.md` 解析 finding lines，丢弃弱输出，按 fingerprint 去重，执行 confidence gate，并判断每条 finding 是 `auto-fix`、`fix`、`ask`、`verify-first`、`skip-false-positive`、`skip-not-worth-it` 还是 `reroute`。

不要把 reviewer 输出当成 verdict。Subagent findings 只是证据线索。

## Phase 4: 证明坏味道成立

编辑前必须使用 `references/confirmed-smell-gate.md`。

每个修复需要四个事实：

1. code fact：问题确实存在于点名代码中。
2. usage fact：调用方没有推翻这条 claim。
3. requirement fact：task / spec / invariant 允许这个简化。
4. verification fact：修复后有具体检查能证明当前树。

架构类 finding 还需要 deletion test：如果删除 helper、wrapper、seam 或 module 只是把同样复杂度搬到调用方，它可能是有效 deep module，而不是坏味道。

## Phase 5: 只修 Confirmed Smells

修复顺序：

1. critical
2. simple important fixes
3. complex important fixes
4. minor fixes only when low-risk

边界：

- 不做无关 refactor。
- 不改 public API，除非 public API 本身就是 confirmed smell。
- 不把多个架构方向塞进一次 cleanup。
- 不为了删除 3 行重复制造 50 行抽象。
- 如果修复预计触碰超过约 5 个文件，或需要超过约 20 行新设计，停下来询问：拆分、reroute，还是只修 critical path。

需要重新设计时路由到 `cc-plan`；根因被推翻时路由到 `cc-diagnose`；验证缺口路由到 `cc-check`。

## Phase 6: 新鲜验证

编辑后运行能证明 cleanup 的最小当前检查：

1. 格式 / 结构：`git diff --check`、JSON/YAML parse、`bash -n`
2. touched modules 的 targeted test 或 smoke
3. 改动面需要时运行更宽 gate：`npm test`、`npm run verify:*` 或项目等价命令

旧命令输出和 reviewer 报告不能证明编辑后的树。

## 输出

返回紧凑的 `Simplify Report`：

- Reviewed diff:
- Agents used: `yes` / `no`
- Findings fixed:
- Findings skipped:
- Reroutes / blockers:
- Verification run:
- Next step: `cc-check` / `cc-act` / `cc-plan` / `cc-diagnose`

如果 `cc-simplify` 改了代码、测试或验证口径，下一步必须是 `cc-check`；不要带着旧验证进入 `cc-act`。

## 禁止事项

- 不把 cleanup 当成重写入口。
- 不因为 reviewer 建议了就编辑。
- 不把风格偏好升级成 critical。
- 不跳过 spec drift。
- 不用 mock 通过证明真实行为正确。
- 没有新鲜验证时，不声称完成。
