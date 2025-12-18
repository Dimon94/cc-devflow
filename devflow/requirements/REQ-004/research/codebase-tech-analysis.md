# Codebase Technical Analysis: Agent Adapter Architecture

## 1. Data Model Patterns
The project primarily uses **File-Based Configurations** rather than a relational database.
- **Config Files**: JSON and YAML files in `.claude/` and project root.
- **State Management**: `orchestration_status.json` tracks workflow state.
- **Schemas**: No explicit ORM found; likely using implicit JSON structures or simple Zod validation.

## 2. API Patterns
- **Slash Commands**: Defined in `.claude/commands/*.md`.
- **Scripts**: Shell scripts in `.claude/scripts/*.sh`.
- **Internal Libs**: Structure implies `lib/` directory usage for core logic.

## 3. Security Patterns
- **Permissions**: Currently relies on the user's local shell permissions.
- **Secrets**: Environment variables expected for sensitive data.
- **Audit**: `EXECUTION_LOG.md` serves as a high-level audit trail.

## 4. Reusable Components
- **Scripts**: `check-prerequisites.sh`, `common.sh`.
- **Agents**: Markdown-based agent definitions.

## 5. Technology Stack Inferred
- **Runtime**: Node.js (implied by `.js` scripts and `package.json` mentions).
- **CLI Framework**: Likely custom or interacting via Claude Code's embedded environment.

## 6. Reference Implementation (spec-kit)
Analyzed `spec-kit/src/specify_cli/__init__.py`:
- **Registry Pattern**: Uses a static `AGENT_CONFIG` dictionary mapping agent names (claude, codex, etc.) to specific metadata (folder, install_url, requires_cli).
- **Environment Detection**: Uses `check_tool` function to verify CLI availability (e.g. `shutil.which`).
- **Directory Isolation**: Enforces specific folders for each agent (`.claude/`, `.codex/`).

**Recommendation**: Adapt `AGENT_CONFIG` structure for `AdapterRegistry` to support the same multi-agent directory convention.
