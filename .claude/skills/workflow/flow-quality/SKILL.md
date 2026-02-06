---
name: flow-quality
description: 'Combined quality verification (replaces flow-review + flow-qa). Usage: /flow-quality [REQ-ID] [--full]'
version: 3.0.0
---

# Flow-Quality Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

合并的质量验证命令，替代 `/flow-review` 和 `/flow-qa`。

## Input Format

```
/flow-quality [REQ-ID]           # Quick mode (default)
/flow-quality [REQ-ID] --full    # Full mode
```

## Modes

### Quick Mode (Default)

快速程序化验证:
1. Lint Check - `npm run lint`
2. Type Check - `npm run typecheck`
3. Unit Tests - `npm test`

**Duration**: ~1-2 分钟

### Full Mode (`--full`)

全面审查:
1. 程序化检查 (同 Quick)
2. Spec Compliance Review
3. Code Quality Review
4. Security Scan
5. Integration Tests

**Duration**: ~5-10 分钟

## Entry Gate

1. **development_complete**: true
2. **TASKS.md**: 所有任务标记 [x]
3. **Tests**: 全部通过

## Exit Gate

### Quick Mode
- lint: pass
- typecheck: pass
- tests: pass

### Full Mode
- lint: pass
- typecheck: pass
- tests: pass
- spec_review: PASS
- code_quality: PASS
- security: no high-severity issues

## Output

### Quick Mode
```
✅ Quality Gate PASSED (Quick Mode)
  ✓ Lint Check
  ✓ Type Check
  ✓ Unit Tests
```

### Full Mode
```
✅ Quality Gate PASSED (Full Mode)
Reports Generated:
  - SPEC_REVIEW.md
  - CODE_QUALITY_REVIEW.md
  - SECURITY_REPORT.md
```

## Deprecation Notice

v3.0 废弃命令:
- `/flow-review` → 使用 `/flow-quality --full`
- `/flow-qa` → 使用 `/flow-quality --full`

## Next Step

```
/flow-release "${REQ_ID}"
```
