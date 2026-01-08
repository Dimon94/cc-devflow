# Error Log: ${REQ_ID}

> 本文件记录需求开发过程中遇到的所有错误及解决方案。
> **[PROTOCOL]**: 遇到错误时立即追加，不要等到最后。

---

## 错误记录格式

每条错误记录遵循以下结构：

```markdown
## [TIMESTAMP] E###: TITLE

**Phase**: flow-dev / T### 或 flow-qa / 测试名
**Error Type**: Test Failure | Build Error | Runtime Error | Type Error | Lint Error
**Error Message**:
\`\`\`
完整错误信息
\`\`\`

**Root Cause**: 根因分析（解决后填写）
**Resolution**: 解决方案（解决后填写）
**Prevention**: 预防措施（可选，防止再犯）
```

---

## 示例记录

## [2026-01-08T10:30:00] E001: Test Failure - Email Validation

**Phase**: flow-dev / T003
**Error Type**: Test Failure
**Error Message**:
```
FAIL src/auth/login.test.ts
  × should validate email format
    Expected: true
    Received: false

    at Object.<anonymous> (src/auth/login.test.ts:25:20)
```

**Root Cause**: 正则表达式未处理 + 号邮箱（如 user+tag@example.com）
**Resolution**: 更新正则为 `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
**Prevention**: 添加 + 号邮箱到测试用例，扩充边界测试

---

## [2026-01-08T11:15:00] E002: Build Error - Missing Import

**Phase**: flow-dev / T005
**Error Type**: Build Error
**Error Message**:
```
ERROR in src/components/UserProfile.tsx
Module not found: Can't resolve '@/utils/formatDate'
```

**Root Cause**: formatDate 函数移动到 @/utils/date 但未更新 import
**Resolution**: 更新 import 路径为 `@/utils/date`
**Prevention**: 使用 IDE 重构功能移动文件，自动更新引用

---

## 统计信息

| 指标 | 值 |
|------|-----|
| 总错误数 | 0 |
| 已解决 | 0 |
| 待解决 | 0 |
| 最常见类型 | - |

> 注：此统计在开发结束时手动更新

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
