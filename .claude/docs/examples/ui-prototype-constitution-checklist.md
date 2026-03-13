# UI Prototype Constitution Checklist

> UI 原型宪法合规检查清单
> 用于 UI_PROTOTYPE_TEMPLATE.md Phase 10: Constitution & Quality Check

---

## Constitution 检查

### Article I - Quality First (质量至上)
- [ ] I.1 Complete Implementation: HTML 无占位符，所有页面完整
- [ ] I.2 No Simplification: 交互逻辑完整，非简化版本
- [ ] I.4 Quality Gates: 通过 HTML 验证，无 console 错误

### Article III - Security First (安全优先)
- [ ] III.1 No Hardcoded Secrets: 无 API 密钥硬编码
- [ ] III.2 Input Validation: 表单有验证逻辑
- [ ] III.4 Secure by Default: 使用 HTTPS CDN 资源

### Article V - Maintainability (可维护性)
- [ ] V.3 Documentation: HTML 注释包含设计文档
- [ ] V.4 File Size Limits: 单文件 HTML ≤ 2000 行（可接受）

### Article X - Requirement Boundary (需求边界)
- [ ] X.1 No Speculation: 仅实现 PRD 明确的功能
- [ ] X.2 No Speculative Features: 无"未来可能需要"的功能

---

## 质量检查清单

### HTML 质量
- [ ] 使用 HTML5 语义化标签
- [ ] 无未闭合标签
- [ ] ARIA 标签完整
- [ ] 无重复 ID

### CSS 质量
- [ ] 使用 CSS 变量（Design System）
- [ ] 响应式媒体查询正常
- [ ] 无 !important 滥用
- [ ] 命名规范（BEM 或一致的命名）

### JavaScript 质量
- [ ] 无全局变量污染
- [ ] 事件监听器正确绑定
- [ ] 无内存泄漏（事件监听器移除）
- [ ] Console 无错误

### 可访问性
- [ ] 色彩对比度 ≥ 4.5:1
- [ ] 键盘导航可用
- [ ] 屏幕阅读器友好
- [ ] focus 状态可见

### 性能
- [ ] CDN 资源加载 <1s
- [ ] 首屏渲染 <2s
- [ ] 交互响应 <100ms
- [ ] 无不必要的重绘/回流

---

## Anti-Generic-Design 验证
- [ ] 无占位图片（Picsum 图片正常加载）
- [ ] 无常见 AI 紫/蓝配色
- [ ] 无 Emoji 图标（使用 SVG/图标库）
- [ ] 无 Lorem Ipsum 文本
- [ ] 所有交互元素有完整状态（hover/active/disabled/error）

---

**完整 Constitution 文档**: `.claude/rules/project-constitution.md`

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
