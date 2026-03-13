# proposal.md Template

> **Purpose**: 需求提议模板，描述为什么需要和要做什么
> **Location**: `devflow/requirements/${REQ_ID}/proposal.md`
> **Version**: v4.3.0

---

```markdown
---
req_id: "${REQ_ID}"
title: "${TITLE}"
created_at: "${CREATED_AT}"
status: "draft"
---

# ${TITLE}

## Why（为什么需要）

[NEEDS CLARIFICATION: 为什么需要这个功能？解决什么问题？]

### Background
${背景描述}

### Problem Statement
${问题陈述}

### Business Value
${商业价值}

## What（要做什么）

[NEEDS CLARIFICATION: 具体要做什么？核心功能是什么？]

### Core Features
- ${核心功能 1}
- ${核心功能 2}
- ${核心功能 3}

### Scope
**In Scope**:
- ${包含的功能}

**Out of Scope**:
- ${不包含的功能}

### Success Criteria
- ${成功标准 1}
- ${成功标准 2}

## References

${如果有 PLAN_URLS，列在这里}
- [External Doc 1](${URL})
- [External Doc 2](${URL})

---

## Constitutional Constraints

- **Article X: Requirement Boundary** - 只实现明确请求的功能，不添加推测性特性
- **Article I: Quality First** - 完整实现或不实现，禁止部分实现

详见 `.claude/rules/project-constitution.md`
```

---

## Field Descriptions

| Field | Description | Example |
|-------|-------------|---------|
| `req_id` | 需求 ID | "REQ-123" |
| `title` | 需求标题 | "添加用户认证" |
| `created_at` | 创建时间 (ISO 8601) | "2026-03-12T10:00:00Z" |
| `status` | 状态 | "draft", "approved", "implemented" |

## Why vs What

- **Why**: 回答"为什么需要"，聚焦问题和价值
- **What**: 回答"要做什么"，聚焦功能和范围

## [NEEDS CLARIFICATION] 标记

所有模糊点必须标记为 `[NEEDS CLARIFICATION: 具体问题]`，等待用户澄清。

---

**Version**: v4.3.0
**Related**: SPEC_TEMPLATE_DELTA.md（下一阶段生成）
