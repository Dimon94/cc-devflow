---
name: flow:import-openspec
description: Import OpenSpec spec.md and convert to CC-DevFlow format with TDD tasks
---

# /flow:import-openspec - OpenSpec 导入命令

## Purpose

从 OpenSpec 项目导入 spec.md 文件，转换为 CC-DevFlow 格式，自动补充 TDD 任务。

## Usage

```bash
/flow:import-openspec "<openspec-path>" --req-id "REQ-123" --title "功能标题"
```

## Parameters

- `<openspec-path>`: OpenSpec spec.md 文件的绝对路径或相对路径
- `--req-id`: CC-DevFlow 需求 ID (必需)
- `--title`: 需求标题 (必需)

## Examples

```bash
# 导入 OpenSpec 认证模块
/flow:import-openspec "/path/to/openspec/changes/add-auth/specs/auth/spec.md" \
  --req-id "REQ-123" \
  --title "用户认证系统"

# 导入支付模块
/flow:import-openspec "./openspec/specs/payments/spec.md" \
  --req-id "REQ-124" \
  --title "支付功能"
```

## Workflow

```
1. 读取 OpenSpec spec.md
   ↓
2. 解析 OpenSpec 格式
   - Purpose
   - Requirements (with BDD scenarios)
   ↓
3. 转换为 CC-DevFlow 格式
   - 添加 YAML frontmatter
   - 保留 Purpose + Requirements
   - 添加 Design 部分 (标记 [NEEDS CLARIFICATION])
   - 自动生成 TDD 任务 (TEST + IMPL)
   - 生成 Verification 清单
   ↓
4. 写入 devflow/requirements/{REQ-ID}/spec.md
   ↓
5. 输出转换结果
```

## OpenSpec Format (Input)

```markdown
# Module Name

## Purpose
High-level description of the module.

## Requirements

### Requirement: Feature Name
The system SHALL/MUST/SHOULD/MAY do something.

#### Scenario: Case Name
- GIVEN precondition
- WHEN action
- THEN expected result
- AND additional assertion
```

## CC-DevFlow Format (Output)

```markdown
---
req_id: "REQ-123"
title: "功能标题"
created_at: "2026-03-13T10:00:00Z"
updated_at: "2026-03-13T10:00:00Z"
version: "1.0.0"
status: "draft"
source: "openspec"
---

# Module Name

## Purpose
[Preserved from OpenSpec]

## Requirements
[Preserved from OpenSpec with BDD scenarios]

## Design
[NEEDS CLARIFICATION: 技术实现方案]

## Tasks
- [ ] T001 [TEST] Feature Name - 测试
- [ ] T002 [IMPL] Feature Name - 实现 (dependsOn:T001)

## Verification
- [ ] Feature Name
  - [ ] Scenario 1
  - [ ] Scenario 2
```

## Auto-Generated TDD Tasks

For each Requirement in OpenSpec:
1. **TEST task** (T001, T003, T005...)
2. **IMPL task** (T002, T004, T006...) with `dependsOn` to TEST

This ensures Constitution Article VI compliance (Test-First Development).

## Error Handling

```bash
# OpenSpec 文件不存在
Error: OpenSpec file not found: /path/to/spec.md

# REQ-ID 格式错误
Error: Invalid REQ-ID format. Expected: REQ-\d+

# REQ-ID 已存在
Error: REQ-123 already exists in devflow/requirements/
```

## Output

```json
{
  "success": true,
  "outputPath": "devflow/requirements/REQ-123/spec.md",
  "requirementsCount": 3,
  "tasksCount": 6
}
```

## Implementation

```bash
node .claude/scripts/import-openspec.js \
  "<openspec-path>" \
  "<req-id>" \
  "<title>" \
  "devflow/requirements/<req-id>/spec.md"
```

## Next Steps

After import:
1. Review generated spec.md
2. Fill in `[NEEDS CLARIFICATION]` sections in Design
3. Run `/flow:spec "REQ-123"` to generate task-manifest.json
4. Proceed with `/flow:dev "REQ-123"`

## Related Commands

- `/flow:export-openspec` - Export CC-DevFlow spec to OpenSpec format
- `/flow:spec` - Generate task-manifest from spec.md
- `/flow:init` - Initialize new requirement (alternative to import)

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
