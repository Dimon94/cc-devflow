# Hook Interface Contract: checklist-gate.js

**Version**: 1.0.0
**Created**: 2025-12-15T23:55:00+08:00
**Type**: JavaScript Hook Contract

---

## 1. Overview

`checklist-gate.js` 是 Epic 入口门检查 Hook，用于验证 Checklist 完成度是否达到门禁阈值。

---

## 2. Invocation

### 2.1 Command Line

```bash
node .claude/hooks/checklist-gate.js [OPTIONS]
```

### 2.2 Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--req-id` | string | 从环境变量获取 | 需求ID (REQ-XXX) |
| `--json` | flag | false | 输出JSON格式 |
| `--skip` | flag | false | 跳过门禁 |
| `--reason` | string | - | 跳过原因 (--skip时必需) |

### 2.3 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DEVFLOW_REQ_ID` | No | 需求ID (命令行参数优先) |

---

## 3. Input

### 3.1 File Dependencies

| File | Path | Description |
|------|------|-------------|
| Config | `config/quality-rules.yml` | 门禁阈值配置 |
| Checklists | `{REQ_DIR}/checklists/*.md` | Checklist文件 |
| Status | `{REQ_DIR}/orchestration_status.json` | 状态文件 |

### 3.2 Config Schema

```yaml
gate:
  threshold: 80      # Required: 0-100
  allow_skip: true   # Optional: default true
  require_reason: true  # Optional: default true
```

### 3.3 Checklist Format

```markdown
- [ ] CHK001 - Unchecked item
- [x] CHK002 - Checked item
- [X] CHK003 - Checked item (uppercase X)
```

---

## 4. Output

### 4.1 JSON Output (--json)

#### Gate Passed

```json
{
  "status": "PASS",
  "completion": 81.0,
  "threshold": 80,
  "details": {
    "total_items": 57,
    "checked_items": 46,
    "checklists": [
      {
        "file": "ux.md",
        "total": 20,
        "checked": 16,
        "percentage": 80
      },
      {
        "file": "api.md",
        "total": 22,
        "checked": 18,
        "percentage": 82
      },
      {
        "file": "security.md",
        "total": 15,
        "checked": 12,
        "percentage": 80
      }
    ]
  },
  "message": "Checklist completion 81% >= 80% threshold"
}
```

#### Gate Failed

```json
{
  "status": "FAIL",
  "completion": 75.0,
  "threshold": 80,
  "details": {
    "total_items": 57,
    "checked_items": 43,
    "checklists": [
      {
        "file": "ux.md",
        "total": 20,
        "checked": 14,
        "percentage": 70
      }
    ],
    "incomplete_items": [
      "ux.md: CHK001, CHK003, CHK005",
      "api.md: CHK010"
    ]
  },
  "message": "Checklist completion 75% < 80% threshold. Run /flow-checklist --status to review."
}
```

#### Gate Skipped

```json
{
  "status": "SKIPPED",
  "completion": 75.0,
  "threshold": 80,
  "skip_reason": "紧急发布",
  "audit_logged": true,
  "message": "Gate skipped with reason: 紧急发布"
}
```

#### No Checklists

```json
{
  "status": "NO_CHECKLISTS",
  "message": "No checklists found. Run /flow-checklist --type <type> first."
}
```

### 4.2 Text Output (default)

#### Gate Passed

```
✅ Checklist Gate: PASS
   Completion: 81% (46/57)
   Threshold: 80%

   Details:
   - ux.md: 80% (16/20)
   - api.md: 82% (18/22)
   - security.md: 80% (12/15)
```

#### Gate Failed

```
❌ Checklist Gate: FAIL
   Completion: 75% (43/57)
   Threshold: 80%

   Incomplete items:
   - ux.md: CHK001, CHK003, CHK005
   - api.md: CHK010

   To continue:
   1. Review and complete checklist items
   2. Run /flow-checklist --status to check progress
   3. Or use --skip-gate --reason "your reason" to bypass
```

---

## 5. Exit Codes

| Code | Status | Description |
|------|--------|-------------|
| 0 | PASS | Gate passed (completion >= threshold) |
| 0 | SKIPPED | Gate skipped with valid reason |
| 1 | FAIL | Gate failed (completion < threshold) |
| 2 | ERROR | Configuration or file error |

---

## 6. Side Effects

### 6.1 Status Update

On PASS or SKIPPED:
```json
{
  "checklist": {
    "gate_passed": true,
    "gate_skipped": false,
    "last_check_at": "2025-12-15T23:58:00+08:00"
  }
}
```

