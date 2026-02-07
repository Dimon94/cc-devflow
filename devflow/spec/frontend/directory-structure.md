# Directory Structure

> How frontend code is organized in CC-DevFlow projects.
> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

---

## Overview

CC-DevFlow 前端项目采用 **功能模块化** 组织方式，适用于 WeChat Mini Program 和 Web 应用。

---

## Directory Layout

### WeChat Mini Program

```
miniprogram/
├── pages/                    # 页面组件
│   ├── index/               # 首页
│   │   ├── index.ts         # 页面逻辑
│   │   ├── index.wxml       # 页面模板
│   │   ├── index.wxss       # 页面样式
│   │   └── index.json       # 页面配置
│   └── user/                # 用户页面
├── components/              # 可复用组件
│   ├── common/              # 通用组件
│   │   ├── button/
│   │   ├── card/
│   │   └── modal/
│   └── business/            # 业务组件
│       ├── order-item/
│       └── product-card/
├── utils/                   # 工具函数
│   ├── request.ts           # 网络请求封装
│   ├── storage.ts           # 本地存储封装
│   └── format.ts            # 格式化工具
├── services/                # 业务服务层
│   ├── user.service.ts
│   └── order.service.ts
├── models/                  # 数据模型/类型定义
│   ├── user.model.ts
│   └── order.model.ts
├── constants/               # 常量定义
│   ├── api.ts               # API 地址
│   └── config.ts            # 配置常量
├── assets/                  # 静态资源
│   ├── images/
│   └── icons/
└── app.ts                   # 应用入口
```

### Web Application (React/Vue)

```
src/
├── pages/                   # 页面组件
│   ├── Home/
│   │   ├── index.tsx
│   │   ├── Home.module.css
│   │   └── components/      # 页面私有组件
│   └── User/
├── components/              # 共享组件
│   ├── common/              # 通用 UI 组件
│   └── business/            # 业务组件
├── hooks/                   # 自定义 Hooks
│   ├── useAuth.ts
│   └── useRequest.ts
├── services/                # API 服务层
│   ├── api.ts               # API 客户端
│   └── user.service.ts
├── stores/                  # 状态管理
│   ├── index.ts
│   └── user.store.ts
├── utils/                   # 工具函数
├── types/                   # TypeScript 类型
├── constants/               # 常量
├── assets/                  # 静态资源
└── App.tsx                  # 应用入口
```

---

## Module Organization

### 新功能组织原则

1. **页面级功能**: 放在 `pages/{PageName}/` 下
2. **跨页面复用**: 提升到 `components/` 或 `hooks/`
3. **业务逻辑**: 放在 `services/`
4. **数据类型**: 放在 `models/` 或 `types/`

### 组件分类

| 类型 | 位置 | 特征 |
|------|------|------|
| 页面组件 | `pages/` | 路由入口，组合其他组件 |
| 通用组件 | `components/common/` | 无业务逻辑，纯 UI |
| 业务组件 | `components/business/` | 包含业务逻辑，可复用 |
| 页面私有组件 | `pages/{Page}/components/` | 仅该页面使用 |

---

## Naming Conventions

### 文件命名

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 页面目录 | PascalCase | `pages/UserProfile/` |
| 组件目录 | kebab-case | `components/user-card/` |
| 工具文件 | kebab-case | `utils/date-format.ts` |
| 服务文件 | kebab-case + .service | `user.service.ts` |
| 模型文件 | kebab-case + .model | `user.model.ts` |
| 类型文件 | kebab-case + .types | `user.types.ts` |

### 导出命名

```typescript
// 组件: PascalCase
export const UserCard = () => { ... };

// 函数: camelCase
export const formatDate = (date: Date) => { ... };

// 常量: UPPER_SNAKE_CASE
export const API_BASE_URL = 'https://api.example.com';

// 类型: PascalCase
export interface UserProfile { ... }
```

---

## Examples

### 良好的目录组织

```
components/
├── common/
│   ├── button/
│   │   ├── index.ts         # 导出入口
│   │   ├── Button.tsx       # 组件实现
│   │   ├── Button.module.css
│   │   └── Button.test.tsx  # 测试
│   └── modal/
└── business/
    └── order-item/
        ├── index.ts
        ├── OrderItem.tsx
        └── OrderItem.module.css
```

### 避免的组织方式

```
// Bad: 扁平化，难以维护
components/
├── Button.tsx
├── Modal.tsx
├── OrderItem.tsx
├── ProductCard.tsx
├── UserCard.tsx
└── ... (50+ files)

// Bad: 过度嵌套
components/
└── ui/
    └── forms/
        └── inputs/
            └── text/
                └── TextInput.tsx
```

---

## Checklist

- [ ] 新页面放在 `pages/` 下
- [ ] 复用组件放在 `components/` 下
- [ ] 业务逻辑放在 `services/` 下
- [ ] 类型定义放在 `models/` 或 `types/` 下
- [ ] 遵循命名规范
- [ ] 每个目录有 `index.ts` 导出入口
