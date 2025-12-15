# Technical Design: REQ-001 - /flow-clarify 需求澄清命令

**Status**: Draft
**Created**: 2025-12-15T14:30:00+08:00
**Updated**: 2025-12-15T14:30:00+08:00
**Type**: Technical Design

---

## 1. System Architecture

### 1.1 Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    /flow-clarify System Architecture                        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   [User Terminal]                                                          │
│         │                                                                  │
│         ▼                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │              flow-clarify.md (Command Entry Point)                   │  │
│   │   - Entry Gate validation                                            │  │
│   │   - Interactive Q&A loop                                             │  │
│   │   - Exit Gate validation                                             │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│         │                                                                  │
│         ├──────────────────────────────────┐                               │
│         │                                  │                               │
│         ▼                                  ▼                               │
│   ┌─────────────────┐            ┌─────────────────┐                      │
│   │ clarify-analyst │            │  Bash Scripts   │                      │
│   │     (Agent)     │            │  (.claude/      │                      │
│   │ - Question gen  │            │   scripts/)     │                      │
│   │ - Rationale gen │            │ - scan          │                      │
│   └─────────────────┘            │ - report        │                      │
│         │                        │ - integrate     │                      │
│         │                        └─────────────────┘                      │
│         │                                  │                               │
│         ▼                                  ▼                               │
│   ┌─────────────────┐            ┌─────────────────┐                      │
│   │   Claude API    │            │  File System    │                      │
│   │   (External)    │            │  (Local)        │                      │
│   │ - Haiku (scan)  │            │ - research.md   │                      │
│   │ - Sonnet (gen)  │            │ - session.json  │                      │
│   └─────────────────┘            │ - reports/*.md  │                      │
│                                  └─────────────────┘                      │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Module Breakdown

| Module | Type | Responsibility | Location |
|--------|------|----------------|----------|
| **flow-clarify.md** | Command | 命令入口、Entry/Exit Gate、交互循环 | .claude/commands/ |
| **clarify-analyst.md** | Agent | 问题生成、答案理由生成、报告整理 | .claude/agents/ |
| **run-clarify-scan.sh** | Script | 11 维度并行扫描、API 调用封装 | .claude/scripts/ |
| **generate-clarification-report.sh** | Script | 报告模板渲染、Markdown 生成 | .claude/scripts/ |
| **integrate-clarifications.sh** | Script | research.md 更新（P2 功能） | .claude/scripts/ |

### 1.3 Data Flow

```
用户执行 /flow-clarify "REQ-001"
        │
        ▼
[Entry Gate] ─────────────────────────────────────────────────────────┐
  │ 检查 research.md 存在                                              │
  │ 检查 orchestration_status.json.phase0_complete == true            │
  │ 检查 .session.json 是否有未完成会话（断点恢复）                    │
        │                                                              │
        ▼                                                              │
[Scan Phase] ──────────────────────────────────────────────────────── │
  │ run-clarify-scan.sh 并行调用 11 × Claude Haiku API                 │
  │ 每维度独立扫描，超时 20 秒自动跳过                                  │
  │ 输出: scan_result.json (内存)                                      │
        │                                                              │
        ▼                                                              │
[Question Generation] ─────────────────────────────────────────────── │
  │ clarify-analyst agent + Claude Sonnet-4.5                          │
  │ 优先级排序: Impact × Uncertainty                                   │
  │ 输出: questions[≤5] with AI recommendations                        │
        │                                                              │
        ▼                                                              │
[Interactive Q&A Loop] ────────────────────────────────────────────── │
  │ for each question:                                                 │
  │   1. Display question + options + AI recommendation                │
  │   2. Read user input                                               │
  │   3. Validate answer (A-E or ≤5 words)                            │
  │   4. Generate rationale (Claude Haiku)                             │
  │   5. Append to .session.json (incremental save)                    │
        │                                                              │
        ▼                                                              │
[Report Generation] ───────────────────────────────────────────────── │
  │ generate-clarification-report.sh                                   │
  │ 输出: research/clarifications/[timestamp]-flow-clarify.md          │
        │                                                              │
        ▼                                                              │
[Exit Gate] ───────────────────────────────────────────────────────── │
  │ 验证报告完整性                                                     │
  │ 更新 orchestration_status.json → clarify_complete = true           │
  │ 删除 .session.json（成功完成）                                     │
  │ 输出: "✅ Ready for /flow-prd"                                     │
        │                                                              │
        ▼                                                              │
[End] ◄────────────────────────────────────────────────────────────────┘
```

### 1.4 Existing Codebase Integration

**Reuses**:
- `common.sh`: log_event(), check_file(), validate_json(), colorize()
- `check-prerequisites.sh`: REQ_ID 解析、目录验证
- `orchestration_status.json`: 状态机管理
- `EXECUTION_LOG.md`: 日志追加

**Follows**:
- Agent 命名: `clarify-analyst.md`（遵循 `*-agent.md` 模式）
- 脚本命名: `run-clarify-*.sh`（遵循 `run-*.sh` 模式）
- 报告命名: `[timestamp]-feature.md`（遵循时间戳前缀模式）

**Extends**:
- `generate-research-tasks.sh` 的 LLM 调用封装模式
- `consolidate-research.sh` 的 Markdown 合并逻辑

---

## 2. Technology Stack

### 2.1 CLI Framework (Primary)

- **Runtime**: Bash 4.0+ (macOS/Linux native)
  - **Justification**: 复用现有 .claude/scripts/ 基础设施，无需引入新技术栈

- **Parallel Execution**: GNU Parallel / Background Jobs (&)
  - **Justification**: 11 维度并行扫描需求，Bash 原生支持

- **JSON Processing**: jq 1.6+
  - **Justification**: scan_result.json 解析，已在 common.sh 中使用

### 2.2 LLM API (External)

- **Dimension Scanning**: claude-4-5-haiku (claude-4-5-haiku)
  - **Justification**: 成本优化 ($0.25/1M tokens)，适合低复杂度模式匹配任务

- **Question Generation**: Claude Sonnet 4.5 (claude-sonnet-4-5-20241022)
  - **Justification**: 质量优先，需要复杂推理和最佳实践综合

- **Rationale Generation**: claude-4-5-haiku
  - **Justification**: 简单文本生成，成本优化

- **API Client**: curl + jq (Bash native)
  - **Justification**: 无需额外依赖，复用现有脚本模式

### 2.3 Data Storage (File-Based)

- **Primary Storage**: Local File System (Markdown + JSON)
  - **Justification**: CLI 工具无需数据库，文件系统足够

- **Session State**: JSON (.session.json)
  - **Justification**: 断点恢复需要结构化状态

- **Reports**: Markdown (clarifications/[timestamp].md)
  - **Justification**: 人类可读，与 research.md 格式一致

### 2.4 Infrastructure

- **Deployment**: 本地 CLI 工具（无服务端）
  - **Justification**: 符合 CC-DevFlow 设计，单用户本地执行

- **CI/CD**: 不涉及
  - **Justification**: CLI 工具随项目代码发布

- **Secrets Management**: 环境变量 (CLAUDE_API_KEY)
  - **Justification**: Constitution Article III.1 - NO HARDCODED SECRETS

---

## 3. Data Model Design

### 3.1 Session State Schema (JSON)

#### File: .session.json

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| version | string | NOT NULL, DEFAULT "1.0.0" | Schema 版本 |
| sessionId | string | PRIMARY KEY, NOT NULL | 格式: YYYYMMDD-HHMMSS-REQ-XXX |
| reqId | string | NOT NULL | 需求编号 |
| status | enum | NOT NULL | "scanning" | "questioning" | "complete" | "aborted" |
| createdAt | string | NOT NULL | ISO 8601 时间戳 |
| updatedAt | string | NOT NULL | ISO 8601 时间戳 |
| scanResults | object | NULLABLE | 扫描结果 (DimensionScanResult[]) |
| questions | array | NOT NULL, DEFAULT [] | 问题列表 (ClarificationQuestion[]) |
| currentQuestionIndex | number | NOT NULL, DEFAULT 0 | 当前问题索引 |

#### Nested: DimensionScanResult

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| dimensionId | number | NOT NULL, 1-11 | 维度编号 |
| name | string | NOT NULL | 维度名称 |
| status | enum | NOT NULL | "clear" | "ambiguous" | "timeout" | "skipped" |
| issues | array | NOT NULL, DEFAULT [] | 歧义列表 (AmbiguityIssue[]) |
| scanTimeMs | number | NOT NULL | 扫描耗时（毫秒） |

#### Nested: AmbiguityIssue

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| issueId | string | NOT NULL | 格式: dim-X-issue-Y |
| description | string | NOT NULL | 歧义描述 |
| impact | number | NOT NULL, 1-10 | 影响程度 |
| uncertainty | number | NOT NULL, 1-10 | 不确定性 |
| priority | number | COMPUTED | impact × uncertainty |
| sourceLineRef | string | NULLABLE | 来源行号 (research.md:L42) |

#### Nested: ClarificationQuestion

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| questionId | string | NOT NULL | 格式: Q1-Q5 |
| dimensionId | number | NOT NULL | 来源维度 |
| text | string | NOT NULL | 问题文本 |
| type | enum | NOT NULL | "multiple_choice" | "short_answer" |
| options | array | NULLABLE | 选项列表 (QuestionOption[]) |
| recommendedOption | string | NULLABLE | AI 推荐选项 ID |
| recommendedRationale | string | NULLABLE | AI 推荐理由 |
| answer | string | NULLABLE | 用户答案 |
| answeredAt | string | NULLABLE | 回答时间 |
| rationale | string | NULLABLE | AI 生成理由 |

### 3.2 Orchestration Status Extension

新增字段（追加到 orchestration_status.json）：

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| clarify_complete | boolean | DEFAULT false | 澄清是否完成 |
| clarify_session_id | string | NULLABLE | 最近会话 ID |
| clarify_skipped | boolean | DEFAULT false | 是否跳过澄清 |

### 3.3 File System Structure

```
devflow/requirements/REQ-XXX/
├── orchestration_status.json     # 新增 clarify_* 字段
├── EXECUTION_LOG.md              # 追加澄清日志
└── research/
    ├── research.md               # 输入源 (可能被更新)
    ├── research.md.backup        # 澄清前备份 (if --auto-update)
    ├── tasks.json                # 研究任务 (只读)
    └── clarifications/           # 新增目录 ✅
        ├── 20251215-143000-flow-clarify.md    # 澄清报告
        └── .session.json         # 会话状态 (断点恢复)
```

---

## 4. API Design

### 4.1 Internal Script APIs

#### run-clarify-scan.sh

**Purpose**: 执行 11 维度并行歧义扫描

**Input** (CLI Arguments):
```bash
run-clarify-scan.sh "${REQ_ID}" [--parallel] [--timeout 20] [--dimension all|1-11]
```

**Output** (JSON to stdout):
```json
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
    }
  ]
}
```

**Exit Codes**:
- 0: 全部成功
- 1: 部分维度超时 (降级继续)
- 2: 致命错误 (如 API 不可用)

---

#### generate-clarification-questions.sh

**Purpose**: 基于扫描结果生成优先级排序问题

**Input**:
```bash
generate-clarification-questions.sh --input scan_result.json --max 5
```

**Output** (JSON to stdout):
```json
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
```

---

#### generate-clarification-report.sh

**Purpose**: 基于会话数据生成 Markdown 报告

**Input**:
```bash
generate-clarification-report.sh --session .session.json --output clarifications/
```

**Output**: 写入 `clarifications/[timestamp]-flow-clarify.md`

---

### 4.2 External API (Claude)

#### Dimension Scan Request

```bash
curl -s -X POST https://api.anthropic.com/v1/messages \
  -H "Authorization: Bearer ${CLAUDE_API_KEY}" \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-4-5-haiku",
    "max_tokens": 1000,
    "system": "You are a requirements ambiguity scanner for dimension: Functional Scope.\nAnalyze the research document and identify:\n1. Missing information\n2. Vague terminology\n3. Implicit assumptions\n4. Contradictions\n\nOutput JSON: {\"issues\": [{\"description\": \"...\", \"impact\": 1-10, \"uncertainty\": 1-10}]}",
    "messages": [{"role": "user", "content": "<research.md content>"}]
  }'
```

**Response**:
```json
{
  "content": [{"type": "text", "text": "{\"issues\": [...]}"}],
  "usage": {"input_tokens": 1200, "output_tokens": 350}
}
```

**Error Handling**:
- 429 Rate Limited: 指数退避重试 (3 次)
- 500 Server Error: 降级到 "timeout" 状态
- Network Error: 降级到 "skipped" 状态

---

### 4.3 Error Response Format

```json
{
  "error": {
    "code": "SCAN_TIMEOUT",
    "message": "Dimension scan timed out after 20 seconds",
    "details": [
      {
        "dimensionId": 3,
        "name": "UX Flow",
        "issue": "API call exceeded timeout"
      }
    ]
  }
}
```

**Error Codes**:
| Code | HTTP Status | Description |
|------|-------------|-------------|
| MISSING_RESEARCH | 400 | research.md 不存在 |
| INVALID_PHASE | 400 | phase0_complete != true |
| SCAN_TIMEOUT | 408 | 维度扫描超时 |
| API_ERROR | 502 | Claude API 错误 |
| VALIDATION_ERROR | 400 | 用户答案验证失败 |
| SESSION_CORRUPT | 500 | .session.json 格式错误 |

---

## 5. Security Design

### 5.1 Authentication

- **Strategy**: 无需认证（本地 CLI 工具）
- **External API**: 使用环境变量 `CLAUDE_API_KEY`
- **Token Validation**: 启动时验证 API Key 格式（`sk-ant-*`）

### 5.2 Authorization

- **Model**: 文件系统权限（本地用户权限）
- **Scope Restriction**:
  - 只读: research.md, tasks.json, orchestration_status.json
  - 读写: clarifications/, .session.json, EXECUTION_LOG.md
  - 禁止: 源码目录、系统文件

### 5.3 Secret Management

- **✅ NO HARDCODED SECRETS** (Constitution Article III.1)
- **Strategy**: 环境变量存储

**Required Secrets**:
| Secret | Purpose | Example |
|--------|---------|---------|
| CLAUDE_API_KEY | Claude API 认证 | sk-ant-api03-... |

**Implementation**:
```bash
# 启动检查 (run-clarify-scan.sh)
check_api_key() {
  if [[ -z "${CLAUDE_API_KEY:-}" ]]; then
    log_error "CLAUDE_API_KEY not set."
    log_info "Export: export CLAUDE_API_KEY='sk-ant-...'"
    exit 1
  fi
}
```

**Secret Storage**:
- Development: 用户 shell profile (`~/.zshrc`, `~/.bashrc`)
- CI/CD: 不涉及（本地工具）

### 5.4 Input Validation

**User Answer Validation**:
```bash
validate_answer() {
  local type="$1"    # "multiple_choice" | "short_answer"
  local answer="$2"
  local options="$3" # "A,B,C,D,E"

  case "$type" in
    "multiple_choice")
      # 必须是单字符 A-E
      [[ "$answer" =~ ^[A-Ea-e]$ ]] || return 1
      # 必须在有效选项中
      [[ ",$options," == *",$(echo $answer | tr a-z A-Z),"* ]] || return 1
      ;;
    "short_answer")
      # ≤5 个单词
      [[ $(echo "$answer" | wc -w) -le 5 ]] || return 1
      # 仅允许字母数字 + 空格 + 基本符号
      [[ "$answer" =~ ^[a-zA-Z0-9\ \<\>\.\-\_]+$ ]] || return 1
      ;;
  esac
  return 0
}
```

**Path Traversal Prevention**:
```bash
# 只允许写入 research/clarifications/ 目录
validate_output_path() {
  local path="$1"
  local base_dir="devflow/requirements/REQ-*/research/clarifications"
  [[ "$path" == $base_dir/* ]] || {
    log_error "Invalid output path: $path"
    exit 1
  }
}
```

### 5.5 Rate Limiting

- **API Calls**: 11 并发请求（每维度 1 个）
- **Per-Session Limit**: 最多 5 个问题（硬性配额）
- **Timeout**: 每维度 20 秒

### 5.6 Security Headers

- 不涉及（CLI 工具无 HTTP 服务）

---

## 6. Performance Design

### 6.1 Parallelization Strategy

**11 维度并行扫描**:
```bash
# 使用 Bash background jobs 实现并行
scan_all_dimensions() {
  local pids=()

  for i in {1..11}; do
    scan_dimension "$i" &
    pids+=($!)
  done

  # 等待所有完成，收集结果
  for pid in "${pids[@]}"; do
    wait "$pid"
  done
}
```

**性能优化**:
- 并行请求减少总耗时: 11 × 3s → ~5s (理论最大)
- 单维度超时不阻塞其他维度
- 结果实时收集，无需等待全部完成

### 6.2 Timeout Handling

| Stage | Timeout | Fallback |
|-------|---------|----------|
| 单维度扫描 | 20s | 标记 "timeout"，继续执行 |
| 问题生成 | 30s | 使用规则引擎降级生成 |
| 答案理由生成 | 10s | 使用模板理由 |
| 总流程 | 5min | 提示用户超时，保存当前进度 |

### 6.3 Incremental Save (Prompt Chaining)

**断点恢复机制**:
```bash
save_session() {
  local session_file="research/clarifications/.session.json"
  echo "$SESSION_DATA" | jq '.' > "$session_file"
}

# 每回答一个问题后立即保存
answer_question() {
  local answer="$1"

  # 更新会话数据
  SESSION_DATA=$(echo "$SESSION_DATA" | jq --arg a "$answer" \
    '.questions[.currentQuestionIndex].answer = $a | .currentQuestionIndex += 1')

  # 立即持久化
  save_session
}
```

### 6.4 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| 11 维度并行扫描 (p95) | < 30s | 计时 run-clarify-scan.sh |
| 单问题交互延迟 | < 2s | 用户输入到下一题显示 |
| 报告生成 | < 5s | 计时 generate-clarification-report.sh |
| 总澄清时间 (5 问题) | < 5min | 端到端计时 (包括用户思考) |
| 内存使用 | < 50MB | top -l 1 监控 |

---

## 7. Constitution Check (Phase -1 Gates)

### 7.0 Baseline Deviation Check (ANTI-TECH-CREEP)

**Baseline Tech Stack** (from CLAUDE.md / codebase-overview.md):
- **Command System**: Markdown-based Slash Commands
- **Agent System**: Sub-Agents (Research Agent Pattern)
- **Script Runtime**: Bash
- **LLM Integration**: Claude API (via curl)
- **Data Format**: Markdown + JSON

**Deviation Analysis**:
- [x] **All baseline technologies reused**: Bash + Markdown + Claude API (无变更)
- [x] **All new technologies justified**: 无新技术引入
- [x] **No unnecessary refactoring**: 复用 common.sh, check-prerequisites.sh
- [x] **No unfamiliar third-party libraries**: 仅使用 jq (已存在)

**Deviations from Baseline**: None

**Status**: ✅ Passed (no deviations)

### 7.1 Simplicity Gate (Article VII)

- [x] **≤3 projects/modules**:
  - Module 1: flow-clarify.md (Command)
  - Module 2: clarify-analyst.md (Agent)
  - Module 3: scripts/ (3 个脚本)
  - **Total**: 3 逻辑模块 ✅

- [x] **No future-proofing**:
  - 11 维度硬编码（MVP 足够）
  - 无 "未来可能需要" 的功能

- [x] **Minimal dependencies**:
  - Bash (系统自带)
  - jq (已存在)
  - curl (系统自带)
  - 无新增依赖

**Status**: ✅ Passed

### 7.2 Anti-Abstraction Gate (Article VIII)

- [x] **Direct framework usage**:
  - 直接调用 Claude API (curl)
  - 直接操作文件系统 (Bash)
  - 无 SDK 封装层

- [x] **Single data model**:
  - JSON schema 唯一定义 (.session.json)
  - Markdown 模板唯一定义 (report template)

- [x] **No unnecessary interfaces**:
  - 无 BaseScript, BaseAgent 抽象
  - 函数直接实现业务逻辑

**Status**: ✅ Passed

### 7.3 Integration-First Gate (Article IX)

- [x] **Contracts defined first**:
  - 脚本 API 已定义（Section 4.1）
  - LLM API 格式已定义（Section 4.2）

- [x] **Contract tests planned**:
  - 单元测试: validate_answer() 等函数
  - 集成测试: 完整澄清流程

- [x] **Real environment testing**:
  - 使用真实 Claude API（非 mock）
  - 使用真实文件系统（非内存模拟）

**Status**: ✅ Passed

### 7.4 Complexity Tracking

| Potential Violation | Justification | Status |
|---------------------|---------------|--------|
| None | N/A | N/A |

**Constitution Check Result**: ✅ **ALL GATES PASSED**

---

## 8. Validation Checklist

- [x] **Section 1**: System Architecture (Overview, Modules, Data Flow) - Complete
- [x] **Section 2**: Technology Stack (CLI, LLM, Storage, Infrastructure) - Complete with justifications
- [x] **Section 3**: Data Model Design (Session Schema, Status Extension, File Structure) - Complete
- [x] **Section 4**: API Design (Script APIs, External APIs, Error Handling) - Complete
- [x] **Section 5**: Security Design (Auth, Authz, Secret Mgmt, Validation) - Complete
- [x] **Section 6**: Performance Design (Parallelization, Timeout, Incremental Save) - Complete
- [x] **Section 7**: Constitution Check (Phase -1 Gates) - Complete, ALL PASSED
- [x] **No placeholders**: 无 {{PLACEHOLDER}} 标记
- [x] **Specific technologies**: Bash 4.0+, jq 1.6+, Claude Haiku/Sonnet
- [x] **Complete schema**: .session.json 完整定义
- [x] **Complete API**: 所有脚本 API 定义
- [x] **✅ NO HARDCODED SECRETS**: CLAUDE_API_KEY 使用环境变量
- [x] **Constitution compliance**: 所有 Phase -1 Gates 通过

**Ready for Epic Planning**: ✅ YES

---

## Appendix: 11 Dimension Definitions

| ID | Dimension | Focus Areas |
|----|-----------|-------------|
| 1 | Functional Scope | 核心目标、成功标准、排除声明 |
| 2 | Data Model | 实体、属性、关系、生命周期 |
| 3 | UX Flow | 用户旅程、错误状态、空状态 |
| 4 | Non-Functional Quality | 延迟、吞吐量、可用性、可观测性 |
| 5 | Integration & Dependencies | 外部 API、故障模式、协议 |
| 6 | Edge Cases | 负面场景、限流、冲突解决 |
| 7 | Constraints & Tradeoffs | 技术约束、拒绝方案 |
| 8 | Terminology | 规范术语、避免同义词 |
| 9 | Completion Signals | 验收标准、完成定义 |
| 10 | Misc & Placeholders | TODO 标记、模糊形容词 |
| 11 | Security & Privacy | AuthN/AuthZ、数据保护、合规 |

---

**Generated by**: tech-architect agent
**Template Version**: 1.0.0
**Constitution Version**: v2.0.0
**Next Step**: Generate derived assets (data-model.md, contracts/, quickstart.md), then run `/flow-epic`
