---
name: flow-prepare-pr
description: 'Generate the PR-ready brief from verified harness artifacts. Usage: /flow:prepare-pr "REQ-123"'
---

# Flow-Prepare-PR Command

## User Input

```text
$ARGUMENTS = "REQ_ID"
```

## Usage

```bash
/flow:prepare-pr "REQ-123"
```

## Output

- `devflow/intent/<REQ_ID>/artifacts/pr-brief.md`
- `devflow/intent/<REQ_ID>/resume-index.md`
- `devflow/intent/<REQ_ID>/decision-log.md`

## Notes

- 这是 verify 之后的薄收尾原语，不会真正创建远端 PR。
- 只复用既有事实源：`task-manifest.json`、`report-card.json`、`artifacts/results/*.md`。
- 若验证尚未通过，命令应直接失败，而不是猜测收尾内容。
