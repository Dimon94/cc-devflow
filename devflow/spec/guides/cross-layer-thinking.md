# Cross-Layer Thinking Guide

> **Purpose**: Think through data flow across layers before implementing.
> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

---

## The Problem

**Most bugs happen at layer boundaries**, not within layers.

Common cross-layer bugs:
- API returns format A, frontend expects format B
- Database stores X, service transforms to Y, but loses data
- Multiple layers implement the same logic differently
- WeChat Mini Program API returns different format than expected

---

## Before Implementing Cross-Layer Features

### Step 1: Map the Data Flow

Draw out how data moves:

```
Source → Transform → Store → Retrieve → Transform → Display
```

For each arrow, ask:
- What format is the data in?
- What could go wrong?
- Who is responsible for validation?

### Step 2: Identify Boundaries

| Boundary | Common Issues |
|----------|---------------|
| API ↔ Service | Type mismatches, missing fields |
| Service ↔ Database | Format conversions, null handling |
| Backend ↔ Frontend | Serialization, date formats |
| Component ↔ Component | Props shape changes |
| WeChat API ↔ App | Response format, error codes |

### Step 3: Define Contracts

For each boundary:
- What is the exact input format?
- What is the exact output format?
- What errors can occur?

---

## Common Cross-Layer Mistakes

### Mistake 1: Implicit Format Assumptions

**Bad**: Assuming date format without checking

```typescript
// Bad: Assumes ISO format
const date = new Date(response.created_at);

// Good: Explicit format conversion
const date = dayjs(response.created_at, 'YYYY-MM-DD HH:mm:ss').toDate();
```

### Mistake 2: Scattered Validation

**Bad**: Validating the same thing in multiple layers

```typescript
// Bad: Validation in controller AND service AND model
// Controller
if (!email.includes('@')) throw new Error('Invalid email');
// Service
if (!email.includes('@')) throw new Error('Invalid email');
// Model
if (!email.includes('@')) throw new Error('Invalid email');

// Good: Validate once at entry point
// Controller (entry point)
const validatedData = validateInput(req.body);
// Service and Model trust the data
```

### Mistake 3: Leaky Abstractions

**Bad**: Component knows about database schema

```typescript
// Bad: Component knows DB column names
const userName = user.user_name; // snake_case from DB

// Good: Transform at boundary
// Service layer
return { userName: user.user_name }; // camelCase for frontend
```

### Mistake 4: WeChat Mini Program Specifics

**Bad**: Ignoring WeChat API response structure

```typescript
// Bad: Assuming direct data
const result = await wx.request({ url });
console.log(result.data);

// Good: Handle WeChat response structure
const result = await wx.request({ url });
if (result.statusCode !== 200) {
  throw new Error(`Request failed: ${result.statusCode}`);
}
const data = result.data;
```

---

## Checklist for Cross-Layer Features

### Before Implementation

- [ ] Mapped the complete data flow
- [ ] Identified all layer boundaries
- [ ] Defined format at each boundary
- [ ] Decided where validation happens
- [ ] Checked WeChat API documentation (if applicable)

### After Implementation

- [ ] Tested with edge cases (null, empty, invalid)
- [ ] Verified error handling at each boundary
- [ ] Checked data survives round-trip
- [ ] Tested on real device (WeChat Mini Program)

---

## When to Create Flow Documentation

Create detailed flow docs when:
- Feature spans 3+ layers
- Multiple teams are involved
- Data format is complex
- Feature has caused bugs before
- Involves WeChat payment or authentication

---

## CC-DevFlow Integration

This guide is automatically loaded when:
- Task description contains "API", "database", "frontend"
- TECH_DESIGN.md mentions cross-layer data flow
- Epic spans multiple modules

Reference in `context.jsonl`:
```jsonl
{"file": "devflow/spec/guides/cross-layer-thinking.md", "reason": "Cross-layer feature detected"}
```
