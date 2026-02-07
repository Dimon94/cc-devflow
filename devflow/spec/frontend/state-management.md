# State Management

> How state is managed in CC-DevFlow projects.
> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

---

## Overview

CC-DevFlow 状态管理遵循 **最小化全局状态** 原则，优先使用本地状态，仅在必要时提升到全局。

---

## Core Principles

1. **本地优先**: 能用本地状态解决的，不用全局状态
2. **单一数据源**: 每个数据只有一个权威来源
3. **不可变更新**: 状态更新必须是不可变的
4. **派生状态**: 能计算出来的，不要存储
5. **服务端状态分离**: 服务端数据用专门的缓存机制

---

## State Categories

### 1. Local State (本地状态)

**适用场景**:
- 表单输入值
- UI 状态 (展开/折叠、选中/未选中)
- 临时数据

```typescript
// React
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({ name: '', email: '' });

// WeChat Mini Program
Page({
  data: {
    isOpen: false,
    formData: { name: '', email: '' },
  },
});
```

### 2. Shared State (共享状态)

**适用场景**:
- 多个组件需要访问的数据
- 跨页面共享的状态

```typescript
// React Context
const UserContext = createContext<UserState | null>(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// WeChat Mini Program globalData
App({
  globalData: {
    userInfo: null,
  },
});
```

### 3. Server State (服务端状态)

**适用场景**:
- API 返回的数据
- 需要缓存和同步的远程数据

```typescript
// React Query / SWR
const { data: user, isLoading, error } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
});

// WeChat Mini Program
Page({
  data: {
    user: null,
    loading: true,
    error: null,
  },
  async onLoad() {
    try {
      const user = await userService.getUser();
      this.setData({ user, loading: false });
    } catch (error) {
      this.setData({ error, loading: false });
    }
  },
});
```

### 4. URL State (URL 状态)

**适用场景**:
- 可分享的页面状态
- 筛选条件、分页参数

```typescript
// React Router
const [searchParams, setSearchParams] = useSearchParams();
const page = searchParams.get('page') || '1';

// WeChat Mini Program
Page({
  onLoad(options) {
    const { page = '1' } = options;
    this.setData({ currentPage: parseInt(page) });
  },
});
```

---

## When to Use Global State

### 使用全局状态的条件

- [ ] 数据被 3+ 个不相关组件使用
- [ ] 数据需要跨页面持久化
- [ ] 数据更新需要触发多处 UI 更新

### 不应使用全局状态的情况

- [ ] 仅父子组件共享 → 用 Props
- [ ] 仅兄弟组件共享 → 提升到父组件
- [ ] 服务端数据 → 用 React Query/SWR
- [ ] URL 可表示的状态 → 用 URL 参数

---

## State Update Patterns

### 不可变更新

```typescript
// Bad: 直接修改
state.user.name = 'New Name';

// Good: 不可变更新
setState(prev => ({
  ...prev,
  user: { ...prev.user, name: 'New Name' },
}));

// WeChat Mini Program
this.setData({
  'user.name': 'New Name',
});
```

### 派生状态

```typescript
// Bad: 存储可计算的值
const [items, setItems] = useState([]);
const [total, setTotal] = useState(0); // 冗余!

// Good: 计算派生值
const [items, setItems] = useState([]);
const total = items.reduce((sum, item) => sum + item.price, 0);
```

---

## Common Mistakes

### Mistake 1: 过度使用全局状态

```typescript
// Bad: 所有状态都放全局
const globalStore = {
  user: null,
  isModalOpen: false,      // 应该是本地状态
  formData: {},            // 应该是本地状态
  selectedTab: 'home',     // 应该是 URL 状态
};

// Good: 按需分类
// 全局: user
// 本地: isModalOpen, formData
// URL: selectedTab
```

### Mistake 2: 状态同步问题

```typescript
// Bad: 多个状态源
const [user, setUser] = useState(null);
const [userName, setUserName] = useState(''); // 冗余!

// Good: 单一数据源
const [user, setUser] = useState(null);
const userName = user?.name || '';
```

### Mistake 3: 忘记清理状态

```typescript
// Bad: 页面切换后状态残留
useEffect(() => {
  fetchData();
}, []);

// Good: 清理副作用
useEffect(() => {
  let cancelled = false;
  fetchData().then(data => {
    if (!cancelled) setData(data);
  });
  return () => { cancelled = true; };
}, []);
```

---

## WeChat Mini Program Specifics

### 页面间通信

```typescript
// 方式 1: globalData
const app = getApp();
app.globalData.selectedItem = item;

// 方式 2: EventChannel
wx.navigateTo({
  url: '/pages/detail/detail',
  success(res) {
    res.eventChannel.emit('acceptData', { data: item });
  },
});

// 方式 3: Storage (持久化)
wx.setStorageSync('selectedItem', item);
```

### 状态持久化

```typescript
// 需要持久化的状态
Page({
  onLoad() {
    const savedData = wx.getStorageSync('formDraft');
    if (savedData) {
      this.setData({ formData: savedData });
    }
  },
  onUnload() {
    wx.setStorageSync('formDraft', this.data.formData);
  },
});
```

---

## Checklist

- [ ] 优先使用本地状态
- [ ] 全局状态有明确的使用理由
- [ ] 服务端数据使用专门的缓存机制
- [ ] 状态更新是不可变的
- [ ] 没有冗余的派生状态
- [ ] 副作用有正确的清理逻辑
