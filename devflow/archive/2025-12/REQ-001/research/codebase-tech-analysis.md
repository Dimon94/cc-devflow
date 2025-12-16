# Codebase Technical Analysis: REQ-001 - /flow-clarify

**Date**: 2025-12-15
**Analyst**: Claude (tech-architect agent)
**Requirement**: /flow-clarify 需求澄清命令
**Phase**: 2 (Technical Design Preparation)

---

## 1. Executive Summary

基于 PRD（879 行）和 research（607 行）深度分析，本文档提供 /flow-clarify 技术实现的详细架构指导。核心结论：

- **架构模式**: Workflow + Orchestrator-Workers（非纯 Agent）
- **执行模型**: Bash 脚本主控 + LLM 并行扫描
- **数据流**: Markdown → JSON → Markdown（统一格式）
- **可复用组件**: common.sh (95%), generate-research-tasks.sh (70%)

---

## 2. Data Model Pattern Analysis

### 2.1 Core Entities

```
┌─────────────────────────────────────────────────────────────────┐
│                     /flow-clarify Data Model                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ClarificationSession                                           │
│  ├── sessionId: string (YYYYMMDD-HHMMSS-REQ-XXX)               │
│  ├── reqId: string (REQ-001)                                   │
│  ├── startedAt: datetime                                        │
│  ├── completedAt: datetime (nullable)                           │
│  ├── status: "scanning" | "questioning" | "complete" | "aborted"│
│  └── dimensions: DimensionScanResult[11]                        │
│                                                                 │
│  DimensionScanResult                                            │
│  ├── dimensionId: 1-11                                          │
│  ├── name: string (e.g., "Functional Scope")                   │
│  ├── status: "clear" | "ambiguous" | "timeout" | "skipped"     │
│  ├── issues: AmbiguityIssue[]                                   │
│  └── scanTimeMs: number                                         │
│                                                                 │
│  AmbiguityIssue                                                 │
│  ├── issueId: string (dim-X-issue-Y)                           │
│  ├── description: string                                        │
│  ├── impact: 1-10                                               │
│  ├── uncertainty: 1-10                                          │
│  ├── priority: impact × uncertainty                             │
│  └── sourceLineRef: string (research.md:L42)                   │
│                                                                 │
│  ClarificationQuestion                                          │
│  ├── questionId: string (Q1-Q5)                                │
│  ├── dimension: DimensionScanResult                             │
│  ├── text: string                                               │
│  ├── type: "multiple_choice" | "short_answer"                  │
│  ├── options: QuestionOption[] (if multiple_choice)            │
│  ├── recommendedOption: string (AI 推荐)                       │
│  ├── answer: string (nullable)                                  │
│  └── rationale: string (AI 生成理由)                           │
│                                                                 │
│  QuestionOption                                                 │
│  ├── optionId: "A" | "B" | "C" | "D" | "E"                    │
│  ├── text: string                                               │
│  └── description: string                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 State Machine (Clarification Status)

```
                     ┌─────────────┐
                     │   START     │
                     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐     scan_timeout
        ┌───────────│  scanning   │────────────────────┐
        │           └──────┬──────┘                    │
        │                  │                           │
        │   all_clear      │ issues_found             ▼
        │                  │                    ┌─────────────┐
        │                  │                    │   aborted   │
        ▼                  ▼                    └─────────────┘
 ┌─────────────┐    ┌─────────────┐                    ▲
 │  complete   │    │ questioning │────────────────────┤
 │  (no Q&A)   │    └──────┬──────┘     user_abort     │
 └─────────────┘           │                           │
                           │ all_answered              │
                           ▼                           │
                    ┌─────────────┐                    │
                    │  complete   │                    │
                    │ (with Q&A)  │                    │
                    └─────────────┘                    │
                           │                           │
                           │ save_failure              │
                           ▼                           │
                    ┌─────────────┐                    │
                    │   aborted   │◄───────────────────┘
                    └─────────────┘
```

### 2.3 File System Structure

```
devflow/requirements/REQ-XXX/
├── orchestration_status.json      # 新增字段: clarify_complete, clarify_session_id
├── EXECUTION_LOG.md               # 追加澄清记录
└── research/
    ├── research.md                # 输入源 (可被更新 if --auto-update)
    ├── research.md.backup         # 澄清前备份
    ├── tasks.json                 # 研究任务 (只读)
    └── clarifications/            # 新增目录 ✅
        ├── 20251215-143000-flow-clarify.md    # 澄清报告
        ├── 20251215-160000-flow-clarify.md    # 历史报告
        └── .session.json          # 会话状态 (用于断点恢复)
