---
name: flow-new
description: 'One-shot requirement flow. Usage: /flow-new "REQ-123|支持用户下单|https://plan.example.com/Q1"'
templates:
  orchestration: .claude/docs/templates/NEW_ORCHESTRATION_TEMPLATE.md
guides:
  troubleshoot: .claude/docs/guides/NEW_TROUBLESHOOTING.md
---

<!-- ============================================================
     头文件引用语法规范 (Header File Reference Syntax)
     ============================================================

命令头文件格式:
```yaml
templates:
  orchestration: .claude/docs/templates/NEW_ORCHESTRATION_TEMPLATE.md
guides:
  troubleshoot: .claude/docs/guides/NEW_TROUBLESHOOTING.md
```

引用语法:
- {TEMPLATE:orchestration} → 加载 .claude/docs/templates/NEW_ORCHESTRATION_TEMPLATE.md
- {GUIDE:troubleshoot}     → 参考 .claude/docs/guides/NEW_TROUBLESHOOTING.md

规则: 遇到 {TYPE:key} 占位符时，去头文件 YAML 中找对应类型的 key，获取文件路径并加载。
============================================================ -->

# Flow-New - 一键需求开发流

## User Input
```text
$ARGUMENTS = "REQ_ID|TITLE|PLAN_URLS?"
```

**格式**:
- REQ_ID: 需求编号 (例如: REQ-123)
- TITLE: 需求标题
- PLAN_URLS: 计划文档 URL，多个用逗号分隔 (可选)

**示例**:
```
/flow-new "REQ-123|支持用户下单|https://plan.example.com/Q1"
/flow-new "REQ-124|用户权限管理"
```

---

## 执行前加载

**详细编排流程**:
→ 参见 `{TEMPLATE:orchestration}` 获取完整编排逻辑

**故障排查**:
→ 遇到问题参考 `{GUIDE:troubleshoot}`

---

## 架构说明

**设计理念**: `flow-new` 是编排器（Orchestrator），串行调用当前主干命令，避免人工串接阶段。

**调用链** (v4.1):
```
/flow-new "REQ-123|Title|URLs"
  ↓
[1/6] /flow-init "REQ-123|Title|URLs"
      → 创建需求目录 + research + BRAINSTORM
  ↓
[2/6] /flow-clarify "REQ-123" (可选)
      → 仅在需求存在歧义时触发
  ↓
[3/6] /flow-spec "REQ-123"
      → PRD → Tech+UI(并行) → Epic/TASKS
  ↓
[4/6] /flow-dev "REQ-123"
      → TDD 执行 (测试先失败，再实现)
  ↓
[5/6] /flow-quality "REQ-123" --full
      → 规格合规 + 代码质量 + 安全验证
  ↓
[6/6] /flow-release "REQ-123"
      → 发布计划 + PR 创建 + 分支收尾
```

---

## 执行流程骨架

### [1/6] 初始化 → /flow-init

```
调用: /flow-init "${REQ_ID}|${TITLE}|${PLAN_URLS}"
检查: orchestration_status.json.status === "initialized"
→ 详见 {TEMPLATE:orchestration} Stage 1
```

**输出**:
- Git 分支: `feature/${REQ_ID}-${slug(BRANCH_TITLE_EN)}`
- 需求目录与 research 上下文
- `BRAINSTORM.md`

---

### [2/6] 需求澄清（可选）→ /flow-clarify

```
触发条件: 需求存在歧义、边界不清、验收标准冲突
调用: /flow-clarify "${REQ_ID}"
→ 详见 .claude/commands/flow/clarify.md
```

**输出**:
- `clarifications/*.md` (如触发)

---

### [3/6] 统一规格阶段 → /flow-spec

```
调用: /flow-spec "${REQ_ID}" [--skip-tech] [--skip-ui]
默认: PRD + Tech + UI + Epic/TASKS
→ 详见 .claude/commands/flow/spec.md
```

**输出**:
- `PRD.md`
- `TECH_DESIGN.md` / `UI_PROTOTYPE.html` (按模式)
- `EPIC.md` + `TASKS.md`

