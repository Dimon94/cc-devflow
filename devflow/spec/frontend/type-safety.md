# Type Safety

> Type safety patterns in CC-DevFlow projects.
> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

---

## Overview

CC-DevFlow 使用 TypeScript 确保类型安全，遵循 **严格模式** 和 **类型优先** 原则。

---

## Core Principles

1. **严格模式**: 启用 `strict: true`
2. **显式类型**: 公共 API 必须有显式类型
3. **类型推断**: 内部实现可依赖类型推断
4. **运行时验证**: 外部数据必须运行时验证
5. **类型复用**: 避免重复定义相同类型

---

## Type Organization

### 目录结构

```
src/
├── types/                   # 全局类型定义
│   ├── index.ts            # 类型导出入口
│   ├── api.types.ts        # API 相关类型
│   ├── user.types.ts       # 用户相关类型
│   └── common.types.ts     # 通用类型
├── models/                  # 数据模型 (类型 + 验证)
│   ├── user.model.ts
│   └── order.model.ts
└── components/
    └── Button/
        └── Button.types.ts  # 组件私有类型
```

### 类型文件命名

| 类型 | 文件名 | 示例 |
|------|--------|------|
| 全局类型 | `*.types.ts` | `user.types.ts` |
| 数据模型 | `*.model.ts` | `user.model.ts` |
| 组件类型 | `*.types.ts` 或内联 | `Button.types.ts` |

---

## Type Patterns

### 1. 接口 vs 类型别名

```typescript
// 接口: 用于对象形状，可扩展
interface User {
  id: string;
  name: string;
}

interface AdminUser extends User {
  permissions: string[];
}

// 类型别名: 用于联合类型、工具类型
type Status = 'active' | 'inactive' | 'pending';
type Nullable<T> = T | null;
type UserKeys = keyof User;
```

### 2. 泛型

```typescript
// API 响应泛型
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 使用
const response: ApiResponse<User> = await fetchUser();

// 列表响应
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### 3. 类型守卫

```typescript
// 类型守卫函数
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}

// 使用
if (isUser(data)) {
  console.log(data.name); // 类型安全
}
```

### 4. 断言函数

```typescript
// 断言函数
function assertUser(value: unknown): asserts value is User {
  if (!isUser(value)) {
    throw new Error('Invalid user data');
  }
}

// 使用
assertUser(data);
console.log(data.name); // 类型安全
```

---

## Validation

### Zod 验证 (推荐)

```typescript
import { z } from 'zod';

// 定义 Schema
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

// 推导类型
type User = z.infer<typeof UserSchema>;

// 验证
function parseUser(data: unknown): User {
  return UserSchema.parse(data);
}

// 安全验证 (不抛异常)
function safeParseUser(data: unknown): User | null {
  const result = UserSchema.safeParse(data);
  return result.success ? result.data : null;
}
```

### WeChat Mini Program 验证

```typescript
// 简单验证函数
function validateUserInput(data: unknown): data is UserInput {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.name === 'string' &&
    obj.name.length > 0 &&
    typeof obj.phone === 'string' &&
    /^1\d{10}$/.test(obj.phone)
  );
}
```

---

## Common Patterns

### 1. 可选属性 vs undefined

```typescript
// 可选属性: 可以不传
interface Config {
  timeout?: number;
}

// 明确 undefined: 必须传，但可以是 undefined
interface Config {
  timeout: number | undefined;
}
```

### 2. 只读属性

```typescript
// 只读对象
interface User {
  readonly id: string;
  name: string;
}

// 只读数组
const items: readonly string[] = ['a', 'b', 'c'];

// 深度只读
type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};
```

### 3. 工具类型

```typescript
// 常用工具类型
type Partial<T> = { [P in keyof T]?: T[P] };
type Required<T> = { [P in keyof T]-?: T[P] };
type Pick<T, K extends keyof T> = { [P in K]: T[P] };
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// 使用示例
type UserUpdate = Partial<User>;
type UserBasic = Pick<User, 'id' | 'name'>;
type UserWithoutId = Omit<User, 'id'>;
```

---

## Forbidden Patterns

### 1. any 类型

```typescript
// Bad
function process(data: any) { ... }

// Good
function process(data: unknown) {
  if (isValidData(data)) { ... }
}
```

### 2. 类型断言滥用

```typescript
// Bad: 强制断言
const user = data as User;

// Good: 运行时验证
const user = parseUser(data);
```

### 3. 非空断言滥用

```typescript
// Bad: 非空断言
const name = user!.name;

// Good: 条件检查
const name = user?.name ?? 'Unknown';
```

### 4. @ts-ignore

```typescript
// Bad: 忽略类型错误
// @ts-ignore
const result = invalidCode();

// Good: 修复类型问题或使用 @ts-expect-error 并说明原因
// @ts-expect-error - 第三方库类型定义不完整
const result = thirdPartyLib();
```

---

## WeChat Mini Program Specifics

### 全局类型声明

```typescript
// typings/index.d.ts
interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo;
    token?: string;
  };
}

// 使用
const app = getApp<IAppOption>();
const userInfo = app.globalData.userInfo;
```

### 页面类型

```typescript
// pages/user/user.ts
interface UserPageData {
  user: User | null;
  loading: boolean;
}

interface UserPageOptions {
  userId: string;
}

Page<UserPageData, UserPageOptions>({
  data: {
    user: null,
    loading: true,
  },
  onLoad(options) {
    const { userId } = options; // 类型安全
  },
});
```

---

## Checklist

- [ ] 启用 `strict: true`
- [ ] 公共 API 有显式类型
- [ ] 没有 `any` 类型
- [ ] 外部数据有运行时验证
- [ ] 类型定义在正确位置
- [ ] 使用类型守卫而非断言
- [ ] 没有 `@ts-ignore`
