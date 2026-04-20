# Spec Contract

## Truth Layers

- `devflow/ROADMAP.md` / `devflow/BACKLOG.md`: 未来推进什么 capability
- `devflow/specs/INDEX.md`: capability 总目录与当前状态快照
- `devflow/specs/capabilities/*.md`: 某个 capability 当前承诺什么
- `devflow/changes/<change>/change-meta.json`: 某次 change 如何影响 capability

## Capability Rules

1. 以用户可感知能力为主，内部系统能力为辅。
2. `Boundary`、`Invariants`、`Current Truth` 是核心，不要被 narrative 淹没。
3. `Missing` 与 `Intentional Gaps` 必须长期保留。
4. capability 名称要稳定、可重用，不要按一次需求命名。

## Change Meta Rules

1. `primaryCapability` 必填。
2. `secondaryCapabilities` 可空，但必须有明确原因。
3. `changeType` 只使用：`create`、`update`、`split`、`merge`、`deprecate`。
4. `syncStatus` 生命周期：`planned -> verified -> synced`。