```

---

## 3. API Pattern Analysis

### 3.1 Internal API (Script → Script)

```bash
# ─────────────────────────────────────────────────────────────────
# run-clarify-scan.sh API
# ─────────────────────────────────────────────────────────────────
# Input: REQ_ID, research.md path
# Output: JSON (stdout) - DimensionScanResult[11]
# Exit codes: 0=success, 1=partial (some dimensions timeout), 2=fatal

run-clarify-scan.sh "${REQ_ID}" --parallel --timeout 20

# Output format:
{
  "sessionId": "20251215-143000-REQ-001",
  "scanDurationMs": 12340,
  "dimensions": [
    {
      "dimensionId": 1,
      "name": "Functional Scope",
      "status": "ambiguous",
      "issues": [
        {
          "issueId": "dim-1-issue-1",
          "description": "缺少用户权限边界定义",
          "impact": 8,
          "uncertainty": 7,
          "priority": 56,
          "sourceLineRef": "research.md:L42"
        }
      ],
      "scanTimeMs": 2340
    },
    // ... 10 more dimensions
  ]
}

# ─────────────────────────────────────────────────────────────────
# generate-clarification-questions.sh API
# ─────────────────────────────────────────────────────────────────
# Input: scan_result.json (from run-clarify-scan.sh)
# Output: JSON (stdout) - ClarificationQuestion[≤5]

generate-clarification-questions.sh --input scan_result.json --max 5

# Output format:
{
  "questions": [
    {
      "questionId": "Q1",
      "dimensionId": 1,
      "text": "用户权限应如何划分？",
      "type": "multiple_choice",
      "options": [
        {"optionId": "A", "text": "RBAC 角色模型", "description": "基于角色的访问控制"},
        {"optionId": "B", "text": "ABAC 属性模型", "description": "基于属性的访问控制"},
        {"optionId": "C", "text": "简单二元权限", "description": "admin/user 两级"}
      ],
      "recommendedOption": "A",
      "recommendedRationale": "RBAC 是企业级应用最常见模式，易于维护"
    }
  ]
}

# ─────────────────────────────────────────────────────────────────
# generate-clarification-report.sh API
# ─────────────────────────────────────────────────────────────────
# Input: session.json (完整会话数据)
# Output: Markdown file (clarifications/[timestamp].md)

generate-clarification-report.sh --session session.json --output clarifications/

# ─────────────────────────────────────────────────────────────────
# integrate-clarifications.sh API (P2 功能)
# ─────────────────────────────────────────────────────────────────
# Input: clarification_report.md, research.md
# Output: 更新后的 research.md
# Flags: --dry-run (预览不写入), --force (覆盖冲突)

integrate-clarifications.sh --report clarifications/20251215.md --target research.md
```

### 3.2 External API (LLM Calls)

```typescript
// ─────────────────────────────────────────────────────────────────
// 维度扫描 API (11 并行调用)
// ─────────────────────────────────────────────────────────────────
interface DimensionScanRequest {
  model: "claude-4-5-haiku";  // 成本优化
  max_tokens: 1000;
  system: `You are a requirements ambiguity scanner for dimension: ${dimensionName}.
           Analyze the research document and identify:
           1. Missing information
           2. Vague terminology (e.g., "fast", "robust" without metrics)
           3. Implicit assumptions
           4. Contradictions with other sections

           Output JSON: {issues: [{description, impact: 1-10, uncertainty: 1-10}]}`;
  messages: [
    { role: "user", content: researchMdContent }
  ];
}

// ─────────────────────────────────────────────────────────────────
// 问题生成 API (1 调用)
// ─────────────────────────────────────────────────────────────────
interface QuestionGenerationRequest {
  model: "claude-sonnet-4-5-20241022";  // 质量优先
  max_tokens: 2000;
  system: `You are a clarification question generator.
           Given scan results, generate ≤5 high-priority questions.

           Priority = Impact × Uncertainty

           For each question:
           - Provide AI-recommended answer based on industry best practices
           - Explain why this question is critical
           - Format as multiple-choice (2-5 options) or short-answer

           Output JSON: {questions: [...]}`;
  messages: [
    { role: "user", content: JSON.stringify(scanResults) }
  ];
}

