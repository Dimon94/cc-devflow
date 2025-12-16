# `/flow-new` - Start New Requirement Development

[中文文档](./flow-new.zh-CN.md) | [English](./flow-new.md)

---

## 📋 Overview

One-command launch of complete requirement development flow, from PRD generation to code delivery automated workflow.

## 🎯 Syntax

```bash
/flow-new "REQ-ID|Feature Title|Plan URLs"
```

## 📖 Parameters

| Parameter | Description | Required | Example | Notes |
|-----------|-------------|----------|---------|-------|
| **REQ-ID** | Requirement number | ✅ | `REQ-123` | Must be unique, format REQ-NNN |
| **Feature Title** | Brief description | ✅ | `User Authentication Feature` | Used for Git branch naming and document titles |
| **Plan URLs** | External reference links | ❌ | `https://docs.example.com/auth` | Optional, separate multiple with `\|` |

## 🎬 Use Cases

### ✅ Recommended Scenarios

| Scenario | Description |
|----------|-------------|
| Launch brand new feature development | New feature from scratch |
| First-time requirement document creation | Need to generate PRD, EPIC, TASKS documents |
| Long-term project launch | Projects lasting > 1 week |

### ❌ Not Recommended Scenarios

| Scenario | Alternative |
|----------|------------|
| Resume interrupted development | Use `/flow-restart "REQ-123"` |
| Fix bugs | Use `/flow-fix "BUG-001\|Description"` |
| Only initialize directory structure | Use `/flow-init "REQ-123\|Title"` |
| Quick prototype validation | Use `/flow-ideate "Idea description"` |

## 🔄 Execution Flow

```text
/flow-new "REQ-123|User Authentication|https://docs.example.com/auth"
  ↓
Stage 1: Initialize (flow-init)
  ├─ Create requirement directory structure
  ├─ Load roadmap and architecture context (if exists)
  ├─ Create Git branch feature/REQ-123-user-auth
  └─ Initialize orchestration_status.json
  ↓
Stage 2: PRD Generation (prd-writer agent)
  ├─ Analyze external reference links
  ├─ Research existing codebase
  ├─ Generate PRD.md using PRD_TEMPLATE
  └─ Record to EXECUTION_LOG.md
  ↓
Stage 3: UI Prototype Generation (ui-designer agent, conditional)
  ├─ Detect if PRD contains UI requirements
  ├─ If UI requirements exist, generate UI_PROTOTYPE.html
  ├─ Responsive design (320px/768px/1024px)
  └─ Complete interaction states and real images
  ↓
Stage 4: Technical Design (tech-architect agent)
  ├─ Analyze PRD + existing codebase
  ├─ Design technical solution (avoid over-engineering)
  ├─ Generate TECH_DESIGN.md
  └─ Anti-Tech-Creep enforcement
  ↓
Stage 4.5: Requirement Quality Check (checklist-agent, optional) ⭐ NEW
  ├─ Generate type-specific checklists (ux, api, security, etc.)
  ├─ Validate 5 quality dimensions
  ├─ Calculate completion percentage
  └─ 80% threshold gate before EPIC
  ↓
Stage 5: EPIC & TASKS Generation (planner agent)
  ├─ Analyze PRD + TECH_DESIGN
  ├─ Generate EPIC.md using EPIC_TEMPLATE
  ├─ Generate TASKS.md using TASKS_TEMPLATE
  └─ Tasks ordered in TDD sequence (Phase 1-5)
  ↓
Stage 6: Development (dev-implementer agent + main agent execution)
  ├─ dev-implementer generates IMPLEMENTATION_PLAN.md
  ├─ Main agent executes code implementation
  ├─ Follow TDD: tests first, then implementation
  └─ Real-time update TASKS.md progress
  ↓
Stage 7: QA (qa-tester agent)
  ├─ Generate TEST_PLAN.md
  ├─ Execute tests (unit tests, integration tests)
  ├─ Generate TEST_REPORT.md
  └─ Security scan (security-reviewer agent)
  ↓
Stage 8: Release (release-manager agent)
  ├─ Generate RELEASE_PLAN.md
  ├─ Check release readiness
  ├─ Create Pull Request
  └─ Create Git Tag (optional)
```

## 💡 Examples

### Example 1: Basic Usage

```bash
/flow-new "REQ-001|User Login Feature"
```

**Output**:
```
devflow/requirements/REQ-001/
├── orchestration_status.json
├── EXECUTION_LOG.md
├── PRD.md
├── EPIC.md
├── TASKS.md
└── ... (other documents)
```

**Git Branch**: `feature/REQ-001-user-login`

### Example 2: With External Reference

```bash
/flow-new "REQ-002|Payment Integration|https://stripe.com/docs/api"
```

**Effect**:
- PRD will reference Stripe API documentation
- Technical design will consider Stripe integration solution
- Task breakdown will include Stripe SDK integration tasks

### Example 3: Multiple Reference Links

```bash
/flow-new "REQ-003|Data Analytics|https://doc1.com|https://doc2.com"
```

**Effect**:
- System will fetch content from both external links
- PRD will reference both documents comprehensively
- `research/` directory will save fetched content

