# CC-Spec-Init Playbook

## Core Rules

1. 先定 capability 边界，再写 spec 文本。
2. `spec` 记录现状，`roadmap` 记录未来，`change-meta` 记录桥接。
3. 同一个 change 可以多挂 capability，但只能有一个 primary capability。
4. 正常演化优先 `deprecated` / `merged` / `split`，不要直接物理删除。
5. 每次变更结束都跑链接校验，别把断链留到下轮执行。

## Standard Modes

### Bootstrap

- 建 `devflow/specs/INDEX.md`
- 建 `devflow/specs/capabilities/`
- 为当前最重要的 capability 建最小 truth source

### Create

- 新 capability spec
- 回写 `INDEX.md`
- 为当前 change 生成 `change-meta.json`

### Update Links

- 修 roadmap / backlog / change / spec 的 capability 引用
- 重建 `INDEX.md`

### Split / Merge / Deprecate

- 在原 capability spec 标明状态变化
- 补 `splitInto` / `mergedInto` / `supersededBy`
- 确认历史 change 仍然可追踪

## Command Kit

```bash
# 初始化 specs 目录
bash .claude/skills/cc-spec-init/scripts/bootstrap-specs.sh

# 校验 spec 链路
bash .claude/skills/cc-spec-init/scripts/validate-spec-links.sh

# 看哪些 change 已缺 change-meta
find devflow/changes -maxdepth 2 -name change-meta.json | sort
```

## Review Questions

1. capability 的边界是否清楚到 AI 不会把别的系统能力写进来？
2. `Current Truth` 是否只写当前成立的承诺？
3. `Missing` 和 `Intentional Gaps` 是否被保留下来？
4. roadmap item 和 change 是否都能指向 capability？
5. 这次是该 `update`，还是其实应该 `split` / `merge`？
