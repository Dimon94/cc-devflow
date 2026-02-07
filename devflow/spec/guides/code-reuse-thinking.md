# Code Reuse Thinking Guide

> **Purpose**: Stop and think before creating new code - does it already exist?
> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

---

## The Problem

**Duplicated code is the #1 source of inconsistency bugs.**

When you copy-paste or rewrite existing logic:
- Bug fixes don't propagate
- Behavior diverges over time
- Codebase becomes harder to understand

---

## Before Writing New Code

### Step 1: Search First

```bash
# Search for similar function names
grep -r "functionName" .

# Search for similar logic patterns
grep -r "keyword" .

# Use Glob for file patterns
# Use Grep for content patterns
```

### Step 2: Ask These Questions

| Question | If Yes... |
|----------|-----------|
| Does a similar function exist? | Use or extend it |
| Is this pattern used elsewhere? | Follow the existing pattern |
| Could this be a shared utility? | Create it in the right place |
| Am I copying code from another file? | **STOP** - extract to shared |

---

## Common Duplication Patterns

### Pattern 1: Copy-Paste Functions

**Bad**: Copying a validation function to another file

```typescript
// file1.ts
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// file2.ts - DUPLICATED!
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

**Good**: Extract to shared utilities, import where needed

```typescript
// utils/validators.ts
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// file1.ts & file2.ts
import { validateEmail } from '@/utils/validators';
```

### Pattern 2: Similar Components

**Bad**: Creating a new component that's 80% similar to existing

```typescript
// UserCard.tsx - existing
// AdminCard.tsx - 80% same code, different styling
```

**Good**: Extend existing component with props/variants

```typescript
// Card.tsx
interface CardProps {
  variant: 'user' | 'admin';
  // ...
}
```

### Pattern 3: Repeated Constants

**Bad**: Defining the same constant in multiple files

```typescript
// api.ts
const API_BASE = 'https://api.example.com';

// service.ts - DUPLICATED!
const API_BASE = 'https://api.example.com';
```

**Good**: Single source of truth, import everywhere

```typescript
// config/constants.ts
export const API_BASE = 'https://api.example.com';
```

### Pattern 4: WeChat Mini Program Specifics

**Bad**: Duplicating WeChat API wrappers

```typescript
// page1.ts
const request = (url: string) => {
  return new Promise((resolve, reject) => {
    wx.request({ url, success: resolve, fail: reject });
  });
};

// page2.ts - DUPLICATED!
const request = (url: string) => { /* same code */ };
```

**Good**: Centralized request utility

```typescript
// utils/request.ts
export const request = <T>(options: WechatMiniprogram.RequestOption): Promise<T> => {
  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      success: (res) => resolve(res.data as T),
      fail: reject,
    });
  });
};
```

---

## When to Abstract

**Abstract when**:
- Same code appears 3+ times
- Logic is complex enough to have bugs
- Multiple people might need this

**Don't abstract when**:
- Only used once
- Trivial one-liner
- Abstraction would be more complex than duplication

---

## After Batch Modifications

When you've made similar changes to multiple files:

1. **Review**: Did you catch all instances?
2. **Search**: Run grep to find any missed
3. **Consider**: Should this be abstracted?

---

## Checklist Before Commit

- [ ] Searched for existing similar code
- [ ] No copy-pasted logic that should be shared
- [ ] Constants defined in one place
- [ ] Similar patterns follow same structure
- [ ] WeChat API calls use centralized utilities

---

## CC-DevFlow Integration

This guide is automatically loaded when:
- Creating new utility functions
- Adding new constants or configurations
- Task involves "refactor" or "extract"

Reference in `context.jsonl`:
```jsonl
{"file": "devflow/spec/guides/code-reuse-thinking.md", "reason": "New utility creation detected"}
```

---

## Related Constitution Articles

- **Article II**: Architectural Consistency - REUSE EXISTING CODE
- **Article V**: Maintainability - NO DEAD CODE
- **Article VII**: Simplicity Gate - MAXIMUM 3 PROJECTS
