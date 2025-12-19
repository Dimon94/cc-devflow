# RM-008 Adapter Compiler - Codebase Internal Analysis

**Generated**: 2025-12-19T13:45:00+08:00
**Requirement**: REQ-006 / RM-008: Adapter Compiler (Dynamic Context Compiler)

---

## Executive Summary

cc-devflow 项目已实现**成熟的多平台编译系统**（RM-007 Command Emitter）：

- **189 个 `.claude/` 配置文件**（commands, agents, scripts, skills, hooks）
- **完整编译管线**（Parser → Transformer → Emitter）
- **4 个目标平台**（Codex, Cursor, Qwen, Antigravity）
- **增量编译机制**（manifest-based drift detection）
- **技能注册系统**（skill-rules.json + registry generation）

---

## 1. Source Directory Structure (`.claude/` - SSOT)

```
.claude/                              [17 subdirs, 189 files]
├── agents/                           [18 AI agent scripts]
├── commands/                         [29 command definitions]
├── scripts/                          [36 bash utility scripts]
├── skills/                           [7 skills + 1 registry]
├── hooks/                            [11 hook scripts]
├── constitution/                     [Constitution definitions]
├── docs/                             [templates + guides]
├── guides/                           [troubleshooting guides]
├── config/                           [configuration rules]
├── rules/                            [validation rules]
├── schemas/                          [Zod schema definitions]
├── tests/                            [hook unit tests]
├── settings.json                     [permissions + hooks config]
└── CLAUDE.md                         [architecture documentation]
```

### Key Subdirectory Details

#### **commands/** - Command Definitions (29 files)
| File | Purpose | Dependencies |
|------|---------|--------------|
| flow-init.md | Requirement initialization | scripts (create, prereq, research_tasks) |
| flow-prd.md | PRD generation | agents (prd-writer) |
| flow-epic.md | Task breakdown | agents (planner), hooks (checklist-gate) |
| flow-tech.md | Technical design | agents (tech-architect) |
| flow-dev.md | Development execution | agents (code-reviewer) |

**Core Features**:
- YAML frontmatter with scripts/templates/guides mappings
- `{SCRIPT:alias}` placeholders → `.claude/scripts/` bash scripts
- `{TEMPLATE:alias}` placeholders → `.claude/docs/templates/` template files
- `{GUIDE:alias}` placeholders → `.claude/docs/guides/` guide documents

#### **scripts/** - Utility Scripts (36 files)

| Category | Script | Lines |
|----------|--------|-------|
| **Core** | common.sh | 17,890 |
| **Lifecycle** | create-requirement.sh | 11,575 |
| **Quality** | check-prerequisites.sh | 7,395 |
| **Agent Update** | update-agent-context.sh | 807 |

**Key Implementation** - `update-agent-context.sh`:
- Supports 14 platforms (Claude, Gemini, Copilot, Cursor, Qwen, Codex, etc.)
- Parses project metadata from devflow/ROADMAP.md
- Auto-generates/updates platform context files (CLAUDE.md, CURSOR.md, QWEN.md)

#### **skills/** - Skill System (7 skills + metadata)

```
skills/
├── cc-devflow-orchestrator/       # Workflow router
├── devflow-tdd-enforcer/          # TDD order enforcement
├── constitution-guardian/         # Constitution compliance
├── devflow-file-standards/        # File naming conventions
├── devflow-constitution-quick-ref/# Constitution quick reference
├── skill-developer/               # Meta-skill for skill development
├── _reference-implementations/    # Reference implementation library
└── skill-rules.json               # Trigger rules registry
```

**skill-rules.json Structure**:
```json
{
  "skill-name": {
    "type": "domain|guardrail",
    "enforcement": "suggest|block|warn",
    "priority": "critical|high|medium",
    "promptTriggers": { "keywords": [...], "intentPatterns": [...] },
    "fileTriggers": { "pathPatterns": [...], "contentPatterns": [...] }
  }
}
```

---

## 2. Compilation Pipeline (RM-007 Implementation)

### 2.1 Pipeline Architecture

