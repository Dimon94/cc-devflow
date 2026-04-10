# Req-Act Playbook

## Closing Loop

`req-act` 的任务不是“再解释一遍”，而是把已经通过验证的事实整理成交付与下一轮入口。

## Required Outputs

- `pr-brief.md`
- `RELEASE_NOTE.md`（需要发布时）
- 更新后的 `resume-index.md`
- 更新后的 `CLAUDE.md` / README / 架构文档（如果结构变了）
- 必要时更新后的 `BACKLOG.md` / `ROADMAP.md`

## Sync Rules

1. 代码结构变了，就同步对应目录的 `CLAUDE.md`
2. 用户可感知行为变了，就同步 release / handoff 文档
3. 这次学到的优先级变化，必须回写 backlog

## Local Kit

- `assets/PR_BRIEF_TEMPLATE.md` 和 `assets/RELEASE_NOTE_TEMPLATE.md` 负责交付骨架
- `scripts/generate-status-report.sh` 汇总 requirement 状态
- `scripts/archive-requirement.sh` 负责 requirement 生命周期收尾
