# Getting Started with cc-devflow

[中文文档](./getting-started.zh-CN.md) | [English](./getting-started.md)

---

## 📋 Overview

This guide will help you get started with cc-devflow, from installation to your first requirement development.

## 🚀 Prerequisites

- [Claude Code](https://claude.ai/code) installed and configured
- Git repository initialized
- Node.js project (optional, for additional quality checks)

## 📦 Installation

### Quick Install

```bash
# Clone .claude configuration to your project
npx tiged Dimon94/cc-devflow/.claude .claude
```

### Manual Install

```bash
# Download and extract
curl -L https://github.com/Dimon94/cc-devflow/archive/main.zip -o cc-devflow.zip
unzip cc-devflow.zip
cp -r cc-devflow-main/.claude .claude
rm -rf cc-devflow.zip cc-devflow-main
```

## ✅ Verify Installation

Run the verification script:

```bash
.claude/scripts/verify-setup.sh
```

This script will check:
- All required files and directories exist
- Scripts have execute permissions
- Git repository is properly configured

## 🎯 Your First Requirement

### Step 1: Start Development Flow

```bash
/flow-new "REQ-001|User Authentication|https://docs.example.com/auth"
```

This will:
1. Initialize requirement structure
2. Generate PRD
3. Generate UI prototype (if needed)
4. Create technical design
5. Generate EPIC and TASKS
6. Execute development
7. Run QA tests
8. Prepare release

### Step 2: Check Progress

```bash
/flow-status REQ-001
```

### Step 3: Resume If Interrupted

```bash
/flow-restart "REQ-001"
```

## 🛠️ Core Scripts

### Environment Check
```bash
bash .claude/scripts/check-prerequisites.sh
```

### View Task Status
```bash
bash .claude/scripts/check-task-status.sh --verbose
```

### Mark Task Complete
```bash
bash .claude/scripts/mark-task-complete.sh T001
```

### Generate Status Report
```bash
bash .claude/scripts/generate-status-report.sh --format markdown
```

## 🧪 Running Tests

### Script Tests
```bash
# Run all tests
bash .claude/tests/run-all-tests.sh --scripts

# Run specific test
bash .claude/tests/scripts/test_check_prerequisites.sh
```

### Constitution Tests
```bash
bash .claude/tests/constitution/run_all_constitution_tests.sh
```

## 📊 Interactive Demo

Run the interactive demo to see the complete workflow:

```bash
python3 .claude/scripts/demo.py
```

## 🔧 Configuration

### Minimum Configuration

Edit `.claude/settings.json`:

```json
{
  "permissions": {
    "allowGitOperations": true,
    "allowNetworkRequests": true,
    "allowSubprocesses": true
  }
}
```

### Environment Variables

```bash
# Quality gates
export MIN_TEST_COVERAGE=80
export STRICT_TYPE_CHECKING=true

# Flow behavior
export FLOW_AUTO_APPROVE=false
```

## 📚 Next Steps

- [Command Reference](../commands/README.md) - Learn all available commands
- [Workflow Guide](./workflow-guide.md) - Understand the development workflow
- [Best Practices](./best-practices.md) - Follow recommended practices

## 🚨 Troubleshooting

### Issue: Scripts not executable

```bash
chmod +x .claude/scripts/*.sh
chmod +x .claude/hooks/*.sh
```

### Issue: Git not initialized

```bash
git init
git add .
git commit -m "Initial commit"
```

### Issue: Tests failing

```bash
# Check prerequisites
bash .claude/scripts/check-prerequisites.sh

# Run tests with verbose output
VERBOSE=true bash .claude/tests/run-all-tests.sh --scripts
```

## 💡 Tips

1. **Always check progress** with `/flow-status` before continuing work
2. **Use `/flow-verify`** to check document consistency
3. **Enable debug mode** if you encounter issues: `export FLOW_DEBUG=1`
4. **Read the Constitution** to understand quality standards

## 🆘 Getting Help

- [GitHub Issues](https://github.com/Dimon94/cc-devflow/issues)
- [Documentation](../../docs/)
- [Contributing Guide](../../CONTRIBUTING.md)

---

**Ready to start? Run your first command:**

```bash
/flow-new "REQ-001|My First Feature"
```
