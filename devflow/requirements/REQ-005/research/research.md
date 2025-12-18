# Research Report - REQ-005: Command Template Engine

## Research Summary
Investigated multi-platform adaptation strategies for CC-DevFlow, focusing on compiling existing `.claude/` assets into platform-native formats.

## Decisions

### R001 — SSOT + Compiler Strategy
- **Decision**: Treat `.claude/` as the single source of truth and implement an Adapter Compiler to emit platform artifacts.
- **Rationale**: cc-devflow commands already include structured frontmatter and deterministic placeholders (`{SCRIPT:*}`, `{AGENT_SCRIPT}`, `$ARGUMENTS`). A compiler avoids template duplication and reduces drift.
- **Alternatives Considered**: Runtime Handlebars engine; static per-platform templates.

### R002 — Deterministic Command Compilation
- **Decision**: Compile `.claude/commands/*.md` by expanding placeholders from frontmatter, then emit to per-platform folders.
- **Rationale**: Mirrors spec-kit build-time placeholder replacement while keeping `.claude/` as SSOT.
- **Alternatives Considered**: Monolithic runtime engine; manual per-platform editing.

### R003 — Skills Progressive Disclosure
- **Decision**: Generate a Skills Registry (summary) + a Loader (`load_skill <name>`) for on-demand loading.
- **Rationale**: Keeps rules/context small and consistent across platforms, while preserving full skill content.
- **Alternatives Considered**: Inject full skills into rules (too large); MCP-only (not all platforms support tools).

## Source Library
- [Handlebars.js Official Docs](https://handlebarsjs.com/)
- spec-kit project references
