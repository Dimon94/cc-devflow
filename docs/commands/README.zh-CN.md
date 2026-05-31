# CLI 与 Skill

CC-DevFlow 不再把旧的 `/flow:*` 命令面当作主要用户接口。

整包安装和多平台适配，使用仓库自带 CLI：

```bash
npx cc-devflow init --dir /path/to/your/project
npx cc-devflow adapt --cwd /path/to/your/project --platform codex
```

真正的工作流直接使用 Skill：

```text
PDCA: cc-plan -> [cc-review] -> cc-do -> [cc-review] -> cc-check -> cc-act
Hotfix: cc-diagnose -> focused fix -> regression proof
```

维护类动作按需单独调用：

- `cc-spec-init`：初始化或修复 `devflow/specs/` 与 ``
- `cc-simplify`：ship 前做清理和坏味道检查

如果你只想安装单个 Skill，再使用 [skills.sh CLI](https://skills.sh/docs/cli)：

```bash
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-plan
```
