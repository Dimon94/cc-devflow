# spec.md Template - Delta (Requirement Level)

> **Purpose**: 需求级 Delta spec.md 模板，只包含变更
> **Location**: `devflow/requirements/${REQ_ID}/specs/{module}/spec.md`

---

```markdown
---
delta_id: "${REQ_ID}"
module: "${MODULE_NAME}"
title: "${CHANGE_TITLE}"
created_at: "${CREATED_AT}"
status: "draft"
---

# Delta: ${变更标题}

## Summary
${为什么需要这个变更？简短说明}

## ADDED Requirements

### Requirement: ${New Requirement Name}
The system ${SHALL|MUST|SHOULD|MAY} ${new behavior}.

#### Scenario: ${New Scenario}
- GIVEN ${precondition}
- WHEN ${action}
- THEN ${expected result}
- AND ${additional assertion}

## MODIFIED Requirements

### Requirement: ${Existing Requirement Name}
The system ${SHALL|MUST|SHOULD|MAY} ${modified behavior}.
(Previously: ${old behavior})

**Rationale**: ${说明为什么修改}

## REMOVED Requirements

### Requirement: ${Removed Requirement Name}
**Rationale**: ${说明为什么移除}

## RENAMED Requirements

### Requirement: ${Old Name} → ${New Name}
**Rationale**: ${说明为什么重命名}
```

---

## Delta Operations

| Operation | Description | When to Use |
|-----------|-------------|-------------|
| **ADDED** | 新增需求 | 添加新功能、新场景 |
| **MODIFIED** | 修改现有需求 | 改变行为、更新约束 |
| **REMOVED** | 删除需求 | 废弃功能、移除特性 |
| **RENAMED** | 重命名需求 | 改进命名、统一术语 |

## Status Values

- `draft` - 草稿状态，等待审批
- `approved` - 已审批，等待实施
- `applied` - 已应用到项目级 spec

## Merge Rules

归档时 (`/flow:release`)，`delta-parser.ts` 自动执行：

1. **ADDED**: 追加到项目级 spec.md 的 Requirements 章节
2. **MODIFIED**: 替换项目级 spec.md 中对应的 Requirement
3. **REMOVED**: 从项目级 spec.md 中删除对应的 Requirement
4. **RENAMED**: 重命名项目级 spec.md 中的 Requirement 标题
5. **Version Bump**: 更新项目级 spec.md 的 version 字段

## Version Bump Strategy

- **ADDED** 新功能 → MINOR +1 (1.0.0 → 1.1.0)
- **MODIFIED** 现有功能 → PATCH +1 (1.0.0 → 1.0.1)
- **REMOVED** 功能 → MAJOR +1 (1.0.0 → 2.0.0) - 破坏性变更

---

## Example

```markdown
---
delta_id: "REQ-123"
module: "auth"
title: "添加 2FA 支持"
created_at: "2026-03-12T10:00:00Z"
status: "draft"
---

# Delta: 添加 2FA 支持

## Summary
为提高安全性，添加两因素认证支持。用户可选择启用 2FA，登录时需要输入 OTP 验证码。

## ADDED Requirements

### Requirement: Two-Factor Authentication
The system MUST require a second factor during login for users with 2FA enabled.

#### Scenario: OTP required
- GIVEN a user with 2FA enabled
- WHEN the user submits valid credentials
- THEN an OTP challenge is presented
- AND the user must enter a valid OTP code

#### Scenario: OTP validation
- GIVEN a user has entered valid credentials
- WHEN the user submits a valid OTP code
- THEN a JWT token is issued
- AND the user is redirected to dashboard

## MODIFIED Requirements

### Requirement: Session Management
The system SHALL expire sessions after 30 minutes of inactivity.
(Previously: 60 minutes)

**Rationale**: 缩短超时时间以提高安全性，配合 2FA 使用。

## REMOVED Requirements

None

## RENAMED Requirements

None
```

---

**Version**: v4.3.0
