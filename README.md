# 🚀 cc-devflow

> One-command requirement development flow for Claude Code

A comprehensive development workflow system built on Claude Code's official sub-agents, hooks, and settings mechanisms. Transform your requirements from planning to code delivery with a single command.

[中文文档](./README.zh-CN.md) | [English](./README.md)

## ✨ Features

- **🎯 One-Command Flow**: Start complete requirement development with `/flow:new "REQ-123|Feature Title|Plan URLs"`
- **📋 Document-Driven**: Automatic PRD → EPIC → TASKS → Implementation chain
- **🔄 Smart Recovery**: Resume interrupted development with `/flow:restart` and monitor progress with `/flow:status`
- **🛡️ Quality Gates**: Automated TypeScript checking, testing, linting, and security scanning
- **🤖 Sub-Agent Orchestration**: 7 specialized agents for different development phases
- **🔗 GitHub Integration**: Automated PR creation, branch management, and conventional commits
- **📊 Progress Tracking**: Real-time status monitoring and intelligent restart points
- **🌐 MCP Integration**: Seamless external content fetching and API integration
- **⚡ Auto Progress Updates**: Intelligent progress detection based on code changes and Git commits

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
   /flow:new "REQ-123|User Order Support|https://docs.example.com/orders-spec"
   ```

2. **Check development progress:**
   ```bash
   /flow:status                 # All requirements
   /flow:status REQ-123        # Specific requirement
   /flow:status --detailed REQ-123  # Detailed report
   ```

3. **Resume interrupted development:**
   ```bash
   /flow:restart "REQ-123"                    # Auto-detect restart point
   /flow:restart "REQ-123" --from=development # Restart from specific stage
   ```

## 🏗️ Architecture

### Sub-Agents Workflow
```sql
flow-orchestrator (Master Controller)
├── prd-writer          → Generate Product Requirements Document
├── planner             → Create Epic and Task breakdown
├── dev-implementer     → Code implementation
├── qa-tester           → Quality assurance and testing
├── security-reviewer   → Security scanning and fixes
└── release-manager     → PR creation and merge management
```

### Quality Gates
- **Pre-push Guard**: TypeScript, tests, linting, security, build validation
- **Markdown Formatter**: Automatic documentation formatting and language detection
- **Conventional Commits**: Standardized commit message format enforcement

### Document Structure
```text
.claude/docs/requirements/${REQ-ID}/
├── PRD.md                 # Product Requirements Document
├── EPIC.md               # Epic planning and breakdown
├── tasks/                # Individual task specifications
│   ├── TASK_001.md
│   ├── TASK_002.md
│   └── TASK_003.md
├── research/             # External research materials
├── TEST_REPORT.md        # QA testing results
└── EXECUTION_LOG.md      # Complete audit trail
```

## 📋 Command Reference

### Primary Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/flow:new` | Start new requirement development | `/flow:new "REQ-123\|Title\|URLs"` |
| `/flow:status` | Query development progress | `/flow:status [REQ-ID] [--detailed]` |
| `/flow:restart` | Resume interrupted development | `/flow:restart "REQ-ID" [--from=STAGE]` |

### Status Query Options
```bash
/flow:status                    # Overview of all requirements
/flow:status REQ-123           # Specific requirement status
/flow:status --all             # Include completed requirements
/flow:status --branches        # Git branch status only
/flow:status --detailed REQ-123 # Comprehensive status report
```

### Restart Options
```bash
/flow:restart "REQ-123"                    # Auto-detect restart point
/flow:restart "REQ-123" --from=prd         # Restart from PRD stage
/flow:restart "REQ-123" --from=development # Restart from development
/flow:restart "REQ-123" --force --backup   # Force restart with backup
```

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

## 🔍 Monitoring and Debugging

### Status Monitoring
```bash
# Real-time progress tracking
/flow:status --detailed REQ-123

# Git branch overview
/flow:status --branches

# JSON output for automation
/flow:status REQ-123 --json | jq '.progress'
```

### Debug Mode
```bash
# Enable verbose logging
export FLOW_DEBUG=1
/flow:new "REQ-123|Debug Test"

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
/flow:new "REQ-001|Test Feature|"
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
