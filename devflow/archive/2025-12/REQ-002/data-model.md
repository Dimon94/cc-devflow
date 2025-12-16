# Data Model: REQ-002 - /flow-checklist

**Version**: 1.0.0
**Created**: 2025-12-15T23:55:00+08:00
**Status**: Draft

---

## 1. Overview

本文档定义 `/flow-checklist` 命令的数据模型，包括：
- Checklist 文件格式 (Markdown)
- 质量规则配置 (YAML)
- 状态追踪扩展 (JSON)

---

## 2. Checklist File Format

### 2.1 File Location

```
devflow/requirements/{REQ-ID}/checklists/{type}.md
```

**Valid Types**:
- `ux.md` - UX/UI 需求检查
- `api.md` - API 需求检查
- `security.md` - 安全需求检查
- `performance.md` - 性能需求检查
- `data.md` - 数据需求检查
- `general.md` - 通用需求检查

### 2.2 File Structure

```markdown
# {TYPE} Checklist: {REQ-ID}

**Purpose**: {type}相关需求的质量检查
**Created**: {ISO-8601-timestamp}
**PRD Reference**: PRD.md
**Quality Dimensions**: Completeness, Clarity, Consistency, Measurability, Coverage

---

## {Category 1}

- [ ] CHK001 - {质量问句} [{Dimension}, {Reference}]
- [x] CHK002 - {质量问句} [{Dimension}]

## {Category 2}

- [ ] CHK003 - {质量问句} [{Dimension}, Spec §{section}]

---

## Notes

- Check items off as completed: `[x]`
- Items are numbered sequentially (CHK001-CHKnnn)
- Quality dimensions: [Completeness], [Clarity], [Consistency], [Measurability], [Coverage]
- References: [Spec §X.Y] for existing requirements, [Gap] for missing requirements
```

### 2.3 Checklist Item Format

**Pattern**:
```
- [ ] CHK{NNN} - {质量问句}? [{Dimension}, {Reference}]
```

**Components**:
| Component | Format | Description |
|-----------|--------|-------------|
| Checkbox | `[ ]` or `[x]` | 未完成 / 已完成 |
| ID | `CHK{NNN}` | 3位数字编号 (001-999) |
| Question | 质量问句 | 以问号结尾 |
| Dimension | `[{Dimension}]` | 5个维度之一 |
| Reference | `[Spec §{section}]` or `[Gap]` | 追溯引用 |

### 2.4 Quality Dimensions

| Dimension | 描述 | 问句模式 |
|-----------|------|----------|
| `Completeness` | 需求是否完整 | "Are ... defined/specified/documented?" |
| `Clarity` | 需求是否清晰 | "Is ... quantified/clarified with specific ...?" |
| `Consistency` | 需求是否一致 | "Are ... consistent between/across ...?" |
| `Measurability` | 需求是否可测量 | "Can ... be objectively measured/verified?" |
| `Coverage` | 场景是否覆盖 | "Are ... scenarios/cases addressed?" |

### 2.5 Reference Types

| Reference | 含义 | 使用场景 |
|-----------|------|----------|
| `[Spec §FR-XXX]` | 功能需求引用 | 检查现有需求的清晰度 |
| `[Spec §NFR-XXX]` | 非功能需求引用 | 检查性能/安全等需求 |
| `[Gap]` | 缺失需求 | 检查是否有未定义的需求 |
| `[Ambiguity]` | 歧义标记 | 需要澄清的模糊表述 |
| `[Conflict]` | 冲突标记 | 需求之间的不一致 |
| `[Assumption]` | 假设标记 | 需要验证的假设 |

### 2.6 Example Checklist

```markdown
# UX Checklist: REQ-002

**Purpose**: UX/UI 相关需求的质量检查
**Created**: 2025-12-15T23:55:00+08:00
**PRD Reference**: PRD.md
**Quality Dimensions**: Completeness, Clarity, Consistency, Measurability, Coverage

---

## Requirement Completeness

- [ ] CHK001 - Are all command output formats documented? [Completeness, Spec §Story-1]
- [ ] CHK002 - Are success/error message templates defined? [Completeness, Gap]
- [x] CHK003 - Are all valid types explicitly listed? [Completeness, Spec §技术约束]

## Requirement Clarity

- [ ] CHK004 - Is 'fast response' quantified with specific timing? [Clarity, Spec §NFR-性能]
- [ ] CHK005 - Are checklist item formats clearly specified? [Clarity, Spec §Story-1]

## Requirement Consistency

- [ ] CHK006 - Are error codes consistent across all commands? [Consistency]
- [x] CHK007 - Are quality dimensions consistent with spec-kit? [Consistency]

## Acceptance Criteria Quality

- [ ] CHK008 - Can '80% threshold' be objectively measured? [Measurability, Spec §R002]
- [ ] CHK009 - Are acceptance criteria in Given-When-Then format? [Measurability]

## Scenario Coverage

- [ ] CHK010 - Are edge cases defined for empty PRD? [Coverage, Gap]
- [ ] CHK011 - Are concurrent user scenarios addressed? [Coverage, Gap]

---

## Notes

- Check items off as completed: `[x]`
- Items are numbered sequentially (CHK001-CHKnnn)
```

