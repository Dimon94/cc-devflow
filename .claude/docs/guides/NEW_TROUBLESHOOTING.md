# Mainline Troubleshooting Guide

> Quick reference for canonical `/flow:*` delivery errors and recovery.

---

## Core Errors

### E1: Stage Command Not Found
```bash
❌ ERROR: Command /flow:init not found
```
**Fix**: 检查 `.claude/commands/flow/` 是否完整；确认当前分支已同步最新命令目录。

### E2: Status File Corrupted
```bash
❌ ERROR: Invalid orchestration_status.json
```
**Diagnose**: `jq . devflow/requirements/REQ-123/orchestration_status.json`
**Fix**: 重建状态文件后执行 `/flow:status "REQ-123"` 并从建议阶段恢复。

### E3: Interrupted, Cannot Resume
```bash
❌ ERROR: development_in_progress but checkpoint missing
```
**Diagnose**: `/flow:status "REQ-123"`
**Fix**: `/flow:dev "REQ-123" --resume`

### E4: Task Manifest Missing
```bash
❌ ERROR: TASKS.md not found
```
**Fix**: 重新执行 `/flow:spec "REQ-123"` 生成规划产物。

### E5: Verify Gate Failure
```bash
❌ Coverage below threshold
❌ High severity security issue
```
**Fix**:
- 修复代码与测试后重跑 `/flow:verify "REQ-123" --strict`
- 通过后再执行 `/flow:release "REQ-123"`

### E6: Release Blocked
```bash
❌ Missing strict verify report-card
```
**Fix**: 先执行 `/flow:verify "REQ-123" --strict`，再执行 `/flow:release "REQ-123"`。

---

## Recovery Procedures

### Full Rebuild
```bash
rm -rf devflow/requirements/REQ-123/
/flow:init "REQ-123|Title|URLs"
/flow:spec "REQ-123"
/flow:dev "REQ-123"
/flow:verify "REQ-123" --strict
```

### Resume From Current Stage
```bash
/flow:status "REQ-123"
/flow:dev "REQ-123" --resume
```

### State File Rebuild (Minimal)
```bash
REQ_DIR="devflow/requirements/REQ-123"
cat > "$REQ_DIR/orchestration_status.json" <<EOF_JSON
{
  "reqId": "REQ-123",
  "status": "spec_complete",
  "phase": "planning",
  "spec_complete": true,
  "development_complete": false,
  "quality_complete": false,
  "release_complete": false
}
EOF_JSON

jq . "$REQ_DIR/orchestration_status.json"
/flow:status "REQ-123"
```

---

## FAQ

**Q: 如何从特定阶段重启？**  
A: 用 `/flow:status` 先确认状态，然后执行对应阶段命令（通常是 `/flow:dev --resume` 或 `/flow:verify --strict`）。

**Q: 什么时候需要重跑 `/flow:spec`？**  
A: `TASKS.md` 缺失、规格有重大变更、或 manifest 与实现明显漂移时。

**Q: 可以继续使用 `/flow-new` 吗？**  
A: 不建议。`/flow-new` 仅兼容保留，主链是 `/flow:init -> /flow:spec -> /flow:dev -> /flow:verify -> /flow:release`。
