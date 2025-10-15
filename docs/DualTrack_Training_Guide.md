# Dual-Track Training Guide

## 1. 目标与适用人群
- 解释 cc-devflow 双轨结构（requirements + changes + specs）、关键文件（`delta.json`、`constitution.json`、`task-progress.json`）。
- 面向 PRD/Planner/Developer/QA/Release 各角色，帮助在现有流程基础上遵循双轨脚本。

## 2. 日常工作流速查
| 阶段 | 命令 | 必跑脚本 | 说明 |
|------|------|----------|------|
| 初始化 | `/flow-init` | 自动调用 `bootstrap-devflow-dualtrack.sh` | 获取 `change_id`、生成 change scaffolding |
| PRD | `/flow-prd` | `parse-delta.sh`、`check-dualtrack-conflicts.sh --count-only`、`run-dualtrack-validation.sh`（`--strict` 可选） | 填充 delta 基础信息，尽早暴露结构问题 |
| Epic/Tasks | `/flow-epic` | `parse-delta.sh`、`sync-task-progress.sh`、`run-dualtrack-validation.sh`、`check-dualtrack-conflicts.sh --count-only` | 生成任务并回写 delta 任务摘要 |
| 开发 | `/flow-dev` | `parse-delta.sh`、`sync-task-progress.sh`、`run-dualtrack-validation.sh`、冲突统计 | 每次标记任务完成都会自动同步 task-progress |
| QA | `/flow-qa` | `run-dualtrack-validation.sh --strict`、`check-dualtrack-conflicts.sh --strict` | QA 前必须严格校验 delta/宪法/任务 |
| 发布 | `/flow-release` | `archive-change.sh`、`generate-archive-summary.sh`、`generate-spec-changelog.sh`、`rollback-archive.sh`（如需回滚） | 归档后 change 目录会移动到 `devflow/changes/archive/<change-id>/`，生成 summary 与 changelog |

> 🎯 记住：除了自动调用的脚本，还可以手动运行 `run-dualtrack-validation.sh "$CHANGE_ID" --strict` 在任意阶段提前兜底。

## 3. 关键脚本备忘
- `parse-delta.sh <change-id>`：解析 `changes/<change-id>/specs/**/spec.md` 中的 ADDED/MODIFIED/REMOVED/RENAMED 分区，刷新 `delta.json`。
- `check-dualtrack-conflicts.sh [change-id] [--all] [--strict] [--count-only] [--summary]`：扫描冲突并可输出 capability/change 维度统计；macOS Bash 3.2 兼容。
- `sync-task-progress.sh <change-id>`：统计 `tasks.md` 勾选情况，刷新 `task-progress.json` 及 `delta.json.tasks` 缩略信息。
- `validate-constitution-tracking.sh <change-id> [--strict]`：检查 `constitution.json` 状态；strict 时 pending/in_progress 将阻塞。
- `run-dualtrack-validation.sh <change-id> [--strict]`：综合校验 delta、tasks、constitution；内部调用 `validate-constitution-tracking.sh`。
- `archive-change.sh <change-id>`：RENAMED → REMOVED → MODIFIED → ADDED 顺序归档到 `devflow/specs/<capability>/spec.md`，并自动备份旧版到 `history/`。
- `generate-archive-summary.sh <change-id>`：输出 `changes/(archive/)<change-id>/summary.md`，记录 delta 概览/任务进度/宪法状态。
- `generate-spec-changelog.sh <change-id>`：更新对应 capability 的 `CHANGELOG.md`。
- `rollback-archive.sh <change-id>`：从 `history/` 最新快照回滚归档结果，支持处理 `changes/archive/` 下的 change。
- `migrate-existing-requirement.sh <REQ-ID> [--force]` / `migrate-all-requirements.sh [--force]`：把历史需求批量接入双轨。
- `generate-dualtrack-metrics.sh [--json]`：输出覆盖率、delta 完整率、归档 capability 数、冲突数，可用于周报或仪表盘。

