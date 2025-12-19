# REQ-005: Multi-Platform Adaptation (Compile From `.claude/`)

## Overview
以 `.claude/` 为单一事实源（SSOT），将 commands/scripts/skills/hooks 等资产编译为各平台可消费的规则与工作流。

## Roadmap Context
- **Roadmap Item**: RM-007 + RM-008
- **Milestone**: M4 (Multi-Platform)
- **Quarter**: Q2-2026
- **Dependencies**: RM-006 (Agent Adapter Architecture)

## Workflow Checklist
- [ ] Phase 0: Research & Discovery
  - [ ] Internal Research: Codebase overview
  - [ ] External Research: spec-kit multi-agent packaging + Antigravity Rules/Workflows
  - [ ] Research Consolidation
- [ ] Phase 1: Product Requirements (PRD)
- [ ] Phase 2: Technical Design
- [ ] Phase 3: Planning (EPIC & TASKS)
- [ ] Phase 4: Implementation (TDD)
- [ ] Phase 5: QA & Verification
- [ ] Phase 6: Release

## Next Steps
1. Consolidate decisions into `research/research.md` (SSOT + compiler strategy).
2. Run `/flow-prd` to update PRD.md.
3. Update `devflow/BACKLOG.md` / `devflow/ROADMAP.md` / `devflow/ARCHITECTURE.md` to match.
4. (Optional) Implement `npm run adapt` compiler entrypoint.
