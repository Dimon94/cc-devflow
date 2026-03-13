# design.md Template

> **Purpose**: 技术设计文档模板，描述怎么做
> **Location**: `devflow/requirements/${REQ_ID}/design.md`
> **Version**: v4.3.0

---

```markdown
---
req_id: "${REQ_ID}"
title: "${TITLE}"
created_at: "${CREATED_AT}"
updated_at: "${UPDATED_AT}"
version: "1.0.0"
status: "draft"
---

# ${TITLE} - Technical Design

## How（怎么做）

[NEEDS CLARIFICATION: 技术方案是什么？如何实现？]

### Architecture Overview

${架构概述}

### Technology Stack

- **Frontend**: ${前端技术栈}
- **Backend**: ${后端技术栈}
- **Database**: ${数据库选型}
- **Infrastructure**: ${基础设施}

### Module Changes

${受影响的模块列表}

- `${MODULE_1}`: ${变更说明}
- `${MODULE_2}`: ${变更说明}

## Implementation（实现细节）

[NEEDS CLARIFICATION: 具体实现步骤是什么？]

### API Design

#### Endpoints

- `${METHOD} ${PATH}` - ${描述}
  - Request: `${REQUEST_SCHEMA}`
  - Response: `${RESPONSE_SCHEMA}`

### Data Model

```sql
${数据库 Schema 变更}
```

### File Structure

```
${受影响的文件列表}
├── ${FILE_1}  # ${说明}
├── ${FILE_2}  # ${说明}
└── ${FILE_3}  # ${说明}
```

### Dependencies

${新增或更新的依赖}

- `${PACKAGE_1}@${VERSION}` - ${用途}
- `${PACKAGE_2}@${VERSION}` - ${用途}

## Testing Strategy

### Test Coverage

- [ ] Unit Tests: ${覆盖范围}
- [ ] Integration Tests: ${覆盖范围}
- [ ] E2E Tests: ${覆盖范围}

### Test Scenarios

1. **${SCENARIO_1}**: ${测试描述}
2. **${SCENARIO_2}**: ${测试描述}

## Security Considerations

${安全考虑}

- **Authentication**: ${认证方案}
- **Authorization**: ${授权方案}
- **Data Protection**: ${数据保护措施}

## Performance Considerations

${性能考虑}

- **Expected Load**: ${预期负载}
- **Optimization Strategy**: ${优化策略}
- **Caching**: ${缓存策略}

## Rollout Plan

### Phase 1: ${阶段 1 名称}
${阶段 1 描述}

### Phase 2: ${阶段 2 名称}
${阶段 2 描述}

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| ${风险 1} | ${影响} | ${缓解措施} |
| ${风险 2} | ${影响} | ${缓解措施} |

---

## Constitutional Constraints

- **Article I: Quality First** - 完整实现或不实现，禁止部分实现
- **Article VI: Test-First Development** - 测试必须在实现之前
- **Article X: Requirement Boundary** - 只实现明确请求的功能

详见 `.claude/rules/project-constitution.md`
```

---

## Field Descriptions

| Field | Description | Example |
|-------|-------------|---------|
| `req_id` | 需求 ID | "REQ-123" |
| `title` | 需求标题 | "添加用户认证" |
| `created_at` | 创建时间 (ISO 8601) | "2026-03-12T10:00:00Z" |
| `updated_at` | 更新时间 (ISO 8601) | "2026-03-12T15:30:00Z" |
| `version` | 文档版本 | "1.0.0" |
| `status` | 状态 | "draft", "approved", "implemented" |

## How vs Implementation

- **How**: 回答"技术方案是什么"，聚焦架构和选型
- **Implementation**: 回答"具体怎么实现"，聚焦细节和步骤

## [NEEDS CLARIFICATION] 标记

所有模糊点必须标记为 `[NEEDS CLARIFICATION: 具体问题]`，等待用户澄清。

---

**Version**: v4.3.0
**Related**: SPEC_TEMPLATE_DELTA.md（Delta specs 生成）
