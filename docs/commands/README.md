# 📋 Command Reference

[中文文档](./README.zh-CN.md) | [English](./README.md)

---

## 🎯 Requirement Commands

| Command | Purpose | Quick Example | Detailed Docs |
|---------|---------|---------------|---------------|
| `/flow:init` | 📦 Initialize requirement context | `/flow:init "REQ-123\|Feature"` | [→](../../.claude/commands/flow/init.md) |
| `/flow:autopilot` | 🧭 Drive the thin autopilot loop | `/flow:autopilot "REQ-123\|Goal"` | [→](../../.claude/commands/flow/autopilot.md) |
| `/flow:spec` | 📋 Generate task-manifest | `/flow:spec "REQ-123"` | [→](../../.claude/commands/flow/spec.md) |
| `/flow:dev` | 🛠️ Dispatch or resume task execution | `/flow:dev "REQ-123" --resume` | [→](../../.claude/commands/flow/dev.md) |
| `/flow:verify` | ✅ Quick/strict quality gates | `/flow:verify "REQ-123" --strict` | [→](../../.claude/commands/flow/verify.md) |
| `/flow:prepare-pr` | 🧾 Generate PR-ready wrap-up brief | `/flow:prepare-pr "REQ-123"` | [→](../../.claude/commands/flow/prepare-pr.md) |
| `/flow:release` | 🚢 Release + runtime cleanup | `/flow:release "REQ-123"` | [→](../../.claude/commands/flow/release.md) |
| `/flow:status` | 📊 Query progress snapshot | `/flow:status REQ-123` | [→](../../.claude/commands/flow/status.md) |
| `/flow:restart` | 🔄 Recover interrupted workflow | `/flow:restart "REQ-123" --from=dev` | [→](../../.claude/commands/flow/restart.md) |
| `/flow:update` | ✅ Update task progress | `/flow:update "REQ-123" "T001"` | [→](../../.claude/commands/flow/update.md) |
| `/flow:fix` | 🐛 Bug fix workflow | `/flow:fix "BUG-001\|Description"` | [→](../../.claude/commands/flow/fix.md) |

## ⚠️ Deprecated Commands

| Deprecated | Migration |
|------------|-----------|
| `/flow:new` | Prefer `/flow:autopilot "REQ-123\|Goal"`; for manual delivery use `/flow:init -> /flow:spec -> /flow:dev -> /flow:verify -> /flow:prepare-pr -> /flow:release` |
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
├─ Start with a vague goal and want autopilot? → /flow:autopilot "REQ-123|Goal"
├─ Start requirement delivery manually? → /flow:init "REQ-123|Feature|URLs"
├─ Need executable plan from intent memory or TASKS input? → /flow:spec "REQ-123"
├─ Need implementation/resume? → /flow:dev "REQ-123" [--resume]
├─ Need release gates? → /flow:verify "REQ-123" --strict
├─ Need PR-ready wrap-up? → /flow:prepare-pr "REQ-123"
├─ Ready to ship? → /flow:release "REQ-123"
├─ Check progress? → /flow:status REQ-123
├─ Fix production bug? → /flow:fix "BUG-001|Description"
└─ Project-level planning? → /core:roadmap /core:architecture /core:guidelines
```

## 📚 Related Documentation

- [Getting Started Guide](../guides/getting-started.md)
- [Workflow Guide](../guides/workflow-guide.md)
- [Best Practices](../guides/best-practices.md)

## 🔧 Harness Worker Hooks

- Prepare a delegated worker handoff: `node bin/harness.js worker --change-id REQ-123 --worker delegate-01`
- Run a delegated worker locally: `node bin/harness.js worker-run --change-id REQ-123 --worker delegate-01 [--task T002] --command "codex exec < prompt.md"`
- Launch a delegated worker via provider: `node bin/harness.js worker-run --change-id REQ-123 --worker delegate-01 [--task T002] --provider codex`
- Let autopilot consume delegated workers automatically: `node bin/harness.js autopilot --change-id REQ-123 --worker-provider codex`
- Generate the same PR-ready artifact directly: `node bin/harness.js prepare-pr --change-id REQ-123`
- After verify passes, autopilot also writes `devflow/intent/<REQ>/artifacts/pr-brief.md` and refreshes `resume-index.md`