// ─────────────────────────────────────────────────────────────────
// 答案理由生成 API (每问题 1 调用)
// ─────────────────────────────────────────────────────────────────
interface RationaleGenerationRequest {
  model: "claude-4-5-haiku";  // 成本优化
  max_tokens: 300;
  system: `Generate a brief rationale (2-3 sentences) for why the user
           selected this answer. Reference industry best practices.`;
  messages: [
    { role: "user", content: `Question: ${question}\nAnswer: ${userAnswer}` }
  ];
}
```

---

## 4. Authentication & Security Patterns

### 4.1 Current Authentication (CLI Local Execution)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   User → CLI Command → Local File System                        │
│            │                                                    │
│            │ No authentication required (local tool)            │
│            │                                                    │
│            ▼                                                    │
│   ┌─────────────────┐     Environment Variable                  │
│   │  Claude API     │◄────────────────────────────────────────  │
│   │  (External)     │     CLAUDE_API_KEY                        │
│   └─────────────────┘                                           │
│                                                                 │
│   Security Boundaries:                                          │
│   ├── File Access: devflow/ directory ONLY                      │
│   ├── Network: Claude API endpoints ONLY                        │
│   └── Input: Validated user answers (A-E, ≤5 words)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Input Validation Rules

```bash
# ─────────────────────────────────────────────────────────────────
# validate_answer() - common.sh
# ─────────────────────────────────────────────────────────────────
validate_answer() {
  local question_type="$1"  # "multiple_choice" | "short_answer"
  local answer="$2"
  local valid_options="$3"  # "A,B,C,D,E" for multiple_choice

  case "$question_type" in
    "multiple_choice")
      # Must be single character in valid_options
      if [[ ! "$answer" =~ ^[A-Ea-e]$ ]]; then
        return 1
      fi
      if [[ ! ",$valid_options," == *",$answer,"* ]]; then
        return 1
      fi
      ;;
    "short_answer")
      # ≤5 words, alphanumeric + spaces only
      local word_count=$(echo "$answer" | wc -w)
      if [[ $word_count -gt 5 ]]; then
        return 1
      fi
      if [[ ! "$answer" =~ ^[a-zA-Z0-9\ \<\>\.]+$ ]]; then
        return 1
      fi
      ;;
  esac
  return 0
}
```

### 4.3 Secrets Management

```bash
# ─────────────────────────────────────────────────────────────────
# 环境变量检查 (run-clarify-scan.sh)
# ─────────────────────────────────────────────────────────────────
check_api_key() {
  if [[ -z "${CLAUDE_API_KEY:-}" ]]; then
    log_error "CLAUDE_API_KEY not set. Export it before running."
    log_info "Example: export CLAUDE_API_KEY='sk-ant-...'"
    exit 1
  fi

  # Validate format (basic check, not exposure)
  if [[ ! "${CLAUDE_API_KEY}" =~ ^sk-ant- ]]; then
    log_warn "CLAUDE_API_KEY format may be invalid."
  fi
}

