# Data Model: REQ-001 - /flow-clarify

**Version**: 1.0.0
**Created**: 2025-12-15
**Type**: Data Model Specification

---

## Overview

/flow-clarify 使用文件系统存储，核心数据模型包括：
1. **ClarificationSession** - 澄清会话状态
2. **DimensionScanResult** - 维度扫描结果
3. **ClarificationQuestion** - 澄清问题
4. **OrchestrationStatus Extension** - 状态机扩展

---

## Entity Definitions

### 1. ClarificationSession

**Storage**: `research/clarifications/.session.json`
**Purpose**: 断点恢复、会话状态追踪

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version", "sessionId", "reqId", "status", "createdAt", "updatedAt"],
  "properties": {
    "version": {
      "type": "string",
      "const": "1.0.0",
      "description": "Schema 版本"
    },
    "sessionId": {
      "type": "string",
      "pattern": "^\\d{8}-\\d{6}-REQ-\\d{3}$",
      "description": "会话 ID (YYYYMMDD-HHMMSS-REQ-XXX)"
    },
    "reqId": {
      "type": "string",
      "pattern": "^REQ-\\d{3}$",
      "description": "需求编号"
    },
    "status": {
      "type": "string",
      "enum": ["scanning", "questioning", "complete", "aborted"],
      "description": "会话状态"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "创建时间 (ISO 8601)"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time",
      "description": "更新时间 (ISO 8601)"
    },
    "scanResults": {
      "$ref": "#/definitions/ScanResults",
      "description": "扫描结果"
    },
    "questions": {
      "type": "array",
      "items": { "$ref": "#/definitions/ClarificationQuestion" },
      "maxItems": 5,
      "description": "问题列表 (≤5)"
    },
    "currentQuestionIndex": {
      "type": "integer",
      "minimum": 0,
      "maximum": 5,
      "default": 0,
      "description": "当前问题索引"
    }
  }
}
```

### 2. DimensionScanResult

**Embedded in**: ClarificationSession.scanResults.dimensions[]
**Purpose**: 单维度扫描输出

```json
{
  "definitions": {
    "DimensionScanResult": {
      "type": "object",
      "required": ["dimensionId", "name", "status", "scanTimeMs"],
      "properties": {
        "dimensionId": {
          "type": "integer",
          "minimum": 1,
          "maximum": 11,
          "description": "维度编号 (1-11)"
        },
        "name": {
          "type": "string",
          "enum": [
            "Functional Scope",
            "Data Model",
            "UX Flow",
            "Non-Functional Quality",
            "Integration & Dependencies",
            "Edge Cases",
            "Constraints & Tradeoffs",
            "Terminology",
            "Completion Signals",
            "Misc & Placeholders",
            "Security & Privacy"
          ],
          "description": "维度名称"
        },
        "status": {
          "type": "string",
          "enum": ["clear", "ambiguous", "timeout", "skipped"],
          "description": "扫描状态"
        },
        "issues": {
          "type": "array",
          "items": { "$ref": "#/definitions/AmbiguityIssue" },
          "default": [],
          "description": "发现的歧义"
        },
        "scanTimeMs": {
          "type": "integer",
          "minimum": 0,
          "description": "扫描耗时 (毫秒)"
        }
      }
    }
  }
}
```

### 3. AmbiguityIssue

**Embedded in**: DimensionScanResult.issues[]
**Purpose**: 单个歧义项

```json
{
  "definitions": {
    "AmbiguityIssue": {
      "type": "object",
      "required": ["issueId", "description", "impact", "uncertainty"],
      "properties": {
        "issueId": {
          "type": "string",
          "pattern": "^dim-\\d{1,2}-issue-\\d+$",
          "description": "歧义 ID (dim-X-issue-Y)"
        },
        "description": {
          "type": "string",
          "minLength": 10,
          "maxLength": 500,
          "description": "歧义描述"
        },
        "impact": {
          "type": "integer",
          "minimum": 1,
          "maximum": 10,
          "description": "影响程度 (1-10)"
        },
        "uncertainty": {
          "type": "integer",
          "minimum": 1,
          "maximum": 10,
          "description": "不确定性 (1-10)"
        },
        "priority": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "优先级 = impact × uncertainty (计算字段)"
        },
        "sourceLineRef": {
          "type": "string",
          "pattern": "^research\\.md:L\\d+$",
          "description": "来源行号 (可选)"
        }
      }
    }
  }
}
```

### 4. ClarificationQuestion

**Embedded in**: ClarificationSession.questions[]
**Purpose**: 澄清问题及答案

```json
{
  "definitions": {
    "ClarificationQuestion": {
      "type": "object",
      "required": ["questionId", "dimensionId", "text", "type"],
      "properties": {
        "questionId": {
          "type": "string",
          "pattern": "^Q[1-5]$",
          "description": "问题 ID (Q1-Q5)"
        },
        "dimensionId": {
          "type": "integer",
          "minimum": 1,
          "maximum": 11,
          "description": "来源维度"
        },
        "text": {
          "type": "string",
          "minLength": 10,
          "maxLength": 500,
          "description": "问题文本"
        },
        "type": {
          "type": "string",
          "enum": ["multiple_choice", "short_answer"],
          "description": "问题类型"
        },
        "options": {
          "type": "array",
          "items": { "$ref": "#/definitions/QuestionOption" },
          "minItems": 2,
          "maxItems": 5,
          "description": "选项列表 (仅 multiple_choice)"
        },
        "recommendedOption": {
          "type": "string",
          "pattern": "^[A-E]$",
          "description": "AI 推荐选项"
        },
        "recommendedRationale": {
          "type": "string",
          "maxLength": 300,
          "description": "AI 推荐理由"
        },
        "answer": {
          "type": "string",
          "description": "用户答案"
        },
        "answeredAt": {
          "type": "string",
          "format": "date-time",
          "description": "回答时间"
        },
        "rationale": {
          "type": "string",
          "maxLength": 300,
          "description": "AI 生成答案理由"
        }
      }
    },
    "QuestionOption": {
      "type": "object",
      "required": ["optionId", "text"],
      "properties": {
        "optionId": {
          "type": "string",
          "pattern": "^[A-E]$",
          "description": "选项 ID"
        },
        "text": {
          "type": "string",
          "maxLength": 100,
          "description": "选项文本"
        },
        "description": {
          "type": "string",
          "maxLength": 200,
          "description": "选项说明"
        }
      }
    }
  }
}
```

### 5. OrchestrationStatus Extension

**Storage**: `orchestration_status.json`
**Purpose**: 扩展现有状态机

```json
{
  "additionalProperties": {
    "clarify_complete": {
      "type": "boolean",
      "default": false,
      "description": "澄清是否完成"
    },
    "clarify_session_id": {
      "type": "string",
      "pattern": "^\\d{8}-\\d{6}-REQ-\\d{3}$",
      "description": "最近会话 ID"
    },
    "clarify_skipped": {
      "type": "boolean",
      "default": false,
      "description": "是否跳过澄清"
    }
  }
}
```

---

## State Transitions

```
                    ┌─────────────┐
                    │   START     │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
        ┌──────────│  scanning   │──────────┐
        │          └──────┬──────┘          │
        │                 │                 │
        │  all_clear      │ issues_found    │ scan_error
        │                 │                 │
        ▼                 ▼                 ▼
 ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
 │  complete   │   │ questioning │   │   aborted   │
 │  (no Q&A)   │   └──────┬──────┘   └─────────────┘
 └─────────────┘          │                 ▲
                          │ all_answered    │
                          │                 │ user_abort
                          ▼                 │
                   ┌─────────────┐          │
                   │  complete   │          │
                   │ (with Q&A)  │──────────┘
                   └─────────────┘   save_failure
