---
req_id: "{REQ_ID}"
module: "{MODULE_NAME}"
created_at: "{TIMESTAMP}"
version: "1.0.0"
status: "draft"
---

# Delta Spec: {MODULE_NAME}

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## Summary

Brief description of what this delta spec changes.

---

## Changes

### ADDED

New specifications added by this requirement.

```markdown
<!-- Example -->
### User Authentication
- JWT-based authentication with 24h expiry
- Refresh token rotation on each use
- Session invalidation on password change
```

### MODIFIED

Changes to existing specifications.

```markdown
<!-- Example -->
### User Model (MODIFIED)
- BEFORE: `email: string`
- AFTER: `email: string (unique, indexed)`
- REASON: Performance optimization for login lookup
```

### REMOVED

Specifications deprecated or removed.

```markdown
<!-- Example -->
### Legacy Session Table (REMOVED)
- REASON: Replaced by JWT-based authentication
- MIGRATION: Run `npm run migrate:sessions` before deployment
```

---

## Impact Analysis

### Affected Files

| File | Change Type | Description |
|------|-------------|-------------|
| `src/auth/jwt.ts` | NEW | JWT utilities |
| `src/models/user.ts` | MODIFIED | Add email index |

### Dependencies

- Requires: None
- Blocks: None

### Migration Steps

1. Step 1
2. Step 2

---

## Verification

- [ ] Unit tests added for new functionality
- [ ] Integration tests updated
- [ ] Documentation updated
- [ ] Backward compatibility verified

---

**Author**: {AUTHOR}
**Reviewed By**: Pending
