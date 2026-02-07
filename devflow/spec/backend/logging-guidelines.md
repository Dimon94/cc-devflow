# Logging Guidelines

> How logging is done in CC-DevFlow backend projects.
> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

---

## Overview

CC-DevFlow 后端日志规范，采用 **结构化日志** 和 **分级记录** 策略。

---

## Core Principles

1. **结构化**: 使用 JSON 格式，便于解析
2. **分级**: 按严重程度分级记录
3. **上下文**: 包含足够的调试信息
4. **安全**: 不记录敏感数据
5. **可追踪**: 包含请求 ID 便于追踪

---

## Log Levels

| 级别 | 用途 | 示例 |
|------|------|------|
| **ERROR** | 需要立即处理的错误 | 数据库连接失败、支付失败 |
| **WARN** | 潜在问题，但不影响运行 | 配置缺失使用默认值、重试成功 |
| **INFO** | 重要业务事件 | 用户注册、订单创建、支付成功 |
| **DEBUG** | 调试信息 | 函数入参、中间状态 |

---

## Log Format

### 结构化日志格式

```typescript
interface LogEntry {
  timestamp: string;      // ISO 8601 格式
  level: string;          // ERROR, WARN, INFO, DEBUG
  message: string;        // 人类可读的消息
  service: string;        // 服务名称
  requestId?: string;     // 请求追踪 ID
  userId?: string;        // 用户 ID (如有)
  context?: object;       // 额外上下文
  error?: {               // 错误信息 (如有)
    name: string;
    message: string;
    stack?: string;
  };
}
```

### 示例日志

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "message": "Order created successfully",
  "service": "order-service",
  "requestId": "req-123-456",
  "userId": "user-789",
  "context": {
    "orderId": "order-abc",
    "total": 99.99,
    "items": 3
  }
}
```

---

## Logger Setup

### Node.js (Winston)

```typescript
// utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  defaultMeta: { service: 'api-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// 开发环境美化输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  }));
}
```

### Python (structlog)

```python
# utils/logger.py
import structlog

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)

logger = structlog.get_logger()
```

---

## Logging Patterns

### Pattern 1: 请求日志

```typescript
// middleware/request-logger.middleware.ts
export const requestLogger: RequestHandler = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info('Request completed', {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('user-agent'),
    });
  });

  next();
};
```

### Pattern 2: 业务事件日志

```typescript
// services/order.service.ts
export const orderService = {
  async create(data: CreateOrderInput, userId: string): Promise<Order> {
    logger.info('Creating order', {
      userId,
      itemCount: data.items.length,
    });

    const order = await orderModel.create(data);

    logger.info('Order created successfully', {
      userId,
      orderId: order.id,
      total: order.total,
    });

    return order;
  },
};
```

### Pattern 3: 错误日志

```typescript
// middleware/error.middleware.ts
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof BusinessError) {
    // 业务错误 - INFO 级别
    logger.info('Business error', {
      requestId: req.id,
      code: err.code,
      message: err.message,
    });
  } else {
    // 系统错误 - ERROR 级别
    logger.error('System error', {
      requestId: req.id,
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
      context: {
        path: req.path,
        method: req.method,
      },
    });
  }

  // ... 返回响应
};
```

### Pattern 4: 外部服务调用日志

```typescript
// services/payment.service.ts
export const paymentService = {
  async charge(amount: number): Promise<PaymentResult> {
    logger.debug('Calling payment gateway', { amount });

    try {
      const result = await paymentGateway.charge(amount);

      logger.info('Payment successful', {
        transactionId: result.transactionId,
        amount,
      });

      return result;
    } catch (error) {
      logger.error('Payment failed', {
        amount,
        error: {
          name: error.name,
          message: error.message,
        },
      });

      throw error;
    }
  },
};
```

---

## Sensitive Data

### 不应记录的数据

- 密码、密钥、Token
- 信用卡号、银行账号
- 身份证号、社保号
- 完整手机号、邮箱

### 数据脱敏

```typescript
// utils/sanitize.ts
export function sanitize(data: object): object {
  const sensitiveKeys = ['password', 'token', 'secret', 'creditCard'];

  return Object.entries(data).reduce((acc, [key, value]) => {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      acc[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      acc[key] = sanitize(value);
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, unknown>);
}

// 使用
logger.info('User login', sanitize({ email, password }));
// 输出: { email: "user@example.com", password: "[REDACTED]" }
```

---

## Common Mistakes

### Mistake 1: 日志级别不当

```typescript
// Bad: 正常流程用 ERROR
logger.error('User logged in'); // 这不是错误!

// Good: 正常流程用 INFO
logger.info('User logged in');
```

### Mistake 2: 缺少上下文

```typescript
// Bad: 缺少上下文
logger.error('Database error');

// Good: 包含上下文
logger.error('Database error', {
  operation: 'findUser',
  userId,
  error: { name: err.name, message: err.message },
});
```

### Mistake 3: 记录敏感数据

```typescript
// Bad: 记录密码
logger.info('User registration', { email, password });

// Good: 脱敏处理
logger.info('User registration', { email, password: '[REDACTED]' });
```

---

## Checklist

- [ ] 使用结构化日志格式
- [ ] 日志级别使用正确
- [ ] 包含请求 ID 便于追踪
- [ ] 敏感数据已脱敏
- [ ] 错误日志包含堆栈信息
- [ ] 业务事件有日志记录
- [ ] 外部调用有日志记录
