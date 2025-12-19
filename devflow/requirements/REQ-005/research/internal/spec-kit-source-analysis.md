# spec-kit Source Code Analysis

## Overview
Analyzed the `spec-kit` source code to understand its multi-agent support and template generation mechanisms.

**Source Location**: `/Users/dimon/001Area/80-CodeWorld/002-devflow/cc-devflow/spec-kit`

## Key Architecture Components

### 1. Agent Configuration (`src/specify_cli/__init__.py`)
The `AGENT_CONFIG` dictionary acts as the single source of truth for supported agents.
- **Micro-Kernel Pattern**: The core CLI (`specify`) is agent-agnostic and relies on this config to know how to install and check for agents.
- **Key Properties**: `folder` (e.g., `.claude/`), `requires_cli` (boolean), `install_url`.

### 2. Build-Time Template Engine (`create-release-packages.sh`)
Unlike `cc-devflow`'s proposed runtime engine, `spec-kit` uses a **build-time** templating approach:
- **Input**: `templates/commands/*.md` (YAML frontmatter + Body with placeholders)
- **Placeholders**:
  - `{SCRIPT}`: Replaced by platform-specific script command (parsed from frontmatter).
  - `{ARGS}` / `$ARGUMENTS`: Replaced by agent-specific placeholders (e.g., `{{args}}` for TOML, `$ARGUMENTS` for MD).
  - `__AGENT__`: Replaced by agent name.
- **Output**: Generates separate ZIP bundles for each agent/platform combination (e.g., `spec-kit-template-claude-sh-v0.2.0.zip`).
- **Mechanism**: Use `sed` and `awk` in a Bash script to process files during release.

### 3. Command Protocol (`templates/commands/*.md`)
Commands are defined as Markdown files with structured protocols:
- **Frontmatter**: Metadata (`description`, `scripts` map).
- **Body**: Instructions for the AI agent, including when to run scripts and how to parse findings.
- **Interactive Loops**: The prompts instruct the Agent to run a script, read output, and interact with the user (e.g., "Sequential questioning loop").

## Insights for REQ-005 (Compile From `.claude/`)

1.  **Build-Time Determinism**:
    - `spec-kit` optimizes for "download a zip" by doing placeholder replacement at build time.
    - `cc-devflow` can adopt the same determinism but keep `.claude/` as SSOT by compiling in-repo instead of shipping per-platform zips.
    - **Adoption**: replicate `spec-kit`'s placeholder replacement via compile-time transforms on `.claude/commands`.

2.  **Agent Registry**:
    - `spec-kit`'s `AGENT_CONFIG` confirms our RM-006 `AgentAdapter` design is correct.
    - We should ensure our `AgentAdapter` class exposes similar properties (`folder`, `args_format`).

3.  **Command Structure**:
    - The structure of `templates/commands/clarify.md` is an excellent reference for our future prompts. It mixes "System Instructions" with "Runtime Context".

## Recommendation for Implementation
- **Template Source**: Use `.claude/commands/*.md` as the source of truth.
- **Compiler Rules**: Implement deterministic expansion:
  - `{SCRIPT:<alias>}` resolved from frontmatter `scripts`
  - `{AGENT_SCRIPT}` resolved from frontmatter `agent_scripts` (with `__AGENT__` substitution)
  - `$ARGUMENTS` token mapped per platform (`{{args}}` for TOML)
