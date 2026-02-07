# Command Emitter - Compiler Module Architecture

## Purpose
Multi-platform compiler that transforms `.claude/` modules (commands, skills, agents, rules, hooks) into native formats for Codex, Cursor, Qwen, and Antigravity platforms.

## Architecture (v3.0)

```
lib/compiler/
├── parser.js           # Parse .md files, extract frontmatter + detect placeholders
├── transformer.js      # Expand {SCRIPT:*}, {AGENT_SCRIPT}, map $ARGUMENTS
├── manifest.js         # Incremental compilation, drift detection
├── schemas.js          # Zod validation schemas (CommandIR, Manifest)
├── errors.js           # Custom error types (MissingFrontmatter, UnknownAlias, etc.)
├── skills-registry.js  # Generate skills registry from .claude/skills/
├── skill-discovery.js  # Recursive SKILL.md discovery (grouped + root skills)
├── resource-copier.js  # Resource collection/copy and .claude path rewriting
├── platforms.js        # Platform configuration registry (v2.0)
├── context-expander.js # context.jsonl expansion (v3.0)
├── index.js            # Compiler entry point, orchestrates pipeline
├── emitters/
│   ├── base-emitter.js       # Abstract base class (v2.0: multi-module support)
│   ├── codex-emitter.js      # .codex/prompts/*.md, .codex/skills/*, AGENTS.md
│   ├── cursor-emitter.js     # .cursor/commands/*.md, .cursor/rules/*.mdc, subagents/
│   ├── qwen-emitter.js       # .qwen/commands/*.toml, .qwen/agents/*, CONTEXT.md
│   ├── antigravity-emitter.js # .agent/workflows/*.md, .agent/skills/*, rules/
│   └── index.js              # Emitter factory
└── rules-emitters/           # Legacy rules emitters (deprecated)
    └── ...
```

## Multi-Module Compilation (v3.0)

### Supported Modules

| Module | Source | Codex | Cursor | Qwen | Antigravity |
|--------|--------|-------|--------|------|-------------|
| skills | `.claude/skills/` | `.codex/skills/` | `.cursor/rules/*.mdc` | `.qwen/commands/*.toml` | `.agent/skills/` |
| commands | `.claude/commands/` | `.codex/prompts/` | `.cursor/commands/` | `.qwen/commands/` | `.agent/workflows/` |
| agents | `.claude/agents/` | `AGENTS.md` | `.cursor/subagents/` | `.qwen/agents/` | `AGENTS.md` |
| rules | `.claude/rules/` | `AGENTS.md` | `.cursor/rules/*.mdc` | `CONTEXT.md` | `.agent/rules/` |
| hooks | `.claude/hooks/` | ❌ | `hooks.json` + `hooks/` | ❌ | ❌ |

### Data Flow (v3.0)

```
.claude/
├── skills/*/SKILL.md
├── commands/*.md
├── agents/*.md
├── rules/*.md
└── hooks/*.ts
        │
        ▼
┌─────────────────────┐
│  compileMultiModule │ Orchestrates all modules
│     (index.js)      │
└────────┬────────────┘
         │
    ┌────┴────┬────────┬────────┬────────┐
    ▼         ▼        ▼        ▼        ▼
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│Skills │ │Commands│ │Agents │ │Rules  │ │Hooks  │
│Emitter│ │Emitter │ │Emitter│ │Emitter│ │Emitter│
└───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘
    │         │        │        │        │
    ▼         ▼        ▼        ▼        ▼
Platform-specific output directories
```

## CLI Usage

```bash
# Compile commands + modules
npm run adapt                       # Compile all platforms
npm run adapt -- --platform codex   # Compile single platform
npm run adapt -- --check            # Drift detection only

# v3.0: Multi-module compilation
npm run adapt -- --modules skills,commands,agents,rules
npm run adapt -- --modules skills --platform cursor
```

## Key APIs

### compile(options) - Main Flow
Compiles commands and emits platform modules (skills, agents, rules, hooks).

### compileMultiModule(options) - v3.0
Compiles all specified modules.

```javascript
const { compileMultiModule } = require('./lib/compiler');

await compileMultiModule({
  sourceBaseDir: '.claude/',
  outputBaseDir: '.',
  platforms: ['codex', 'cursor', 'qwen', 'antigravity'],
  modules: ['skills', 'commands', 'agents', 'rules'],
  verbose: true
});
```

## Key Schemas

- **CommandIR**: Intermediate representation after parsing
- **ManifestEntry**: Single compilation record (source, target, hash, platform)
- **Manifest**: Complete compilation history
- **PlatformConfig**: Platform-specific configuration (v2.0)

## Dependencies

- `gray-matter`: Frontmatter parsing
- `@iarna/toml`: TOML serialization (Qwen)
- `js-yaml`: YAML serialization (Codex, Antigravity, Cursor)
- `zod`: Schema validation

---

**Created**: 2025-12-18
**Updated**: 2026-02-07
**REQ**: REQ-005 (RM-007), Multi-Platform Adaptation
**Version**: 3.0.0

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