```
lib/compiler/
├── index.js                      # Entry point
├── parser.js                     # YAML+Markdown parsing
├── transformer.js                # Placeholder expansion
├── manifest.js                   # Incremental compilation tracking
├── schemas.js                    # Zod validation schemas
├── errors.js                     # Custom error types
├── skills-registry.js            # Skill metadata generation
├── resource-copier.js            # Resource file copying
└── emitters/
    ├── base-emitter.js           # Abstract base class
    ├── codex-emitter.js          # Markdown + YAML
    ├── cursor-emitter.js         # Pure Markdown
    ├── qwen-emitter.js           # TOML format
    ├── antigravity-emitter.js    # Markdown + 12K split
    └── index.js                  # Emitter factory
```

### 2.2 Four-Stage Compilation Flow

#### **Stage 1: Parse**
- Input: `.claude/commands/*.md`
- Extract YAML frontmatter + Markdown body (gray-matter)
- Zod schema validation
- Detect placeholders (`{SCRIPT:*}`, `{TEMPLATE:*}`, `{GUIDE:*}`)
- Compute SHA-256 hash for incremental compilation
- Output: **CommandIR** structure

#### **Stage 2: Transform**
- Input: CommandIR + target platform
- Pipeline steps:
  1. `{SCRIPT:alias}` expansion → actual script path
  2. `{TEMPLATE:alias}` inlining → full template content
  3. `{GUIDE:alias}` inlining → full guide content
  4. `{AGENT_SCRIPT}` expansion with `__AGENT__` replacement
  5. `$ARGUMENTS` mapping by platform
  6. Path rewriting via pathMap

#### **Stage 3: Emit**

| Emitter | Output Dir | Format | Special Handling |
|---------|------------|--------|------------------|
| Codex | `.codex/prompts/` | Markdown + YAML | `argument-hint` field |
| Cursor | `.cursor/commands/` | Pure Markdown | - |
| Qwen | `.qwen/commands/` | TOML | `description` + `prompt` fields |
| Antigravity | `.agent/workflows/` | Markdown + YAML | 12K char limit + auto-split |

#### **Stage 4: Manifest Tracking**

Output: `devflow/.generated/manifest.json`
```json
{
  "version": "1.0",
  "entries": [
    {
      "source": ".claude/commands/flow-init.md",
      "sourceHash": "abc123...",
      "targets": [{ "platform": "codex", "path": "...", "hash": "..." }]
    }
  ]
}
```

### 2.3 CLI Entry

```bash
npm run adapt                          # Compile all platforms
npm run adapt -- --platform codex      # Single platform
npm run adapt -- --check               # Drift detection
npm run adapt -- --verbose             # Verbose logging
```

---

## 3. Dependency Analysis

### 3.1 REQ Relationships

```
REQ-004: Agent Adapter Interface (Completed)
  └─ lib/adapters/ (interface + implementations)

REQ-005: Command Emitter (Completed ✓ RM-007)
  └─ lib/compiler/ (full pipeline)
  └─ .codex/.cursor/.qwen/.agent/ (generated outputs)
  └─ devflow/.generated/manifest.json (incremental tracking)

REQ-006: Adapter Compiler (Initializing → RM-008)
  ├─ Extend REQ-005 pipeline
  ├─ Skills Registry generation
  ├─ Platform rules entry file injection
  ├─ Progressive skill loading mechanism
  └─ Hook degradation strategy
```

### 3.2 Platform Rules Entry Status

| Platform | Rules Entry | Exists | Purpose |
|----------|-------------|--------|---------|
| .codex/ | `.codex/rules/` | No | Codex rules |
| .cursor/ | `.cursorrules` | No | Cursor rules |
| .qwen/ | `.qwenrc` | No | Qwen rules |
| .agent/ | `.agent/workflows/` | Yes | Antigravity workflows |

**Current Status**: Platform directories exist but **lack platform-specific rule files**.

---

## 4. Identified Challenges

### Challenge 1: Antigravity 12K Limit
- **Current**: Chapter split + hard split implemented
- **Risk**: Hard split on large chapters may break semantics
- **Improvement**: "Smart chunk" algorithm by paragraph boundaries

### Challenge 2: Path Mapping Complexity
- **Current**: pathMap manually passed
- **Issue**: Cross-platform path differences
- **Improvement**: Unified PathMapper class with template rules

### Challenge 3: Resource Sync Consistency
- **Current**: resource-copier.js copies scripts/docs
- **Issue**: File updates require full manifest recompile
- **Improvement**: Incremental resource tracking

### Challenge 4: Template Content Recursive Expansion
- **Current**: Two-round expansion (inline then expand SCRIPT)
- **Issue**: Nested placeholders may not fully expand
- **Improvement**: Recursive expansion with depth limit

