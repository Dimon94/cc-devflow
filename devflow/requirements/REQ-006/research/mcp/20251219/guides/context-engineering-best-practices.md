# Multi-Platform CLI Context Engineering Best Practices

**Source**: [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices), [Context Engineering Blog](https://contextengineering.ai/blog/tool-review-best-context-engineering-platforms-2025/), [Kubiya Blog](https://www.kubiya.ai/blog/context-engineering-best-practices)
**Fetched**: 2025-12-19

---

## Key Principles

### 1. Language Selection for Cross-Platform Distribution

**Recommended Languages**: Golang and Rust

> Executables built by Golang are statically linked by default, meaning users don't have to install any dependencies, and you don't need to distribute dynamic libraries with your application. For a small command line application, the only thing you need to distribute is the executable.

**Platform-Specific Notes**:
- Apple does not support statically linked binaries on Mac OS X
- For distributing linked dynamic libraries, you need to pre-build all linked libraries for every target OS

### 2. Easy Installation

> To ensure widespread adoption of your CLI tool, it must be easily installable. No one wants to install 80 node modules or set up a Python virtualenv just to use your tool.

**Options**:
- Docker image with single docker call
- Language package manager (pip, npm, etc.)
- Pre-compiled binaries

---

## Context Engineering Best Practices (2025)

### Modular Context Structure

> Structure the runtime state as modular objects with separate fields for messages, tool outputs, and metadata. At each step, expose only the relevant slices of this state to the agent, minimizing context size and helping the agent stay focused on immediate needs.

### Using CLAUDE.md for Context Generation

> CLAUDE.md is a special file that Claude automatically pulls into context when starting a conversation. This makes it an ideal place for documenting repository etiquette (e.g., branch naming, merge vs. rebase) and developer environment setup.

**Recommendation**: Keep them concise and human-readable.

### MCP (Model Context Protocol)

> Model Context Protocol (MCP) is a structured way of passing additional context into language models. It defines what the model should know at runtime — beyond just the user's prompt.

**Use Cases**:
- Tool orchestration
- Discovering and using custom, third-party, and Google-made tools
- Enabling orchestration of workflows across business applications

---

## AI-Powered CLI Tools Comparison (2025)

| Tool | Strengths |
|------|-----------|
| Qodo | AI code assistant with CLI + IDE plugins, great for incident response and IaC fixes |
| GitHub Copilot CLI | Terminal-focused commands for code explanation and command generation |
| AWS CLI with Q | AI-assisted AWS operations |
| Lazygit with AI | Interactive git management with AI hints |
| Claude Code | Intelligent code assistance directly in terminal |

---

## Implications for RM-008 Adapter Compiler

### 1. Single Source of Truth (SSOT)

The `.claude/` directory should remain the canonical source:
- Commands, agents, scripts, skills, hooks all live here
- Platform outputs are derived/compiled artifacts
- Artifacts can be deleted and regenerated

### 2. Progressive Disclosure

Instead of loading all context upfront:
- Generate a **Skills Registry** with metadata only
- Load full skill content on-demand via `load_skill()` function
- Minimize token usage per interaction

### 3. Platform-Specific Context Files

| Platform | Context File | Purpose |
|----------|--------------|---------|
| Claude Code | `CLAUDE.md` | Project context, repository etiquette |
| Codex | `codex.md` | Project documentation |
| Cursor | `.cursorrules` / `.mdc` | AI behavior rules |
| Antigravity | `GEMINI.md` / `rules.md` | Agent rules |
| Qwen | TBD | Platform-specific context |

### 4. Incremental Updates

- Use manifest hash tracking to avoid unnecessary regeneration
- Only recompile changed source files
- Support `--check` mode for drift detection

### 5. User Installation Experience

For RM-008 deliverable:
- Provide `npm run adapt` for compilation
- Support `npx tiged` for quick installation
- Generate `.vscode/tasks.json` for IDE integration
- Document update process in README

---

## Research Summary

### Key Decisions for RM-008

1. **Output Format per Platform**:
   - Cursor: `.mdc` files in `.cursor/rules/` (new format)
   - Codex: `SKILL.md` files + `prompts/*.md`
   - Antigravity: `rules.md` + `workflows/*.md`
   - Qwen: TBD (likely TOML or YAML)

2. **Skills Distribution Strategy**:
   - Compile `skill-rules.json` → per-platform skill metadata
   - Inject skill list into platform context file
   - Provide `load_skill(name)` utility

3. **Hook Degradation**:
   - Cursor/Codex: No native hook support → inline as rules/instructions
   - Antigravity: Map to workflow triggers
   - All: Fallback to explicit script calls

4. **Versioning & Updates**:
   - Include version number in generated files
   - Manifest tracking for drift detection
   - User notification for available updates
