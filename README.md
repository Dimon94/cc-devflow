# 🚀 cc-devflow

> One-command requirement development flow for Claude Code

A comprehensive development workflow system built on Claude Code's official sub-agents, hooks, and settings mechanisms. Transform your requirements from planning to code delivery with a single command.

[中文文档](./README.zh-CN.md) | [English](./README.md)

## ✨ Features

- **🎯 One-Command Flow**: Start complete requirement development with `/flow-new "REQ-123|Feature Title|Plan URLs"`
- **🔄 Staged Commands**: 6 independent stage commands (init/prd/epic/dev/qa/release) for fine-grained control
- **📋 Document-Driven**: Automatic PRD → EPIC → TASKS → Implementation chain
- **📝 Template-Driven**: Self-executable templates (PRD_TEMPLATE, EPIC_TEMPLATE, TASKS_TEMPLATE) with built-in execution flows
- **🔄 Smart Recovery**: Resume interrupted development with `/flow-restart` and monitor progress with `/flow-status`
- **🛡️ Quality Gates**: Automated TypeScript checking, testing, linting, and security scanning
- **🤖 Sub-Agent Orchestration**: 10 specialized research agents for different development phases
- **🔗 GitHub Integration**: Automated PR creation, branch management, and conventional commits
- **📊 Progress Tracking**: Real-time status monitoring and intelligent restart points
- **🌐 MCP Integration**: Seamless external content fetching and API integration
- **⚡ Auto Progress Updates**: Intelligent progress detection based on code changes and Git commits
- **🔍 Consistency Verification**: Enterprise-grade consistency checking with intelligent conflict detection and auto-fix suggestions
- **🧪 TDD Enforced**: Strict Test-Driven Development with TEST VERIFICATION CHECKPOINT
- **📜 Constitution System v2.0.0**: 10 Articles governing quality, security, and architecture (100% test coverage)
  - **Phase -1 Constitutional Gates**: Pre-implementation gates preventing over-engineering
  - **Automated Compliance**: Constitution checks at every workflow stage
  - **Amendment Process**: Formal versioning and change management with auto-propagation
- **🛠️ Unified Script Infrastructure**: All agents and commands use standardized `.claude/scripts/` interface

## 🚀 Quick Start

### Prerequisites

