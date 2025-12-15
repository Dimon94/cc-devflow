# /flow-clarify - 需求澄清命令

## Usage
```
/flow-clarify [REQ-XXX] [--skip] [--history]
```

## Purpose
在 PRD 生成前通过 11 维度歧义扫描系统化消除需求模糊性。

## Arguments
- `REQ-XXX`: 需求编号（可选，默认从分支推断）
- `--skip`: 跳过澄清，直接进入下一阶段
- `--history`: 查看历史澄清记录

## Entry Gate
1. 验证 `research/research.md` 存在
2. 验证 `orchestration_status.json.phase0_complete == true`
3. 检查 `.session.json` 是否有未完成会话（断点恢复）

## Execution Flow

### Phase 1: Scan (自动执行)
```bash
# 调用 run-clarify-scan.sh 执行 11 维度并行扫描
.claude/scripts/run-clarify-scan.sh REQ-XXX --parallel
```

输出: scan_result.json (内存)

### Phase 2: Question Generation (自动执行)
```bash
# 基于扫描结果生成 ≤5 个优先级排序问题
.claude/scripts/generate-clarification-questions.sh --input scan_result.json --max 5
```

输出: questions[] with AI recommendations

### Phase 3: Interactive Q&A (用户交互)
For each question:
1. Display question + options + AI recommendation (⭐ RECOMMENDED)
2. Read user input
3. Validate answer (A-E or ≤5 words)
4. Generate rationale (Claude Haiku)
5. Save to .session.json (incremental)

### Phase 4: Report Generation (自动执行)
```bash
# 生成澄清报告
.claude/scripts/generate-clarification-report.sh --session .session.json
```

输出: research/clarifications/[timestamp]-flow-clarify.md

## Exit Gate
1. 验证报告完整性
2. 更新 `orchestration_status.json`:
   - `clarify_complete = true`
   - `clarify_session_id = [sessionId]`
3. 删除 `.session.json`
4. 输出: "✅ Ready for /flow-prd"

## Session Recovery
如果检测到 `.session.json`:
1. 显示恢复提示
2. 从 `currentQuestionIndex` 继续
3. 不重复已回答的问题

## User Abort (Ctrl+C)
1. 捕获 SIGINT
2. 保存当前进度到 `.session.json`
3. 输出恢复命令: `/flow-clarify REQ-XXX`

## Output Format

### Question Display
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Q1: 关于 Functional Scope
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
用户权限应如何划分？

  A) RBAC 角色模型 - 基于角色的访问控制
  B) ABAC 属性模型 - 基于属性的访问控制
  C) 简单二元权限 - admin/user 两级

  ⭐ RECOMMENDED: A (RBAC 是企业级应用最常见模式)

Your choice (A-C, or press Enter for recommended):
```

### Report Structure
```markdown
# Clarification Report: REQ-XXX

## Metadata
- Session ID: 20251215-143000-REQ-001
- Date: 2025-12-15
- Questions: 3 / 5

## Scan Summary
| Dimension | Status | Issues |
|-----------|--------|--------|
| Functional Scope | ambiguous | 2 |
| ...

## Clarification Session
### Q1: Functional Scope
**Question**: 用户权限应如何划分？
**Answer**: A (RBAC 角色模型)
**Rationale**: RBAC 提供灵活的权限管理...

## Next Command
✅ Run `/flow-prd` to generate PRD
```

## Error Handling
- `MISSING_RESEARCH`: research.md 不存在 → 提示先运行 `/flow-init`
- `INVALID_PHASE`: phase0_complete != true → 提示完成研究阶段
- `API_ERROR`: Claude API 错误 → 降级到规则引擎
- `SESSION_CORRUPT`: .session.json 损坏 → 提示删除重试

## Related Commands
- **前置**: `/flow-init` (生成 research.md)
- **后续**: `/flow-prd` (生成 PRD)
- **可选**: `/flow-clarify --history` (查看历史)

## Constitution Compliance
- **Article I**: 完整实现，无 TODO
- **Article III**: API Key 使用环境变量
- **Article VI**: TDD 顺序正确
