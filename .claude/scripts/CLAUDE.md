# scripts/
> L2 | 父级: .claude/CLAUDE.md
>
> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## 目录定位

`.claude/scripts/` 是命令层与 Skill 层共享的执行脚本库，负责状态检测、质量门禁、需求目录操作与会话恢复。

## 成员清单

analyze-upgrade-impact.sh: 升级影响分析脚本。
archive-requirement.sh: 需求归档与清理脚本。
calculate-checklist-completion.sh: Checklist 完成度统计脚本。
calculate-quarter.sh: 时间季度计算脚本。
check-dependencies.sh: 依赖关系检查脚本。
check-prerequisites.sh: 流程前置条件统一校验脚本。
check-task-status.sh: TASKS 完成状态统计脚本。
checklist-errors.sh: Checklist 错误码与诊断脚本。
common.sh: 脚本公共函数库（REQ 识别、日志工具等）。
consolidate-research.sh: research 结果汇总脚本。
create-requirement.sh: 创建需求目录与初始状态；同步 workspace 的 `.current-req`。
delta-parser.ts: Delta 解析器。
detect-file-conflicts.sh: 并行开发文件冲突检测脚本。
export-contracts.sh: 合同文档导出脚本。
extract-data-model.sh: 数据模型抽取脚本。
flow-context-add.sh: context JSONL 条目追加脚本。
flow-context-init.sh: context 目录初始化脚本。
flow-context-validate.sh: context 路径验证脚本。
flow-delta-apply.sh: Delta 应用脚本。
flow-delta-archive.sh: Delta 归档脚本。
flow-delta-create.sh: Delta 创建脚本。
flow-delta-list.sh: Delta 列表脚本。
flow-delta-status.sh: Delta 状态脚本。
flow-quality-full.sh: 全量质量检查脚本。
flow-quality-quick.sh: 快速质量检查脚本。
flow-workspace-init.sh: 开发者 workspace 初始化脚本。
flow-workspace-record.sh: workspace journal 追加记录脚本。
generate-clarification-questions.sh: Clarify 问题生成脚本。
generate-clarification-report.sh: Clarify 报告生成脚本。
generate-quickstart.sh: quickstart 文档生成脚本。
generate-research-tasks.sh: research 任务生成脚本。
generate-status-report.sh: 状态报告聚合脚本。
generate-tech-analysis.sh: 技术分析生成脚本。
get-workflow-status.sh: 工作流状态读取脚本。
locate-requirement-in-roadmap.sh: roadmap 需求定位脚本。
manage-constitution.sh: Constitution 管理脚本。
mark-task-complete.sh: 任务完成标记脚本。
parse-task-dependencies.js: 任务依赖解析器。
populate-research-tasks.sh: research 任务填充脚本。
record-quality-error.sh: 质量错误记录脚本。
recover-workflow.sh: 中断恢复脚本。
run-clarify-scan.sh: Clarify 扫描执行脚本。
run-high-review.sh: 高强度 review 执行脚本。
run-problem-analysis.sh: 问题分析执行脚本。
run-quality-gates.sh: 质量门禁执行脚本。
setup-epic.sh: Epic 初始化脚本。
setup-ralph-loop.sh: Ralph Loop 初始化脚本。
sync-roadmap-progress.sh: roadmap 进度同步脚本。
sync-task-marks.sh: TASKS 勾选同步脚本。
team-dev-init.sh: Team 开发并行初始化脚本。
team-state-recovery.sh: Team 状态恢复脚本。
test-clarify-scan.sh: Clarify 扫描测试脚本。
update-agent-context.sh: Agent 上下文更新脚本。
validate-constitution.sh: Constitution 校验脚本。
validate-hooks.sh: Hooks 校验脚本。
validate-research.sh: research 质量校验脚本。
validate-scope-boundary.sh: scope 边界校验脚本。
verify-gate.sh: Gate 校验脚本。
verify-setup.sh: 环境/安装验证脚本。
workflow-status.ts: 工作流状态类型化读取器。

## 设计约束

- 需求识别统一复用 `common.sh`，避免多处正则分叉。
- 新增脚本优先保持幂等与可重入，便于中断恢复。
