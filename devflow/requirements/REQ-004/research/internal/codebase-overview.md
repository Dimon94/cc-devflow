# Codebase Overview for Agent Adapter Architecture (REQ-004)

## 1. Project Context
**Feature**: Agent 适配层架构 (RM-006)
**Type**: Architecture / Core Infrastructure
**Goal**: Design and implement a multi-platform Agent Adapter layer to support Codex CLI, Antigravity, Cursor, Qwen Code, etc.
**Current Architecture**: Plugin-based CLI Framework (Claude Code Extension).

## 2. Existing Modules Analysis

### 2.1 Agent Layer (`.claude/agents/`)
Currently, agents are defined as Markdown files containing prompts and instructions for Claude.
- **Count**: 18 agents (e.g., `prd-writer.md`, `tech-architect.md`, `planner.md`).
- **Mechanism**: These are likely loaded by the Claude Code environment or the `cc-devflow` slash commands directly.
- **Dependency**: Strongly tied to Claude Code's prompt format and capabilities.
- **Extension Point**: An adapter layer would need to abstract how these agent instructions are delivered to different underlying models or platforms.

### 2.2 Command Layer (`.claude/commands/`)
Commands are Markdown files defining slash commands.
- **Count**: 26 commands (e.g., `/flow-init`, `/flow-prd`).
- **Mechanism**: Executed by Claude Code.
- **Interaction**: Commands invoke agents or scripts.

### 2.3 Script Layer (`.claude/scripts/`)
Shell scripts for automation.
- **Location**: `.claude/scripts/`
- **Role**: Platform-agnostic execution (Bash), but currently the invocation is tied to Claude Code's ability to run shell commands.

## 3. Architecture Gaps & Opportunities
- **Coupling**: The current system is tightly coupled to Claude Code's slash command and agent system.
- **Abstraction Needed**: `AgentAdapter` interface (as proposed in Acceptance Criteria) to standardize:
  - `detect()`: Check current environment.
  - `executeCommand()`: Abstraction for running commands.
  - `getContext()` / `setContext()`: Managing state across different platforms.
- **Future Integration**: The `AgentAdapter` will be the bridge for M4 (Multi-Platform) deliverables.

## 4. Proposed New Components (from Requirements)
- `lib/adapters/adapter-interface.js`: Core interface definition.
- `lib/adapters/registry.js`: To manage and select adapters.
- `lib/adapters/claude-adapter.js`: Default implementation for current environment.
- `config/adapters.yml`: Configuration.

## 5. Potential Reuse
- **Common Scripts**: `common.sh` and other scripts should remain largely reusable if the adapter layer can invoke them correctly across platforms.
- **Markdown Definitions**: Agent and Command definitions might need a template engine (RM-007) to be compatible with other platforms, but the core content is reusable.
