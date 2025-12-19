# spec-kit Multi-Platform Implementation Analysis

**Source**: [spec-kit](https://github.com/github/spec-kit) - GitHub's Spec-Driven Development Toolkit
**Fetched**: 2025-12-19

---

## Overview

spec-kit 是 GitHub 官方的 Spec-Driven Development 工具包，**支持 16 个 AI 平台**，为 RM-008 Adapter Compiler 提供了成熟的多平台适配参考。

---

## Supported Platforms (16 Total)

### CLI-Based Agents (Require Tool Check)

| Agent | Directory | Format | CLI Tool | Install URL |
|-------|-----------|--------|----------|-------------|
| Claude Code | `.claude/commands/` | Markdown | `claude` | [Setup](https://docs.anthropic.com/en/docs/claude-code/setup) |
| Gemini CLI | `.gemini/commands/` | TOML | `gemini` | [GitHub](https://github.com/google-gemini/gemini-cli) |
| Qwen Code | `.qwen/commands/` | TOML | `qwen` | [GitHub](https://github.com/QwenLM/qwen-code) |
| opencode | `.opencode/command/` | Markdown | `opencode` | [opencode.ai](https://opencode.ai) |
| Codex CLI | `.codex/commands/` | Markdown | `codex` | [GitHub](https://github.com/openai/codex) |
| Auggie CLI | `.augment/rules/` | Markdown | `auggie` | [Docs](https://docs.augmentcode.com/cli/setup-auggie/install-auggie-cli) |
| CodeBuddy CLI | `.codebuddy/commands/` | Markdown | `codebuddy` | [codebuddy.ai](https://www.codebuddy.ai/cli) |
| Qoder CLI | `.qoder/commands/` | Markdown | `qoder` | [qoder.com](https://qoder.com/cli) |
| Amazon Q Developer | `.amazonq/prompts/` | Markdown | `q` | [AWS](https://aws.amazon.com/developer/learning/q-developer-cli/) |
| Amp | `.agents/commands/` | Markdown | `amp` | [ampcode.com](https://ampcode.com/manual#install) |
| SHAI | `.shai/commands/` | Markdown | `shai` | [GitHub](https://github.com/ovh/shai) |

### IDE-Based Agents (No CLI Check)

| Agent | Directory | Format | Notes |
|-------|-----------|--------|-------|
| GitHub Copilot | `.github/agents/` | Markdown | Built into VS Code |
| Cursor | `.cursor/commands/` | Markdown | IDE-based |
| Windsurf | `.windsurf/workflows/` | Markdown | IDE-based |
| Kilo Code | `.kilocode/rules/` | Markdown | IDE-based |
| Roo Code | `.roo/rules/` | Markdown | IDE-based |
| IBM Bob | `.bob/commands/` | Markdown | IDE-based |

---

## Command File Formats

### Markdown Format (Most Platforms)

```markdown
---
description: "Command description"
---

Command content with {SCRIPT} and $ARGUMENTS placeholders.
```

**Used by**: Claude, Cursor, opencode, Windsurf, Amazon Q, Amp, SHAI, IBM Bob

### GitHub Copilot Chat Mode

```markdown
---
description: "Command description"
mode: speckit.command-name
---

Command content with {SCRIPT} and $ARGUMENTS placeholders.
```

### TOML Format

```toml
description = "Command description"

prompt = """
Command content with {SCRIPT} and {{args}} placeholders.
"""
```

**Used by**: Gemini, Qwen

---

## Argument Patterns

| Context | Placeholder | Used By |
|---------|-------------|---------|
| Markdown/prompt | `$ARGUMENTS` | Claude, Cursor, Codex, etc. |
| TOML | `{{args}}` | Gemini, Qwen |
| Script | `{SCRIPT}` | All (replaced with script path) |
| Agent name | `__AGENT__` | All (replaced with agent name) |

---

## Agent-Specific File Paths

From `update-agent-context.sh`:

```bash
CLAUDE_FILE="$REPO_ROOT/CLAUDE.md"
GEMINI_FILE="$REPO_ROOT/GEMINI.md"
COPILOT_FILE="$REPO_ROOT/.github/agents/copilot-instructions.md"
CURSOR_FILE="$REPO_ROOT/.cursor/rules/specify-rules.mdc"
QWEN_FILE="$REPO_ROOT/QWEN.md"
WINDSURF_FILE="$REPO_ROOT/.windsurf/rules/specify-rules.md"
KILOCODE_FILE="$REPO_ROOT/.kilocode/rules/specify-rules.md"
AUGGIE_FILE="$REPO_ROOT/.augment/rules/specify-rules.md"
ROO_FILE="$REPO_ROOT/.roo/rules/specify-rules.md"
CODEBUDDY_FILE="$REPO_ROOT/CODEBUDDY.md"
QODER_FILE="$REPO_ROOT/QODER.md"
AMP_FILE="$REPO_ROOT/AGENTS.md"
SHAI_FILE="$REPO_ROOT/SHAI.md"
Q_FILE="$REPO_ROOT/AGENTS.md"
BOB_FILE="$REPO_ROOT/AGENTS.md"
```

---

## Key Implementation Patterns

### 1. AGENT_CONFIG as Single Source of Truth

```python
AGENT_CONFIG = {
    "claude": {
        "name": "Claude Code",
        "folder": ".claude/",
        "install_url": "https://docs.anthropic.com/...",
        "requires_cli": True,
    },
    "cursor-agent": {
        "name": "Cursor",
        "folder": ".cursor/",
        "install_url": None,  # IDE-based
        "requires_cli": False,
    },
    # ... 16 total agents
}
```

### 2. Context Update Script Pattern

```bash
update_agent_file() {
    local target_file="$1"
    local agent_name="$2"

    if [[ ! -f "$target_file" ]]; then
        # Create from template
        create_new_agent_file "$target_file" "$temp_file" "$project_name" "$current_date"
    else
        # Update existing
        update_existing_agent_file "$target_file" "$current_date"
    fi
}
```

### 3. Template Placeholders

```
[PROJECT NAME]
[DATE]
[EXTRACTED FROM ALL PLAN.MD FILES]
[ACTUAL STRUCTURE FROM PLANS]
[ONLY COMMANDS FOR ACTIVE TECHNOLOGIES]
[LANGUAGE-SPECIFIC, ONLY FOR LANGUAGES IN USE]
[LAST 3 FEATURES AND WHAT THEY ADDED]
```

---

## Hook Support Analysis

### Platforms with No Native Hook Support

Based on spec-kit's implementation:

| Platform | Hook Strategy | Notes |
|----------|--------------|-------|
| Claude Code | ✅ Native hooks | Full support via `.claude/hooks/` |
| Cursor | ❌ No hooks | Rules via `.cursor/rules/*.mdc` |
| Codex | ❌ No hooks | Instructions via `instructions.md` |
| Antigravity/Gemini | ⚠️ Limited | Rules files only |
| Qwen | ❌ No hooks | TOML config only |
| Windsurf | ❌ No hooks | Workflows only |

### Degradation Strategy from spec-kit

1. **Claude Code**: Direct hook support
2. **Other platforms**: Convert hooks to static rules
3. **Fallback**: Explicit script calls in command prompts

---

## Implications for RM-008

### 1. Platform Registry Pattern

Adopt AGENT_CONFIG pattern:

```javascript
// lib/compiler/platforms.js
const PLATFORM_CONFIG = {
  "cursor": {
    name: "Cursor IDE",
    folder: ".cursor/",
    entryFile: "rules/devflow.mdc",
    format: "mdc",
    argumentPattern: "$ARGUMENTS",
    hasHooks: false,
  },
  "codex": {
    name: "Codex CLI",
    folder: ".codex/",
    entryFile: "skills/cc-devflow/SKILL.md",
    format: "markdown",
    argumentPattern: "$ARGUMENTS",
    hasHooks: false,
  },
  // ...
};
```

### 2. Context File Generation

Follow spec-kit's update-agent-context.sh pattern:
- Parse plan/roadmap for metadata
- Template-based generation
- Preserve manual additions on update

### 3. Format-Specific Emitters

| Platform | Format | Template |
|----------|--------|----------|
| Cursor | MDC | YAML frontmatter + Markdown |
| Codex | Markdown | SKILL.md pattern |
| Qwen | TOML | `description` + `prompt` fields |
| Antigravity | Markdown | Rules with 12K limit |

### 4. Hook Migration Table

| Original Hook | Cursor | Codex | Antigravity |
|--------------|--------|-------|-------------|
| `UserPromptSubmit` | Rule in `.mdc` | `instructions.md` | Rule file |
| `PreToolUse` | Rule in `.mdc` | N/A | Rule file |
| `PostToolUse` | N/A | N/A | N/A |
| `Stop` | N/A | N/A | N/A |

---

## References

- [spec-kit/AGENTS.md](spec-kit/AGENTS.md) - Agent integration guide
- [spec-kit/scripts/bash/update-agent-context.sh](spec-kit/scripts/bash/update-agent-context.sh) - Context update script
- [spec-kit/src/specify_cli/__init__.py](spec-kit/src/specify_cli/__init__.py) - CLI implementation
