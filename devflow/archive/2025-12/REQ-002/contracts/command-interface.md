# Command Interface Contract: /flow-checklist

**Version**: 1.0.0
**Created**: 2025-12-15T23:55:00+08:00
**Type**: CLI Command Contract

---

## 1. Command Synopsis

```bash
/flow-checklist [OPTIONS]
```

**Purpose**: 生成和管理需求质量检查清单 ("Unit Tests for English")

---

## 2. Options

| Option | Type | Default | Required | Description |
|--------|------|---------|----------|-------------|
| `--type` | string (csv) | `general` | No | Checklist类型，支持逗号分隔 |
| `--status` | flag | - | No | 显示完成度统计 |
| `--mark` | string (csv) | - | No | 批量标记检查项为完成 |
| `--mark-all` | flag | - | No | 标记所有检查项为完成 |
| `--file` | string | - | No | 指定操作的Checklist文件 |
| `--help` | flag | - | No | 显示帮助信息 |

### 2.1 Valid Types (--type)

| Type | Description | Item Range |
|------|-------------|------------|
| `ux` | UX/UI 需求检查 | 15-30 |
| `api` | API 需求检查 | 15-30 |
| `security` | 安全需求检查 | 15-30 |
| `performance` | 性能需求检查 | 15-30 |
| `data` | 数据需求检查 | 15-30 |
| `general` | 通用需求检查 | 15-30 |

---

## 3. Use Cases

### 3.1 Generate Single Type Checklist

**Command**:
```bash
/flow-checklist --type ux
```

**Preconditions**:
- PRD.md exists in requirement directory
- checklists/ directory will be created if not exists

**Output** (stdout):
```
Generating UX Checklist...
Reading PRD.md...
Analyzing UX requirements...
Applying Anti-Example rules...

✅ Generated: checklists/ux.md
   Items: 18
   Dimensions: 5/5 (Completeness, Clarity, Consistency, Measurability, Coverage)
   Traceability: 85% (>=80% required)

Next: Review and check items, then run /flow-checklist --status
```

**Exit Code**: `0` (success)

**Side Effects**:
- Creates `checklists/ux.md`
- Updates `orchestration_status.json`
- Appends to `EXECUTION_LOG.md`

### 3.2 Generate Multiple Types

**Command**:
```bash
/flow-checklist --type ux,api,security
```

**Output** (stdout):
```
Generating multiple Checklists...

[1/3] UX Checklist...
✅ Generated: checklists/ux.md (18 items)

[2/3] API Checklist...
✅ Generated: checklists/api.md (22 items)

[3/3] Security Checklist...
✅ Generated: checklists/security.md (15 items)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary:
| Type     | Items Generated | Coverage |
|----------|-----------------|----------|
| ux       | 18              | 5/5      |
| api      | 22              | 5/5      |
| security | 15              | 4/5      |
| TOTAL    | 55              | -        |
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next: Review and check items, then run /flow-checklist --status
```

**Exit Code**: `0` (success)

### 3.3 Check Completion Status

**Command**:
```bash
/flow-checklist --status
```

**Preconditions**:
- At least one checklist file exists in checklists/

**Output** (stdout):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Checklist Completion Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
| Checklist | Complete | Total | Percentage |
|-----------|----------|-------|------------|
| ux.md     | 16       | 20    | 80%        |
| api.md    | 18       | 22    | 82%        |
| security  | 12       | 15    | 80%        |
|-----------|----------|-------|------------|
| OVERALL   | 46       | 57    | 81%        |
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Gate Threshold: 80%
Status: ✅ PASS (81% >= 80%)

Ready for: /flow-epic
```

**Exit Code**: `0` (pass) or `1` (fail threshold)

### 3.4 Batch Mark Items

**Command**:
```bash
/flow-checklist --mark CHK001,CHK002,CHK003
```

**Output** (stdout):
```
Marking items as complete...
✅ CHK001 marked complete in ux.md
✅ CHK002 marked complete in ux.md
✅ CHK003 marked complete in ux.md

