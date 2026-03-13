# Context Directory

此目录包含分阶段上下文注入的 JSONL 文件，用于 v4.3 架构。

## 文件说明

### brainstorm.jsonl
**阶段**: `/flow:init` (需求初始化)
**用途**: 头脑风暴和需求澄清
**包含**:
- proposal.md (原始意图)
- Constitution Article X (需求边界)
- BACKLOG.md (产品待办)

### spec.jsonl
**阶段**: `/flow:spec` (规格生成)
**用途**: 生成 design.md 和 Delta specs
**包含**:
- proposal.md (原始需求)
- devflow/specs/ (项目级规格，了解当前系统状态)
- Constitution Article I, X (质量优先、需求边界)
- spec-format-guide.md (规格格式指南)

### dev.jsonl
**阶段**: `/flow:dev` (开发执行)
**用途**: 实现任务
**包含**:
- design.md (技术设计)
- specs/ (Delta specs，本需求的变更)
- 相关代码文件 (实现上下文)
- Constitution Article I, VI (质量优先、测试优先)

## JSONL 格式

```jsonl
{"file": "path/to/file.md", "reason": "Why this file is needed", "optional": false}
{"file": "path/to/dir/", "reason": "Why this directory", "optional": true}
```

## 设计原则

1. **分阶段隔离**: 每个阶段只加载必要的上下文，避免注意力分散
2. **最小化原则**: 只包含当前阶段需要的文件
3. **排除策略**:
   - spec 阶段不包含现有代码（避免实现影响需求）
   - dev 阶段不包含 proposal.md（避免需求偏移）
4. **Constitution 引用**: 每个阶段引用相关的宪法条款

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
