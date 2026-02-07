# Quality Guidelines

> Code quality standards for frontend development in CC-DevFlow.
> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

---

## Overview

CC-DevFlow 前端代码质量标准，确保代码可维护、可测试、高性能。

---

## Core Principles

1. **可读性优先**: 代码是写给人看的
2. **一致性**: 遵循项目既有风格
3. **简单性**: 最简单的解决方案往往是最好的
4. **可测试性**: 代码应易于测试
5. **性能意识**: 避免不必要的渲染和计算

---

## Forbidden Patterns

### 1. any 类型

```typescript
// Bad: 使用 any
function processData(data: any) {
  return data.value;
}

// Good: 明确类型
interface DataItem {
  value: string;
}

function processData(data: DataItem) {
  return data.value;
}
```

### 2. 魔法数字/字符串

```typescript
// Bad: 魔法数字
if (status === 1) { ... }
if (role === 'admin') { ... }

// Good: 使用常量
const STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

if (status === STATUS.ACTIVE) { ... }
if (role === ROLES.ADMIN) { ... }
```

### 3. 过长函数

```typescript
// Bad: 函数超过 50 行
function handleSubmit() {
  // 100+ 行代码
}

// Good: 拆分职责
function handleSubmit() {
  const data = collectFormData();
  const validated = validateData(data);
  await submitData(validated);
  showSuccessMessage();
}
```

### 4. 深层嵌套

```typescript
// Bad: 超过 3 层嵌套
if (user) {
  if (user.permissions) {
    if (user.permissions.includes('admin')) {
      if (isActive) {
        // ...
      }
    }
  }
}

// Good: 提前返回
if (!user) return;
if (!user.permissions) return;
if (!user.permissions.includes('admin')) return;
if (!isActive) return;
// ...
```

### 5. 副作用混乱

```typescript
// Bad: 副作用散落各处
const Component = () => {
  fetch('/api/data'); // 副作用在渲染中!
  return <div>...</div>;
};

// Good: 副作用在 useEffect 中
const Component = () => {
  useEffect(() => {
    fetch('/api/data');
  }, []);
  return <div>...</div>;
};
```

---

## Required Patterns

### 1. 错误边界

```typescript
// 每个页面应有错误边界
<ErrorBoundary fallback={<ErrorPage />}>
  <PageContent />
</ErrorBoundary>
```

### 2. 加载状态

```typescript
// 异步操作必须有加载状态
const { data, isLoading, error } = useQuery(...);

if (isLoading) return <Loading />;
if (error) return <Error message={error.message} />;
return <Content data={data} />;
```

### 3. 空状态处理

```typescript
// 列表必须处理空状态
if (items.length === 0) {
  return <EmptyState message="暂无数据" />;
}
return <List items={items} />;
```

### 4. 类型导出

```typescript
// 组件 Props 类型应导出
export interface ButtonProps {
  label: string;
  onClick: () => void;
}

export const Button: FC<ButtonProps> = ({ label, onClick }) => { ... };
```

---

## Testing Requirements

### 覆盖率要求

| 类型 | 最低覆盖率 |
|------|-----------|
| 工具函数 | 90% |
| 业务组件 | 80% |
| 页面组件 | 70% |
| UI 组件 | 60% |

### 必须测试的场景

- [ ] 正常流程 (Happy Path)
- [ ] 边界条件 (空值、极值)
- [ ] 错误处理
- [ ] 用户交互

### 测试示例

```typescript
describe('UserCard', () => {
  it('should render user name', () => {
    render(<UserCard user={mockUser} />);
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
  });

  it('should call onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<UserCard user={mockUser} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(mockUser.id);
  });

  it('should handle missing avatar', () => {
    const userWithoutAvatar = { ...mockUser, avatar: null };
    render(<UserCard user={userWithoutAvatar} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', DEFAULT_AVATAR);
  });
});
```

---

## Code Review Checklist

### 功能性

- [ ] 代码实现了需求描述的功能
- [ ] 边界条件已处理
- [ ] 错误情况已处理

### 可读性

- [ ] 命名清晰表达意图
- [ ] 复杂逻辑有注释
- [ ] 函数不超过 50 行

### 性能

- [ ] 没有不必要的重渲染
- [ ] 大列表使用虚拟滚动
- [ ] 图片有懒加载

### 安全性

- [ ] 用户输入已验证
- [ ] 敏感数据已脱敏
- [ ] XSS 风险已防范

### 测试

- [ ] 有对应的测试用例
- [ ] 测试覆盖主要场景
- [ ] 测试可独立运行

---

## Performance Guidelines

### 避免不必要的渲染

```typescript
// Bad: 每次渲染都创建新对象
<Component style={{ color: 'red' }} />

// Good: 使用 useMemo 或常量
const style = useMemo(() => ({ color: 'red' }), []);
<Component style={style} />
```

### 列表优化

```typescript
// Bad: 没有 key 或使用 index 作为 key
{items.map((item, index) => <Item key={index} {...item} />)}

// Good: 使用唯一标识作为 key
{items.map(item => <Item key={item.id} {...item} />)}
```

### 懒加载

```typescript
// 路由级懒加载
const UserPage = lazy(() => import('./pages/User'));

// 组件级懒加载
const HeavyChart = lazy(() => import('./components/HeavyChart'));
```

---

## Checklist

- [ ] 没有 any 类型
- [ ] 没有魔法数字/字符串
- [ ] 函数不超过 50 行
- [ ] 嵌套不超过 3 层
- [ ] 副作用在正确位置
- [ ] 有错误边界
- [ ] 有加载状态
- [ ] 有空状态处理
- [ ] 有对应测试