### Challenge 5: Skill Trigger Permission Model
- **Current**: skill-rules.json defines block/suggest/warn
- **Issue**: Cannot uniformly enforce across platforms
- **Improvement**: Platform-specific enforcement policy

---

## 5. RM-008 Implementation Blueprint

### 5.1 Core Work Items

| Work Item | Description | Effort | Dependencies |
|-----------|-------------|--------|--------------|
| **W1** | Generate Skills Registry JSON | 2d | skills-registry.js |
| **W2** | Create rule injection templates per platform | 3d | W1 |
| **W3** | Implement .cursorrules/.qwenrc/.codexrc generators | 4d | W2 |
| **W4** | Dynamic injection into platform rule entry files | 3d | W3 |
| **W5** | Unified skill loading interface (load_skill) | 2d | W1 |
| **W6** | Hook degradation & platform compatibility | 5d | W5 |
| **W7** | Integration tests + E2E validation | 4d | W1-W6 |

### 5.2 Expected Rule Entry File Formats

**`.cursorrules`** (Markdown):
```markdown
# Cursor Rules

You are an expert developer working with cc-devflow.

## Skills & Guardrails
- cc-devflow-orchestrator: Route to correct /flow-* commands
- constitution-guardian: Enforce Constitution compliance

## Key Commands
- /flow-init "REQ-XXX|Title" - Initialize requirement
- /flow-prd - Generate PRD
...
```

**`.qwen/config.yaml`** (YAML):
```yaml
version: 1.0
platform: qwen
skills:
  enabled:
    - cc-devflow-orchestrator
    - constitution-guardian
commands:
  location: .qwen/commands
```

### 5.3 Skill Loading Interface

```javascript
// lib/skills/skill-loader.js
async function loadSkill(skillName, options = {}) {
  // 1. Query skill-registry.json
  // 2. Locate skill directory
  // 3. Read SKILL.md
  // 4. Return skill object { name, description, triggers }
}
```

---

## 6. Key File Inventory

### Compilation Core
```
lib/compiler/
├── index.js                      [Entry - 184 lines]
├── parser.js                     [YAML+MD parsing - 259 lines]
├── transformer.js                [Placeholder expansion - 237 lines]
├── manifest.js                   [Incremental tracking - ~300 lines]
├── skills-registry.js            [Skill generation - 102 lines]
└── emitters/                     [5 platform emitters]

bin/
├── adapt.js                      [CLI entry - ~80 lines]
```

### Source Assets
```
.claude/
├── commands/                     [29 command files]
├── agents/                       [18 AI agents]
├── scripts/                      [36 bash scripts]
├── skills/                       [7 skills + registry]
├── hooks/                        [11 hooks]
├── docs/templates/               [10+ templates]
└── config/quality-rules.yml      [Quality gate rules]
```

### Generated Outputs
```
.codex/prompts/                   [Codex commands]
.cursor/commands/                 [Cursor commands]
.qwen/commands/                   [Qwen commands - TOML]
.agent/workflows/                 [Antigravity workflows]
devflow/.generated/manifest.json  [Compilation manifest]
```

---

## 7. Conclusions

### Key Findings

1. **Compilation System is Mature** - RM-007 implemented full Parse → Transform → Emit pipeline with 4 platform support.

2. **SSOT Principle Established** - `.claude/` is single source of truth; target directories are rebuildable artifacts.

3. **Skill System Foundation Complete** - skill-rules.json defines triggers, SKILL.md contains metadata, skill-loader framework reserved.

4. **Rule Entry Files Missing** - Platform directories exist but lack platform-specific rule files (.cursorrules, .qwenrc, etc.).

5. **Hook System Needs Adaptation** - Current hooks designed for Claude Code; need degradation or compatibility for other platforms.

### RM-008 Core Value

RM-008 will complete the compilation system through:

1. **Rule Injection** - Auto-generate platform rule entry files
2. **Skill Distribution** - Compile skill-rules.json into platform-specific skill lists
3. **Unified Interface** - Provide load_skill(name) API
4. **Platform Compatibility** - Hook and script cross-platform adaptation

---

**Report Generated**: 2025-12-19
**Analysis Scope**: /Users/dimon/001Area/80-CodeWorld/002-devflow/cc-devflow
**Coverage**: .claude/ (189 files), lib/compiler/ (15 files), platform outputs
