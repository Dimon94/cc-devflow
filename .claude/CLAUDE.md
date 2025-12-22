# CC-DevFlow .claude Directory Architecture

## Purpose
This directory contains Claude Code CLI extensions for the CC-DevFlow development workflow system.

## Directory Structure

```
.claude/
├── agents/                    # Agent instruction files (research-type, invoked by commands)
│   ├── checklist-agent.md     # Checklist generation logic [NEW: REQ-002]
│   ├── clarify-analyst.md     # Requirements clarification
│   ├── prd-writer.md          # PRD generation
│   ├── tech-architect.md      # Technical design
│   ├── planner.md             # EPIC/TASKS planning
│   ├── code-reviewer.md       # Code review
│   ├── qa-tester.md           # QA testing
│   └── ...                    # Other agents
│
├── commands/                  # Slash command definitions
│   ├── flow-checklist.md      # /flow-checklist command [NEW: REQ-002]
│   ├── flow-init.md           # /flow-init
│   ├── flow-clarify.md        # /flow-clarify
│   ├── flow-prd.md            # /flow-prd
│   ├── flow-tech.md           # /flow-tech
│   ├── flow-epic.md           # /flow-epic (modified: Checklist Gate)
│   ├── flow-dev.md            # /flow-dev
│   └── ...                    # Other commands
│
├── hooks/                     # JavaScript hooks for validation/gating
│   └── checklist-gate.js      # Epic entry gate hook [NEW: REQ-002]
│
├── scripts/                   # Bash utility scripts
│   ├── calculate-checklist-completion.sh  # Completion calculation [NEW: REQ-002]
│   ├── checklist-errors.sh    # Error codes and validation [NEW: REQ-002]
│   ├── common.sh              # Shared functions
│   ├── check-prerequisites.sh # Entry gate checks
│   └── ...                    # Other scripts
│
├── skills/                    # Reusable skill definitions
│   ├── fractal-docs-generator/   # 目录级 CLAUDE.md 自动生成
│   │   └── SKILL.md
│   ├── file-header-guardian/     # 文件头注释 @input/@output/@pos 守护
│   │   └── SKILL.md
│   ├── cc-devflow-orchestrator/
│   │   └── SKILL.md           # Workflow router (modified: /flow-checklist)
│   └── ...
│
└── docs/
    └── templates/
        ├── CHECKLIST_TEMPLATE.md  # Checklist output template [NEW: REQ-002]
        └── ...                    # Other templates
```

## REQ-002 Module: /flow-checklist

### Purpose
"Unit Tests for English" - Quality validation for requirement documents before task planning.

### Components

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| Command | `commands/flow-checklist.md` | 256 | Command definition and flow |
| Agent | `agents/checklist-agent.md` | 176 | Generation logic with Anti-Example rules |
| Gate Hook | `hooks/checklist-gate.js` | 320 | Epic entry gate validation |
| Calculator | `scripts/calculate-checklist-completion.sh` | 244 | Completion percentage |
| Errors | `scripts/checklist-errors.sh` | 132 | Error codes and validation |
| Template | `docs/templates/CHECKLIST_TEMPLATE.md` | 53 | Output format |

### Integration Points

1. **Entry**: After `/flow-prd`, before `/flow-epic`
2. **Gate**: Integrated into `/flow-epic` Entry Gate (Step 5)
3. **Config**: `config/quality-rules.yml` (80% threshold)
4. **Output**: `devflow/requirements/{REQ}/checklists/*.md`

### Quality Dimensions
- Completeness
- Clarity
- Consistency
- Measurability
- Coverage

---

**Last Updated**: 2025-12-15
**REQ-002 Version**: 1.0.0
