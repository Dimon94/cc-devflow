# Core-Roadmap Troubleshooting Guide

> Quick reference for `/core-roadmap` dialogue errors and recovery

---

## Core Errors

### E1: User Cancel During Dialogue
```bash
用户输入: cancel
→ 对话取消
```
**Fix**: `/core-roadmap --resume` → 从草稿恢复，选择继续的 Stage

---

### E2: Circular Dependency Detected
```bash
❌ ERROR: 检测到循环依赖: RM-001 → RM-003 → RM-005 → RM-001
```
**Fix**: 用户输入 `modify` → 移除循环中的一条依赖边（如 `remove RM-005 → RM-001`）

---

### E3: Over-Capacity Warning
```bash
⚠️ WARNING: 总工作量 150% (计划 18 项 vs 容量 12 项)
```
**Fix**:
- 降低优先级: 将部分 P2 改为 P3
- 缩减工作量: 重新评估项目估算
- 延长规划周期: 从 3 个月延长到 6 个月

---

### E4: Roadmap Not Found (Update Mode)
```bash
❌ ERROR: devflow/ROADMAP.md 不存在
```
**Fix**: `find . -name "ROADMAP.md"` → 检查路径 → 移动到正确位置或重新创建

---

### E5: Hanging Dependency (未完成的依赖)
```bash
⚠️ WARNING: RM-005 依赖 REQ-008 但该需求未完成
```
**Fix**: `/flow:status REQ-008` → 确认状态 → 继续但标记风险 或 移除该依赖

---

### E6: Quarter Assignment Conflict
```bash
❌ ERROR: RM-005 分配到 Q1 但其依赖 RM-001 分配到 Q2
```
**Fix**: 调整 RM-005 到 Q2 或提前 RM-001 到 Q1

---

### E7: Agent Invocation Failed
```bash
❌ ERROR: roadmap-planner execution failed (Cannot read property 'candidates')
```
**Diagnose**: `cat .roadmap-context.json | jq .` → 检查 context 完整性
**Fix**: `cp .roadmap-draft.json .roadmap-context.json` → `/core-roadmap --regenerate`

---

### E8: Mermaid Syntax Error
```bash
⚠️ WARNING: Mermaid syntax error (Node ID: REQ-001 包含非法字符)
```
**Fix**: 编辑 ROADMAP.md → 将 `REQ-001[...]` 改为 `REQ001[REQ-001: ...]` (移除 Node ID 中的 hyphen)

---

### E9: Architecture Generation Failed
```bash
❌ ERROR: Cannot generate ARCHITECTURE.md (No requirements found)
```
**Fix**: 跳过 ARCHITECTURE.md 生成，完成第一个需求后运行 `/core-architecture`

---

## Recovery Scenarios

### 对话中断恢复
```bash
# 检查草稿文件
cat .roadmap-draft.json | jq '.candidates | length'

# 恢复对话
/core-roadmap --resume

# 选择从哪个阶段继续 (2: 头脑风暴, 3: 依赖分析, ...)
```

### 生成文档损坏
```bash
# 备份损坏文件
cp devflow/ROADMAP.md devflow/ROADMAP.md.bak

# 重新生成 (使用保存的 context)
/core-roadmap --regenerate

# 对比新旧文件
diff devflow/ROADMAP.md.bak devflow/ROADMAP.md
```

### Velocity 数据错误
```bash
# 验证完成需求数量
ls devflow/requirements/REQ-*/orchestration_status.json | \
  xargs -I {} jq -r 'select(.status=="merged") | .reqId' {} | \
  wc -l

# 在对话中手动修正容量估算
```

---

## Advanced Features

### --regenerate 模式
```bash
/core-roadmap --regenerate

# 执行步骤:
# 1. 读取现有 ROADMAP.md
# 2. 运行 sync-roadmap-progress.sh
# 3. 更新 Velocity 指标
# 4. 重新生成文档

# 适用场景:
# - 定期更新路线图进度 (每周)
# - 需求完成后同步状态
```

### --resume 模式
```bash
/core-roadmap --resume

# 执行步骤:
# 1. 读取 .roadmap-draft.json
# 2. 恢复 context 状态
# 3. 询问从哪个 Stage 继续
# 4. 跳转到对应 Stage

# 适用场景:
# - 对话被意外中断
# - 需要暂停并稍后继续
# - 需要修改之前阶段的输入
```

---

## Configuration

### Environment Variables
| Variable | Default | Purpose |
|----------|---------|---------|
| `ROADMAP_DRAFT_FILE` | `.roadmap-draft.json` | 草稿文件路径 |
| `DEFAULT_PLANNING_HORIZON` | `3 months` | 默认规划周期 |
| `FLOW_DEBUG` | `false` | 启用调试日志 |

### Scripts
| Script | Purpose |
|--------|---------|
| `calculate-quarter.sh` | 计算当前季度信息 |
| `sync-roadmap-progress.sh` | 同步路线图进度 |

---

## FAQ

**Q: 如何修改已生成的路线图？**
A: 手动编辑 `vim devflow/ROADMAP.md` 或重新运行 `/core-roadmap`

**Q: 如何添加新的 RM 项目？**
A: 编辑 ROADMAP.md 或重新运行对话并在 Stage 3 添加

**Q: Velocity 计算不准确怎么办？**
A: 在对话 Stage 0 中会显示预估容量，如不准确可在后续阶段调整工作量和时间线

---

**Last Updated**: 2025-12-19
