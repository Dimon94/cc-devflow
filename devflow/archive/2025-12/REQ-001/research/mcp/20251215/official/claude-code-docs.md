# Claude Code Official Documentation

**Source**: Context7 - /anthropics/claude-code
**Retrieved**: 2025-12-15
**Topic**: Slash Commands, Agents, Workflow

---

## Overview

Claude Code is an agentic terminal tool that integrates deeply with development workflows through customizable hooks, slash commands, and permission controls. It supports multiple AI providers (Anthropic, OpenAI, AWS Bedrock, Google Vertex), provides real-time file editing with automatic tracking, and includes built-in safeguards for code review and validation through specialized agents.

The tool uses a sophisticated permission system with sandbox mode on Linux/Mac that allows fine-grained control over file access, bash commands, and tool usage, making it suitable for professional development environments.

---

## Plugin System

### Commit Commands Plugin

**Purpose**: Automates common git operations, reducing context switching and manual command execution.

**Features**:
- Single slash command handles entire git workflow
- Reduces multiple git commands to one operation

---

### Agent SDK Development Plugin

**Command**: `/new-sdk-app`

**Capabilities**:
1. Interactive project setup with guided questions:
   - Language choice (TypeScript or Python)
   - Project name (if not provided)
   - Agent type (coding, business, custom)
   - Starting point (minimal, basic, or specific example)
   - Tooling preferences (npm/yarn/pnpm or pip/poetry)

2. Automated setup:
   - Checks for and installs latest SDK version
   - Creates all necessary project files and configuration
   - Sets up environment files (.env.example, .gitignore)
   - Provides working example tailored to use case
   - Runs type checking (TypeScript) or syntax validation (Python)
   - Automatically verifies setup using appropriate verifier agent

---

### Code Review Plugin

**Command**: `/code-review`

**Workflow**:
1. Checks if review is needed (skips closed, draft, trivial, or already-reviewed PRs)
2. Gathers relevant CLAUDE.md guideline files from repository
3. Summarizes pull request changes
4. Runs multiple specialized agents:
   - **Agents #1 & #2**: Audit for CLAUDE.md compliance
   - **Agent #3**: Scan for obvious bugs in changes
   - **Agent #4**: Analyze git blame/history for context-based issues
5. Scores each issue 0-100 for confidence level
6. Filters out issues below 80 confidence threshold
7. Posts review comment with high-confidence issues only

**Customization**:
Edit `commands/code-review.md` to add or modify agent tasks:
- Add security-focused agents
- Add performance analysis agents
- Add accessibility checking agents
- Add documentation quality checks

---

### PR Review Toolkit

**Recommended Workflow**:
1. Write code → **code-reviewer**
2. Fix issues → **silent-failure-hunter** (if error handling)
3. Add tests → **pr-test-analyzer**
4. Document → **comment-analyzer**
5. Review passes → **code-simplifier** (polish)
6. Create PR

**Enterprise Features**:
- 6 specialized agents for comprehensive code analysis
- Structured workflow phases
- Quality gates at each stage

---

### Feature Development Plugin

**Command**: `/feature-dev`

**Phase 2: Codebase Exploration**:
1. Launch specialized agents to explore codebase
2. Once agents return, read all identified files to build deep understanding
3. Present comprehensive summary of findings and patterns discovered

**Architecture**:
- 7-phase structured workflow
- Deep codebase understanding before implementation
- Pattern recognition and consistency enforcement

---

## Agent Verification System

### TypeScript Projects
**Agent**: `agent-sdk-verifier-ts`

**Validation Checks**:
- Agent initialization according to SDK docs
- Agent configuration follows SDK patterns (system prompts, models, etc.)
- SDK methods called correctly with proper parameters
- Proper handling of agent responses (streaming vs single mode)
- Permissions configured correctly if used
- MCP server integration validated if present

### Python Projects
**Agent**: `agent-sdk-verifier-py`

**Same validation focus as TypeScript verifier**

---

## Marketplace Offerings

### Enterprise-Grade Tools
1. **PR Review Toolkit**: 6 specialized agents for comprehensive code analysis
2. **Feature Development**: Structured 7-phase workflows
3. **Commit Commands**: Automated git operations
4. **Agent SDK Dev**: Project scaffolding and verification

---

## Integration Points

**Supported AI Providers**:
- Anthropic (Claude)
- OpenAI
- AWS Bedrock
- Google Vertex

**Permission System**:
- Sandbox mode (Linux/Mac)
- Fine-grained file access control
- Bash command restrictions
- Tool usage monitoring

**Customization**:
- Hooks (event-driven automation)
- Slash commands (custom workflows)
- CLAUDE.md guideline integration
- Agent specialization

---

## Key Design Patterns

1. **Multi-Agent Orchestration**: Main agent delegates to specialized sub-agents
2. **Quality Gates**: Confidence scoring and threshold filtering
3. **Guideline-Driven**: CLAUDE.md files provide project-specific standards
4. **Verification-First**: Automated setup validation before use
5. **Phase-Based Workflows**: Structured approach to complex tasks

---

**Relevance to /flow-clarify**:
- Multi-agent pattern for 11-dimension scanning
- Quality gates for confidence scoring
- Guideline integration for project-specific rules
- Verification system for output validation
- Phase-based workflow for clarification process
