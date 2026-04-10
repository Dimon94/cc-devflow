# Docs Sync Contract

## Truth Sources

文档同步的真相源顺序固定如下：

1. 实际代码 / skill 文件
2. 该 skill 的 `SKILL.md`
3. 该 skill 的 `CHANGELOG.md`
4. 仓库级 README / CONTRIBUTING / `docs/**/*.md`
5. 根 `CHANGELOG.md`

如果下游文档和上游真实实现冲突，永远以上游为准。

## Bump Matrix

| Change type | Typical bump | Must sync |
|-------------|--------------|-----------|
| 文字澄清、模板注释、脚本说明修补 | `patch` | skill `SKILL.md`, skill `CHANGELOG.md`, 相关 docs |
| 新增兼容模板、gate、字段、脚本能力 | `minor` | 上述全部 + 相关 guide / getting-started |
| 改主流程、输出契约、安装方式、公开命令 | `major` | 上述全部 + migration note + 根 `CHANGELOG.md` |

## Canonical Public Docs

默认优先检查这些文件：

- `README.md`
- `README.zh-CN.md`
- `CONTRIBUTING.md`
- `CONTRIBUTING.zh-CN.md`
- `docs/guides/getting-started.md`
- `docs/guides/getting-started.zh-CN.md`
- `docs/commands/README.md`
- `docs/commands/README.zh-CN.md`
- `docs/v4.3.0-migration-guide.md`

如果变更只影响其中一部分，可以缩小范围；如果影响公开安装、分发、CLI、workflow 叙事，就至少过一遍全部。

## Commit Gate

准备提交前，至少确认：

1. 所有受影响 skill 的版本结论已落文件
2. skill changelog 已补
3. 中英文文档已同步
4. 旧命令、旧版本、旧技能列表没有残留
5. 需要 migration note 的地方已经写清