---

## 3. Quality Rules Configuration

### 3.1 File Location

```
config/quality-rules.yml
```

### 3.2 Schema Definition

```yaml
# JSON Schema representation (for validation)
type: object
required:
  - gate
  - types
  - dimensions
properties:
  gate:
    type: object
    required:
      - threshold
    properties:
      threshold:
        type: integer
        minimum: 0
        maximum: 100
        description: "Minimum completion percentage"
      allow_skip:
        type: boolean
        default: true
      require_reason:
        type: boolean
        default: true

  types:
    type: object
    additionalProperties:
      type: object
      required:
        - name
        - description
        - min_items
        - max_items
      properties:
        name:
          type: string
        description:
          type: string
        min_items:
          type: integer
          minimum: 5
        max_items:
          type: integer
          maximum: 50
        dimensions:
          type: array
          items:
            type: string
            enum:
              - Completeness
              - Clarity
              - Consistency
              - Measurability
              - Coverage

  dimensions:
    type: object
    additionalProperties:
      type: object
      properties:
        pattern:
          type: string
        anti_pattern:
          type: string

  anti_example:
    type: object
    properties:
      prohibited:
        type: array
        items:
          type: string
      required:
        type: array
        items:
          type: string

  output:
    type: object
    properties:
      id_format:
        type: string
        default: "CHK{:03d}"
      min_dimension_coverage:
        type: integer
        default: 4
      min_traceability:
        type: integer
        default: 80
```

### 3.3 Default Configuration

```yaml
gate:
  threshold: 80
  allow_skip: true
  require_reason: true

types:
  ux:
    name: "UX Requirements"
    description: "User experience and interface requirements"
    min_items: 15
    max_items: 30
    dimensions: [Completeness, Clarity, Consistency, Measurability, Coverage]

  api:
    name: "API Requirements"
    description: "API endpoints and data contracts"
    min_items: 15
    max_items: 30
    dimensions: [Completeness, Clarity, Consistency, Measurability, Coverage]

  security:
    name: "Security Requirements"
    description: "Authentication, authorization, data protection"
    min_items: 15
    max_items: 30
    dimensions: [Completeness, Clarity, Consistency, Measurability, Coverage]

  performance:
    name: "Performance Requirements"
    description: "Response time, throughput, scalability"
    min_items: 15
    max_items: 30
    dimensions: [Completeness, Clarity, Consistency, Measurability, Coverage]

  data:
    name: "Data Requirements"
    description: "Data models, storage, validation"
    min_items: 15
    max_items: 30
    dimensions: [Completeness, Clarity, Consistency, Measurability, Coverage]

  general:
    name: "General Requirements"
    description: "Overall requirement quality"
    min_items: 15
    max_items: 30
    dimensions: [Completeness, Clarity, Consistency, Measurability, Coverage]

dimensions:
  Completeness:
    pattern: "Are .* defined|specified|documented"
    anti_pattern: "Verify|Test|Check|Confirm"
  Clarity:
    pattern: "Is .* quantified|clarified with specific"
    anti_pattern: "works|functions|renders"
  Consistency:
    pattern: "Are .* consistent between|across"
    anti_pattern: "correctly|properly"
  Measurability:
    pattern: "Can .* be objectively measured|verified"
    anti_pattern: "click|navigate|load"
  Coverage:
    pattern: "Are .* scenarios|cases addressed"
    anti_pattern: "displays|shows|returns"

anti_example:
  prohibited:
    - "^Verify"
    - "^Test"
    - "^Confirm"
    - "^Check that"
    - "works correctly"
    - "functions properly"
  required:
    - "Are .* defined"
    - "Is .* quantified"
    - "Can .* be measured"

output:
  id_format: "CHK{:03d}"
  min_dimension_coverage: 4
  min_traceability: 80
```

---

## 4. Status Schema Extension

### 4.1 File Location

```
devflow/requirements/{REQ-ID}/orchestration_status.json
```

### 4.2 New Fields

```json
{
  "checklist_complete": boolean,
  "checklist": {
    "generated_types": string[],
    "total_items": integer,
    "checked_items": integer,
    "completion_percentage": number,
    "gate_passed": boolean,
    "gate_skipped": boolean,
    "skip_reason": string | null,
    "generated_at": string (ISO-8601),
    "last_check_at": string (ISO-8601)
  }
}
```

