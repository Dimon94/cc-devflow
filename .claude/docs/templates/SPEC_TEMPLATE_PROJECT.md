# spec.md Template - Project Level

> **Purpose**: 项目级 spec.md 模板，描述当前系统状态
> **Location**: `devflow/specs/{module}/spec.md`

---

```markdown
---
module: "${MODULE_NAME}"
created_at: "${CREATED_AT}"
updated_at: "${UPDATED_AT}"
version: "1.0.0"
---

# ${Module Name}

## Purpose
${高层描述：这个模块是干什么的}

## Requirements

### Requirement: ${Requirement Name}
The system ${SHALL|MUST|SHOULD|MAY} ${behavior description}.

#### Scenario: ${Scenario Name}
- GIVEN ${precondition}
- WHEN ${action}
- THEN ${expected result}
- AND ${additional assertion}

### Requirement: ${Another Requirement}
The system ${SHALL|MUST|SHOULD|MAY} ${behavior description}.

#### Scenario: ${Another Scenario}
- GIVEN ${precondition}
- WHEN ${action}
- THEN ${expected result}

## Implementation

### API Endpoints
- ${METHOD} ${PATH}
- ${METHOD} ${PATH}

### Data Model
\`\`\`sql
CREATE TABLE ${table_name} (
  id UUID PRIMARY KEY,
  ${field_name} ${field_type} ${constraints}
);
\`\`\`

### Files
- \`${file_path}\`
- \`${file_path}\`

---

**Note**: This spec describes the current state of the system.
```

---

## Field Descriptions

| Field | Description | Example |
|-------|-------------|---------|
| `module` | 模块名称 | "auth", "payments", "ui" |
| `created_at` | 创建时间 (ISO 8601) | "2026-01-01T10:00:00Z" |
| `updated_at` | 最后更新时间 | "2026-03-12T15:30:00Z" |
| `version` | 语义化版本号 | "2.1.0" |

## RFC 2119 Keywords

- **SHALL**: 必须实现（核心功能）
- **MUST**: 强制要求（安全/合规）
- **SHOULD**: 推荐实现（最佳实践）
- **MAY**: 可选实现（增强功能）

## BDD Scenario Format

```
#### Scenario: {场景名称}
- GIVEN {前置条件}
- WHEN {触发动作}
- THEN {预期结果}
- AND {额外断言}
```

---

**Version**: v4.3.0
