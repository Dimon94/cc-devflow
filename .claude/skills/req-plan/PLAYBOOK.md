# Req-Plan Playbook

## Required Outputs

- `BRAINSTORM.md`
- `DESIGN.md`
- `TASKS.md`
- `task-manifest.json`
- `context-package.md`
- `resume-index.md`

## Local Kit

- 模板全部在 `assets/`
- 任务结构解析在 `scripts/parse-task-dependencies.js`
- 澄清问题与澄清报告在 `scripts/generate-clarification-questions.sh`、`scripts/generate-clarification-report.sh`
- 计划边界和 placeholder 红线见 `references/planning-contract.md`

## Planning Standard

1. 先写问题、目标、约束、非目标。
2. 如果存在多个合理方向，必须列 2-3 个方案并明确推荐。
3. `TASKS.md` 中每个任务都要写清：
   - 目标
   - 涉及文件
   - 验证方式
   - 完成证据
4. `task-manifest.json` 必须是 `req-do` 的真相源，而不是装饰文件。

## Placeholder Ban

这些词一出现，说明计划失败：

- TODO later
- implement later
- add validation
- handle edge cases
- write tests for the above
- similar to task N

## Exit Rule

只有当 `req-do` 不需要临场补脑也能直接执行时，计划才算合格。
