# Design Decisions Record

> [INPUT]: 依赖 team-config.json 的 negotiate_topics 定义
> [OUTPUT]: 对外提供设计决策记录格式
> [POS]: templates/ 的 Team 协商决策记录模板，被 flow-spec Team 模式消费
> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

---
req_id: "${REQ_ID}"
created_at: "${TIMESTAMP}"
updated_at: "${TIMESTAMP}"
participants: ["tech-architect", "ui-designer", "planner"]
---

# Design Decisions for ${REQ_ID}

本文档记录 spec-design-team 在设计阶段的共享决策。

## Decision Log

<!-- 每个决策按以下格式记录 -->

### DD-001: API 响应格式

**Topic ID**: `api_format`
**Decision Owner**: tech-architect
**Participants**: tech-architect, ui-designer
**Status**: approved | pending | rejected

**Context**:
描述决策背景和需要解决的问题。

**Decision**:
最终决策内容。

**Rationale**:
选择该方案的原因。

**Alternatives Considered**:
1. 方案 A - 原因
2. 方案 B - 原因

**Impact**:
- 前端: 影响描述
- 后端: 影响描述

**Timestamp**: ${TIMESTAMP}

---

### DD-002: 数据字段命名

**Topic ID**: `field_naming`
**Decision Owner**: tech-architect
**Participants**: tech-architect, ui-designer, planner
**Status**: approved | pending | rejected

**Context**:
统一数据字段命名规范，确保前后端一致。

**Decision**:
- 命名风格: camelCase / snake_case
- 关键字段映射表

**Rationale**:
选择该方案的原因。

**Timestamp**: ${TIMESTAMP}

---

### DD-003: 认证策略

**Topic ID**: `auth_strategy`
**Decision Owner**: tech-architect
**Participants**: tech-architect, ui-designer
**Status**: approved | pending | rejected

**Context**:
确定认证方案。

**Decision**:
- 认证方式: JWT / Session / OAuth
- Token 存储: localStorage / httpOnly cookie
- 刷新策略: 描述

**Rationale**:
选择该方案的原因。

**Timestamp**: ${TIMESTAMP}

---

### DD-004: 状态管理方案

**Topic ID**: `state_management`
**Decision Owner**: ui-designer
**Participants**: tech-architect, ui-designer
**Status**: approved | pending | rejected

**Context**:
确定前端状态管理方案。

**Decision**:
- 方案: Redux / Context / Zustand / Jotai
- 全局状态: 列表
- 本地状态: 列表

**Rationale**:
选择该方案的原因。

**Timestamp**: ${TIMESTAMP}

---

### DD-005: 组件粒度

**Topic ID**: `component_granularity`
**Decision Owner**: ui-designer
**Participants**: ui-designer, planner
**Status**: approved | pending | rejected

**Context**:
确定 UI 组件拆分粒度，影响任务分解。

**Decision**:
- 组件列表及复杂度评估
- 每个组件预估时间

**Rationale**:
选择该方案的原因。

**Timestamp**: ${TIMESTAMP}

---

## Summary

| Topic | Decision | Owner | Status |
|-------|----------|-------|--------|
| api_format | | tech-architect | |
| field_naming | | tech-architect | |
| auth_strategy | | tech-architect | |
| state_management | | ui-designer | |
| component_granularity | | ui-designer | |

## Changelog

| Date | Topic | Change | By |
|------|-------|--------|-----|
| ${TIMESTAMP} | - | Initial creation | spec-lead |
