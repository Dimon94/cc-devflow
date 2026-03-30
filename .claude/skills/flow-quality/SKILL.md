---
name: flow-quality
description: 'Quality verification skill for current CC-DevFlow. Usage: /flow-quality [REQ-ID] [--full]'
version: 6.2.0
---

# Flow-Quality Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

为当前 CC-DevFlow 提供质量验证能力，聚合程序化检查与更深一层的质量证据。

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

1. `task-manifest.json` 已存在
2. 当前执行前沿已稳定
3. 相关测试可运行

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
Reports Generated (when REQ-ID resolved):
  - TEST_REPORT.md
  - SECURITY_REPORT.md
```

### Full Mode
```
✅ Quality Gate PASSED (Full Mode)
Reports Generated:
  - SPEC_REVIEW.md
  - CODE_QUALITY_REVIEW.md
  - SECURITY_REPORT.md
  - TEST_REPORT.md
```

## Next Step

```
/flow:verify "${REQ_ID}" 或 /flow:prepare-pr "${REQ_ID}"
```
