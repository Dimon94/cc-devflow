# Component Guidelines

> How components are built in CC-DevFlow projects.
> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

---

## Overview

CC-DevFlow 组件设计遵循 **单一职责** 和 **组合优于继承** 原则，适用于 WeChat Mini Program 和 React/Vue 应用。

---

## Core Principles

1. **单一职责**: 每个组件只做一件事
2. **Props 驱动**: 组件行为由 Props 决定，避免内部状态
3. **组合优先**: 通过组合小组件构建复杂 UI
4. **类型安全**: 所有 Props 必须有类型定义
5. **可测试性**: 组件应易于单元测试

---

## Component Structure

### React/Vue Component

```typescript
/**
 * [INPUT]: 依赖 @/types/user 的 UserProfile 类型
 * [OUTPUT]: 对外提供 UserCard 组件
 * [POS]: components/business 的用户展示组件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { FC } from 'react';
import styles from './UserCard.module.css';
import type { UserProfile } from '@/types/user';

// ============================================================
// Types
// ============================================================

interface UserCardProps {
  user: UserProfile;
  variant?: 'default' | 'compact';
  onSelect?: (userId: string) => void;
}

// ============================================================
// Component
// ============================================================

export const UserCard: FC<UserCardProps> = ({
  user,
  variant = 'default',
  onSelect,
}) => {
  const handleClick = () => {
    onSelect?.(user.id);
  };

  return (
    <div
      className={`${styles.card} ${styles[variant]}`}
      onClick={handleClick}
    >
      <img src={user.avatar} alt={user.name} className={styles.avatar} />
      <span className={styles.name}>{user.name}</span>
    </div>
  );
};
```

### WeChat Mini Program Component

```typescript
/**
 * [INPUT]: 依赖 app.globalData 的用户信息
 * [OUTPUT]: 对外提供 user-card 组件
 * [POS]: components/business 的用户展示组件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ============================================================
// Types
// ============================================================

interface UserCardProps {
  user: WechatMiniprogram.UserInfo;
  variant: 'default' | 'compact';
}

// ============================================================
// Component
// ============================================================

Component<UserCardProps>({
  properties: {
    user: {
      type: Object,
      value: null,
    },
    variant: {
      type: String,
      value: 'default',
    },
  },

  methods: {
    handleTap() {
      this.triggerEvent('select', { userId: this.data.user.id });
    },
  },
});
```

---

## Props Conventions

### Required vs Optional

```typescript
interface ButtonProps {
  // Required: 没有默认值，必须传入
  label: string;
  onClick: () => void;

  // Optional: 有默认值或可为空
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  icon?: ReactNode;
}
```

### Props 命名规范

| 类型 | 命名模式 | 示例 |
|------|----------|------|
| 布尔值 | is/has/can/should 前缀 | `isLoading`, `hasError` |
| 事件处理 | on 前缀 | `onClick`, `onSubmit` |
| 渲染函数 | render 前缀 | `renderHeader`, `renderItem` |
| 子元素 | children 或具体名称 | `children`, `header`, `footer` |

### 避免的 Props 模式

```typescript
// Bad: 过于宽泛
interface BadProps {
  data: any;
  config: object;
  style: any;
}

// Good: 具体明确
interface GoodProps {
  user: UserProfile;
  displayOptions: DisplayConfig;
  className?: string;
}
```

---

## Styling Patterns

### CSS Modules (推荐)

```typescript
import styles from './Button.module.css';

export const Button = ({ variant = 'primary' }) => (
  <button className={`${styles.button} ${styles[variant]}`}>
    Click me
  </button>
);
```

### WeChat Mini Program WXSS

```css
/* button.wxss */
.button {
  padding: 16rpx 32rpx;
  border-radius: 8rpx;
}

.button--primary {
  background: #1890ff;
  color: #fff;
}

.button--secondary {
  background: #f0f0f0;
  color: #333;
}
```

---

## Accessibility

### 基本要求

- [ ] 所有图片有 `alt` 属性
- [ ] 可点击元素有 `role` 和 `aria-label`
- [ ] 表单元素有关联的 `label`
- [ ] 颜色对比度符合 WCAG 标准

### 示例

```typescript
// Good: 可访问的按钮
<button
  aria-label="关闭对话框"
  onClick={onClose}
>
  <CloseIcon aria-hidden="true" />
</button>

// Good: 可访问的图片
<img
  src={user.avatar}
  alt={`${user.name}的头像`}
/>
```

---

## Common Mistakes

### Mistake 1: 组件职责过重

```typescript
// Bad: 一个组件做太多事
const UserPage = () => {
  // 获取数据
  // 处理表单
  // 管理状态
  // 渲染 UI
  // 处理路由
  // ...500 行代码
};

// Good: 拆分职责
const UserPage = () => (
  <UserDataProvider>
    <UserHeader />
    <UserForm />
    <UserActions />
  </UserDataProvider>
);
```

### Mistake 2: Props 透传过深

```typescript
// Bad: Props drilling
<GrandParent user={user}>
  <Parent user={user}>
    <Child user={user}>
      <GrandChild user={user} />
    </Child>
  </Parent>
</GrandParent>

// Good: Context 或状态管理
<UserContext.Provider value={user}>
  <GrandParent>
    <Parent>
      <Child>
        <GrandChild /> {/* 从 Context 获取 user */}
      </Child>
    </Parent>
  </GrandParent>
</UserContext.Provider>
```

### Mistake 3: 在组件内定义组件

```typescript
// Bad: 每次渲染都创建新组件
const Parent = () => {
  const Child = () => <div>Child</div>; // 每次渲染都重新创建
  return <Child />;
};

// Good: 组件定义在外部
const Child = () => <div>Child</div>;

const Parent = () => {
  return <Child />;
};
```

---

## Checklist

- [ ] 组件只做一件事
- [ ] Props 有完整类型定义
- [ ] 有默认值的 Props 标记为可选
- [ ] 事件处理函数以 `on` 开头
- [ ] 样式使用 CSS Modules 或 WXSS
- [ ] 图片有 alt 属性
- [ ] 组件文件不超过 300 行