## 4. 双轨指标与监控
```bash
# 人类可读输出
bash .claude/scripts/generate-dualtrack-metrics.sh

# 机器消费
bash .claude/scripts/generate-dualtrack-metrics.sh --json | jq .
```
- **双轨覆盖率**：存在 `change_id` 的需求占比。
- **Delta 完整率**：`requirements.*` 总数 > 0 的 change 占比。
- **归档 capability 数**：具备 `history/` 目录的 specs 数量。
- **冲突数**：对所有 delta（含 archive/）执行冲突扫描。

建议将 JSON 输出接入看板或定时任务，监测 adoption 进度与冲突趋势。

## 5. 脚本测试套件
- 位置：`.claude/tests/scripts/`
- 核心文件：
  - `test-framework.sh`：通用断言/清理工具，兼容 macOS Bash 3.2。
  - `test_generate_dualtrack_metrics.sh`：验证 metrics 统计在新增需求/变更后的增量效果。
  - `test_conflict_summary.sh`：检验冲突 summary 输出。
  - `test_archive_lifecycle.sh`：保证归档→移动→summary→rollback 全链条可用。
  - `test_validate_constitution_tracking.sh`：验证宪法严格模式与 Schema 校验。
  - `run.sh`：一次性跑所有脚本测试。

执行：
```bash
bash .claude/tests/scripts/run.sh
```
测试运行时会在 `.tmp/script-tests/` 下构建临时资源，并在结束时清理。

## 6. 迁移与推广
1. **迁移历史需求**：先运行 `bash .claude/scripts/migrate-all-requirements.sh`（必要时加 `--force`），确保每个需求具备 `change_id` 与 change scaffolding。
2. **补充宪法状态**：针对旧需求更新 `constitution.json`，可借助 `validate-constitution-tracking.sh` 检测缺漏。
3. **培训与标准化**：把本指南纳入团队 Wiki 或入职资料包，强调命令顺序与严格闸门位置。
4. **监控落地**：通过 metrics 定期复盘 adoption；必要时在 CI/守护脚本中加入 `check-dualtrack-conflicts.sh --all --count-only` 预警。

## 7. 故障排查速表
| 症状 | 排查命令 | 可能原因 | 处理建议 |
|------|----------|----------|----------|
| QA 阶段 `run-dualtrack-validation --strict` 阻塞 | 查看 `changes/<change-id>/task-progress.json` | `tasks.md` 仍含占位符或勾选不同步 | 运行 `sync-task-progress.sh <change-id>`，确认任务格式 |
| Archive 报错 “Delta spec missing block” | 检查 `changes/<change-id>/specs/**/spec.md` | MODIFIED/ADDED block 未按模板书写 | 重新生成 spec delta，确保 `### Requirement:` 标题存在 |
| Release 后发现归档错误 | `rollback-archive.sh <change-id>` | 手工编辑 specs 过程中冲突 | 使用 rollback 恢复，再重跑 `archive-change.sh` |
| metrics 中冲突数 > 0 | `check-dualtrack-conflicts.sh --all` | 多个 change 同时改同一 requirement | 协调团队或合并 delta，必要时拆分 change |

## 8. 快速参考
- **严格闸门策略**：PRD 阶段可选（提醒为主），QA/Release 阶段必须 `--strict`。
- **新命令入口**：
  - 度量：`bash .claude/scripts/generate-dualtrack-metrics.sh`
  - 迁移：`bash .claude/scripts/migrate-all-requirements.sh`
  - 测试：`bash .claude/tests/scripts/run.sh`
- **常见文件位置**：
  - `devflow/requirements/<REQ>/`：需求文档与状态
  - `devflow/changes/<change-id>/`：proposal/tasks/design/spec Delta
  - `devflow/specs/<capability>/`：真实源，含 history & CHANGELOG

> 完成以上培训后，团队成员应能在任何阶段快速确认双轨状态、执行脚本、排障并维护指标。持续利用 metrics + tests 可保证脚本可靠性和 adoption。
