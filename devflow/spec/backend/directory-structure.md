# Directory Structure

> How backend code is organized in CC-DevFlow projects.
> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

---

## Overview

CC-DevFlow 后端项目采用 **分层架构**，清晰分离路由、控制器、服务和数据访问层。

---

## Directory Layout

### Node.js/Express Backend

```
src/
├── routes/                  # API 路由定义
│   ├── index.ts            # 路由入口
│   ├── user.routes.ts      # 用户相关路由
│   └── order.routes.ts     # 订单相关路由
├── controllers/             # 请求处理器
│   ├── user.controller.ts
│   └── order.controller.ts
├── services/                # 业务逻辑层
│   ├── user.service.ts
│   └── order.service.ts
├── models/                  # 数据模型
│   ├── user.model.ts
│   └── order.model.ts
├── middleware/              # 中间件
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   └── validate.middleware.ts
├── utils/                   # 工具函数
│   ├── logger.ts
│   └── helpers.ts
├── config/                  # 配置
│   ├── database.ts
│   └── app.ts
├── types/                   # TypeScript 类型
│   └── index.ts
└── app.ts                   # 应用入口
```

### Python/FastAPI Backend

```
src/
├── api/                     # API 路由
│   ├── __init__.py
│   ├── v1/
│   │   ├── __init__.py
│   │   ├── users.py
│   │   └── orders.py
│   └── deps.py             # 依赖注入
├── services/                # 业务逻辑
│   ├── __init__.py
│   ├── user_service.py
│   └── order_service.py
├── models/                  # 数据模型
│   ├── __init__.py
│   ├── user.py
│   └── order.py
├── schemas/                 # Pydantic 模式
│   ├── __init__.py
│   ├── user.py
│   └── order.py
├── core/                    # 核心配置
│   ├── __init__.py
│   ├── config.py
│   └── security.py
├── db/                      # 数据库
│   ├── __init__.py
│   ├── session.py
│   └── base.py
└── main.py                  # 应用入口
```

---

## Layer Responsibilities

### Routes/API Layer

- 定义 HTTP 端点
- 参数解析和验证
- 调用 Controller/Service
- 返回 HTTP 响应

```typescript
// routes/user.routes.ts
router.get('/users/:id', validateParams(userIdSchema), userController.getById);
router.post('/users', validateBody(createUserSchema), userController.create);
```

### Controller Layer

- 处理 HTTP 请求/响应
- 调用 Service 层
- 错误转换为 HTTP 错误

```typescript
// controllers/user.controller.ts
export const userController = {
  async getById(req: Request, res: Response) {
    const user = await userService.findById(req.params.id);
    res.json(user);
  },
};
```

### Service Layer

- 业务逻辑实现
- 事务管理
- 调用 Model/Repository

```typescript
// services/user.service.ts
export const userService = {
  async findById(id: string): Promise<User> {
    const user = await userModel.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  },
};
```

### Model Layer

- 数据结构定义
- 数据库操作
- 数据验证

```typescript
// models/user.model.ts
export const userModel = {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },
};
```

---

## Naming Conventions

### 文件命名

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 路由文件 | `{resource}.routes.ts` | `user.routes.ts` |
| 控制器 | `{resource}.controller.ts` | `user.controller.ts` |
| 服务 | `{resource}.service.ts` | `user.service.ts` |
| 模型 | `{resource}.model.ts` | `user.model.ts` |
| 中间件 | `{name}.middleware.ts` | `auth.middleware.ts` |
| 测试 | `{resource}.test.ts` | `user.test.ts` |

### 函数命名

| 操作 | 命名模式 | 示例 |
|------|----------|------|
| 查询单个 | `findById`, `getById` | `findById(id)` |
| 查询列表 | `findAll`, `list` | `findAll(filters)` |
| 创建 | `create` | `create(data)` |
| 更新 | `update`, `updateById` | `updateById(id, data)` |
| 删除 | `delete`, `deleteById` | `deleteById(id)` |

---

## Module Organization

### 新功能组织原则

1. **单一资源**: 一个资源对应一套 routes/controller/service/model
2. **共享逻辑**: 提取到 `utils/` 或 `services/common/`
3. **跨资源操作**: 在 Service 层组合

### 示例: 添加新资源

```bash
# 添加 Product 资源
src/
├── routes/product.routes.ts
├── controllers/product.controller.ts
├── services/product.service.ts
├── models/product.model.ts
└── types/product.types.ts
```

---

## Checklist

- [ ] 路由只做参数解析和响应
- [ ] 业务逻辑在 Service 层
- [ ] 数据访问在 Model 层
- [ ] 遵循命名规范
- [ ] 每层职责清晰