---

### [4/6] 开发执行 → /flow-dev

```
调用: /flow-dev "${REQ_ID}"
执行模式: TDD
  1) 先写测试并确认失败
  2) 再实现功能
  3) 最终测试通过
→ 详见 .claude/commands/flow/dev.md
```

**输出**:
- 实现代码 + 测试代码
- `TASKS.md` 勾选状态更新

---

### [5/6] 质量验证 → /flow-quality

```
调用: /flow-quality "${REQ_ID}" --full
检查: 规格一致性、代码质量、安全与测试门禁
→ 详见 .claude/commands/flow/quality.md
```

**输出**:
- `SPEC_REVIEW.md`
- `CODE_QUALITY_REVIEW.md`
- `SECURITY_REPORT.md`

---

### [6/6] 发布管理 → /flow-release

```
调用: /flow-release "${REQ_ID}"
执行: 生成 RELEASE_PLAN、创建 PR、执行收尾策略
→ 详见 .claude/commands/flow/release.md
```

**输出**:
- `RELEASE_PLAN.md`
- Pull Request / 合并策略决策

---

## 进度展示

**实时进度**:

```
🎯 CC-DevFlow 完整需求开发流程 (v4.1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

需求: REQ-123 | 支持用户下单

[1/6] ✅ 初始化完成
[2/6] ✅ 澄清完成 (可选)
[3/6] ✅ 统一规格完成
[4/6] 🔄 开发执行中... (8/18 已完成)
[5/6] ⏳ 等待质量验证...
[6/6] ⏳ 等待发布管理...
```

---

## 输出产物

```
devflow/requirements/${REQ_ID}/
├── BRAINSTORM.md
├── research/
├── PRD.md
├── TECH_DESIGN.md                  # 若未跳过 tech
├── UI_PROTOTYPE.html               # 若未跳过 ui 且识别到 UI 需求
├── EPIC.md
├── TASKS.md
├── SPEC_REVIEW.md                  # flow-quality --full
├── CODE_QUALITY_REVIEW.md          # flow-quality --full
├── SECURITY_REPORT.md              # flow-quality --full
└── RELEASE_PLAN.md
```

---

## 中断与恢复

```bash
# 查看当前状态
/flow-status REQ-123

# 从中断点恢复
/flow-restart "REQ-123"

# 手动执行后续阶段
/flow-spec "REQ-123"
/flow-dev "REQ-123" --resume
/flow-quality "REQ-123" --full
```

---

## 使用建议

### ✅ 适合使用 flow-new

- 明确需求，需要一口气走完整条流水线
- 团队希望减少阶段切换的上下文开销
- 希望快速拿到可评审发布结果

### ❌ 建议使用阶段化命令

- 需求高度不确定，需频繁往返讨论
- 规格阶段需要多人异步审阅
- 开发阶段需要多次暂停/切换优先级

---

## Next Step

```bash
# 查看 PR 状态
cat devflow/requirements/${REQ_ID}/RELEASE_PLAN.md | grep "PR URL"

# 审查 PR
gh pr view <PR_NUMBER>

# 合并 PR
gh pr merge <PR_NUMBER>
```

---

**Related Documentation**:
- [NEW_ORCHESTRATION_TEMPLATE.md](../../docs/templates/NEW_ORCHESTRATION_TEMPLATE.md) - 详细编排流程
- [NEW_TROUBLESHOOTING.md](../../docs/guides/NEW_TROUBLESHOOTING.md) - 故障排查指南
- [flow-init.md](./init.md) - 初始化阶段
- [flow-clarify.md](./clarify.md) - 需求澄清阶段
- [flow-spec.md](./spec.md) - 统一规格阶段
- [flow-dev.md](./dev.md) - 开发阶段 (TDD)
- [flow-quality.md](./quality.md) - 统一质量验证阶段
- [flow-release.md](./release.md) - 发布阶段
- [flow-fix.md](./fix.md) - Bug 修复流程

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
