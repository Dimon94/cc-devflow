# Flow-New Troubleshooting Guide

> Quick reference for `/flow-new` errors and recovery

---

## Core Errors

### E1: Stage Command Not Found
```bash
❌ ERROR: Command /flow-init not found
```
**Fix**: `ls .claude/commands/flow-*.md` → 检查缺失文件 → `git checkout HEAD -- .claude/commands/`

---

### E2: Status File Corrupted
```bash
❌ ERROR: Invalid orchestration_status.json
```
**Diagnose**: `jq . devflow/requirements/REQ-123/orchestration_status.json`
**Fix**: 从模板重建或 `/flow-restart "REQ-123"`

---

### E3: Interrupted, Cannot Resume
```bash
❌ ERROR: Requirement REQ-123 already exists
```
**Diagnose**: `/flow-status REQ-123`
**Fix**: `/flow-restart "REQ-123"` 或手动从特定阶段继续

---

### E4: UI Detection False Positive
```bash
✅ UI原型生成完成 (但项目是纯后端)
```
**Fix**: 在 PRD.md 开头添加 `## 项目类型声明\n**纯后端 API 项目**，无 UI 需求。`

---

### E5: Epic 未覆盖所有技术层
```bash
⚠️ WARNING: TASKS.md 未覆盖 TECH_DESIGN.md 所有层
```
**Diagnose**: `grep "## Section" devflow/requirements/REQ-123/TECH_DESIGN.md`
**Fix**: 手动补充缺失任务或重新生成 `/flow-epic "REQ-123"`

---

### E6: QA Gate Failure
```bash
❌ 代码覆盖率: 65% (要求 ≥ 80%)
❌ 安全问题: 2 个高危漏洞
```
**Fix**:
- 补充测试: `npm test -- --coverage --verbose` → 识别未覆盖模块
- 修复漏洞: 查看 `SECURITY_REPORT.md` → 修复代码 → 重新运行 `/flow-qa "REQ-123" --full`

---

### E7: Build Failure
```bash
❌ error TS2345: Argument of type 'string | undefined'...
```
**Fix**: `npm run typecheck` → 修复类型错误 → `npm run build`

---

### E8: PR Creation Failed
```bash
❌ gh pr create: HTTP 403: Resource not accessible
```
**Fix**: `gh auth login` → 重新认证 → `/flow-release "REQ-123"`

---

## Recovery Procedures

### Complete Restart
```bash
rm -rf devflow/requirements/REQ-123/
git branch -D feature/REQ-123-*
/flow-new "REQ-123|Title|URLs"
```

### Partial Resume (从特定任务继续)
```bash
# 检查任务状态
bash .claude/scripts/check-task-status.sh --verbose

# 从特定任务继续
/flow-dev "REQ-123" --task T008
```

### State File Rebuild
```bash
REQ_DIR="devflow/requirements/REQ-123"
HAS_PRD=$([ -f "$REQ_DIR/PRD.md" ] && echo true || echo false)
HAS_TECH=$([ -f "$REQ_DIR/TECH_DESIGN.md" ] && echo true || echo false)

# 重建状态文件
cat > $REQ_DIR/orchestration_status.json <<EOF
{
  "reqId": "REQ-123",
  "status": "$( [ "$HAS_TECH" = "true" ] && echo "tech_complete" || echo "prd_complete" )",
  "prd_complete": $HAS_PRD,
  "tech_design_complete": $HAS_TECH,
  "epic_complete": false,
  "dev_complete": false
}
EOF

jq . $REQ_DIR/orchestration_status.json  # 验证
/flow-restart "REQ-123"
```

---

## Configuration

### Environment Variables
| Variable | Default | Purpose |
|----------|---------|---------|
| `SKIP_UI_DETECTION` | `false` | 强制跳过 UI 生成 |
| `COVERAGE_THRESHOLD` | `80` | 代码覆盖率要求 |
| `FLOW_DEBUG` | `false` | 启用调试日志 |

### Command-Line Flags
```bash
/flow-new "REQ-123|..." --skip-ui         # 跳过 UI
/flow-new "REQ-123|..." --resume          # 恢复执行
```

---

## FAQ

**Q: 可以在 flow-new 执行中暂停吗？**
A: Ctrl+C 中断 → `/flow-status REQ-123` 查看状态 → `/flow-restart "REQ-123"` 恢复

**Q: 如何从特定阶段重新开始？**
A: 使用对应阶段命令重新执行，如 `/flow-prd "REQ-123"` 或 `/flow-epic "REQ-123"`

**Q: flow-new 支持 BUG 修复吗？**
A: 不支持，BUG 使用 `/flow-fix "BUG-456|描述"`

---

**Last Updated**: 2025-12-19
