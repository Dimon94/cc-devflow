# scripts/
> L2 | 父级: /Users/dimon/.codex/worktrees/03a4/cc-devflow/.claude/tests/CLAUDE.md
>
> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

成员清单
run.sh: shell 脚本测试聚合入口。
test-framework.sh: 轻量断言与隔离能力。
test_archive_requirement.sh: 归档/恢复回归测试，验证 archive compatibility metadata 与 resume-index 恢复。
test_check_prerequisites.sh: 前置条件检查脚本测试。
test_check_task_status.sh: 任务状态统计脚本测试。
test_common.sh: `common.sh` 基础能力测试。
test_create_requirement.sh: requirement/bug 脚手架测试，锁定 harness-state + intent memory bootstrap。
test_generate_status_report.sh: 状态报告脚本测试。
test_mark_task_complete.sh: 任务完成标记脚本测试。
test_recover_workflow.sh: 中断恢复脚本测试。
test_setup_epic.sh: Epic 初始化脚本测试。
test_sync_roadmap_progress.sh: ROADMAP 同步脚本测试，防止状态更新时写坏表格列。
test_sync_task_marks.sh: TASKS 勾选同步脚本测试。
test_validate_constitution.sh: 宪法校验脚本测试。
test_validate_research.sh: research 校验脚本测试。
test_workflow_skill_alignment.sh: workflow schema / skill 目录 / `.claude` 地图同构测试，守住 flow-prepare-pr 不再漂移。

法则: 临时仓隔离·只测公开行为·不要绑定旧状态叙事
