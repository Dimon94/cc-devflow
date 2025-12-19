# Research Report - REQ-005 (RM-007): Command Emitter

## Research Summary

Investigated multi-platform command emitter architecture for CC-DevFlow. The goal is to compile `.claude/commands/*.md` as the single source of truth (SSOT) into platform-native formats for Codex, Cursor, Qwen, and Antigravity.

**Key Findings**:
1. Four target platforms use distinct file formats and placeholder syntaxes
2. Deterministic compile-time transformation is superior to runtime templating
3. Gray-matter + js-yaml provide robust frontmatter parsing
4. Platform-specific constraints (Antigravity 12K limit, Qwen TOML format) require adaptive emitters

## Decisions

### R001 — SSOT + Compiler Strategy

- **Decision**: Treat `.claude/commands/*.md` as the single source of truth and implement an Command Emitter to generate platform artifacts.
- **Rationale**: cc-devflow commands already include structured frontmatter (`scripts`, `description`) and deterministic placeholders (`{SCRIPT:*}`, `{AGENT_SCRIPT}`, `$ARGUMENTS`). A compiler avoids template duplication and reduces drift.
- **Alternatives Considered**: Runtime Handlebars engine (unnecessary complexity); static per-platform templates (drift + duplication).

### R002 — Per-Platform Output Directories

- **Decision**: Emit compiled artifacts to platform-native folders:
  - Codex: `.codex/prompts/{core-*,flow-*}.md`
  - Cursor: `.cursor/commands/{core-*,flow-*}.md`
  - Qwen: `.qwen/commands/{core-*,flow-*}.toml`
  - Antigravity: `.agent/workflows/{core-*,flow-*}.md`
- **Rationale**: Each platform scans specific directories for custom commands. Using native paths ensures automatic discovery.
- **Alternatives Considered**: Unified output directory (breaks platform conventions); symlinks (cross-platform compatibility issues).

### R003 — Unified Placeholder Expansion

- **Decision**: Expand cc-devflow placeholders based on frontmatter:
  - `{SCRIPT:<alias>}` → Resolved from `scripts.<alias>` in frontmatter
  - `{AGENT_SCRIPT}` → Resolved from `agent_scripts` field (with `__AGENT__` substitution)
  - `$ARGUMENTS` → Mapped per platform (`$ARGUMENTS` for MD, `{{args}}` for TOML)
- **Rationale**: Frontmatter-driven expansion is deterministic and self-documenting. No runtime interpolation needed.
- **Alternatives Considered**: Handlebars helpers (runtime overhead); regex-only replacement (fragile for nested cases).

### R004 — Platform Argument Syntax Mapping

- **Decision**: Map argument placeholders per target platform:
  | Source | Codex | Cursor | Qwen | Antigravity |
  |--------|-------|--------|------|-------------|
  | `$ARGUMENTS` | `$ARGUMENTS` | Remove/inline | `{{args}}` | `[arguments]` |
  | `$1`, `$2`... | Keep | Remove | Not supported | `[param1]` |
- **Rationale**: Each platform has distinct argument handling. Explicit mapping ensures correct runtime behavior.
- **Alternatives Considered**: Universal syntax (incompatible with platform parsers); no argument support (reduces utility).

### R005 — Manifest Generation

- **Decision**: Generate `devflow/.generated/manifest.json` containing:
  - Source path
  - Target path
  - Content hash (SHA-256)
  - Generation timestamp
  - Platform identifier
- **Rationale**: Enables incremental compilation, drift detection, and debugging.
- **Alternatives Considered**: No manifest (harder to debug); database (overkill for static files).

### R006 — Filename Preservation

- **Decision**: Preserve original command filenames without adding `devflow.*` prefix.
- **Rationale**: CC-DevFlow commands already use namespaced prefixes (`core-*`, `flow-*`), making additional prefixes redundant.
- **Alternatives Considered**: `devflow.*` prefix (clutters namespace, breaks platform conventions).

### R007 — Library Selection

- **Decision**: Use the following JavaScript libraries:
  - `gray-matter`: Parse YAML frontmatter from Markdown
  - `js-yaml`: Serialize YAML for output
  - `@iarna/toml`: Serialize TOML for Qwen output
  - Node.js `crypto`: Generate content hashes
- **Rationale**: gray-matter is the de facto standard for frontmatter parsing (97 code snippets, High reputation). js-yaml is the standard YAML library for Node.js.
- **Alternatives Considered**: Custom parser (reinventing the wheel); Handlebars (runtime overhead).

## Source Library

### Official Documentation
- [Codex CLI Documentation](https://developers.openai.com/codex/cli/)
- [Codex Slash Commands Guide](https://developers.openai.com/codex/guides/slash-commands/)
- [Cursor Features](https://cursor.com/features)
- [Qwen Code CLI Commands](https://www.zdoc.app/en/QwenLM/qwen-code/blob/main/docs/cli/commands.md)
- [Antigravity Workflows Guide](https://antigravity.codes/blog/workflows)

### Library Documentation
- [gray-matter GitHub](https://github.com/jonschlinkert/gray-matter) - Frontmatter parsing
- [js-yaml GitHub](https://github.com/nodeca/js-yaml) - YAML parsing/serialization

### Internal References
- [Platform Format Comparison](./mcp/platform-format-comparison.md)
- [Codebase Overview](./internal/codebase-overview.md)
- [spec-kit Source Analysis](./internal/spec-kit-source-analysis.md)
