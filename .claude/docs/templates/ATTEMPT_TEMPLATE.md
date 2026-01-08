# Research Attempt Template

> 本模板用于记录研究阶段的失败尝试。失败是学习数据，记录下来避免重复错误。

---

## 文件命名规范

```
research/attempts/NNN-descriptive-name.md
```

**示例**:
- `001-graphql-approach.md` - 尝试 GraphQL，因性能问题放弃
- `002-rest-pagination.md` - 尝试偏移分页，改用游标分页
- `003-redis-cache.md` - 尝试 Redis 缓存，因成本放弃

---

## 模板内容

```markdown
# Attempt: [方案名]

**Date**: YYYY-MM-DD
**Context**: 解决 [什么问题]

## Approach

[描述尝试的方案]

## Result

❌ 失败 / ⚠️ 部分成功 / 🔄 放弃

## Reason

[为什么不行]

## Learning

[下次应该注意什么]

## References

- [相关文档链接]
- [相关代码片段]
```

---

## 示例 1: 放弃 GraphQL

```markdown
# Attempt: GraphQL API Architecture

**Date**: 2026-01-08
**Context**: 解决前后端 API 通信，考虑使用 GraphQL 代替 REST

## Approach

使用 Apollo Server + GraphQL Schema 定义 API：
- 单一端点 /graphql
- 客户端按需查询字段
- 减少 over-fetching 和 under-fetching

## Result

🔄 放弃

## Reason

1. **学习曲线**: 团队对 GraphQL 不熟悉，估计学习时间 2 周
2. **工具链复杂**: 需要 Apollo Client, Codegen, Schema Stitching
3. **Overkill**: 当前需求只有 5 个简单 CRUD 端点，REST 足够
4. **成本**: GraphQL 服务器性能优化成本高（N+1 查询问题）

## Learning

- **YAGNI**: GraphQL 解决的问题（灵活查询、版本管理）当前不存在
- **下次应该**: 先用 REST，等到真正需要灵活查询时再迁移
- **决策原则**: 技术选型看当前需求，不为未来需求过度设计

## References

- [Apollo Server 官方文档](https://www.apollographql.com/docs/apollo-server/)
- [GraphQL N+1 问题分析](https://example.com/graphql-n-plus-1)
```

---

## 示例 2: 偏移分页改用游标分页

```markdown
# Attempt: Offset-based Pagination

**Date**: 2026-01-08
**Context**: 实现用户列表分页，最初选择偏移分页（offset/limit）

## Approach

使用 SQL OFFSET/LIMIT:
```sql
SELECT * FROM users
ORDER BY created_at DESC
LIMIT 20 OFFSET 40
```

## Result

⚠️ 部分成功（实现了但性能差）

## Reason

1. **性能问题**: OFFSET 40000 时查询时间 >2 秒（需扫描前 40000 行）
2. **数据不一致**: 翻页时有新数据插入，导致重复或遗漏
3. **数据库负载**: 大 OFFSET 导致 CPU 使用率飙升

## Learning

- **游标分页更适合**: 使用 `WHERE id > last_id` 替代 OFFSET
- **性能对比**: 游标分页查询时间稳定在 50ms，与页数无关
- **决策**: 对于大数据集，始终用游标分页

## References

- [PostgreSQL OFFSET Performance](https://example.com/postgres-offset)
- [Cursor-based Pagination Best Practices](https://example.com/cursor-pagination)
```

---

## 何时记录尝试

| 情况 | 是否记录 |
|------|---------|
| 方案调研后决定不采用 | ✅ 记录 |
| 实现了但发现性能问题，放弃 | ✅ 记录 |
| 简单方案 A vs B 对比，选 A | ❌ 不记录（在 research.md Decisions 记录即可） |
| 重大架构决策放弃 | ✅ 记录 |
| 技术选型放弃 | ✅ 记录 |

---

## 与 ERROR_LOG.md 的区别

| | research/attempts/ | ERROR_LOG.md |
|--|-------------------|--------------|
| 阶段 | 研究阶段（Phase 0） | 执行阶段（flow-dev, flow-qa） |
| 内容 | 方案尝试与放弃 | 代码错误与修复 |
| 格式 | Markdown 文件 | 结构化错误日志 |
| 目的 | 避免重复研究 | 避免重复错误 |

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
