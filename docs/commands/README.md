# CLI And Skills

CC-DevFlow no longer uses the old `/flow:*` command surface as the primary interface.

Use the repository CLI for whole-pack setup and platform adaptation:

```bash
npx cc-devflow init --dir /path/to/your/project
npx cc-devflow adapt --cwd /path/to/your/project --platform codex
```

Use skills directly for the workflow itself:

```text
PDCA: cc-plan -> [cc-review] -> cc-do -> [cc-review] -> cc-check -> cc-act
Hotfix: cc-diagnose -> focused fix -> regression proof
```

Use maintenance skills separately when needed:

- `cc-simplify`: cleanup pass before ship

Use [skills.sh CLI](https://skills.sh/docs/cli) when you only want one skill:

```bash
npx skills add https://github.com/Dimon94/cc-devflow --skill cc-plan
```