### 4.3 Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `checklist_complete` | boolean | Checklist 阶段是否完成 |
| `checklist.generated_types` | string[] | 已生成的 Checklist 类型列表 |
| `checklist.total_items` | integer | 所有 Checklist 检查项总数 |
| `checklist.checked_items` | integer | 已勾选的检查项数量 |
| `checklist.completion_percentage` | number | 完成百分比 (0-100) |
| `checklist.gate_passed` | boolean | 是否通过门禁 |
| `checklist.gate_skipped` | boolean | 是否跳过门禁 |
| `checklist.skip_reason` | string? | 跳过门禁的原因 |
| `checklist.generated_at` | ISO-8601 | Checklist 生成时间 |
| `checklist.last_check_at` | ISO-8601 | 最后完成度检查时间 |

### 4.4 Example Status

```json
{
  "reqId": "REQ-002",
  "title": "flow-checklist 需求质量检查命令",
  "status": "checklist_complete",
  "phase": "planning",
  "phase0_complete": true,
  "clarify_complete": true,
  "prd_complete": true,
  "checklist_complete": true,
  "checklist": {
    "generated_types": ["ux", "api", "security"],
    "total_items": 57,
    "checked_items": 46,
    "completion_percentage": 80.7,
    "gate_passed": true,
    "gate_skipped": false,
    "skip_reason": null,
    "generated_at": "2025-12-15T23:55:00+08:00",
    "last_check_at": "2025-12-15T23:58:00+08:00"
  },
  "createdAt": "2025-12-15T21:52:17+08:00",
  "updatedAt": "2025-12-15T23:58:00+08:00"
}
```

---

## 5. Audit Log Format

### 5.1 File Location

```
devflow/requirements/{REQ-ID}/EXECUTION_LOG.md
```

### 5.2 Event Types

| Event | Description |
|-------|-------------|
| `Checklist Generated` | 新 Checklist 生成 |
| `Checklist Status Checked` | 完成度检查 |
| `Gate Passed` | 门禁通过 |
| `Gate Failed` | 门禁失败 |
| `Gate Skipped` | 门禁跳过 (含原因) |
| `Items Marked` | 检查项批量标记 |

### 5.3 Log Format

```markdown
### 2025-12-15 23:55:00 (周日)
**Event**: Checklist Generated
**Type**: ux
**Items**: 18
**Dimensions**: 5/5
**Traceability**: 85%

### 2025-12-15 23:58:00 (周日)
**Event**: Gate Passed
**Completion**: 81%
**Threshold**: 80%
**Checklists**: ux.md, api.md, security.md

### 2025-12-16 00:05:00 (周一)
**Event**: Gate Skipped
**Actor**: user
**Completion**: 75%
**Threshold**: 80%
**Reason**: 紧急发布
**Command**: /flow-epic --skip-gate --reason "紧急发布"
```

---

## 6. Validation Rules

### 6.1 Checklist File Validation

```bash
# 验证 Checklist 文件格式
validate_checklist() {
    local file="$1"

    # 1. 检查文件存在
    [[ -f "$file" ]] || return 1

    # 2. 检查必要标题
    grep -q "^# .* Checklist:" "$file" || return 1

    # 3. 检查元数据
    grep -q "^\*\*Purpose\*\*:" "$file" || return 1
    grep -q "^\*\*Created\*\*:" "$file" || return 1

    # 4. 检查至少有检查项
    grep -q "^\- \[" "$file" || return 1

    # 5. 检查ID格式 (CHK + 3位数字)
    if grep -E "^\- \[.\] " "$file" | grep -v "CHK[0-9]{3}"; then
        return 1
    fi

    return 0
}
```

### 6.2 Config File Validation

```bash
# 验证 quality-rules.yml 格式
validate_config() {
    local file="$1"

    # 1. 检查文件存在
    [[ -f "$file" ]] || return 1

    # 2. 检查YAML语法 (使用yq或python)
    yq -e '.' "$file" >/dev/null 2>&1 || return 1

    # 3. 检查必要字段
    yq -e '.gate.threshold' "$file" >/dev/null 2>&1 || return 1
    yq -e '.types' "$file" >/dev/null 2>&1 || return 1

    # 4. 检查阈值范围
    local threshold
    threshold=$(yq '.gate.threshold' "$file")
    [[ "$threshold" -ge 0 && "$threshold" -le 100 ]] || return 1

    return 0
}
```

### 6.3 Anti-Example Validation

```bash
# 验证检查项不违反 Anti-Example 规则
validate_anti_example() {
    local item="$1"

    # 禁止的模式 (测试实现而非需求)
    local prohibited=(
        "^Verify"
        "^Test"
        "^Confirm"
        "^Check that"
        "works correctly"
        "functions properly"
        "displays correctly"
    )

    for pattern in "${prohibited[@]}"; do
        if echo "$item" | grep -qE "$pattern"; then
            return 1  # 违反Anti-Example
        fi
    done

    return 0  # 通过验证
}
```

---

**Generated by**: tech-architect agent
**Version**: 1.0.0
