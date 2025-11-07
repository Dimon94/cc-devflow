# Contributing to cc-devflow

Thank you for your interest in contributing to cc-devflow! This document provides guidelines and instructions for contributing to this project.

[中文版](./CONTRIBUTING.zh-CN.md) | [English](./CONTRIBUTING.md)

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Constitution Compliance](#constitution-compliance)
- [Quality Gates](#quality-gates)
- [Documentation Guidelines](#documentation-guidelines)

---

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Constructive**: Provide constructive feedback and criticism
- **Be Collaborative**: Work together to improve the project
- **Be Patient**: Understand that everyone is learning and growing
- **Be Professional**: Maintain professionalism in all interactions

---

## How Can I Contribute?

### 🐛 Reporting Bugs

Before submitting a bug report:
1. **Check existing issues** to avoid duplicates
2. **Use the latest version** to ensure the bug still exists
3. **Provide detailed information**:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment details (OS, Node version, Claude Code version)
   - Screenshots or error logs

**Submit via**: [GitHub Issues](https://github.com/Dimon94/cc-devflow/issues)

### ✨ Suggesting Features

Before submitting a feature request:
1. **Check existing issues** and discussions
2. **Clearly describe the feature**:
   - Use case and motivation
   - Proposed implementation (if any)
   - Impact on existing functionality
   - Alternative solutions considered

### 📝 Improving Documentation

Documentation improvements are always welcome:
- Fix typos or clarify confusing sections
- Add missing examples or use cases
- Improve command documentation
- Translate documentation to other languages

### 💻 Contributing Code

See [Pull Request Process](#pull-request-process) below.

---

## Development Setup

### Prerequisites

- [Claude Code](https://claude.ai/code) installed and configured
- Git (version 2.0+)
- Node.js (version 16+) - Optional, for additional quality checks
- Bash shell (for script testing)

### Installation

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/cc-devflow.git
   cd cc-devflow
   ```

3. **Create a test project**
   ```bash
   # Copy .claude to a test project
   mkdir ~/test-cc-devflow
   cp -r .claude ~/test-cc-devflow/
   cd ~/test-cc-devflow
   git init
   ```

4. **Verify installation**
   ```bash
   .claude/scripts/verify-setup.sh
   ```

5. **Run tests**
   ```bash
   # Run all tests
   bash .claude/tests/run-all-tests.sh --scripts

   # Run Constitution tests
   bash .claude/tests/constitution/run_all_constitution_tests.sh
   ```

---

## Project Structure

Understanding the project structure is essential for contributing:

```
cc-devflow/
├── .claude/                      # Claude Code configuration
│   ├── agents/                   # Sub-agent definitions
│   ├── commands/                 # Slash commands (flow-*)
│   ├── constitution/             # Constitution System v2.0.0
│   ├── docs/                     # Internal documentation
│   │   └── templates/            # Document templates (PRD, EPIC, TASKS)
│   ├── guides/                   # Workflow and technical guides
│   ├── hooks/                    # Hook scripts (PreToolUse, PostToolUse)
│   ├── rules/                    # Core patterns and conventions
│   ├── scripts/                  # Utility scripts (unified infrastructure)
│   ├── settings.json             # Claude Code settings
│   ├── skills/                   # Skills system
│   └── tests/                    # Test suites
│       ├── scripts/              # Script tests (100% coverage)
│       └── constitution/         # Constitution tests (38/38 passed)
├── docs/                         # External documentation (public)
│   ├── commands/                 # Detailed command docs
│   ├── guides/                   # User guides
│   ├── architecture/             # Architecture docs
│   └── examples/                 # Example workflows
├── devflow/                      # Generated workspace (gitignored)
│   ├── ROADMAP.md                # Product roadmap
│   ├── ARCHITECTURE.md           # System architecture
│   ├── BACKLOG.md                # Requirement backlog
│   └── requirements/             # Requirement workspaces
├── README.md                     # English README
├── README.zh-CN.md               # Chinese README
├── CHANGELOG.md                  # Version history
├── CONTRIBUTING.md               # This file (English)
└── CONTRIBUTING.zh-CN.md         # Chinese version
```

**Key Directories**:
- `.claude/agents/` - Add new specialized agents here
- `.claude/commands/` - Add new slash commands here
- `.claude/scripts/` - Add new utility scripts here
- `.claude/tests/` - Add test suites for new scripts
- `docs/` - Add user-facing documentation here

---

## Coding Standards

### General Principles

cc-devflow follows strict coding standards inspired by Linus Torvalds' philosophy:

1. **Good Taste**: Eliminate special cases instead of adding if/else branches
2. **Simplicity**: Keep functions short and focused (< 20 lines)
3. **Clarity**: Code should be self-documenting
4. **No Code Duplication**: Follow DRY principle
5. **SOLID Principles**: Maintain clean architecture

### Shell Script Standards

For `.claude/scripts/` and `.claude/hooks/`:

```bash
#!/usr/bin/env bash

# ================================================================
# Script Name: check-prerequisites.sh
# Description: Validate prerequisites before starting a flow
# Usage: bash check-prerequisites.sh [--json]
# ================================================================

set -euo pipefail  # Exit on error, undefined variables, and pipe failures

# -------------------- Configuration --------------------
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# -------------------- Functions --------------------
log_error() {
    echo "[ERROR] $*" >&2
}

log_info() {
    echo "[INFO] $*" >&2
}

# -------------------- Main Logic --------------------
main() {
    # Implementation here
}

main "$@"
```

**Requirements**:
- Use `set -euo pipefail` at the top
- Use `readonly` for constants
- Add clear section comments (ASCII art style)
- Support `--json` flag for machine-readable output
- Use `log_error`, `log_info` from `common.sh`
- Exit codes: 0 (success), 1 (error), 2 (validation failed)

### Markdown Standards

For `.claude/agents/`, `.claude/commands/`, and `docs/`:

```markdown
# Agent Name or Command Name

## 📋 Overview
Brief description of the agent or command.

## 🎯 Syntax
```bash
/command-name "PARAM-1|PARAM-2"
```

## 📖 Parameters
| Parameter | Description | Required | Example |
|-----------|-------------|----------|---------|
| PARAM-1   | ...         | ✅       | ...     |

## 🔄 Execution Flow
```text
Stage 1: ...
  ↓
Stage 2: ...
```

## 💡 Examples
[Detailed examples]

## 🔗 Related
- [Related Document 1]
- [Related Document 2]
```

---

## Commit Message Guidelines

cc-devflow follows [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `refactor`: Code refactoring (no feature change)
- `perf`: Performance improvement
- `style`: Code style changes (formatting, whitespace)
- `chore`: Maintenance tasks (build, CI, dependencies)

### Examples

```bash
# Feature addition
feat(flow-roadmap): add interactive product roadmap generation

Implemented 6-stage interactive dialogue for roadmap planning:
- Product Vision & Goals
- Target Users & Pain Points
- Core Feature Planning
- Technical Architecture
- Milestones & Timeline
- Success Metrics

Closes #123

# Bug fix
fix(flow-init): restore research task population in Stage 2.6

The `populate-research-tasks.sh` call was accidentally removed in
Stage 2.6, causing research decisions not to be integrated.

Restored the missing script call to maintain data contract consistency.

Fixes #456

# Documentation
docs(README): add Project-Level vs Requirement-Level command distinction

v2.1.0 introduced Project-Level commands (executed once per project)
vs Requirement-Level commands (executed once per requirement).

Updated command reference table to clearly separate these two categories.
```

### Rules

- Use present tense ("add" not "added")
- Use imperative mood ("move" not "moves")
- First line should be ≤ 72 characters
- Body should explain "what" and "why", not "how"
- Reference issues with `Closes #123` or `Fixes #456`

---

## Testing Requirements

### Test Coverage Requirements

cc-devflow maintains **100% test coverage** for all scripts:

- **Script Tests**: All `.claude/scripts/*.sh` must have tests in `.claude/tests/scripts/`
- **Constitution Tests**: All Constitution changes must pass 38/38 tests
- **Integration Tests**: New commands must have integration tests

### Running Tests

```bash
# Run all script tests
bash .claude/tests/run-all-tests.sh --scripts

# Run specific test suite
bash .claude/tests/scripts/test_check_prerequisites.sh

# Run Constitution tests
bash .claude/tests/constitution/run_all_constitution_tests.sh

# Run with verbose output
VERBOSE=true bash .claude/tests/run-all-tests.sh --scripts
```

### Writing Tests

Example test structure:

```bash
#!/usr/bin/env bash

# Test suite for check-prerequisites.sh

# Setup
setup() {
    # Create temp directory
    export TEST_TMP_DIR=$(mktemp -d)

    # Mock functions
    mock_git "rev-parse --show-toplevel" "$TEST_TMP_DIR"
}

# Teardown
teardown() {
    rm -rf "$TEST_TMP_DIR"
}

# Test: Success case
test_check_prerequisites_success() {
    # Setup
    setup

    # Execute
    bash check-prerequisites.sh > /dev/null
    local exit_code=$?

    # Assert
    assert_equals "0" "$exit_code"

    # Teardown
    teardown
}

# Run tests
test_check_prerequisites_success
```

**Test Requirements**:
- Use `assert_equals`, `assert_contains`, `assert_json_field`
- Mock external dependencies (git, network)
- Use temp directories for file operations
- Clean up resources in teardown
- Test both success and failure cases

---

## Pull Request Process

### Before Submitting

1. **Update your fork**
   ```bash
   git remote add upstream https://github.com/Dimon94/cc-devflow.git
   git fetch upstream
   git rebase upstream/main
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow [Coding Standards](#coding-standards)
   - Add tests for new functionality
   - Update documentation

4. **Run quality checks**
   ```bash
   # Run all tests
   bash .claude/tests/run-all-tests.sh --scripts

   # Run Constitution compliance check
   bash .claude/scripts/validate-constitution.sh

   # Check Hooks configuration
   bash .claude/scripts/validate-hooks.sh
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(scope): your commit message"
   ```

### Submitting PR

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request on GitHub**
   - Use a clear, descriptive title
   - Reference related issues with `Closes #123`
   - Describe your changes in detail
   - Add screenshots/demos if applicable

3. **PR Description Template**
   ```markdown
   ## Description
   Brief description of your changes.

   ## Motivation
   Why is this change needed?

   ## Changes
   - Change 1
   - Change 2
   - Change 3

   ## Testing
   How did you test your changes?

   ## Checklist
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] Constitution compliance verified
   - [ ] All tests passing
   - [ ] Commit messages follow conventions
   ```

### PR Review Process

1. **Automated Checks**
   - All tests must pass
   - Constitution compliance check must pass
   - No merge conflicts

2. **Code Review**
   - At least one maintainer approval required
   - Address all review comments
   - Keep discussion constructive

3. **Merge**
   - Squash and merge (default)
   - Maintainer will merge after approval

---

## Constitution Compliance

cc-devflow is governed by **Constitution v2.0.0** with 10 Articles:

1. **Article I**: Quality First
2. **Article II**: Security First
3. **Article III**: No Hardcoded Secrets
4. **Article IV**: Test-First Development
5. **Article V**: Deployment-First Integration
6. **Article VI**: Test Coverage Mandate (>80%)
7. **Article VII**: No Code Duplication
8. **Article VIII**: Fail Fast
9. **Article IX**: Clear Error Messages
10. **Article X**: Requirement Boundary

### Phase -1 Constitutional Gates

Before implementation, all changes must pass:
- **Simplicity Gate**: Avoid unnecessary complexity
- **Anti-Abstraction Gate**: Avoid premature abstraction
- **Integration-First Gate**: Design for integration first

### Compliance Verification

```bash
# Verify Constitution compliance
bash .claude/scripts/validate-constitution.sh

# View specific article
bash .claude/scripts/manage-constitution.sh show --article I

# Check Constitution version consistency
bash .claude/tests/constitution/test_version_consistency.sh
```

**All contributions must comply with the Constitution**. Non-compliant changes will be rejected.

---

## Quality Gates

All code changes must pass quality gates:

### Pre-push Guard

```bash
# Automatically runs on git push
.claude/hooks/pre-push-guard.sh
```

Checks:
- ✅ TypeScript type checking
- ✅ Test execution and coverage (>80%)
- ✅ Linting (ESLint/Prettier)
- ✅ Security scan
- ✅ Build validation

### TDD Enforcement

All implementation tasks must have tests written first:

```markdown
# TASKS.md (Correct TDD Order)
- [ ] T001: Write test for user authentication
- [ ] T002: Implement user authentication
```

**TEST VERIFICATION CHECKPOINT** must pass before implementation.

### Guardrail Hooks

- **PreToolUse Hook**: Blocks non-compliant operations (e.g., TDD violations)
- **PostToolUse Hook**: Auto-records file changes to EXECUTION_LOG.md

---

## Documentation Guidelines

### When to Add Documentation

- **New Commands**: Add detailed doc to `docs/commands/{command-name}.md`
- **New Agents**: Add doc to `.claude/agents/{agent-name}.md`
- **New Scripts**: Add usage comments in script header
- **Architecture Changes**: Update `docs/architecture/`
- **Breaking Changes**: Update CHANGELOG.md and README

### Documentation Structure

Follow these templates:

**Command Documentation** (`docs/commands/{command}.md`):
- 📋 Overview
- 🎯 Syntax
- 📖 Parameters
- 🎬 Use Cases
- 🔄 Execution Flow
- 💡 Examples
- 📂 Output
- 🔗 Related Commands

**Agent Documentation** (`.claude/agents/{agent}.md`):
- Description and purpose
- Tool access (Read, Grep, Glob only)
- Input/Output specifications
- Execution Flow
- Template usage (if applicable)

### Bilingual Documentation

- **README**: Both `README.md` and `README.zh-CN.md` must be updated
- **CONTRIBUTING**: Both `CONTRIBUTING.md` and `CONTRIBUTING.zh-CN.md`
- **Command docs**: English preferred, Chinese translation appreciated

---

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/Dimon94/cc-devflow/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Dimon94/cc-devflow/discussions)
- **Documentation**: Check `.claude/docs/` for internal guides

---

## License

By contributing to cc-devflow, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

---

## Acknowledgments

Thank you for contributing to cc-devflow! Your efforts help make this project better for everyone.

**Remember**:
- Code quality > Code quantity
- Simplicity > Complexity
- Tests > Trust
- Documentation > Assumptions

**"Good code is code that doesn't need exceptions."** - Linus Torvalds

---

🌟 **Star this repository if cc-devflow helps streamline your development workflow!**
