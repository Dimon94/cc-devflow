# Quickstart: REQ-001 - /flow-clarify

**Version**: 1.0.0
**Created**: 2025-12-15
**Purpose**: 开发环境搭建、测试执行、验证步骤

---

## 1. Environment Setup

### 1.1 Prerequisites

| Dependency | Required Version | Check Command | Install Command |
|------------|------------------|---------------|-----------------|
| Bash | 4.0+ | `bash --version` | `brew install bash` (macOS) |
| jq | 1.6+ | `jq --version` | `brew install jq` |
| curl | 7.0+ | `curl --version` | (系统自带) |
| Claude API Key | N/A | `echo $CLAUDE_API_KEY` | 见下方配置 |

### 1.2 API Key Configuration

```bash
# 1. 获取 Claude API Key (https://console.anthropic.com/)

# 2. 添加到 shell profile
echo 'export CLAUDE_API_KEY="sk-ant-api03-..."' >> ~/.zshrc

# 3. 重新加载配置
source ~/.zshrc

# 4. 验证
echo $CLAUDE_API_KEY | head -c 15  # 应显示 "sk-ant-api03-"
```

### 1.3 Project Setup

```bash
# 1. 确保在项目根目录
cd /path/to/cc-devflow

# 2. 确认目录结构
ls .claude/scripts/   # 应包含 common.sh, check-prerequisites.sh
ls .claude/commands/  # 应包含 flow-*.md 文件
ls .claude/agents/    # 应包含 *-agent.md 文件

# 3. 确认已有需求目录
ls devflow/requirements/REQ-001/
# 应包含: research/, PRD.md, orchestration_status.json
```

---

## 2. Development Workflow

### 2.1 File Creation Order (TDD)

```bash
# Phase 1: Create test scaffolding first
touch .claude/scripts/test-clarify-scan.sh
chmod +x .claude/scripts/test-clarify-scan.sh

# Phase 2: Create production scripts
touch .claude/scripts/run-clarify-scan.sh
touch .claude/scripts/generate-clarification-questions.sh
touch .claude/scripts/generate-clarification-report.sh
chmod +x .claude/scripts/*.sh

# Phase 3: Create command and agent
touch .claude/commands/flow-clarify.md
touch .claude/agents/clarify-analyst.md

# Phase 4: Create clarifications directory
mkdir -p devflow/requirements/REQ-001/research/clarifications
```

### 2.2 Development Commands

```bash
# Run single dimension scan (for testing)
.claude/scripts/run-clarify-scan.sh REQ-001 --dimension 1 --timeout 30

# Run full parallel scan
.claude/scripts/run-clarify-scan.sh REQ-001 --parallel

# Generate questions from scan result
.claude/scripts/generate-clarification-questions.sh --input /tmp/scan_result.json --max 5

# Generate report from session
.claude/scripts/generate-clarification-report.sh --session research/clarifications/.session.json
```

---

## 3. Test Matrix

### 3.1 Unit Tests

| Test ID | Script | Test Case | Expected Result |
|---------|--------|-----------|-----------------|
| UT-001 | run-clarify-scan.sh | Valid REQ_ID | Exit code 0, JSON output |
| UT-002 | run-clarify-scan.sh | Invalid REQ_ID | Exit code 2, error message |
| UT-003 | run-clarify-scan.sh | Dimension timeout | Exit code 1, "timeout" status |
| UT-004 | generate-questions.sh | 15 issues → ≤5 questions | Max 5 questions output |
| UT-005 | generate-questions.sh | 0 issues | Exit code 1, "no issues" message |
| UT-006 | validate_answer() | Valid "A" | Return 0 |
| UT-007 | validate_answer() | Invalid "X" | Return 1 |
| UT-008 | validate_answer() | Short answer > 5 words | Return 1 |

### 3.2 Integration Tests

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| IT-001 | Happy Path | 1. Run scan 2. Answer 3 questions 3. Generate report | Report exists, no errors |
| IT-002 | No Ambiguities | 1. Clean research.md 2. Run scan | "No ambiguities" message |
| IT-003 | Session Recovery | 1. Answer Q1-Q2 2. Kill process 3. Resume | Q3 prompt (not Q1) |
| IT-004 | User Abort | 1. Start scan 2. Ctrl+C at Q3 | Q1-Q2 saved in .session.json |
| IT-005 | API Timeout | 1. Set timeout=1 2. Run scan | Graceful degradation, partial results |

### 3.3 Test Commands

```bash
# Run unit tests
.claude/scripts/test-clarify-scan.sh --unit

# Run integration tests
.claude/scripts/test-clarify-scan.sh --integration

# Run specific test
.claude/scripts/test-clarify-scan.sh --test UT-001

# Run with verbose output
.claude/scripts/test-clarify-scan.sh --verbose
```

---

## 4. Verification Checklist

### 4.1 Pre-Implementation Verification