On SKIPPED:
```json
{
  "checklist": {
    "gate_passed": false,
    "gate_skipped": true,
    "skip_reason": "紧急发布",
    "last_check_at": "2025-12-15T23:58:00+08:00"
  }
}
```

### 6.2 Audit Log

On SKIPPED, appends to EXECUTION_LOG.md:
```markdown
### 2025-12-15 23:58:00 (周日)
**Event**: Gate Skipped
**Actor**: user
**Completion**: 75%
**Threshold**: 80%
**Reason**: 紧急发布
**Command**: /flow-epic --skip-gate --reason "紧急发布"
```

---

## 7. Algorithm

### 7.1 Completion Calculation

```javascript
// C001 Decision: sum(checked) / sum(total)
function calculateCompletion(checklists) {
  let totalItems = 0;
  let checkedItems = 0;

  for (const file of checklists) {
    const content = fs.readFileSync(file, 'utf-8');
    // Count all checkbox items
    const totalMatches = content.match(/^- \[[ xX]\]/gm) || [];
    // Count checked items (case-insensitive)
    const checkedMatches = content.match(/^- \[[xX]\]/gm) || [];

    totalItems += totalMatches.length;
    checkedItems += checkedMatches.length;
  }

  return {
    total: totalItems,
    checked: checkedItems,
    percentage: totalItems > 0 ? (checkedItems / totalItems) * 100 : 0
  };
}
```

### 7.2 Gate Decision

```javascript
function checkGate(completion, threshold, skipReason) {
  if (skipReason) {
    return { status: 'SKIPPED', reason: skipReason };
  }

  if (completion.percentage >= threshold) {
    return { status: 'PASS' };
  }

  return { status: 'FAIL' };
}
```

---

## 8. Error Handling

### 8.1 Config Not Found

```json
{
  "status": "ERROR",
  "error": "CONFIG_NOT_FOUND",
  "message": "config/quality-rules.yml not found. Using default threshold: 80%"
}
```

*Note: Falls back to default threshold 80%*

### 8.2 Invalid Config

```json
{
  "status": "ERROR",
  "error": "INVALID_CONFIG",
  "message": "Invalid YAML in config/quality-rules.yml"
}
```

### 8.3 Checklist Parse Error

```json
{
  "status": "ERROR",
  "error": "PARSE_ERROR",
  "message": "Failed to parse checklists/ux.md: Invalid format"
}
```

### 8.4 Skip Without Reason

When `--skip` is used without `--reason`:

```json
{
  "status": "ERROR",
  "error": "SKIP_REASON_REQUIRED",
  "message": "--reason is required when using --skip"
}
```

**Exit Code**: `2`

---

## 9. Integration with flow-epic.md

### 9.1 Entry Gate Invocation

In `flow-epic.md`:

```markdown
## Entry Gate

3. Checklist Gate (if checklist_complete in orchestration_status.json)
   → Run: node .claude/hooks/checklist-gate.js --req-id {REQ_ID} --json
   → If status == "FAIL" and no --skip-gate:
     → ERROR: Display message, suggest /flow-checklist --status
   → If --skip-gate provided:
     → Validate --reason is present
     → Run: node .claude/hooks/checklist-gate.js --req-id {REQ_ID} --skip --reason "{reason}"
```

### 9.2 Skip Gate Flow

```bash
# User command
/flow-epic --skip-gate --reason "紧急发布"

# Internal invocation
node .claude/hooks/checklist-gate.js --req-id REQ-002 --skip --reason "紧急发布"
```

---

## 10. Testing Scenarios

### 10.1 Unit Tests

| Test | Input | Expected Output |
|------|-------|-----------------|
| Calculate completion | 46 checked / 57 total | 80.7% |
| Gate pass | 81% completion, 80% threshold | status: PASS |
| Gate fail | 75% completion, 80% threshold | status: FAIL |
| Skip with reason | --skip --reason "test" | status: SKIPPED, audit logged |
| Skip without reason | --skip (no reason) | error: SKIP_REASON_REQUIRED |

### 10.2 Integration Tests

| Test | Setup | Command | Expected |
|------|-------|---------|----------|
| Empty checklists | No files in checklists/ | checklist-gate.js | NO_CHECKLISTS |
| Mixed completion | ux.md: 80%, api.md: 70% | checklist-gate.js | Reports global 75% |
| Config override | threshold: 70 in config | checklist-gate.js | Uses 70% threshold |

---

**Generated by**: tech-architect agent
**Version**: 1.0.0
