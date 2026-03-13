# CC-DevFlow spec.md Format Guide

> **Version**: v4.3.0
> **Purpose**: 定义项目级和需求级 spec.md 的格式规范

---

## 核心设计原则

**OpenSpec 复刻**：
- 项目级 `devflow/specs/` = 不可变源代码真相（描述当前系统状态）
- 需求级 `requirements/{REQ}/specs/` = Delta（ADDED/MODIFIED/REMOVED/RENAMED）
- 归档时自动合并 Delta 到项目级

**关键区别**：
- ❌ 错误理解：每个需求有自己的 spec.md
- ✅ 正确理解：项目有统一的 specs/，需求通过 Delta 修改它

---

## 项目级 spec.md 格式

### YAML Frontmatter

```yaml
---
module: "auth"                      # 模块名称
created_at: "2026-01-01T10:00:00Z"  # 创建时间
updated_at: "2026-03-12T15:30:00Z"  # 最后更新时间
version: "2.1.0"                    # 语义化版本号
---
```

### 文档结构

```markdown
# {Module Name}

## Purpose
{高层描述：这个模块是干什么的}

## Requirements

### Requirement: {Requirement Name}
The system {SHALL|MUST|SHOULD|MAY} {behavior description}.

#### Scenario: {Scenario Name}
- GIVEN {precondition}
- WHEN {action}
- THEN {expected result}
- AND {additional assertion}

### Requirement: {Another Requirement}
...

## Implementation

### API Endpoints
- POST /api/auth/login
- GET /api/auth/verify

### Data Model
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL
);
```

### Files
- `src/api/auth/login.ts`
- `src/middleware/jwt.ts`
```

### RFC 2119 关键字

| 关键字 | 含义 | 用法 |
|--------|------|------|
| SHALL | 必须实现 | 核心功能 |
| MUST | 强制要求 | 安全/合规 |
| SHOULD | 推荐实现 | 最佳实践 |
| MAY | 可选实现 | 增强功能 |

### BDD Scenario 格式

```markdown
#### Scenario: {场景名称}
- GIVEN {前置条件}
- WHEN {触发动作}
- THEN {预期结果}
- AND {额外断言}
```

**示例**：
```markdown
#### Scenario: Valid credentials
- GIVEN a registered user
- WHEN the user submits valid email and password
- THEN a JWT token is issued
- AND the user is redirected to dashboard
```

---

## 需求级 Delta spec.md 格式

### YAML Frontmatter

```yaml
---
delta_id: "REQ-123"                 # 需求 ID
module: "auth"                      # 目标模块
title: "添加 2FA 支持"               # 变更标题
created_at: "2026-03-12T10:00:00Z"  # 创建时间
status: "draft"                     # draft | approved | applied
---
```

### 文档结构

```markdown
# Delta: {变更标题}

## Summary
{为什么需要这个变更？简短说明}

## ADDED Requirements

### Requirement: {New Requirement Name}
The system SHALL {new behavior}.

#### Scenario: {New Scenario}
- GIVEN ...
- WHEN ...
- THEN ...

## MODIFIED Requirements

### Requirement: {Existing Requirement Name}
The system SHALL {modified behavior}.
(Previously: {old behavior})

## REMOVED Requirements

### Requirement: {Removed Requirement Name}
{说明为什么移除}

## RENAMED Requirements

### Requirement: {Old Name} → {New Name}
{说明为什么重命名}
```

### Delta 操作类型

| 操作 | 含义 | 示例 |
|------|------|------|
| ADDED | 新增需求 | 添加 2FA 功能 |
| MODIFIED | 修改现有需求 | 会话超时从 60 分钟改为 30 分钟 |
| REMOVED | 删除需求 | 移除已废弃的 OAuth 1.0 支持 |
| RENAMED | 重命名需求 | "User Authentication" → "Multi-Factor Authentication" |

---

## 完整示例

### 项目级 spec.md

```markdown
---
module: "auth"
created_at: "2026-01-01T10:00:00Z"
updated_at: "2026-03-12T15:30:00Z"
version: "2.1.0"
---

# Authentication Module

## Purpose
Provides secure authentication and session management for the application.

## Requirements

### Requirement: User Login
The system SHALL allow users to log in with email and password.

#### Scenario: Valid credentials
- GIVEN a registered user
- WHEN the user submits valid email and password
- THEN a JWT token is issued
- AND the user is redirected to dashboard

#### Scenario: Invalid credentials
- GIVEN a registered user
- WHEN the user submits invalid password
- THEN an error message is displayed
- AND no token is issued

### Requirement: Session Management
The system MUST expire sessions after 30 minutes of inactivity.

#### Scenario: Idle timeout
- GIVEN an authenticated session
- WHEN 30 minutes pass without activity
- THEN the session is invalidated
- AND the user must re-authenticate

## Implementation

### API Endpoints
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/verify

### Data Model
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Files
- `src/api/auth/login.ts`
- `src/api/auth/logout.ts`
- `src/middleware/jwt.ts`
```

### 需求级 Delta spec.md

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

#### Scenario: Invalid OTP
- GIVEN a user has entered valid credentials
- WHEN the user submits an invalid OTP code
- THEN an error message is displayed
- AND the user remains on the OTP challenge page

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

## 合并逻辑

归档时，`delta-parser.ts` 自动执行以下操作：

1. **ADDED**: 追加到项目级 spec.md 的 Requirements 章节
2. **MODIFIED**: 替换项目级 spec.md 中对应的 Requirement
3. **REMOVED**: 从项目级 spec.md 中删除对应的 Requirement
4. **RENAMED**: 重命名项目级 spec.md 中的 Requirement 标题
5. **Version Bump**: 更新项目级 spec.md 的 version 字段

---

## 最佳实践

### 1. 保持 Delta 最小化
- 只包含本次需求的变更
- 不要在 Delta 中重复现有内容

### 2. 使用清晰的 Scenario
- 每个 Scenario 测试一个具体行为
- 使用 Given-When-Then 格式
- 避免模糊的描述

### 3. 记录变更原因
- MODIFIED 时说明为什么修改
- REMOVED 时说明为什么移除
- RENAMED 时说明为什么重命名

### 4. 版本号规范
- ADDED 新功能 → MINOR 版本号 +1
- MODIFIED 现有功能 → PATCH 版本号 +1
- REMOVED 功能 → MAJOR 版本号 +1（破坏性变更）

---

## 工具支持

### 生成 Delta
```bash
/flow:spec "REQ-123"
→ 生成 devflow/requirements/REQ-123/specs/{module}/spec.md
```

### 验证 Delta
```bash
/flow:validate-scope "REQ-123"
→ 检测需求偏移，生成 scope-creep-report.md
```

### 合并 Delta
```bash
/flow:release "REQ-123"
→ 自动合并 Delta 到 devflow/specs/{module}/spec.md
→ 更新版本号
→ 归档需求
```

---

**Last Updated**: 2026-03-12
**Version**: v4.3.0
