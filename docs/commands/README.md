# 📋 Command Reference

[中文文档](./README.zh-CN.md) | [English](./README.md)

---

## 🎯 Requirement Commands

| Command | Purpose | Quick Example | Detailed Docs |
|---------|---------|---------------|---------------|
| `/flow:init` | 📦 Initialize requirement context | `/flow:init "REQ-123\|Feature"` | [→](../../.claude/commands/flow/init.md) |
| `/flow:spec` | 📋 Generate task-manifest | `/flow:spec "REQ-123"` | [→](../../.claude/commands/flow/spec.md) |
| `/flow:dev` | 🛠️ Dispatch or resume task execution | `/flow:dev "REQ-123" --resume` | [→](../../.claude/commands/flow/dev.md) |
| `/flow:verify` | ✅ Quick/strict quality gates | `/flow:verify "REQ-123" --strict` | [→](../../.claude/commands/flow/verify.md) |
| `/flow:release` | 🚢 Release + runtime cleanup | `/flow:release "REQ-123"` | [→](../../.claude/commands/flow/release.md) |
| `/flow:status` | 📊 Query progress snapshot | `/flow:status REQ-123` | [→](../../.claude/commands/flow/status.md) |
| `/flow:restart` | 🔄 Recover interrupted workflow | `/flow:restart "REQ-123" --from=dev` | [→](../../.claude/commands/flow/restart.md) |
| `/flow:update` | ✅ Update task progress | `/flow:update "REQ-123" "T001"` | [→](../../.claude/commands/flow/update.md) |
| `/flow:fix` | 🐛 Bug fix workflow | `/flow:fix "BUG-001\|Description"` | [→](../../.claude/commands/flow/fix.md) |

## ⚠️ Deprecated Commands

| Deprecated | Migration |
|------------|-----------|
| `/flow:new` | `/flow:init -> /flow:spec -> /flow:dev -> /flow:verify -> /flow:release` |
| `/flow:clarify` | Use `/flow:spec` |
| `/flow:checklist` | Use `/flow:verify --strict` |
| `/flow:quality` | Use `/flow:verify` |

## 🏗️ Core Commands

| Command | Purpose | Quick Example | Detailed Docs |
|---------|---------|---------------|---------------|
| `/core:roadmap` | 🗺️ Generate product roadmap | `/core:roadmap` | [→](./core-roadmap.md) |
| `/core:architecture` | 🏛️ Generate system architecture | `/core:architecture` | [→](./core-architecture.md) |
| `/core:guidelines` | 📘 Generate project guidelines | `/core:guidelines` | [→](./core-guidelines.md) |
| `/core:style` | 🎨 Generate style system guide | `/core:style` | [→](./core-style.md) |

## 🎯 Quick Selection Guide

```text
Your Scenario:
├─ Start requirement delivery? → /flow:init "REQ-123|Feature|URLs"
├─ Need executable plan? → /flow:spec "REQ-123"
├─ Need implementation/resume? → /flow:dev "REQ-123" [--resume]
├─ Need release gates? → /flow:verify "REQ-123" --strict
├─ Ready to ship? → /flow:release "REQ-123"
├─ Check progress? → /flow:status REQ-123
├─ Fix production bug? → /flow:fix "BUG-001|Description"
└─ Project-level planning? → /core:roadmap /core:architecture /core:guidelines
```

## 📚 Related Documentation

- [Getting Started Guide](../guides/getting-started.md)
- [Workflow Guide](../guides/workflow-guide.md)
- [Best Practices](../guides/best-practices.md)
