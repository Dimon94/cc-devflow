# devflow/specs/ - Project-Level Single Source of Truth

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

项目级单一真相源 (SSOT)，描述**当前系统的完整状态**。

**核心设计**（复刻 OpenSpec）：
- `devflow/specs/` = 项目级不可变源代码真相（描述当前状态）
- `devflow/requirements/{REQ}/specs/` = 需求级 Delta（ADDED/MODIFIED/REMOVED）
- 归档时自动合并 Delta 到项目级 specs/

## Structure

```
specs/
├── README.md           # 本文件
├── CLAUDE.md           # L2 文档
├── auth/               # 认证模块
│   └── spec.md         # 当前认证系统状态
├── payments/           # 支付模块
│   └── spec.md         # 当前支付系统状态
├── ui/                 # UI 组件
│   └── spec.md         # 当前 UI 组件库状态
└── api/                # API 规格
    └── openapi.yaml    # API 契约定义
```

## Workflow

```
1. 新需求开始前
   /flow:init "REQ-123"
   → 读取 devflow/specs/ 了解当前系统状态

2. 规格阶段
   /flow:spec "REQ-123"
   → 生成 devflow/requirements/REQ-123/specs/ (Delta)
   → Delta 只包含 ADDED/MODIFIED/REMOVED/RENAMED

3. 归档时
   /flow:release "REQ-123"
   → 自动合并 Delta 到 devflow/specs/
   → 更新模块版本号
   → 归档需求到 devflow/archive/
```

## spec.md Format

### 项目级 spec.md（描述当前状态）
```markdown
---
module: "auth"
version: "2.1.0"
updated_at: "2026-03-12T15:30:00Z"
---

# Authentication Module

## Purpose
Provides secure authentication and session management.

## Requirements

### Requirement: User Login
The system SHALL allow users to log in with email and password.

#### Scenario: Valid credentials
- GIVEN a registered user
- WHEN the user submits valid email and password
- THEN a JWT token is issued
- AND the user is redirected to dashboard
```

### 需求级 Delta spec.md（只包含变更）
```markdown
---
delta_id: "REQ-123"
module: "auth"
title: "添加 2FA 支持"
status: "draft"
---

# Delta: 添加 2FA 支持

## ADDED Requirements

### Requirement: Two-Factor Authentication
The system MUST require a second factor during login.

## MODIFIED Requirements

### Requirement: Session Management
The system SHALL expire sessions after 30 minutes.
(Previously: 60 minutes)

## REMOVED Requirements

None

## RENAMED Requirements

None
```

## Integration

- **Context Injection**: `/flow:init` 读取此目录了解当前系统
- **Delta Merge**: `delta-parser.ts` 负责合并逻辑
- **Scope Validation**: `validate-scope.ts` 检测需求偏移
- **Version Control**: 每次合并更新模块 version 字段

---

**Created**: 2026-02-06
**Updated**: 2026-03-13 (v4.3 OpenSpec 复刻)
**Version**: v4.3.0
