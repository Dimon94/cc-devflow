---
delta_id: "{DELTA_ID}"
req_id: "{REQ_ID}"
title: "{TITLE}"
created_at: "{TIMESTAMP}"
status: "draft"
---

# Delta: {TITLE}

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## Summary

{简要描述变更内容}

---

## ADDED Requirements

### Requirement: {Name}

{Description}

#### Scenario: {Scenario Name}

- GIVEN {precondition}
- WHEN {action}
- THEN {expected result}

---

## MODIFIED Requirements

### Requirement: {Name}

{New description}

(Previously: {old description})

#### Scenario: {Scenario Name}

- GIVEN {precondition}
- WHEN {action}
- THEN {expected result}

---

## REMOVED Requirements

### Requirement: {Name}

**Reason**: {why removed}

**Migration**: {how to migrate}

---

## RENAMED Requirements

- FROM: {Old Name}
- TO: {New Name}

---

## Impact Analysis

### Affected Files

| File | Change Type | Description |
|------|-------------|-------------|
| `src/example.ts` | NEW | Example file |

### Dependencies

- Requires: None
- Blocks: None

---

## Verification

- [ ] Unit tests added for new functionality
- [ ] Integration tests updated
- [ ] Documentation updated
- [ ] Backward compatibility verified

---

**Author**: {AUTHOR}
**Reviewed By**: Pending