```bash
# Check prerequisites script
.claude/scripts/check-prerequisites.sh REQ-001 --json

# Expected output:
# {
#   "REQ_ID": "REQ-001",
#   "REQ_DIR": "/path/to/devflow/requirements/REQ-001",
#   "PRD_FILE": "/path/to/devflow/requirements/REQ-001/PRD.md"
# }

# Check orchestration status
cat devflow/requirements/REQ-001/orchestration_status.json | jq '.phase0_complete'
# Expected: true
```

### 4.2 Post-Implementation Verification

```bash
# 1. Check all scripts exist
ls -la .claude/scripts/run-clarify-*.sh
ls -la .claude/scripts/generate-clarification-*.sh

# 2. Check all scripts are executable
file .claude/scripts/*.sh | grep "executable"

# 3. Check command exists
cat .claude/commands/flow-clarify.md | head -5

# 4. Check agent exists
cat .claude/agents/clarify-analyst.md | head -5

# 5. Run smoke test (dry run)
/flow-clarify REQ-001 --dry-run
```

### 4.3 Acceptance Criteria Verification

| AC ID | Story | Verification Command | Expected Output |
|-------|-------|---------------------|-----------------|
| S1-AC1 | Story 1 | `run-clarify-scan.sh REQ-001 | jq '.dimensions[9].name'` | "Misc & Placeholders" |
| S1-AC4 | Story 1 | `run-clarify-scan.sh REQ-001 --timeout 1 | jq '.dimensions[].status' | grep timeout` | At least 1 "timeout" |
| S2-AC1 | Story 2 | `generate-questions.sh --max 5 | jq '.questions | length'` | ≤5 |
| S3-AC1 | Story 3 | Manual test | Only Q1 shown first |
| S4-AC1 | Story 4 | `ls research/clarifications/` after Q1 answer | .session.json exists |

---

## 5. Performance Benchmarks

### 5.1 Benchmark Commands

```bash
# Scan performance (target: < 30s)
time .claude/scripts/run-clarify-scan.sh REQ-001 --parallel

# Report generation performance (target: < 5s)
time .claude/scripts/generate-clarification-report.sh --session .session.json

# Memory usage during scan
/usr/bin/time -l .claude/scripts/run-clarify-scan.sh REQ-001 2>&1 | grep "maximum resident"
```

### 5.2 Expected Benchmarks

| Metric | Target | Acceptable | Fail |
|--------|--------|------------|------|
| 11 维度并行扫描 | < 15s | < 30s | > 60s |
| 报告生成 | < 2s | < 5s | > 10s |
| 内存使用 | < 30MB | < 50MB | > 100MB |

---

## 6. Troubleshooting

### 6.1 Common Issues

| Issue | Symptom | Solution |
|-------|---------|----------|
| API Key missing | "CLAUDE_API_KEY not set" | Export key in shell profile |
| Bash version too old | Array syntax errors | `brew install bash`, update PATH |
| jq not found | "command not found: jq" | `brew install jq` |
| Permission denied | Cannot create files | `chmod +x` on scripts |
| Session corrupt | JSON parse error | Delete `.session.json`, restart |

### 6.2 Debug Mode

```bash
# Enable debug output
DEBUG=1 .claude/scripts/run-clarify-scan.sh REQ-001

# Check API response
curl -v -X POST https://api.anthropic.com/v1/messages \
  -H "Authorization: Bearer $CLAUDE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model": "claude-4-5-haiku", "max_tokens": 10, "messages": [{"role": "user", "content": "Hello"}]}'

# Check file permissions
ls -la devflow/requirements/REQ-001/research/clarifications/
```

### 6.3 Recovery Commands

```bash
# Recover from interrupted session
cat devflow/requirements/REQ-001/research/clarifications/.session.json | jq '.currentQuestionIndex'
# If > 0, session can be resumed

# Force restart (discard progress)
rm devflow/requirements/REQ-001/research/clarifications/.session.json
/flow-clarify REQ-001

# Restore research.md from backup
cp devflow/requirements/REQ-001/research/research.md.backup \
   devflow/requirements/REQ-001/research/research.md
```

---

## 7. CI/CD Integration (Future)

### 7.1 GitHub Actions Example (Reference Only)

```yaml
# .github/workflows/test-flow-clarify.yml (Future)
name: Test flow-clarify
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install jq
        run: sudo apt-get install -y jq
      - name: Run unit tests
        run: .claude/scripts/test-clarify-scan.sh --unit
        env:
          CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
```

---

## 8. Next Steps

After completing development:

1. **Run full test suite**: `.claude/scripts/test-clarify-scan.sh --all`
2. **Update orchestration skill**: Add /flow-clarify routing to `cc-devflow-orchestrator`
3. **Update /flow-prd Entry Gate**: Check `clarify_complete` in status (optional pass)
4. **Document in CLAUDE.md**: Update command list

---

**Quickstart Version**: 1.0.0
**Target Audience**: Developer implementing REQ-001
**Next Step**: Run `/flow-epic` to generate EPIC.md and TASKS.md