# ❌ NEVER do this (Constitution Article III.1 violation)
# API_KEY="sk-ant-api03-xxxxx"  # HARDCODED - BLOCKED BY constitution-guardian
```

---

## 5. Database & Storage Patterns

### 5.1 Storage Architecture (File-Based)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Storage Architecture                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Primary Storage: Local File System                            │
│   Format: Markdown (human-readable) + JSON (machine-readable)   │
│                                                                 │
│   ┌─────────────────┐                                           │
│   │  research.md    │ ← Input (read-only during scan)           │
│   │  (Markdown)     │ ← May be updated (P2, with backup)        │
│   └─────────────────┘                                           │
│            │                                                    │
│            ▼                                                    │
│   ┌─────────────────┐                                           │
│   │ .session.json   │ ← Session state (断点恢复)                │
│   │ (JSON)          │ ← Auto-deleted on successful completion   │
│   └─────────────────┘                                           │
│            │                                                    │
│            ▼                                                    │
│   ┌─────────────────┐                                           │
│   │ [timestamp].md  │ ← Final report (永久存储)                 │
│   │ (Markdown)      │ ← Never overwritten, timestamped          │
│   └─────────────────┘                                           │
│                                                                 │
│   Backup Strategy:                                              │
│   ├── research.md.backup (before any modification)              │
│   └── .session.json (incremental save after each Q&A)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Session State Schema

```json
// .session.json - 断点恢复用
{
  "version": "1.0.0",
  "sessionId": "20251215-143000-REQ-001",
  "reqId": "REQ-001",
  "status": "questioning",
  "createdAt": "2025-12-15T14:30:00+08:00",
  "updatedAt": "2025-12-15T14:32:15+08:00",
  "scanResults": {
    "dimensions": [...],  // 完整扫描结果
    "scanDurationMs": 12340
  },
  "questions": [
    {
      "questionId": "Q1",
      "text": "...",
      "answer": "A",           // 已回答
      "answeredAt": "2025-12-15T14:31:00+08:00"
    },
    {
      "questionId": "Q2",
      "text": "...",
      "answer": "< 2 seconds", // 已回答
      "answeredAt": "2025-12-15T14:32:15+08:00"
    },
    {
      "questionId": "Q3",
      "text": "...",
      "answer": null           // 未回答 - 恢复点
    }
  ],
  "currentQuestionIndex": 2  // 下次从 Q3 开始
}
```

---

## 6. Reusable Components Identification

### 6.1 Existing Scripts (High Reusability)

| Script | Reusability | Reuse Scope |
|--------|-------------|-------------|
| `common.sh` | 95% | log_event, check_file, validate_json, colorize |
| `check-prerequisites.sh` | 80% | REQ_ID parsing, directory validation |
| `generate-research-tasks.sh` | 70% | JSON generation pattern, LLM call wrapper |
| `consolidate-research.sh` | 60% | Markdown merging logic |
| `validate-constitution.sh` | 90% | Article checks, severity levels |

### 6.2 Existing Agent Patterns (Reference Only)

| Agent | Pattern | Reference Value |
|-------|---------|-----------------|
| `prd-writer.md` | Entry/Exit Gate | Phase validation structure |
| `consistency-checker.md` | Multi-file analysis | Cross-reference techniques |
| `planner.md` | JSON output | Task breakdown format |

### 6.3 New Components Required

```
NEW SCRIPTS (3):
├── run-clarify-scan.sh           # 11 维度并行扫描
├── generate-clarification-report.sh  # 报告生成
└── integrate-clarifications.sh   # research.md 更新 (P2)

NEW AGENT (1):
└── clarify-analyst.md            # 主编排 agent (Research Agent Pattern)

NEW SKILL (Optional):
└── clarify-validator/            # 报告验证技能 (Guardrail)
```

---

## 7. Testing Strategy

### 7.1 Unit Test Coverage

```bash
# ─────────────────────────────────────────────────────────────────
# test-clarify-scan.sh
# ─────────────────────────────────────────────────────────────────

# Test 1: Dimension scan timeout handling
test_dimension_timeout() {
  # Simulate timeout on dimension 3
  MOCK_TIMEOUT_DIM=3 run-clarify-scan.sh "REQ-TEST"
  assert_output_contains '"status": "timeout"'
  assert_exit_code 1  # Partial success
}

# Test 2: Priority calculation
test_priority_calculation() {
  local issue='{"impact": 8, "uncertainty": 7}'
  local result=$(calculate_priority "$issue")
  assert_equals "56" "$result"
}

# Test 3: Question limit enforcement
test_question_limit() {
  local scan_result='{"issues": [...]}' # 20 issues
  local questions=$(generate-clarification-questions.sh --max 5)
  local count=$(echo "$questions" | jq '.questions | length')
  assert_equals "5" "$count"
}

