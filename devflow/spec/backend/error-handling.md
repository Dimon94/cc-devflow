# Error Handling

> How errors are handled in CC-DevFlow backend projects.
> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

---

## Overview

CC-DevFlow 后端错误处理采用 **分层错误** 策略，在合适的层级捕获和转换错误。

---

## Core Principles

1. **错误分类**: 区分业务错误和系统错误
2. **统一格式**: 所有 API 错误返回统一格式
3. **适当捕获**: 在合适的层级处理错误
4. **信息安全**: 不暴露敏感的错误细节
5. **可追踪**: 错误包含足够的调试信息

---

## Error Categories

### 1. 业务错误 (Business Errors)

用户操作导致的预期错误，返回 4xx 状态码。

```typescript
// 自定义业务错误类
class BusinessError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}

// 常见业务错误
class NotFoundError extends BusinessError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

class ValidationError extends BusinessError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
  }
}

class UnauthorizedError extends BusinessError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
  }
}

class ForbiddenError extends BusinessError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', message, 403);
  }
}
```

### 2. 系统错误 (System Errors)

系统内部错误，返回 5xx 状态码。

```typescript
class SystemError extends Error {
  constructor(
    message: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = 'SystemError';
  }
}
```

---

## Error Response Format

### 统一响应格式

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}

// 示例响应
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email format is invalid",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  },
  "requestId": "req-123-456"
}
```

### HTTP 状态码映射

| 状态码 | 错误类型 | 使用场景 |
|--------|----------|----------|
| 400 | Bad Request | 参数验证失败 |
| 401 | Unauthorized | 未认证 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 |
| 422 | Unprocessable Entity | 业务规则违反 |
| 500 | Internal Server Error | 系统错误 |
| 503 | Service Unavailable | 服务不可用 |

---

## Error Handling Patterns

### Pattern 1: 全局错误中间件

```typescript
// middleware/error.middleware.ts
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // 记录错误
  logger.error({
    error: err,
    requestId: req.id,
    path: req.path,
    method: req.method,
  });

  // 业务错误
  if (err instanceof BusinessError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
      requestId: req.id,
    });
  }

  // 验证错误 (如 Zod)
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors,
      },
      requestId: req.id,
    });
  }

  // 系统错误 - 不暴露细节
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    requestId: req.id,
  });
};
```

### Pattern 2: Service 层错误处理

```typescript
// services/user.service.ts
export const userService = {
  async findById(id: string): Promise<User> {
    const user = await userModel.findById(id);

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  },

  async create(data: CreateUserInput): Promise<User> {
    // 业务规则验证
    const existing = await userModel.findByEmail(data.email);
    if (existing) {
      throw new BusinessError('EMAIL_EXISTS', 'Email already registered', 409);
    }

    return userModel.create(data);
  },
};
```

### Pattern 3: Controller 层错误处理

```typescript
// controllers/user.controller.ts
export const userController = {
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.findById(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error); // 传递给全局错误处理
    }
  },
};

// 或使用 async wrapper
const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

router.get('/users/:id', asyncHandler(userController.getById));
```

### Pattern 4: 外部服务错误处理

```typescript
// services/payment.service.ts
export const paymentService = {
  async charge(amount: number, token: string): Promise<PaymentResult> {
    try {
      return await paymentGateway.charge(amount, token);
    } catch (error) {
      // 转换外部错误为内部错误
      if (error instanceof PaymentGatewayError) {
        if (error.code === 'CARD_DECLINED') {
          throw new BusinessError('PAYMENT_DECLINED', 'Card was declined', 422);
        }
        if (error.code === 'INSUFFICIENT_FUNDS') {
          throw new BusinessError('INSUFFICIENT_FUNDS', 'Insufficient funds', 422);
        }
      }

      // 未知错误记录并抛出系统错误
      logger.error('Payment gateway error', { error });
      throw new SystemError('Payment processing failed', error);
    }
  },
};
```

---

## Logging Errors

### 错误日志格式

```typescript
// 业务错误 - INFO 级别
logger.info({
  type: 'business_error',
  code: error.code,
  message: error.message,
  userId: req.user?.id,
  requestId: req.id,
});

// 系统错误 - ERROR 级别
logger.error({
  type: 'system_error',
  message: error.message,
  stack: error.stack,
  requestId: req.id,
  context: {
    path: req.path,
    method: req.method,
    body: sanitize(req.body),
  },
});
```

---

## Common Mistakes

### Mistake 1: 吞掉错误

```typescript
// Bad: 错误被吞掉
try {
  await riskyOperation();
} catch (error) {
  // 什么都不做
}

// Good: 至少记录日志
try {
  await riskyOperation();
} catch (error) {
  logger.error('Risky operation failed', { error });
  // 决定是否重新抛出
}
```

### Mistake 2: 暴露敏感信息

```typescript
// Bad: 暴露数据库错误
res.status(500).json({
  error: error.message, // "duplicate key value violates unique constraint..."
});

// Good: 返回通用消息
res.status(500).json({
  error: {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  },
});
```

### Mistake 3: 错误类型不一致

```typescript
// Bad: 有时抛异常，有时返回 null
async function findUser(id: string) {
  const user = await db.user.findById(id);
  return user; // 可能是 null
}

async function getUser(id: string) {
  const user = await db.user.findById(id);
  if (!user) throw new NotFoundError('User');
  return user;
}

// Good: 统一约定
// findXxx - 可能返回 null
// getXxx - 不存在则抛异常
```

---

## Checklist

- [ ] 定义了业务错误类
- [ ] 有全局错误处理中间件
- [ ] 错误响应格式统一
- [ ] 系统错误不暴露细节
- [ ] 错误有适当的日志记录
- [ ] 外部服务错误有转换
- [ ] 使用 async wrapper 或 try-catch
