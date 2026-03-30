# CC-DevFlow Drift Audit

> 2026-03-26
> 目标：确认仓库当前实现是否仍沿着 `skill-first + markdown-first + local-first + thin harness spine` 主线推进。

## Aligned

- `autopilot` 已成为前门，能把模糊目标收敛到 `devflow/intent/<REQ>/` Markdown memory。
- `lib/harness/*` 现在更像薄 runtime spine，而不是产品叙事本身。
- delegated worker 已是本地优先，可由 `worker` / `worker-run` / `autopilot` 串起。
- verify 通过后，`prepare-pr` / `pr-brief` 已形成明确的 PR-ready 工件层。
- `.claude/CLAUDE.md`、命令索引、`autopilot` skill 已基本回到新主线。

## Partial Drift

- `flow-init` / `flow-spec` / `flow-dev` / `flow-release` 的 active `SKILL.md` 仍混有少量旧 `proposal/design/specs/session-*` 叙事。
- `.claude/docs/` 中已基本完成主线改写，剩余提及 `orchestration_status.json` 的地方主要是 compatibility mirror 说明。
- 一些 team/guide 文档还未完全改写为 `team-state truth + compatibility mirror` 口径。

## Outdated Or Compatibility Only

- 旧 Team hooks/scripts 仍可调用，但不再是默认控制面。
- `REQ-011` 相关计划文档代表上一轮设计探索，不再是当前 canonical plan。
- `proposal.md / design.md / delta specs / session-*` 这组叙事目前不应继续扩散到主协议。

## Canonical Path

```text
fuzzy goal
  -> /flow:autopilot
  -> devflow/intent/<REQ>/ summary/facts/plan/resume-index
  -> flow-init / flow-spec / flow-dev / flow-verify / flow:prepare-pr / flow-release
```

规则：

- Markdown 是主要阅读介质。
- JSON 只是 runtime/schema。
- 默认执行梯是 `direct -> delegate -> team`。
- Team 是升级路径，不是默认系统。
- harness 负责“执行脊柱”，不是再长一层平台。

## Immediate Corrections

1. 把 active rules 和 active workflow skills 改写为当前主线。
2. 删除 `lib/harness` 中仍在放大旧 proposal/specs 世界的残余逻辑。
3. 保留历史资产，但明确标成 compatibility only，避免再次成为默认叙事。

## Remaining Cleanup Queue

- 当前剩余旧词大多已降级为 compatibility 提示，而不是默认协议：
  - `orchestration_status.json` 仅作为兼容镜像被显式提及
  - `PRD.md / EPIC.md / TECH_DESIGN.md` 仅作为旧资产输入被显式提及
- 仍可继续清理的区域：
  - `workflow.yaml` 中的废弃映射仍可进一步瘦身
  - `flow-quality` 等兼容 skill 目录仍保留少量旧术语
  - 某些 core-harness 文档仍使用 `session-handoff` 语义，这是 core command 的独立协议，不属于 requirement 主线
- 这些剩余项目前不阻断 `autopilot + harness spine` 主线，也不再是默认认知入口。
