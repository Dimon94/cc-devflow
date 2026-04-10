# CLI And Skills

CC-DevFlow no longer uses the old `/flow:*` command surface as the primary interface.

Use the repository CLI for whole-pack setup and platform adaptation:

```bash
npx cc-devflow init --dir /path/to/your/project
npx cc-devflow adapt --cwd /path/to/your/project --platform codex
```

Use skills directly for the workflow itself:

```text
roadmap

req-plan -> req-do -> req-check -> req-act
```

Use [skills.sh CLI](https://skills.sh/docs/cli) when you only want one skill:

```bash
npx skills add https://github.com/Dimon94/cc-devflow --skill roadmap
```
