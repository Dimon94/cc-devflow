# 📋 Command Reference

[中文文档](./README.zh-CN.md) | [English](./README.md)

---

## 🎯 Requirement Management Commands

| Command | Purpose | Quick Example | Detailed Docs |
|---------|---------|---------------|---------------|
| `/flow-new` | 🚀 Start New Requirement Development | `/flow-new "REQ-123\|Feature"` | [→](./flow-new.md) |
| `/flow-init` | 📦 Initialize Requirement Structure | `/flow-init "REQ-123\|Feature"` | [→](./flow-init.md) |
| `/flow-status` | 📊 Query Development Progress | `/flow-status REQ-123` | [→](./flow-status.md) |
| `/flow-restart` | 🔄 Resume Interrupted Development | `/flow-restart "REQ-123"` | [→](./flow-restart.md) |
| `/flow-update` | ✅ Update Task Progress | `/flow-update "REQ-123" "T001"` | [→](./flow-update.md) |

## 🏗️ Architecture Design Commands

| Command | Purpose | Quick Example | Detailed Docs |
|---------|---------|---------------|---------------|
| `/flow-roadmap` | 🗺️ Generate Product Roadmap | `/flow-roadmap` | [→](./flow-roadmap.md) |
| `/flow-architecture` | 🏛️ Generate System Architecture | `/flow-architecture` | [→](./flow-architecture.md) |
| `/flow-guidelines` | 📘 Generate Project Guidelines | `/flow-guidelines` | [→](./flow-guidelines.md) |

## 🧪 Quality Assurance Commands

| Command | Purpose | Quick Example | Detailed Docs |
|---------|---------|---------------|---------------|
| `/flow-verify` | 🔍 Verify Document Consistency | `/flow-verify "REQ-123"` | [→](./flow-verify.md) |
| `/flow-qa` | 🧪 Execute Quality Assurance | `/flow-qa "REQ-123"` | [→](./flow-qa.md) |
| `/flow-constitution` | 📜 Constitution Compliance | `/flow-constitution --verify` | [→](./flow-constitution.md) |

## 🛠️ Tool Commands

| Command | Purpose | Quick Example | Detailed Docs |
|---------|---------|---------------|---------------|
| `/flow-fix` | 🐛 Bug Fix Flow | `/flow-fix "BUG-001\|Description"` | [→](./flow-fix.md) |
| `/flow-release` | 🚢 Create Release | `/flow-release "REQ-123"` | [→](./flow-release.md) |

## 🎯 Quick Selection Guide

```
Your Scenario:
├─ Start brand new feature? → /flow-new "REQ-123|Feature"
├─ Plan product direction? → /flow-roadmap
├─ Design system architecture? → /flow-architecture
├─ Continue interrupted development? → /flow-restart "REQ-123"
├─ Check development progress? → /flow-status REQ-123
├─ Found document conflicts? → /flow-verify "REQ-123"
├─ Development complete, test? → /flow-qa "REQ-123"
├─ Fix production bug? → /flow-fix "BUG-001|Description"
└─ Ready to release? → /flow-release "REQ-123"
```

## 📚 Related Documentation

- [Getting Started Guide](../guides/getting-started.md)
- [Workflow Guide](../guides/workflow-guide.md)
- [Best Practices](../guides/best-practices.md)
