# CC-DevFlow v3.0 Quick Reference

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## 🚀 Workflow Modes

### 精简流程 (5 步, 适合小需求)

```bash
/flow-init --quick "REQ-XXX|Title"
/flow-prd --quick
/flow-epic
/flow-dev
/flow-release
```

**适用场景**: Bug 修复、小功能、配置变更

### 标准流程 (6 步, 适合中等需求)

```bash
/flow-init "REQ-XXX|Title|URL"
/flow-prd
/flow-epic
/flow-dev
/flow-quality
/flow-release
```

**适用场景**: 新功能、模块增强、API 变更

### 完整流程 (8 步, 适合大需求)

```bash
/flow-init "REQ-XXX|Title|URL"
/flow-clarify                    # 可选: 消除歧义
/flow-prd
/flow-tech                       # 技术设计
/flow-ui                         # 可选: UI 原型
/flow-epic
/flow-dev
/flow-quality --full             # 完整审查
/flow-release
```

**适用场景**: 新模块、架构变更、跨团队协作

---

## 📋 Command Quick Reference

### 项目级命令 (执行一次)

| 命令 | 用途 | 输出 |
|------|------|------|
| `/core:roadmap` | 产品路线图 | ROADMAP.md, BACKLOG.md |
| `/core:architecture` | 系统架构 | ARCHITECTURE.md |
| `/core-guidelines` | 开发规范 | frontend/backend-guidelines.md |
| `/core-style` | 设计风格 | STYLE.md |

### 需求级命令 (每个需求)

| 命令 | 用途 | 输出 |
|------|------|------|
| `/flow-init` | 初始化 | research.md, BRAINSTORM.md |
| `/flow-clarify` | 消除歧义 | clarifications/*.md |
| `/flow-prd` | 需求文档 | PRD.md |
| `/flow-tech` | 技术设计 | TECH_DESIGN.md, data-model.md |
| `/flow-ui` | UI 原型 | UI_PROTOTYPE.html |
| `/flow-epic` | 任务分解 | EPIC.md, TASKS.md |
| `/flow-dev` | 开发执行 | 代码实现 |
| `/flow-quality` | 质量验证 | 测试报告 |
| `/flow-release` | 发布 | PR |

### v3.0 新增命令

| 命令 | 用途 |
|------|------|
| `/flow-context` | 管理上下文注入 |
| `/flow-quality` | 合并后的质量验证 |

---

## ⚡ Quick Flags

### /flow-init

```bash
--quick     # 跳过 brainstorming，快速初始化
--type      # 项目类型: backend, frontend, fullstack
```

### /flow-prd

```bash
--quick     # 跳过 research 验证
```

### /flow-dev

```bash
--manual    # 手动模式（非自动重试）
--max-iterations N  # 最大迭代次数
```

### /flow-quality

```bash
--full      # 完整审查（包含 Spec + Code Quality + Security）
# 默认: quick 模式（只做 lint + typecheck + test）
```

---

## 🔧 Utility Commands

```bash
/flow-status [REQ-ID]           # 查看进度
/flow-restart REQ-ID --from=X   # 从指定阶段重启
/flow-verify REQ-ID             # 一致性检查
/flow-fix "BUG-ID|描述"         # Bug 修复
/flow-context validate          # 验证上下文配置
```

---

## 📊 Status Flow

```
initialized → prd_complete → tech_complete → epic_complete
    → development_complete → quality_complete → released
```

---

## 🎯 Quality Gates

### Quick Mode (默认)

- ✓ Lint Check
- ✓ Type Check
- ✓ Unit Tests

### Full Mode (--full)

- ✓ Lint Check
- ✓ Type Check
- ✓ Unit Tests
- ✓ Spec Compliance Review
- ✓ Code Quality Review
- ✓ Security Scan

---

## 📁 Key Files

```
devflow/requirements/REQ-XXX/
├── PRD.md              # 需求文档
├── TECH_DESIGN.md      # 技术设计
├── EPIC.md             # Epic 规划
├── TASKS.md            # 任务列表
├── ERROR_LOG.md        # 错误记录
├── context/            # 上下文配置 (v3.0)
│   ├── dev.jsonl
│   └── ...
└── orchestration_status.json
```

---

## 🆘 Troubleshooting

```bash
# 检查当前状态
cat devflow/requirements/REQ-XXX/orchestration_status.json | jq .status

# 验证上下文
/flow-context validate

# 运行质量闸
.claude/scripts/run-quality-gates.sh flow-dev

# 查看错误日志
cat devflow/requirements/REQ-XXX/ERROR_LOG.md
```

---

**Version**: v3.0.0
**Last Updated**: 2026-02-06
