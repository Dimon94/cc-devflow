# /flow-checklist - 需求质量检查命令

## Usage
```
/flow-checklist [OPTIONS]
```

## Purpose
生成和管理需求质量检查清单 - "Unit Tests for English"。
对需求文档进行质量测试，确保需求完整性、清晰性、一致性、可测量性和场景覆盖。

## Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--type` | string | `general` | Checklist 类型，支持逗号分隔多类型 |
| `--status` | flag | - | 显示完成度统计 |
| `--mark` | string | - | 批量标记检查项为完成 (CHK001,CHK002) |
| `--mark-all` | flag | - | 标记所有检查项为完成 |
| `--file` | string | - | 指定操作的 Checklist 文件 |
| `--help` | flag | - | 显示帮助信息 |

## Valid Types
- `ux`: UX/UI 需求检查
- `api`: API 需求检查
- `security`: 安全需求检查
- `performance`: 性能需求检查
- `data`: 数据需求检查
- `general`: 通用需求检查 (默认)

## Entry Gate
1. 验证 `PRD.md` 存在
2. 验证 `orchestration_status.json.prd_complete == true`
3. 创建 `checklists/` 目录 (如不存在)

## Execution Flow

### Generate Checklist (--type)

```
1. Parse --type parameter
   → Split by comma if multiple types
   → Validate each type against valid_types

2. For each type:
   a. Read PRD.md content
   b. Invoke checklist-agent.md with:
      - prd_content: PRD.md 内容
      - type: Checklist 类型
      - config: quality-rules.yml 配置
   c. Agent generates checklist items (15-30 items)
   d. Write to checklists/{type}.md
   e. If file exists: Append mode (继续编号)

3. Output summary:
   → Items generated per type
   → Dimension coverage (5/5)
   → Traceability percentage

4. Update orchestration_status.json:
   → checklist.generated_types[]
   → checklist.total_items
   → checklist.generated_at
```

### Check Status (--status)

```
1. Run calculate-checklist-completion.sh --json
   → Scan checklists/*.md
   → Count [x] and [ ] items

2. Display completion table:
   | Checklist | Complete | Total | Percentage |
   |-----------|----------|-------|------------|
   | ux.md     | 16       | 20    | 80%        |
   | OVERALL   | 46       | 57    | 81%        |

3. Compare to threshold (from quality-rules.yml)
   → PASS: completion >= threshold
   → FAIL: completion < threshold

4. Update orchestration_status.json:
   → checklist.checked_items
   → checklist.completion_percentage
   → checklist.last_check_at
```

### Mark Items (--mark)

```
1. Parse --mark parameter
   → Split by comma
   → Validate each ID format (CHK + 3 digits)

2. For each ID:
   a. Search checklists/*.md for CHK{NNN}
   b. If found: Replace "- [ ]" with "- [x]"
   c. If not found: Output warning

3. Output:
   → "Updated completion: N items marked"
   → "Run /flow-checklist --status to see updated completion"
```

### Mark All (--mark-all --file)

```
1. Validate --file parameter exists
2. Read specified file
3. Replace all "- [ ]" with "- [x]"
4. Output item count
```

## Exit Gate
1. 如果生成了新 Checklist:
   - 更新 `orchestration_status.json.checklist`
   - 追加事件到 `EXECUTION_LOG.md`
2. 输出下一步提示

## Output Examples

### Generate Single Type
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

### Generate Multiple Types
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

### Check Status
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

## Error Handling

### MISSING_PRD
```
ERROR: MISSING_PRD
PRD.md not found in requirement directory.

Run /flow-prd first.
```

### INVALID_TYPE
```
ERROR: INVALID_TYPE
Invalid checklist type: {type}

Valid types: ux, api, security, performance, data, general
```

### NO_CHECKLISTS
```
ERROR: NO_CHECKLISTS
No checklists found in checklists/ directory.

Run /flow-checklist --type <type> first.
```

## Append Mode (T011)

When running `--type {type}` and `checklists/{type}.md` already exists:

1. Read existing file
2. Find highest CHK number (e.g., CHK018)
3. Generate new items starting from next number (CHK019)
4. Append new items to existing file
5. Preserve existing structure and checked items

## EXECUTION_LOG Events (T012)

### Checklist Generated
```markdown
### 2025-12-15 23:55:00 (周日)
**Event**: Checklist Generated
**Type**: ux
**Items**: 18
**Dimensions**: 5/5
**Traceability**: 85%
```

### Status Checked
```markdown
### 2025-12-15 23:58:00 (周日)
**Event**: Checklist Status Checked
**Completion**: 81%
**Threshold**: 80%
**Status**: PASS
```

## Related Commands

| Command | Relationship |
|---------|--------------|
| `/flow-prd` | Prerequisite (generates PRD.md) |
| `/flow-epic` | Consumer (uses checklist gate) |
| `/flow-status` | Reader (displays checklist status) |

## Configuration

Config file: `config/quality-rules.yml`

Key settings:
- `gate.threshold`: Minimum completion % (default: 80)
- `types.{type}.min_items`: Minimum items per type (default: 15)
- `types.{type}.max_items`: Maximum items per type (default: 30)
