# Finding Triage

收集 reviewer 输出后使用本 reference。

## 解析

`NO FINDINGS` 表示该 source 没有报告 finding。

丢弃缺少具体文件、证据或修复路线的 finding line。拒收无法绑定到当前 diff 的猜测输出。

期望格式：

```text
severity | confidence | file:line | category | evidence | fix | route
```

## 去重

Fingerprint 顺序：

1. `{file}:{line}:{category}`
2. `{file}:{category}:{evidence}` when no line is available
3. merge findings with same evidence and same fix

重复 finding 合并规则：

- 保留 confidence 最高的版本。
- 独立 reviewers 命中同一问题时，标记 `multi-specialist` 并 confidence +1，最高 10。
- 先按 `critical -> important -> minor`，再按 confidence 降序排序。

## Confidence Gate

- `7-10`: main findings table
- `5-6`: main table, initial decision `verify-first`
- `3-4`: appendix only; upgrade only after main-thread code review confirms it
- `1-2`: suppress

## 主表

```markdown
| ID | Source | Severity | File:line | Claim | Evidence | Proposed fix | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | spec | critical | | | | | pending |
```

Severity：

- `critical`: 破坏功能、安全、数据或发布真实性。
- `important`: 明显坏味道、spec drift、测试假象或性能风险。
- `minor`: 可读性、局部重复或小优化。

Decision：

- `auto-fix`: 已确认、机械、低风险。
- `fix`: 已确认且位于 cleanup 边界内。
- `ask`: 需要用户判断，或可能改变用户可见行为。
- `verify-first`: 看起来合理，但证据不完整。
- `skip-false-positive`: 被代码事实推翻。
- `skip-not-worth-it`: 成本高于收益，且不影响当前交付。
- `reroute`: 已经不属于 simplify 问题。

## Fix-First 表

默认自动修：

- dead code、unused variable/import、明显 stale comment。
- 简单重复 helper、path/version/changelog 不一致。
- local magic value 替换为已有或邻近常量。
- 明显 O(n*m) 查找改成 map/index，且行为不变。
- 复用本地已有模式的轻量 input shape validation。

默认 ask 或 reroute：

- auth、XSS、injection、secret、permission 或 security boundary。
- race condition、data migration、transaction semantics、enum completeness。
- 超过约 20 行新设计，或触碰超过约 5 个文件。
- 删除功能、改变 public API 或改变用户可见行为。
- finding 推翻了 frozen plan、root cause 或 acceptance criteria。

当 decision 是 `ask` 时，使用 `../cc-dev/references/user-choice-output-protocol.md`。不要继续自动编辑会改变公开行为、安全边界或大设计的 finding。
