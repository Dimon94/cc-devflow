---
name: flow:export-openspec
description: Export CC-DevFlow spec.md to OpenSpec format (pure requirements, no metadata)
---

# /flow:export-openspec - OpenSpec 导出命令

## Purpose

将 CC-DevFlow 的 spec.md 导出为 OpenSpec 格式，移除 CC-DevFlow 特定的元数据和实现细节。

## Usage

```bash
/flow:export-openspec "REQ-123" --output "<openspec-path>"
```

## Parameters

- `REQ-123`: CC-DevFlow 需求 ID (必需)
- `--output`: OpenSpec spec.md 输出路径 (必需)

## Examples

```bash
# 导出到 OpenSpec 项目
/flow:export-openspec "REQ-123" \
  --output "/path/to/openspec/changes/add-auth/specs/auth/spec.md"

# 导出到当前目录
/flow:export-openspec "REQ-124" \
  --output "./openspec-export/payments/spec.md"
```

## Workflow

```
1. 读取 devflow/requirements/{REQ-ID}/spec.md
   ↓
2. 解析 CC-DevFlow 格式
   - 跳过 YAML frontmatter
   - 提取 Purpose
   - 提取 Requirements (with BDD scenarios)
   - 忽略 Design / Tasks / Verification
   ↓
3. 转换为 OpenSpec 格式
   - 移除所有元数据
   - 移除 [NEEDS CLARIFICATION] 标记
   - 保留纯 Requirements
   ↓
4. 写入 OpenSpec spec.md
   ↓
5. 输出转换结果
```

## CC-DevFlow Format (Input)

```markdown
---
req_id: "REQ-123"
title: "用户认证系统"
created_at: "2026-03-13T10:00:00Z"
version: "1.0.0"
---

# Authentication Module

## Purpose
Provides secure authentication.

## Requirements

### Requirement: User Login
The system SHALL allow login.

#### Scenario: Valid credentials
- GIVEN a registered user
- WHEN the user submits credentials
- THEN a JWT token is issued

## Design
[NEEDS CLARIFICATION: Implementation details]

## Tasks
- [ ] T001 [TEST] User Login - 测试
- [ ] T002 [IMPL] User Login - 实现
```

## OpenSpec Format (Output)

```markdown
# Authentication Module

## Purpose
Provides secure authentication.

## Requirements

### Requirement: User Login
The system SHALL allow login.

#### Scenario: Valid credentials
- GIVEN a registered user
- WHEN the user submits credentials
- THEN a JWT token is issued
```

## What Gets Removed

- ❌ YAML frontmatter (req_id, title, version, etc.)
- ❌ `## Design` section
- ❌ `## Tasks` section
- ❌ `## Verification` section
- ❌ `[NEEDS CLARIFICATION]` markers
- ❌ TDD task annotations ([TEST], [IMPL])
- ❌ CC-DevFlow specific metadata

## What Gets Preserved

- ✅ Module name (# heading)
- ✅ `## Purpose` section
- ✅ `## Requirements` section
- ✅ Requirement names and descriptions
- ✅ BDD scenarios (Given-When-Then)
- ✅ RFC 2119 keywords (SHALL, MUST, SHOULD, MAY)

## Error Handling

```bash
# REQ-ID 不存在
Error: REQ-123 not found in devflow/requirements/

# spec.md 不存在
Error: spec.md not found for REQ-123

# 输出目录不可写
Error: Cannot write to /path/to/openspec/
```

## Output

```json
{
  "success": true,
  "outputPath": "/path/to/openspec/changes/add-auth/specs/auth/spec.md",
  "requirementsCount": 3
}
```

## Implementation

```bash
node .claude/scripts/export-openspec.js \
  "devflow/requirements/<req-id>/spec.md" \
  "<output-path>"
```

## Use Cases

### 1. 贡献到 OpenSpec 项目

```bash
# 在 CC-DevFlow 中开发完成
/flow:dev "REQ-123"
/flow:verify "REQ-123"

# 导出为 OpenSpec 格式
/flow:export-openspec "REQ-123" \
  --output "/path/to/openspec/changes/add-feature/specs/module/spec.md"

# 提交到 OpenSpec 项目
cd /path/to/openspec
git add changes/add-feature/
git commit -m "Add feature specification"
```

### 2. 共享需求规格

```bash
# 导出纯需求文档（无实现细节）
/flow:export-openspec "REQ-124" \
  --output "./shared-specs/payments.md"

# 分享给产品团队或其他项目
```

### 3. 需求归档

```bash
# 导出为标准格式归档
/flow:export-openspec "REQ-125" \
  --output "./archive/specs/feature-v1.0.md"
```

## Round-Trip Compatibility

OpenSpec ↔ CC-DevFlow 双向转换保持需求完整性：

```bash
# Import: OpenSpec → CC-DevFlow
/flow:import-openspec "openspec/spec.md" --req-id "REQ-123" --title "Feature"
  → 生成 spec.md + 自动补充 TDD 任务

# Develop in CC-DevFlow
/flow:spec "REQ-123"
/flow:dev "REQ-123"

# Export: CC-DevFlow → OpenSpec
/flow:export-openspec "REQ-123" --output "openspec/spec.md"
  → 移除实现细节，保留纯需求
```

## Related Commands

- `/flow:import-openspec` - Import OpenSpec spec to CC-DevFlow
- `/flow:spec` - Generate task-manifest from spec.md
- `/flow:archive` - Archive completed requirements

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
