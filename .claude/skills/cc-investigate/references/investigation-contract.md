# Investigation Contract

## Iron Law

- 没有根因，不准修 bug。

## Minimum Evidence

每次调查至少留下这些事实：

- symptom
- reproduction path
- expected vs actual
- code path
- recent change signal
- confirmed root cause

## Output Shape

- `ANALYSIS.md` 是人类真相源
- `TASKS.md` 是修复 handoff
- `task-manifest.json` 是执行真相源

## Reroute

- 根因明确，修复边界清楚 -> `cc-do`
- 发现这不是 bug，而是范围/设计问题 -> `cc-plan`
- 发现这其实是项目优先级问题 -> `roadmap`
