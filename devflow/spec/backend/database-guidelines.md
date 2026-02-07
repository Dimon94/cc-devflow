# Database Guidelines

> Database patterns and conventions for CC-DevFlow projects.
> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

---

## Overview

CC-DevFlow 数据库规范，涵盖 ORM 使用、查询优化、迁移管理等最佳实践。

---

## Core Principles

1. **ORM 优先**: 使用 ORM 而非原生 SQL
2. **类型安全**: 数据库操作必须类型安全
3. **迁移管理**: 所有 Schema 变更通过迁移
4. **查询优化**: 避免 N+1 查询
5. **事务完整**: 关联操作使用事务

---

## ORM Patterns

### Prisma (Node.js 推荐)

```typescript
// prisma/schema.prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  orders    Order[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Order {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  total     Decimal
  status    OrderStatus
  createdAt DateTime @default(now())
}

enum OrderStatus {
  PENDING
  PAID
  SHIPPED
  COMPLETED
}
```

### SQLAlchemy (Python)

```python
# models/user.py
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    orders = relationship("Order", back_populates="user")
    created_at = Column(DateTime, default=datetime.utcnow)
```

---

## Query Patterns

### 避免 N+1 查询

```typescript
// Bad: N+1 查询
const users = await prisma.user.findMany();
for (const user of users) {
  const orders = await prisma.order.findMany({ where: { userId: user.id } });
}

// Good: 使用 include
const users = await prisma.user.findMany({
  include: { orders: true },
});

// Good: 使用 select 只取需要的字段
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    orders: {
      select: { id: true, total: true },
    },
  },
});
```

### 分页查询

```typescript
// 标准分页
const users = await prisma.user.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' },
});

// 游标分页 (大数据量推荐)
const users = await prisma.user.findMany({
  take: pageSize,
  cursor: lastId ? { id: lastId } : undefined,
  skip: lastId ? 1 : 0,
  orderBy: { id: 'asc' },
});
```

### 批量操作

```typescript
// 批量创建
await prisma.user.createMany({
  data: users,
  skipDuplicates: true,
});

// 批量更新
await prisma.user.updateMany({
  where: { status: 'INACTIVE' },
  data: { deletedAt: new Date() },
});

// 批量删除
await prisma.user.deleteMany({
  where: { deletedAt: { lt: thirtyDaysAgo } },
});
```

---

## Migrations

### 创建迁移

```bash
# Prisma
npx prisma migrate dev --name add_user_phone

# SQLAlchemy (Alembic)
alembic revision --autogenerate -m "add user phone"
```

### 迁移命名规范

| 操作 | 命名模式 | 示例 |
|------|----------|------|
| 添加表 | `create_{table}` | `create_orders` |
| 添加列 | `add_{column}_to_{table}` | `add_phone_to_users` |
| 删除列 | `remove_{column}_from_{table}` | `remove_age_from_users` |
| 添加索引 | `add_index_on_{columns}` | `add_index_on_email` |
| 修改列 | `change_{column}_in_{table}` | `change_status_in_orders` |

### 迁移最佳实践

```typescript
// Good: 可逆迁移
// up
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

// down
ALTER TABLE users DROP COLUMN phone;

// Bad: 不可逆操作要谨慎
DROP TABLE users; // 数据丢失!
```

---

## Naming Conventions

### 表名

- 使用 **snake_case**
- 使用 **复数形式**
- 示例: `users`, `order_items`, `user_profiles`

### 列名

- 使用 **snake_case**
- 外键: `{table}_id` (单数)
- 时间戳: `created_at`, `updated_at`, `deleted_at`
- 布尔值: `is_active`, `has_verified`

### 索引名

- 格式: `idx_{table}_{columns}`
- 示例: `idx_users_email`, `idx_orders_user_id_status`

### 约束名

- 主键: `pk_{table}`
- 外键: `fk_{table}_{column}`
- 唯一: `uq_{table}_{columns}`

---

## Transaction Patterns

### 基本事务

```typescript
// Prisma 事务
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.order.create({ data: { ...orderData, userId: user.id } });
  return user;
});
```

### 嵌套事务

```typescript
// 使用 savepoint
await prisma.$transaction(async (tx) => {
  await tx.user.create({ data: user1 });

  try {
    await tx.user.create({ data: user2 }); // 可能失败
  } catch {
    // user2 失败不影响 user1
  }
});
```

---

## Common Mistakes

### Mistake 1: 忘记索引

```sql
-- Bad: 频繁查询的列没有索引
SELECT * FROM orders WHERE user_id = ?;

-- Good: 添加索引
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

### Mistake 2: 软删除不一致

```typescript
// Bad: 有时用 delete，有时用软删除
await prisma.user.delete({ where: { id } });
await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });

// Good: 统一使用软删除
await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });

// 查询时过滤
const users = await prisma.user.findMany({
  where: { deletedAt: null },
});
```

### Mistake 3: 大事务

```typescript
// Bad: 事务包含太多操作
await prisma.$transaction(async (tx) => {
  // 100+ 个数据库操作
  // 长时间锁定
});

// Good: 拆分事务
await prisma.$transaction([
  prisma.user.createMany({ data: users }),
]);
await prisma.$transaction([
  prisma.order.createMany({ data: orders }),
]);
```

---

## Checklist

- [ ] 使用 ORM 而非原生 SQL
- [ ] 查询包含必要的 include/select
- [ ] 没有 N+1 查询
- [ ] 大列表使用分页
- [ ] Schema 变更通过迁移
- [ ] 频繁查询的列有索引
- [ ] 关联操作使用事务
