# `/flow:init` - Initialize Requirement Structure

[中文文档](./flow-init.zh-CN.md) | [English](./flow-init.md)

---

## 📋 Overview

Initialize requirement directory structure and package runtime context. This is stage 1 of the canonical mainline (`/flow:init -> /flow:spec -> /flow:dev -> /flow:verify -> /flow:release`) and can also be used independently.

## 🎯 Syntax

```bash
/flow:init "REQ-ID|Feature Title"
# or
/flow:init --interactive
```

## 📖 Parameters

| Parameter | Description | Required | Example |
|-----------|-------------|----------|---------|
| **REQ-ID** | Requirement number | ✅ | `REQ-123` |
| **Feature Title** | Brief description | ✅ | `User Authentication Feature` |

> If the title contains non-ASCII text, the agent produces an English semantic translation for branch naming (not pinyin), while keeping the original title in docs.
| **--interactive** | Interactive ID selection | ❌ | Auto-select next available ID |

## 🎬 Use Cases

### ✅ Recommended Scenarios
- Initialize requirement structure alone
- Have roadmap, need to locate requirement
- Need to manually create document content

### ❌ Not Recommended Scenarios
- Expecting full delivery with one command (deprecated `/flow:new`)
- Resume development → Use `/flow:restart`

## 🔄 Execution Flow (includes Stage 1.5)

```text
/flow:init "REQ-123|User Authentication Feature"
  ↓
Stage 1: Prerequisites validation
  ├─ Check Git repository
  ├─ Check devflow/ directory
  └─ Verify REQ-ID uniqueness
  ↓
Stage 1.2: Git branch creation
  └─ Create feature/REQ-XXX-english-slug branch (model-translated, not pinyin)
  ↓
Stage 1.5: Roadmap & Architecture context loading (NEW)
  ├─ Check ROADMAP.md existence
  ├─ Locate requirement in roadmap
  │  ├─ RM-ID (Roadmap Item ID)
  │  ├─ Milestone (M{n}-Q{q}-{yyyy})
  │  └─ Cluster (Feature cluster)
  ├─ Load ARCHITECTURE.md
  └─ Display architecture context
     ├─ Feature Architecture (feature layers)
     ├─ Technical Architecture (tech stack)
     └─ Module Structure (target modules)
  ↓
Stage 2: Directory structure creation
  ├─ Create devflow/requirements/REQ-XXX/
  ├─ Initialize orchestration_status.json
  └─ Create EXECUTION_LOG.md
  ↓
Stage 2.3: Brainstorming (skill)
  └─ Generate devflow/requirements/REQ-XXX/BRAINSTORM.md as the “North Star”
  ↓
Stage 2.5: Research (subagent, mandatory, context-isolated)
  ├─ Run internal codebase research → research/internal/codebase-overview.md
  ├─ Capture external sources into files → research/mcp/YYYYMMDD/**
  ├─ Produce decisions → research/research-summary.md
  ├─ Fill tasks → research/tasks.json (decision/rationale/alternatives)
  └─ Consolidate → research/research.md (validated; no TODO/PLACEHOLDER)
```

## 💡 Examples

### Example 1: Basic Usage

```bash
/flow:init "REQ-123|User Authentication Feature"
```

### Example 2: Interactive Mode

```bash
/flow:init --interactive
# System will auto-select next available ID
```

### Example 3: Output with Roadmap Context

```
===================================================================
📍 Requirement Location in Roadmap
===================================================================

📋 Requirement:    REQ-123
🎯 Roadmap Item:   RM-05
📝 Feature:        User Management
📌 Derived From:   Product Backlog

📅 Timeline:
   Quarter:        Q2 2025
   Milestone:      M2-Q2-2025
   Cluster:        Core Features
===================================================================

🏗️  Architecture Context
===================================================================

🎯 Feature Architecture:
   Layer: Core (Core Feature Layer)
   Related Features: Authentication, Authorization

🔧 Technical Architecture:
   Tech Stack Layer: Business Logic + Data Access
   Key Technologies: Node.js, PostgreSQL, Redis

📦 Module Structure:
   Target Modules: src/auth/, src/user/
===================================================================
```

## 📂 Output

- `devflow/requirements/REQ-XXX/` initialized directory (includes `BRAINSTORM.md` + `research/`)
- `orchestration_status.json` + `EXECUTION_LOG.md`
- Roadmap and architecture context display (if exists)

## 🔗 Related Commands

- [`/core-roadmap`](./core-roadmap.md) - Generate roadmap first
- [`/core-architecture`](./core-architecture.md) - Generate architecture first
- Canonical chain: `/flow:init` → `/flow:spec` → `/flow:dev` → `/flow:verify` → `/flow:release`
