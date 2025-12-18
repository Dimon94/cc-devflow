# Multi-Platform Command Format Comparison

**Generated**: 2025-12-18
**Source**: Official documentation and community resources

## Platform Comparison Table

| **Dimension** | **OpenAI Codex CLI** | **Cursor AI** | **Qwen Code** | **Antigravity Agent** |
|--------------|---------------------|---------------|---------------|----------------------|
| **Config Directory** | `~/.codex/prompts/` | `.cursor/rules/` | `~/.qwen/commands/` | `.agent/workflows/` |
| **File Format** | `.md` (Markdown) | `.md` / `.json` | `.toml` (TOML) | `.md` (Markdown) |
| **Frontmatter** | Optional YAML | Not Supported | Not Supported | **Required** YAML |
| **Frontmatter Fields** | `description`, `argument-hint` | N/A | N/A | `description` (max 250 chars) |
| **Arg Placeholder** | `$1`-`$9`, `$ARGUMENTS`, `$KEY=value` | None (pure instructions) | `{{args}}` | `[ComponentName]` |
| **Shell Execution** | Not Supported | Not Supported | `!{git diff}` | `// turbo`, `// turbo-all` |
| **Agent Support** | No | Yes (built-in) | Yes (MCP) | Yes (built-in) |
| **Namespace Convention** | Flat (filename → command) | Flat (filename → command) | Nested (`git/commit.toml` → `/git:commit`) | Flat (filename → command) |
| **Invocation Syntax** | `/prompts:<name> [args]` | `/` (popup) | `/` (popup) | `/` (popup) |
| **Content Limit** | No official limit | ~150 lines recommended | No official limit | **12,000 chars max** |
| **Session Reload** | Restart required | Real-time | Real-time | Real-time |

## Platform-Specific Details

### OpenAI Codex CLI

**File Location**: `~/.codex/prompts/`

**Format Example**:
```yaml
---
description: Review code changes
argument-hint: [FILE=<path>] [FOCUS="<area>"]
---
Review the following code changes...
The file is: $FILE
Focus on: $FOCUS
```

**Placeholder Syntax**:
- `$1` - `$9`: Positional arguments
- `$ARGUMENTS`: All arguments combined
- `$KEY`: Named parameter (supplied as `KEY=value`)
- `$$`: Literal dollar sign

**Sources**:
- [Codex CLI Documentation](https://developers.openai.com/codex/cli/)
- [Slash Commands Guide](https://developers.openai.com/codex/guides/slash-commands/)

---

### Cursor AI

**File Location**: `.cursor/rules/` (project) or `.cursorrules` (deprecated)

**Format Example**:
```markdown
# Code Review Rule

When reviewing code:
1. Check for type safety
2. Verify test coverage
3. Follow the pattern from `src/utils/`
```

**Key Features**:
- No frontmatter support
- Pure instruction-based
- Rules chain together
- Real-time file reload

**Sources**:
- [Cursor Features](https://cursor.com/features)
- [Master Custom Rules Guide](https://geekyants.com/blog/master-cursor-custom-rules-to-align-gen-ai-with-your-code)

---

### Qwen Code

**File Location**: `~/.qwen/commands/` or `.qwen/commands/`

**Format Example** (TOML):
```toml
description = "Analyze staged changes"
prompt = """
Analyze the staged changes and suggest improvements:
{{args}}

Current diff:
!{git diff --staged}
"""
```

**Placeholder Syntax**:
- `{{args}}`: All user arguments
- `!{command}`: Shell command execution (output injected)
- Without `{{args}}`: Arguments appended after two newlines

**Namespace**: Subdirectories create namespaced commands
- `commands/git/commit.toml` → `/git:commit`

**Sources**:
- [Qwen Code CLI Documentation](https://www.zdoc.app/en/QwenLM/qwen-code/blob/main/docs/cli/commands.md)
- [Qwen Code Docs](https://qwenlm.github.io/qwen-code-docs/)

---

### Antigravity Agent

**File Location**: `.agent/workflows/`

**Format Example**:
```yaml
---
description: Deploy application to production
---
# Deploy Workflow

1. Run tests // turbo
   ```bash
   npm test
   ```

2. Build for production // turbo
   ```bash
   npm run build
   ```

3. Deploy to [environment] // turbo-all
   ```bash
   npm run deploy -- --env=[environment]
   ```
```

**Key Features**:
- YAML frontmatter is **required**
- `description` field mandatory (max 250 chars)
- Content limit: 12,000 characters
- `// turbo`: Auto-execute single step
- `// turbo-all`: Auto-execute all commands
- `[placeholder]`: Bracket notation for user input

**Sources**:
- [Antigravity Workflows Guide](https://antigravity.codes/blog/workflows)
- [Customize Antigravity](https://atamel.dev/posts/2025/11-25_customize_antigravity_rules_workflows/)

---

## Compilation Strategy for CC-DevFlow

### Source Format (`.claude/commands/*.md`)

```yaml
---
name: flow-prd
description: Generate PRD document
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  validate: .claude/scripts/validate-research.sh
---
# Flow-PRD Command

## User Input
$ARGUMENTS = "REQ_ID?"

## Execution Flow
1. Run {SCRIPT:prereq} --json
2. Validate with {SCRIPT:validate}
...
```

### Target Transformations

| Source Element | Codex Output | Qwen Output | Antigravity Output |
|---------------|--------------|-------------|-------------------|
| `$ARGUMENTS` | `$ARGUMENTS` (kept) | `{{args}}` | `[arguments]` |
| `{SCRIPT:prereq}` | Inline script path | `!{path}` or inline | `// turbo` + code block |
| YAML `description` | YAML `description` | TOML `description` | YAML `description` |
| YAML `scripts.*` | Remove (expand inline) | Remove (convert to `!{}`) | Remove (embed in steps) |

### Compiler Pipeline

```
.claude/commands/*.md (SSOT)
        │
        ▼
    ┌─────────────────┐
    │  Parser Stage   │
    │  (gray-matter)  │
    │  Extract:       │
    │  - frontmatter  │
    │  - body         │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Transform Stage │
    │ Per-platform:   │
    │ - Placeholder   │
    │ - Shell syntax  │
    │ - Frontmatter   │
    └────────┬────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
.codex/         .qwen/
prompts/        commands/
*.md            *.toml
    │                 │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Manifest Stage  │
    │ Generate:       │
    │ - manifest.json │
    │ - Source map    │
    │ - Hash          │
    └─────────────────┘
```

## Key Dependencies

### JavaScript Libraries

| Library | Purpose | Notes |
|---------|---------|-------|
| `gray-matter` | Parse YAML frontmatter | High reputation, 97 snippets |
| `js-yaml` | YAML stringify | For frontmatter serialization |
| `@iarna/toml` | TOML stringify | For Qwen output format |
| `crypto` | Hash generation | For manifest integrity |

### Design Principles

1. **Deterministic Transforms**: No runtime templating engine
2. **SSOT Preservation**: `.claude/` remains the source of truth
3. **Platform-Native Output**: Each platform gets native format
4. **Lossless Roundtrip**: Source mapping enables regeneration