# Test 4: Input validation
test_answer_validation() {
  assert_true "validate_answer multiple_choice A A,B,C"
  assert_false "validate_answer multiple_choice X A,B,C"
  assert_true "validate_answer short_answer '< 2 seconds' ''"
  assert_false "validate_answer short_answer 'this is more than five words long' ''"
}
```

### 7.2 Integration Test Scenarios

```
┌─────────────────────────────────────────────────────────────────┐
│                Integration Test Matrix                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Scenario 1: Happy Path (Full Flow)                             │
│  ├── Input: research.md with 3 ambiguities                      │
│  ├── Expected: 3 questions, all answered, report generated      │
│  └── Validation: clarifications/ file exists, no errors         │
│                                                                 │
│  Scenario 2: No Ambiguities                                     │
│  ├── Input: research.md fully specified                         │
│  ├── Expected: "No major ambiguities" message                   │
│  └── Validation: No questions asked, direct pass                │
│                                                                 │
│  Scenario 3: Session Recovery                                   │
│  ├── Input: .session.json with Q1-Q2 answered                   │
│  ├── Expected: Resume from Q3                                   │
│  └── Validation: Q1-Q2 not re-asked, report includes all        │
│                                                                 │
│  Scenario 4: API Timeout Degradation                            │
│  ├── Input: Simulated API timeout                               │
│  ├── Expected: Retry 3x, then rule-engine fallback              │
│  └── Validation: Warning logged, scan continues                 │
│                                                                 │
│  Scenario 5: User Abort (Ctrl+C)                                │
│  ├── Input: Interrupt during Q3                                 │
│  ├── Expected: Q1-Q2 saved, resume message                      │
│  └── Validation: .session.json contains Q1-Q2 answers           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Performance Benchmarks

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| 11 维度并行扫描 | < 30s (p95) | `time run-clarify-scan.sh` × 100 runs |
| 单个问题交互 | < 2s | CLI input → next question latency |
| 报告生成 | < 5s | `time generate-clarification-report.sh` |
| 内存使用 | < 100MB | `top -l 1` during scan |

---

## 8. Sample Code Patterns

### 8.1 Parallel Dimension Scanning (Bash)

```bash
#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# run-clarify-scan.sh - 11 维度并行扫描
# ─────────────────────────────────────────────────────────────────

source "$(dirname "$0")/common.sh"

DIMENSIONS=(
  "Functional Scope"
  "Data Model"
  "UX Flow"
  "Non-Functional Quality"
  "Integration & Dependencies"
  "Edge Cases"
  "Constraints & Tradeoffs"
  "Terminology"
  "Completion Signals"
  "Misc & Placeholders"
  "Security & Privacy"
)

scan_dimension() {
  local dim_id="$1"
  local dim_name="$2"
  local research_content="$3"
  local timeout="${4:-20}"

  local start_time=$(date +%s%3N)

  # 调用 Claude API (haiku)
  local result=$(timeout "${timeout}s" curl -s \
    -H "Authorization: Bearer ${CLAUDE_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"model\": \"claude-4-5-haiku\",
      \"max_tokens\": 1000,
      \"system\": \"Scan for ambiguities in dimension: ${dim_name}...\",
      \"messages\": [{\"role\": \"user\", \"content\": $(jq -Rsa . <<< "$research_content")}]
    }" \
    "https://api.anthropic.com/v1/messages" 2>/dev/null)

  local end_time=$(date +%s%3N)
  local duration=$((end_time - start_time))

  if [[ -z "$result" ]]; then
    echo "{\"dimensionId\": ${dim_id}, \"name\": \"${dim_name}\", \"status\": \"timeout\", \"scanTimeMs\": ${duration}}"
  else
    # Parse and format result
    echo "$result" | jq --arg id "$dim_id" --arg name "$dim_name" --arg time "$duration" \
      '{dimensionId: ($id | tonumber), name: $name, status: "ambiguous", scanTimeMs: ($time | tonumber), issues: .}'
  fi
}

main() {
  local req_id="$1"
  local research_md=$(cat "devflow/requirements/${req_id}/research/research.md")

  log_info "Starting parallel scan for ${#DIMENSIONS[@]} dimensions..."

  # 并行执行所有维度扫描
  local pids=()
  local results=()

  for i in "${!DIMENSIONS[@]}"; do
    scan_dimension "$((i+1))" "${DIMENSIONS[$i]}" "$research_md" &
    pids+=($!)
  done

  # 等待所有扫描完成
  for pid in "${pids[@]}"; do
    wait "$pid"
  done

  # 收集结果
  echo '{"dimensions": ['
  # ... merge results
  echo ']}'
}

main "$@"
```

### 8.2 Interactive Question Dialog (Bash)

