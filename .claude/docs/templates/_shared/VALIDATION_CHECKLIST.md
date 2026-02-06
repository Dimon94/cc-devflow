# Validation Checklist Template Component

> **Purpose**: Shared validation checklist section for all spec templates
> **Version**: 1.0.0
> **Usage**: Include relevant sections based on document type

---

## Usage

Include this component in templates via reference:
```markdown
{{INCLUDE: _shared/VALIDATION_CHECKLIST.md#prd}}
{{INCLUDE: _shared/VALIDATION_CHECKLIST.md#epic}}
{{INCLUDE: _shared/VALIDATION_CHECKLIST.md#tech}}
{{INCLUDE: _shared/VALIDATION_CHECKLIST.md#ui}}
```

---

## Common Validation Items

### Content Completeness

- [ ] 所有必需章节已填写
- [ ] 没有 {{PLACEHOLDER}} 未替换
- [ ] 没有 TODO 或 TBD 标记
- [ ] 所有引用的文件存在

### Quality Standards

- [ ] 语言清晰、无歧义
- [ ] 格式一致、结构清晰
- [ ] 无重复内容
- [ ] 无矛盾描述

### Constitution Compliance

- [ ] 通过所有宪法检查
- [ ] 违规已文档化并说明理由
- [ ] 安全要求符合 NO HARDCODED SECRETS
- [ ] 质量要求符合 NO PARTIAL IMPLEMENTATION

---

## PRD-Specific Validation {#prd}

### 需求不扩散验证

- [ ] **NO SPECULATION**: 所有功能都由用户明确提出或必需
- [ ] **ALL CLARIFIED**: 没有未解决的 [NEEDS CLARIFICATION] 标记
- [ ] **NO TECH DETAILS**: 没有技术实现细节（API, 数据库, 框架等）
- [ ] **STORY INDEPENDENCE**: 每个故事都有 Independent Test 标准
- [ ] **PRIORITY ASSIGNED**: 所有故事都有明确优先级 (P1, P2, P3...)
- [ ] **MVP IDENTIFIED**: P1 故事能够作为独立 MVP 交付

### 用户故事质量 (INVEST 原则)

- [ ] **Independent**: 每个故事可独立交付和测试
- [ ] **Negotiable**: 细节可以讨论，实现方式灵活
- [ ] **Valuable**: 有明确的用户/业务价值
- [ ] **Estimable**: 可以估算工作量
- [ ] **Small**: 可在一个迭代内完成
- [ ] **Testable**: 有明确的验收标准和测试方法

### 验收标准质量

- [ ] 使用 Given-When-Then 格式
- [ ] 包含正常流程（Happy Path）
- [ ] 包含边界情况（Edge Cases）
- [ ] 包含错误场景（Error Handling）
- [ ] 具体且可测试（非模糊描述）

---

## EPIC-Specific Validation {#epic}

### PRD 对齐

- [ ] 所有用户故事已映射到 Epic
- [ ] 所有验收标准已包含
- [ ] 成功指标与 PRD 一致
- [ ] 技术约束已考虑

### 技术方案完整性

- [ ] 架构设计清晰
- [ ] 数据模型完整
- [ ] API 契约定义
- [ ] 技术栈选型合理

### TDD 准备

- [ ] Phase 2 明确定义为"Tests First"
- [ ] TEST VERIFICATION CHECKPOINT 已标记
- [ ] 测试策略明确
- [ ] Phase 3 依赖 Phase 2 完成

### 可执行性

- [ ] 实施阶段清晰
- [ ] 依赖已识别
- [ ] 资源需求明确
- [ ] 风险已评估

---

## TECH_DESIGN-Specific Validation {#tech}

### 技术完整性

- [ ] **Section 1**: System Architecture - Complete
- [ ] **Section 2**: Technology Stack - Complete with versions
- [ ] **Section 3**: Data Model Design - Complete
- [ ] **Section 4**: API Design - Complete
- [ ] **Section 5**: Security Design - Complete
- [ ] **Section 6**: Performance Design - Complete
- [ ] **Section 7**: Constitution Check - Complete

### 技术规范

- [ ] 所有技术都有具体版本号
- [ ] 所有表都有主键和关系定义
- [ ] 所有 API 端点都有请求/响应 schema
- [ ] 所有密钥使用环境变量

### Baseline Adherence

- [ ] 所有 baseline 技术已复用
- [ ] 所有新技术都有 PRD 需求支撑
- [ ] 无不必要的重构

---

## UI_PROTOTYPE-Specific Validation {#ui}

### Anti-Generic-Design

- [ ] 无占位图片（所有图片使用 Picsum URL）
- [ ] 无常见 AI 紫色/蓝色配色
- [ ] 无 Emoji 图标（使用 SVG 或图标库）
- [ ] 无 Lorem Ipsum 占位文本

### 设计系统

- [ ] 色彩系统完整（主/辅/中性/状态）
- [ ] 字体系统支持中英文混排
- [ ] 间距系统基于统一基准
- [ ] 响应式断点定义（至少 3 个）

### 交互完整性

- [ ] SPA 路由系统正常工作
- [ ] 所有按钮/链接有点击交互
- [ ] 表单有验证逻辑
- [ ] 模态框可打开/关闭

### 响应式

- [ ] 在 320px 宽度下页面可用
- [ ] 在 768px 宽度下页面可用
- [ ] 在 1280px 宽度下页面可用
- [ ] 所有 Touch Targets ≥ 44px

---

## Progress Tracking

### 完成状态

- [ ] 所有必需章节完成
- [ ] Constitution Check 通过
- [ ] 质量检查通过

### 闸门状态

| Gate | Status |
|------|--------|
| Constitution Check | {{PASS/FAIL}} |
| Completeness | {{PASS/FAIL}} |
| Quality | {{PASS/FAIL}} |

**Ready for Next Phase**: {{YES/NO}}

---

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
