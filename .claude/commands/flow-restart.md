---
name: flow-restart
description: Restart interrupted cc-devflow requirement development. Usage: /flow-restart "REQ-123" [--from=stage]
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  recover: .claude/scripts/recover-workflow.sh
  generate_status: .claude/scripts/generate-status-report.sh
---

# Flow-Restart - 中断恢复命令

## User Input
```text
$ARGUMENTS = "REQ_ID [--from=stage] [--force] [--backup]"
```

## 支持阶段
```
research | prd | planning | development | qa | release
```

## 执行流程

### 阶段 1: Entry Gate
```
1. 参数解析
   → 校验 REQ_ID（REQ-\d+）、阶段枚举。

2. 状态自检
   → Run: {SCRIPT:prereq} --json --paths-only
   → 确认 devflow/requirements/${REQ_ID}/ 存在
   → orchestration_status.json.status ∈ {failed, paused, *_failed}
   → 若 status 已完成且未使用 --force → 拒绝重启。

3. 中断点检测
   → 调用 {SCRIPT:recover} --detect "${REQ_ID}"
   → 解析中断原因、推荐恢复阶段、待恢复的产物。

4. 备份（可选）
   → 如果 --backup，则创建 `${REQ_DIR}/backup/${timestamp}` 目录复制关键文件。
```

### 阶段 2: 清理与重置
```
1. 根据阶段执行清理动作:
   • research: 清理临时 research/mcp 缓存、保留 summary
   • prd: 备份 PRD.md，重置 status=initialized
   • planning: 备份 EPIC.md/TASKS.md，清理规划中间状态
   • development: 检查未完成任务、生成 git stash 建议
   • qa: 删除过期 TEST_REPORT/SECURITY_REPORT
   • release: 关闭未完成 PR 草稿、重置 release 状态

2. 更新 orchestration_status:
   → status = "${stage}_restart_in_progress"
   → restartStage = stage
   → restartAt = timestamp

3. EXECUTION_LOG.md 记录恢复动作和备份路径。
```

### 阶段 3: 恢复执行
```
1. 根据 stage 自动触发后续命令提示：
   → research → 建议运行 /flow-init --resume
   → prd → /flow-prd
   → planning → /flow-epic
   → development → /flow-dev
   → qa → /flow-qa
   → release → /flow-release

2. 若 {SCRIPT:recover} 支持自动修复（如重建 TASKS），执行对应脚本。
```

### 阶段 4: Exit Gate
```
1. 验证关键产物是否存在（与阶段相符）。
2. orchestration_status:
   → status = "${stage}_restart_ready"
   → completedSteps 不剥夺已完成阶段
3. 输出下一步指引。
```

## 错误处理
- 检测不到中断 → 提示使用 `/flow-status` 查看当前状态，或需 --force。
- 备份失败 → 终止并保留原样。
- 清理动作报错 → 输出日志路径，允许用户手动处理后重试。

## 输出
```
✅ backup/ 时间戳目录（若启用备份）
✅ orchestration_status.json 更新（restartStage, restartAt, status）
✅ EXECUTION_LOG.md 恢复条目
```

## 下一步
1. 按提示执行下一阶段命令。
2. 使用 `/flow-status REQ_ID --detailed` 确认状态恢复正确。
3. 如多次失败，考虑跑 `/flow-verify` 或手动 review 产物。