Updated completion: 3 items marked
Run /flow-checklist --status to see updated completion
```

**Exit Code**: `0` (success)

### 3.5 Mark All Items (with file)

**Command**:
```bash
/flow-checklist --mark-all --file ux.md
```

**Output** (stdout):
```
Marking all items as complete in ux.md...
✅ 20 items marked complete

Run /flow-checklist --status to see updated completion
```

**Exit Code**: `0` (success)

---

## 4. Error Responses

### 4.1 Missing PRD

**Command**:
```bash
/flow-checklist --type ux
```

**Output** (stderr):
```
ERROR: MISSING_PRD
PRD.md not found in requirement directory.

Run /flow-prd first.
```

**Exit Code**: `1`

### 4.2 Invalid Type

**Command**:
```bash
/flow-checklist --type invalid
```

**Output** (stderr):
```
ERROR: INVALID_TYPE
Invalid checklist type: invalid

Valid types: ux, api, security, performance, data, general
```

**Exit Code**: `1`

### 4.3 No Checklists Found

**Command**:
```bash
/flow-checklist --status
```

**Output** (stderr):
```
ERROR: NO_CHECKLISTS
No checklists found in checklists/ directory.

Run /flow-checklist --type <type> first.
```

**Exit Code**: `1`

### 4.4 Item Not Found

**Command**:
```bash
/flow-checklist --mark CHK999
```

**Output** (stderr):
```
WARNING: ITEM_NOT_FOUND
Checklist item not found: CHK999. Skipped.
```

**Exit Code**: `0` (warning, not error)

---

## 5. Integration Points

### 5.1 Entry Gate (Prerequisites)

The command requires:
1. Requirement ID (from branch or DEVFLOW_REQ_ID)
2. PRD.md exists
3. orchestration_status.json exists

### 5.2 Exit Gate (Post-conditions)

After successful execution:
1. Checklist files created/updated
2. orchestration_status.json updated:
   - `checklist.generated_types` updated
   - `checklist.total_items` calculated
   - `checklist.completion_percentage` calculated
3. EXECUTION_LOG.md appended

### 5.3 Related Commands

| Command | Relationship |
|---------|--------------|
| `/flow-prd` | Prerequisite (generates PRD.md) |
| `/flow-epic` | Consumer (uses checklist gate) |
| `/flow-status` | Reader (displays checklist status) |

---

## 6. Configuration

### 6.1 Config File

```
config/quality-rules.yml
```

### 6.2 Key Settings

| Setting | Path | Default | Description |
|---------|------|---------|-------------|
| Threshold | `gate.threshold` | 80 | Minimum completion % |
| Allow Skip | `gate.allow_skip` | true | Allow --skip-gate |
| Min Items | `types.{type}.min_items` | 15 | Minimum items per type |
| Max Items | `types.{type}.max_items` | 30 | Maximum items per type |

---

## 7. Testing Scenarios

### 7.1 Happy Path Tests

| Test | Command | Expected |
|------|---------|----------|
| Generate single | `--type ux` | Creates ux.md with 15-30 items |
| Generate multiple | `--type ux,api` | Creates ux.md and api.md |
| Check status | `--status` | Shows completion table |
| Mark items | `--mark CHK001` | Updates checkbox |

### 7.2 Error Path Tests

| Test | Command | Expected |
|------|---------|----------|
| No PRD | `--type ux` (no PRD.md) | MISSING_PRD error |
| Invalid type | `--type foo` | INVALID_TYPE error |
| No checklists | `--status` (empty) | NO_CHECKLISTS error |

### 7.3 Edge Case Tests

| Test | Command | Expected |
|------|---------|----------|
| Append to existing | `--type ux` (ux.md exists) | Appends new items |
| Empty PRD | `--type general` (empty PRD) | Generates 5 basic items |
| 50+ items | `--type general` (large PRD) | Warning about high count |

---

**Generated by**: tech-architect agent
**Version**: 1.0.0
