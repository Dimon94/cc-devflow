# `/core-roadmap` - Generate Product Roadmap

[中文文档](./core-roadmap.zh-CN.md) | [English](./core-roadmap.md)

---

## 📋 Overview

Generate comprehensive product roadmap and requirement priority planning through 6-stage interactive dialogue.

## 🎯 Syntax

```bash
/core-roadmap
```

## 🎬 Use Cases

### ✅ Recommended Scenarios
- Early project product direction planning
- Reorganize requirement priorities
- Present product plan to team

### ❌ Not Recommended Scenarios
- Single requirement development → Use `/flow:init` (then `/flow:spec` → `/flow:dev` → `/flow:verify` → `/flow:release`)

## 🔄 Execution Flow (6-Stage Interactive Dialogue)

```text
Stage 1: Product Vision & Goals
  ├─ Product positioning
  ├─ Core value proposition
  └─ Long-term objectives

Stage 2: Target Users & Pain Points
  ├─ User personas
  ├─ Core pain points
  └─ Use scenarios

Stage 3: Core Feature Planning
  ├─ Feature list
  ├─ Priority ranking
  └─ Feature dependencies

Stage 4: Technical Architecture Design
  ├─ Tech stack selection
  ├─ System architecture
  └─ Technical risk assessment

Stage 5: Milestones & Timeline
  ├─ Quarterly planning (Q1-Q4)
  ├─ Milestone definitions (M1, M2, M3...)
  └─ Requirement allocation to quarters

Stage 6: Success Metrics Definition
  ├─ KPI definition
  ├─ Acceptance criteria
  └─ Monitoring metrics
```

## 📂 Output Files

- `devflow/ROADMAP.md` - Product Roadmap
  - Product vision and goals
  - Quarterly planning (Q1-Q4)
  - Milestone definitions (M1-M8)
  - Feature Roadmap table
  - Implementation Tracking table

- `devflow/BACKLOG.md` - Requirement Backlog
  - Priority-sorted requirement list
  - Detailed requirement descriptions
  - Estimates and dependencies

## 💡 Example Dialogue Snippet

```
Agent: 📋 Stage 1: Product Vision & Goals
Please describe your product vision and core value proposition:

User: Build an intelligent code review platform to help teams improve code quality
      and reduce manual code review time costs.

Agent: 🎯 Stage 2: Target Users & Pain Points
Who are your target users? What are their core pain points?

User: Target users are Tech Leads and senior engineers in development teams.
      Pain points:
      1. Low manual code review efficiency
      2. Inconsistent code quality standards
      3. High cost of training new developers

... (Continue Stage 3-6)
```

## 🔗 Related Commands

- [`/core-architecture`](./core-architecture.md) - Generate architecture based on roadmap
- [`/flow:init`](./flow-init.md) - Initialize requirement based on roadmap
- `.claude/scripts/sync-roadmap-progress.sh` - Sync progress to roadmap

## 📚 Deep Reading

- [Roadmap System Guide](../guides/roadmap-guide.md)
- [Priority Management](../guides/priority-management.md)
- [ROADMAP_TEMPLATE](../../.claude/docs/templates/ROADMAP_TEMPLATE.md)