## 📂 Output File Structure

After executing `/flow-new`, complete requirement directory is generated:

```
devflow/requirements/REQ-XXX/
├── orchestration_status.json    # State management (stage, progress, timestamps)
├── EXECUTION_LOG.md             # Complete audit trail
├── PRD.md                       # Product Requirements Document
├── UI_PROTOTYPE.html            # UI Prototype (conditional generation)
├── TECH_DESIGN.md               # Technical Design Document
├── checklists/                  # Requirement quality checklists ⭐ NEW
│   ├── ux.md                    # UX checklist
│   ├── api.md                   # API checklist
│   └── security.md              # Security checklist
├── EPIC.md                      # Epic planning and breakdown
├── TASKS.md                     # Single unified task list
├── tasks/                       # Task execution artifacts
│   ├── TASK_001.completed
│   ├── TASK_002.completed
│   └── IMPLEMENTATION_PLAN.md
├── research/                    # External research materials (MCP fetched)
├── TEST_PLAN.md                 # QA testing strategy
├── TEST_REPORT.md               # QA testing results
├── SECURITY_PLAN.md             # Security review plan
├── SECURITY_REPORT.md           # Security scan results
└── RELEASE_PLAN.md              # Release checklist
```

## 🔗 Related Commands

- [`/flow-init`](./flow-init.md) - Only initialize requirement structure (no subsequent stages)
- [`/flow-checklist`](../../.claude/commands/flow-checklist.md) - Requirement quality check (80% gate before EPIC) ⭐ NEW
- [`/flow-restart`](./flow-restart.md) - Resume interrupted development
- [`/flow-status`](./flow-status.md) - View requirement development progress
- [`/flow-verify`](./flow-verify.md) - Verify document consistency
- [`/flow-fix`](./flow-fix.md) - Bug fix workflow (alternative to flow-new)

## ⚙️ Configuration Options

### Environment Variables

```bash
# Quality gate configuration
export MIN_TEST_COVERAGE=80              # Minimum test coverage threshold
export STRICT_TYPE_CHECKING=true         # Enforce strict TypeScript checking

# Flow control
export FLOW_AUTO_APPROVE=false           # Whether quality gates require manual approval
export FLOW_SKIP_BACKGROUND=false        # Whether to skip background process startup

# MCP integration
export WEBFETCH_TIMEOUT=30               # External link fetch timeout (seconds)
export ALLOWED_DOMAINS=""                # Allowed domains whitelist
```

### Hooks Configuration

Hooks in `.claude/settings.json` will be triggered during flow-new execution:

- **PreToolUse**: Block non-compliant operations (e.g., violating TDD order)
- **PostToolUse**: Auto-record file changes to EXECUTION_LOG.md
- **Constitution Compliance**: Enforce Constitution v2.0.0 at every stage

## 🚨 Common Issues

### Q1: What if flow-new gets interrupted halfway?

**A**: Use `/flow-restart "REQ-123"` to auto-detect restart point and continue execution.

### Q2: How to skip certain stages (e.g., UI prototype)?

**A**: UI prototype is conditionally triggered. If PRD doesn't contain UI requirements, it will be automatically skipped. Other stages don't support skipping yet.

### Q3: What if external link fetch fails?

**A**:
1. Check network connection
2. Check `ALLOWED_DOMAINS` configuration
3. Increase `WEBFETCH_TIMEOUT` timeout
4. Manually save reference content to `research/` directory

### Q4: Generated PRD doesn't meet expectations?

**A**:
1. Provide more detailed external reference links
2. Manually edit PRD.md after execution
3. Use `/flow-restart "REQ-123" --from=prd` to regenerate

### Q5: Task order doesn't meet TDD requirements?

**A**: This is a bug. TASKS.md must follow Phase 1-5 TDD order:
- Phase 1: Test infrastructure
- Phase 2: Unit test writing
- Phase 3: Integration test writing
- **Phase 3.5: TEST VERIFICATION CHECKPOINT** (blocking point)
- Phase 4: Feature implementation
- Phase 5: Documentation and cleanup

If order is incorrect, please report a bug.

## 📊 Performance Estimates

| Requirement Complexity | Estimated Time | File Count | Token Usage |
|------------------------|----------------|------------|-------------|
| Simple (CRUD) | 5-10 minutes | 10-15 files | ~20K tokens |
| Medium (API Integration) | 15-30 minutes | 15-20 files | ~50K tokens |
| Complex (Multi-module) | 30-60 minutes | 20-30 files | ~100K tokens |

**Note**: Actual time depends on codebase size, number of external links, agent response speed, etc.

## 🔍 Debug Mode

Enable verbose logging to view execution details:

```bash
export FLOW_DEBUG=1
/flow-new "REQ-123|Test Feature"
```

Log file location: `.claude/logs/flow-*.log`

## 📚 Deep Reading

- [Execution Model Details](../architecture/execution-model.md)
- [Sub-Agent Workflow](../architecture/agent-workflow.md)
- [Quality Gates System](../architecture/quality-gates.md)
- [Constitution v2.0.0](../architecture/constitution.md)