```bash
# ─────────────────────────────────────────────────────────────────
# ask_question() - flow-clarify.md 命令内联
# ─────────────────────────────────────────────────────────────────

ask_question() {
  local question_json="$1"
  local question_id=$(echo "$question_json" | jq -r '.questionId')
  local question_text=$(echo "$question_json" | jq -r '.text')
  local question_type=$(echo "$question_json" | jq -r '.type')
  local recommended=$(echo "$question_json" | jq -r '.recommendedOption')

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📝 ${question_id}: ${question_text}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  if [[ "$question_type" == "multiple_choice" ]]; then
    echo "$question_json" | jq -r '.options[] | "  \(.optionId)) \(.text) - \(.description)"'
    echo ""
    echo "  ⭐ RECOMMENDED: ${recommended}"
    echo ""
    read -p "Your choice (A-E, or press Enter for recommended): " answer
    answer="${answer:-$recommended}"
    answer=$(echo "$answer" | tr '[:lower:]' '[:upper:]')
  else
    local suggested=$(echo "$question_json" | jq -r '.suggestedValue')
    echo "  💡 Suggested: ${suggested}"
    echo "  📏 Format: ≤5 words"
    echo ""
    read -p "Your answer: " answer
  fi

  # 验证答案
  if ! validate_answer "$question_type" "$answer" "$(echo "$question_json" | jq -r '.options[].optionId' | tr '\n' ',')"; then
    echo "❌ Invalid answer. Please try again."
    ask_question "$question_json"  # 递归重试
    return
  fi

  echo "$answer"
}
```

### 8.3 Report Template (Markdown)

```markdown
# Clarification Report: {{REQ_ID}} - {{FEATURE_NAME}}

**Session ID**: {{SESSION_ID}}
**Date**: {{DATE}}
**Duration**: {{DURATION}}
**Questions**: {{QUESTION_COUNT}} / 5
**Dimensions Scanned**: 11

---

## Scan Summary

| Dimension | Status | Issues | High Priority |
|-----------|--------|--------|---------------|
{{#DIMENSIONS}}
| {{NAME}} | {{STATUS}} | {{ISSUE_COUNT}} | {{HIGH_PRIORITY_COUNT}} |
{{/DIMENSIONS}}

---

## Clarification Session

{{#QUESTIONS}}
### {{QUESTION_ID}}: {{DIMENSION_NAME}}

**Question**: {{QUESTION_TEXT}}

**Type**: {{QUESTION_TYPE}}

{{#OPTIONS}}
| Option | Description |
|--------|-------------|
{{#OPTION_LIST}}
| {{OPTION_ID}} | {{OPTION_TEXT}} |
{{/OPTION_LIST}}
{{/OPTIONS}}

**AI Recommended**: {{RECOMMENDED}} ⭐

**User Answer**: {{ANSWER}}

**Rationale**: {{RATIONALE}}

---
{{/QUESTIONS}}

## Coverage Summary

| Dimension | Status | Notes |
|-----------|--------|-------|
{{#COVERAGE}}
| {{DIM_NAME}} | {{STATUS}} | {{NOTES}} |
{{/COVERAGE}}

---

## Updated Sections in research.md

{{#UPDATED_SECTIONS}}
- `{{SECTION_NAME}}`: {{UPDATE_DESCRIPTION}}
{{/UPDATED_SECTIONS}}

---

## Next Command

✅ Clarification complete. Run `/flow-prd` to generate PRD.

---

**Generated by**: clarify-analyst agent
**Report Version**: 1.0.0
```

---

## 9. Key Architectural Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Execution Model | Bash + LLM API | Reuse existing infrastructure, no new stack |
| Parallelization | GNU Parallel / Background Jobs | 11 independent scans, maximize throughput |
| Data Format | Markdown + JSON | Human-readable output, machine-parseable state |
| State Management | File-based (.session.json) | Stateless CLI, resumable sessions |
| Model Selection | Haiku (scan) + Sonnet (generate) | Cost/quality balance |
| Error Handling | Timeout → Skip → Warn | Graceful degradation, never block |
| Input Validation | Regex + Word Count | Prevent injection, enforce format |
| Backup Strategy | Pre-operation backup | Recoverable, auditable |

---

## 10. Risk Mitigation Summary

| Risk | Mitigation | Validation |
|------|------------|------------|
| LLM accuracy < 80% | Rule engine + LLM hybrid | Pilot A/B test |
| Scan timeout > 30s | 20s per-dimension timeout | Performance benchmark |
| API cost overrun | Haiku model, token limits | Cost tracking per session |
| Session data loss | Incremental save after each Q | Recovery test scenario |
| User abort | Ctrl+C trap, graceful shutdown | Integration test |

---

**Analysis Complete**: 2025-12-15 14:30:00
**Ready for TECH_DESIGN.md Generation**: ✅ YES
