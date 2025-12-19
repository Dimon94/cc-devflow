# Command Emitter - Compiler Module Architecture

## Purpose
Multi-platform command compiler that transforms `.claude/commands/*.md` (SSOT) into native formats for Codex, Cursor, Qwen, and Antigravity platforms.

## Architecture

```
lib/compiler/
├── parser.js           # Parse .md files, extract frontmatter + detect placeholders
├── transformer.js      # Expand {SCRIPT:*}, {AGENT_SCRIPT}, map $ARGUMENTS
├── manifest.js         # Incremental compilation, drift detection
├── schemas.js          # Zod validation schemas (CommandIR, Manifest)
├── errors.js           # Custom error types (MissingFrontmatter, UnknownAlias, etc.)
├── skills-registry.js  # Generate skills registry from .claude/skills/
├── index.js            # Compiler entry point, orchestrates pipeline
└── emitters/
    ├── base-emitter.js       # Abstract base class
    ├── codex-emitter.js      # .codex/prompts/*.md (YAML frontmatter)
    ├── cursor-emitter.js     # .cursor/commands/*.md (pure Markdown)
    ├── qwen-emitter.js       # .qwen/commands/*.toml (TOML format)
    ├── antigravity-emitter.js # .agent/workflows/*.md (12K limit, auto-split)
    └── index.js              # Emitter factory
```

## Data Flow

```
.claude/commands/*.md
        │
        ▼
┌─────────────────┐
│     Parser      │ gray-matter → CommandIR
│  (parser.js)    │ - Extract frontmatter
│                 │ - Detect placeholders
│                 │ - Compute SHA-256 hash
└────────┬────────┘
         │ CommandIR[]
         ▼
┌─────────────────┐
│   Transformer   │ Platform-specific transforms
│(transformer.js) │ - {SCRIPT:alias} → "bash <path>"
│                 │ - $ARGUMENTS → {{args}} / [arguments]
│                 │ - {AGENT_SCRIPT} + __AGENT__ substitution
└────────┬────────┘
         │ TransformedContent
         ▼
┌─────────────────┐
│    Emitters     │ Platform format + file write
│ (emitters/*.js) │ - Codex: MD + YAML frontmatter
│                 │ - Cursor: pure MD
│                 │ - Qwen: TOML
│                 │ - Antigravity: MD + YAML (12K limit)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Manifest     │ devflow/.generated/manifest.json
│ (manifest.js)   │ - Track source/target hashes
│                 │ - Enable incremental compilation
│                 │ - Detect drift
└─────────────────┘
```

## CLI Usage

```bash
npm run adapt                       # Compile all platforms
npm run adapt -- --platform codex   # Compile single platform
npm run adapt -- --check            # Drift detection only
npm run adapt -- --skills           # Generate skills-registry.json
npm run adapt -- --verbose          # Detailed output
```

## Key Schemas

- **CommandIR**: Intermediate representation after parsing
- **ManifestEntry**: Single compilation record (source, target, hash, platform)
- **Manifest**: Complete compilation history

## Dependencies

- `gray-matter`: Frontmatter parsing
- `@iarna/toml`: TOML serialization (Qwen)
- `js-yaml`: YAML serialization (Codex, Antigravity)
- `zod`: Schema validation

---

**Created**: 2025-12-18
**REQ**: REQ-005 (RM-007)
**Version**: 1.0.0