```

---

## Validation Rules

### Answer Validation

| Question Type | Valid Pattern | Error Message |
|---------------|---------------|---------------|
| multiple_choice | `/^[A-Ea-e]$/` | "Invalid option. Choose A-E." |
| short_answer | `≤5 words, alphanumeric` | "Answer too long. Max 5 words." |

### Session Validation

| Rule | Check | Error |
|------|-------|-------|
| Version | `version == "1.0.0"` | SESSION_VERSION_MISMATCH |
| ReqId | `reqId matches /^REQ-\d{3}$/` | INVALID_REQ_ID |
| Status | `status in enum` | INVALID_SESSION_STATUS |
| Questions | `questions.length <= 5` | TOO_MANY_QUESTIONS |

---

## Indexes & Lookup Patterns

| Lookup | Key Pattern | Example |
|--------|-------------|---------|
| Session by REQ | `research/clarifications/.session.json` | 直接读取 |
| Report by timestamp | `research/clarifications/YYYYMMDD-HHMMSS-*.md` | Glob 匹配 |
| Issue by dimension | `scanResults.dimensions[dimensionId - 1]` | 数组索引 |
| Question by ID | `questions.find(q => q.questionId === "Q1")` | 线性搜索 |

---

**Model Version**: 1.0.0
**Schema Validation**: JSON Schema Draft-07
**Next Step**: See contracts/ for API schema definitions
