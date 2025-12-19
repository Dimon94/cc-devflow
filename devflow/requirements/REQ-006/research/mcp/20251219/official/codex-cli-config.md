# Codex CLI Configuration Specification

**Source**: [OpenAI Codex GitHub](https://github.com/openai/codex), [Codex Config Docs](https://github.com/openai/codex/blob/main/docs/config.md)
**Fetched**: 2025-12-19

---

## Configuration Directory

Codex CLI supports a rich set of configuration options, with preferences stored in `~/.codex/config.toml`.

> The configuration directory doesn't exist by default and must be created manually.

---

## Configuration File Locations

Codex CLI supports three configuration file locations with a defined precedence hierarchy:

| Location | Scope | Precedence |
|----------|-------|------------|
| `~/.codex/config.toml` | User-level | Lowest |
| `<project>/.codex/config.toml` | Project-local | Middle |
| Environment variables | Runtime | Highest |

Each profile is defined under `[profiles.PROFILE_NAME]` in TOML format.

---

## Directory Structure

```
~/.codex/
├── config.toml          # Main configuration file
├── instructions.md      # Global instructions
├── prompts/             # Custom prompts directory
└── skills/              # Skills directory
    └── **/SKILL.md      # Individual skill files

<project>/
├── codex.md             # Project-specific documentation
└── .codex/
    └── config.toml      # Project-local configuration
```

---

## Custom Prompts

Custom prompts are stored in the `prompts/` directory.

---

## Instructions and Project Documents

- **Global Instructions**: `~/.codex/instructions.md`
- **Project Docs**: `codex.md` in project root
- **Config Files**: `~/.codex/config.yaml` (or `.yml`/`.json`)

Project docs are discovered and loaded via `loadProjectDoc`, which finds and reads `codex.md` in the project directory.

---

## Skills Directory

Skills are reusable instruction bundles that Codex automatically discovers at startup.

### Skill Structure

| Property | Description |
|----------|-------------|
| Name | Skill identifier |
| Description | Brief summary |
| Instructions | Detailed skill content |
| Path | Location on disk |

### Discovery Rules

- Skills stored in `~/.codex/skills/**/SKILL.md`
- **Only files named exactly `SKILL.md` are recognized**
- Codex injects only metadata (name, description, path) into context
- Skills are automatically loaded when Codex starts

---

## MCP Server Configuration

Codex introduced MCP server support in September 2025 with a configuration model that differs significantly from other AI development tools.

- Configuration file: `~/.codex/config.toml`
- Unlike Claude Code's project-specific JSON configurations, Codex CLI and the VSCode extension share a single `~/.codex/config.toml` file
- Uses TOML format (not JSON)

---

## Sandbox and Security

### Default Policy: `read-only`

Commands can read any file on disk, but attempts to write a file or access the network will be blocked.

### Relaxed Policy: `workspace-write`

The current working directory for the Codex task will be writable.

### Security Measures

On macOS (and soon Linux), all writable roots that contain a `.git/` or `.codex/` folder as an immediate child will configure those folders to be read-only.

---

## Output Directory for CC-DevFlow

For RM-008 Adapter Compiler, target Codex output structure:

```
.codex/
├── prompts/                  # Compiled command prompts
│   ├── flow-init.md
│   ├── flow-prd.md
│   └── ...
├── skills/                   # Compiled skills
│   └── cc-devflow/
│       └── SKILL.md
├── scripts/                  # Copied utility scripts
│   ├── common.sh
│   └── ...
├── docs/                     # Copied documentation
└── config.toml               # Optional project config
```

---

## Key Differences from Claude Code

| Feature | Claude Code | Codex CLI |
|---------|-------------|-----------|
| Config Format | JSON | TOML |
| Config Location | `.claude/settings.json` | `~/.codex/config.toml` |
| Skills Discovery | `skill-rules.json` | `**/SKILL.md` naming |
| Project Context | `CLAUDE.md` | `codex.md` |
| Instructions | Inline in commands | `instructions.md` |