- [Claude Code](https://claude.ai/code) installed and configured
- Git repository initialized
- Node.js project (optional, for additional quality checks)

### Installation

```bash
# Clone the .claude configuration to your project
npx tiged Dimon94/cc-devflow/.claude .claude

# Or manually download and extract
curl -L https://github.com/Dimon94/cc-devflow/archive/main.zip -o cc-devflow.zip
unzip cc-devflow.zip
cp -r cc-devflow-main/.claude .claude
rm -rf cc-devflow.zip cc-devflow-main
```

### Verify Installation

**Check if installation was successful:**
```bash
.claude/scripts/verify-setup.sh
```
This script will verify all required files and configurations.

### Quick Experience

**Run the interactive demo:**
```bash
python3 .claude/scripts/demo.py
```
This demo will guide you through the complete development flow, including automatic progress updates.

### Usage

1. **Start a new requirement flow:**
   ```bash
   /flow-new "REQ-123|User Order Support|https://docs.example.com/orders-spec"
   ```

2. **Check development progress:**
   ```bash
   /flow-status                 # All requirements
   /flow-status REQ-123        # Specific requirement
   /flow-status --detailed REQ-123  # Detailed report
   ```

3. **Resume interrupted development:**
   ```bash
   /flow-restart "REQ-123"                    # Auto-detect restart point
   /flow-restart "REQ-123" --from=development # Restart from specific stage
   ```

4. **Verify consistency across documents:**
   ```bash
   /flow-verify "REQ-123"                     # Comprehensive consistency check
   /flow-verify "REQ-123" --detailed          # Detailed analysis report
   /flow-verify "REQ-123" --fix-auto          # Auto-fix resolvable issues
   /flow-verify --all                         # Batch verify all requirements
   ```

## 🏗️ Architecture

### Execution Model (Updated 2025-01-10)

**Research Agents + Main Agent**:
- **Research Agents (10)**: Read-only analysis, generate Markdown plans and reports
- **Main Agent (Claude)**: Executes all code operations, owns complete context
- **Workflow**: Agents Research → Output Plans → Main Agent Executes → Iterate

**Tool Distribution**:
- **Research Agents**: Read, Grep, Glob only (analysis)
- **Main Agent**: Edit, Write, Bash, Git (execution)

### Sub-Agents Workflow
```sql
Workflow Guide (Standard Operating Procedures)
├── prd-writer          → Research requirements, generate PRD.md (MUST use PRD_TEMPLATE)
├── planner             → Analyze PRD, generate EPIC.md + TASKS.md (MUST use EPIC_TEMPLATE, TASKS_TEMPLATE)
├── dev-implementer     → Research codebase, generate IMPLEMENTATION_PLAN.md (research-only)
├── qa-tester           → Analyze code, generate TEST_PLAN.md + TEST_REPORT.md
├── security-reviewer   → Security analysis, generate SECURITY_PLAN.md + SECURITY_REPORT.md
├── release-manager     → Release analysis, generate RELEASE_PLAN.md
├── impact-analyzer     → PRD change impact analysis
├── compatibility-checker → Version compatibility analysis
├── consistency-checker → Enterprise-grade consistency verification
└── bug-analyzer        → BUG root cause analysis (JSON support)
```

### Unified Script Infrastructure (New)
All agents and commands use standardized scripts:

```text
.claude/scripts/
├── common.sh                    # Core functions (log_event, get_repo_root)
├── check-prerequisites.sh       # Prerequisites validation, path retrieval
├── setup-epic.sh                # Epic/Tasks structure initialization
├── check-task-status.sh         # Task status and progress tracking
├── mark-task-complete.sh        # Task completion marking
├── generate-status-report.sh    # Status report generation
├── validate-constitution.sh     # Constitution compliance checking
└── recover-workflow.sh          # Workflow recovery logic
```

**Benefits**:
- **Consistency**: All operations use same code paths
- **Testability**: Scripts have comprehensive test coverage (100% pass rate)
- **Maintainability**: Centralized logic, easier to update
- **JSON Support**: `--json` flag for programmatic parsing

### Template-Driven Development (New)

**Self-Executable Templates**: Each template contains its own Execution Flow

```text
.claude/docs/templates/
├── PRD_TEMPLATE.md              # Product Requirements (10-step execution flow)
├── EPIC_TEMPLATE.md             # Epic Planning (10-step execution flow)
├── TASKS_TEMPLATE.md            # Task Breakdown (TDD-ordered phases)
├── TASK_EXECUTABLE_TEMPLATE.md  # Task Execution (5-phase TDD flow)
└── BUG_TEMPLATE.md              # BUG Analysis and Fix
```

**Template Usage**:
1. Agent reads template
2. Follows Execution Flow steps
3. Generates complete document
4. No placeholders left unfilled
5. Passes Validation Checklist

### Quality Gates
- **Pre-push Guard**: TypeScript, tests, linting, security, build validation
- **Markdown Formatter**: Automatic documentation formatting and language detection
- **Conventional Commits**: Standardized commit message format enforcement
- **Consistency Verification**: Cross-document consistency checking and conflict detection
- **Constitution Compliance**: Enforced at every stage (NO PARTIAL IMPLEMENTATION, NO CODE DUPLICATION, etc.)
- **TDD Checkpoint**: TEST VERIFICATION CHECKPOINT before implementation

### Document Structure
```text
devflow/requirements/${REQ-ID}/
├── orchestration_status.json  # State management (stage, progress, timestamps)
├── EXECUTION_LOG.md           # Complete audit trail
├── PRD.md                     # Product Requirements Document (from PRD_TEMPLATE)
├── EPIC.md                    # Epic planning and breakdown (from EPIC_TEMPLATE)
├── TASKS.md                   # Single unified task list (from TASKS_TEMPLATE)
│                              # - All tasks in TDD order (Phase 1-5)
│                              # - Dependencies clearly marked
│                              # - [P] tags for parallel tasks
│                              # - TEST VERIFICATION CHECKPOINT included
├── tasks/                     # Task execution artifacts
│   ├── TASK_001.completed     # Empty marker file
│   ├── TASK_002.completed
│   └── IMPLEMENTATION_PLAN.md # dev-implementer's technical plan
├── research/                  # External research materials (MCP fetched)
├── TEST_PLAN.md               # QA testing strategy
├── TEST_REPORT.md             # QA testing results
├── SECURITY_PLAN.md           # Security review plan
└── SECURITY_REPORT.md         # Security scan results
```

**Key Changes**:
- **orchestration_status.json**: Unified state file (replaces scattered status files)
- **TASKS.md**: Single file for all tasks (replaces multiple TASK_*.md)
- **tasks/*.completed**: Simple completion markers (replaces complex task state)
- **IMPLEMENTATION_PLAN.md**: Technical plan from dev-implementer agent

## 📋 Command Reference

### Primary Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/flow-new` | Start new requirement development | `/flow-new "REQ-123\|Title\|URLs"` |
| `/flow-status` | Query development progress | `/flow-status [REQ-ID] [--detailed]` |
| `/flow-restart` | Resume interrupted development | `/flow-restart "REQ-ID" [--from=STAGE]` |
| `/flow-verify` | Verify consistency across documents | `/flow-verify "REQ-ID" [--detailed] [--fix-auto]` |
| `/flow-constitution` | Manage Constitution compliance | `/flow-constitution [--verify] [--article ARTICLE]` |

### Status Query Options
```bash
/flow-status                    # Overview of all requirements
/flow-status REQ-123           # Specific requirement status
/flow-status --all             # Include completed requirements
/flow-status --branches        # Git branch status only
/flow-status --detailed REQ-123 # Comprehensive status report
```

### Restart Options
```bash
/flow-restart "REQ-123"                    # Auto-detect restart point
/flow-restart "REQ-123" --from=prd         # Restart from PRD stage
/flow-restart "REQ-123" --from=development # Restart from development
/flow-restart "REQ-123" --force --backup   # Force restart with backup
```

### Constitution Management
```bash
/flow-constitution                         # Show Constitution overview
/flow-constitution --verify                # Verify consistency across all files
/flow-constitution --article I             # Show specific Article details
/flow-constitution --amend --proposal FILE # Propose Constitution amendment
/flow-constitution --apply --version PATCH # Apply and propagate changes
```

**Constitution v2.0.0 Features**:
- **10 Articles**: From Quality First to Requirement Boundary
- **Phase -1 Gates**: Simplicity, Anti-Abstraction, Integration-First
- **Auto-propagation**: Changes sync to all templates, agents, and docs
- **Test Coverage**: 100% (38/38 tests passed)

## ⚙️ Configuration

### Settings (.claude/settings.json)
```json
{
  "permissions": {
    "allowGitOperations": true,
    "allowNetworkRequests": true,
    "allowSubprocesses": true
  },
  "hooks": {
    "pre-push": ".claude/hooks/pre-push-guard.sh",
    "post-tool-use": ".claude/hooks/markdown_formatter.py"
  },
  "mcpServers": {
    "web-scraper": {
      "command": "npx",
      "args": ["-y", "@anthropic/web-scraper-mcp@latest"]
    }
  }
}
```

### Environment Variables
```bash
# Flow behavior
export FLOW_AUTO_APPROVE=false          # Require manual approval at quality gates
export FLOW_SKIP_BACKGROUND=false       # Start background dev/test processes
export DEFAULT_BASE_BRANCH=main         # Default base branch for PRs

# Quality gates
export MIN_TEST_COVERAGE=80             # Minimum test coverage threshold
export STRICT_TYPE_CHECKING=true       # Enforce strict TypeScript checking

# MCP integration
export WEBFETCH_TIMEOUT=30              # Network request timeout
export ALLOWED_DOMAINS=""               # Comma-separated allowed domains
```

## 🔧 Customization

### Adding Custom Sub-Agents
Create new agents in `.claude/agents/`:

```markdown
---
name: custom-agent
description: Your custom development phase agent
tools: Task, Read, Write, Edit
---

Your agent implementation here...
```

### Custom Quality Gates
Extend `.claude/hooks/pre-push-guard.sh`:

```bash
# Add your custom checks
if command -v your-custom-tool >/dev/null 2>&1; then
    echo "🔍 Running custom checks..."
    if ! your-custom-tool --validate; then
        add_error "Custom validation failed"
    fi
fi
```

### Document Templates
Customize templates in `.claude/docs/templates/`:
- `PRD_TEMPLATE.md` - Product Requirements Document structure
- `EPIC_TEMPLATE.md` - Epic planning format
- `TASK_TEMPLATE.md` - Individual task specification

## 🏛️ Rules System

cc-devflow follows a comprehensive rules system ensuring consistency and quality:

- **Standard Patterns**: Fail Fast, Clear Errors, Minimal Output, Trust System
- **Agent Coordination**: Inter-agent communication protocols and file locking
- **Branch Operations**: Git workflow management and conventional commits
- **GitHub Operations**: Repository protection and automated PR handling
- **Test Execution**: Quality assurance standards and coverage requirements
- **DateTime Handling**: Cross-platform time operations and ISO 8601 compliance
- **DevFlow Patterns**: cc-devflow specific conventions and error handling
- **MCP Integration**: External content fetching and security validation

## 🧪 Testing Framework

cc-devflow includes a comprehensive testing framework with **100% test coverage** across all critical scripts and Constitution compliance.

### Script Test Suites (8/8 Passed - 100%)

| Test Suite | Test Cases | Coverage | Status |
|------------|------------|----------|--------|
| `test_check_prerequisites` | 18 | Prerequisite validation | ✅ 100% |
| `test_check_task_status` | 18 | Task status tracking | ✅ 100% |
| `test_common` | 15 | Common utilities | ✅ 100% |
| `test_generate_status_report` | - | Status reporting | ✅ 100% |
| `test_mark_task_complete` | 15 | Task completion | ✅ 100% |
| `test_recover_workflow` | - | Workflow recovery | ✅ 100% |
| `test_setup_epic` | 13 | Epic initialization | ✅ 100% |
| `test_validate_constitution` | 4 | Constitution checks | ✅ 100% |

### Constitution Test Suites (4/4 Passed - 100%) 🎉

| Test Suite | Test Cases | Focus Area | Status |
|------------|------------|------------|--------|
| `test_version_consistency` | 5 | Constitution v2.0.0 alignment across files | ✅ 100% |
| `test_article_coverage` | 10 | All 10 Articles have enforcement points | ✅ 100% |
| `test_template_completeness` | 10 | Templates contain required Constitution sections | ✅ 100% |
| `test_agent_assignment` | 13 | Agents enforce assigned Articles correctly | ✅ 100% |

**Total Constitution Coverage**: 38/38 tests passed ✅

### Running Tests

```bash
# Run all script test suites
bash .claude/tests/run-all-tests.sh --scripts

# Run Constitution test suites
bash .claude/tests/constitution/run_all_constitution_tests.sh

# Run specific test suite
bash .claude/tests/scripts/test_check_prerequisites.sh
bash .claude/tests/constitution/test_version_consistency.sh

# Run with verbose output
VERBOSE=true bash .claude/tests/run-all-tests.sh --scripts
```

### Test Framework Features

- **Isolated Test Environment**: Each test runs in a clean temporary directory
- **Mock System**: Full Git mocking and function stubbing support
- **Exit Code Capture**: Reliable exit code testing via temp file pattern
- **Assertion Library**: Rich set of assertions (equals, contains, JSON validation, etc.)
- **Auto Cleanup**: Automatic teardown of test resources
- **Colored Output**: Clear visual feedback for test results

### Key Testing Patterns

**Exit Code Capture Pattern**:
```bash
local output_file="$TEST_TMP_DIR/output.txt"
local exit_code_file="$TEST_TMP_DIR/exitcode.txt"

(
    command_to_test > "$output_file" 2>&1
    echo $? > "$exit_code_file"
)

local output=$(cat "$output_file")
local exit_code=$(cat "$exit_code_file")
```

**Git Mocking**:
```bash
# Mock git command
mock_git "rev-parse --show-toplevel" "/fake/repo/path"

# Git commands now return mocked values
git rev-parse --show-toplevel  # Returns: /fake/repo/path
```

## 🔍 Monitoring and Debugging

### Status Monitoring
```bash
# Real-time progress tracking
/flow-status --detailed REQ-123

# Git branch overview
/flow-status --branches

# JSON output for automation
/flow-status REQ-123 --json | jq '.progress'
```

### Debug Mode
```bash
# Enable verbose logging
export FLOW_DEBUG=1
/flow-new "REQ-123|Debug Test"

# Check execution logs
tail -f .claude/logs/flow-*.log

# Validate system health
.claude/scripts/check-mcp-health.sh
```

## 📈 Performance

- **Parallel Processing**: Concurrent sub-agent execution where possible
- **Incremental Backups**: Only backup changed files during restart operations
- **Smart Caching**: WebFetch content caching with configurable TTL
- **Background Processes**: Optional `npm run dev` and `npm run test:watch` automation

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow our coding standards and run quality gates
4. Submit a pull request with detailed description

### Development Setup
```bash
# Clone the repository
git clone https://github.com/Dimon94/cc-devflow.git
cd cc-devflow

# Copy to your test project
cp -r .claude /path/to/your/test/project/

# Test the installation
cd /path/to/your/test/project
/flow-new "REQ-001|Test Feature|"
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on [Claude Code](https://claude.ai/code) official architecture
- Inspired by modern DevOps and CI/CD best practices
- Thanks to the Claude AI team for the powerful development platform

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Dimon94/cc-devflow/issues)
- **Documentation**: Check `.claude/docs/` for detailed specifications
- **Community**: Share your experience and get help from other users

---

**🌟 Star this repository if cc-devflow helps streamline your development workflow!**
